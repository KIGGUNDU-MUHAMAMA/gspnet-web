var videoStream = null;
var gpsWatchId = null;
var isAutoCapturing = false;
var lastCapturePos = null;
var captureCount = 0;
var CAPTURE_DISTANCE_M = 5;

// Initialize IndexedDB store for robust local storage
var mapillaryStore = localforage.createInstance({
    name: 'GSPNet',
    storeName: 'mapillary_uploads'
});

var captureMode = 'upload';

window.openRoverCamera = async function() {
    const overlay = document.getElementById('rover-camera-overlay');
    if (overlay) overlay.classList.add('active');

    // Show prompt, hide video and HUD
    document.getElementById('rover-camera-prompt').style.display = 'flex';
    document.getElementById('rover-camera-feed').style.display = 'none';
    const hud = document.querySelector('.rover-hud');
    if (hud) hud.style.display = 'none';
};

window.selectRoverMode = async function(mode) {
    captureMode = mode;
    document.getElementById('rover-camera-prompt').style.display = 'none';
    document.getElementById('rover-camera-feed').style.display = 'block';
    
    const hud = document.querySelector('.rover-hud');
    if (hud) hud.style.display = 'flex';

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not available. Ensure you are using HTTPS or localhost.');
        }

        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        
        const videoEl = document.getElementById('rover-camera-feed');
        videoEl.srcObject = videoStream;

        startGPSWatch();
        
    } catch (err) {
        console.error('Camera Error:', err);
        if (window.showToast) window.showToast('Camera access failed. Check permissions and HTTPS.', 'error');
    }
};

window.closeRoverCamera = function() {
    if (isAutoCapturing) window.toggleRoverCapture();
    
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    
    const overlay = document.getElementById('rover-camera-overlay');
    if (overlay) overlay.classList.remove('active');
    
    if (captureCount > 0) {
        if (captureMode === 'upload' && window.startMapillaryUploadQueue) {
            window.startMapillaryUploadQueue();
        } else if (captureMode === 'local' && window.downloadLocalMapillaryQueue) {
            window.downloadLocalMapillaryQueue();
        }
    }
};

function startGPSWatch() {
    if (!navigator.geolocation) return;
    
    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            const speed = position.coords.speed || 0;
            
            document.getElementById('rover-gps-acc').innerText = `GPS: ±${accuracy.toFixed(1)}m`;
            document.getElementById('rover-speed').innerText = `${(speed * 3.6).toFixed(1)} km/h`;
            
            if (isAutoCapturing && accuracy < 20) {
                if (!lastCapturePos) {
                    captureAndSaveFrame(position);
                } else {
                    var dist = window.haversineDistance(
                        lastCapturePos.coords.latitude, 
                        lastCapturePos.coords.longitude,
                        position.coords.latitude, 
                        position.coords.longitude
                    );
                    if (dist >= CAPTURE_DISTANCE_M) {
                        captureAndSaveFrame(position);
                    }
                }
            }
        },
        (error) => console.error('GPS Error:', error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
}

window.toggleRoverCapture = function() {
    isAutoCapturing = !isAutoCapturing;
    const btn = document.getElementById('rover-start-btn');
    if (isAutoCapturing) {
        btn.classList.add('active');
        btn.innerText = 'STOP AUTO-CAPTURE';
        lastCapturePos = null; 
    } else {
        btn.classList.remove('active');
        btn.innerText = 'START AUTO-CAPTURE';
    }
};

window.haversineDistance = function(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // metres
    var p1 = lat1 * Math.PI/180;
    var p2 = lat2 * Math.PI/180;
    var dp = (lat2-lat1) * Math.PI/180;
    var dl = (lon2-lon1) * Math.PI/180;

    var a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

function toExifRational(decimal) {
    const d = Math.floor(decimal);
    const m = Math.floor((decimal - d) * 60);
    const s = Math.round((decimal - d - m/60) * 3600 * 100);
    return [[d, 1], [m, 1], [s, 100]];
}

async function captureAndSaveFrame(position) {
    lastCapturePos = position;
    
    const video = document.getElementById('rover-camera-feed');
    const canvas = document.getElementById('rover-camera-canvas');
    if (!video || !video.videoWidth) return;
    
    // Draw raw frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Data = canvas.toDataURL('image/jpeg', 0.95);
    
    // Mapillary strictly requires EXIF coordinates & timestamp embedded in JPEG
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;
    const latRef = lat >= 0 ? "N" : "S";
    const lonRef = lon >= 0 ? "E" : "W";
    lat = Math.abs(lat);
    lon = Math.abs(lon);
    
    const gpsIfd = {};
    gpsIfd[piexif.GPSIFD.GPSLatitudeRef] = latRef;
    gpsIfd[piexif.GPSIFD.GPSLatitude] = toExifRational(lat);
    gpsIfd[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
    gpsIfd[piexif.GPSIFD.GPSLongitude] = toExifRational(lon);
    
    if (position.coords.altitude !== null) {
        let alt = position.coords.altitude;
        gpsIfd[piexif.GPSIFD.GPSAltitudeRef] = alt >= 0 ? 0 : 1;
        gpsIfd[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(alt) * 100), 100];
    }
    
    if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
        gpsIfd[piexif.GPSIFD.GPSImgDirectionRef] = "T";
        gpsIfd[piexif.GPSIFD.GPSImgDirection] = [Math.round(position.coords.heading * 100), 100];
    }
    
    const now = new Date();
    const dateTimeStr = now.toISOString().replace(/-/g, ':').replace('T', ' ').substring(0, 19);
    const exifIfd = {};
    exifIfd[piexif.ExifIFD.DateTimeOriginal] = dateTimeStr;
    
    const exifObj = { "0th": {}, "Exif": exifIfd, "GPS": gpsIfd };
    const exifBytes = piexif.dump(exifObj);
    
    // Inject binary EXIF chunk into JPEG string
    const taggedBase64 = piexif.insert(exifBytes, base64Data);
    
    // Save locally
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `mly_capture_${timestamp}.jpg`;
    
    try {
        await mapillaryStore.setItem(filename, taggedBase64);
        captureCount++;
        document.getElementById('rover-img-count').innerText = `${captureCount} Captures`;
        
        // Visual flash feedback
        const reticle = document.querySelector('.reticle-box');
        reticle.style.borderColor = 'white';
        setTimeout(() => reticle.style.borderColor = 'rgba(5, 203, 99, 0.3)', 150);
        
    } catch (err) {
        console.error('Failed to save frame to IndexedDB', err);
    }
}
