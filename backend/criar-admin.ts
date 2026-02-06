/**
 * Script para criar usuário administrador
 * 
 * Uso: npx ts-node criar-admin.ts
 */

import { Cidadao } from './src/models/Cidadao';
import bcrypt from 'bcrypt';
import { sequelize } from './src/config/database';

async function criarAdmin() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados!');

        // Dados do admin
        const adminData = {
            cpf: '000.000.000-00',
            nome_completo: 'Administrador do Sistema',
            data_nascimento: new Date('1990-01-01'),
            telefone: '(00) 00000-0000',
            email: 'admin@sistemacarretas.com',
            senha: await bcrypt.hash('admin123', 10),
            tipo: 'admin',
            municipio: 'São Luís',
            estado: 'MA',
            consentimento_lgpd: true,
            data_consentimento: new Date(),
            ip_consentimento: '127.0.0.1',
        };

        // Verificar se já existe
        const existente = await Cidadao.findOne({
            where: { cpf: adminData.cpf }
        });

        if (existente) {
            console.log('⚠️  Usuário admin já existe!');
            console.log('📧 Email:', existente.email);
            console.log('🔑 CPF:', existente.cpf);

            // Atualizar senha e tipo
            console.log('🔄 Atualizando senha para "admin123" e tipo para "admin"...');
            existente.senha = adminData.senha;
            existente.tipo = 'admin';
            await existente.save();
            console.log('✅ Senha e tipo atualizados!');
        } else {
            console.log('🔄 Criando usuário administrador...');
            await Cidadao.create(adminData as any);
            console.log('✅ Usuário admin criado com sucesso!');
        }

        console.log('\n📋 Credenciais de acesso:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 CPF:   000.000.000-00');
        console.log('🔒 Senha: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🌐 Acesse: http://localhost:3000/login');
        console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar admin:', error);
        process.exit(1);
    }
}

criarAdmin();
