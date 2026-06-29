import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { deserialize } from "flatgeobuf/lib/mjs/geojson.js";
import WebSocket from 'ws';

// 1. Setup Environment
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT, 
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = process.env.CLOUDFLARE_R2_BUCKET;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  }
);

// Helper functions to aggressively find attributes despite schema mismatches
const findProp = (props, possibleKeys) => {
    const keys = Object.keys(props);
    for (const pk of possibleKeys) {
        const match = keys.find(k => k.toLowerCase().replace(/[\s_]/g, '') === pk.toLowerCase().replace(/[\s_]/g, ''));
        if (match && props[match]) return props[match].toString().trim();
    }
    return null;
};

const getPlot = (props) => findProp(props, ['plot', 'plotnumber', 'lotnumber', 'lot']);
const getBlock = (props) => findProp(props, ['block', 'blocknumber']);
const getParcelId = (props) => findProp(props, ['parcelid', 'nlisid', 'uniqueid']);
const getDistrict = (props) => findProp(props, ['district']);
const getSubcounty = (props) => findProp(props, ['subcounty', 'county']);
const getParish = (props) => findProp(props, ['parish']);

// Build search text by concatenating all useful fields
const buildSearchText = (props) => {
    const parts = [];
    const keys = Object.keys(props);
    for (const k of keys) {
        const keyLower = k.toLowerCase();
        if (
            keyLower.includes('plot') ||
            keyLower.includes('block') ||
            keyLower.includes('parcel') ||
            keyLower.includes('lot') ||
            keyLower.includes('nlis') ||
            keyLower.includes('name') ||
            keyLower.includes('label') ||
            keyLower.includes('district') ||
            keyLower.includes('county') ||
            keyLower.includes('parish')
        ) {
            if (props[k]) parts.push(props[k].toString().trim());
        }
    }
    // De-duplicate array
    return [...new Set(parts)].join(' ');
};

async function processLayer(fileKey) {
  console.log(`\nProcessing layer: ${fileKey}`);
  
  const getObjCmd = new GetObjectCommand({ Bucket: bucketName, Key: fileKey });
  const signedUrl = await getSignedUrl(s3, getObjCmd, { expiresIn: 3600 });

  console.log(`Downloading and parsing ${fileKey}...`);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`Failed to fetch ${fileKey}: ${response.statusText}`);

  const filename = fileKey.split('/').pop();
  let featureType = 'unknown';
  if (filename.toLowerCase().includes('nlis') || filename.toLowerCase().includes('plot') || filename.toLowerCase().includes('parcel')) {
      featureType = 'parcel';
  } else if (filename.toLowerCase().includes('block')) {
      featureType = 'block';
  } else if (filename.toLowerCase().includes('road')) {
      featureType = 'road';
  }
  
  const iter = deserialize(response.body);
  const batchSize = 1000;
  let batch = [];
  let count = 0;

  for await (const feature of iter) {
    const props = feature.properties || {};
    const geom = feature.geometry;
    
    // Calculate simple BBox and Centroid
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    const calculateBounds = (coords) => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number') {
            minX = Math.min(minX, coords[0]);
            minY = Math.min(minY, coords[1]);
            maxX = Math.max(maxX, coords[0]);
            maxY = Math.max(maxY, coords[1]);
        } else {
            for (const c of coords) calculateBounds(c);
        }
    };
    
    if (geom && geom.coordinates) {
        calculateBounds(geom.coordinates);
    }
    
    // Default to 0 if geometry is missing/invalid
    if (minX === Infinity) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
    
    const centroidX = (minX + maxX) / 2;
    const centroidY = (minY + maxY) / 2;

    const searchText = buildSearchText(props).replace(/\s+/g, ' ');
    
    const block = getBlock(props);
    const plot = getPlot(props);
    const parcelId = getParcelId(props);
    
    const featureId = parcelId || props.id || `${filename}_feat_${count}`;

    batch.push({
      layer_name: filename,
      feature_type: featureType,
      feature_id: featureId.toString(),
      block: block,
      plot: plot,
      parcel_id: parcelId,
      district: getDistrict(props),
      subcounty: getSubcounty(props),
      parish: getParish(props),
      search_text: searchText,
      centroid_x: centroidX,
      centroid_y: centroidY,
      bbox_xmin: minX,
      bbox_ymin: minY,
      bbox_xmax: maxX,
      bbox_ymax: maxY
    });

    count++;

    // Upload in batches of 1000
    if (batch.length >= batchSize) {
      await uploadBatch(batch, filename);
      batch = [];
    }
  }

  // Upload remaining features
  if (batch.length > 0) {
    await uploadBatch(batch, filename);
  }

  console.log(`Finished ${fileKey}. Total features indexed: ${count}`);
}

async function uploadBatch(batch, layerName) {
    // Upsert into supabase using the unique constraint (layer_name, feature_id)
    const { error } = await supabase
        .from('parcel_index')
        .upsert(batch, { onConflict: 'layer_name, feature_id' });
        
    if (error) {
        console.error(`Error uploading batch for ${layerName}:`, error.message);
    } else {
        console.log(`Uploaded batch of ${batch.length} records...`);
    }
}

async function run() {
  console.log("Starting FGB Indexer...");
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    const { Contents } = await s3.send(command);
    
    if (!Contents || Contents.length === 0) {
      console.log("No files found in bucket.");
      return;
    }

    const fgbFiles = Contents.filter(item => item.Key.endsWith('.fgb'));
    console.log(`Found ${fgbFiles.length} .fgb files in bucket ${bucketName}.`);

    for (const file of fgbFiles) {
      await processLayer(file.Key);
    }
    console.log("\nIndexing Complete!");
    
  } catch (err) {
    console.error("Error during indexing:", err);
    process.exit(1);
  }
}

run();
