const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'admin', 'GerenciarAcao.tsx');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Remove DeleteIcon from imports
content = content.replace(/,\s*Delete as DeleteIcon,/g, ',');

// Remove unused employee functions
console.log('Removing unused employee functions...');

// Find and remove loadFuncionariosDisponiveis
const loadFuncDisponiveisPattern = /const loadFuncionariosDisponiveis = useCallback\(async \(\) => \{[\s\S]*?\}, \[enqueueSnackbar\]\);/;
content = content.replace(loadFuncDisponiveisPattern, '');

// Find and remove handleAddFuncionario
const handleAddFuncPattern = /const handleAddFuncionario = async \(\) => \{[\s\S]*?\};/;
content = content.replace(handleAddFuncPattern, '');

// Find and remove handleRemoveFuncionario
const handleRemoveFuncPattern = /const handleRemoveFuncionario = async \(funcionario_id: string\) => \{[\s\S]*?\};/;
content = content.replace(handleRemoveFuncPattern, '');

// Remove employee state variables
content = content.replace(/const \[funcionariosAcao, setFuncionariosAcao\] = useState<any\[\]>\(\[\]\);/g, '');
content = content.replace(/const \[funcionariosDisponiveis, setFuncionariosDisponiveis\] = useState<any\[\]>\(\[\]\);/g, '');
content = content.replace(/const \[openFuncionarioDialog, setOpenFuncionarioDialog\] = useState\(false\);/g, '');
content = content.replace(/const \[selectedFuncionario, setSelectedFuncionario\] = useState<string \| null>\(null\);/g, '');

// Remove loadFuncionariosAcao function
const loadFuncAcaoPattern = /const loadFuncionariosAcao = useCallback\(async \(\) => \{[\s\S]*?\}, \[id, enqueueSnackbar\]\);/;
content = content.replace(loadFuncAcaoPattern, '');

// Remove loadFuncionariosAcao() call from useEffect
content = content.replace(/loadFuncionariosAcao\(\);/g, '');

// Clean up multiple empty lines
content = content.replace(/\n\n\n+/g, '\n\n');

console.log('Writing cleaned content...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Removed all unused employee-related code!');
