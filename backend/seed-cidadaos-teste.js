/**
 * seed-cidadaos-teste.js
 * Cria 5 cidadãos fictícios, inscreve-os na ação DK 3 e gera fichas de atendimento.
 * Uso: node backend/seed-cidadaos-teste.js
 */
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const DB = { host: '127.0.0.1', port: 5434, database: 'sistema_carretas', user: 'postgres', password: 'postgres' };

const CIDADAOS = [
    { nome: 'Maria das Graças Silva', cpf: '98765432100', tel: '98991234501', nasc: '1975-03-15', genero: 'feminino', email: 'maria.gracas@teste.com' },
    { nome: 'Antonio Carlos Souza', cpf: '87654321099', tel: '98991234502', nasc: '1968-07-22', genero: 'masculino', email: 'antonio.souza@teste.com' },
    { nome: 'Francisca Oliveira Lima', cpf: '76543210988', tel: '98991234503', nasc: '1990-11-08', genero: 'feminino', email: 'francisca.lima@teste.com' },
    { nome: 'José Alves Pereira', cpf: '65432109877', tel: '98991234504', nasc: '1955-05-30', genero: 'masculino', email: 'jose.pereira@teste.com' },
    { nome: 'Ana Beatriz Costa', cpf: '54321098766', tel: '98991234505', nasc: '2001-01-14', genero: 'feminino', email: 'ana.costa@teste.com' },
];

// CPF para conta de login de cidadão (se já existe, apenas inscreve)
const CIDADAO_CONTA_TESTE_CPF = '12345678901';

