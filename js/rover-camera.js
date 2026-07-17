/**
 * GSP.NET — Rover Camera Module
 * Handles live camera access, GPS-triggered auto-capture,
 * EXIF injection, SHA-256 hashing, and IndexedDB storage
 * for Mapillary street-view upload sessions.
 */

var videoStream      = null;
var gpsWatchId       = null;
var isAutoCapturing  = false;
var lastCapturePos   = null;
var captureCount     = 0;
var CAPTURE_DISTANCE_M = 5;
var MAX_CAPTURES       = 30;   // Hard cap — Mapillary upload reliability limit

// IndexedDB store: items stored as { data, hash, lat, lon, ts }
var mapillaryStore = localforage.createInstance({
    name:      'GSPNet',
    storeName: 'mapillary_uploads'
});

var captureMode = 'upload';

// ─────────────────────────────────────────────────────────────
//  Open camera overlay
// ─────────────────────────────────────────────────────────────
window.openRoverCamera = async function(mode) {
    mode = mode || 'upload';
    captureMode = mode;

    const overlay = document.getElementById('rover-camera-overlay');
    if (overlay) overlay.classList.add('active');

    document.getElementById('rover-camera-feed').style.display = 'block';

    const hud = document.querySelector('.rover-hud');
    if (hud) hud.style.display = 'flex';

    // Reset counter display
    _updateCaptureHUD(captureCount);

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not available. Ensure you are using HTTPS or localhost.');
        }

        // Try highest-res environment camera first, fall back gracefully
        try {
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
        } catch (e) {
            console.warn('High-res environment camera failed, falling back.', e);
            try {
                videoStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
            } catch (e2) {
                console.warn('Environment camera failed, using any camera.', e2);
                videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
        }

        const videoEl = document.getElementById('rover-camera-feed');
        videoEl.srcObject = videoStream;

        startGPSWatch();

    } catch (err) {
        console.error('Camera Error:', err);
        if (err.name === 'NotReadableError') {
            alert('Camera is currently in use by another application or tab. Please close them and try again.');
        } else {
            if (window.showToast) window.showToast('Camera access failed. Check permissions and HTTPS.', 'error');
        }
    }
};

// ─────────────────────────────────────────────────────────────
//  Cancel — discard all captured images
// ─────────────────────────────────────────────────────────────
window.cancelRoverCamera = function() {
    if (isAutoCapturing) window.toggleRoverCapture();

    _stopStreams();

    const overlay = document.getElementById('rover-camera-overlay');
    if (overlay) overlay.classList.remove('active');

    mapillaryStore.clear().then(function() {
        captureCount = 0;
        _updateCaptureHUD(0);
    });
};

// ─────────────────────────────────────────────────────────────
//  Close — camera closes immediately; upload fires in background
// ─────────────────────────────────────────────────────────────
window.closeRoverCamera = function() {
    if (isAutoCapturing) window.toggleRoverCapture();

    _stopStreams();

    const overlay = document.getElementById('rover-camera-overlay');
    if (overlay) overlay.classList.remove('active');

    if (captureCount > 0) {
        if (captureMode === 'upload' && window.startMapillaryUploadQueue) {
            // Fire-and-forget — camera is already closed, upload runs in background
            window.startMapillaryUploadQueue();
        } else if (captureMode === 'local' && window.downloadLocalMapillaryQueue) {
            window.downloadLocalMapillaryQueue();
        }
    }
};

// ─────────────────────────────────────────────────────────────
//  Stop camera streams & GPS watcher
// ─────────────────────────────────────────────────────────────
function _stopStreams() {
    if (videoStream) {
        videoStream.getTracks().forEach(function(track) { track.stop(); });
        videoStream = null;
    }
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
}

