import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { authenticate } from '../middlewares/auth';
import { Inscricao } from '../models/Inscricao';
import { Acao } from '../models/Acao';
import { CursoExame } from '../models/CursoExame';
import { AcaoCursoExame } from '../models/AcaoCursoExame';
import { Cidadao } from '../models/Cidadao';
import { ResultadoExame } from '../models/ResultadoExame';
import { Exame } from '../models/Exame';

const router = Router();

// =============================================================================
// HELPER: calcula alertas de periodicidade para um cidadão dado
// =============================================================================
async function calcularAlertasCidadao(cidadaoId: string) {
    // Busca todas as inscrições do cidadão com info do exame e ação
    const inscricoes = await Inscricao.findAll({
        where: { cidadao_id: cidadaoId },
        include: [
            {
                model: Acao,
                as: 'acao',
                attributes: ['id', 'nome', 'numero_acao', 'data_inicio', 'data_fim', 'municipio', 'estado'],
            },
            {
                model: CursoExame,
                as: 'curso_exame',
                attributes: ['id', 'nome', 'tipo'],
            },
        ],
        order: [['data_inscricao', 'DESC']],
    });

    const alertas: any[] = [];
    const agora = new Date();

    // Agrupar por curso_exame_id para pegar a mais recente de cada exame
    const maisRecentePorExame = new Map<string, typeof inscricoes[0]>();
    for (const insc of inscricoes) {
        if (!insc.curso_exame_id) continue;
        if (!maisRecentePorExame.has(insc.curso_exame_id)) {
            maisRecentePorExame.set(insc.curso_exame_id, insc);
        }
    }

    for (const [cursoExameId, inscricao] of maisRecentePorExame) {
        // Buscar configuração de periodicidade da ação
        const config = await AcaoCursoExame.findOne({
            where: {
                acao_id: (inscricao as any).acao_id,
                curso_exame_id: cursoExameId,
            },
        });

        if (!config) continue;

        const nomeExame = (inscricao as any).curso_exame?.nome || 'Exame';
        const nomeAcao = (inscricao as any).acao?.nome || 'Ação';
        const numeroAcao = (inscricao as any).acao?.numero_acao;
        const dataInscricao = new Date(inscricao.data_inscricao);

        // --- Alerta de PENDENTE: inscrito mas status ainda "pendente" ---
        if (inscricao.status === 'pendente') {
            const acaoDataFim = (inscricao as any).acao?.data_fim
                ? new Date((inscricao as any).acao.data_fim)
                : null;
            const acaoPassou = acaoDataFim && acaoDataFim < agora;
            alertas.push({
                tipo: 'pendente',
                cidadao_id: cidadaoId,
                curso_exame_id: cursoExameId,
                nome_exame: nomeExame,
                nome_acao: nomeAcao,
                numero_acao: numeroAcao,
                data_inscricao: inscricao.data_inscricao,
                mensagem: acaoPassou
                    ? `Exame "${nomeExame}" foi realizado mas o resultado ainda não foi enviado para a central.`
                    : `Exame "${nomeExame}" está agendado e aguardando realização.`,
                urgente: acaoPassou,
            });
            continue;
        }

        // A partir daqui só nos interessam inscrições "atendido"
        if (inscricao.status !== 'atendido') continue;

        const periodicidade = config.periodicidade_meses;
        const diasAviso = config.dias_aviso_vencimento ?? 30;
        const permiteRepeticao = config.permitir_repeticao ?? true;

        // Exame que não permite repetição → bloquear para sempre
        if (!permiteRepeticao) {
            alertas.push({
                tipo: 'bloqueado',
                cidadao_id: cidadaoId,
                curso_exame_id: cursoExameId,
                nome_exame: nomeExame,
                nome_acao: nomeAcao,
                numero_acao: numeroAcao,
                data_ultimo_exame: inscricao.data_inscricao,
                proxima_data_disponivel: null,
                mensagem: `Exame "${nomeExame}" já foi realizado e não permite repetição.`,
            });
            continue;
        }

        // Sem periodicidade configurada → sem alerta de vencimento
        if (!periodicidade) continue;

        // Calcular data de vencimento
        const dataVencimento = new Date(dataInscricao);
        dataVencimento.setMonth(dataVencimento.getMonth() + periodicidade);

        const diasRestantes = Math.ceil((dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
            // VENCIDO: prazo ultrapassado, cidadão deve refazer o exame
            alertas.push({
                tipo: 'vencido',
                cidadao_id: cidadaoId,
                curso_exame_id: cursoExameId,
                nome_exame: nomeExame,
                nome_acao: nomeAcao,
                numero_acao: numeroAcao,
                data_ultimo_exame: inscricao.data_inscricao,
                data_vencimento: dataVencimento,
                dias_atraso: Math.abs(diasRestantes),
                mensagem: `Exame "${nomeExame}" venceu há ${Math.abs(diasRestantes)} dias. Cidadão precisa refazê-lo.`,
            });
        } else if (diasRestantes <= diasAviso) {
            // VENCENDO: dentro do prazo de aviso
            alertas.push({
                tipo: 'vencendo',
                cidadao_id: cidadaoId,
                curso_exame_id: cursoExameId,
                nome_exame: nomeExame,
                nome_acao: nomeAcao,
                numero_acao: numeroAcao,
                data_ultimo_exame: inscricao.data_inscricao,
                data_vencimento: dataVencimento,
                dias_restantes: diasRestantes,
                mensagem: `Exame "${nomeExame}" vence em ${diasRestantes} dias (${dataVencimento.toLocaleDateString('pt-BR')}).`,
            });
        }
    }

    return alertas;
}

// =============================================================================
// GET /api/alertas/cidadao/:cidadaoId
// Alertas de um cidadão específico (acesso do próprio cidadão ou admin)
// =============================================================================
router.get('/cidadao/:cidadaoId', authenticate, async (req: Request, res: Response) => {
    try {
        const { cidadaoId } = req.params;
        const alertas = await calcularAlertasCidadao(cidadaoId);
        return res.json({ alertas, total: alertas.length });
    } catch (error: any) {
        console.error('Erro ao buscar alertas do cidadão:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar alertas' });
    }
});

