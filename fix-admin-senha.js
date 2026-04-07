const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'sistema_carretas',
  user: 'postgres',
  password: 'postgres',
});

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log('Hash gerado:', hash);
  
  const result = await pool.query(
    "UPDATE cidadaos SET senha = $1 WHERE cpf = '123.456.789-09' RETURNING cpf, tipo",
    [hash]
  );
  console.log('Atualizado:', result.rows);
  
  // Verificar
  const check = await pool.query("SELECT cpf, tipo, senha FROM cidadaos WHERE cpf = '123.456.789-09'");
  const row = check.rows[0];
  const valid = await bcrypt.compare('admin123', row.senha);
  console.log('Senha válida:', valid);
  
  await pool.end();
}

main().catch(console.error);
