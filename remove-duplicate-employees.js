const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Find and remove the employee section that is OUTSIDE any tab (after line 1492)
// It starts at line 1553 with "/* Seção de Funcionários */" and ends around line 1610

let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('/* Seção de Funcionários */')) {
        startLine = i;
        console.log(`Found employee section start at line ${i + 1}`);
    }
    if (startLine !== -1 && endLine === -1 && lines[i].trim() === '</Box>' && i > startLine + 50) {
        endLine = i;
        console.log(`Found employee section end at line ${i + 1}`);
        break;
    }
}

if (startLine !== -1 && endLine !== -1) {
    // Check if this section is AFTER the CUSTOS tab closing (line 1492)
    let custosTabEnd = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('</Paper>') && i > 1400 && i < 1500) {
            custosTabEnd = i;
            break;
        }
    }

    console.log(`CUSTOS tab ends at line ${custosTabEnd + 1}`);
    console.log(`Employee section starts at line ${startLine + 1}`);

    if (startLine > custosTabEnd) {
        console.log('Employee section is OUTSIDE tabs - removing it...');

        // Remove lines from startLine-2 (to include empty lines before) to endLine
        lines.splice(startLine - 2, endLine - startLine + 3);

        content = lines.join('\n');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Removed duplicate employee section!');
    } else {
        console.log('Employee section is already inside a tab - no action needed');
    }
} else {
    console.log('Could not find employee section boundaries');
}

console.log('Done!');
