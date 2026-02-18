import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:3000/api' : '/api');

export interface Insumo {
    id: string;
    nome: string;
    descricao?: string;
    categoria: 'EPI' | 'MEDICAMENTO' | 'MATERIAL_DESCARTAVEL' | 'EQUIPAMENTO' | 'OUTROS';
    unidade: string;
    quantidade_minima: number;
    quantidade_atual: number;
    preco_unitario?: number;
    codigo_barras?: string;
    lote?: string;
    data_validade?: Date;
    fornecedor?: string;
    nota_fiscal?: string;
    data_entrada?: Date;
    localizacao?: string;
    ativo: boolean;
}

export interface MovimentacaoEstoque {
    id: string;
    insumo_id: string;
    tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'DEVOLUCAO' | 'AJUSTE' | 'PERDA';
    quantidade: number;
    quantidade_anterior: number;
    quantidade_atual: number;
    origem?: string;
    destino?: string;
    caminhao_id?: string;
    acao_id?: string;
    motorista_id?: string;
    nota_fiscal?: string;
    data_movimento: Date;
    observacoes?: string;
    usuario_id?: string;
    insumo?: Insumo;
}

export interface EstoqueCaminhao {
    id: string;
    caminhao_id: string;
    insumo_id: string;
    quantidade: number;
    ultima_atualizacao: Date;
    insumo?: Insumo;
}

// CRUD de Insumos
export const listarInsumos = async (filtros?: {
    categoria?: string;
    status?: string;
    busca?: string;
    vencimento?: string;
}) => {
    const params = new URLSearchParams();
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.busca) params.append('busca', filtros.busca);
    if (filtros?.vencimento) params.append('vencimento', filtros.vencimento);

    const response = await axios.get(`${API_URL}/estoque?${params.toString()}`);
    return response.data;
};

export const buscarInsumo = async (id: string) => {
    const response = await axios.get(`${API_URL}/estoque/${id}`);
    return response.data;
};

export const criarInsumo = async (insumo: Partial<Insumo>) => {
    const response = await axios.post(`${API_URL}/estoque`, insumo);
    return response.data;
};

export const atualizarInsumo = async (id: string, insumo: Partial<Insumo>) => {
    const response = await axios.put(`${API_URL}/estoque/${id}`, insumo);
    return response.data;
};

export const deletarInsumo = async (id: string) => {
    const response = await axios.delete(`${API_URL}/estoque/${id}`);
    return response.data;
};

// Alertas
export const buscarAlertasEstoqueBaixo = async () => {
    const response = await axios.get(`${API_URL}/estoque/alertas/estoque-baixo`);
    return response.data;
};

export const buscarInsumosVencendo = async () => {
    const response = await axios.get(`${API_URL}/estoque/alertas/vencendo`);
    return response.data;
};

// Movimentações
export const registrarMovimentacao = async (movimentacao: Partial<MovimentacaoEstoque>) => {
    const response = await axios.post(`${API_URL}/estoque/movimentacao`, movimentacao);
    return response.data;
};

export const listarMovimentacoes = async (filtros?: {
    insumo_id?: string;
    tipo?: string;
    data_inicio?: string;
    data_fim?: string;
    caminhao_id?: string;
    acao_id?: string;
}) => {
    const params = new URLSearchParams();
    if (filtros?.insumo_id) params.append('insumo_id', filtros.insumo_id);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros?.caminhao_id) params.append('caminhao_id', filtros.caminhao_id);
    if (filtros?.acao_id) params.append('acao_id', filtros.acao_id);

    const response = await axios.get(`${API_URL}/estoque/movimentacao?${params.toString()}`);
    return response.data;
};

// Estoque por Caminhão
export const listarEstoqueCaminhao = async (caminhao_id: string) => {
    const response = await axios.get(`${API_URL}/estoque/caminhao/${caminhao_id}`);
    return response.data;
};

export const transferirInsumo = async (transferencia: {
    insumo_id: string;
    caminhao_id: string;
    quantidade: number;
    origem: string;
    destino: string;
    motorista_id?: string;
    observacao?: string;
    usuario_id: string;
}) => {
    const response = await axios.post(`${API_URL}/estoque/transferir`, transferencia);
    return response.data;
};

// Consumo por Ação
export const registrarConsumoAcao = async (acao_id: string, consumo: {
    insumo_id: string;
    quantidade_utilizada: number;
    caminhao_id: string;
    observacao?: string;
    usuario_id: string;
}) => {
    const response = await axios.post(`${API_URL}/estoque/acao/${acao_id}/consumo`, consumo);
    return response.data;
};

export const listarConsumoAcao = async (acao_id: string) => {
    const response = await axios.get(`${API_URL}/estoque/acao/${acao_id}/consumo`);
    return response.data;
};

// Relatórios
export const gerarRelatorioMovimentacao = async (filtros?: {
    data_inicio?: string;
    data_fim?: string;
    tipo?: string;
}) => {
    const params = new URLSearchParams();
    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);

    const response = await axios.get(`${API_URL}/estoque/relatorios/movimentacao?${params.toString()}`);
    return response.data;
};

export const gerarRelatorioConsumoPorAcao = async () => {
    const response = await axios.get(`${API_URL}/estoque/relatorios/consumo-por-acao`);
    return response.data;
};

export const gerarRelatorioEstoquePorCaminhao = async () => {
    const response = await axios.get(`${API_URL}/estoque/relatorios/estoque-por-caminhao`);
    return response.data;
};

export const exportarRelatorio = async (formato: 'xlsx' | 'csv', tipo_relatorio: 'estoque' | 'movimentacoes') => {
    const response = await axios.get(
        `${API_URL}/estoque/relatorios/exportar?formato=${formato}&tipo_relatorio=${tipo_relatorio}`,
        { responseType: 'blob' }
    );

    // Criar link de download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-${tipo_relatorio}.${formato}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
