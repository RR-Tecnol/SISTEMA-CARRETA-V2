const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ host: 'localhost', port: 5434, database: 'sistema_carretas', user: 'postgres', password: 'postgres' });

(async () => {
  const hash = await bcrypt.hash('teste123', 10);
  
  // Atualizar senha de TODOS (sem alterar nada mais)
  const r1 = await pool.query("UPDATE cidadaos SET senha = $1 RETURNING cpf, nome_completo, tipo", [hash]);
  console.log('✅ Cidadãos atualizados:', r1.rows);
  
  const r2 = await pool.query("UPDATE funcionarios SET senha = $1 WHERE login_cpf IS NOT NULL RETURNING cpf, nome, login_cpf", [hash]);
  console.log('✅ Médicos atualizados:', r2.rows);
  
  await pool.end();
  console.log('\n🔑 Todas as senhas foram definidas para: teste123');
})();