// =============================================================================
// GET /api/alertas/admin/dashboard
// Resumo de alertas para o painel do admin
// =============================================================================
router.get('/admin/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
        // Busca todos os cidadãos com inscrições
        const cidadaosComInscricao = await Inscricao.findAll({
            attributes: ['cidadao_id'],
            group: ['cidadao_id'],
            raw: true,
        });

        let totalVencidos = 0;
        let totalVencendo = 0;
        let totalPendentes = 0;
        let totalBloqueados = 0;

        const alertasDetalhados: any[] = [];

        for (const row of cidadaosComInscricao) {
            const cidadaoId = (row as any).cidadao_id;
            const alertas = await calcularAlertasCidadao(cidadaoId);

            if (alertas.length > 0) {
                // Enriquecer com dados do cidadão
                const cidadao = await Cidadao.findByPk(cidadaoId, {
                    attributes: ['id', 'nome_completo', 'cpf', 'telefone'],
                });
                if (!cidadao) continue;

                for (const alerta of alertas) {
                    alerta.cidadao = {
                        id: cidadao.id,
                        nome: cidadao.nome_completo,
                        cpf: cidadao.cpf,
                        telefone: cidadao.telefone,
                    };
                    alertasDetalhados.push(alerta);

                    if (alerta.tipo === 'vencido') totalVencidos++;
                    else if (alerta.tipo === 'vencendo') totalVencendo++;
                    else if (alerta.tipo === 'pendente') totalPendentes++;
                    else if (alerta.tipo === 'bloqueado') totalBloqueados++;
                }
            }
        }

        // Ordenar: vencidos primeiro, depois vencendo, depois pendentes
        alertasDetalhados.sort((a, b) => {
            const ordem: Record<string, number> = { vencido: 0, vencendo: 1, pendente: 2, bloqueado: 3 };
            return (ordem[a.tipo] ?? 99) - (ordem[b.tipo] ?? 99);
        });

        return res.json({
            resumo: {
                total_vencidos: totalVencidos,
                total_vencendo: totalVencendo,
                total_pendentes: totalPendentes,
                total_bloqueados: totalBloqueados,
                total_geral: alertasDetalhados.length,
            },
            alertas: alertasDetalhados,
        });
    } catch (error: any) {
        console.error('Erro ao buscar alertas do admin:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar alertas' });
    }
});

// =============================================================================
// GET /api/alertas/admin/lista
// Lista paginada com filtro por tipo
// =============================================================================
router.get('/admin/lista', authenticate, async (req: Request, res: Response) => {
    try {
        const { tipo, busca, page = 1, limit = 20 } = req.query;

        const cidadaosComInscricao = await Inscricao.findAll({
            attributes: ['cidadao_id'],
            group: ['cidadao_id'],
            raw: true,
        });

        const todosAlertas: any[] = [];

        for (const row of cidadaosComInscricao) {
            const cidadaoId = (row as any).cidadao_id;
            let alertas = await calcularAlertasCidadao(cidadaoId);

            if (tipo) {
                alertas = alertas.filter((a) => a.tipo === tipo);
            }

            if (alertas.length > 0) {
                const cidadao = await Cidadao.findByPk(cidadaoId, {
                    attributes: ['id', 'nome_completo', 'cpf', 'telefone'],
                });
                if (!cidadao) continue;

                for (const alerta of alertas) {
                    alerta.cidadao = {
                        id: cidadao.id,
                        nome: cidadao.nome_completo,
                        cpf: cidadao.cpf,
                        telefone: cidadao.telefone,
                    };
                    todosAlertas.push(alerta);
                }
            }
        }

        // Filtro de busca por nome do cidadão ou exame
        let filtrados = todosAlertas;
        if (busca) {
            const termo = String(busca).toLowerCase();
            filtrados = todosAlertas.filter(
                (a) =>
                    a.cidadao?.nome?.toLowerCase().includes(termo) ||
                    a.nome_exame?.toLowerCase().includes(termo) ||
                    a.nome_acao?.toLowerCase().includes(termo)
            );
        }

        // Ordenação
        filtrados.sort((a, b) => {
            const ordem: Record<string, number> = { vencido: 0, vencendo: 1, pendente: 2, bloqueado: 3 };
            return (ordem[a.tipo] ?? 99) - (ordem[b.tipo] ?? 99);
        });

        // Paginação
        const pageNum = parseInt(String(page));
        const limitNum = parseInt(String(limit));
        const inicio = (pageNum - 1) * limitNum;
        const paginados = filtrados.slice(inicio, inicio + limitNum);

        return res.json({
            alertas: paginados,
            total: filtrados.length,
            page: pageNum,
            totalPages: Math.ceil(filtrados.length / limitNum),
        });
    } catch (error: any) {
        console.error('Erro ao listar alertas:', error);
        return res.status(500).json({ error: 'Erro interno ao listar alertas' });
    }
});

export default router;
