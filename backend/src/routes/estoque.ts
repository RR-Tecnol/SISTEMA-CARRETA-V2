import { Router, Request, Response } from 'express';
import { Insumo } from '../models/Insumo';
import { MovimentacaoEstoque } from '../models/MovimentacaoEstoque';
import { EstoqueCaminhao } from '../models/EstoqueCaminhao';
import { AcaoInsumo } from '../models/AcaoInsumo';
import { Caminhao } from '../models/Caminhao';
import { Acao } from '../models/Acao';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import ExcelJS from 'exceljs';

const router = Router();

// ==================== CRUD DE INSUMOS ====================

// Listar insumos com filtros
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            categoria,
            status, // 'OK', 'BAIXO', 'CRITICO'
            busca,
            vencimento // 'VENCENDO', 'VENCIDO', 'OK'
        } = req.query;

        const where: any = {};

        if (categoria) {
            where.categoria = categoria;
        }

        if (busca) {
            where[Op.or] = [
                { nome: { [Op.iLike]: `%${busca}%` } },
                { descricao: { [Op.iLike]: `%${busca}%` } },
                { codigo_barras: { [Op.iLike]: `%${busca}%` } },
            ];
        }

        let insumos = await Insumo.findAll({
            where,
            order: [['nome', 'ASC']],
        });

        // Filtrar por status de estoque
        if (status) {
            insumos = insumos.filter(insumo => {
                const percentual = (insumo.quantidade_atual / insumo.quantidade_minima) * 100;

                if (status === 'CRITICO') {
                    return insumo.quantidade_atual === 0 || percentual < 50;
                } else if (status === 'BAIXO') {
                    return percentual >= 50 && percentual <= 100;
                } else if (status === 'OK') {
                    return percentual > 100;
                }
                return true;
            });
        }

        // Filtrar por vencimento
        if (vencimento) {
            const hoje = new Date();
            const em30Dias = new Date();
            em30Dias.setDate(hoje.getDate() + 30);

            insumos = insumos.filter(insumo => {
                if (!insumo.data_validade) return vencimento === 'OK';

                const dataValidade = new Date(insumo.data_validade);

                if (vencimento === 'VENCIDO') {
                    return dataValidade < hoje;
                } else if (vencimento === 'VENCENDO') {
                    return dataValidade >= hoje && dataValidade <= em30Dias;
                } else if (vencimento === 'OK') {
                    return dataValidade > em30Dias;
                }
                return true;
            });
        }

        res.json(insumos);
    } catch (error: any) {
        console.error('Erro ao listar insumos:', error);
        res.status(500).json({ error: 'Erro ao listar insumos', details: error.message });
    }
});

// Buscar insumo por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);

        if (!insumo) {
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        res.json(insumo);
    } catch (error: any) {
        console.error('Erro ao buscar insumo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumo', details: error.message });
    }
});

// Criar insumo
router.post('/', async (req: Request, res: Response) => {
    try {
        const insumo = await Insumo.create(req.body);
        res.status(201).json(insumo);
    } catch (error: any) {
        console.error('Erro ao criar insumo:', error);
        res.status(500).json({ error: 'Erro ao criar insumo', details: error.message });
    }
});

// Atualizar insumo
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);

        if (!insumo) {
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        await insumo.update(req.body);
        res.json(insumo);
    } catch (error: any) {
        console.error('Erro ao atualizar insumo:', error);
        res.status(500).json({ error: 'Erro ao atualizar insumo', details: error.message });
    }
});

// Deletar insumo
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const insumo = await Insumo.findByPk(req.params.id);

        if (!insumo) {
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        await insumo.destroy();
        res.json({ message: 'Insumo deletado com sucesso' });
    } catch (error: any) {
        console.error('Erro ao deletar insumo:', error);
        res.status(500).json({ error: 'Erro ao deletar insumo', details: error.message });
    }
});

// ==================== ALERTAS ====================

// Insumos com estoque baixo ou crítico
router.get('/alertas/estoque-baixo', async (req: Request, res: Response) => {
    try {
        const insumos = await Insumo.findAll({
            where: {
                ativo: true,
            },
        });

        const alertas = insumos.filter(insumo => {
            return insumo.quantidade_atual <= insumo.quantidade_minima;
        }).map(insumo => ({
            ...insumo.toJSON(),
            percentual: (insumo.quantidade_atual / insumo.quantidade_minima) * 100,
            status: insumo.quantidade_atual === 0 ? 'CRITICO' :
                (insumo.quantidade_atual / insumo.quantidade_minima) < 0.5 ? 'CRITICO' : 'BAIXO',
        }));

        res.json(alertas);
    } catch (error: any) {
        console.error('Erro ao buscar alertas:', error);
        res.status(500).json({ error: 'Erro ao buscar alertas', details: error.message });
    }
});

