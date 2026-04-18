const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5434,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres'
  });
  await client.connect();
  
  const hashMedico = await bcrypt.hash('Medico@123', 10);
  const hashAdminEstrada = await bcrypt.hash('AdminEstrada@123', 10);
  
  // Define login_cpf = cpf para o medico e seta senha
  await client.query(
    'UPDATE funcionarios SET login_cpf = cpf, senha = $1 WHERE is_medico = true',
    [hashMedico]
  );
  
  // Define admin_estrada_login_cpf e senha para admin do campo
  await client.query(
    'UPDATE funcionarios SET admin_estrada_login_cpf = cpf, admin_estrada_senha = $1 WHERE is_admin_estrada = true',
    [hashAdminEstrada]
  );
  
  const r = await client.query(
    'SELECT nome, cpf, login_cpf, admin_estrada_login_cpf, is_medico, is_admin_estrada FROM funcionarios WHERE is_medico = true OR is_admin_estrada = true'
  );
  console.log('Funcionarios especiais:', JSON.stringify(r.rows, null, 2));
  
  await client.end();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
