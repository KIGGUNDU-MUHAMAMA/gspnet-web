 = Get-Content -Raw -Encoding UTF8 webmap.html
 = Get-Content -Raw -Encoding UTF8 batch_delete.js

# 1. Insert batch logic before window.showDeleteFeatureModal
 = "window.showDeleteFeatureModal = function(uid, layerName, table, featureOlId) {"
 = "

" +  + "

" + 
 = .Replace(, )

# 2. Add Select Multiple button inside qcDeleteFeatureModal
 = '<button class="btn btn-primary" id="qcConfirmDeleteBtn"'
 = '<button class="btn btn-primary" onclick="window.toggleBatchDeleteMode()" style="background-color: #f59e0b; border-color: #d97706;"><i class="fas fa-layer-group"></i> Select Multiple</button>
                                <button class="btn btn-primary" id="qcConfirmDeleteBtn"'
 = .Replace(, )

[IO.File]::WriteAllText("C:\Users\ECO\Desktop\gspnet-web\webmap.html", , [System.Text.Encoding]::UTF8)
