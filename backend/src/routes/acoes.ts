import { Router, Request, Response } from 'express';
import { Acao } from '../models/Acao';
import { AcaoCursoExame } from '../models/AcaoCursoExame';
import { CursoExame } from '../models/CursoExame';
import { Instituicao } from '../models/Instituicao';
import { Caminhao } from '../models/Caminhao';
import { Funcionario } from '../models/Funcionario';
import { AcaoCaminhao } from '../models/AcaoCaminhao';
import { AcaoFuncionario } from '../models/AcaoFuncionario';
import { Inscricao } from '../models/Inscricao';
import { ContaPagar } from '../models/ContaPagar';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { cacheMiddleware, clearCache } from '../middlewares/cache';
import Joi from 'joi';
import { validate } from '../middlewares/validation';
import { Op } from 'sequelize';

const router = Router();

// Validation schema for creating acao
const createAcaoSchema = Joi.object({
    nome: Joi.string().min(3).max(255).required(),
    instituicao_id: Joi.string().uuid().required(),
    tipo: Joi.string().valid('curso', 'saude').required(),
    municipio: Joi.string().required(),
    estado: Joi.string().length(2).required(),
    data_inicio: Joi.date().required(),
    data_fim: Joi.date().required(),
    descricao: Joi.string().optional().allow('').allow(null),
    local_execucao: Joi.string().required(),
    vagas_disponiveis: Joi.number().integer().min(0).required(),
    campos_customizados: Joi.object().optional(),
    distancia_km: Joi.number().optional().allow(null), // Permitir envio direto se o front mandar number
    preco_combustivel_referencia: Joi.number().optional().allow(null),
    cursos_exames: Joi.array().items(
        Joi.object({
            curso_exame_id: Joi.string().uuid().required(),
            vagas: Joi.number().integer().min(0).required(),
        })
    ).optional(),
});

/**
 * GET /api/acoes
 * Listar ações (público)
 * Query params: municipio, estado, status, tipo, data_inicio, page, limit
 */
router.get('/', cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
        const { municipio, estado, status, tipo, data_inicio, page, limit } = req.query;

        const where: any = {};

        if (municipio) where.municipio = municipio;
        if (estado) where.estado = estado;
        if (status) where.status = status;
        if (tipo) where.tipo = tipo;
        if (data_inicio) {
            where.data_inicio = {
                [Op.gte]: new Date(data_inicio as string),
            };
        }

        // Optional pagination (backward compatible - defaults to no pagination)
        const pageNum = page ? parseInt(page as string) : undefined;
        const limitNum = limit ? parseInt(limit as string) : undefined;
        const offset = pageNum && limitNum ? (pageNum - 1) * limitNum : undefined;

        const queryOptions: any = {
            where,
            include: [
                {
                    model: Instituicao,
                    as: 'instituicao',
                    attributes: ['id', 'razao_social'], // Already optimized
                },
                {
                    model: AcaoCursoExame,
                    as: 'cursos_exames',
                    attributes: ['id', 'acao_id', 'curso_exame_id', 'vagas'], // Only necessary fields
                    include: [
                        {
                            model: CursoExame,
                            as: 'curso_exame',
                            attributes: ['id', 'nome', 'tipo'], // Only necessary fields
                        },
                    ],
                },
                {
                    model: Caminhao,
                    as: 'caminhoes',
                    attributes: ['id', 'placa', 'modelo'], // Only necessary fields
                },
                {
                    model: Funcionario,
                    as: 'funcionarios',
                    attributes: ['id', 'nome', 'cargo'], // Only necessary fields
                },
            ],
            order: [['numero_acao', 'ASC']], // Do menor para o maior
        };

        // Add pagination if requested
        if (limitNum) queryOptions.limit = limitNum;
        if (offset !== undefined) queryOptions.offset = offset;

        // Use findAndCountAll if pagination is requested, otherwise findAll
        if (pageNum && limitNum) {
            const { count, rows: acoes } = await Acao.findAndCountAll(queryOptions);
            res.json({
                acoes,
                pagination: {
                    total: count,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(count / limitNum),
                },
            });
        } else {
            const acoes = await Acao.findAll(queryOptions);
            res.json(acoes);
        }
    } catch (error: any) {
        console.error('❌ ERRO GET ACOES:', error);
        res.status(500).json({ error: 'Erro ao buscar ações' });
    }
});

