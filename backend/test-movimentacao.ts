// Script de teste para movimentação
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testarMovimentacao() {
    try {
        console.log('1️⃣ Criando insumo de teste...');
        const insumoResponse = await axios.post(`${API_URL}/estoque`, {
            nome: 'Teste Movimentação',
            categoria: 'OUTROS',
            unidade: 'unidade',
            quantidade_minima: 5,
            quantidade_atual: 100,
            ativo: true
        });

        const insumoId = insumoResponse.data.id;
        console.log('✅ Insumo criado:', insumoId);

        console.log('\n2️⃣ Testando movimentação...');
        const movResponse = await axios.post(`${API_URL}/estoque/movimentacao`, {
            insumo_id: insumoId,
            tipo: 'ENTRADA',
            quantidade: 10,
            observacoes: 'Teste via script'
        });

        console.log('✅ Movimentação criada:', movResponse.data);
        console.log('\n🎉 SUCESSO! Movimentação funcionando!');

    } catch (error: any) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        console.error('Stack:', error.response?.data?.stack);
    }
}

testarMovimentacao();
