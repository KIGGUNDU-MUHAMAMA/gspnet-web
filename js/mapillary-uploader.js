/**
 * GSP.NET — Mapillary Upload Engine
 *
 * Non-blocking background upload of captured rover images to Mapillary
 * via the Cloudflare Worker proxy (rupload.facebook.com protocol).
 *
 * Features:
 *  - Camera overlay closes immediately — upload runs silently in background
 *  - SHA-256 hashes + GPS metadata saved to Supabase before upload fires
 *  - Persistent retry toast on failure (images kept in IndexedDB until success)
 *  - Handles both new {data, hash, lat, lon, ts} and legacy plain-string formats
 */

const MAPILLARY_PROXY_URL = 'https://mapillary.kiggundumuhamad.workers.dev/upload';

// Module-level state for retry
var _activeSessionKey   = null;
var _activeSupabaseRowId = null;

// ─────────────────────────────────────────────────────────────
//  Main entry point — called by closeRoverCamera()
//  Runs entirely in the background; never blocks the UI.
// ─────────────────────────────────────────────────────────────
window.startMapillaryUploadQueue = async function() {
    try {
        var keys = await mapillaryStore.keys();
        if (keys.length === 0) {
            console.log('[Mapillary] No captures in queue.');
            return;
        }

        // Generate a unique, resumable session key
        var sessionKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID().replace(/-/g, '')
            : 'gsp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        var fileName = sessionKey + '.zip';

        _activeSessionKey = sessionKey;

        // ── Immediate non-blocking feedback ──────────────────
        if (window.showToast) {
            window.showToast(
                '\ud83d\udce1 Uploading ' + keys.length + ' images to Mapillary in the background\u2026',
                'info',
                5000
            );
        }

        // ── Read all items from IndexedDB ─────────────────────
        var imageHashes = [];
        var gpsStart    = null;
        var gpsEnd      = null;
        var zip         = new JSZip();

        for (var i = 0; i < keys.length; i++) {
            var key  = keys[i];
            var item = await mapillaryStore.getItem(key);

            // Support both new {data,hash,lat,lon,ts} and legacy base64-string
            var base64Str, hashVal, itemLat, itemLon, itemTs;
            if (item && typeof item === 'object' && item.data) {
                base64Str = item.data;
                hashVal   = item.hash  || '';
                itemLat   = item.lat   || null;
                itemLon   = item.lon   || null;
                itemTs    = item.ts    || null;
            } else {
                // Legacy format — plain base64 string
                base64Str = item;
                hashVal   = '';
                itemLat   = null;
                itemLon   = null;
                itemTs    = null;
            }

            var b64Data = base64Str.split(',')[1];
            zip.file(key, b64Data, { base64: true });

            if (!gpsStart && itemLat) gpsStart = { lat: itemLat, lon: itemLon };
            if (itemLat)              gpsEnd   = { lat: itemLat, lon: itemLon };

            imageHashes.push({
                filename:      key,
                sha256:        hashVal,
                lat:           itemLat,
                lon:           itemLon,
                timestamp_utc: itemTs,
            });
        }

        // ── Save evidence metadata to Supabase ───────────────
        // Done before upload so the record exists even if upload fails.
        var supabaseRowId = null;
        if (window.supabaseClient) {
            try {
                var authResult = await window.supabaseClient.auth.getUser();
                var currentUser = authResult && authResult.data && authResult.data.user;

                if (currentUser) {
                    var insertPayload = {
                        user_id:               currentUser.id,
                        session_key:           sessionKey,
                        image_count:           keys.length,
                        status:                'uploading',
                        gps_start_lat:         gpsStart ? gpsStart.lat : null,
                        gps_start_lon:         gpsStart ? gpsStart.lon : null,
                        gps_end_lat:           gpsEnd   ? gpsEnd.lat   : null,
                        gps_end_lon:           gpsEnd   ? gpsEnd.lon   : null,
                        image_hashes:          imageHashes,
                        mapillary_session_key: sessionKey,
                    };

                    var insertResult = await window.supabaseClient
                        .from('mapillary_upload_sessions')
                        .insert(insertPayload)
                        .select('id')
                        .single();

                    if (insertResult && insertResult.data) {
                        supabaseRowId = insertResult.data.id;
                    }
                }
            } catch (supaErr) {
                // Supabase failure is non-fatal — upload still proceeds
                console.warn('[Mapillary] Supabase metadata save failed (non-fatal):', supaErr.message || supaErr);
            }
        }
        _activeSupabaseRowId = supabaseRowId;

        // ── Compress all images into a ZIP ────────────────────
        var zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

        // ── POST ZIP to Cloudflare Worker proxy ───────────────
        await new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', MAPILLARY_PROXY_URL, true);

            // Pass session metadata via headers (not body) so Worker can extract them
            xhr.setRequestHeader('X-Session-Key', sessionKey);
            xhr.setRequestHeader('X-File-Name',   fileName);
            xhr.setRequestHeader('X-File-Size',   zipBlob.size.toString());
            xhr.setRequestHeader('Content-Type',  'application/zip');

            xhr.timeout = 120000; // 2 minutes — generous for cellular networks

            xhr.onload = async function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // ── Success path ──────────────────────────
                    await mapillaryStore.clear();
                    captureCount = 0;

                    // Update Supabase status to 'complete'
                    if (window.supabaseClient && supabaseRowId) {
                        try {
                            await window.supabaseClient
                                .from('mapillary_upload_sessions')
                                .update({
                                    status:       'complete',
                                    completed_at: new Date().toISOString(),
                                })
                                .eq('id', supabaseRowId);
                        } catch (e) {
                            console.warn('[Mapillary] Supabase status update failed:', e);
                        }
                    }

                    resolve();

                    if (window.showToast) {
                        window.showToast(
                            '\u2705 ' + keys.length + ' images successfully published to Mapillary! They will appear on Street View within a few hours.',
                            'success',
                            10000
                        );
                    }
                } else {
                    // Parse error from Worker response
                    var errMsg = 'Upload failed (HTTP ' + xhr.status + ')';
                    try {
                        var parsed = JSON.parse(xhr.responseText);
                        if (parsed && parsed.error) errMsg = parsed.error;
                    } catch (e) { /* ignore parse error */ }
                    reject(new Error(errMsg));
                }
            };

            xhr.ontimeout = function() {
                reject(new Error('Upload timed out. Please check your internet / VPN connection and retry.'));
            };

            xhr.onerror = function() {
                reject(new Error('Network error during upload. Please check your internet / VPN connection and retry.'));
            };

            xhr.send(zipBlob);
        });

    } catch (uploadErr) {
        console.error('[Mapillary] Upload failed:', uploadErr);

        // Update Supabase status to 'failed'
        if (window.supabaseClient && _activeSupabaseRowId) {
            try {
                await window.supabaseClient
                    .from('mapillary_upload_sessions')
                    .update({
                        status:        'failed',
                        error_message: uploadErr.message || 'Unknown error',
                    })
                    .eq('id', _activeSupabaseRowId);
            } catch (e) { /* non-fatal */ }
        }

        // Show persistent retry toast
        _showRetryToast(uploadErr.message || 'Unknown error. Check VPN connection.');
    }
};

