const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'sistema_carretas',
  user: 'postgres',
  password: 'postgres',
});

// ─── Gerador de CPF válido ───
function gerarCPF(base) {
  const digits = String(base).padStart(9, '0').split('').map(Number);
  // Dígito 1
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  digits.push(d1);
  // Dígito 2
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  digits.push(d2);
  const cpf = digits.join('');
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

async function main() {
  const senha = await bcrypt.hash('teste123', 10);
  console.log('🔐 Hash gerado para senha "teste123"');

  // ─── 1. INSTITUIÇÃO (pega existente ou cria) ───
  let instResult = await pool.query("SELECT id FROM instituicoes LIMIT 1");
  let instituicaoId;
  if (instResult.rows.length > 0) {
    instituicaoId = instResult.rows[0].id;
    console.log('✅ Usando instituição existente:', instituicaoId);
  } else {
    instResult = await pool.query(`
      INSERT INTO instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, ativo, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Prefeitura Municipal de Teste', '12.345.678/0001-90', 'Secretário de Saúde', 'saude@prefeitura.gov.br', '(11) 3333-0001', 'Rua Central, 100 - Centro', true, NOW(), NOW())
      RETURNING id
    `);
    instituicaoId = instResult.rows[0].id;
    console.log('✅ Instituição criada:', instituicaoId);
  }

  // ─── 2. CURSOS/EXAMES (6 serviços) ───
  const exames = [
    { nome: 'Consulta Clínica Geral', tipo: 'exame', codigo_sus: '0301010064', valor: 10.00 },
    { nome: 'Preventivo (Papanicolau)', tipo: 'exame', codigo_sus: '0201020033', valor: 12.50 },
    { nome: 'Consulta Pediátrica', tipo: 'exame', codigo_sus: '0301010072', valor: 10.00 },
    { nome: 'Ultrassonografia Obstétrica', tipo: 'exame', codigo_sus: '0205020097', valor: 40.00 },
    { nome: 'Aferição Pressão + Glicemia', tipo: 'exame', codigo_sus: '0301100039', valor: 5.00 },
    { nome: 'Coleta de Sangue (Laboratório)', tipo: 'exame', codigo_sus: '0202010317', valor: 8.00 },
  ];

  const exameIds = [];
  for (const ex of exames) {
    const existing = await pool.query("SELECT id FROM cursos_exames WHERE nome = $1", [ex.nome]);
    if (existing.rows.length > 0) {
      exameIds.push(existing.rows[0].id);
      console.log(`  ↳ Exame "${ex.nome}" já existe`);
    } else {
      const r = await pool.query(`
        INSERT INTO cursos_exames (id, nome, tipo, carga_horaria, descricao, ativo, created_at, updated_at, codigo_sus, valor_unitario)
        VALUES (gen_random_uuid(), $1, $2, 1, $3, true, NOW(), NOW(), $4, $5)
        RETURNING id
      `, [ex.nome, ex.tipo, `Serviço de ${ex.nome}`, ex.codigo_sus, ex.valor]);
      exameIds.push(r.rows[0].id);
      console.log(`  ✅ Exame "${ex.nome}" criado`);
    }
  }
  console.log('✅ 6 cursos/exames prontos');

  // ─── 2.5 CAMINHÕES ───
  const caminhoes = [
    { placa: 'MED-2024', modelo: 'Carreta Médica Avançada', ano: 2024, cap: 200, km: 5.5 },
    { placa: 'ODO-2023', modelo: 'Carreta Odontológica', ano: 2023, cap: 150, km: 6.0 },
    { placa: 'IMG-2025', modelo: 'Carreta de Imagem', ano: 2025, cap: 250, km: 4.8 }
  ];
  let camCount = 0;
  for (const cam of caminhoes) {
    const existing = await pool.query("SELECT id FROM caminhoes WHERE placa=$1", [cam.placa]);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO caminhoes (id, placa, modelo, ano, capacidade_litros, km_por_litro, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'disponivel', NOW(), NOW())
      `, [cam.placa, cam.modelo, cam.ano, cam.cap, cam.km]);
      camCount++;
      console.log(`  ✅ Caminhão "${cam.modelo}" criado`);
    } else {
      console.log(`  ↳ Caminhão "${cam.modelo}" já existe`);
    }
  }
  console.log('✅ 3 caminhões prontos');

  // ─── 3. FUNCIONÁRIOS (10 profissionais) ───
  const funcionarios = [
    { nome: 'Dra. Ana Cardoso', cargo: 'Médica', espec: 'Clínico Geral', is_medico: true, crm: 'CRM-SP 45678', cpfBase: 310456789 },
    { nome: 'Dr. Bruno Lima', cargo: 'Médico', espec: 'Ginecologista', is_medico: true, crm: 'CRM-SP 56789', cpfBase: 320567891 },
    { nome: 'Dra. Clara Oliveira', cargo: 'Médica', espec: 'Pediatra', is_medico: true, crm: 'CRM-SP 67890', cpfBase: 330678912 },
    { nome: 'Dr. Diego Santos', cargo: 'Médico', espec: 'Ultrassonografista', is_medico: true, crm: 'CRM-SP 78901', cpfBase: 340789123 },
    { nome: 'Enf. Elisa Costa', cargo: 'Enfermeira', espec: 'Enfermagem', is_medico: false, crm: null, cpfBase: 350891234 },
    { nome: 'Téc. Fábio Alves', cargo: 'Técnico Enfermagem', espec: 'Enfermagem', is_medico: false, crm: null, cpfBase: 360912345 },
    { nome: 'Téc. Gisele Ramos', cargo: 'Técnica Enfermagem', espec: 'Coleta/Laboratório', is_medico: false, crm: null, cpfBase: 371023456 },
    { nome: 'Lucas Martins', cargo: 'Recepcionista', espec: 'Recepção', is_medico: false, crm: null, cpfBase: 381134567, admin_estrada: true },
    { nome: 'Marina Rocha', cargo: 'Coordenadora', espec: 'Coordenação', is_medico: false, crm: null, cpfBase: 391245678, admin_estrada: true },
    { nome: 'Renato Souza', cargo: 'Motorista', espec: 'Transporte', is_medico: false, crm: null, cpfBase: 401356789 },
  ];

  const funcIds = [];
  for (const f of funcionarios) {
    const cpf = gerarCPF(f.cpfBase);
    const cleanCpf = cpf.replace(/\D/g, '');
    const email = f.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).join('.') + '@sistema.com';

    const existing = await pool.query("SELECT id FROM funcionarios WHERE cpf = $1", [cpf]);
    if (existing.rows.length > 0) {
      funcIds.push(existing.rows[0].id);
      console.log(`  ↳ Func "${f.nome}" já existe`);
      continue;
    }

    const r = await pool.query(`
      INSERT INTO funcionarios (
        id, nome, cargo, cpf, email, especialidade, crm,
        custo_diaria, ativo, is_medico, login_cpf, senha,
        is_admin_estrada, admin_estrada_login_cpf, admin_estrada_senha,
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        $7, true, $8, $9, $10,
        $11, $12, $13,
        'ativo', NOW(), NOW()
      ) RETURNING id
    `, [
      f.nome, f.cargo, cpf, email, f.espec, f.crm,
      f.is_medico ? 500 : 200,
      f.is_medico,
      f.is_medico ? cleanCpf : null,
      f.is_medico ? senha : null,
      f.admin_estrada || false,
      f.admin_estrada ? cleanCpf : null,
      f.admin_estrada ? senha : null,
    ]);
    funcIds.push(r.rows[0].id);
    console.log(`  ✅ ${f.cargo} "${f.nome}" — CPF: ${cpf} ${f.is_medico ? '(login médico)' : ''} ${f.admin_estrada ? '(admin estrada)' : ''}`);
  }
  console.log('✅ 10 funcionários prontos');

  // ─── 4. CIDADÃOS (15 pacientes) ───
  const cidadaos = [
    { nome: 'Maria Aparecida Silva', nasc: '1965-03-12', genero: 'feminino', raca: 'parda', mun: 'São Paulo', cpfBase: 501111222 },
    { nome: 'José Carlos Ferreira', nasc: '1978-07-25', genero: 'masculino', raca: 'branca', mun: 'Guarulhos', cpfBase: 502222333 },
    { nome: 'Ana Paula Rodrigues', nasc: '1990-11-08', genero: 'feminino', raca: 'branca', mun: 'São Paulo', cpfBase: 503333444 },
    { nome: 'Francisco Oliveira Neto', nasc: '1955-01-30', genero: 'masculino', raca: 'preta', mun: 'Osasco', cpfBase: 504444555 },
    { nome: 'Letícia Santos Costa', nasc: '2000-05-17', genero: 'feminino', raca: 'parda', mun: 'São Paulo', cpfBase: 505555666 },
    { nome: 'Pedro Henrique Souza', nasc: '2015-09-03', genero: 'masculino', raca: 'branca', mun: 'Barueri', cpfBase: 506666777 },
    { nome: 'Sofia Mendes Lima', nasc: '2018-12-20', genero: 'feminino', raca: 'amarela', mun: 'São Paulo', cpfBase: 507777888 },
    { nome: 'Carlos Eduardo Ramos', nasc: '1982-04-14', genero: 'masculino', raca: 'parda', mun: 'Diadema', cpfBase: 508888999 },
    { nome: 'Fernanda Almeida Dias', nasc: '1995-08-22', genero: 'feminino', raca: 'branca', mun: 'São Paulo', cpfBase: 509999111 },
    { nome: 'Roberto Nascimento', nasc: '1970-02-10', genero: 'masculino', raca: 'preta', mun: 'Mauá', cpfBase: 511112222 },
    { nome: 'Juliana Pereira Gomes', nasc: '1988-06-05', genero: 'feminino', raca: 'indigena', mun: 'São Paulo', cpfBase: 512223333 },
    { nome: 'Marcos Vinícius Alves', nasc: '1998-10-28', genero: 'masculino', raca: 'parda', mun: 'Cotia', cpfBase: 513334444 },
    { nome: 'Gabriela Ferraz Costa', nasc: '1992-03-19', genero: 'feminino', raca: 'branca', mun: 'São Paulo', cpfBase: 514445555 },
    { nome: 'Antônio Silva Junior', nasc: '1960-12-01', genero: 'masculino', raca: 'parda', mun: 'Taboão da Serra', cpfBase: 515556666 },
    { nome: 'Beatriz Yamamoto', nasc: '2005-07-15', genero: 'feminino', raca: 'amarela', mun: 'São Paulo', cpfBase: 516667777 },
  ];

  const cidadaoIds = [];
  for (const c of cidadaos) {
    const cpf = gerarCPF(c.cpfBase);
    const email = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).join('.') + '@email.com';
    const tel = `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sus = String(Math.floor(100000000000000 + Math.random() * 900000000000000));

    const existing = await pool.query("SELECT id FROM cidadaos WHERE cpf = $1", [cpf]);
    if (existing.rows.length > 0) {
      cidadaoIds.push(existing.rows[0].id);
      console.log(`  ↳ Cidadão "${c.nome}" já existe`);
      continue;
    }

    const r = await pool.query(`
      INSERT INTO cidadaos (
        id, cpf, nome_completo, data_nascimento, telefone, email, senha,
        tipo, municipio, estado, genero, raca, cartao_sus,
        consentimento_lgpd, data_consentimento,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        'cidadao', $7, 'SP', $8, $9, $10,
        true, NOW(),
        NOW(), NOW()
      ) RETURNING id
    `, [cpf, c.nome, c.nasc, tel, email, senha, c.mun, c.genero, c.raca, sus]);
    cidadaoIds.push(r.rows[0].id);
    console.log(`  ✅ Cidadão "${c.nome}" — CPF: ${cpf}`);
  }
  console.log('✅ 15 cidadãos prontos');

  // ─── 5. AÇÃO ATIVA (1 ação completa) ───
  const numAcao = 900 + Math.floor(Math.random() * 99);
  const acaoResult = await pool.query(`
    INSERT INTO acoes (
      id, numero_acao, instituicao_id, tipo, municipio, estado,
      data_inicio, data_fim, status, descricao, local_execucao,
      vagas_disponiveis, nome, permitir_inscricao_previa,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $2, $1, 'saude', 'São Paulo', 'SP',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'ativa',
      'Ação de saúde completa com clínica geral, preventivo, pediatria, ultrassom, enfermagem e laboratório',
      'UBS Central - Rua Saúde, 500 - Centro',
      100, 'Ação Saúde Completa - Teste', true,
      NOW(), NOW()
    ) RETURNING id
  `, [instituicaoId, numAcao]);
  const acaoId = acaoResult.rows[0].id;
  console.log(`✅ Ação criada: ${acaoId}`);

  // ─── 6. VINCULAR CURSOS/EXAMES À AÇÃO ───
  for (let i = 0; i < exameIds.length; i++) {
    await pool.query(`
      INSERT INTO acao_curso_exame (id, acao_id, curso_exame_id, vagas, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [acaoId, exameIds[i], i < 4 ? 20 : 30]); // mais vagas para enfermagem e lab
  }
  console.log('✅ 6 cursos/exames vinculados à ação');

  // ─── 6.5 VINCULAR CAMINHÕES À AÇÃO ───
  for (const cam of caminhoes) {
    await pool.query(`
      INSERT INTO acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at)
      SELECT gen_random_uuid(), $1, id, NOW(), NOW() FROM caminhoes WHERE placa = $2
    `, [acaoId, cam.placa]);
  }
  console.log('✅ 3 caminhões vinculados à ação responsável');

  // ─── 7. VINCULAR FUNCIONÁRIOS À AÇÃO ───
  for (const funcId of funcIds) {
    await pool.query(`
      INSERT INTO acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [acaoId, funcId]);
  }
  console.log('✅ 10 funcionários vinculados à ação');

  // ─── 8. INSCREVER CIDADÃOS (distribuídos por exame) ───
  // Distribuição:
  // Clínica Geral (exame 0): cidadãos 0,1,2,7,9,13 (6 pacientes)
  // Preventivo (exame 1): cidadãos 2,4,8,10,12 (5 pacientes - mulheres)
  // Pediatria (exame 2): cidadãos 5,6,14 (3 pacientes - crianças/adolescentes)
  // Ultrassom (exame 3): cidadãos 4,8,12 (3 pacientes)
  // Aferição PA+Glic (exame 4): cidadãos 3,9,13 (3 pacientes - idosos)
  // Coleta Sangue (exame 5): cidadãos 0,1,3,7,10,11 (6 pacientes)

  const inscricaoMap = [
    // [cidadaoIndex, exameIndex, status]
    [0, 0, 'pendente'], [1, 0, 'pendente'], [2, 0, 'pendente'],
    [7, 0, 'pendente'], [9, 0, 'atendido'], [13, 0, 'atendido'],
    [2, 1, 'pendente'], [4, 1, 'pendente'], [8, 1, 'pendente'],
    [10, 1, 'pendente'], [12, 1, 'atendido'],
    [5, 2, 'pendente'], [6, 2, 'pendente'], [14, 2, 'pendente'],
    [4, 3, 'pendente'], [8, 3, 'pendente'], [12, 3, 'atendido'],
    [3, 4, 'pendente'], [9, 4, 'pendente'], [13, 4, 'atendido'],
    [0, 5, 'pendente'], [1, 5, 'pendente'], [3, 5, 'pendente'],
    [7, 5, 'pendente'], [10, 5, 'atendido'], [11, 5, 'pendente'],
  ];

  let inscCount = 0;
  for (const [ci, ei, status] of inscricaoMap) {
    if (!cidadaoIds[ci] || !exameIds[ei]) continue;
    // Check if already inscribed
    const existing = await pool.query(
      "SELECT id FROM inscricoes WHERE cidadao_id=$1 AND acao_id=$2 AND curso_exame_id=$3",
      [cidadaoIds[ci], acaoId, exameIds[ei]]
    );
    if (existing.rows.length > 0) continue;

    await pool.query(`
      INSERT INTO inscricoes (id, cidadao_id, acao_id, curso_exame_id, data_inscricao, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4, NOW(), NOW())
    `, [cidadaoIds[ci], acaoId, exameIds[ei], status]);
    inscCount++;
  }
  console.log(`✅ ${inscCount} inscrições criadas`);

  // ─── RESUMO FINAL ───
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SEED COMPLETO!');
  console.log('═'.repeat(60));
  console.log(`\n📌 Ação de teste: ${acaoId}`);
  console.log('\n🔐 Senha universal: teste123\n');
  console.log('👥 LOGINS MÉDICOS (na tela /login):');
  for (const f of funcionarios.filter(f => f.is_medico)) {
    const cpf = gerarCPF(f.cpfBase);
    console.log(`   ${f.nome} (${f.espec}) → CPF: ${cpf}`);
  }
  console.log('\n👔 LOGINS ADMIN ESTRADA (na tela /login):');
  for (const f of funcionarios.filter(f => f.admin_estrada)) {
    const cpf = gerarCPF(f.cpfBase);
    console.log(`   ${f.nome} (${f.espec}) → CPF: ${cpf}`);
  }
  console.log('\n🏥 ADMIN SISTEMA:');
  console.log('   Administrador do Sistema → CPF: 123.456.789-09');
  console.log('\n👤 CIDADÃOS (primeiros 5):');
  for (let i = 0; i < 5; i++) {
    const cpf = gerarCPF(cidadaos[i].cpfBase);
    console.log(`   ${cidadaos[i].nome} → CPF: ${cpf}`);
  }
  console.log(`   ... e mais ${cidadaos.length - 5} cidadãos`);

  console.log('\n📋 DISTRIBUIÇÃO POR EXAME:');
  console.log('   Clínica Geral: 6 inscritos (4 pendente, 2 atendido)');
  console.log('   Preventivo: 5 inscritos (4 pendente, 1 atendido)');
  console.log('   Pediatria: 3 inscritos (3 pendente)');
  console.log('   Ultrassom: 3 inscritos (2 pendente, 1 atendido)');
  console.log('   Aferição PA+Glic: 3 inscritos (2 pendente, 1 atendido)');
  console.log('   Coleta Sangue: 6 inscritos (4 pendente, 1 atendido, 1 pendente)');

  await pool.end();
}

main().catch(err => { console.error('❌ ERRO:', err); process.exit(1); });
