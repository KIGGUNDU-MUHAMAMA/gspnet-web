// Batch Delete Functionality
window.toggleBatchDeleteMode = function() {
    closeModal('qcDeleteFeatureModal');
    
    if (window.batchDeleteState) {
        window.batchDeleteState.active = true;
    }
    
    // Add initial selected feature to batch if provided
    const qcDelFeatureId = document.getElementById('qcDelFeatureId').textContent;
    if (qcDelFeatureId && window.batchDeleteState) {
        // If it's already in the highlightSource, we can just use the state from map click interceptor
        // Otherwise, it was already added when they clicked the feature initially
    }

    let widget = document.getElementById('batchDeleteWidget');
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'batchDeleteWidget';
        widget.style.cssText = 'position: absolute; top: 15px; right: 15px; width: 300px; background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; padding: 15px; border: 2px solid #e11d48;';
        widget.innerHTML = 
            <h4 style="color: #e11d48; margin-top: 0; margin-bottom: 10px;"><i class="fas fa-trash-alt"></i> Batch Delete</h4>
            <p style="font-size: 12px; margin-bottom: 10px;">Select parcels on the map. Click again to deselect.</p>
            <div style="font-weight: bold; margin-bottom: 10px;">Selected Parcels: <span id="batchDeleteCount">1</span></div>
            
            <label style="font-size: 12px; font-weight: bold;">Reason:</label>
            <select id="batchDeleteReason" class="form-control" style="width: 100%; padding: 5px; margin-bottom: 10px; font-size: 12px;">
                <option value="">-- Select a reason --</option>
                <option value="Duplicate Feature">Duplicate Feature</option>
                <option value="Incorrect Geometry / Boundary">Incorrect Geometry / Boundary</option>
                <option value="Replaced by newer survey">Replaced by newer survey</option>
                <option value="Invalid Data / Test Data">Invalid Data / Test Data</option>
                <option value="Other">Other (specify below)</option>
            </select>
            <textarea id="batchDeleteDetails" class="form-control" placeholder="Details..." style="width: 100%; padding: 5px; min-height: 40px; font-size: 12px; margin-bottom: 10px;"></textarea>

            <div style="display: flex; gap: 5px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="window.cancelBatchDelete()" style="padding: 5px 10px; font-size: 12px;">Cancel</button>
                <button class="btn btn-primary" id="batchConfirmBtn" onclick="window.executeBatchDelete()" style="background-color: #e11d48; border-color: #be123c; padding: 5px 10px; font-size: 12px;">Delete All</button>
            </div>
        ;
        document.body.appendChild(widget);
    }
    
    // Hide standard info panel
    const fInfo = document.getElementById('featureInfo');
    if (fInfo) fInfo.style.display = 'none';
    
    widget.style.display = 'block';
    window.updateBatchDeleteWidget();
};

window.updateBatchDeleteWidget = function() {
    const countSpan = document.getElementById('batchDeleteCount');
    if (countSpan && window.batchDeleteState) {
        countSpan.textContent = window.batchDeleteState.parcels.size;
    }
};

window.cancelBatchDelete = function() {
    if (window.batchDeleteState) {
        window.batchDeleteState.active = false;
        window.batchDeleteState.parcels.clear();
    }
    if (window.highlightSource) window.highlightSource.clear();
    const widget = document.getElementById('batchDeleteWidget');
    if (widget) widget.style.display = 'none';
};

