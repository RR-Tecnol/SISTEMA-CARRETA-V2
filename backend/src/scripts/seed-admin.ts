import { sequelize } from '../config/database';
import { Cidadao } from '../models/Cidadao';
import bcrypt from 'bcrypt';

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // CPF de teste: 123.456.789-09 (CPF válido de teste)
        const cpfFormatado = '123.456.789-09';

        // Verifica se já existe
        const adminExistente = await Cidadao.findOne({
            where: { cpf: cpfFormatado }
        });

        // Hash da senha
        const senhaHash = await bcrypt.hash('admin123', 10);

        if (adminExistente) {
            console.log('⚠️  Usuário admin já existe no banco de dados!');
            console.log('🔄 Atualizando senha do admin...');

            await adminExistente.update({
                senha: senhaHash
            });

            console.log('✅ Senha do admin atualizada com sucesso!');
            console.log('📋 CPF: 123.456.789-09');
            console.log('   Senha: admin123');
            process.exit(0);
        }

        // Cria o usuário admin
        await Cidadao.create({
            cpf: cpfFormatado,
            nome_completo: 'Administrador do Sistema',
            data_nascimento: new Date('1990-01-01'),
            telefone: '(83) 99999-9999',
            email: 'admin@sistemacarretas.com.br',
            senha: senhaHash,
            tipo: 'admin',  // ✅ Campo tipo definindo como admin
            municipio: 'João Pessoa',
            estado: 'PB',
            consentimento_lgpd: true,
            data_consentimento: new Date(),
            ip_consentimento: '127.0.0.1',
        } as any);

        console.log('\n✅ Usuário administrador criado com sucesso!');
        console.log('\n📋 Credenciais de acesso:');
        console.log('   CPF: 123.456.789-09');
        console.log('   Senha: admin123');
        console.log('   Nome: Administrador do Sistema');
        console.log('   Email: admin@sistemacarretas.com.br');
        console.log('\n💡 Use essas credenciais para fazer login no sistema');
        console.log('   Endpoint de login: POST /api/auth/login');
        console.log('   Body: { "cpf": "123.456.789-09", "senha": "admin123" }');
        console.log('\n⚠️  ATENÇÃO: Este é um usuário de TESTE apenas!');
        console.log('   Em produção, use credenciais seguras e configure permissões adequadas.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
        process.exit(1);
    }
}

// Executa o seed
seedAdmin();
