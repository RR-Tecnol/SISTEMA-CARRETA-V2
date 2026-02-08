// Teste rápido da API de contas a pagar
const axios = require('axios');

async function testAPI() {
    try {
        // Fazer login para obter token
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@sistemtruck.com',
            senha: 'Admin@2026'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login OK - Token obtido\n');

        // Testar GET
        console.log('2. Testando GET /api/contas-pagar...');
        const getResponse = await axios.get('http://localhost:3001/api/contas-pagar', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ GET funcionou!');
        console.log('   Total de contas:', getResponse.data.total);
        console.log('   Página:', getResponse.data.page);
        console.log('   Total de páginas:', getResponse.data.totalPages);
        console.log();

        // Testar POST
        console.log('3. Testando POST /api/contas-pagar...');
        const postResponse = await axios.post('http://localhost:3001/api/contas-pagar', {
            tipo_conta: 'energia',
            descricao: 'Conta de energia - Teste API',
            valor: 250.75,
            data_vencimento: '2026-02-20',
            status: 'pendente',
            recorrente: true
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ POST funcionou!');
        console.log('   ID criado:', postResponse.data.id);
        console.log();

        // Deletar conta de teste
        console.log('4. Limpando teste...');
        await axios.delete(`http://localhost:3001/api/contas-pagar/${postResponse.data.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ DELETE funcionou!\n');

        console.log('🎉 TODOS OS TESTES PASSARAM!');
        console.log('✅ API de Contas a Pagar está 100% FUNCIONAL!');

    } catch (error) {
        console.error('\n❌ ERRO:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        } else {
            console.error('Mensagem:', error.message);
        }
    }
}

testAPI();
