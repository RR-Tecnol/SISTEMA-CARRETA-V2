import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Inscricao } from '../models/Inscricao';
import { AcaoCursoExame } from '../models/AcaoCursoExame';
import { Cidadao } from '../models/Cidadao';
import { Acao } from '../models/Acao';
import { CursoExame } from '../models/CursoExame';
import { FichaAtendimento } from '../models/FichaAtendimento';
import { EstacaoExame } from '../models/EstacaoExame';
import { authenticate, authorizeAdminOrEstrada, AuthRequest } from '../middlewares/auth';

const router = Router();

/**
 * Helper: cria automaticamente uma FichaAtendimento ao inscrever um cidadão.
 * Usa o mesmo numero_ficha para todos os exames do mesmo cidadão na mesma ação no mesmo dia.
 * Tenta associar a ficha à estação do exame quando existir.
 */
async function criarFichaParaInscricao(
    inscricao: Inscricao,
    req?: Request
): Promise<FichaAtendimento | null> {
    try {
        const { cidadao_id, acao_id, curso_exame_id } = inscricao;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Verifica se já tem ficha ativa nesta ação hoje para este exame específico
        const fichaExistente = await FichaAtendimento.findOne({
            where: {
                cidadao_id,
                acao_id,
                inscricao_id: inscricao.id,
                status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento'] },
            },
        });
        if (fichaExistente) return fichaExistente; // já existe, não duplica

        // Buscar o numero_ficha já usado por este cidadão nesta ação hoje (mesma senha)
        const fichaAnterior = await FichaAtendimento.findOne({
            where: {
                cidadao_id,
                acao_id,
                hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
            },
            order: [['numero_ficha', 'ASC']],
        });

        // Se já tem ficha hoje, reutiliza o mesmo numero; senão gera próximo seq
        let numero_ficha: number;
        if (fichaAnterior) {
            numero_ficha = fichaAnterior.numero_ficha;
        } else {
            const count = await FichaAtendimento.count({
                where: { acao_id, hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha } },
            });
            // Pega o maior numero_ficha do dia + 1 para garantir unicidade de senha
            const maxFicha = await FichaAtendimento.findOne({
                where: { acao_id, hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha } },
                order: [['numero_ficha', 'DESC']],
            });
            numero_ficha = maxFicha ? maxFicha.numero_ficha + 1 : 1;
        }

        // Descobrir estação relacionada ao exame (se existir)
        const estacao = curso_exame_id ? await EstacaoExame.findOne({
            where: { acao_id, curso_exame_id, status: 'ativa' },
        }) : null;

        const ficha = await FichaAtendimento.create({
            cidadao_id,
            acao_id,
            inscricao_id: inscricao.id,
            numero_ficha,
            estacao_id: estacao?.id || null,
            status: 'aguardando',
        });

        // Emitir via Socket.IO se disponível
        if (req) {
            const io = (req.app as any).get('io');
            if (io) {
                const fichaCompleta = await FichaAtendimento.findByPk(ficha.id, {
                    include: [
                        { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cpf'] },
                        {
                            model: Inscricao as any, as: 'inscricao', required: false,
                            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
                        },
                        { model: EstacaoExame as any, as: 'estacao', attributes: ['id', 'nome', 'status'], required: false },
                    ],
                });
                io.to(`acao:${acao_id}`).emit('nova_ficha', fichaCompleta);
                io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id });
            }
        }

        console.log(`✅ Ficha ${numero_ficha} criada automaticamente — cidadão ${cidadao_id} — exame ${curso_exame_id}`);
        return ficha;
    } catch (err) {
        console.error('❌ Erro ao criar ficha automática:', err);
        return null;
    }
}



/**
 * Helper: verifica periodicidade antes de criar inscrição
 * Retorna null se permitido, ou objeto de erro se bloqueado
 */