// ─────────────────────────────────────────────────────────────
//  GPS watcher — triggers auto-capture every CAPTURE_DISTANCE_M
// ─────────────────────────────────────────────────────────────
function startGPSWatch() {
    if (!navigator.geolocation) return;

    gpsWatchId = navigator.geolocation.watchPosition(
        function(position) {
            var lat      = position.coords.latitude;
            var lon      = position.coords.longitude;
            var accuracy = position.coords.accuracy;
            var speed    = position.coords.speed || 0;

            var accEl   = document.getElementById('rover-gps-acc');
            var speedEl = document.getElementById('rover-speed');
            if (accEl)   accEl.innerText   = 'GPS: \u00b1' + accuracy.toFixed(1) + 'm';
            if (speedEl) speedEl.innerText = (speed * 3.6).toFixed(1) + ' km/h';

            if (isAutoCapturing && accuracy < 20) {
                if (!lastCapturePos) {
                    captureAndSaveFrame(position);
                } else {
                    var dist = window.haversineDistance(
                        lastCapturePos.coords.latitude,
                        lastCapturePos.coords.longitude,
                        lat, lon
                    );
                    if (dist >= CAPTURE_DISTANCE_M) {
                        captureAndSaveFrame(position);
                    }
                }
            }
        },
        function(error) { console.error('GPS Error:', error); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
}

// ─────────────────────────────────────────────────────────────
//  Toggle auto-capture START / STOP
// ─────────────────────────────────────────────────────────────
window.toggleRoverCapture = function() {
    isAutoCapturing = !isAutoCapturing;

    var btn = document.getElementById('rover-start-btn');
    if (!btn) return;

    if (isAutoCapturing) {
        btn.classList.add('active');
        btn.innerText        = 'STOP';
        btn.style.background = 'rgba(255, 50, 50, 0.8)';
        lastCapturePos       = null;
    } else {
        isAutoCapturing      = false;
        btn.innerText        = 'START';
        btn.style.background = '';
    }
};

// ─────────────────────────────────────────────────────────────
//  Haversine distance helper (metres)
// ─────────────────────────────────────────────────────────────
window.haversineDistance = function(lat1, lon1, lat2, lon2) {
    var R  = 6371e3;
    var p1 = lat1 * Math.PI / 180;
    var p2 = lat2 * Math.PI / 180;
    var dp = (lat2 - lat1) * Math.PI / 180;
    var dl = (lon2 - lon1) * Math.PI / 180;
    var a  = Math.sin(dp / 2) * Math.sin(dp / 2) +
             Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    var c  = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ─────────────────────────────────────────────────────────────
//  EXIF rational encoding helper
// ─────────────────────────────────────────────────────────────
function toExifRational(decimal) {
    var d = Math.floor(decimal);
    var m = Math.floor((decimal - d) * 60);
    var s = Math.round((decimal - d - m / 60) * 3600 * 100);
    return [[d, 1], [m, 1], [s, 100]];
}

// ─────────────────────────────────────────────────────────────
//  SHA-256 hash — native crypto.subtle, zero library overhead
//  Returns a hex string of the EXIF-tagged JPEG data URL.
// ─────────────────────────────────────────────────────────────
async function sha256Hex(dataUrl) {
    try {
        var b64    = dataUrl.split(',')[1];
        var binary = Uint8Array.from(atob(b64), function(c) { return c.charCodeAt(0); });
        var hashBuf = await crypto.subtle.digest('SHA-256', binary);
        return Array.from(new Uint8Array(hashBuf))
                    .map(function(b) { return b.toString(16).padStart(2, '0'); })
                    .join('');
    } catch (e) {
        console.warn('SHA-256 computation failed (non-fatal):', e);
        return '';
    }
}

// ─────────────────────────────────────────────────────────────
//  HUD counter update — colour-codes as limit approaches
// ─────────────────────────────────────────────────────────────
function _updateCaptureHUD(count) {
    var el = document.getElementById('rover-img-count');
    if (!el) return;

    var remaining = MAX_CAPTURES - count;
    el.innerText = count + ' / ' + MAX_CAPTURES + ' Captures';

    if (count >= MAX_CAPTURES) {
        el.style.color = '#ef4444'; // red — at cap
    } else if (count >= MAX_CAPTURES - 5) {
        el.style.color = '#f97316'; // orange — 5 left
    } else {
        el.style.color = '#05cb63'; // green — normal
    }
}

// ─────────────────────────────────────────────────────────────
//  Core capture function — called by GPS watcher
// ─────────────────────────────────────────────────────────────
async function captureAndSaveFrame(position) {
    // Hard cap guard
    if (captureCount >= MAX_CAPTURES) {
        // Should not reach here, but safety net
        isAutoCapturing = false;
        return;
    }

    lastCapturePos = position;

    var video  = document.getElementById('rover-camera-feed');
    var canvas = document.getElementById('rover-camera-canvas');
    if (!video || !video.videoWidth) return;

    // Draw raw frame to canvas
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    var base64Data = canvas.toDataURL('image/jpeg', 0.95);

    // ── Build GPS EXIF fields ─────────────────────────────────
    var lat    = position.coords.latitude;
    var lon    = position.coords.longitude;
    var latRef = lat >= 0 ? 'N' : 'S';
    var lonRef = lon >= 0 ? 'E' : 'W';
    lat = Math.abs(lat);
    lon = Math.abs(lon);

    var now = new Date();

    var gpsIfd = {};
    gpsIfd[piexif.GPSIFD.GPSLatitudeRef]  = latRef;
    gpsIfd[piexif.GPSIFD.GPSLatitude]     = toExifRational(lat);
    gpsIfd[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
    gpsIfd[piexif.GPSIFD.GPSLongitude]    = toExifRational(lon);

    // Altitude (optional — only if available)
    if (position.coords.altitude !== null && position.coords.altitude !== undefined) {
        var alt = position.coords.altitude;
        gpsIfd[piexif.GPSIFD.GPSAltitudeRef] = alt >= 0 ? 0 : 1;
        gpsIfd[piexif.GPSIFD.GPSAltitude]    = [Math.round(Math.abs(alt) * 100), 100];
    }

    // Heading / direction (optional)
    if (position.coords.heading !== null && position.coords.heading !== undefined && !isNaN(position.coords.heading)) {
        gpsIfd[piexif.GPSIFD.GPSImgDirectionRef] = 'T';
        gpsIfd[piexif.GPSIFD.GPSImgDirection]    = [Math.round(position.coords.heading * 100), 100];
    }

    // ── GPS timestamp (REQUIRED by Mapillary for sequence ordering) ──
    gpsIfd[piexif.GPSIFD.GPSDateStamp] =
        now.getUTCFullYear() + ':' +
        String(now.getUTCMonth() + 1).padStart(2, '0') + ':' +
        String(now.getUTCDate()).padStart(2, '0');

    gpsIfd[piexif.GPSIFD.GPSTimeStamp] = [
        [now.getUTCHours(),   1],
        [now.getUTCMinutes(), 1],
        [now.getUTCSeconds(), 1],
    ];

    // ── EXIF / DateTimeOriginal ───────────────────────────────
    var dateTimeStr = now.getUTCFullYear() + ':' +
        String(now.getUTCMonth() + 1).padStart(2, '0') + ':' +
        String(now.getUTCDate()).padStart(2, '0') + ' ' +
        String(now.getUTCHours()).padStart(2, '0') + ':' +
        String(now.getUTCMinutes()).padStart(2, '0') + ':' +
        String(now.getUTCSeconds()).padStart(2, '0');

    var exifIfd = {};
    exifIfd[piexif.ExifIFD.DateTimeOriginal] = dateTimeStr;

    var exifObj   = { '0th': {}, 'Exif': exifIfd, 'GPS': gpsIfd };
    var exifBytes = piexif.dump(exifObj);

    // Insert EXIF into JPEG
    var taggedBase64 = piexif.insert(exifBytes, base64Data);

    // ── SHA-256 hash of the final tagged image ────────────────
    var imageHash = await sha256Hex(taggedBase64);

    // ── Persist to IndexedDB ──────────────────────────────────
    var timestamp = now.toISOString().replace(/[:.]/g, '-');
    var filename  = 'mly_capture_' + timestamp + '.jpg';

    try {
        await mapillaryStore.setItem(filename, {
            data:  taggedBase64,
            hash:  imageHash,
            lat:   position.coords.latitude,
            lon:   position.coords.longitude,
            ts:    now.toISOString(),
        });

        captureCount++;
        _updateCaptureHUD(captureCount);

        // Visual flash on reticle
        var reticle = document.querySelector('.reticle-box');
        if (reticle) {
            reticle.style.borderColor = 'white';
            setTimeout(function() { reticle.style.borderColor = 'rgba(5, 203, 99, 0.3)'; }, 150);
        }

        // ── Auto-stop at 30-image cap ─────────────────────────
        if (captureCount >= MAX_CAPTURES) {
            isAutoCapturing = false;
            var btn = document.getElementById('rover-start-btn');
            if (btn) {
                btn.innerText        = 'START';
                btn.style.background = '';
                btn.classList.remove('active');
            }
            if (window.showToast) {
                window.showToast(
                    '\u26a0\ufe0f 30-image cap reached. Press CLOSE to upload this session, then start a new one for more coverage.',
                    'info',
                    10000
                );
            }
        }

    } catch (err) {
        console.error('Failed to save frame to IndexedDB:', err);
    }
}