// Insumos próximos ao vencimento
router.get('/alertas/vencendo', async (req: Request, res: Response) => {
    try {
        const hoje = new Date();
        const em30Dias = new Date();
        em30Dias.setDate(hoje.getDate() + 30);

        const insumos = await Insumo.findAll({
            where: {
                ativo: true,
                data_validade: {
                    [Op.between]: [hoje, em30Dias],
                },
            },
            order: [['data_validade', 'ASC']],
        });

        const alertas = insumos.map(insumo => ({
            ...insumo.toJSON(),
            dias_para_vencer: Math.ceil((new Date(insumo.data_validade!).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
        }));

        res.json(alertas);
    } catch (error: any) {
        console.error('Erro ao buscar insumos vencendo:', error);
        res.status(500).json({ error: 'Erro ao buscar insumos vencendo', details: error.message });
    }
});

// ==================== MOVIMENTAÇÕES ====================

// Registrar movimentação
router.post('/movimentacao', async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            insumo_id,
            tipo,
            quantidade,
            origem,
            destino,
            caminhao_id,
            acao_id,
            motorista_id,
            nota_fiscal,
            observacao: observacoes,
            usuario_id,
        } = req.body;

        const insumo = await Insumo.findByPk(insumo_id, { transaction });

        if (!insumo) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        const quantidade_anterior = insumo.quantidade_atual;
        let quantidade_atual = quantidade_anterior;

        // Calcular nova quantidade baseado no tipo de movimentação
        if (tipo === 'ENTRADA') {
            quantidade_atual += quantidade;
        } else if (tipo === 'SAIDA' || tipo === 'PERDA') {
            quantidade_atual -= quantidade;
        } else if (tipo === 'TRANSFERENCIA') {
            // Para transferência, reduz do estoque central
            if (origem === 'CAPITAL') {
                quantidade_atual -= quantidade;
            }
        } else if (tipo === 'AJUSTE') {
            quantidade_atual = quantidade; // Ajuste define o valor absoluto
        }

        // Atualizar quantidade do insumo
        await insumo.update({ quantidade_atual }, { transaction });

        // Se for transferência para caminhão, atualizar estoque do caminhão
        if (tipo === 'TRANSFERENCIA' && caminhao_id && destino !== 'CAPITAL') {
            const estoqueCaminhao = await EstoqueCaminhao.findOne({
                where: { caminhao_id, insumo_id },
                transaction,
            });

            if (estoqueCaminhao) {
                await estoqueCaminhao.update({
                    quantidade: estoqueCaminhao.quantidade + quantidade,
                    ultima_atualizacao: new Date(),
                }, { transaction });
            } else {
                await EstoqueCaminhao.create({
                    caminhao_id,
                    insumo_id,
                    quantidade,
                    ultima_atualizacao: new Date(),
                }, { transaction });
            }
        }

        // Registrar movimentação
        const movimentacao = await MovimentacaoEstoque.create({
            insumo_id,
            tipo,
            quantidade,
            quantidade_anterior,
            quantidade_atual,
            origem,
            destino,
            caminhao_id,
            acao_id,
            motorista_id,
            nota_fiscal,
            observacoes,
            data_movimento: new Date(),
            usuario_id,
        }, { transaction });

        await transaction.commit();
        res.status(201).json(movimentacao);
    } catch (error: any) {
        await transaction.rollback();
        console.error('Erro ao registrar movimentação:', error);
        res.status(500).json({ error: 'Erro ao registrar movimentação', details: error.message });
    }
});