async function checkPeriodicidade(cidadao_id: string, curso_exame_id: string, acaoCurso: any): Promise<{ code: string; message: string; ultima_data?: string; proxima_data?: string; ultimo_exame_nome?: string } | null> {
    const { permitir_repeticao, periodicidade_meses } = acaoCurso;

    // ── Verificar se já existe inscrição ATIVA (pendente ou atendido) em QUALQUER ação ──
    const inscricaoAtiva = await Inscricao.findOne({
        where: {
            cidadao_id,
            curso_exame_id,
            status: { [Op.in]: ['pendente', 'atendido'] },
        },
        include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }],
        order: [['data_inscricao', 'DESC']],
    });

    if (inscricaoAtiva) {
        const ultimaData = new Date(inscricaoAtiva.data_inscricao as any);
        const statusAtual = inscricaoAtiva.status;
        const ultimoExameNome = (inscricaoAtiva as any).curso_exame?.nome;

        // Se não permite repetição de forma alguma, bloqueia sempre
        if (permitir_repeticao === false) {
            return {
                code: 'BLOQUEADO_SEM_REPETICAO',
                message: 'Este exame só pode ser realizado uma única vez por cidadão.',
                ultima_data: ultimaData.toLocaleDateString('pt-BR'),
                ultimo_exame_nome: ultimoExameNome,
            };
        }

        // Se o exame está pendente em outra ação, bloqueia
        if (statusAtual === 'pendente') {
            return {
                code: 'BLOQUEADO_JA_INSCRITO',
                message: 'Cidadão já está inscrito neste exame em outra ação (pendente de atendimento).',
                ultima_data: ultimaData.toLocaleDateString('pt-BR'),
                ultimo_exame_nome: ultimoExameNome,
            };
        }

        // Se já foi atendido, verificar periodicidade
        if (statusAtual === 'atendido' && periodicidade_meses && periodicidade_meses > 0) {
            const proximaData = new Date(ultimaData);
            proximaData.setMonth(proximaData.getMonth() + periodicidade_meses);

            const hoje = new Date();
            if (hoje < proximaData) {
                return {
                    code: 'BLOQUEADO_PERIODICIDADE',
                    message: `Este exame só pode ser repetido após ${periodicidade_meses} ${periodicidade_meses === 1 ? 'mês' : 'meses'} do último realizado.`,
                    ultima_data: ultimaData.toLocaleDateString('pt-BR'),
                    proxima_data: proximaData.toLocaleDateString('pt-BR'),
                    ultimo_exame_nome: ultimoExameNome,
                };
            }
        }
    }

    return null;
}

/**
 * GET /api/inscricoes
 * Listar todas as inscrições (admin only - para BI)
 * #15 — inclui curso_exame para exibir chip de exame
 */
router.get('/', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const inscricoes = await Inscricao.findAll({
            attributes: ['id', 'cidadao_id', 'acao_id', 'curso_exame_id', 'status', 'created_at'],
            include: [
                { model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] },
            ],
            order: [['created_at', 'DESC']],
        });

        res.json(inscricoes);
    } catch (error) {
        console.error('Error fetching all inscricoes:', error);
        res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }
});

/**
 * POST /api/inscricoes/bulk
 * #14 — Inscrever cidadão em vários exames de uma vez (admin)
 * Body: { cidadao_id, acaoId, acao_curso_ids: string[] }
 */
router.post('/bulk', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { cidadao_id, acaoId, acao_curso_ids } = req.body;

        if (!cidadao_id || !acaoId || !Array.isArray(acao_curso_ids) || acao_curso_ids.length === 0) {
            res.status(400).json({ error: 'cidadao_id, acaoId e acao_curso_ids[] são obrigatórios' });
            return;
        }

        const resultados: { acao_curso_id: string; status: 'criado' | 'bloqueado'; motivo?: string }[] = [];

        for (const acao_curso_id of acao_curso_ids) {
            const acaoCurso = await AcaoCursoExame.findOne({
                where: { id: acao_curso_id, acao_id: acaoId },
            });

            if (!acaoCurso) {
                resultados.push({ acao_curso_id, status: 'bloqueado', motivo: 'Exame não encontrado nesta ação' });
                continue;
            }

            // Verificar periodicidade
            const bloqueio = await checkPeriodicidade(cidadao_id, acaoCurso.curso_exame_id, acaoCurso);
            if (bloqueio) {
                resultados.push({ acao_curso_id, status: 'bloqueado', motivo: bloqueio.message });
                continue;
            }

            // Verificar se já inscrito nesta ação
            const existente = await Inscricao.findOne({
                where: { cidadao_id, acao_id: acaoId, curso_exame_id: acaoCurso.curso_exame_id, status: 'pendente' },
            });
            if (existente) {
                resultados.push({ acao_curso_id, status: 'bloqueado', motivo: 'Já inscrito neste exame' });
                continue;
            }

            // Verificar vagas
            const inscritosCount = await Inscricao.count({
                where: { acao_id: acaoId, curso_exame_id: acaoCurso.curso_exame_id, status: ['pendente', 'atendido'] },
            });
            if (inscritosCount >= acaoCurso.vagas) {
                resultados.push({ acao_curso_id, status: 'bloqueado', motivo: 'Sem vagas disponíveis' });
                continue;
            }

            await Inscricao.create({
                cidadao_id,
                acao_id: acaoId,
                curso_exame_id: acaoCurso.curso_exame_id,
                status: 'pendente',
                data_inscricao: new Date(),
            });

            // ✅ Criar ficha automática na fila
            const inscCriada = await Inscricao.findOne({
                where: { cidadao_id, acao_id: acaoId, curso_exame_id: acaoCurso.curso_exame_id, status: 'pendente' },
                order: [['created_at', 'DESC']],
            });
            if (inscCriada) await criarFichaParaInscricao(inscCriada, req);

            resultados.push({ acao_curso_id, status: 'criado' });

        }

        const criados = resultados.filter(r => r.status === 'criado').length;
        const bloqueados = resultados.filter(r => r.status === 'bloqueado').length;

        res.status(201).json({
            message: `${criados} inscrição(ões) criada(s), ${bloqueados} bloqueada(s)`,
            criados,
            bloqueados,
            resultados,
        });
    } catch (error) {
        console.error('Error creating bulk inscricoes:', error);
        res.status(500).json({ error: 'Erro ao criar inscrições em massa' });
    }
});


