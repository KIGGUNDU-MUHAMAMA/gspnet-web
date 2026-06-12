

window.startMapillaryUploadQueue = async function() {
    try {
        const keys = await mapillaryStore.keys();
        if (keys.length === 0) {
            console.log('No Mapillary captures to upload.');
            return;
        }
        
        // Show upload UI
        const overlay = document.getElementById('rover-camera-overlay');
        overlay.classList.add('active'); // Ensure it's visible for progress
        const hudTop = document.querySelector('.hud-top-bar');
        const hudReticle = document.querySelector('.hud-center-reticle');
        const hudBottom = document.querySelector('.hud-bottom-bar');
        if (hudTop) hudTop.style.display = 'none';
        if (hudReticle) hudReticle.style.display = 'none';
        if (hudBottom) hudBottom.style.display = 'none';
        
        const progressWidget = document.getElementById('rover-upload-progress');
        const progressText = document.getElementById('rover-upload-text');
        const progressFill = document.getElementById('rover-upload-fill');
        
        progressWidget.style.display = 'block';
        progressText.innerText = `Packaging ${keys.length} images...`;
        progressFill.style.width = '10%';
        
        // 1. Create a ZIP file of all images
        const zip = new JSZip();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const base64Str = await mapillaryStore.getItem(key);
            // Remove 'data:image/jpeg;base64,' prefix
            const b64Data = base64Str.split(',')[1];
            zip.file(key, b64Data, {base64: true});
        }
        
        progressText.innerText = `Compressing ${keys.length} images...`;
        progressFill.style.width = '30%';
        
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        
        progressText.innerText = `Uploading via Mapillary Proxy...`;
        progressFill.style.width = '40%';
        
        // POST the Zip Blob to Cloudflare Worker Proxy
        // IMPORTANT: Replace this URL with your deployed Cloudflare worker URL!
        const MAPILLARY_PROXY_URL = 'https://mapillary.kiggundumuhamad.workers.dev/upload';
        
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', MAPILLARY_PROXY_URL, true);
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = (e.loaded / e.total) * 60; // 40% to 100%
                    progressFill.style.width = `${40 + pct}%`;
                }
            };
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Proxy Upload failed: ${xhr.status} ${xhr.responseText}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error during Proxy Upload'));
            xhr.send(zipBlob);
        });
        
        progressFill.style.width = '100%';
        progressText.innerText = `Upload Complete!`;
        
        // 4. Clear IndexedDB on success
        await mapillaryStore.clear();
        
        // Reset and hide UI after 3 seconds
        setTimeout(() => {
            progressWidget.style.display = 'none';
            overlay.classList.remove('active');
            
            // Restore HUD elements
            if (hudTop) hudTop.style.display = '';
            if (hudReticle) hudReticle.style.display = '';
            if (hudBottom) hudBottom.style.display = '';
            
            if (window.showToast) window.showToast('Images successfully published to Mapillary!', 'success');
        }, 3000);
        
    } catch (err) {
        console.error('Mapillary Upload Error:', err);
        const progressText = document.getElementById('rover-upload-text');
        if (progressText) progressText.innerText = 'Upload Failed. Will retry later.';
        
        setTimeout(() => {
            const overlay = document.getElementById('rover-camera-overlay');
            if (overlay) overlay.classList.remove('active');
            document.getElementById('rover-upload-progress').style.display = 'none';
        }, 3000);
    }
};

window.downloadLocalMapillaryQueue = async function() {
    try {
        const keys = await mapillaryStore.keys();
        if (keys.length === 0) {
            console.log('No Mapillary captures to save.');
            return;
        }
        
        const zip = new JSZip();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const base64Str = await mapillaryStore.getItem(key);
            const b64Data = base64Str.split(',')[1];
            zip.file(key, b64Data, {base64: true});
        }
        
        if (window.showToast) window.showToast(`Zipping ${keys.length} images...`, 'info');
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `GSP_Rover_Captures_${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        
        await mapillaryStore.clear();
        if (window.showToast) window.showToast('Images successfully saved locally as ZIP!', 'success');
        
    } catch (err) {
        console.error('Local Save Error:', err);
        if (window.showToast) window.showToast('Failed to save images locally.', 'error');
    }
};