// Listar movimentações
router.get('/movimentacao', async (req: Request, res: Response) => {
    try {
        const { insumo_id, tipo, data_inicio, data_fim, caminhao_id, acao_id } = req.query;

        const where: any = {};

        if (insumo_id) where.insumo_id = insumo_id;
        if (tipo) where.tipo = tipo;
        if (caminhao_id) where.caminhao_id = caminhao_id;
        if (acao_id) where.acao_id = acao_id;

        if (data_inicio && data_fim) {
            where.data_movimentacao = {
                [Op.between]: [new Date(data_inicio as string), new Date(data_fim as string)],
            };
        }

        const movimentacoes = await MovimentacaoEstoque.findAll({
            where,
            include: [
                { model: Insumo, as: 'insumo', attributes: ['id', 'nome', 'unidade'] },
                { model: Caminhao, as: 'caminhao', attributes: ['id', 'placa', 'modelo'], required: false },
                { model: Acao, as: 'acao', attributes: ['id', 'nome'], required: false },
            ],
            order: [['data_movimentacao', 'DESC']],
        });

        res.json(movimentacoes);
    } catch (error: any) {
        console.error('Erro ao listar movimentações:', error);
        res.status(500).json({ error: 'Erro ao listar movimentações', details: error.message });
    }
});

// Detalhes de uma movimentação
router.get('/movimentacao/:id', async (req: Request, res: Response) => {
    try {
        const movimentacao = await MovimentacaoEstoque.findByPk(req.params.id, {
            include: [
                { model: Insumo, as: 'insumo' },
                { model: Caminhao, as: 'caminhao', required: false },
                { model: Acao, as: 'acao', required: false },
            ],
        });

        if (!movimentacao) {
            return res.status(404).json({ error: 'Movimentação não encontrada' });
        }

        res.json(movimentacao);
    } catch (error: any) {
        console.error('Erro ao buscar movimentação:', error);
        res.status(500).json({ error: 'Erro ao buscar movimentação', details: error.message });
    }
});

// ==================== ESTOQUE POR CAMINHÃO ====================

// Listar estoque de um caminhão
router.get('/caminhao/:caminhao_id', async (req: Request, res: Response) => {
    try {
        const estoque = await EstoqueCaminhao.findAll({
            where: { caminhao_id: req.params.caminhao_id },
            include: [
                { model: Insumo, as: 'insumo' },
            ],
        });

        res.json(estoque);
    } catch (error: any) {
        console.error('Erro ao listar estoque do caminhão:', error);
        res.status(500).json({ error: 'Erro ao listar estoque do caminhão', details: error.message });
    }
});

// Transferir insumo entre capital e caminhão
router.post('/transferir', async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            insumo_id,
            caminhao_id,
            quantidade,
            origem, // 'CAPITAL' ou caminhao_id
            destino, // 'CAPITAL' ou caminhao_id
            motorista_id,
            observacao: observacoes,
            usuario_id,
        } = req.body;

        const insumo = await Insumo.findByPk(insumo_id, { transaction });

        if (!insumo) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Insumo não encontrado' });
        }

        // Se origem é CAPITAL, reduzir do estoque central
        if (origem === 'CAPITAL') {
            if (insumo.quantidade_atual < quantidade) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Quantidade insuficiente no estoque central' });
            }

            await insumo.update({
                quantidade_atual: insumo.quantidade_atual - quantidade,
            }, { transaction });

            // Adicionar ao estoque do caminhão
            const estoqueCaminhao = await EstoqueCaminhao.findOne({
                where: { caminhao_id, insumo_id },
                transaction,
            });

            if (estoqueCaminhao) {
                await estoqueCaminhao.update({
                    quantidade: estoqueCaminhao.quantidade + quantidade,
                    ultima_atualizacao: new Date(),
                }, { transaction });
            } else {
                await EstoqueCaminhao.create({
                    caminhao_id,
                    insumo_id,
                    quantidade,
                    ultima_atualizacao: new Date(),
                }, { transaction });
            }
        } else {
            // Origem é caminhão, destino é CAPITAL
            const estoqueCaminhao = await EstoqueCaminhao.findOne({
                where: { caminhao_id: origem, insumo_id },
                transaction,
            });

            if (!estoqueCaminhao || estoqueCaminhao.quantidade < quantidade) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Quantidade insuficiente no estoque do caminhão' });
            }

            await estoqueCaminhao.update({
                quantidade: estoqueCaminhao.quantidade - quantidade,
                ultima_atualizacao: new Date(),
            }, { transaction });

            await insumo.update({
                quantidade_atual: insumo.quantidade_atual + quantidade,
            }, { transaction });
        }

        // Registrar movimentação
        const movimentacao = await MovimentacaoEstoque.create({
            insumo_id,
            tipo: 'TRANSFERENCIA',
            quantidade,
            quantidade_anterior: insumo.quantidade_atual,
            quantidade_atual: origem === 'CAPITAL' ? insumo.quantidade_atual - quantidade : insumo.quantidade_atual + quantidade,
            origem,
            destino,
            caminhao_id,
            motorista_id,
            observacoes,
            data_movimento: new Date(),
            usuario_id,
        }, { transaction });

        await transaction.commit();
        res.status(201).json(movimentacao);
    } catch (error: any) {
        await transaction.rollback();
        console.error('Erro ao transferir insumo:', error);
        res.status(500).json({ error: 'Erro ao transferir insumo', details: error.message });
    }
});

