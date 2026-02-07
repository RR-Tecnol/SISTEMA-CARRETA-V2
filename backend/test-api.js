// Script para testar a API de ações
const axios = require('axios');

async function testAPI() {
    try {
        console.log('🔄 Testando API de ações...');
        const response = await axios.get('http://localhost:3001/api/acoes');
        console.log('✅ API funcionando!');
        console.log(`📊 Total de ações: ${response.data.length}`);
        if (response.data.length > 0) {
            console.log('\n📋 Primeira ação:');
            console.log(`  - ID: ${response.data[0].id}`);
            console.log(`  - Nome: ${response.data[0].nome}`);
            console.log(`  - Tipo: ${response.data[0].tipo}`);
            console.log(`  - Status: ${response.data[0].status}`);
        }
    } catch (error) {
        console.error('❌ Erro na API:', error.response?.data || error.message);
        console.error('\n💡 O backend precisa ser reiniciado!');
        console.error('   Execute: Ctrl+C no terminal do backend e depois "npm run dev"');
    }
}

testAPI();