window.executeBatchDelete = async function() {
    if (!window.batchDeleteState || window.batchDeleteState.parcels.size === 0) {
        showToast('No parcels selected.', 'warning');
        return;
    }
    
    const reasonSel = document.getElementById('batchDeleteReason').value;
    const details = document.getElementById('batchDeleteDetails').value.trim();
    
    if (!reasonSel) {
        showToast('Please select a reason for deletion.', 'error');
        return;
    }
    const finalReason = reasonSel === 'Other' ? details : (details ? reasonSel + ' - ' + details : reasonSel);
    if (reasonSel === 'Other' && !details) {
        showToast('Please provide details for the reason.', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('batchConfirmBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    
    try {
        const currentUser = await getCurrentAuthenticatedUserContext();
        const polygonsToDelete = [];
        const uniqueIds = [];
        const messagesByCreator = {};
        
        for (const [uid, pData] of window.batchDeleteState.parcels.entries()) {
            uniqueIds.push(uid);
            
            let featureRecord = null;
            if (pData.table === 'polygon_features') {
                const { data } = await supabase.from('polygon_features').select('*').eq('unique_id', uid).single();
                featureRecord = data;
            } else if (pData.table === 'map_features') {
                const { data } = await supabase.from('map_features').select('*').eq('id', uid).single();
                featureRecord = data;
                if (featureRecord) {
                    featureRecord.unique_id = featureRecord.id;
                    featureRecord.layer_name = 'Symbols Library';
                    featureRecord.created_by = featureRecord.user_id;
                }
            }
            
            if (featureRecord) {
                polygonsToDelete.push(featureRecord);
                
                // Group messages by creator
                if (featureRecord.created_by && featureRecord.created_by !== currentUser.id) {
                    if (!messagesByCreator[featureRecord.created_by]) {
                        messagesByCreator[featureRecord.created_by] = {
                            surveyor: featureRecord.surveyor || 'Surveyor',
                            ids: []
                        };
                    }
                    messagesByCreator[featureRecord.created_by].ids.push(featureRecord.unique_id);
                }
                
                // QC Flag
                const flagData = {
                    lng: featureRecord.longitude || 0,
                    lat: featureRecord.latitude || 0,
                    district: featureRecord.district || 'Unknown',
                    county: featureRecord.county || null,
                    block: featureRecord.block_number || null,
                    plot: featureRecord.plot_number || null,
                    is_untitled: featureRecord.layer_name ? featureRecord.layer_name.includes('UNTITLED') : false,
                    flag_type: 'red',
                    reporter_name: currentUser ? currentUser.displayName : 'Admin',
                    reporter_contact: currentUser ? currentUser.email : '',
                    reason: 'BATCH DELETION: ' + finalReason,
                    survey_unique_id: featureRecord.unique_id,
                    polygon_feature_id: pData.table === 'polygon_features' ? featureRecord.id : null,
                    survey_layer_name: featureRecord.layer_name || pData.layerName
                };
                const newFlag = await createFlag(flagData);
                try {
                    await createCorroborationCaseForFlag(newFlag, featureRecord, currentUser);
                } catch (caseErr) { }
            }
        }
        
        // Delete all in batch from polygon_features
        if (uniqueIds.length > 0) {
            const { error: delErr } = await supabase.from('polygon_features').delete().in('unique_id', uniqueIds);
            if (delErr) {
                console.warn('Batch delete error from polygon_features:', delErr);
            }
        }
        
        // Remove from Map
        window.batchDeleteState.parcels.forEach((pData, uid) => {
            if (pData.table === 'polygon_features') {
                if (pData.featureOlId) {
                    map.getLayers().forEach(layer => {
                        if (layer instanceof ol.layer.Vector) {
                            const source = layer.getSource();
                            if (source && typeof source.getFeatureById === 'function') {
                                const f = source.getFeatureById(pData.featureOlId) || source.getFeatures().find(ft => ft.get('unique_id') === uid);
                                if (f) source.removeFeature(f);
                            }
                        }
                    });
                }
            } else if (pData.table === 'map_features') {
                if (typeof loadedFeatures !== 'undefined' && loadedFeatures.has(uid)) {
                    const f = loadedFeatures.get(uid);
                    if (typeof featuresSource !== 'undefined') featuresSource.removeFeature(f);
                    loadedFeatures.delete(uid);
                }
            }
        });
        
        // Broadcast Chat Room Message
        if (window.supabase && polygonsToDelete.length > 0) {
            const batchMsg = 🗑️ BATCH QC DELETION: Admin deleted  parcels. Reason: . IDs: ;
            const { data: roomData } = await supabase.from('chat_rooms').select('id');
            if (roomData && roomData.length > 0) {
                const postsToInsert = roomData.map(room => ({
                    room_id: room.id,
                    user_id: currentUser.id,
                    username: currentUser.displayName || 'Admin',
                    content: batchMsg
                }));
                await supabase.from('room_posts').insert(postsToInsert);
            }
            
            // Private messages
            for (const creatorId in messagesByCreator) {
                const info = messagesByCreator[creatorId];
                const pMsg = 🗑️ BATCH QC DELETION: Admin deleted  of your parcels. Reason: . IDs: ;
                await supabase.from('private_messages').insert([{
                    sender_id: currentUser.id,
                    receiver_id: creatorId,
                    sender_username: currentUser.displayName || 'Admin',
                    receiver_username: info.surveyor,
                    content: pMsg
                }]);
            }
        }
        
        showToast(Successfully deleted  features., 'success');
        window.cancelBatchDelete();
        
        if (typeof window.loadPolygonsForExtent === 'function') {
            const ext = map.getView().calculateExtent(map.getSize());
            window.loadPolygonsForExtent(ext);
        }
        map.getLayers().forEach(layer => {
            if (typeof layer.getSource === 'function') {
                const src = layer.getSource();
                if (src && typeof src.refresh === 'function') src.refresh();
            }
        });
        
    } catch (err) {
        console.error('Batch Delete error:', err);
        showToast('Failed to execute batch deletion: ' + err.message, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Delete All';
    }
};

