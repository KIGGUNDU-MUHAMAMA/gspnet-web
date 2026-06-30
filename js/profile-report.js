window.generateProfileReport = async function(user) {
    if (!user) return;
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'profile-report-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.9); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(10px);
        font-family: 'Inter', 'Segoe UI', sans-serif;
    `;
    
    overlay.innerHTML = `<div style="color: #38bdf8; font-size: 24px; display: flex; align-items: center; gap: 12px;">
        <i class="fas fa-circle-notch fa-spin"></i> Generating Report...
    </div>`;
    document.body.appendChild(overlay);

    try {
        // Fetch stats
        let s;
        try {
            const { data: stats, error } = await supabase
                .from('profile_contribution_stats')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (error) console.warn("Could not fetch stats, falling back to 0:", error);
            s = stats;
        } catch(e) {
            console.warn("View profile_contribution_stats may not exist yet, falling back to 0");
        }
            
        const fallbackStats = {
            survey_polygons_count: 0, symbols_mapped_count: 0,
            assistant_uploads_count: 0, terrain_uploads_count: 0, corroboration_cases_count: 0,
            condominiums_count: 0, quality_flags_count: 0, valuations_count: 0,
            total_contributions: 0, is_contributor: user.is_contributor || false,
            role: user.role
        };
        s = Object.assign({}, fallbackStats, s || {});
        
        const maxStat = Math.max(1, 
            s.survey_polygons_count || 0, s.symbols_mapped_count || 0, 
            s.assistant_uploads_count || 0, s.terrain_uploads_count || 0, 
            s.corroboration_cases_count || 0, s.condominiums_count || 0,
            s.quality_flags_count || 0, s.valuations_count || 0
        );

        const buildBar = (value, color) => {
            const pct = Math.max(2, (value / maxStat) * 100);
            return `<div style="width: 100%; background: #e2e8f0; border-radius: 99px; height: 10px; overflow: hidden; margin-top: 6px;">
                <div style="width: ${pct}%; background: ${color}; height: 100%; border-radius: 99px; transition: width 1s ease-out;"></div>
            </div>`;
        };

        const username = user.username || user.display_name || user.email?.split('@')[0] || 'User';
        const avatar = user.avatar_url ? `url('${user.avatar_url}')` : 'linear-gradient(135deg, #0ea5e9, #0284c7)';
        
        const badge = s.is_contributor ? '<i class="fas fa-check-circle" style="color: #0284c7; margin-left: 8px;" title="Verified Contributor"></i>' : '';

        const qrUrl = encodeURIComponent(`https://webmap.geospatialnetwork.ug`);
        const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrUrl}&margin=0&color=0f172a&bgcolor=ffffff`;

        overlay.innerHTML = `
        <div id="profile-report-card" style="
            background: #ffffff; 
            border: 1px solid #e2e8f0;
            border-radius: 16px; 
            width: 90%; max-width: 794px; /* A4 aspect ratio helper */
            max-height: 90vh;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column;
            color: #1e293b;
            position: relative;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        ">
            <style>
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                /* Hide scrollbar for cleaner screenshot */
                #profile-report-card::-webkit-scrollbar { width: 8px; }
                #profile-report-card::-webkit-scrollbar-track { background: transparent; }
                #profile-report-card::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            </style>
            
            <!-- Header -->
            <div style="padding: 32px 40px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: ${avatar}; background-size: cover; background-position: center; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"></div>
                        <div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; display: flex; align-items: center; letter-spacing: -0.5px;">${username} ${badge}</h1>
                            <p style="margin: 4px 0 0 0; color: #475569; font-size: 15px; font-weight: 600;">Geospatial Network Contributor Report</p>
                            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 13px;">Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button id="close-report-btn" onclick="document.getElementById('profile-report-overlay').remove()" style="position: absolute; top: 16px; right: 16px; z-index: 50; background: #f1f5f9; border: none; color: #64748b; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; transition: background 0.2s, color 0.2s; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">&times;</button>
                </div>
            </div>

            <!-- Content -->
            <div style="padding: 32px 40px; display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 1; background: #ffffff;">
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Total Contributions</div>
                        <div style="font-size: 40px; font-weight: 900; color: #0284c7; line-height: 1;">${s.total_contributions}</div>
                    </div>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Status</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${s.is_contributor ? '#059669' : '#475569'}; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas ${s.is_contributor ? 'fa-medal' : 'fa-seedling'}"></i>
                            ${s.is_contributor ? 'Verified Contributor' : 'Getting Started'}
                        </div>
                    </div>
                </div>

                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-chart-bar" style="color: #0284c7;"></i> Contribution Breakdown
                    </h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-draw-polygon" style="color: #0c4a6e; width: 20px;"></i> Cadastral Parcels Registered</span>
                                <span>${s.survey_polygons_count || 0}</span>
                            </div>
                            ${buildBar(s.survey_polygons_count || 0, '#0c4a6e')}
                        </div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-map-marker-alt" style="color: #075985; width: 20px;"></i> Topographical Features Mapped</span>
                                <span>${s.symbols_mapped_count || 0}</span>
                            </div>
                            ${buildBar(s.symbols_mapped_count || 0, '#075985')}
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-file-upload" style="color: #0369a1; width: 20px;"></i> Engineering Drawings Imported</span>
                                <span>${s.assistant_uploads_count || 0}</span>
                            </div>
                            ${buildBar(s.assistant_uploads_count || 0, '#0369a1')}
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-mountain" style="color: #0284c7; width: 20px;"></i> Terrain Intelligence Models</span>
                                <span>${s.terrain_uploads_count || 0}</span>
                            </div>
                            ${buildBar(s.terrain_uploads_count || 0, '#0284c7')}
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-building" style="color: #0ea5e9; width: 20px;"></i> Condominium Developments Modeled</span>
                                <span>${s.condominiums_count || 0}</span>
                            </div>
                            ${buildBar(s.condominiums_count || 0, '#0ea5e9')}
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-chart-line" style="color: #38bdf8; width: 20px;"></i> Property Valuations Executed</span>
                                <span>${s.valuations_count || 0}</span>
                            </div>
                            ${buildBar(s.valuations_count || 0, '#38bdf8')}
                        </div>

                        ${s.role === 'rsu' || (s.corroboration_cases_count || 0) > 0 || (s.quality_flags_count || 0) > 0 ? `
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #334155;">
                                <span><i class="fas fa-shield-alt" style="color: #7dd3fc; width: 20px;"></i> Spatial Quality Audits</span>
                                <span>${(s.corroboration_cases_count || 0) + (s.quality_flags_count || 0)}</span>
                            </div>
                            ${buildBar((s.corroboration_cases_count || 0) + (s.quality_flags_count || 0), '#7dd3fc')}
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Certification Footer & QR Code -->
                <div style="margin-top: 8px; padding-top: 24px; border-top: 2px solid #e2e8f0; display: flex; align-items: center; gap: 24px;">
                    <div style="flex-shrink: 0; width: 100px; height: 100px; background: white; padding: 4px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <img src="${qrImgSrc}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div style="flex-grow: 1;">
                        <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #0f172a; font-weight: 800;">Official GSPNET Certification</h4>
                        <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                            This document officially certifies the above user's verified contributions towards the advancement of accurate geospatial intelligence and surveying practices within the GSPNET ecosystem. Scan the code to access the platform.
                        </p>
                    </div>
                </div>
                
                <div class="print-actions" style="display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button onclick="window.printProfileReport()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;">
                        <i class="fas fa-print"></i> Print / Save as PDF
                    </button>
                </div>
            </div>
        </div>
        `;

        window.printProfileReport = async function() {
            if (typeof window.html2canvas === 'undefined') {
                alert('html2canvas library is not loaded. Please wait a moment or refresh the page.');
                return;
            }
            
            const btn = document.querySelector('.print-actions button');
            const closeBtn = document.getElementById('close-report-btn');
            const originalBtnHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Print...';
            btn.disabled = true;
            if (closeBtn) closeBtn.style.display = 'none';

            // Open window IMMEDIATELY to bypass popup blockers
            const printWin = window.open('', '_blank');
            if (!printWin) {
                alert('Please allow popups for this site to print the report.');
                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
                if (closeBtn) closeBtn.style.display = 'flex';
                return;
            }
            printWin.document.write('<html><head><title>Preparing Report...</title></head><body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f1f5f9;"><h2>Preparing High Quality Print...</h2></body></html>');

            try {
                const card = document.getElementById('profile-report-card');
                
                // Hide actions before capturing
                const printActions = document.querySelector('.print-actions');
                if (printActions) printActions.style.display = 'none';

                // Temporarily adjust styling for full render
                const originalOverflow = card.style.overflowY;
                const originalMaxHeight = card.style.maxHeight;
                card.style.overflowY = 'visible';
                card.style.maxHeight = 'none';

                const canvas = await html2canvas(card, {
                    scale: 4, // Ultra High resolution
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });

                card.style.overflowY = originalOverflow;
                card.style.maxHeight = originalMaxHeight;
                if (printActions) printActions.style.display = 'flex';
                if (closeBtn) closeBtn.style.display = 'flex';

                const imgData = canvas.toDataURL('image/png', 1.0);
                
                // Update the already opened window
                printWin.document.open();
                printWin.document.write(`
                    <html>
                    <head>
                        <title>Profile Report - ${username}</title>
                        <style>
                            body { margin: 0; padding: 0; display: flex; justify-content: center; background: #f1f5f9; }
                            img { max-width: 100%; height: auto; display: block; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            @media print {
                                body { background: white !important; }
                                img { width: 100%; height: auto; box-shadow: none; margin: 0; }
                                @page { margin: 0; size: A4 portrait; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${imgData}" onload="setTimeout(function(){ window.print(); }, 500);" />
                    </body>
                    </html>
                `);
                printWin.document.close();

            } catch (err) {
                console.error('Print generation failed:', err);
                alert('Failed to generate print view.');
                if (printWin) printWin.close();
            } finally {
                btn.innerHTML = originalBtnHtml;
                btn.disabled = false;
                if (closeBtn) closeBtn.style.display = 'flex';
            }
        };

    } catch(e) {
        console.error("Error generating report:", e);
        overlay.innerHTML = `<div style="background: white; padding: 24px; border-radius: 8px; color: #ef4444; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i><br>
            Error loading report data. Please try again later.<br>
            <button onclick="document.getElementById('profile-report-overlay').remove()" style="margin-top: 16px; padding: 8px 16px; border: 1px solid #ef4444; background: transparent; color: #ef4444; border-radius: 4px; cursor: pointer;">Close</button>
        </div>`;
    }
};
