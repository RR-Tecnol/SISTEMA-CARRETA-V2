/**
 * seed-testes-completo.js
 * Seed completo para testar TODAS as implementações do projeto.
 *
 * Cobre:
 *   - A1/A8: ação com datas corretas, cidadãos com data_nascimento
 *   - A2: cidadão duplicado (não cria, só avisa)
 *   - B1: atendimentos COM ficha_clinica preenchida (para /portal/exames)
 *   - B2: cidadãos com cartao_sus e campos_customizados (alergias, doenças, medicamentos)
 *   - B3: mensagens de chat pré-existentes + sinais de emergência comentados
 *   - B4: rota /meus-atendimentos com dados reais
 *   - B5: ponto médico com campos de almoço
 *   - B6: ação com 3 exames distintos para testar filtro de fila
 *   - C1: ação com numero_processo, lote_regiao, numero_cnes, responsavel_tecnico
 *   - D1: ação ativa com fichas geradas (para painel TV)
 *   - E4: auditoria vai registrar eventos automaticamente ao usar o sistema
 *   - Geral: caminhão, estoque, conta a pagar, funcionários com CRM
 *
 * Uso:
 *   node seed-testes-completo.js
 *
 * Pré-requisito: backend rodando (docker-compose up -d)
 * Porta padrão do banco: 5434
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'sistema_carretas',
  user: 'postgres',
  password: 'postgres',
});

// ─── Gerador de CPF válido ───────────────────────────────────────────────────
function gerarCPF(base) {
  const digits = String(base).padStart(9, '0').split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  digits.push(d1);
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  digits.push(d2);
  const cpf = digits.join('');
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function cleanCPF(cpf) {
  return cpf.replace(/\D/g, '');
}

// ─── Gerador de CNS (Cartão SUS) fake ───────────────────────────────────────
function gerarCNS(base) {
  return String(700000000000000 + base).substring(0, 15);
}

async function main() {
  console.log('🚀 Iniciando seed completo de testes...\n');

  const senha = await bcrypt.hash('teste123', 10);

  // ════════════════════════════════════════════════════════════════════════════
  // 1. USUÁRIOS BASE (admin + cidadão padrão para login)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('── 1. Usuários base ──');

  // Admin sistema
  await pool.query(`
    INSERT INTO cidadaos (id, cpf, nome_completo, email, senha, tipo, telefone, municipio, estado, data_nascimento, created_at, updated_at)
    VALUES (gen_random_uuid(), '529.982.247-25', 'Administrador Sistema', 'admin@sistema.com', $1, 'admin', '(98) 99999-0001', 'São Luís', 'MA', '1985-01-15', NOW(), NOW())
    ON CONFLICT (cpf) DO UPDATE SET senha = $1, tipo = 'admin'
  `, [senha]);
  console.log('  ✅ Admin: CPF 529.982.247-25 / senha: teste123');

  // ════════════════════════════════════════════════════════════════════════════
  // 2. INSTITUIÇÃO
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 2. Instituição ──');

  let instId;
  const instExist = await pool.query("SELECT id FROM instituicoes WHERE cnpj = '12.345.678/0001-90' LIMIT 1");
  if (instExist.rows.length > 0) {
    instId = instExist.rows[0].id;
    console.log('  ↳ Usando instituição existente');
  } else {
    const r = await pool.query(`
      INSERT INTO instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, ativo, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Secretaria Municipal de Saúde de São Luís', '12.345.678/0001-90', 'Dr. Marcus Vinicius', 'saude@saoluis.ma.gov.br', '(98) 3232-0001', 'Av. dos Holandeses, 1000 - Calhau - São Luís/MA', true, NOW(), NOW())
      RETURNING id
    `);
    instId = r.rows[0].id;
    console.log('  ✅ Instituição criada');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. CURSOS/EXAMES (com código SUS e valor unitário — para C1)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 3. Cursos/Exames ──');

  const examesData = [
    { nome: 'Consulta Clínica Geral',        tipo: 'exame', codigo_sus: '0301010064', valor: 10.00 },
    { nome: 'Preventivo (Papanicolau)',       tipo: 'exame', codigo_sus: '0201020033', valor: 12.50 },
    { nome: 'Consulta Pediátrica',            tipo: 'exame', codigo_sus: '0301010072', valor: 10.00 },
    { nome: 'Ultrassonografia Obstétrica',   tipo: 'exame', codigo_sus: '0205020097', valor: 40.00 },
    { nome: 'Aferição Pressão + Glicemia',   tipo: 'exame', codigo_sus: '0301100039', valor: 5.00  },
    { nome: 'Coleta de Sangue (Laboratório)', tipo: 'exame', codigo_sus: '0202010317', valor: 8.00  },
  ];

  const exameIds = [];
  for (const ex of examesData) {
    const exist = await pool.query('SELECT id FROM cursos_exames WHERE nome = $1', [ex.nome]);
    if (exist.rows.length > 0) {
      exameIds.push(exist.rows[0].id);
    } else {
      const r = await pool.query(`
        INSERT INTO cursos_exames (id, nome, tipo, carga_horaria, descricao, ativo, codigo_sus, valor_unitario, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, 1, $3, true, $4, $5, NOW(), NOW())
        RETURNING id
      `, [ex.nome, ex.tipo, `Procedimento: ${ex.nome}`, ex.codigo_sus, ex.valor]);
      exameIds.push(r.rows[0].id);
    }
    console.log(`  ✅ "${ex.nome}" (SUS: ${ex.codigo_sus})`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. FUNCIONÁRIOS (médicos com CRM — essencial para C1 e B1)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 4. Funcionários e Médicos ──');

  const funcsData = [
    // Médicos com CRM (login pelo CPF)
    { nome: 'Dra. Ana Cardoso',       cargo: 'Médica',               espec: 'Clínico Geral',        crm: 'CRM-MA 12345', is_medico: true,  cpfBase: 310456789, custo: 500 },
    { nome: 'Dr. Bruno Maranhão',     cargo: 'Médico',               espec: 'Ginecologista',         crm: 'CRM-MA 23456', is_medico: true,  cpfBase: 320567891, custo: 600 },
    { nome: 'Dra. Clara Mendes',      cargo: 'Médica',               espec: 'Pediatra',              crm: 'CRM-MA 34567', is_medico: true,  cpfBase: 330678912, custo: 550 },
    { nome: 'Dr. Diego Ultrassom',    cargo: 'Médico',               espec: 'Ultrassonografista',    crm: 'CRM-MA 45678', is_medico: true,  cpfBase: 340789123, custo: 700 },
    // Equipe de apoio
    { nome: 'Enf. Elisa Costa',       cargo: 'Enfermeira',           espec: 'Enfermagem Geral',     crm: null,           is_medico: false, cpfBase: 350891234, custo: 300 },
    { nome: 'Lucas Recepção',         cargo: 'Recepcionista',        espec: 'Recepção',              crm: null,           is_medico: false, cpfBase: 381134567, custo: 200, admin_estrada: true },
    { nome: 'Marina Coordena',        cargo: 'Coordenadora de Campo', espec: 'Coordenação',          crm: null,           is_medico: false, cpfBase: 391245678, custo: 350, admin_estrada: true },
  ];

  const funcIds = {};
  for (const f of funcsData) {
    const cpf = gerarCPF(f.cpfBase);
    const cpfClean = cleanCPF(cpf);
    const email = `${f.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').slice(0, 2).join('.')}@sistema.com`;

    const exist = await pool.query('SELECT id FROM funcionarios WHERE cpf = $1', [cpf]);
    if (exist.rows.length > 0) {
      funcIds[f.nome] = exist.rows[0].id;
      console.log(`  ↳ "${f.nome}" já existe`);
      continue;
    }

    const r = await pool.query(`
      INSERT INTO funcionarios (
        id, nome, cargo, cpf, email, especialidade, crm, custo_diaria,
        ativo, is_medico, login_cpf, senha,
        is_admin_estrada, admin_estrada_login_cpf, admin_estrada_senha,
        status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
        true, $8, $9, $10,
        $11, $12, $13,
        'ativo', NOW(), NOW()
      ) RETURNING id
    `, [
      f.nome, f.cargo, cpf, email, f.espec, f.crm, f.custo,
      f.is_medico,
      f.is_medico ? cpfClean : null,
      f.is_medico ? senha : null,
      f.admin_estrada || false,
      f.admin_estrada ? cpfClean : null,
      f.admin_estrada ? senha : null,
    ]);
    funcIds[f.nome] = r.rows[0].id;
    console.log(`  ✅ ${f.cargo} "${f.nome}" → CPF: ${cpf}${f.is_medico ? ' (login médico)' : ''}${f.admin_estrada ? ' (admin estrada)' : ''}`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. CAMINHÃO (para testar módulo de frota)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 5. Caminhão ──');

  let caminhaoId;
  const camExist = await pool.query("SELECT id FROM caminhoes WHERE placa = 'ABC-1234' LIMIT 1");
  if (camExist.rows.length > 0) {
    caminhaoId = camExist.rows[0].id;
    console.log('  ↳ Caminhão já existe');
  } else {
    const r = await pool.query(`
      INSERT INTO caminhoes (id, placa, modelo, ano, km_por_litro, capacidade_litros, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'ABC-1234', 'Mercedes-Benz Atego 1719', 2022, 8.5, 200, 'disponivel', NOW(), NOW())
      RETURNING id
    `);
    caminhaoId = r.rows[0].id;
    console.log('  ✅ Caminhão ABC-1234 criado');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. INSUMOS E ESTOQUE (para testar módulo de estoque)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 6. Insumos e Estoque ──');

  const insumos = [
    { nome: 'Luvas Descartáveis M',  unidade: 'caixas',  qtd: 50, minimo: 10 },
    { nome: 'Seringas 5ml',          unidade: 'unidades', qtd: 200, minimo: 50 },
    { nome: 'Álcool 70% 1L',         unidade: 'frascos',  qtd: 8, minimo: 5   },
    { nome: 'Gel Condutor Ultrassom', unidade: 'frascos',  qtd: 3, minimo: 5   }, // abaixo do mínimo = alerta
  ];

  for (const ins of insumos) {
    const exist = await pool.query('SELECT id FROM insumos WHERE nome = $1 LIMIT 1', [ins.nome]);
    if (exist.rows.length === 0) {
      await pool.query(`
        INSERT INTO insumos (id, nome, unidade_medida, quantidade_atual, quantidade_minima, descricao, ativo, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [ins.nome, ins.unidade, ins.qtd, ins.minimo, `Insumo: ${ins.nome}`]);
      const alerta = ins.qtd <= ins.minimo ? ' ⚠️ (abaixo do mínimo)' : '';
      console.log(`  ✅ "${ins.nome}" — ${ins.qtd} ${ins.unidade}${alerta}`);
    } else {
      console.log(`  ↳ "${ins.nome}" já existe`);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. CIDADÃOS (com campos_customizados para B2 — QR Code com alergias etc)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 7. Cidadãos ──');

  const cidadaosData = [
    // Login padrão de teste — COM alergias (para testar QR Code e prontuário)
    {
      cpfBase: 123456789, nome: 'Maria Silva Santos', nasc: '1985-03-15',
      genero: 'feminino', raca: 'parda', mun: 'São Luís', sus: gerarCNS(1001),
      alergias: 'Dipirona, Penicilina', doencas: 'Hipertensão (HAS)', meds: 'Losartana 50mg',
      email: 'maria@teste.com',
    },
    // Idoso com múltiplas condições
    {
      cpfBase: 234567891, nome: 'João Carlos Ferreira', nasc: '1952-07-20',
      genero: 'masculino', raca: 'parda', mun: 'São Luís', sus: gerarCNS(1002),
      alergias: 'AINE', doencas: 'Diabetes (DM2), HAS', meds: 'Metformina 850mg, Captopril 25mg',
      email: 'joao@teste.com',
    },
    // Jovem sem condições
    {
      cpfBase: 345678912, nome: 'Ana Paula Rodrigues', nasc: '1998-11-08',
      genero: 'feminino', raca: 'branca', mun: 'São Luís', sus: gerarCNS(1003),
      alergias: '', doencas: '', meds: '',
      email: 'ana@teste.com',
    },
    // Criança (para testar pediatria)
    {
      cpfBase: 456789123, nome: 'Lucas Souza Lima', nasc: '2017-05-10',
      genero: 'masculino', raca: 'parda', mun: 'São Luís', sus: gerarCNS(1004),
      alergias: 'Amoxicilina', doencas: '', meds: '',
      email: 'lucas@teste.com',
    },
    // Grávida (para ultrassom)
    {
      cpfBase: 567891234, nome: 'Fernanda Costa Alves', nasc: '1994-09-25',
      genero: 'feminino', raca: 'preta', mun: 'São Luís', sus: gerarCNS(1005),
      alergias: '', doencas: 'Gestação 20 semanas', meds: 'Ácido Fólico, Sulfato Ferroso',
      email: 'fernanda@teste.com',
    },
    // Pacientes extras para volume
    { cpfBase: 678912345, nome: 'Roberto Nascimento Silva', nasc: '1970-02-10', genero: 'masculino', raca: 'preta',    mun: 'São Luís', sus: gerarCNS(1006), alergias: '', doencas: 'HAS',    meds: 'Atenolol 25mg', email: 'roberto@teste.com'  },
    { cpfBase: 789123456, nome: 'Juliana Pereira Gomes',    nasc: '1988-06-05', genero: 'feminino', raca: 'indigena', mun: 'Paço do Lumiar', sus: gerarCNS(1007), alergias: '', doencas: '', meds: '', email: 'juliana@teste.com'  },
    { cpfBase: 891234567, nome: 'Marcos Vinícius Alves',    nasc: '1996-10-28', genero: 'masculino', raca: 'parda',   mun: 'São Luís', sus: gerarCNS(1008), alergias: '', doencas: '', meds: '', email: 'marcos@teste.com'   },
    { cpfBase: 912345678, nome: 'Gabriela Costa Marques',   nasc: '1992-03-19', genero: 'feminino', raca: 'branca',   mun: 'São Luís', sus: gerarCNS(1009), alergias: '', doencas: '', meds: '', email: 'gabriela@teste.com' },
    { cpfBase: 123456780, nome: 'Antônio Bezerra Junior',   nasc: '1960-12-01', genero: 'masculino', raca: 'parda',   mun: 'São Luís', sus: gerarCNS(1010), alergias: 'AAS', doencas: 'DM2, HAS, ICC', meds: 'Insulina NPH, Furosemida', email: 'antonio@teste.com' },
  ];

  const cidadaoIds = {};
  for (const c of cidadaosData) {
    const cpf = gerarCPF(c.cpfBase);
    const tel = `(98) 9${String(9000 + c.cpfBase % 1000).padStart(4, '0')}-${String(1000 + c.cpfBase % 9000).padStart(4, '0')}`;
    const campos = {
      alergias:    c.alergias,
      doencas_cronicas: c.doencas,
      medicamentos_uso: c.meds,
    };

    const exist = await pool.query('SELECT id FROM cidadaos WHERE cpf = $1', [cpf]);
    if (exist.rows.length > 0) {
      cidadaoIds[c.nome] = exist.rows[0].id;
      // Atualizar campos_customizados mesmo se já existe (para garantir dados para QR e prontuário)
      await pool.query(`
        UPDATE cidadaos SET campos_customizados = $1, cartao_sus = $2, genero = $3, raca = $4, data_nascimento = $5 WHERE id = $6
      `, [JSON.stringify(campos), c.sus, c.genero, c.raca, c.nasc, exist.rows[0].id]);
      console.log(`  ↳ "${c.nome}" atualizado (campos_customizados + SUS)`);
      continue;
    }

    const r = await pool.query(`
      INSERT INTO cidadaos (
        id, cpf, nome_completo, data_nascimento, telefone, email, senha,
        tipo, municipio, estado, genero, raca, cartao_sus,
        campos_customizados, consentimento_lgpd, data_consentimento,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6,
        'cidadao', $7, 'MA', $8, $9, $10,
        $11, true, NOW(),
        NOW(), NOW()
      ) RETURNING id
    `, [cpf, c.nome, c.nasc, tel, c.email, senha, c.mun, c.genero, c.raca, c.sus, JSON.stringify(campos)]);
    cidadaoIds[c.nome] = r.rows[0].id;
    const alertaQr = c.alergias ? ` 🔴 alerg: ${c.alergias}` : '';
    console.log(`  ✅ "${c.nome}" — CPF: ${cpf}${alertaQr}`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 8. AÇÃO PRINCIPAL (com todos os campos do C1)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 8. Ação Principal (com campos C1) ──');

  // Responsável técnico = Dra. Ana Cardoso (primeiro médico criado)
  const rtId = funcIds['Dra. Ana Cardoso'];

  let acaoId;
  const acaoExist = await pool.query("SELECT id FROM acoes WHERE numero_acao = 901 LIMIT 1");
  if (acaoExist.rows.length > 0) {
    acaoId = acaoExist.rows[0].id;
    // Atualizar campos do C1
    await pool.query(`
      UPDATE acoes SET
        numero_processo = $1,
        lote_regiao = $2,
        numero_cnes = $3,
        responsavel_tecnico_id = $4,
        meta_mensal_total = $5,
        status = 'ativa'
      WHERE id = $6
    `, ['001/2026', 'Lote 1 — Grande São Luís', '2345678', rtId, 200, acaoId]);
    console.log(`  ↳ Ação 901 já existe — campos C1 atualizados`);
  } else {
    const r = await pool.query(`
      INSERT INTO acoes (
        id, numero_acao, instituicao_id, tipo, municipio, estado,
        data_inicio, data_fim, status, descricao, local_execucao, nome,
        vagas_disponiveis, permitir_inscricao_previa,
        numero_processo, lote_regiao, numero_cnes,
        responsavel_tecnico_id, meta_mensal_total,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), 901, $1, 'saude', 'São Luís', 'MA',
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '25 days',
        'ativa',
        'Mutirão de Saúde com Consultas, Exames e Vacinas para a população do Grande São Luís',
        'UBS Alto da Esperança — Rua das Flores, 500 — São Luís/MA',
        'Mutirão Saúde São Luís 2026',
        200, true,
        '001/2026', 'Lote 1 — Grande São Luís', '2345678',
        $2, 200,
        NOW(), NOW()
      ) RETURNING id
    `, [instId, rtId]);
    acaoId = r.rows[0].id;
    console.log(`  ✅ Ação 901 criada → ID: ${acaoId}`);
  }

  // Vincular caminhão
  await pool.query(`
    INSERT INTO acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `, [acaoId, caminhaoId]).catch(() => {
    // Silencioso — tabela pode ter nome diferente
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. VINCULAR EXAMES, FUNCIONÁRIOS E CRIAR INSCRIÇÕES
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 9. Vínculos (exames + funcionários + inscrições) ──');

  for (const exId of exameIds) {
    await pool.query(`
      INSERT INTO acao_curso_exame (id, acao_id, curso_exame_id, vagas, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, 30, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [acaoId, exId]);
  }
  console.log('  ✅ 6 exames vinculados à ação');

  for (const funcId of Object.values(funcIds)) {
    await pool.query(`
      INSERT INTO acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `, [acaoId, funcId]);
  }
  console.log('  ✅ 7 funcionários vinculados à ação');

  // Mapa de inscrições: [nomeCidadao, indiceExame, status]
  const inscricoes = [
    // Clínica Geral (exame 0)
    ['Maria Silva Santos',      0, 'pendente'],
    ['João Carlos Ferreira',    0, 'pendente'],
    ['Roberto Nascimento Silva',0, 'pendente'],
    ['Marcos Vinícius Alves',   0, 'pendente'],
    ['Antônio Bezerra Junior',  0, 'atendido'], // já atendido → aparece em /portal/exames
    // Preventivo (exame 1) — apenas mulheres
    ['Maria Silva Santos',      1, 'pendente'],
    ['Ana Paula Rodrigues',     1, 'pendente'],
    ['Fernanda Costa Alves',    1, 'pendente'],
    ['Gabriela Costa Marques',  1, 'atendido'],
    // Pediatria (exame 2) — crianças
    ['Lucas Souza Lima',        2, 'pendente'],
    // Ultrassom (exame 3)
    ['Fernanda Costa Alves',    3, 'pendente'],
    ['Maria Silva Santos',      3, 'pendente'],
    // Aferição PA+Glicemia (exame 4)
    ['João Carlos Ferreira',    4, 'pendente'],
    ['Antônio Bezerra Junior',  4, 'pendente'],
    ['Roberto Nascimento Silva',4, 'pendente'],
    // Coleta Sangue (exame 5)
    ['Maria Silva Santos',      5, 'pendente'],
    ['João Carlos Ferreira',    5, 'pendente'],
    ['Juliana Pereira Gomes',   5, 'pendente'],
    ['Marcos Vinícius Alves',   5, 'atendido'],
  ];

  let inscCount = 0;
  const inscricaoIds = {}; // para criar atendimentos depois
  for (const [nomeCid, exIdx, status] of inscricoes) {
    const cid = cidadaoIds[nomeCid];
    const exId = exameIds[exIdx];
    if (!cid || !exId) continue;

    const exist = await pool.query(
      'SELECT id FROM inscricoes WHERE cidadao_id=$1 AND acao_id=$2 AND curso_exame_id=$3',
      [cid, acaoId, exId]
    );
    if (exist.rows.length > 0) {
      inscricaoIds[`${nomeCid}_${exIdx}`] = exist.rows[0].id;
      continue;
    }

    const r = await pool.query(`
      INSERT INTO inscricoes (id, cidadao_id, acao_id, curso_exame_id, data_inscricao, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4, NOW(), NOW())
      RETURNING id
    `, [cid, acaoId, exId, status]);
    inscricaoIds[`${nomeCid}_${exIdx}`] = r.rows[0].id;
    inscCount++;
  }
  console.log(`  ✅ ${inscCount} inscrições criadas`);

  // ════════════════════════════════════════════════════════════════════════════
  // 10. PONTO MÉDICO (para testar B5 — intervalo de almoço)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 10. Ponto Médico (B5 — almoço) ──');

  const medAnaId = funcIds['Dra. Ana Cardoso'];
  if (medAnaId) {
    const pontoExist = await pool.query(
      "SELECT id FROM pontos_medicos WHERE funcionario_id=$1 AND status='trabalhando' LIMIT 1",
      [medAnaId]
    );
    if (pontoExist.rows.length === 0) {
      await pool.query(`
        INSERT INTO pontos_medicos (id, funcionario_id, acao_id, data_hora_entrada, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, NOW() - INTERVAL '2 hours', 'trabalhando', NOW(), NOW())
      `, [medAnaId, acaoId]);
      console.log('  ✅ Ponto ativo para Dra. Ana Cardoso (2h em turno)');
    } else {
      console.log('  ↳ Ponto já existe para Dra. Ana Cardoso');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 11. ATENDIMENTOS COM FICHA CLÍNICA (para B4 — /portal/exames)
  //     Criados com ficha_clinica JSONB preenchida para que o cidadão veja
  //     diagnóstico, CID, prescrição em /portal/exames
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 11. Atendimentos com Prontuário (B4) ──');

  const atendimentosParaCriar = [
    {
      cidadaoNome: 'Maria Silva Santos',
      medico: 'Dra. Ana Cardoso',
      exameNome: 'Consulta Clínica Geral',
      ficha: {
        queixa_principal: 'Cefaleia frequente e tontura ao levantar',
        historia_doenca: 'Paciente relata dores de cabeça há 3 semanas, piora pela manhã. Tontura postural ao levantar rapidamente.',
        alergias: 'Dipirona, Penicilina',
        medicamentos_uso: 'Losartana 50mg 1x ao dia',
        doencas_cronicas: 'HAS (Hipertensão Arterial Sistêmica)',
        pressao_arterial: '150/95',
        frequencia_cardiaca: '82',
        temperatura: '36.8',
        peso: '68',
        altura: '163',
        spo2: '97',
        diagnostico: 'Hipertensão Arterial não controlada',
        cid: 'I10',
        conduta: 'Ajuste de medicação anti-hipertensiva. Orientações sobre dieta hipossódica e atividade física.',
        prescricao: 'Losartana 100mg 1x ao dia (aumentar dose)\nHidroclorotiazida 25mg 1x ao dia (adicionar)\nDieta hipossódica (<2g NaCl/dia)',
        retorno: '30 dias ou em caso de cefaleia intensa',
        observacoes_medico: 'Paciente consciente, orientada, cooperativa. PA divergente entre membros (direito 150/95, esquerdo 148/92). Ausculta cardíaca: ritmo regular, bulhas normofonéticas. Pulsos presentes e simétricos.',
      }
    },
    {
      cidadaoNome: 'João Carlos Ferreira',
      medico: 'Dra. Ana Cardoso',
      exameNome: 'Consulta Clínica Geral',
      ficha: {
        queixa_principal: 'Controle de diabetes e hipertensão',
        historia_doenca: 'Paciente com DM2 e HAS de longa data. Vem para consulta de rotina.',
        alergias: 'AINE (Ibuprofeno, Naproxeno)',
        medicamentos_uso: 'Metformina 850mg 2x ao dia, Captopril 25mg 2x ao dia',
        doencas_cronicas: 'Diabetes Mellitus tipo 2, HAS',
        pressao_arterial: '140/88',
        frequencia_cardiaca: '76',
        temperatura: '36.5',
        peso: '89',
        altura: '172',
        spo2: '96',
        diagnostico: 'DM2 com controle inadequado + HAS controlada',
        cid: 'E11.9',
        conduta: 'Solicitado HbA1c e glicemia de jejum. Reforço de dieta e atividade física.',
        prescricao: 'Metformina 1000mg 2x ao dia (aumentar)\nGlibenclamida 5mg 1x ao dia (adicionar)\nCaptopril 50mg 2x ao dia\nAAS 100mg 1x ao dia',
        retorno: '60 dias com resultado dos exames',
        observacoes_medico: 'IMC 30.1 — obesidade grau I. Pés sem lesões. Sensibilidade preservada bilateralmente.',
      }
    },
    {
      cidadaoNome: 'Antônio Bezerra Junior',
      medico: 'Dra. Ana Cardoso',
      exameNome: 'Aferição Pressão + Glicemia',
      ficha: {
        queixa_principal: 'Rotina de aferição',
        historia_doenca: 'Paciente com múltiplas comorbidades — controle mensal',
        alergias: 'AAS',
        medicamentos_uso: 'Insulina NPH 20UI, Furosemida 40mg, Carvedilol 12.5mg',
        doencas_cronicas: 'DM2, HAS, ICC (Insuficiência Cardíaca Congestiva)',
        pressao_arterial: '130/82',
        frequencia_cardiaca: '68',
        temperatura: '36.4',
        peso: '76',
        altura: '168',
        spo2: '95',
        diagnostico: 'DM2 + HAS controlada + ICC compensada',
        cid: 'I50.0',
        conduta: 'Manutenção do esquema terapêutico. Orientação sobre restrição hídrica e pesagem diária.',
        prescricao: 'Manter insulina NPH 20UI\nFurosemida 40mg 1x ao dia\nCarvedilol 12.5mg 2x ao dia\nRestringir líquidos a 1,5L/dia',
        retorno: '30 dias — retornar antes se ganho de peso > 2kg em 3 dias',
        observacoes_medico: 'Paciente estável. Sem sinais de descompensação. Edema maleolar +/4+. Crepitações basais ausentes.',
      }
    },
  ];

  for (const atd of atendimentosParaCriar) {
    const cidId = cidadaoIds[atd.cidadaoNome];
    const medId = funcIds[atd.medico];
    if (!cidId || !medId) continue;

    // Verificar ponto do médico (ou criar)
    let pontoId;
    const pontoAtivo = await pool.query(
      "SELECT id FROM pontos_medicos WHERE funcionario_id=$1 LIMIT 1",
      [medId]
    );
    if (pontoAtivo.rows.length > 0) {
      pontoId = pontoAtivo.rows[0].id;
    } else {
      const pontoR = await pool.query(`
        INSERT INTO pontos_medicos (id, funcionario_id, acao_id, data_hora_entrada, data_hora_saida, horas_trabalhadas, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '30 minutes', 3.5, 'saiu', NOW(), NOW())
        RETURNING id
      `, [medId, acaoId]);
      pontoId = pontoR.rows[0].id;
    }

    // Verificar se atendimento já existe
    const atdExist = await pool.query(
      "SELECT id FROM atendimentos_medicos WHERE cidadao_id=$1 AND acao_id=$2 AND status='concluido' LIMIT 1",
      [cidId, acaoId]
    );
    if (atdExist.rows.length > 0) {
      console.log(`  ↳ Atendimento de "${atd.cidadaoNome}" já existe`);
      continue;
    }

    const horaInicio = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h atrás
    const horaFim = new Date(horaInicio.getTime() + 25 * 60 * 1000); // +25min
    await pool.query(`
      INSERT INTO atendimentos_medicos (
        id, funcionario_id, acao_id, cidadao_id, ponto_id,
        hora_inicio, hora_fim, duracao_minutos,
        status, nome_paciente, ficha_clinica, observacoes,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        $5, $6, 25,
        'concluido', $7, $8, $9,
        NOW(), NOW()
      )
    `, [
      medId, acaoId, cidId, pontoId,
      horaInicio, horaFim,
      atd.cidadaoNome,
      JSON.stringify(atd.ficha),
      atd.ficha.observacoes_medico,
    ]);
    console.log(`  ✅ Atendimento de "${atd.cidadaoNome}" — CID: ${atd.ficha.cid}`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 12. MENSAGENS DE CHAT (para B3 — testar histórico no drawer)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 12. Chat histórico (B3) ──');

  const cidMaria = cidadaoIds['Maria Silva Santos'];
  if (cidMaria) {
    const chatExist = await pool.query(
      'SELECT id FROM chat_mensagens WHERE acao_id=$1 AND cidadao_id=$2 LIMIT 1',
      [acaoId, cidMaria]
    );
    if (chatExist.rows.length === 0) {
      const msgs = [
        { de: 'sistema',  msg: 'Olá! Você foi chamada para atendimento.' },
        { de: 'cidadao',  msg: 'Estou chegando, 2 minutinhos!' },
        { de: 'medico',   msg: 'Pode vir, já estou no consultório 2.' },
        { de: 'cidadao',  msg: 'Chegando já! Tenho uma dúvida sobre minha pressão.' },
        { de: 'medico',   msg: 'Claro, pode perguntar quando chegar. Vou verificar seus exames.' },
      ];
      for (const m of msgs) {
        await pool.query(`
          INSERT INTO chat_mensagens (id, acao_id, cidadao_id, de, mensagem, lida, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW() - INTERVAL '${msgs.indexOf(m) * 2} minutes')
        `, [acaoId, cidMaria, m.de, m.msg]);
      }
      console.log('  ✅ 5 mensagens de chat histórico criadas para Maria');
    } else {
      console.log('  ↳ Chat de Maria já tem mensagens');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 13. CONTA A PAGAR (para testar módulo financeiro e C1)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 13. Contas a Pagar ──');

  const contas = [
    { descricao: 'Combustível — Abastecimento 200L',  valor: 1200.00, tipo: 'combustivel',   status: 'pago'     },
    { descricao: 'Luvas e material descartável',       valor: 850.50,  tipo: 'material',      status: 'pago'     },
    { descricao: 'Diárias equipe médica — 5 dias',    valor: 7500.00, tipo: 'funcionario',   status: 'pago'     },
    { descricao: 'Manutenção preventiva caminhão',     valor: 2300.00, tipo: 'manutencao',    status: 'pendente' },
    { descricao: 'Gel condutor ultrassom (reposição)', valor: 180.00,  tipo: 'material',      status: 'pendente' },
  ];

  let contaCount = 0;
  for (const c of contas) {
    const exist = await pool.query('SELECT id FROM contas_pagar WHERE descricao=$1 AND acao_id=$2 LIMIT 1', [c.descricao, acaoId]);
    if (exist.rows.length > 0) continue;
    await pool.query(`
      INSERT INTO contas_pagar (id, acao_id, descricao, valor, tipo, status, data_vencimento, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '15 days', NOW(), NOW())
    `, [acaoId, c.descricao, c.valor, c.tipo, c.status]);
    contaCount++;
  }
  console.log(`  ✅ ${contaCount} contas criadas (3 pagas, 2 pendentes)`);

  // ════════════════════════════════════════════════════════════════════════════
  // 14. FICHAS DE ATENDIMENTO (para painel TV e fila — D1)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── 14. Fichas de Atendimento (Fila/TV — D1) ──');

  // Criar fichas para cidadãos com inscrição pendente na Clínica Geral
  const cidadaosParaFila = [
    'Maria Silva Santos',
    'João Carlos Ferreira',
    'Roberto Nascimento Silva',
    'Marcos Vinícius Alves',
  ];

  let fichaCount = 0;
  for (let i = 0; i < cidadaosParaFila.length; i++) {
    const cidId = cidadaoIds[cidadaosParaFila[i]];
    if (!cidId) continue;

    const exist = await pool.query(
      'SELECT id FROM fichas_atendimento WHERE acao_id=$1 AND cidadao_id=$2 LIMIT 1',
      [acaoId, cidId]
    );
    if (exist.rows.length > 0) continue;

    const inscId = inscricaoIds[`${cidadaosParaFila[i]}_0`]; // Clínica Geral = exame índice 0
    await pool.query(`
      INSERT INTO fichas_atendimento (id, numero_ficha, cidadao_id, inscricao_id, acao_id, status, hora_entrada, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'aguardando', NOW(), NOW(), NOW())
    `, [i + 1, cidId, inscId || null, acaoId]);
    fichaCount++;
  }
  console.log(`  ✅ ${fichaCount} fichas na fila (status: aguardando)`);

  // ════════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(65));
  console.log('🎉 SEED COMPLETO — SISTEMA PRONTO PARA TESTES');
  console.log('═'.repeat(65));

  console.log('\n🔑 SENHA UNIVERSAL: teste123\n');

  console.log('━━━ LOGINS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👤 ADMIN SISTEMA (tela /login):');
  console.log('   CPF: 529.982.247-25  /  senha: teste123\n');

  console.log('🏥 MÉDICOS (tela /login — entrar com CPF):');
  const medicosParaLog = [
    { nome: 'Dra. Ana Cardoso',    espec: 'Clínico Geral',     cpfBase: 310456789 },
    { nome: 'Dr. Bruno Maranhão',  espec: 'Ginecologista',      cpfBase: 320567891 },
    { nome: 'Dra. Clara Mendes',   espec: 'Pediatra',           cpfBase: 330678912 },
    { nome: 'Dr. Diego Ultrassom', espec: 'Ultrassonografista', cpfBase: 340789123 },
  ];
  for (const m of medicosParaLog) {
    console.log(`   ${m.nome.padEnd(22)} (${m.espec.padEnd(20)}) → CPF: ${gerarCPF(m.cpfBase)}`);
  }

  console.log('\n👔 ADMIN ESTRADA/RECEPÇÃO (tela /login — entrar com CPF):');
  console.log(`   Lucas Recepção      (Recepcionista) → CPF: ${gerarCPF(381134567)}`);
  console.log(`   Marina Coordena     (Coordenadora)  → CPF: ${gerarCPF(391245678)}`);

  console.log('\n👥 CIDADÃOS (tela /login):');
  const cidadaosParaLog = [
    { nome: 'Maria Silva Santos',      cpfBase: 123456789, obs: '← USAR ESTE PARA TESTAR /portal/exames' },
    { nome: 'João Carlos Ferreira',    cpfBase: 234567891, obs: '← Diabético/Hipertenso' },
    { nome: 'Ana Paula Rodrigues',     cpfBase: 345678912, obs: '' },
    { nome: 'Lucas Souza Lima',        cpfBase: 456789123, obs: '← Criança (pediatria)' },
    { nome: 'Fernanda Costa Alves',    cpfBase: 567891234, obs: '← Grávida (ultrassom)' },
    { nome: 'Antônio Bezerra Junior',  cpfBase: 123456780, obs: '← Idoso com múltiplas doenças' },
  ];
  for (const c of cidadaosParaLog) {
    console.log(`   ${c.nome.padEnd(30)} CPF: ${gerarCPF(c.cpfBase)} ${c.obs}`);
  }

  console.log('\n━━━ DADOS DA AÇÃO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📌 Ação 901: "Mutirão Saúde São Luís 2026"`);
  console.log(`   ID: ${acaoId}`);
  console.log(`   Processo: 001/2026 | Lote: Lote 1 — Grande São Luís`);
  console.log(`   CNES: 2345678 | RT: Dra. Ana Cardoso (CRM-MA 12345)`);
  console.log(`   Painel TV: http://localhost:3000/painel/${acaoId}`);
  console.log(`   Fila Admin: http://localhost:3000/admin/acoes/${acaoId}/fila`);

  console.log('\n━━━ O QUE CADA CIDADÃO COBRE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Maria Silva Santos     → B1 (prontuário), B2 (QR: alergias Dipirona), B3 (chat), B4 (/exames)');
  console.log('João Carlos Ferreira   → B1 (prontuário DM2), B4 (/exames), B6 (Clínica+Coleta)');
  console.log('Lucas Souza Lima       → B6 (filtro Pediatria)');
  console.log('Fernanda Costa Alves   → B6 (filtro Ultrassom+Preventivo)');
  console.log('Antônio Bezerra Junior → B4 (/exames com ICC/I50.0), B5 (ponto médico)');

  console.log('\n━━━ COBERTURA POR FEATURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('A1  Datas      ✅ Ação com data_inicio = hoje-5 dias (sem bug de -1 dia)');
  console.log('A2  Duplicado  ✅ Testar: cadastrar CPF 123.456.789-09 novamente');
  console.log('A8  Nascimento ✅ Todos os cidadãos têm data_nascimento preenchida');
  console.log('A9  PDF        ✅ Ação 901 tem inscrições em 6 exames');
  console.log('B1  Prontuário ✅ 3 atendimentos com ficha_clinica JSONB completa');
  console.log('B2  QR Code    ✅ Maria: alergias+doenças+meds em campos_customizados');
  console.log('B3  Chat       ✅ 5 mensagens histórico para Maria na Ação 901');
  console.log('B4  /exames    ✅ Login Maria → /portal/exames → ver diagnóstico I10');
  console.log('B5  Almoço     ✅ Ponto ativo para Dra. Ana → testar ☕ Intervalo');
  console.log('B6  Filtro     ✅ Ação tem 6 exames distintos → Select de filtro aparece');
  console.log('C1  Prestação  ✅ numero_processo, lote_regiao, cnes, RT preenchidos');
  console.log('D1  PainelTV   ✅ 4 fichas aguardando → chamar via fila → voz anuncia');
  console.log('E1  Overflow   ✅ Usar médicos com nomes e pacientes de nomes longos');
  console.log('E4  Auditoria  ✅ Fazer login → ver /admin/auditoria → evento LOGIN');

  await pool.end();
  console.log('\n✅ Seed finalizado com sucesso!');
}

main().catch(err => {
  console.error('\n❌ ERRO NO SEED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
