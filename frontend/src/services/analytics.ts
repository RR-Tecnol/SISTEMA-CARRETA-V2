import api from './api';

export interface AnalyticsFilters {
    data_inicio?: string;
    data_fim?: string;
    cidade?: string;
    tipo_exame?: string;
}

export interface DashboardMetrics {
    totalExames: number;
    examesMes: number;
    cidadesAtendidas: number;
    periodo: {
        inicio: string;
        fim: string;
    };
}

class AnalyticsService {
    async dashboard(mes?: number, ano?: number): Promise<DashboardMetrics> {
        const params = new URLSearchParams();
        if (mes) params.append('mes', String(mes));
        if (ano) params.append('ano', String(ano));

        const response = await api.get(`/analytics/dashboard?${params.toString()}`);
        return response.data;
    }

    async examesPorTipo(filtros?: AnalyticsFilters): Promise<any[]> {
        const params = new URLSearchParams();
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const response = await api.get(`/analytics/exames-por-tipo?${params.toString()}`);
        return response.data;
    }

    async examesPorCidade(filtros?: AnalyticsFilters): Promise<any[]> {
        const params = new URLSearchParams();
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const response = await api.get(`/analytics/exames-por-cidade?${params.toString()}`);
        return response.data;
    }

    async examesPorGenero(filtros?: AnalyticsFilters): Promise<any[]> {
        const params = new URLSearchParams();
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const response = await api.get(`/analytics/exames-por-genero?${params.toString()}`);
        return response.data;
    }

    async examesPorRaca(filtros?: AnalyticsFilters): Promise<any[]> {
        const params = new URLSearchParams();
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const response = await api.get(`/analytics/exames-por-raca?${params.toString()}`);
        return response.data;
    }

    async examesPorIdade(filtros?: AnalyticsFilters): Promise<any[]> {
        const params = new URLSearchParams();
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const response = await api.get(`/analytics/exames-por-idade?${params.toString()}`);
        return response.data;
    }
}

export default new AnalyticsService();
