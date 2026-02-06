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
            page = 1,
            limit = 20
        } = req.query;

        const where: any = {};

        if (status) where.status = status;
        if (tipo_conta) where.tipo_conta = tipo_conta;
        if (recorrente !== undefined) where.recorrente = recorrente === 'true';

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
        });

        res.json({
            contas,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error: any) {
        console.error('Erro ao listar contas:', error);
        res.status(500).json({ error: 'Erro ao listar contas a pagar' });
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

        const conta = await ContaPagar.create({
            tipo_conta,
            tipo_espontaneo: tipo_conta === 'espontaneo' ? tipo_espontaneo : null,
            descricao,
            valor: parseFloat(valor),
            data_vencimento: new Date(data_vencimento),
            data_pagamento: data_pagamento ? new Date(data_pagamento) : undefined,
            status: status || 'pendente',
            comprovante_url,
            recorrente: recorrente === 'true' || recorrente === true,
            observacoes,
        } as any);

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

        await conta.update({
            tipo_conta,
            tipo_espontaneo: tipo_conta === 'espontaneo' ? tipo_espontaneo : null,
            descricao,
            valor: valor ? parseFloat(valor) : conta.valor,
            data_vencimento: data_vencimento ? new Date(data_vencimento) : conta.data_vencimento,
            data_pagamento: data_pagamento ? new Date(data_pagamento) : conta.data_pagamento,
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

export default router;
