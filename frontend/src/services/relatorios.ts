import api from './api';

class RelatoriosService {
    async custosAcao(acaoId: string): Promise<any> {
        const response = await api.get(`/relatorios/custos/${acaoId}`);
        return response.data;
    }

    async downloadCustosPDF(acaoId: string): Promise<Blob> {
        const response = await api.get(`/relatorios/custos/${acaoId}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }

    async downloadCustosCSV(acaoId: string): Promise<Blob> {
        const response = await api.get(`/relatorios/custos/${acaoId}/csv`, {
            responseType: 'blob'
        });
        return response.data;
    }
}

export default new RelatoriosService();
