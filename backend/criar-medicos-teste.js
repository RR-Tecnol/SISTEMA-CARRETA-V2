/**
 * criar-medicos-teste.js
 * Cria 4 novos perfis de médicos para testes do sistema.
 * Uso: node backend/criar-medicos-teste.js
 */
const bcrypt = require('bcrypt');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const DB = {
    host: '127.0.0.1',
    port: 5434,
    database: 'sistema_carretas',
    user: 'postgres',
    password: 'postgres',
};

const SENHA_PADRAO = 'Medico@123';

const novosMedicos = [
    {
        nome: 'Dra. Ana Clara Ferreira',
        cpf: '345.678.901-23',
        especialidade: 'Clínico Geral',
        crm: 'CRM/SP 87654',
        custo_diaria: 850.00,
        telefone: '(11) 98765-1001',
        email: 'ana.ferreira@carretas.med',
    },
    {
        nome: 'Dr. Carlos Eduardo Mendes',
        cpf: '456.789.012-34',
        especialidade: 'Medicina do Trabalho',
        crm: 'CRM/MG 23456',
        custo_diaria: 900.00,
        telefone: '(31) 98765-2002',
        email: 'carlos.mendes@carretas.med',
    },
    {
        nome: 'Dra. Juliana Ramos Costa',
        cpf: '567.890.123-45',
        especialidade: 'Clínico Geral',
        crm: 'CRM/RJ 34567',
        custo_diaria: 800.00,
        telefone: '(21) 98765-3003',
        email: 'juliana.costa@carretas.med',
    },
    {
        nome: 'Dr. Pedro Henrique Lima',
        cpf: '678.901.234-56',
        especialidade: 'Oftalmologia',
        crm: 'CRM/SP 45678',
        custo_diaria: 950.00,
        telefone: '(11) 98765-4004',
        email: 'pedro.lima@carretas.med',
    },
];

async function main() {
    const client = new Client(DB);
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
    const criados = [];

    for (const m of novosMedicos) {
        const cpfClean = m.cpf.replace(/\D/g, '');

        // Verifica se já existe
        const existe = await client.query(
            'SELECT id FROM funcionarios WHERE cpf = $1 OR cpf = $2',
            [m.cpf, cpfClean]
        );
        if (existe.rows.length > 0) {
            console.log(`⚠️  ${m.nome} já existe (CPF ${m.cpf}) — pulando.`);
            continue;
        }

        const id = uuidv4();
        await client.query(`
            INSERT INTO funcionarios (
                id, nome, cpf, cargo, especialidade, crm, custo_diaria, telefone, email,
                is_medico, is_admin_estrada, ativo,
                login_cpf, senha,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, 'Médico', $4, $5, $6, $7, $8,
                true, false, true,
                $3, $9,
                NOW(), NOW()
            )
        `, [id, m.nome, cpfClean, m.especialidade, m.crm, m.custo_diaria, m.telefone, m.email, senhaHash]);

        criados.push({ ...m, cpf_login: cpfClean });
        console.log(`✅ Criado: ${m.nome} | CPF: ${m.cpf} | Especialidade: ${m.especialidade}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 CREDENCIAIS DE ACESSO DOS NOVOS MÉDICOS');
    console.log('='.repeat(60));
    console.log(`🔑 Senha padrão de todos: ${SENHA_PADRAO}\n`);
    for (const m of criados) {
        console.log(`  👨‍⚕️  ${m.nome}`);
        console.log(`     CPF (login): ${m.cpf}`);
        console.log(`     Especialidade: ${m.especialidade}`);
        console.log(`     CRM: ${m.crm}`);
        console.log('');
    }

    // Verifica o total de médicos agora
    const total = await client.query('SELECT COUNT(*) FROM funcionarios WHERE is_medico = true');
    console.log(`📊 Total de médicos no sistema agora: ${total.rows[0].count}`);

    await client.end();
    console.log('\n✅ Concluído!');
}

main().catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
