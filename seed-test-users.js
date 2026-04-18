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
  
  // 1. Admin (cidadão com tipo 'admin')
  await pool.query(`
    INSERT INTO cidadaos (id, cpf, nome_completo, email, senha, tipo, telefone, municipio, estado)
    VALUES (gen_random_uuid(), '111.111.111-11', 'Admin Sistema', 'admin@teste.com', $1, 'admin', '(11) 99999-0001', 'São Paulo', 'SP')
    ON CONFLICT (cpf) DO UPDATE SET senha = $1
  `, [senha]);
  console.log('✅ Admin criado: CPF 111.111.111-11 / senha: teste123');

  // 2. Cidadão comum
  await pool.query(`
    INSERT INTO cidadaos (id, cpf, nome_completo, email, senha, tipo, telefone, municipio, estado, data_nascimento, cartao_sus, genero)
    VALUES (gen_random_uuid(), '222.222.222-22', 'Maria Silva Santos', 'maria@teste.com', $1, 'cidadao', '(11) 99999-0002', 'São Paulo', 'SP', '1985-03-15', '123456789012345', 'feminino')
    ON CONFLICT (cpf) DO UPDATE SET senha = $1
  `, [senha]);
  console.log('✅ Cidadão criado: CPF 222.222.222-22 / senha: teste123');

  // 3. Médico (funcionário com is_medico = true)
  await pool.query(`
    INSERT INTO funcionarios (id, nome, cargo, cpf, email, especialidade, crm, custo_diaria, ativo, is_medico, login_cpf, senha, telefone)
    VALUES (gen_random_uuid(), 'Dr. Carlos Mendes', 'Médico', '333.333.333-33', 'carlos@teste.com', 'Clínico Geral', 'CRM-SP 12345', 500, true, true, '333.333.333-33', $1, '(11) 99999-0003')
    ON CONFLICT (cpf) DO UPDATE SET senha = $1
  `, [senha]);
  console.log('✅ Médico criado: CPF 333.333.333-33 / senha: teste123');

  // 4. Funcionário (recepção / admin estrada)
  await pool.query(`
    INSERT INTO funcionarios (id, nome, cargo, cpf, email, custo_diaria, ativo, is_medico, is_admin_estrada, admin_estrada_login_cpf, admin_estrada_senha, telefone)
    VALUES (gen_random_uuid(), 'Ana Recepção', 'Recepcionista', '444.444.444-44', 'ana@teste.com', 200, true, false, true, '444.444.444-44', $1, '(11) 99999-0004')
    ON CONFLICT (cpf) DO UPDATE SET admin_estrada_senha = $1
  `, [senha]);
  console.log('✅ Funcionário/Admin Estrada criado: CPF 444.444.444-44 / senha: teste123');

  // 5. Instituição (para referência)
  await pool.query(`
    INSERT INTO instituicoes (id, nome, tipo, cnpj, endereco, cidade, estado, telefone, email, ativo)
    VALUES (gen_random_uuid(), 'Prefeitura de São Paulo', 'prefeitura', '11.111.111/0001-11', 'Rua da Prefeitura, 100', 'São Paulo', 'SP', '(11) 3333-0001', 'contato@prefsp.gov.br', true)
    ON CONFLICT DO NOTHING
  `);
  console.log('✅ Instituição de teste criada');

  const cidadaos = await pool.query("SELECT cpf, nome_completo, tipo FROM cidadaos ORDER BY tipo");
  console.log('\n📋 Cidadãos:', cidadaos.rows);

  const funcs = await pool.query("SELECT cpf, nome, cargo, is_medico, is_admin_estrada FROM funcionarios");
  console.log('📋 Funcionários:', funcs.rows);

  await pool.end();
  console.log('\n🎉 Seed concluído!');
}

main().catch(console.error);
