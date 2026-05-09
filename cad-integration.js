(function(){
'use strict';
var SB_URL='https://kwssgfanbntfjdclchfi.supabase.co';
var UCRS={'EPSG:4326':'+proj=longlat +datum=WGS84 +no_defs','EPSG:32635':'+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs','EPSG:32636':'+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs','EPSG:32735':'+proj=utm +zone=35 +south +datum=WGS84 +units=m +no_defs','EPSG:32736':'+proj=utm +zone=36 +south +datum=WGS84 +units=m +no_defs','EPSG:21095':'+proj=utm +zone=35 +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs','EPSG:21096':'+proj=utm +zone=36 +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs','EPSG:21036':'+proj=utm +zone=36 +south +a=6378249.145 +rf=293.465 +towgs84=-160,-6,-302,0,0,0,0 +units=m +no_defs'};
var S={file:null,text:null,crs:'EPSG:32636',overlayLayer:null,overlaySource:null,tracedSource:null,tracedLayer:null,snapInteraction:null,drawInteraction:null,tracedFeatures:[],snapEnabled:true};

function regProj(){if(typeof proj4==='undefined')return;Object.keys(UCRS).forEach(function(k){try{proj4.defs(k,UCRS[k]);}catch(e){}});if(window.ol&&ol.proj&&ol.proj.proj4&&ol.proj.proj4.register)ol.proj.proj4.register(proj4);}

function parseDXF(txt){var feats=[],lines=txt.split(/\r?\n/),i=0;
function nx(){return(lines[i++]||'').trim();}
while(i<lines.length-1){var c=parseInt(nx(),10),v=nx();if(c===0){if(v==='LINE')pushLine(lines,i,feats);else if(v==='LWPOLYLINE')pushLW(lines,i,feats);else if(v==='POLYLINE')pushPL(lines,i,feats);}}return feats;}
function pushLine(l,s,out){var o={};for(var j=s;j<s+24&&j<l.length;j+=2){var c=parseInt((l[j]||'').trim(),10),v=parseFloat((l[j+1]||'').trim());if(c===10)o.x1=v;else if(c===20)o.y1=v;else if(c===11)o.x2=v;else if(c===21)o.y2=v;else if(c===0)break;}if(o.x1!=null)out.push({type:'LineString',coordinates:[[o.x1,o.y1],[o.x2,o.y2]]});}
function pushLW(l,s,out){var pts=[],x=null,closed=false;for(var j=s;j<s+4000&&j<l.length;j+=2){var c=parseInt((l[j]||'').trim(),10),v=parseFloat((l[j+1]||'').trim());if(c===70)closed=!!(v&1);else if(c===10)x=v;else if(c===20&&x!=null){pts.push([x,v]);x=null;}else if(c===0)break;}if(pts.length<2)return;if(closed&&pts.length>=3)out.push({type:'Polygon',coordinates:[[].concat(pts,[pts[0]])]});else out.push({type:'LineString',coordinates:pts});}
function pushPL(l,s,out){var pts=[],x=null;for(var j=s;j<s+8000&&j<l.length;j+=2){var c=parseInt((l[j]||'').trim(),10),v=parseFloat((l[j+1]||'').trim());if(c===10)x=v;else if(c===20&&x!=null){pts.push([x,v]);x=null;}else if(c===0&&(l[j+1]||'').trim()==='SEQEND')break;}if(pts.length>=2)out.push({type:'LineString',coordinates:pts});}

function projCoord(xy,crs){if(crs==='EPSG:3857')return xy;return proj4(crs,'EPSG:3857',xy);}
function projGeom(g,crs){if(g.type==='LineString')return{type:'LineString',coordinates:g.coordinates.map(function(c){return projCoord(c,crs);})};if(g.type==='Polygon')return{type:'Polygon',coordinates:g.coordinates.map(function(r){return r.map(function(c){return projCoord(c,crs);});})};return null;}
function buildLayer(feats){var fmt=new ol.format.GeoJSON(),src=new ol.source.Vector({features:fmt.readFeatures({type:'FeatureCollection',features:feats})});var lyr=new ol.layer.Vector({source:src,style:new ol.style.Style({stroke:new ol.style.Stroke({color:'#00e5ff',width:1.5}),fill:new ol.style.Fill({color:'rgba(0,229,255,0.03)'})}),zIndex:999});lyr.set('id','dxf-overlay');return{layer:lyr,source:src};}

function removeDXF(){var m=window.map;if(!m)return;if(S.overlayLayer){m.removeLayer(S.overlayLayer);S.overlayLayer=null;S.overlaySource=null;}if(S.tracedLayer){m.removeLayer(S.tracedLayer);S.tracedLayer=null;S.tracedSource=null;}if(S.snapInteraction){m.removeInteraction(S.snapInteraction);S.snapInteraction=null;}if(S.drawInteraction){m.removeInteraction(S.drawInteraction);S.drawInteraction=null;}S.tracedFeatures=[];var b=document.getElementById('dxfOverlayBadge');if(b)b.classList.remove('is-visible');var t=document.getElementById('dxf-digitize-toolbar');if(t)t.style.display='none';setFn('No file selected');setStatus('','');}
function setStatus(msg,type){['dxf-panel-status','dxf-digitize-status'].forEach(function(id){var el=document.getElementById(id);if(!el)return;el.textContent=msg;el.style.color=type==='error'?'#f87171':type==='success'?'#4ade80':'#94a3b8';});}
function setFn(t){var el=document.getElementById('dxf-panel-filename');if(el)el.textContent=t;}

function renderDXF(text,crs,name){var m=window.map;if(!m)return;removeDXF();var raw;try{raw=parseDXF(text);}catch(e){setStatus('Parse error: '+e.message,'error');return;}if(!raw.length){setStatus('No geometry found in DXF.','error');return;}var feats=[];raw.forEach(function(g){try{var p=projGeom(g,crs);if(p)feats.push({type:'Feature',geometry:p,properties:{}});}catch(e){}});if(!feats.length){setStatus('Projection failed. Check CRS.','error');return;}var res=buildLayer(feats);S.overlayLayer=res.layer;S.overlaySource=res.source;m.addLayer(res.layer);var ext=res.source.getExtent();if(ext&&isFinite(ext[0])){var w=ext[2]-ext[0],h=ext[3]-ext[1],pad=Math.max(w,h)*0.12;m.getView().fit([ext[0]-pad,ext[1]-pad,ext[2]+pad,ext[3]+pad],{duration:600,maxZoom:20});}var snap=new ol.interaction.Snap({source:res.source,pixelTolerance:16});S.snapInteraction=snap;m.addInteraction(snap);var badge=document.getElementById('dxfOverlayBadge');if(badge){document.getElementById('dxfOverlayBadgeText').textContent=(name||'DXF')+' \u2014 '+feats.length+' entities';badge.classList.add('is-visible');}var tb=document.getElementById('dxf-digitize-toolbar');if(tb)tb.style.display='block';var ip=document.getElementById('dxf-panel-inspect-btn');if(ip)ip.style.display='block';setFn(name||'drawing.dxf');setStatus('\u2713 '+feats.length+' entities on map.','success');}

/* CAD Inspector
   Strategy: upload dropped File to uploads/dxf/ or uploads/drawings/, get public URL, open ShareCAD.
   If called with a string URL (already public), skip upload. */
async function openCAD(name,fileOrUrl){
  var panel=document.getElementById('cadInspectorPanel');
  var frame=document.getElementById('cadInspectorFrame');
  var loading=document.getElementById('cadInspectorLoading');
  var fnEl=document.getElementById('cadInspectorFilename');
  var statusEl=document.getElementById('cadInspectorStatus');
  var msgEl=document.getElementById('cadInspectorLoadingMsg');
  if(!panel)return;
  if(fnEl)fnEl.textContent=name||'--';
  if(statusEl)statusEl.textContent='Preparing...';
  if(loading)loading.style.display='flex';
  if(msgEl)msgEl.textContent='';
  if(frame)frame.src='about:blank';
  panel.classList.add('is-open');

  var publicUrl=null;

  // Already a public URL string
  if(typeof fileOrUrl==='string'&&fileOrUrl.startsWith('http')){
    publicUrl=fileOrUrl;
  } else if(fileOrUrl instanceof File){
    // Upload to Supabase storage under correct folder
    if(statusEl)statusEl.textContent='Uploading...';
    if(msgEl)msgEl.textContent='Uploading file to secure storage...';
    try{
      var sb=window.supabase;
      if(!sb)throw new Error('Supabase client not found');
      var ext=(name||'').split('.').pop().toLowerCase();
      var folder=ext==='dwg'?'drawings':'dxf';
      var uid='anon';
      try{var ud=await sb.auth.getUser();uid=(ud.data.user||{}).id||'anon';}catch(e){}
      var path=folder+'/'+Date.now()+'_'+name;
      var up=await sb.storage.from('uploads').upload(path,fileOrUrl,{upsert:true,contentType:'application/octet-stream'});
      if(up.error)throw up.error;
      var pu=sb.storage.from('uploads').getPublicUrl(path);
      publicUrl=(pu.data||{}).publicUrl||null;
    }catch(e){
      console.warn('[CAD] upload err',e);
      if(msgEl)msgEl.innerHTML='<strong style="color:#f87171">Upload failed:</strong> '+e.message+'<br><br>Ensure Supabase bucket "uploads" exists and is public.';
      if(statusEl)statusEl.textContent='Failed';
      return;
    }
  }

  if(!publicUrl){
    if(msgEl)msgEl.textContent='Could not get a public URL for this file.';
    if(statusEl)statusEl.textContent='Error';
    return;
  }

  // Open in ShareCAD
  if(statusEl)statusEl.textContent='Loading viewer...';
  if(msgEl)msgEl.textContent='Connecting to CAD engine...';
  var viewerUrl='https://sharecad.org/cadframe/load?url='+encodeURIComponent(publicUrl);
  if(frame){
    frame.src=viewerUrl;
    frame.onload=function(){if(loading)loading.style.display='none';if(statusEl)statusEl.textContent='Ready';};
  }
}

/* Drag-and-drop: attach to map-container (parent of #map) to avoid OL's
   ol-viewport canvas swallowing events. We listen on dragover/drop at the
   .map-container level with a visual overlay so the user sees feedback. */
function initDrop(){
  // Create a full-map drop overlay that appears on drag-enter
  var overlay=document.createElement('div');
  overlay.id='cad-drop-overlay';
  overlay.innerHTML='<div style="text-align:center;"><i class="fas fa-drafting-compass" style="font-size:48px;color:#818cf8;margin-bottom:16px;display:block;"></i><p style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0;">Drop DXF or DWG file here</p></div>';
  overlay.style.cssText='display:none;position:absolute;inset:0;z-index:5000;background:rgba(15,23,42,0.82);backdrop-filter:blur(3px);align-items:center;justify-content:center;pointer-events:none;border:3px dashed #6366f1;border-radius:8px;';
  var mc=document.querySelector('.map-container');
  if(mc){mc.style.position='relative';mc.appendChild(overlay);}

  var dragCount=0;

  document.addEventListener('dragenter',function(e){
    if(!hasCADFile(e))return;
    var mc2=document.querySelector('.map-container');
    if(mc2&&mc2.contains(e.target)){
      dragCount++;
      overlay.style.display='flex';
    }
  },true);
  document.addEventListener('dragleave',function(e){
    if(!hasCADFile(e))return;
    var mc2=document.querySelector('.map-container');
    if(mc2&&mc2.contains(e.target)){
      dragCount--;
      if(dragCount<=0){dragCount=0;overlay.style.display='none';}
    }
  },true);
  document.addEventListener('dragover',function(e){
    var mc2=document.querySelector('.map-container');
    if(mc2&&mc2.contains(e.target)){e.preventDefault();e.stopPropagation();}
  },true);
  document.addEventListener('drop',function(e){
    var mc2=document.querySelector('.map-container');
    if(!mc2||!mc2.contains(e.target))return;
    e.preventDefault();e.stopPropagation();
    dragCount=0;overlay.style.display='none';
    var f=getCADFile(e);
    if(!f)return;
    var ext=f.name.split('.').pop().toLowerCase();
    S.file=f;
    if(ext==='dxf'){document.getElementById('dxfDropModalFilename').textContent=f.name;document.getElementById('dxfDropModal').classList.add('is-open');}
    else if(ext==='dwg'){document.getElementById('dwgDropModalFilename').textContent=f.name;document.getElementById('dwgDropModal').classList.add('is-open');}
  },true);
}
function hasCADFile(e){var dt=e.dataTransfer;if(!dt||!dt.items)return false;for(var i=0;i<dt.items.length;i++){if(dt.items[i].kind==='file')return true;}return false;}
function getCADFile(e){var dt=e.dataTransfer;if(!dt||!dt.files||!dt.files.length)return null;var f=dt.files[0];var ext=f.name.split('.').pop().toLowerCase();return(ext==='dxf'||ext==='dwg')?f:null;}

/* Save traced polygons via polygon-creator edge function (same as CSV) */
async function saveTraced(layerName){
  if(!S.tracedFeatures.length){setStatus('No polygon to save.','error');return;}
  setStatus('Saving to '+layerName+'...','');
  var fmt=new ol.format.GeoJSON();
  var parcels=S.tracedFeatures.map(function(feat,idx){
    var gj=fmt.writeFeatureObject(feat,{featureProjection:'EPSG:3857',dataProjection:'EPSG:4326'});
    var ring=(gj.geometry&&gj.geometry.coordinates&&gj.geometry.coordinates[0])||[];
    var a=0;for(var i=0;i<ring.length-1;i++)a+=(ring[i][0]*ring[i+1][1])-(ring[i+1][0]*ring[i][1]);
    var areaHa=Math.abs(a/2)*1e-10;
    return{parcelId:'DXF-'+(idx+1),geometry:gj.geometry,area_hectares:areaHa,num_vertices:ring.length};
  });
  try{
    var sb=window.supabase;if(!sb)throw new Error('Supabase not available');
    var sess=await sb.auth.getSession();
    var token=(sess.data.session||{}).access_token||window.supabaseKey||'';
    var key=window.supabaseKey||'';
    var formData={client:(document.getElementById('polygonClient')||{}).value||'DXF Import',projectName:(document.getElementById('polygonProjectName')||{}).value||'DXF Traced',coordinateSystem:S.crs,district:(document.getElementById('polygonDistrict')||{}).value||'',surveyor:(document.getElementById('polygonSurveyor')||{}).value||'',supervisor:(document.getElementById('polygonSupervisor')||{}).value||''};
    var body=JSON.stringify({action:'commit_batch',layerName:layerName,csvFileId:null,formData:formData,parcels:parcels});
    var resp=await fetch(SB_URL+'/functions/v1/polygon-creator',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'apikey':key},body:body});
    var res=JSON.parse(await resp.text());
    if(res.savedCount)setStatus('\u2713 Saved '+res.savedCount+' polygon(s) to '+layerName,'success');
    else setStatus('Saved (check console)','success');
    if(typeof refreshPolygonLayers==='function')refreshPolygonLayers();
  }catch(e){setStatus('Save failed: '+e.message,'error');console.error('[DXF save]',e);}
}

