const { exec } = require('child_process');
const path = require('path');

const sqlFile = path.join(__dirname, 'init-database.sql');
const command = `psql postgresql://postgres:postgres@localhost:5432/sistema_carretas -f "${sqlFile}"`;

console.log('🔄 Executando init-database.sql...\n');

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erro ao executar SQL:', error.message);
        return;
    }
    if (stderr) {
        console.log('⚠️  Avisos:', stderr);
    }
    console.log(stdout);
    console.log('\n✅ Banco de dados inicializado!');
    console.log('\n📧 Login Admin:');
    console.log('   CPF: 123.456.789-09');
    console.log('   Senha: admin123');
});