/**
 * POST /api/inscricoes
 * Criar nova inscrição (cidadão autenticado)
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { acao_curso_id } = req.body;
        const cidadao_id = req.user!.id;

        const acaoCurso = await AcaoCursoExame.findByPk(acao_curso_id);
        if (!acaoCurso) {
            res.status(404).json({ error: 'Curso/Exame não encontrado nesta ação' });
            return;
        }

        const { acao_id, curso_exame_id, vagas } = acaoCurso;

        // ── Validação de periodicidade ──
        const bloqueio = await checkPeriodicidade(cidadao_id, curso_exame_id, acaoCurso);
        if (bloqueio) {
            res.status(409).json({ error: bloqueio.message, ...bloqueio });
            return;
        }

        // Verificar inscrição duplicada na mesma ação
        const existingInscricao = await Inscricao.findOne({
            where: {
                cidadao_id,
                acao_id,
                curso_exame_id,
                status: 'pendente',
            },
            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }]
        });

        if (existingInscricao) {
            const ultimaData = existingInscricao.data_inscricao ? new Date(existingInscricao.data_inscricao as any).toLocaleDateString('pt-BR') : undefined;
            res.status(409).json({
                error: 'Você já está inscrito neste curso/exame (pendente de atendimento).',
                message: 'Você já está inscrito neste curso/exame.',
                code: 'BLOQUEADO_JA_INSCRITO',
                ultima_data: ultimaData,
                ultimo_exame_nome: (existingInscricao as any).curso_exame?.nome
            });
            return;
        }

        // Check vagas disponíveis
        const inscricoesCount = await Inscricao.count({
            where: { acao_id, curso_exame_id, status: ['pendente', 'atendido'] },
        });

        if (inscricoesCount >= vagas) {
            res.status(400).json({ error: 'Não há vagas disponíveis' });
            return;
        }

        const inscricao = await Inscricao.create({
            cidadao_id,
            acao_id,
            curso_exame_id,
            status: 'pendente',
            data_inscricao: new Date(),
        });

        // ✅ Criar ficha automática na fila
        await criarFichaParaInscricao(inscricao, req);

        res.status(201).json({ message: 'Inscrição realizada com sucesso', inscricao });

    } catch (error) {
        console.error('Error creating inscricao:', error);
        res.status(500).json({ error: 'Erro ao realizar inscrição' });
    }
});

/**
 * GET /api/inscricoes/me
 * Listar minhas inscrições (cidadão)
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const cidadao_id = req.user!.id;

        const inscricoes = await Inscricao.findAll({
            where: { cidadao_id },
            include: [
                {
                    model: Acao,
                    as: 'acao',
                },
                {
                    model: CursoExame,
                    as: 'curso_exame',
                }
            ],
            order: [['created_at', 'DESC']],
        });

        res.json(inscricoes);
    } catch (error) {
        console.error('Error fetching my inscricoes:', error);
        res.status(500).json({ error: 'Erro ao buscar suas inscrições' });
    }
});

/**
 * PUT /api/inscricoes/:id/presenca
 * Registrar presença (admin)
 */
