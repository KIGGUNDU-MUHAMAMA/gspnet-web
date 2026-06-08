import io

with io.open('webmap.html', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'BATCH QC DELETION: Admin deleted' in line and 'parcels. Reason:' in line:
        if 'const batchMsg =' in line:
            lines[i] = '            const batchMsg = `🗑️ BATCH QC DELETION: Admin deleted ${polygonsToDelete.length} parcels. Reason: ${finalReason}. IDs: ${uniqueIds.join(\', \')}`;'
            print('Fixed line', i+1)
        elif 'const pMsg =' in line:
            lines[i] = '                const pMsg = `🗑️ BATCH QC DELETION: Admin deleted ${info.ids.length} of your parcels. Reason: ${finalReason}. IDs: ${info.ids.join(\', \')}`;'
            print('Fixed line', i+1)

with io.open('webmap.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