/**
 * GET /api/acoes/:id
 * Buscar ação por ID (público)
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const acao = await Acao.findByPk(id, {
            include: [
                {
                    model: Instituicao,
                    as: 'instituicao',
                },
                {
                    model: AcaoCursoExame,
                    as: 'cursos_exames',
                    include: [
                        {
                            model: CursoExame,
                            as: 'curso_exame',
                        },
                    ],
                },
                {
                    model: Caminhao,
                    as: 'caminhoes',
                },
                {
                    model: Funcionario,
                    as: 'funcionarios',
                },
            ],
        });

        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        // Calcular custos
        const dataInicio = new Date(acao.data_inicio);
        const dataFim = new Date(acao.data_fim);
        const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const funcionariosList = (acao as any).funcionarios || [];
        const custoFuncionarios = funcionariosList.reduce((acc: number, f: any) => {
            const custo = f.custo_diario ? Number(f.custo_diario) : 0;
            return acc + (custo * dias);
        }, 0);
        const custoTotal = custoFuncionarios;

        // Contar atendidos (status 'atendido')
        const atendidos = await Inscricao.count({
            where: {
                acao_id: id,
                status: 'atendido'
            }
        });

        // Safe division
        const custoPorPessoa = atendidos > 0 ? custoTotal / atendidos : 0;

        res.json({
            ...acao.toJSON(),
            resumo_financeiro: {
                dias: dias > 0 ? dias : 0,
                custo_funcionarios: custoFuncionarios,
                custo_total: custoTotal,
                atendidos,
                custo_por_pessoa: Number(custoPorPessoa.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Error fetching acao:', error);
        res.status(500).json({ error: 'Erro ao buscar ação' });
    }
});

/**
 * GET /api/acoes/:id/funcionarios
 * Listar funcionários vinculados à ação (admin)
 */
router.get('/:id/funcionarios', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const vinculos = await AcaoFuncionario.findAll({
            where: { acao_id: id },
            include: [
                {
                    model: Funcionario,
                    as: 'funcionario',
                },
            ],
        });

        // Mapear para incluir dados da junção
        const funcionariosComCusto = vinculos.map((vinculo: any) => ({
            ...vinculo.funcionario.toJSON(),
            valor_diaria: vinculo.valor_diaria,
            dias_trabalhados: vinculo.dias_trabalhados,
            acao_funcionario_id: vinculo.id,
        }));

        res.json(funcionariosComCusto);
    } catch (error) {
        console.error('Error fetching action employees:', error);
        res.status(500).json({ error: 'Erro ao buscar funcionários da ação' });
    }
});


/**
 * POST /api/acoes
 * Criar nova ação (admin)
 */
router.post(
    '/',
    authenticate,
    authorizeAdmin,
    validate(createAcaoSchema),
    async (req: Request, res: Response) => {
        try {
            const { cursos_exames, ...acaoData } = req.body;

            // Criar a ação
            const acao = await Acao.create(acaoData);

            // Vincular cursos/exames se fornecidos (BULK CREATE - muito mais rápido!)
            if (cursos_exames && Array.isArray(cursos_exames) && cursos_exames.length > 0) {
                await AcaoCursoExame.bulkCreate(
                    cursos_exames.map((ce: any) => ({
                        acao_id: acao.id,
                        curso_exame_id: ce.curso_exame_id,
                        vagas: ce.vagas,
                    }))
                );
            }

            // Limpar cache para que a nova ação apareça imediatamente
            await clearCache('cache:/api/acoes*');

            // Retornar a ação criada diretamente (sem query extra)
            res.status(201).json({
                message: 'Ação criada com sucesso',
                acao: acao,
            });
        } catch (error) {
            console.error('Error creating acao:', error);
            res.status(500).json({ error: 'Erro ao criar ação' });
        }
    }
);