function initDXFModal(){
  var m=document.getElementById('dxfDropModal');if(!m)return;
  document.getElementById('dxfDropModalClose').addEventListener('click',function(){m.classList.remove('is-open');});
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('is-open');});
  document.getElementById('dxfDropPreviewBtn').addEventListener('click',function(){
    var crs=document.getElementById('dxfDropCrsSelect').value;if(!crs){alert('Select a coordinate system.');return;}
    m.classList.remove('is-open');readAct(S.file,crs,'preview');});
  document.getElementById('dxfDropUpdateBtn').addEventListener('click',function(){
    var crs=document.getElementById('dxfDropCrsSelect').value;if(!crs){alert('Select a coordinate system.');return;}
    m.classList.remove('is-open');readAct(S.file,crs,'update');});
  document.getElementById('dxfDropInspectBtn').addEventListener('click',function(){m.classList.remove('is-open');openCAD(S.file.name,S.file);});}

function initDWGModal(){
  var m=document.getElementById('dwgDropModal');if(!m)return;
  document.getElementById('dwgDropModalClose').addEventListener('click',function(){m.classList.remove('is-open');});
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('is-open');});
  document.getElementById('dwgDropOpenBtn').addEventListener('click',function(){m.classList.remove('is-open');openCAD(S.file.name,S.file);});}

