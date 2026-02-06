const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all console.log statements related to autonomy debugging
content = content.replace(/\s*console\.log\('Caminhão vinculado:', cv\);/g, '');
content = content.replace(/\s*console\.log\('cv\.autonomia_km_litro:', cv\.autonomia_km_litro\);/g, '');
content = content.replace(/\s*console\.log\('cv\.caminhao\?\.autonomia_km_litro:', cv\.caminhao\?\.autonomia_km_litro\);/g, '');
content = content.replace(/\s*console\.log\('Autonomia final:', autonomia\);/g, '');
content = content.replace(/\s*console\.log\('MÉDIA FINAL CALCULADA:', media\.toFixed\(1\), 'km\/L'\);/g, '');

// Remove the DEBUG comment
content = content.replace(/\s*\/\/ DEBUG: Log the entire object structure/g, '');

// Simplify the autonomy calculation - use parseFloat instead of Number
content = content.replace(
    /const autonomiaValue = cv\.autonomia_km_litro \|\| cv\.caminhao\?\.autonomia_km_litro \|\| 0;\s*const autonomia = Number\(autonomiaValue\);/g,
    'const autonomia = parseFloat(cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0);'
);

// Remove String() wrapper from return statement
content = content.replace(/return String\(media\.toFixed\(1\)\);/g, 'return media.toFixed(1);');

console.log('Writing cleaned content...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Removed all debug console.logs and simplified code!');