/**
 * PUT /api/acoes/:id
 * Atualizar ação (admin)
 */
router.put('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Sanitização de decimais vindos como string com vírgula (gambiarra frontend-friendly)
        if (typeof updateData.distancia_km === 'string') {
            updateData.distancia_km = parseFloat(updateData.distancia_km.replace(',', '.'));
        }
        if (typeof updateData.preco_combustivel_referencia === 'string') {
            updateData.preco_combustivel_referencia = parseFloat(updateData.preco_combustivel_referencia.replace(',', '.'));
        }

        const acao = await Acao.findByPk(id);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        await acao.update(updateData);

        // Limpar cache
        await clearCache('cache:/api/acoes*');

        res.json({
            message: 'Ação atualizada com sucesso',
            acao,
        });
    } catch (error) {
        console.error('Error updating acao:', error);
        res.status(500).json({ error: 'Erro ao atualizar ação' });
    }
});

/**
 * POST /api/acoes/:id/cursos-exames
 * Vincular curso/exame (admin)
 */
router.post('/:id/cursos-exames', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { curso_exame_id, vagas } = req.body;

        if (!curso_exame_id || !vagas) {
            res.status(400).json({ error: 'curso_exame_id e vagas são obrigatórios' });
            return;
        }

        const acao = await Acao.findByPk(id);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        const cursoExame = await CursoExame.findByPk(curso_exame_id);
        if (!cursoExame) {
            res.status(404).json({ error: 'Curso/Exame não encontrado' });
            return;
        }

        const acaoCursoExame = await AcaoCursoExame.create({
            acao_id: id,
            curso_exame_id,
            vagas,
        } as any);

        // Limpar cache
        await clearCache('cache:/api/acoes*');

        res.status(201).json({
            message: 'Curso/Exame vinculado com sucesso',
            acaoCursoExame,
        });
    } catch (error) {
        console.error('Error linking curso/exame:', error);
        res.status(500).json({ error: 'Erro ao vincular curso/exame' });
    }
});

/**
 * DELETE /api/acoes/:id/cursos-exames/:cursoExameId
 * Desvincular curso/exame (admin)
 */
router.delete('/:id/cursos-exames/:cursoExameId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id, cursoExameId } = req.params;

        const link = await AcaoCursoExame.findOne({
            where: {
                acao_id: id,
                curso_exame_id: cursoExameId,
            },
        });

        if (!link) {
            res.status(404).json({ error: 'Vínculo não encontrado' });
            return;
        }

        await link.destroy();

        // Limpar cache
        await clearCache('cache:/api/acoes*');

        res.json({ message: 'Curso/Exame desvinculado com sucesso' });
    } catch (error) {
        console.error('Error unlinking curso/exame:', error);
        res.status(500).json({ error: 'Erro ao desvincular curso/exame' });
    }
});

// === ROTAS FALTANTES ADICIONADAS ===

/**
 * POST /api/acoes/:id/caminhoes
 * Vincular caminhão (admin)
 */
router.post('/:id/caminhoes', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { caminhao_id } = req.body; // Front manda { caminhao_id: "..." }

        if (!caminhao_id) {
            res.status(400).json({ error: 'caminhao_id é obrigatório' });
            return;
        }

        const acao = await Acao.findByPk(id);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        // Verificar se caminhão existe
        const caminhao = await Caminhao.findByPk(caminhao_id);
        if (!caminhao) {
            res.status(404).json({ error: 'Caminhão não encontrado' });
            return;
        }

        // Criar vínculo
        await AcaoCaminhao.create({
            acao_id: id,
            caminhao_id
        } as any);

        res.status(201).json({ message: 'Caminhão vinculado com sucesso' });
    } catch (error) {
        console.error('Error linking caminhao:', error);
        res.status(500).json({ error: 'Erro ao vincular caminhão' });
    }
});

/**
 * DELETE /api/acoes/:id/caminhoes/:caminhaoId
 * Desvincular caminhão
 */
