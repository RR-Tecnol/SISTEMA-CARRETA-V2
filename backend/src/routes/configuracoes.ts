import { Router, Request, Response } from 'express';
import { ConfiguracaoCampo } from '../models/ConfiguracaoCampo';
import { ConfiguracaoSistema } from '../models/ConfiguracaoSistema';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/configuracoes/campos
 * Listar campos configurados (público)
 */
router.get('/campos', async (req: Request, res: Response) => {
    try {
        const { entidade } = req.query;

        const where: any = { ativo: true };
        if (entidade) where.entidade = entidade;

        const campos = await ConfiguracaoCampo.findAll({
            where,
            order: [['ordem_exibicao', 'ASC']],
        });

        res.json(campos);
    } catch (error) {
        console.error('Error fetching campos:', error);
        res.status(500).json({ error: 'Erro ao buscar campos' });
    }
});

/**
 * POST /api/configuracoes/campos
 * Criar campo customizado (admin)
 */
router.post('/campos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const campo = await ConfiguracaoCampo.create(req.body);
        res.status(201).json({ message: 'Campo criado com sucesso', campo });
    } catch (error) {
        console.error('Error creating campo:', error);
        res.status(500).json({ error: 'Erro ao criar campo' });
    }
});

/**
 * GET /api/configuracoes/sistema
 * Retorna todas as configurações globais do sistema (público)
 */
router.get('/sistema', async (req: Request, res: Response) => {
    try {
        const configs = await ConfiguracaoSistema.findAll();
        const result: Record<string, string> = {};
        configs.forEach(c => { result[c.chave] = c.valor; });
        res.json(result);
    } catch (error) {
        console.error('Error fetching configuracoes sistema:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

/**
 * PUT /api/configuracoes/sistema
 * Salva ou atualiza um par chave-valor (admin)
 * Body: { chave: string, valor: string }
 */
router.put('/sistema', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { chave, valor } = req.body;
        if (!chave) {
            return res.status(400).json({ error: 'Chave é obrigatória' });
        }
        await ConfiguracaoSistema.upsert({ chave, valor });
        res.json({ message: 'Configuração salva com sucesso' });
    } catch (error) {
        console.error('Error saving configuracao sistema:', error);
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

export default router;
