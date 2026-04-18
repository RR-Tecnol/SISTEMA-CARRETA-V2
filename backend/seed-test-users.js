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
  const senha = await bcrypt.hash('teste123', 10);
  
  // 1. Admin — CPF válido: 529.982.247-25
  await pool.query(`
    INSERT INTO cidadaos (id, cpf, nome_completo, email, senha, tipo, telefone, municipio, estado, created_at, updated_at)
    VALUES (gen_random_uuid(), '529.982.247-25', 'Admin Sistema', 'admin@teste.com', $1, 'admin', '(11) 99999-0001', 'São Paulo', 'SP', NOW(), NOW())
    ON CONFLICT (cpf) DO UPDATE SET senha = $1
  `, [senha]);
  console.log('✅ Admin criado: CPF 529.982.247-25 / senha: teste123');

  // 2. Cidadão — CPF válido: 123.456.789-09
  await pool.query(`
    INSERT INTO cidadaos (id, cpf, nome_completo, email, senha, tipo, telefone, municipio, estado, data_nascimento, cartao_sus, genero, created_at, updated_at)
    VALUES (gen_random_uuid(), '123.456.789-09', 'Maria Silva Santos', 'maria@teste.com', $1, 'cidadao', '(11) 99999-0002', 'São Paulo', 'SP', '1985-03-15', '123456789012345', 'feminino', NOW(), NOW())
    ON CONFLICT (cpf) DO UPDATE SET senha = $1
  `, [senha]);
  console.log('✅ Cidadão criado: CPF 123.456.789-09 / senha: teste123');

  // 3. Médico — CPF válido: 987.654.321-00
  await pool.query(`DELETE FROM funcionarios WHERE cpf = '987.654.321-00'`);
  await pool.query(`
    INSERT INTO funcionarios (id, nome, cargo, cpf, email, especialidade, crm, custo_diaria, ativo, is_medico, login_cpf, senha, telefone, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Dr. Carlos Mendes', 'Médico', '987.654.321-00', 'carlos@teste.com', 'Clínico Geral', 'CRM-SP 12345', 500, true, true, '987.654.321-00', $1, '(11) 99999-0003', NOW(), NOW())
  `, [senha]);
  console.log('✅ Médico criado: CPF 987.654.321-00 / senha: teste123');

  // Limpar CPFs inválidos antigos
  await pool.query(`DELETE FROM cidadaos WHERE cpf IN ('111.111.111-11','222.222.222-22')`);
  await pool.query(`DELETE FROM funcionarios WHERE cpf IN ('333.333.333-33','444.444.444-44')`);

  const cidadaos = await pool.query("SELECT cpf, nome_completo, tipo FROM cidadaos ORDER BY tipo");
  console.log('\n📋 Cidadãos:', cidadaos.rows);

  const funcs = await pool.query("SELECT cpf, nome, cargo, is_medico FROM funcionarios");
  console.log('📋 Funcionários:', funcs.rows);

  await pool.end();
  console.log('\n🎉 Seed concluído!');
}

main().catch(console.error);