// ==================== CONSUMO POR AÇÃO ====================

// Registrar consumo em ação
router.post('/acao/:acao_id/consumo', async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
        const { acao_id } = req.params;
        const { insumo_id, quantidade_utilizada, caminhao_id, observacao: observacoes, usuario_id } = req.body;

        // Reduzir do estoque do caminhão
        const estoqueCaminhao = await EstoqueCaminhao.findOne({
            where: { caminhao_id, insumo_id },
            transaction,
        });

        if (!estoqueCaminhao || estoqueCaminhao.quantidade < quantidade_utilizada) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Quantidade insuficiente no estoque do caminhão' });
        }

        await estoqueCaminhao.update({
            quantidade: estoqueCaminhao.quantidade - quantidade_utilizada,
            ultima_atualizacao: new Date(),
        }, { transaction });

        // Atualizar AcaoInsumo
        const acaoInsumo = await AcaoInsumo.findOne({
            where: { acao_id, insumo_id },
            transaction,
        });

        if (acaoInsumo) {
            await acaoInsumo.update({
                quantidade_utilizada: (acaoInsumo.quantidade_utilizada || 0) + quantidade_utilizada,
            }, { transaction });
        }

        // Registrar movimentação
        const movimentacao = await MovimentacaoEstoque.create({
            insumo_id,
            tipo: 'SAIDA',
            quantidade: quantidade_utilizada,
            quantidade_anterior: estoqueCaminhao.quantidade + quantidade_utilizada,
            quantidade_atual: estoqueCaminhao.quantidade,
            origem: caminhao_id,
            destino: acao_id,
            caminhao_id,
            acao_id,
            observacoes,
            data_movimento: new Date(),
            usuario_id,
        }, { transaction });

        await transaction.commit();
        res.status(201).json(movimentacao);
    } catch (error: any) {
        await transaction.rollback();
        console.error('Erro ao registrar consumo:', error);
        res.status(500).json({ error: 'Erro ao registrar consumo', details: error.message });
    }
});

// Listar consumo de uma ação
router.get('/acao/:acao_id/consumo', async (req: Request, res: Response) => {
    try {
        const consumo = await MovimentacaoEstoque.findAll({
            where: {
                acao_id: req.params.acao_id,
                tipo: 'SAIDA',
            },
            include: [
                { model: Insumo, as: 'insumo' },
            ],
            order: [['data_movimentacao', 'DESC']],
        });

        res.json(consumo);
    } catch (error: any) {
        console.error('Erro ao listar consumo da ação:', error);
        res.status(500).json({ error: 'Erro ao listar consumo da ação', details: error.message });
    }
});

// ==================== RELATÓRIOS ====================

// Relatório de movimentação
router.get('/relatorios/movimentacao', async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim, tipo } = req.query;

        const where: any = {};

        if (tipo) where.tipo = tipo;

        if (data_inicio && data_fim) {
            where.data_movimentacao = {
                [Op.between]: [new Date(data_inicio as string), new Date(data_fim as string)],
            };
        }

        const movimentacoes = await MovimentacaoEstoque.findAll({
            where,
            include: [
                { model: Insumo, as: 'insumo' },
                { model: Caminhao, as: 'caminhao', required: false },
                { model: Acao, as: 'acao', required: false },
            ],
            order: [['data_movimentacao', 'DESC']],
        });

        res.json(movimentacoes);
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
});

