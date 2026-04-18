/**
 * vincular-medicos-acao.js
 * Vincula todos os médicos à ação mais recente (a que foi nova criada)
 * Uso: node backend/vincular-medicos-acao.js [acao_id_opcional]
 */
const { Client } = require('pg');

const DB = {
    host: '127.0.0.1',
    port: 5434,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres',
};

async function main() {
    const client = new Client(DB);
    await client.connect();
    console.log('✅ Conectado ao banco\n');

    // Se o usuário passou uma acao_id como argumento, usa ela; senão pega a mais recente
    const acaoIdArg = process.argv[2];

    let acao;
    if (acaoIdArg) {
        const r = await client.query('SELECT id, nome FROM acoes WHERE id = $1', [acaoIdArg]);
        acao = r.rows[0];
    } else {
        // Pega a ação mais recente (qualquer status)
        const r = await client.query('SELECT id, nome, status FROM acoes ORDER BY created_at DESC LIMIT 1');
        acao = r.rows[0];
    }

    if (!acao) {
        console.log('❌ Nenhuma ação encontrada.');
        await client.end();
        return;
    }

    console.log(`🎯 Ação alvo: "${acao.nome}" (id: ${acao.id})\n`);

    // Buscar todos os médicos
    const medicos = await client.query(
        'SELECT id, nome FROM funcionarios WHERE is_medico = true ORDER BY nome'
    );
    console.log(`👨‍⚕️  Médicos encontrados: ${medicos.rows.length}`);

    let vinculados = 0;
    let jaEncontrados = 0;

    for (const m of medicos.rows) {
        const existe = await client.query(
            'SELECT id FROM acao_funcionarios WHERE acao_id = $1 AND funcionario_id = $2',
            [acao.id, m.id]
        );

        if (existe.rows.length > 0) {
            console.log(`  ⚠️  ${m.nome} — já vinculado`);
            jaEncontrados++;
            continue;
        }

        await client.query(
            `INSERT INTO acao_funcionarios (id, acao_id, funcionario_id, dias_trabalhados, created_at, updated_at)
             VALUES (uuid_generate_v4(), $1, $2, 1, NOW(), NOW())`,
            [acao.id, m.id]
        );
        console.log(`  ✅ ${m.nome} — vinculado`);
        vinculados++;
    }

    console.log(`\n📊 Resultado: ${vinculados} novos vínculos | ${jaEncontrados} já existiam`);

    // Listar todos vinculados
    const todos = await client.query(
        `SELECT f.nome FROM acao_funcionarios af
         JOIN funcionarios f ON f.id = af.funcionario_id
         WHERE af.acao_id = $1 AND f.is_medico = true
         ORDER BY f.nome`,
        [acao.id]
    );
    console.log(`\n✅ Médicos na ação "${acao.nome}":`);
    todos.rows.forEach(r => console.log(`  - ${r.nome}`));

    await client.end();
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