async function main() {
    const c = new Client(DB);
    await c.connect();
    console.log('✅ Conectado ao banco\n');

    // 1. Encontrar ação DK3
    const acaoR = await c.query(
        `SELECT id, nome FROM acoes WHERE nome ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
        ['%DK 3%']
    );
    if (!acaoR.rows[0]) {
        console.log('❌ Ação DK3 não encontrada!');
        await c.end(); return;
    }
    const acao = acaoR.rows[0];
    console.log(`🎯 Ação: "${acao.nome}" (${acao.id})\n`);

    // 2. Pegar cursos/exames da ação
    const cursosR = await c.query(
        `SELECT ace.id as ace_id, ce.nome as ce_nome, ce.id as ce_id, ace.vagas
         FROM acao_curso_exame ace
         JOIN cursos_exames ce ON ce.id = ace.curso_exame_id
         WHERE ace.acao_id = $1`,
        [acao.id]
    );
    if (cursosR.rows.length === 0) {
        console.log('❌ Nenhum exame vinculado à ação DK3!');
        await c.end(); return;
    }
    console.log(`📋 Exames disponíveis:`);
    cursosR.rows.forEach(r => console.log(`   - ${r.ce_nome} (ace_id: ${r.ace_id})`));
    console.log();

    // 3. Verificar colunas da tabela cidadaos
    const colsR = await c.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'cidadaos' AND column_name IN ('senha','password_hash','genero','email','telefone') ORDER BY column_name`
    );
    const colunas = colsR.rows.map(r => r.column_name);
    console.log(`📊 Colunas disponíveis: ${colunas.join(', ')}\n`);

    const temGenero = colunas.includes('genero');
    const temEmail = colunas.includes('email');
    const temTelefone = colunas.includes('telefone');
    const temSenha = colunas.includes('senha');
    const temPasswordHash = colunas.includes('password_hash');

    // 4. Incluir cidadão de login no seed se existir
    let todosCidadaos = [...CIDADAOS];
    const contaTeste = await c.query(`SELECT id FROM cidadaos WHERE cpf = $1 LIMIT 1`, [CIDADAO_CONTA_TESTE_CPF]);
    if (contaTeste.rows[0]) {
        console.log(`ℹ️  Cidadão de teste (CPF ${CIDADAO_CONTA_TESTE_CPF}) já existe — será incluído nas inscrições`);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    let totalCriados = 0, totalInscritos = 0, totalFichas = 0;

    // Distribuir exames entre os cidadãos (round-robin)
    for (let i = 0; i < todosCidadaos.length; i++) {
        const cid = todosCidadaos[i];
        const exame = cursosR.rows[i % cursosR.rows.length];

        // Criar ou encontrar cidadão
        let cidadaoId;
        const existente = await c.query(`SELECT id FROM cidadaos WHERE cpf = $1`, [cid.cpf]);
        if (existente.rows[0]) {
            cidadaoId = existente.rows[0].id;
            console.log(`  ⚠️  Cidadão ${cid.nome} já existe (id: ${cidadaoId})`);
        } else {
            cidadaoId = uuidv4();
            const bcrypt = require('bcryptjs');
            const senhaHash = await bcrypt.hash('Teste@123', 10);

            const insertCols = ['id', 'nome_completo', 'cpf', 'data_nascimento', 'municipio', 'estado', 'created_at', 'updated_at'];
            const insertVals = [cidadaoId, cid.nome, cid.cpf, cid.nasc, 'São Luís', 'MA', new Date(), new Date()];

            if (temGenero) { insertCols.push('genero'); insertVals.push(cid.genero); }
            if (temEmail) { insertCols.push('email'); insertVals.push(cid.email); }
            if (temTelefone) { insertCols.push('telefone'); insertVals.push(cid.tel); }
            if (temSenha) { insertCols.push('senha'); insertVals.push(senhaHash); }
            else if (temPasswordHash) { insertCols.push('password_hash'); insertVals.push(senhaHash); }

            const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');

            await c.query(
                `INSERT INTO cidadaos (${insertCols.join(', ')}) VALUES (${placeholders})`,
                insertVals
            );
            console.log(`  ✅ Cidadão criado: ${cid.nome}`);
            totalCriados++;
        }

        // Verificar se já tem inscrição nesta ação
        const inscExistente = await c.query(
            `SELECT id FROM inscricoes WHERE cidadao_id = $1 AND acao_id = $2 AND curso_exame_id = $3`,
            [cidadaoId, acao.id, exame.ce_id]
        );

        let inscricaoId;
        if (inscExistente.rows[0]) {
            inscricaoId = inscExistente.rows[0].id;
            console.log(`     ⚠️  Já inscrito em ${exame.ce_nome}`);
        } else {
            inscricaoId = uuidv4();
            await c.query(
                `INSERT INTO inscricoes (id, cidadao_id, acao_id, curso_exame_id, status, data_inscricao, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, 'pendente', NOW(), NOW(), NOW())`,
                [inscricaoId, cidadaoId, acao.id, exame.ce_id]
            );
            console.log(`     ✅ Inscrito em: ${exame.ce_nome}`);
            totalInscritos++;
        }

        // Verificar se já tem ficha hoje
        const fichaExistente = await c.query(
            `SELECT id FROM fichas_atendimento WHERE cidadao_id = $1 AND acao_id = $2 AND hora_entrada >= $3 AND hora_entrada < $4 AND status NOT IN ('cancelado')`,
            [cidadaoId, acao.id, hoje, amanha]
        );

        if (fichaExistente.rows[0]) {
            console.log(`     ⚠️  Já tem ficha hoje (${fichaExistente.rows[0].id})\n`);
        } else {
            // Gerar número de ficha
            const maxFichaR = await c.query(
                `SELECT MAX(numero_ficha) as max FROM fichas_atendimento WHERE acao_id = $1 AND hora_entrada >= $2 AND hora_entrada < $3`,
                [acao.id, hoje, amanha]
            );
            const numeroFicha = (maxFichaR.rows[0]?.max || 0) + 1;

            await c.query(
                `INSERT INTO fichas_atendimento (id, cidadao_id, acao_id, inscricao_id, numero_ficha, status, hora_entrada, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 'aguardando', NOW(), NOW(), NOW())`,
                [uuidv4(), cidadaoId, acao.id, inscricaoId, numeroFicha]
            );
            console.log(`     🎫 Ficha #${String(numeroFicha).padStart(3, '0')} criada\n`);
            totalFichas++;
        }
    }

    // Incluir conta de teste se existir
    if (contaTeste.rows[0]) {
        const cidadaoId = contaTeste.rows[0].id;
        const exame = cursosR.rows[0]; // Primeiro exame
        const inscExistente = await c.query(
            `SELECT id FROM inscricoes WHERE cidadao_id = $1 AND acao_id = $2`, [cidadaoId, acao.id]
        );
        if (!inscExistente.rows[0]) {
            const inscricaoId = uuidv4();
            await c.query(
                `INSERT INTO inscricoes (id, cidadao_id, acao_id, curso_exame_id, status, data_inscricao, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, 'pendente', NOW(), NOW(), NOW())`,
                [inscricaoId, cidadaoId, acao.id, exame.ce_id]
            );
            const maxFichaR = await c.query(
                `SELECT MAX(numero_ficha) as max FROM fichas_atendimento WHERE acao_id = $1 AND hora_entrada >= CURRENT_DATE`,
                [acao.id]
            );
            const numeroFicha = (maxFichaR.rows[0]?.max || 0) + 1;
            await c.query(
                `INSERT INTO fichas_atendimento (id, cidadao_id, acao_id, inscricao_id, numero_ficha, status, hora_entrada, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 'aguardando', NOW(), NOW(), NOW())`,
                [uuidv4(), cidadaoId, acao.id, inscricaoId, numeroFicha]
            );
            console.log(`✅ Conta de teste (CPF ${CIDADAO_CONTA_TESTE_CPF}) inscrita em ${exame.ce_nome} com ficha #${String(numeroFicha).padStart(3, '0')}`);
            totalInscritos++; totalFichas++;
        } else {
            console.log(`ℹ️  Conta de teste já tem inscrição na ação.`);
        }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Cidadãos criados: ${totalCriados}`);
    console.log(`   Inscrições criadas: ${totalInscritos}`);
    console.log(`   Fichas criadas: ${totalFichas}`);
    console.log(`\n✅ Seed concluído! Acesse /admin/fila com a ação DK 3 para ver os inscritos.`);

    await c.end();
}

main().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
