/**
 * run-migrations.js — Executa as migrations faltantes diretamente
 * Rodar: node run-migrations.js
 */
const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    database: process.env.DB_NAME || 'sistema_carretas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    const migrations = [
        {
            name: 'estacoes_exame',
            sql: `
                CREATE TABLE IF NOT EXISTS estacoes_exame (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
                    curso_exame_id UUID REFERENCES cursos_exames(id) ON DELETE SET NULL,
                    nome VARCHAR(100) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
                    motivo_pausa TEXT,
                    ordem INTEGER DEFAULT 1,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        },
        {
            name: 'configuracoes_fila_acao',
            sql: `
                CREATE TABLE IF NOT EXISTS configuracoes_fila_acao (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    acao_id UUID NOT NULL UNIQUE REFERENCES acoes(id) ON DELETE CASCADE,
                    notif_email BOOLEAN NOT NULL DEFAULT FALSE,
                    notif_sms BOOLEAN NOT NULL DEFAULT FALSE,
                    notif_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_ficha_gerada BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_chegando BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_chamado BOOLEAN NOT NULL DEFAULT TRUE,
                    fichas_antes_aviso INTEGER NOT NULL DEFAULT 3,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        },
        {
            name: 'fichas_atendimento.estacao_id',
            sql: `ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS estacao_id UUID REFERENCES estacoes_exame(id) ON DELETE SET NULL;`
        },
        {
            name: 'fichas_atendimento.hora_atendimento',
            sql: `ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS hora_atendimento TIMESTAMPTZ;`
        },
        {
            name: 'fichas_atendimento.hora_conclusao',
            sql: `ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS hora_conclusao TIMESTAMPTZ;`
        },
    ];

    for (const m of migrations) {
        try {
            await client.query(m.sql);
            console.log(`✅ ${m.name}: OK`);
        } catch (err) {
            console.warn(`⚠️  ${m.name}: ${err.message}`);
        }
    }

    // Verificar resultado
    const { rows } = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'fichas_atendimento'
        ORDER BY ordinal_position;
    `);
    console.log('\n📋 Colunas de fichas_atendimento:', rows.map(r => r.column_name).join(', '));

    const { rows: tables } = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('estacoes_exame', 'configuracoes_fila_acao')
        ORDER BY table_name;
    `);
    console.log('📋 Novas tabelas:', tables.map(r => r.table_name).join(', '));

    await client.end();
    console.log('\n✅ Migrations concluídas!');
}

run().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
