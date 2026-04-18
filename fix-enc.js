const fs = require('fs');
const file = 'backend/src/routes/medicoMonitoring.ts';
let content = fs.readFileSync(file, 'utf8');

// The file has ISO-8859-1 strings interpreted as UTF-8 (mojibake).
content = content.replace(/mÃ©dic/g, 'médic');
content = content.replace(/aÃ§Ãµ/g, 'açõ');
content = content.replace(/aÃ§Ã£/g, 'açã');
content = content.replace(/NÃ£o/g, 'Não');
content = content.replace(/inscriÃ§Ãµes/g, 'inscrições');
content = content.replace(/funcionÃ¡rios/g, 'funcionários');
content = content.replace(/Ãº/g, 'ú');
content = content.replace(/Ã­/g, 'í');
content = content.replace(/Ã³/g, 'ó');
content = content.replace(/Ã¡/g, 'á');
content = content.replace(/Ã¢/g, 'â');
content = content.replace(/Ã©/g, 'é');
content = content.replace(/Ãª/g, 'ê');
content = content.replace(/Ã§/g, 'ç');
content = content.replace(/Ã£/g, 'ã');
content = content.replace(/Ãµ/g, 'õ');
content = content.replace(/ï¿½\"\?ï¿½\"\?ï¿½\"\?/g, '---');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed encodings in medicoMonitoring.ts');