router.put('/:id/presenca', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { compareceu } = req.body;

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }

        await inscricao.update({
            status: compareceu ? 'atendido' : 'pendente',
            observacoes: compareceu ? 'Presença confirmada' : 'Ausente',
        });

        res.json({
            message: 'Presença registrada com sucesso',
            inscricao,
        });
    } catch (error) {
        console.error('Error updating presenca:', error);
        res.status(500).json({ error: 'Erro ao registrar presença' });
    }
});

/**
 * GET /api/inscricoes/acoes/:acaoId/inscricoes
 * Listar inscrições de uma ação (admin)
 * #4 — suporta ?busca= (nome ou CPF), ?status= e ?page= / ?limit=
 */
router.get('/acoes/:acaoId/inscricoes', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const { busca, status, page = '1', limit = '50' } = req.query as Record<string, string>;

        const cidadaoWhere: any = {};

        // #4 — filtro por nome OU CPF
        if (busca && busca.trim()) {
            const termo = busca.trim();
            cidadaoWhere[Op.or] = [
                { nome_completo: { [Op.iLike]: `%${termo}%` } },
                { cpf: { [Op.iLike]: `%${termo}%` } },
            ];
        }

        const inscricaoWhere: any = { acao_id: acaoId };
        if (status && status !== 'todos') {
            inscricaoWhere.status = status;
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, parseInt(limit) || 50);
        const offset = (pageNum - 1) * limitNum;

        const { rows: inscricoes, count } = await Inscricao.findAndCountAll({
            where: inscricaoWhere,
            include: [
                {
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', 'nome_completo', 'cpf', 'email', 'telefone'],
                    where: Object.keys(cidadaoWhere).length ? cidadaoWhere : undefined,
                    required: Object.keys(cidadaoWhere).length > 0,
                },
                {
                    model: CursoExame,
                    as: 'curso_exame',
                },
            ],
            order: [['created_at', 'DESC']],
            limit: limitNum,
            offset,
        });

        const formatCPF = (cpf: string): string => {
            const cleaned = cpf.replace(/\D/g, '');
            if (cleaned.length !== 11) return cpf;
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        };

        const inscricoesMapped = inscricoes.map(inscricao => {
            const inscricaoJSON = inscricao.toJSON() as any;
            if (inscricaoJSON.cidadao?.cpf) {
                inscricaoJSON.cidadao.cpf = formatCPF(inscricaoJSON.cidadao.cpf);
            }
            return inscricaoJSON;
        });

        res.json({
            inscricoes: inscricoesMapped,
            total: count,
            page: pageNum,
            totalPages: Math.ceil(count / limitNum),
        });
    } catch (error) {
        console.error('Error fetching inscricoes:', error);
        res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }
});

/**
 * POST /api/acoes/:acaoId/inscricoes
 * Adicionar cidadão a uma ação manual (admin)
 */
router.post('/acoes/:acaoId/inscricoes', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const { cidadao_id, acao_curso_id, cadastro_espontaneo = false } = req.body;

        const acaoCurso = await AcaoCursoExame.findOne({
            where: { id: acao_curso_id, acao_id: acaoId },
        });

        if (!acaoCurso) {
            res.status(404).json({ error: 'Curso/Exame não encontrado nesta ação' });
            return;
        }

        const { curso_exame_id } = acaoCurso;

        // ── Validação de periodicidade ──
        const bloqueio = await checkPeriodicidade(cidadao_id, curso_exame_id, acaoCurso);
        if (bloqueio) {
            res.status(409).json({ error: bloqueio.message, ...bloqueio });
            return;
        }

        // Verificar inscrição duplicada em QUALQUER ação APENAS se estiver pendente
        // (se estiver atendido, o checkPeriodicidade acima já cuidou se pode ou não repetir)
        const existingInscricao = await Inscricao.findOne({
            where: {
                cidadao_id,
                curso_exame_id,
                status: 'pendente',
            },
            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }]
        });

        if (existingInscricao) {
            const ultimaData = existingInscricao.data_inscricao ? new Date(existingInscricao.data_inscricao as any).toLocaleDateString('pt-BR') : undefined;
            res.status(409).json({
                error: 'Cidadão já está inscrito neste exame em outra ação (pendente de atendimento).',
                message: 'Cidadão já está inscrito neste exame em outra ação (pendente de atendimento).',
                code: 'BLOQUEADO_JA_INSCRITO',
                ultima_data: ultimaData,
                ultimo_exame_nome: (existingInscricao as any).curso_exame?.nome
            });
            return;
        }

        const inscricao = await Inscricao.create({
            cidadao_id,
            acao_id: acaoId,
            curso_exame_id,
            status: 'pendente',
            data_inscricao: new Date(),
            observacoes: cadastro_espontaneo ? 'Cadastro Espontâneo' : null,
        });

        // ✅ Criar ficha automática na fila
        await criarFichaParaInscricao(inscricao, req);

        res.status(201).json({ message: 'Cidadão adicionado com sucesso', inscricao });

    } catch (error) {
        console.error('Error creating inscricao:', error);
        res.status(500).json({ error: 'Erro ao adicionar cidadão' });
    }
});

