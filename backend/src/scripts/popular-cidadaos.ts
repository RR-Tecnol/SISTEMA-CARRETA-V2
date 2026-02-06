import { Cidadao } from '../models/Cidadao';
import bcrypt from 'bcryptjs';

const cidadaosFicticios = [
    {
        nome_completo: 'Maria Silva Santos',
        cpf: '123.456.789-01',
        data_nascimento: '1985-03-15',
        sexo: 'F',
        raca: 'parda',
        telefone: '(98) 98765-4321',
        email: 'maria.silva@email.com',
        cep: '65000-000',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 201',
        bairro: 'Centro',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'João Pedro Oliveira',
        cpf: '234.567.890-12',
        data_nascimento: '1990-07-22',
        sexo: 'M',
        raca: 'branca',
        telefone: '(98) 99876-5432',
        email: 'joao.oliveira@email.com',
        cep: '65010-000',
        logradouro: 'Avenida dos Holandeses',
        numero: '456',
        complemento: '',
        bairro: 'Calhau',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Ana Carolina Ferreira',
        cpf: '345.678.901-23',
        data_nascimento: '1978-11-30',
        sexo: 'F',
        raca: 'branca',
        telefone: '(98) 98234-5678',
        email: 'ana.ferreira@email.com',
        cep: '65020-000',
        logradouro: 'Rua Grande',
        numero: '789',
        complemento: 'Casa',
        bairro: 'Centro',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Carlos Eduardo Souza',
        cpf: '456.789.012-34',
        data_nascimento: '1995-05-18',
        sexo: 'M',
        raca: 'preta',
        telefone: '(98) 99345-6789',
        email: 'carlos.souza@email.com',
        cep: '65030-000',
        logradouro: 'Avenida Kennedy',
        numero: '321',
        complemento: 'Bloco B',
        bairro: 'Renascença',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Juliana Costa Lima',
        cpf: '567.890.123-45',
        data_nascimento: '1988-09-25',
        sexo: 'F',
        raca: 'parda',
        telefone: '(98) 98456-7890',
        email: 'juliana.lima@email.com',
        cep: '65040-000',
        logradouro: 'Rua do Sol',
        numero: '654',
        complemento: '',
        bairro: 'Cohab',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Roberto Alves Pereira',
        cpf: '678.901.234-56',
        data_nascimento: '1982-12-10',
        sexo: 'M',
        raca: 'branca',
        telefone: '(98) 99567-8901',
        email: 'roberto.pereira@email.com',
        cep: '65050-000',
        logradouro: 'Avenida Colares Moreira',
        numero: '987',
        complemento: 'Sala 5',
        bairro: 'Renascença',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Patrícia Rodrigues Martins',
        cpf: '789.012.345-67',
        data_nascimento: '1992-04-08',
        sexo: 'F',
        raca: 'parda',
        telefone: '(98) 98678-9012',
        email: 'patricia.martins@email.com',
        cep: '65060-000',
        logradouro: 'Rua da Paz',
        numero: '147',
        complemento: 'Apto 302',
        bairro: 'Turu',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Fernando Santos Araújo',
        cpf: '890.123.456-78',
        data_nascimento: '1987-08-14',
        sexo: 'M',
        raca: 'preta',
        telefone: '(98) 99789-0123',
        email: 'fernando.araujo@email.com',
        cep: '65070-000',
        logradouro: 'Avenida São Luís Rei de França',
        numero: '258',
        complemento: '',
        bairro: 'São Francisco',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Camila Mendes Rocha',
        cpf: '901.234.567-89',
        data_nascimento: '1994-02-20',
        sexo: 'F',
        raca: 'amarela',
        telefone: '(98) 98890-1234',
        email: 'camila.rocha@email.com',
        cep: '65080-000',
        logradouro: 'Rua do Comércio',
        numero: '369',
        complemento: 'Loja 2',
        bairro: 'Centro',
        municipio: 'São Luís',
        estado: 'MA',
    },
    {
        nome_completo: 'Ricardo Barbosa Nunes',
        cpf: '012.345.678-90',
        data_nascimento: '1980-06-05',
        sexo: 'M',
        raca: 'indigena',
        telefone: '(98) 99901-2345',
        email: 'ricardo.nunes@email.com',
        cep: '65090-000',
        logradouro: 'Avenida Guajajaras',
        numero: '741',
        complemento: 'Casa 3',
        bairro: 'Cohama',
        municipio: 'São Luís',
        estado: 'MA',
    },
];

async function popularCidadaos() {
    try {
        console.log('🌱 Iniciando população de cidadãos fictícios...');

        const senha = await bcrypt.hash('senha123', 10);

        for (const cidadaoData of cidadaosFicticios) {
            // Verificar se já existe
            const existe = await Cidadao.findOne({
                where: { cpf: cidadaoData.cpf.replace(/\D/g, '') }
            });

            if (!existe) {
                await Cidadao.create({
                    ...cidadaoData,
                    cpf: cidadaoData.cpf.replace(/\D/g, ''), // Remove formatação
                    senha,
                });
                console.log(`✅ Cidadão criado: ${cidadaoData.nome_completo}`);
            } else {
                console.log(`⏭️  Cidadão já existe: ${cidadaoData.nome_completo}`);
            }
        }

        console.log('✅ População de cidadãos concluída!');
        console.log(`📊 Total de cidadãos fictícios: ${cidadaosFicticios.length}`);
    } catch (error) {
        console.error('❌ Erro ao popular cidadãos:', error);
        throw error;
    }
}

export { popularCidadaos };