// Relatório de consumo por ação
router.get('/relatorios/consumo-por-acao', async (req: Request, res: Response) => {
    try {
        const consumoPorAcao = await MovimentacaoEstoque.findAll({
            where: {
                tipo: 'SAIDA',
                acao_id: { [Op.ne]: null },
            },
            include: [
                { model: Insumo, as: 'insumo' },
                { model: Acao, as: 'acao' },
            ],
            order: [['acao_id', 'ASC'], ['data_movimentacao', 'DESC']],
        });

        // Agrupar por ação
        const agrupado: any = {};

        consumoPorAcao.forEach((mov: any) => {
            const acaoId = mov.acao_id;

            if (!agrupado[acaoId]) {
                agrupado[acaoId] = {
                    acao: mov.acao,
                    insumos: [],
                    total_itens: 0,
                };
            }

            agrupado[acaoId].insumos.push({
                insumo: mov.insumo,
                quantidade: mov.quantidade,
                data: mov.data_movimentacao,
            });

            agrupado[acaoId].total_itens += mov.quantidade;
        });

        res.json(Object.values(agrupado));
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
});

// Relatório de estoque por caminhão
router.get('/relatorios/estoque-por-caminhao', async (req: Request, res: Response) => {
    try {
        const estoquePorCaminhao = await EstoqueCaminhao.findAll({
            include: [
                { model: Caminhao, as: 'caminhao' },
                { model: Insumo, as: 'insumo' },
            ],
            order: [['caminhao_id', 'ASC']],
        });

        // Agrupar por caminhão
        const agrupado: any = {};

        estoquePorCaminhao.forEach((estoque: any) => {
            const caminhaoId = estoque.caminhao_id;

            if (!agrupado[caminhaoId]) {
                agrupado[caminhaoId] = {
                    caminhao: estoque.caminhao,
                    insumos: [],
                    total_itens: 0,
                };
            }

            agrupado[caminhaoId].insumos.push({
                insumo: estoque.insumo,
                quantidade: estoque.quantidade,
                ultima_atualizacao: estoque.ultima_atualizacao,
            });

            agrupado[caminhaoId].total_itens += estoque.quantidade;
        });

        res.json(Object.values(agrupado));
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
});

// Exportar relatório (XLSX/CSV)
router.get('/relatorios/exportar', async (req: Request, res: Response) => {
    try {
        const { formato, tipo_relatorio } = req.query;

        let dados: any[] = [];
        let colunas: any[] = [];
        let nomeArquivo = '';

        if (tipo_relatorio === 'estoque') {
            const insumos = await Insumo.findAll({ where: { ativo: true } });
            dados = insumos.map((i: any) => ({
                Nome: i.nome,
                Categoria: i.categoria,
                'Quantidade Atual': i.quantidade_atual,
                'Quantidade Mínima': i.quantidade_minima,
                Unidade: i.unidade,
                'Preço Unitário': i.preco_unitario || 0,
                Lote: i.lote || '',
                Validade: i.data_validade ? new Date(i.data_validade).toLocaleDateString('pt-BR') : '',
            }));
            colunas = ['Nome', 'Categoria', 'Quantidade Atual', 'Quantidade Mínima', 'Unidade', 'Preço Unitário', 'Lote', 'Validade'];
            nomeArquivo = 'relatorio-estoque';
        } else if (tipo_relatorio === 'movimentacoes') {
            const movimentacoes = await MovimentacaoEstoque.findAll({
                include: [{ model: Insumo, as: 'insumo' }],
                order: [['data_movimentacao', 'DESC']],
                limit: 1000,
            });
            dados = movimentacoes.map((m: any) => ({
                Data: new Date(m.data_movimentacao).toLocaleDateString('pt-BR'),
                Tipo: m.tipo,
                Insumo: m.insumo?.nome || '',
                Quantidade: m.quantidade,
                'Qtd Anterior': m.quantidade_anterior,
                'Qtd Atual': m.quantidade_atual,
                Origem: m.origem || '',
                Destino: m.destino || '',
                Observação: m.observacao || '',
            }));
            colunas = ['Data', 'Tipo', 'Insumo', 'Quantidade', 'Qtd Anterior', 'Qtd Atual', 'Origem', 'Destino', 'Observação'];
            nomeArquivo = 'relatorio-movimentacoes';
        }

        if (formato === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Relatório');

            worksheet.columns = colunas.map(col => ({ header: col, key: col, width: 20 }));
            worksheet.addRows(dados);

            // Estilizar cabeçalho
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF5DADE2' },
            };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } else if (formato === 'csv') {
            const csv = [
                colunas.join(','),
                ...dados.map(row => colunas.map(col => `"${row[col]}"`).join(',')),
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}.csv`);
            res.send('\uFEFF' + csv); // BOM para UTF-8
        } else {
            res.status(400).json({ error: 'Formato inválido' });
        }
    } catch (error: any) {
        console.error('Erro ao exportar relatório:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
    }
});

export default router;