/**
 * PUT /api/inscricoes/:id/confirmar
 * Confirmar inscrição (admin)
 */
router.put('/:id/confirmar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }

        await inscricao.update({
            observacoes: inscricao.observacoes ? `${inscricao.observacoes}; Confirmado` : 'Confirmado',
        });

        res.json({
            message: 'Inscrição confirmada com sucesso',
            inscricao,
        });
    } catch (error) {
        console.error('Error confirming inscricao:', error);
        res.status(500).json({ error: 'Erro ao confirmar inscrição' });
    }
});

/**
 * PUT /api/inscricoes/:id/marcar-atendimento
 * Marcar cidadão como atendido (admin)
 */
router.put('/:id/marcar-atendimento', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { observacoes } = req.body;

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }

        await inscricao.update({
            status: 'atendido', // SUCESSO
            observacoes: observacoes ? `Atendido - ${observacoes}` : 'Atendido',
        });

        res.json({
            message: 'Atendimento registrado com sucesso',
            inscricao,
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Erro ao registrar atendimento' });
    }
});

/**
 * DELETE /api/inscricoes/:id
 * Cancela/remove inscrição — antes de deletar, cancela fichas de atendimento vinculadas
 */
router.delete('/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }

        // 1️⃣ Cancelar fichas pendentes vinculadas (aguardando/chamado)
        const fichasVinculadas = await FichaAtendimento.findAll({
            where: { inscricao_id: id, status: ['aguardando', 'chamado'] },
        });

        for (const ficha of fichasVinculadas) {
            await ficha.update({ status: 'cancelado', observacoes: 'Inscrição cancelada pelo administrador' });
        }

        // 2️⃣ Desvincular fichas já em andamento/concluídas (não cancelar)
        await FichaAtendimento.update(
            { inscricao_id: null as any },
            { where: { inscricao_id: id } }
        );

        // 3️⃣ Deletar a inscrição
        await inscricao.destroy();

        // 4️⃣ Atualizar fila em tempo real
        const io = (req.app as any).get('io');
        if (io) {
            io.to(`acao:${inscricao.acao_id}`).emit('fila_atualizada', { acao_id: inscricao.acao_id });
        }

        res.json({
            message: 'Inscrição cancelada com sucesso',
            fichasCanceladas: fichasVinculadas.length,
        });
    } catch (error: any) {
        console.error('Erro ao cancelar inscrição:', error?.message || error);
        res.status(500).json({ error: 'Erro ao cancelar inscrição', detalhe: error?.message });
    }
});


/**
 * PUT /api/inscricoes/:id/status
 * Atualizar status da inscrição (admin)
 */
router.put('/:id/status', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pendente' | 'atendido' | 'faltou'

        console.log('📝 Atualizando status da inscrição:', { id, status });

        if (!['pendente', 'atendido', 'faltou'].includes(status)) {
            res.status(400).json({ error: 'Status inválido. Use: pendente, atendido ou faltou' });
            return;
        }

        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }

        await inscricao.update({ status });

        console.log('✅ Status atualizado com sucesso:', inscricao.toJSON());

        res.json(inscricao);
    } catch (error) {
        console.error('❌ Erro detalhado ao atualizar status da inscrição:', error);
        res.status(500).json({ error: 'Erro ao atualizar status da inscrição' });
    }
});

export default router;