function initCADClose(){
  var b=document.getElementById('cadInspectorClose');
  if(b)b.addEventListener('click',function(){var p=document.getElementById('cadInspectorPanel');if(p)p.classList.remove('is-open');var f=document.getElementById('cadInspectorFrame');if(f)f.src='about:blank';});}

function initBadge(){var b=document.getElementById('dxfOverlayBadgeClear');if(b)b.addEventListener('click',removeDXF);}

function initToolbar(){
  var snapBtn=document.getElementById('dxf-snap-toggle');
  if(snapBtn)snapBtn.addEventListener('click',function(){
    S.snapEnabled=!S.snapEnabled;var m=window.map;
    if(m&&S.snapInteraction){if(S.snapEnabled)m.addInteraction(S.snapInteraction);else m.removeInteraction(S.snapInteraction);}
    snapBtn.innerHTML='<i class="fas fa-magnet"></i> Snap: '+(S.snapEnabled?'ON':'OFF');
    snapBtn.style.borderColor=S.snapEnabled?'#22c55e':'#475569';});

  var traceBtn=document.getElementById('dxf-trace-btn');
  if(traceBtn)traceBtn.addEventListener('click',function(){
    var m=window.map;if(!m)return;
    if(S.drawInteraction){m.removeInteraction(S.drawInteraction);S.drawInteraction=null;}
    if(!S.overlaySource){setStatus('Load a DXF first.','error');return;}
    if(!S.tracedSource){
      S.tracedSource=new ol.source.Vector();
      S.tracedLayer=new ol.layer.Vector({source:S.tracedSource,style:new ol.style.Style({stroke:new ol.style.Stroke({color:'#facc15',width:2.5}),fill:new ol.style.Fill({color:'rgba(250,204,21,0.06)'})}),zIndex:1000});
      m.addLayer(S.tracedLayer);}
    var draw=new ol.interaction.Draw({source:S.tracedSource,type:'Polygon'});
    draw.on('drawend',function(evt){
      S.tracedFeatures.push(evt.feature);
      var sb2=document.getElementById('dxf-save-traced-btn');if(sb2)sb2.disabled=false;
      setStatus('Polygon traced. Click Save or trace another.','success');
      traceBtn.style.background='#1d4ed8';});
    draw.on('drawstart',function(){traceBtn.style.background='#7c3aed';});
    S.drawInteraction=draw;m.addInteraction(draw);
    setStatus('Click corners to trace. Double-click to finish.','');});

  var clrBtn=document.getElementById('dxf-clear-trace-btn');
  if(clrBtn)clrBtn.addEventListener('click',function(){
    var m=window.map;
    if(m&&S.drawInteraction){m.removeInteraction(S.drawInteraction);S.drawInteraction=null;}
    if(S.tracedSource)S.tracedSource.clear();
    S.tracedFeatures=[];
    var sb2=document.getElementById('dxf-save-traced-btn');if(sb2)sb2.disabled=true;
    setStatus('Drawing cleared.','');});

  var saveBtn=document.getElementById('dxf-save-traced-btn');
  if(saveBtn)saveBtn.addEventListener('click',function(){
    var r=document.querySelector('input[name="polygonLayer"]:checked');
    if(!r){setStatus('Select a target layer first.','error');return;}
    saveTraced(r.value);});

  var remBtn=document.getElementById('dxf-remove-overlay-btn');
  if(remBtn)remBtn.addEventListener('click',removeDXF);

  var insBtn=document.getElementById('dxf-panel-inspect-btn');
  if(insBtn)insBtn.addEventListener('click',function(){if(S.file)openCAD(S.file.name,S.file);});}