router.delete('/:id/caminhoes/:caminhaoId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id, caminhaoId } = req.params;

        const link = await AcaoCaminhao.findOne({
            where: {
                acao_id: id,
                caminhao_id: caminhaoId
            }
        });

        if (!link) {
            res.status(404).json({ error: 'Vínculo não encontrado' });
            return;
        }

        await link.destroy();
        res.json({ message: 'Caminhão desvinculado com sucesso' });

    } catch (error) {
        console.error('Error unlinking caminhao:', error);
        res.status(500).json({ error: 'Erro ao desvincular caminhão' });
    }
});

/**
 * POST /api/acoes/:id/funcionarios
 * Vincular funcionário (admin)
 */
router.post('/:id/funcionarios', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { funcionario_id, data_vencimento } = req.body;

        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        const acao = await Acao.findByPk(id);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        const func = await Funcionario.findByPk(funcionario_id);
        if (!func) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }

        // Calcular dias trabalhados
        const dataInicio = new Date(acao.data_inicio);
        const dataFim = new Date(acao.data_fim);
        const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Calcular valor total
        const custoDiario = func.custo_diaria || 0;
        const valorTotal = custoDiario * dias;

        // Criar vínculo funcionário-ação
        await AcaoFuncionario.create({
            acao_id: id,
            funcionario_id,
            valor_diaria: custoDiario,
            dias_trabalhados: dias
        } as any);

        // Criar conta a pagar automaticamente
        await ContaPagar.create({
            tipo_conta: 'funcionario',
            descricao: `Funcionário: ${func.nome} - Ação ${acao.numero_acao}`,
            valor: valorTotal,
            data_vencimento: data_vencimento || acao.data_fim, // Usa data customizada ou fim da ação
            status: 'pendente',
            recorrente: false,
            observacoes: `Custo diário: R$ ${custoDiario.toFixed(2)} × ${dias} dias`,
            acao_id: id,
            cidade: acao.municipio,
        });

        res.status(201).json({
            message: 'Funcionário vinculado com sucesso',
            conta_criada: true,
            valor_total: valorTotal,
            dias_trabalhados: dias
        });

    } catch (error) {
        console.error('Error linking funcionario:', error);
        res.status(500).json({ error: 'Erro ao vincular funcionário' });
    }
});

/**
 * DELETE /api/acoes/:id/funcionarios/:funcionarioId
 * Desvincular funcionário
 */
router.delete('/:id/funcionarios/:funcionarioId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id, funcionarioId } = req.params;

        const link = await AcaoFuncionario.findOne({
            where: {
                acao_id: id,
                funcionario_id: funcionarioId
            }
        });

        if (!link) {
            res.status(404).json({ error: 'Vínculo não encontrado' });
            return;
        }

        await link.destroy();
        res.json({ message: 'Funcionário desvinculado com sucesso' });
    } catch (error) {
        console.error('Error unlinking funcionario:', error);
        res.status(500).json({ error: 'Erro ao desvincular funcionário' });
    }
});

/**
 * PUT /api/acoes/:id/funcionarios/:funcionarioId
 * Atualizar dias trabalhados do funcionário
 */
router.put('/:id/funcionarios/:funcionarioId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id, funcionarioId } = req.params;
        const { dias_trabalhados } = req.body;

        // Validação
        if (!dias_trabalhados || dias_trabalhados < 1) {
            res.status(400).json({ error: 'Dias trabalhados deve ser maior ou igual a 1' });
            return;
        }

        if (!Number.isInteger(Number(dias_trabalhados))) {
            res.status(400).json({ error: 'Dias trabalhados deve ser um número inteiro' });
            return;
        }

        const link = await AcaoFuncionario.findOne({
            where: {
                acao_id: id,
                funcionario_id: funcionarioId
            }
        });

        if (!link) {
            res.status(404).json({ error: 'Vínculo não encontrado' });
            return;
        }

        await link.update({ dias_trabalhados: Number(dias_trabalhados) });
        res.json({ message: 'Dias trabalhados atualizado com sucesso', data: link });
    } catch (error) {
        console.error('Error updating dias_trabalhados:', error);
        res.status(500).json({ error: 'Erro ao atualizar dias trabalhados' });
    }
});


export default router;
