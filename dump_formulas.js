const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('FORMULAR 233a.xls', { cellFormula: true, cellNF: false, cellStyles: false });
    let output = '=== FORMULAR 233a DUMP ===\n';

    workbook.SheetNames.forEach(sheetName => {
        output += `\n--- Sheet: ${sheetName} ---\n`;
        const sheet = workbook.Sheets[sheetName];
        if (!sheet['!ref']) {
            output += '(Empty sheet)\n';
            return;
        }
        const range = XLSX.utils.decode_range(sheet['!ref']);
        for(let R = range.s.r; R <= range.e.r; ++R) {
            let rowLine = `${R+1}:\t`;
            let hasData = false;
            for(let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = {c:C, r:R};
                const cellRef = XLSX.utils.encode_cell(cellAddress);
                const cell = sheet[cellRef];
                if(!cell) {
                    rowLine += `\t`;
                    continue;
                }
                
                let val = '';
                if (cell.f) {
                    val = `FORMULA: =${cell.f}`;
                } else if (cell.v !== undefined) {
                    val = `VAL: ${cell.v}`;
                }
                if (val !== '') hasData = true;
                rowLine += `[${cellRef}: ${val}]\t`;
            }
            if (hasData) {
                output += rowLine + '\n';
            }
        }
    });

    fs.writeFileSync('formulas_dump.txt', output);
    console.log('Dump completed successfully!');
} catch (error) {
    console.error('Error parsing Excel file:', error.message);
}
