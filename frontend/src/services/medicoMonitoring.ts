import api from './api';

export const medicoMonitoringService = {
    // Médicos
    getMedicos: () => api.get('/medico-monitoring/medicos'),

    // Dashboard
    getDashboard: () => api.get('/medico-monitoring/dashboard'),

    // Ponto
    registrarEntrada: (data: { funcionario_id: string; acao_id?: string; observacoes?: string }) =>
        api.post('/medico-monitoring/ponto/entrada', data),

    registrarSaida: (pontoId: string, data?: { observacoes?: string }) =>
        api.put(`/medico-monitoring/ponto/${pontoId}/saida`, data || {}),

    getPontos: (params?: {
        funcionario_id?: string;
        acao_id?: string;
        data_inicio?: string;
        data_fim?: string;
        status?: string;
    }) => api.get('/medico-monitoring/ponto', { params }),

    // Atendimentos
    iniciarAtendimento: (data: {
        funcionario_id: string;
        acao_id?: string;
        cidadao_id?: string;
        ponto_id?: string;
        observacoes?: string;
        nome_paciente?: string;
    }) => api.post('/medico-monitoring/atendimentos', data),

    finalizarAtendimento: (atendimentoId: string, data?: { observacoes?: string }) =>
        api.put(`/medico-monitoring/atendimentos/${atendimentoId}/finalizar`, data || {}),

    cancelarAtendimento: (atendimentoId: string, data?: { observacoes?: string }) =>
        api.put(`/medico-monitoring/atendimentos/${atendimentoId}/cancelar`, data || {}),

    getAtendimentos: (params?: {
        funcionario_id?: string;
        acao_id?: string;
        data_inicio?: string;
        data_fim?: string;
        status?: string;
    }) => api.get('/medico-monitoring/atendimentos', { params }),

    // Relatório
    getRelatorio: (funcionarioId: string, params?: { acao_id?: string; data_inicio?: string; data_fim?: string }) =>
        api.get(`/medico-monitoring/relatorio/${funcionarioId}`, { params }),
};
