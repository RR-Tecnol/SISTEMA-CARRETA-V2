const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Lendo arquivo com UTF-8...');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log(`Total de linhas: ${lines.length}`);

// Encontrar a seção de funcionários (começa após </Dialog> da linha 1535)
// e termina antes do próximo </Container>
let employeeSectionStart = -1;
let employeeSectionEnd = -1;

// Procurar pela seção de funcionários que está FORA das abas
for (let i = 1535; i < lines.length; i++) {
    if (lines[i].includes('/* Seção de Funcionários */')) {
        employeeSectionStart = i;
        console.log(`Início da seção encontrado na linha ${i + 1}`);

        // Encontrar o final (procurar pelo Dialog de adicionar funcionário)
        for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('</Dialog>') && lines[j + 1] && lines[j + 1].trim() === '' && lines[j + 2] && lines[j + 2].includes('</Container>')) {
                employeeSectionEnd = j;
                console.log(`Fim da seção encontrado na linha ${j + 1}`);
                break;
            }
        }
        break;
    }
}

if (employeeSectionStart === -1) {
    console.log('❌ Seção de funcionários não encontrada');
    process.exit(1);
}

// Extrair a seção
const employeeSection = lines.slice(employeeSectionStart, employeeSectionEnd + 1);
console.log(`Seção extraída: ${employeeSection.length} linhas`);

// Remover a seção da posição original (incluindo linhas vazias antes)
const linesWithoutEmployee = [
    ...lines.slice(0, employeeSectionStart - 2),
    ...lines.slice(employeeSectionEnd + 2)
];

console.log(`Linhas após remoção: ${linesWithoutEmployee.length}`);

// Encontrar onde inserir (antes do </Box> que fecha a aba CUSTOS, linha 1476)
// Procurar pelo padrão: </Dialog> seguido de </Box> dentro da aba CUSTOS
let insertIndex = -1;
for (let i = 1470; i < 1480; i++) {
    if (linesWithoutEmployee[i] && linesWithoutEmployee[i].trim() === '</Dialog>' &&
        linesWithoutEmployee[i + 1] && linesWithoutEmployee[i + 1].includes('</Box>')) {
        insertIndex = i + 1; // Inserir antes do </Box>
        console.log(`Inserindo antes da linha ${insertIndex + 1}`);
        break;
    }
}

if (insertIndex === -1) {
    console.log('❌ Posição de inserção não encontrada');
    process.exit(1);
}

// Criar array final
const finalLines = [
    ...linesWithoutEmployee.slice(0, insertIndex),
    '',
    ...employeeSection,
    ...linesWithoutEmployee.slice(insertIndex)
];

console.log(`Linhas finais: ${finalLines.length}`);

// Salvar com UTF-8
fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');

console.log('✅ Seção de funcionários movida com sucesso!');
console.log(`   - Removida da linha ${employeeSectionStart + 1}`);
console.log(`   - Inserida antes da linha ${insertIndex + 1}`);
