import { Router, Request, Response } from 'express';
import { Inscricao } from '../models/Inscricao';
import { AcaoCursoExame } from '../models/AcaoCursoExame';
import { Cidadao } from '../models/Cidadao';
import { Acao } from '../models/Acao';
import { CursoExame } from '../models/CursoExame';
import { authenticate, authorizeAdmin, AuthRequest } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/inscricoes
 * Listar todas as inscrições (admin only - para BI)
 */
router.get('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const inscricoes = await Inscricao.findAll({
            attributes: ['id', 'cidadao_id', 'acao_id', 'curso_exame_id', 'status', 'created_at'],
            order: [['created_at', 'DESC']],
        });

        res.json(inscricoes);
    } catch (error) {
        console.error('Error fetching all inscricoes:', error);
        res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }
});


/**
 * POST /api/inscricoes
 * Criar nova inscrição (cidadão autenticado)
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Agora recebemos acao_curso_id do frontend (ID da tabela pivô), mas salvamos acao_id e curso_exame_id
        const { acao_curso_id } = req.body;
        const cidadao_id = req.user!.id;

        // Buscar detalhes da relação Acao-Curso para decompor IDs
        const acaoCurso = await AcaoCursoExame.findByPk(acao_curso_id);
        if (!acaoCurso) {
            res.status(404).json({ error: 'Curso/Exame não encontrado nesta ação' });
            return;
        }

        // Decompor IDs
        const { acao_id, curso_exame_id, vagas } = acaoCurso;

        // Check for existing inscricao
        const existingInscricao = await Inscricao.findOne({
            where: {
                cidadao_id,
                acao_id,
                curso_exame_id,
                status: ['pendente', 'atendido'],
            },
        });

        if (existingInscricao) {
            res.status(409).json({ error: 'Você já está inscrito neste curso/exame' });
            return;
        }

        // Check vagas disponíveis
        const inscricoesCount = await Inscricao.count({
            where: {
                acao_id,
                curso_exame_id,
                status: ['pendente', 'atendido'],
            },
        });

        if (inscricoesCount >= vagas) {
            res.status(400).json({ error: 'Não há vagas disponíveis' });
            return;
        }

        // Create inscricao
        const inscricao = await Inscricao.create({
            cidadao_id,
            acao_id,
            curso_exame_id,
            status: 'pendente',
            data_inscricao: new Date(),
        });

        res.status(201).json({
            message: 'Inscrição realizada com sucesso',
            inscricao,
        });
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
router.put('/:id/presenca', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
 * GET /api/acoes/:acaoId/inscricoes
 * Listar inscrições de uma ação (admin)
 */
router.get('/acoes/:acaoId/inscricoes', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;

        const inscricoes = await Inscricao.findAll({
            where: { acao_id: acaoId }, // Busca direta pela acao_id
            include: [
                {
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', 'nome_completo', 'cpf', 'email', 'telefone'],
                },
                {
                    model: CursoExame,
                    as: 'curso_exame',
                },
            ],
            order: [['created_at', 'DESC']],
        });

        // Função para formatar CPF e return
        const formatCPF = (cpf: string): string => {
            const cleaned = cpf.replace(/\D/g, '');
            if (cleaned.length !== 11) return cpf;
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        };

        const inscricoesMapped = inscricoes.map(inscricao => {
            const inscricaoJSON = inscricao.toJSON() as any;
            if (inscricaoJSON.cidadao && inscricaoJSON.cidadao.cpf) {
                inscricaoJSON.cidadao.cpf = formatCPF(inscricaoJSON.cidadao.cpf);
            }
            return inscricaoJSON;
        });

        res.json(inscricoesMapped);
    } catch (error) {
        console.error('Error fetching inscricoes:', error);
        res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }
});

/**
 * POST /api/acoes/:acaoId/inscricoes
 * Adicionar cidadão a uma ação manual (admin)
 */
router.post('/acoes/:acaoId/inscricoes', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const { cidadao_id, acao_curso_id, cadastro_espontaneo = false } = req.body;

        // Buscar detalhes para obter curso_exame_id
        const acaoCurso = await AcaoCursoExame.findOne({
            where: {
                id: acao_curso_id,
                acao_id: acaoId,
            },
        });

        if (!acaoCurso) {
            res.status(404).json({ error: 'Curso/Exame não encontrado nesta ação' });
            return;
        }

        const { curso_exame_id } = acaoCurso;

        // Check for existing inscricao
        const existingInscricao = await Inscricao.findOne({
            where: {
                cidadao_id,
                acao_id: acaoId,
                curso_exame_id,
            },
        });

        if (existingInscricao) {
            res.status(409).json({ error: 'Cidadão já está inscrito neste curso/exame' });
            return;
        }

        // Create inscricao
        const inscricao = await Inscricao.create({
            cidadao_id,
            acao_id: acaoId,
            curso_exame_id,
            status: 'pendente',
            data_inscricao: new Date(),
            observacoes: cadastro_espontaneo ? 'Cadastro Espontâneo' : null,
        });

        res.status(201).json({
            message: 'Cidadão adicionado com sucesso',
            inscricao,
        });
    } catch (error) {
        console.error('Error creating inscricao:', error);
        res.status(500).json({ error: 'Erro ao adicionar cidadão' });
    }
});

/**
 * PUT /api/inscricoes/:id/confirmar
 * Confirmar inscrição (admin)
 */
router.put('/:id/confirmar', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
router.put('/:id/marcar-atendimento', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
 * Cancelar inscrição (admin)
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const inscricao = await Inscricao.findByPk(id);
        if (!inscricao) {
            res.status(404).json({ error: 'Inscrição não encontrada' });
            return;
        }
        await inscricao.destroy(); // Hard delete para cancelamento pois status 'cancelado' nao existe
        res.json({ message: 'Inscrição cancelada com sucesso' });
    } catch (error) {
        console.error('Error canceling inscricao:', error);
        res.status(500).json({ error: 'Erro ao cancelar inscrição' });
    }
});

/**
 * PUT /api/inscricoes/:id/status
 * Atualizar status da inscrição (admin)
 */
router.put('/:id/status', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
