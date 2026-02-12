const axios = require('axios');

async function testLogin() {
    try {
        const cpf = '01219208361'; // CPF que você mencionou
        const senha = '123456'; // Senha padrão

        console.log('🔐 Testando login...');
        console.log('CPF:', cpf);
        console.log('Senha:', senha);
        console.log('');

        const response = await axios.post('http://localhost:3001/api/auth/login', {
            cpf: cpf,
            senha: senha
        });

        console.log('✅ Login bem-sucedido!');
        console.log('Token:', response.data.token);
        console.log('Usuário:', response.data.user);

    } catch (error) {
        console.log('❌ Erro no login:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Erro:', error.response.data);
        } else {
            console.log('Erro:', error.message);
        }
    }
}

testLogin();
