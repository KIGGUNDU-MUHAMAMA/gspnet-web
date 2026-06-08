import os

with open('webmap.html', 'r', encoding='utf-8') as f:
    content = f.read()

with open('batch_delete.js', 'r', encoding='utf-8') as f:
    batch_logic = f.read()

target1 = "window.showDeleteFeatureModal = function(uid, layerName, table, featureOlId) {"
if target1 in content:
    content = content.replace(target1, batch_logic + "\n\n" + target1)
    print("Injected batch_delete.js")
else:
    print("Target 1 not found")

target2 = '<button class="btn btn-primary" id="qcConfirmDeleteBtn"'
if target2 in content:
    replacement2 = '<button class="btn btn-primary" type="button" onclick="window.toggleBatchDeleteMode()" style="background-color: #f59e0b; border-color: #d97706;"><i class="fas fa-layer-group"></i> Select Multiple</button>\n                                <button class="btn btn-primary" id="qcConfirmDeleteBtn"'
    content = content.replace(target2, replacement2)
    print("Injected button")
else:
    print("Target 2 not found")

with open('webmap.html', 'w', encoding='utf-8') as f:
    f.write(content)
