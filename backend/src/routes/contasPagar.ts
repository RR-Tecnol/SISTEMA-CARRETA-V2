import { Router, Request, Response } from 'express';
import { ContaPagar } from '../models/ContaPagar';
import { authenticate } from '../middlewares/auth';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configurar multer para upload de comprovantes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/comprovantes';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'comprovante-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens (JPEG, PNG) e PDF são permitidos'));
        }
    }
});

/**
 * GET /api/contas-pagar
 * Listar todas as contas a pagar com filtros
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const {
            status,
            tipo_conta,
            data_inicio,
            data_fim,
            recorrente,
            acao_id,
            page = 1,
            limit = 20
        } = req.query;

        const where: any = {};

        if (status) where.status = status;
        if (tipo_conta) where.tipo_conta = tipo_conta;
        if (recorrente !== undefined) where.recorrente = recorrente === 'true';
        if (acao_id) where.acao_id = acao_id;

        if (data_inicio && data_fim) {
            where.data_vencimento = {
                [Op.between]: [new Date(data_inicio as string), new Date(data_fim as string)]
            };
        }


        const offset = (Number(page) - 1) * Number(limit);

        const { rows: contas, count } = await ContaPagar.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            order: [['data_vencimento', 'DESC']],
            include: [
                {
                    association: 'caminhao',
                    attributes: ['id', 'placa', 'modelo'],
                    required: false
                }
            ]
        });

        res.json({
            contas,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error: any) {
        console.error('❌ ERRO ao listar contas:', error.message);
        res.status(500).json({
            error: 'Erro ao listar contas a pagar',
            details: error.message
        });
    }
});

/**
 * GET /api/contas-pagar/:id
 * Buscar conta específica
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const conta = await ContaPagar.findByPk(id);

        if (!conta) {
            res.status(404).json({ error: 'Conta não encontrada' });
            return;
        }

        res.json(conta);
    } catch (error: any) {
        console.error('Erro ao buscar conta:', error);
        res.status(500).json({ error: 'Erro ao buscar conta' });
    }
});

/**
 * POST /api/contas-pagar
 * Criar nova conta a pagar
 */
router.post('/', authenticate, upload.single('comprovante'), async (req: Request, res: Response) => {
    try {
        const {
            tipo_conta,
            tipo_espontaneo,
            descricao,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            recorrente,
            observacoes,
        } = req.body;

        const comprovante_url = req.file ? `/uploads/comprovantes/${req.file.filename}` : undefined;

        // Função para converter string de data (YYYY-MM-DD) para Date no timezone local
        const parseLocalDate = (dateString: string): Date => {
            if (!dateString) return new Date();

            // Se já tem informação de hora, usar diretamente
            if (dateString.includes('T')) {
                return new Date(dateString);
            }

            // Separar ano, mês e dia
            const [year, month, day] = dateString.split('-').map(Number);

            // Criar data no timezone local (mês é 0-indexed)
            return new Date(year, month - 1, day, 12, 0, 0, 0);
        };

        console.log('📝 Criando conta a pagar:', {
            tipo_conta,
            descricao,
            valor,
            acao_id: req.body.acao_id,
            cidade: req.body.cidade
        });

        const conta = await ContaPagar.create({
            tipo_conta,
            tipo_espontaneo: tipo_conta === 'espontaneo' ? tipo_espontaneo : null,
            descricao,
            valor: parseFloat(valor),
            data_vencimento: parseLocalDate(data_vencimento),
            data_pagamento: data_pagamento ? parseLocalDate(data_pagamento) : undefined,
            status: status || 'pendente',
            comprovante_url,
            recorrente: recorrente === 'true' || recorrente === true,
            observacoes,
            acao_id: req.body.acao_id || null,
            cidade: req.body.cidade || null,
            caminhao_id: req.body.caminhao_id || null,
        } as any);

        console.log('✅ Conta criada com sucesso:', {
            id: conta.id,
            acao_id: conta.acao_id,
            descricao: conta.descricao
        });

        res.status(201).json(conta);
    } catch (error: any) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ error: 'Erro ao criar conta a pagar' });
    }
});

/**
 * PUT /api/contas-pagar/:id
 * Atualizar conta a pagar
 */
