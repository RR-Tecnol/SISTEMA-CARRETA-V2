import api from './api';

export interface DadosRelatorioExecutivo {
    acao: any;
    inscricoes: any[];
    atendimentos: any;
    custos: any[];
    medicos: any[];
    responsavelTecnico?: any;
}

export async function buscarDadosRelatorio(
    acaoId: string,
    dataInicio?: string,
    dataFim?: string
): Promise<DadosRelatorioExecutivo> {
    const params: any = {};
    if (dataInicio) params.data_inicio = dataInicio;
    if (dataFim) params.data_fim = dataFim;

    const [acaoRes, inscricoesRes, atendimentosRes, custosRes] = await Promise.allSettled([
        api.get(`/acoes/${acaoId}`),
        api.get('/inscricoes', { params: { acao_id: acaoId, limit: 9999 } }),
        api.get('/medico-monitoring/relatorio/geral', { params: { acao_id: acaoId, ...params } }),
        api.get('/contas-pagar', { params: { acao_id: acaoId } }),
    ]);

    const acao = acaoRes.status === 'fulfilled' ? acaoRes.value.data : null;

    const inscricoes = inscricoesRes.status === 'fulfilled'
        ? (Array.isArray(inscricoesRes.value.data)
            ? inscricoesRes.value.data
            : inscricoesRes.value.data?.inscricoes || [])
        : [];

    const atendimentos = atendimentosRes.status === 'fulfilled' ? atendimentosRes.value.data : null;

    const custos = custosRes.status === 'fulfilled'
        ? (Array.isArray(custosRes.value.data)
            ? custosRes.value.data
            : custosRes.value.data?.contas || [])
        : [];

    // Buscar Responsável Técnico se existir
    let responsavelTecnico: any;
    if (acao?.responsavel_tecnico_id) {
        try {
            const rtRes = await api.get(`/funcionarios/${acao.responsavel_tecnico_id}`);
            responsavelTecnico = rtRes.data;
        } catch {
            // RT opcional, não bloquear geração do relatório
        }
    }

    const medicos = atendimentos?.medicos || [];

    return { acao, inscricoes, atendimentos, custos, medicos, responsavelTecnico };
}