function initPanel(){
  var br=document.getElementById('dxf-panel-browse-btn'),fi=document.getElementById('dxf-panel-file-input'),da=document.getElementById('dxf-panel-drop-area');
  if(br&&fi){br.addEventListener('click',function(){fi.click();});fi.addEventListener('change',function(){if(this.files[0])handleFile(this.files[0]);});}
  if(da){
    da.addEventListener('dragover',function(e){e.preventDefault();da.style.borderColor='#818cf8';});
    da.addEventListener('dragleave',function(){da.style.borderColor='#6366f1';});
    da.addEventListener('drop',function(e){e.preventDefault();da.style.borderColor='#6366f1';if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});}

  // Sub-tab switcher
  var ct=document.getElementById('importSubTabCsv'),dt=document.getElementById('importSubTabDxf'),cp=document.getElementById('importPanelCsv'),dp=document.getElementById('importPanelDxf');
  if(ct&&dt&&cp&&dp){
    ct.addEventListener('click',function(){cp.style.display='block';dp.style.display='none';ct.style.cssText='flex:1;padding:9px 0;background:#3b82f6;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px 0 0 6px;';dt.style.cssText='flex:1;padding:9px 0;background:#f3f4f6;color:#374151;border:none;border-left:1px solid #d1d5db;font-size:13px;font-weight:600;cursor:pointer;border-radius:0 6px 6px 0;';});
    dt.addEventListener('click',function(){dp.style.display='block';cp.style.display='none';dt.style.cssText='flex:1;padding:9px 0;background:#6366f1;color:#fff;border:none;border-left:1px solid #d1d5db;font-size:13px;font-weight:600;cursor:pointer;border-radius:0 6px 6px 0;';ct.style.cssText='flex:1;padding:9px 0;background:#f3f4f6;color:#374151;border:none;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px 0 0 6px;';});}}

