import { Router, Request, Response } from 'express';
import { Noticia } from '../models/Noticia';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ── Multer config para imagens de notícias ──────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = 'uploads/noticias';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'noticia-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        if (extOk && mimeOk) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPEG, PNG ou WebP são permitidas'));
        }
    },
});

/**
 * GET /api/noticias
 * Listar notícias ativas (público)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destaque, limit } = req.query;
        const where: any = { ativo: true };
        if (destaque) where.destaque = destaque === 'true';

        const noticias = await Noticia.findAll({
            where,
            order: [['data_publicacao', 'DESC']],
            limit: limit ? parseInt(limit as string) : 20,
        });

        res.json(noticias);
    } catch (error) {
        console.error('Error fetching noticias:', error);
        res.status(500).json({ error: 'Erro ao buscar notícias' });
    }
});

/**
 * GET /api/noticias/all
 * Listar TODAS as notícias incluindo inativas (admin)
 */
router.get('/all', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const noticias = await Noticia.findAll({
            order: [['data_publicacao', 'DESC']],
        });
        res.json(noticias);
    } catch (error) {
        console.error('Error fetching all noticias:', error);
        res.status(500).json({ error: 'Erro ao buscar notícias' });
    }
});

/**
 * GET /api/noticias/:id
 * Buscar notícia por ID (público)
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }
        res.json(noticia);
    } catch (error) {
        console.error('Error fetching noticia:', error);
        res.status(500).json({ error: 'Erro ao buscar notícia' });
    }
});

/**
 * POST /api/noticias
 * Criar notícia com upload de imagem (admin)
 */
router.post('/', authenticate, authorizeAdminOrEstrada, upload.single('imagem'), async (req: Request, res: Response) => {
    try {
        const {
            titulo,
            conteudo,
            destaque,
            ativo,
            data_publicacao,
            campos_customizados,
        } = req.body;

        const imagem_url = req.file
            ? `/uploads/noticias/${req.file.filename}`
            : undefined;

        const campos = (() => {
            try { return JSON.parse(campos_customizados || '{}'); }
            catch { return {}; }
        })();

        const noticia = await Noticia.create({
            titulo,
            conteudo,
            imagem_url,
            destaque: destaque === 'true' || destaque === true,
            ativo: ativo !== undefined ? (ativo === 'true' || ativo === true) : true,
            data_publicacao: data_publicacao ? new Date(data_publicacao) : new Date(),
            campos_customizados: campos,
        });

        res.status(201).json({ message: 'Notícia criada com sucesso', noticia });
    } catch (error) {
        console.error('Error creating noticia:', error);
        res.status(500).json({ error: 'Erro ao criar notícia' });
    }
});

/**
 * PUT /api/noticias/:id
 * Atualizar notícia com upload de imagem opcional (admin)
 */
router.put('/:id', authenticate, authorizeAdminOrEstrada, upload.single('imagem'), async (req: Request, res: Response) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        const {
            titulo,
            conteudo,
            destaque,
            ativo,
            data_publicacao,
            campos_customizados,
        } = req.body;

        // Se um novo arquivo foi enviado, deletar o antigo
        let imagem_url = noticia.imagem_url;
        if (req.file) {
            if (noticia.imagem_url && noticia.imagem_url.startsWith('/uploads/')) {
                const oldPath = path.join(process.cwd(), noticia.imagem_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imagem_url = `/uploads/noticias/${req.file.filename}`;
        }

        const campos = (() => {
            try { return JSON.parse(campos_customizados || '{}'); }
            catch { return noticia.campos_customizados || {}; }
        })();

        await noticia.update({
            titulo: titulo ?? noticia.titulo,
            conteudo: conteudo ?? noticia.conteudo,
            imagem_url,
            destaque: destaque !== undefined ? (destaque === 'true' || destaque === true) : noticia.destaque,
            ativo: ativo !== undefined ? (ativo === 'true' || ativo === true) : noticia.ativo,
            data_publicacao: data_publicacao ? new Date(data_publicacao) : noticia.data_publicacao,
            campos_customizados: campos,
        });

        res.json({ message: 'Notícia atualizada com sucesso', noticia });
    } catch (error) {
        console.error('Error updating noticia:', error);
        res.status(500).json({ error: 'Erro ao atualizar notícia' });
    }
});

/**
 * DELETE /api/noticias/:id
 * Excluir notícia e imagem associada (admin)
 */
router.delete('/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }

        // Deletar imagem do disco
        if (noticia.imagem_url && noticia.imagem_url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), noticia.imagem_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await noticia.destroy();
        res.json({ message: 'Notícia excluída com sucesso' });
    } catch (error) {
        console.error('Error deleting noticia:', error);
        res.status(500).json({ error: 'Erro ao excluir notícia' });
    }
});

export default router;
