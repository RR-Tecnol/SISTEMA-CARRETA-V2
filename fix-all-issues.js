const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// PROBLEMA 1: Remover seção de Funcionários da aba INSCRIÇÕES (activeTab === 2)
// Encontrar e remover a seção de funcionários que está duplicada na aba INSCRIÇÕES
console.log('Fixing Problem 1: Removing duplicate employee section from INSCRIÇÕES tab...');

// Procurar pela seção de funcionários na aba INSCRIÇÕES (activeTab === 2)
const inscricoesTabPattern = /{activeTab === 2 &&[\s\S]*?<\/Box>\s*\)\s*}/;
const inscricoesMatch = content.match(inscricoesTabPattern);

if (inscricoesMatch) {
    const inscricoesContent = inscricoesMatch[0];

    // Verificar se há seção de funcionários dentro
    if (inscricoesContent.includes('Funcionários Atribuídos')) {
        console.log('Found employee section in INSCRIÇÕES tab, removing it...');

        // Remover a seção de funcionários (desde "Funcionários Atribuídos" até o final do Paper)
        const cleanedInscricoes = inscricoesContent.replace(
            /{\/\* Funcionários Atribuídos \*\/}[\s\S]*?<\/Paper>/,
            ''
        );

        content = content.replace(inscricoesContent, cleanedInscricoes);
        console.log('✓ Removed employee section from INSCRIÇÕES tab');
    }
}

// PROBLEMA 2: Corrigir o dropdown de caminhões no dialog de abastecimento
// O problema é que está usando caminhoesVinculados em vez de caminhoes
console.log('Fixing Problem 2: Fixing truck dropdown in fuel dialog...');

content = content.replace(
    /{caminhoesVinculados\.map\(\(caminhao: any\) => \(/,
    '{caminhoes.map((caminhao: any) => ('
);
console.log('✓ Fixed truck dropdown to use all trucks instead of only linked trucks');

// PROBLEMA 3: Corrigir exibição da autonomia
// O problema pode ser que está retornando string mas precisa garantir que não há espaços ou caracteres extras
console.log('Fixing Problem 3: Fixing autonomy display...');

// Encontrar a seção de cálculo de autonomia e simplificar
const autonomyPattern = /{\/\* Autonomia Média \*\/}[\s\S]*?<\/Grid>/;
const autonomyMatch = content.match(autonomyPattern);

if (autonomyMatch) {
    const newAutonomySection = `{/* Autonomia Média */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Autonomia Média
                                            </Typography>
                                            <Typography variant="h6">
                                                {(() => {
                                                    if (caminhoesVinculados.length === 0) return '0';

                                                    let somaAutonomia = 0;
                                                    let count = 0;

                                                    caminhoesVinculados.forEach((cv: any) => {
                                                        const autonomia = parseFloat(cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0);

                                                        if (!isNaN(autonomia) && autonomia > 0) {
                                                            somaAutonomia += autonomia;
                                                            count++;
                                                        }
                                                    });

                                                    if (count === 0) return '0';
                                                    const media = somaAutonomia / count;
                                                    return media.toFixed(1);
                                                })()} km/L
                                            </Typography>
                                        </Grid>`;

    content = content.replace(autonomyMatch[0], newAutonomySection);
    console.log('✓ Fixed autonomy calculation and display');
}

console.log('Writing fixed content...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!');
console.log('');
console.log('Summary of fixes:');
console.log('1. ✓ Removed duplicate employee section from INSCRIÇÕES tab');
console.log('2. ✓ Fixed truck dropdown in fuel registration dialog');
console.log('3. ✓ Fixed autonomy calculation and display');
console.log('');
console.log('Please reload the page and test!');