router.put('/:id', authenticate, upload.single('comprovante'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            tipo_conta,
            tipo_espontaneo,
            descricao,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            recorrente,
            observacoes,
        } = req.body;

        const conta = await ContaPagar.findByPk(id);

        if (!conta) {
            res.status(404).json({ error: 'Conta não encontrada' });
            return;
        }

        const comprovante_url = req.file
            ? `/uploads/comprovantes/${req.file.filename}`
            : conta.comprovante_url;

        // Função para converter string de data (YYYY-MM-DD) para Date no timezone local
        const parseLocalDate = (dateString: string): Date => {
            if (!dateString) return new Date();

            // Se já tem informação de hora, usar diretamente
            if (dateString.includes('T')) {
                return new Date(dateString);
            }

            // Separar ano, mês e dia
            const [year, month, day] = dateString.split('-').map(Number);

            // Criar data no timezone local (mês é 0-indexed)
            return new Date(year, month - 1, day, 12, 0, 0, 0);
        };

        await conta.update({
            tipo_conta,
            tipo_espontaneo: tipo_conta === 'espontaneo' ? tipo_espontaneo : null,
            descricao,
            valor: valor ? parseFloat(valor) : conta.valor,
            data_vencimento: data_vencimento ? parseLocalDate(data_vencimento) : conta.data_vencimento,
            data_pagamento: data_pagamento ? parseLocalDate(data_pagamento) : conta.data_pagamento,
            status: status || conta.status,
            comprovante_url,
            recorrente: recorrente !== undefined ? (recorrente === 'true' || recorrente === true) : conta.recorrente,
            observacoes,
        });

        res.json(conta);
    } catch (error: any) {
        console.error('Erro ao atualizar conta:', error);
        res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
});

/**
 * DELETE /api/contas-pagar/:id
 * Deletar conta a pagar
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const conta = await ContaPagar.findByPk(id);

        if (!conta) {
            res.status(404).json({ error: 'Conta não encontrada' });
            return;
        }

        // Deletar arquivo de comprovante se existir
        if (conta.comprovante_url) {
            const filePath = path.join(process.cwd(), conta.comprovante_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await conta.destroy();

        res.json({ message: 'Conta deletada com sucesso' });
    } catch (error: any) {
        console.error('Erro ao deletar conta:', error);
        res.status(500).json({ error: 'Erro ao deletar conta' });
    }
});

/**
 * GET /api/contas-pagar/relatorio/mensal
 * Relatório mensal de contas
 */
router.get('/relatorio/mensal', authenticate, async (req: Request, res: Response) => {
    try {
        const { mes, ano } = req.query;

        if (!mes || !ano) {
            res.status(400).json({ error: 'Mês e ano são obrigatórios' });
            return;
        }

        const dataInicio = new Date(Number(ano), Number(mes) - 1, 1);
        const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59);

        const contas = await ContaPagar.findAll({
            where: {
                data_vencimento: {
                    [Op.between]: [dataInicio, dataFim]
                }
            },
            order: [['data_vencimento', 'ASC']],
        });

        const totalPendente = contas
            .filter(c => c.status === 'pendente')
            .reduce((sum, c) => sum + Number(c.valor), 0);

        const totalPago = contas
            .filter(c => c.status === 'paga')
            .reduce((sum, c) => sum + Number(c.valor), 0);

        const totalVencido = contas
            .filter(c => c.status === 'vencida')
            .reduce((sum, c) => sum + Number(c.valor), 0);

        res.json({
            contas,
            resumo: {
                total: contas.length,
                totalPendente,
                totalPago,
                totalVencido,
                totalGeral: totalPendente + totalPago + totalVencido,
            }
        });
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório mensal' });
    }
});

/**
 * GET /api/contas-pagar/relatorios/por-acao
 * Relatório de custos por ação
 */
router.get('/relatorios/por-acao', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.query;

        const where: any = {};
        if (acao_id) {
            where.acao_id = acao_id;
        }

        const contas = await ContaPagar.findAll({
            where,
            order: [['data_vencimento', 'DESC']],
        });

        // Agrupar por ação
        const relatorio: any = {};
        contas.forEach(conta => {
            const acaoId = conta.acao_id || 'sem_acao';
            if (!relatorio[acaoId]) {
                relatorio[acaoId] = {
                    acao_id: acaoId,
                    total: 0,
                    contas: [],
                };
            }
            relatorio[acaoId].total += Number(conta.valor);
            relatorio[acaoId].contas.push(conta);
        });

        res.json({
            success: true,
            relatorio: Object.values(relatorio),
        });
    } catch (error: any) {
        console.error('Erro ao gerar relatório por ação:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por ação' });
    }
});

