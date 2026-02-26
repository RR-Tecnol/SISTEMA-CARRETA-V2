import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { RelatoriosCustosService } from '../services/relatorios/custosAcao';
import { Op } from 'sequelize';
import { Acao } from '../models/Acao';
import { Inscricao } from '../models/Inscricao';
import { CursoExame } from '../models/CursoExame';
import { Funcionario } from '../models/Funcionario';
import { Cidadao } from '../models/Cidadao';
import { Instituicao } from '../models/Instituicao';
import { ResultadoExame } from '../models/ResultadoExame';

const router = Router();

/**
 * GET /api/relatorios/prestacao-contas
 * Relatório executivo mensal consolidado de todas as ações do período.
 * Query params: mes (1-12), ano (ex: 2025), acao_id (opcional)
 */
router.get('/prestacao-contas', authenticate, async (req: Request, res: Response) => {
    try {
        const mes = parseInt(req.query.mes as string);
        const ano = parseInt(req.query.ano as string);
        const acao_id = req.query.acao_id as string | undefined;

        if (!mes || !ano || mes < 1 || mes > 12) {
            return res.status(400).json({ error: 'Parâmetros mes e ano são obrigatórios (mes: 1-12)' });
        }

        // Intervalo do mês
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);

        // Filtro base para ações ativas no período
        const whereAcao: any = {
            [Op.or]: [
                { data_inicio: { [Op.between]: [dataInicio, dataFim] } },
                { data_fim: { [Op.between]: [dataInicio, dataFim] } },
                { data_inicio: { [Op.lte]: dataInicio }, data_fim: { [Op.gte]: dataFim } },
            ],
        };
        if (acao_id) whereAcao.id = acao_id;

        // 1. Buscar ações do período
        const acoes = await Acao.findAll({
            where: whereAcao,
            include: [{ model: Instituicao, as: 'instituicao', required: false }],
        });

        if (acoes.length === 0) {
            return res.json({
                identificacao: { municipios_atendidos: '', periodo_execucao: {}, acoes_no_periodo: [] },
                producao: { total_exames: 0, meta_mensal: 0, percentual_meta: 0, dias_operacionais: 0, disponibilidade_operacional: 0 },
                por_procedimento: [],
                valor_variavel_total: 0,
                relacao_nominal: [],
                indicadores_sla: { disponibilidade_operacional: 0, prazo_medio_laudo: 0, indice_repeticao: 0 },
                medicos_disponiveis: [],
            });
        }

        const acaoIds = acoes.map((a) => a.id);

        // 2. Inscrições atendidas no período
        const inscricoes = await Inscricao.findAll({
            where: { acao_id: { [Op.in]: acaoIds }, status: 'atendido' },
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cartao_sus'] },
                { model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'codigo_sus', 'valor_unitario'] },
                { model: Acao, as: 'acao', attributes: ['id', 'nome', 'municipio', 'data_inicio', 'data_fim'] },
            ],
        });

        const totalExames = inscricoes.length;
        const metaMensal = acoes.reduce((sum, a) => sum + ((a as any).meta_mensal_total || 0), 0);
        const percentualMeta = metaMensal > 0 ? Math.round((totalExames / metaMensal) * 100) : 0;

        // Dias operacionais: soma dos intervalos das ações no mês
        let diasOperacionais = 0;
        for (const acao of acoes) {
            const ini = new Date(Math.max(new Date(acao.data_inicio).getTime(), dataInicio.getTime()));
            const fim = new Date(Math.min(new Date(acao.data_fim).getTime(), dataFim.getTime()));
            const diff = Math.ceil((fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (diff > 0) diasOperacionais += diff;
        }
        const disponibilidade = diasOperacionais > 0 ? Math.min(100, Math.round((diasOperacionais / 30) * 100)) : 0;

        // 3. Produção por procedimento (SIGTAP)
        const mapProcedimento: Record<string, { codigo_sus: string; procedimento: string; quantidade: number; valor_unitario: number }> = {};
        for (const insc of inscricoes) {
            const ce = (insc as any).curso_exame;
            if (!ce) continue;
            const key = ce.id;
            if (!mapProcedimento[key]) {
                mapProcedimento[key] = {
                    codigo_sus: ce.codigo_sus || '—',
                    procedimento: ce.nome,
                    quantidade: 0,
                    valor_unitario: parseFloat(ce.valor_unitario) || 0,
                };
            }
            mapProcedimento[key].quantidade++;
        }
        const porProcedimento = Object.values(mapProcedimento).map((p) => ({
            ...p,
            valor_total: p.quantidade * p.valor_unitario,
        }));
        const valorVariavelTotal = porProcedimento.reduce((s, p) => s + p.valor_total, 0);

        // 4. Relação nominal
        const relacaoNominal = inscricoes.map((insc: any) => ({
            nome_paciente: insc.cidadao?.nome_completo || '—',
            cns: insc.cidadao?.cartao_sus || '—',
            data_procedimento: insc.data_inscricao,
            tipo_procedimento: insc.curso_exame?.nome || '—',
            municipio: insc.acao?.municipio || '—',
            numero_prontuario: insc.numero_prontuario || '—',
        }));

        // 5. Indicadores de SLA
        const resultados = await ResultadoExame.findAll({
            where: { acao_id: { [Op.in]: acaoIds } },
        });

        let somasPrazos = 0;
        let laudosComPrazo = 0;
        for (const r of resultados) {
            if (r.data_realizacao && (r as any).data_emissao_laudo) {
                const prazo = Math.ceil(
                    (new Date((r as any).data_emissao_laudo).getTime() - new Date(r.data_realizacao).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                somasPrazos += prazo;
                laudosComPrazo++;
            }
        }
        const prazoMedioLaudo = laudosComPrazo > 0 ? Math.round(somasPrazos / laudosComPrazo) : 0;

        // 6. Lista de médicos disponíveis para seleção no relatório
        const medicos = await Funcionario.findAll({
            where: { is_medico: true, ativo: true },
            attributes: ['id', 'nome', 'crm', 'especialidade'],
        });

        // 7. Municípios atendidos
        const municipios = [...new Set(acoes.map((a) => `${a.municipio}/${a.estado}`))];

        res.json({
            identificacao: {
                municipios_atendidos: municipios.join(', '),
                periodo_execucao: {
                    inicio: dataInicio,
                    fim: dataFim,
                    competencia: `${String(mes).padStart(2, '0')}/${ano}`,
                },
                acoes_no_periodo: acoes.map((a) => ({
                    id: a.id,
                    nome: a.nome,
                    municipio: a.municipio,
                    estado: a.estado,
                    data_inicio: a.data_inicio,
                    data_fim: a.data_fim,
                    numero_processo: (a as any).numero_processo,
                    numero_cnes: (a as any).numero_cnes,
                    lote_regiao: (a as any).lote_regiao,
                    meta_mensal_total: (a as any).meta_mensal_total,
                    intercorrencias: (a as any).intercorrencias,
                    instituicao: (a as any).instituicao,
                })),
            },
            producao: {
                total_exames: totalExames,
                meta_mensal: metaMensal,
                percentual_meta: percentualMeta,
                dias_operacionais: diasOperacionais,
                disponibilidade_operacional: disponibilidade,
            },
            por_procedimento: porProcedimento,
            valor_variavel_total: valorVariavelTotal,
            relacao_nominal: relacaoNominal,
            indicadores_sla: {
                disponibilidade_operacional: disponibilidade,
                prazo_medio_laudo: prazoMedioLaudo,
                indice_repeticao: 0,
            },
            medicos_disponiveis: medicos,
        });
    } catch (error: any) {
        console.error('Erro ao gerar prestação de contas:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar relatório de prestação de contas' });
    }
});

/**
 * GET /api/relatorios/custos/:acaoId
 */
router.get('/custos/:acaoId', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const dados = await RelatoriosCustosService.gerarDadosRelatorio(acaoId);
        res.json(dados);
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar relatório de custos' });
    }
});

/**
 * GET /api/relatorios/custos/:acaoId/pdf
 */
router.get('/custos/:acaoId/pdf', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const pdf = await RelatoriosCustosService.gerarPDF(acaoId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-custos-${acaoId}.pdf`);
        res.send(pdf);
    } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar PDF' });
    }
});

/**
 * GET /api/relatorios/custos/:acaoId/csv
 */
router.get('/custos/:acaoId/csv', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const csv = await RelatoriosCustosService.gerarCSV(acaoId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-custos-${acaoId}.csv`);
        res.send(csv);
    } catch (error: any) {
        console.error('Erro ao gerar CSV:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar CSV' });
    }
});

export default router;
