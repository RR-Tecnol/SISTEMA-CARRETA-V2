import api from './api';

export interface ContaPagar {
    id: string;
    tipo_conta: string;
    tipo_espontaneo?: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
    comprovante_url?: string;
    recorrente: boolean;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export interface ContasPagarFilters {
    status?: string;
    tipo_conta?: string;
    data_inicio?: string;
    data_fim?: string;
    recorrente?: boolean;
    page?: number;
    limit?: number;
}

export interface ContasPagarResponse {
    contas: ContaPagar[];
    total: number;
    page: number;
    totalPages: number;
}

export interface RelatorioMensal {
    contas: ContaPagar[];
    resumo: {
        total: number;
        totalPendente: number;
        totalPago: number;
        totalVencido: number;
        totalGeral: number;
    };
}

class ContasPagarService {
    async listar(filtros?: ContasPagarFilters): Promise<ContasPagarResponse> {
        const params = new URLSearchParams();
        if (filtros?.status) params.append('status', filtros.status);
        if (filtros?.tipo_conta) params.append('tipo_conta', filtros.tipo_conta);
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
        if (filtros?.recorrente !== undefined) params.append('recorrente', String(filtros.recorrente));
        if (filtros?.page) params.append('page', String(filtros.page));
        if (filtros?.limit) params.append('limit', String(filtros.limit));

        const response = await api.get(`/contas-pagar?${params.toString()}`);
        return response.data;
    }

    async buscar(id: string): Promise<ContaPagar> {
        const response = await api.get(`/contas-pagar/${id}`);
        return response.data;
    }

    async criar(dados: FormData): Promise<ContaPagar> {
        const response = await api.post('/contas-pagar', dados, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async atualizar(id: string, dados: FormData): Promise<ContaPagar> {
        const response = await api.put(`/contas-pagar/${id}`, dados, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async deletar(id: string): Promise<void> {
        await api.delete(`/contas-pagar/${id}`);
    }

    async relatorioMensal(mes: number, ano: number): Promise<RelatorioMensal> {
        const response = await api.get(`/contas-pagar/relatorio/mensal?mes=${mes}&ano=${ano}`);
        return response.data;
    }
}

export default new ContasPagarService();