function handleFile(f){
  if(!f)return;
  var ext=f.name.split('.').pop().toLowerCase();
  if(ext!=='dxf'){setStatus('Only .dxf files are supported here.','error');return;}
  S.file=f;setFn(f.name);setStatus('Reading...','');
  var crsEl=document.getElementById('polygon-crs-confirm'),crs=(crsEl&&crsEl.value)||'EPSG:32636';
  var r=new FileReader();
  r.onload=function(ev){S.text=ev.target.result;S.crs=crs;renderDXF(S.text,crs,f.name);};
  r.readAsText(f);}

function readAct(f,crs,act){
  var r=new FileReader();
  r.onload=function(ev){
    S.text=ev.target.result;S.crs=crs;
    if(act==='preview')renderDXF(S.text,crs,f.name);
    else if(act==='update'){renderDXF(S.text,crs,f.name);setTimeout(function(){var dt=document.getElementById('importSubTabDxf');if(dt)dt.click();},400);}
    else if(act==='inspect')openCAD(f.name,f);};
  r.readAsText(f);}

// Expose openCAD globally so other parts of app can call it with a public URL
window.openCadInspector=openCAD;

function init(){regProj();initDrop();initDXFModal();initDWGModal();initCADClose();initBadge();initToolbar();initPanel();console.log('[GSPNET CAD] ready v2.');}
function boot(){if(typeof window.map!=='undefined'&&window.map)init();else setTimeout(boot,500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();