// ─────────────────────────────────────────────────────────────
//  Retry — re-runs upload with the same IndexedDB queue
// ─────────────────────────────────────────────────────────────
window.retryMapillaryUpload = async function() {
    var retryToast = document.getElementById('mly-retry-toast');
    if (retryToast) retryToast.remove();
    await window.startMapillaryUploadQueue();
};

// ─────────────────────────────────────────────────────────────
//  Persistent retry toast — shown on upload failure
// ─────────────────────────────────────────────────────────────
function _showRetryToast(errMessage) {
    // Remove existing if any
    var existing = document.getElementById('mly-retry-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id  = 'mly-retry-toast';
    toast.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(185,28,28,0.97)',
        'color:#fff',
        'border-radius:14px',
        'padding:14px 20px',
        'display:flex',
        'align-items:center',
        'gap:14px',
        'z-index:99999',
        'font-family:inherit',
        'font-size:0.88rem',
        'max-width:90vw',
        'box-shadow:0 6px 24px rgba(0,0,0,0.45)',
        'backdrop-filter:blur(10px)',
        '-webkit-backdrop-filter:blur(10px)',
    ].join(';');

    toast.innerHTML = [
        '<span>\u274c Mapillary upload failed: ' + _escHtml(errMessage) + '</span>',
        '<button onclick="window.retryMapillaryUpload()" style="',
            'background:#fff;color:#b91c1c;border:none;border-radius:8px;',
            'padding:7px 16px;cursor:pointer;font-weight:700;font-size:0.85rem;white-space:nowrap;',
        '">&#8635; Retry</button>',
        '<button onclick="document.getElementById(\'mly-retry-toast\').remove()" style="',
            'background:transparent;color:rgba(255,255,255,0.7);border:none;cursor:pointer;',
            'font-size:1.2rem;line-height:1;padding:0 4px;',
        '">\u00d7</button>',
    ].join('');

    document.body.appendChild(toast);
}

function _escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
//  Save locally as ZIP (for 'local' capture mode — unchanged)
// ─────────────────────────────────────────────────────────────
window.downloadLocalMapillaryQueue = async function() {
    try {
        var keys = await mapillaryStore.keys();
        if (keys.length === 0) {
            console.log('[Mapillary] No captures to save locally.');
            return;
        }

        var zip = new JSZip();
        for (var i = 0; i < keys.length; i++) {
            var key  = keys[i];
            var item = await mapillaryStore.getItem(key);
            // Support both new {data,...} format and legacy base64-string
            var base64Str = (item && typeof item === 'object' && item.data) ? item.data : item;
            var b64Data   = base64Str.split(',')[1];
            zip.file(key, b64Data, { base64: true });
        }

        if (window.showToast) window.showToast('Zipping ' + keys.length + ' images\u2026', 'info', 3000);

        var zipBlob   = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        var a         = document.createElement('a');
        a.href        = URL.createObjectURL(zipBlob);
        a.download    = 'GSP_Rover_Captures_' + timestamp + '.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        await mapillaryStore.clear();
        captureCount = 0;

        if (window.showToast) window.showToast('\u2705 Images saved locally as ZIP!', 'success', 5000);

    } catch (err) {
        console.error('[Mapillary] Local save error:', err);
        if (window.showToast) window.showToast('Failed to save images locally: ' + err.message, 'error');
    }
};