/**
 * GET /api/contas-pagar/relatorios/por-cidade
 * Relatório de custos por cidade
 */
router.get('/relatorios/por-cidade', authenticate, async (req: Request, res: Response) => {
    try {
        const { cidade } = req.query;

        const where: any = {};
        if (cidade) {
            where.cidade = { [Op.iLike]: `%${cidade}%` };
        }

        const contas = await ContaPagar.findAll({
            where,
            order: [['cidade', 'ASC'], ['data_vencimento', 'DESC']],
        });

        // Agrupar por cidade
        const relatorio: any = {};
        contas.forEach(conta => {
            const cidadeNome = conta.cidade || 'sem_cidade';
            if (!relatorio[cidadeNome]) {
                relatorio[cidadeNome] = {
                    cidade: cidadeNome,
                    total: 0,
                    contas: [],
                };
            }
            relatorio[cidadeNome].total += Number(conta.valor);
            relatorio[cidadeNome].contas.push(conta);
        });

        res.json({
            success: true,
            relatorio: Object.values(relatorio),
        });
    } catch (error: any) {
        console.error('Erro ao gerar relatório por cidade:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por cidade' });
    }
});

/**
 * GET /api/contas-pagar/relatorios/exportar
 * Exportar relatório em diferentes formatos (XLSX, CSV)
 */
router.get('/relatorios/exportar', authenticate, async (req: Request, res: Response) => {
    try {
        const { formato = 'xlsx', periodo, tipo_conta, status, cidade } = req.query;

        const where: any = {};

        if (periodo) {
            const [ano, mes] = (periodo as string).split('-');
            const startDate = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            const endDate = new Date(parseInt(ano), parseInt(mes), 0);
            where.data_vencimento = {
                [Op.between]: [startDate, endDate],
            };
        }

        if (tipo_conta) where.tipo_conta = tipo_conta;
        if (status) where.status = status;
        if (cidade) where.cidade = { [Op.iLike]: `%${cidade}%` };

        const contas = await ContaPagar.findAll({
            where,
            order: [['data_vencimento', 'DESC']],
        });

        if (formato === 'xlsx') {
            const XLSX = require('xlsx');

            const data = contas.map(conta => ({
                'Tipo': conta.tipo_conta,
                'Descrição': conta.descricao,
                'Valor': Number(conta.valor),
                'Vencimento': new Date(conta.data_vencimento).toLocaleDateString('pt-BR'),
                'Status': conta.status,
                'Cidade': conta.cidade || '-',
                'Recorrente': conta.recorrente ? 'Sim' : 'Não',
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contas a Pagar');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', `attachment; filename=contas-pagar-${periodo || 'todos'}.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else if (formato === 'csv') {
            const data = contas.map(conta => ({
                tipo: conta.tipo_conta,
                descricao: conta.descricao,
                valor: Number(conta.valor),
                vencimento: new Date(conta.data_vencimento).toLocaleDateString('pt-BR'),
                status: conta.status,
                cidade: conta.cidade || '-',
                recorrente: conta.recorrente ? 'Sim' : 'Não',
            }));

            const csv = [
                ['Tipo', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Cidade', 'Recorrente'],
                ...data.map(row => [
                    row.tipo,
                    row.descricao,
                    row.valor.toString(),
                    row.vencimento,
                    row.status,
                    row.cidade,
                    row.recorrente,
                ]),
            ].map(row => row.join(',')).join('\n');

            res.setHeader('Content-Disposition', `attachment; filename=contas-pagar-${periodo || 'todos'}.csv`);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.send('\uFEFF' + csv); // BOM para UTF-8
        } else {
            res.status(400).json({ error: 'Formato não suportado. Use xlsx ou csv' });
        }
    } catch (error: any) {
        console.error('Erro ao exportar relatório:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório' });
    }
});

export default router;
