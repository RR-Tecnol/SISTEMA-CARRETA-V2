const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Lendo arquivo...');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total de linhas: ${lines.length}`);

// PASSO 1: Encontrar e extrair a seção de funcionários que está FORA das abas
let employeeSectionStart = -1;
let employeeSectionEnd = -1;

for (let i = 0; i < lines.length; i++) {
    // Procurar pelo comentário "Seção de Funcionários" que está FORA das abas (depois do </Dialog>)
    if (lines[i].includes('/* Seção de Funcionários */') && i > 1535) {
        employeeSectionStart = i;
        console.log(`Início da seção de funcionários encontrado na linha ${i + 1}`);

        // Encontrar o final da seção (procurar pelo </Box> que fecha a seção)
        let boxCount = 0;
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('<Box')) boxCount++;
            if (lines[j].includes('</Box>')) {
                boxCount--;
                if (boxCount === 0) {
                    employeeSectionEnd = j;
                    console.log(`Fim da seção de funcionários encontrado na linha ${j + 1}`);
                    break;
                }
            }
        }
        break;
    }
}

if (employeeSectionStart === -1 || employeeSectionEnd === -1) {
    console.log('❌ Não foi possível encontrar a seção de funcionários');
    process.exit(1);
}

// Extrair a seção de funcionários
const employeeSection = lines.slice(employeeSectionStart, employeeSectionEnd + 1);
console.log(`Seção de funcionários extraída (${employeeSection.length} linhas)`);

// PASSO 2: Encontrar onde inserir a seção (dentro da aba CUSTOS, antes do </Box> que fecha a aba)
let custosTabEnd = -1;

for (let i = 1470; i < 1480; i++) {
    if (lines[i].trim() === '</Box>') {
        custosTabEnd = i;
        console.log(`Fim da aba CUSTOS encontrado na linha ${i + 1}`);
        break;
    }
}

if (custosTabEnd === -1) {
    console.log('❌ Não foi possível encontrar o fim da aba CUSTOS');
    process.exit(1);
}

// PASSO 3: Remover a seção de funcionários da posição antiga
console.log('Removendo seção de funcionários da posição antiga...');
lines.splice(employeeSectionStart - 2, employeeSectionEnd - employeeSectionStart + 5); // Remove incluindo linhas vazias

// PASSO 4: Inserir a seção de funcionários DENTRO da aba CUSTOS
console.log('Inserindo seção de funcionários dentro da aba CUSTOS...');

// Adicionar uma linha vazia antes
employeeSection.unshift('');

// Ajustar a indentação (adicionar 8 espaços a cada linha)
const indentedSection = employeeSection.map(line => {
    if (line.trim() === '') return line;
    return '                        ' + line.trim();
});

// Inserir antes do </Box> que fecha a aba CUSTOS
// Como removemos linhas antes, precisamos recalcular a posição
const newCustosTabEnd = custosTabEnd - (employeeSectionEnd - employeeSectionStart + 5);
lines.splice(newCustosTabEnd, 0, ...indentedSection);

// Escrever o arquivo
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Seção de funcionários movida para dentro da aba CUSTOS com sucesso!');
console.log('');
console.log('Resumo:');
console.log(`- Seção removida da linha ${employeeSectionStart + 1}`);
console.log(`- Seção inserida antes da linha ${newCustosTabEnd + 1} (dentro da aba CUSTOS)`);
