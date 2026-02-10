import { Router, Response } from 'express';
import { authenticate, authorizeAdmin, AuthRequest } from '../middlewares/auth';
import { Cidadao } from '../models/Cidadao';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuração do multer para upload de foto de perfil
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/perfil');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const uploadPerfil = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'));
        }
    },
});

/**
 * GET /admins/me
 * Retorna dados do admin logado
 */
router.get('/me', authenticate, authorizeAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const admin = await Cidadao.findByPk(req.user!.id, {
            attributes: { exclude: ['senha'] },
        });

        if (!admin) {
            return res.status(404).json({ error: 'Admin não encontrado' });
        }

        return res.json(admin);
    } catch (error) {
        console.error('Erro ao buscar admin:', error);
        return res.status(500).json({ error: 'Erro ao buscar dados do admin' });
    }
});

/**
 * POST /admins/foto
 * Upload de foto de perfil do admin
 */
router.post(
    '/foto',
    authenticate,
    authorizeAdmin,
    uploadPerfil.single('foto'),
    async (req: AuthRequest, res: Response) => {
        try {
            const admin = await Cidadao.findByPk(req.user!.id);

            if (!admin) {
                return res.status(404).json({ error: 'Admin não encontrado' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma foto foi enviada' });
            }

            // Remove foto antiga se existir
            if (admin.foto_perfil) {
                const oldPhotoPath = path.join(__dirname, '../..', admin.foto_perfil);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Atualiza apenas a foto
            const fotoPath = `/uploads/perfil/${req.file.filename}`;
            await admin.update({ foto_perfil: fotoPath });

            return res.json({ foto_perfil: fotoPath });
        } catch (error) {
            console.error('Erro ao atualizar foto:', error);
            return res.status(500).json({ error: 'Erro ao atualizar foto de perfil' });
        }
    }
);

/**
 * PUT /admins/me
 * Atualiza dados do admin logado
 */
router.put(
    '/me',
    authenticate,
    authorizeAdmin,
    uploadPerfil.single('foto'),
    async (req: AuthRequest, res: Response) => {
        try {
            const admin = await Cidadao.findByPk(req.user!.id);

            if (!admin) {
                return res.status(404).json({ error: 'Admin não encontrado' });
            }

            const { nome_completo, email, telefone, cep, rua, numero, complemento, bairro, municipio, estado } = req.body;

            const updateData: any = {};

            if (nome_completo) updateData.nome_completo = nome_completo;
            if (email) updateData.email = email;
            if (telefone) updateData.telefone = telefone;
            if (cep) updateData.cep = cep;
            if (rua) updateData.rua = rua;
            if (numero) updateData.numero = numero;
            if (complemento !== undefined) updateData.complemento = complemento;
            if (bairro) updateData.bairro = bairro;
            if (municipio) updateData.municipio = municipio;
            if (estado) updateData.estado = estado;

            // Se houver upload de foto
            if (req.file) {
                // Remove foto antiga se existir
                if (admin.foto_perfil) {
                    const oldPhotoPath = path.join(__dirname, '../..', admin.foto_perfil);
                    if (fs.existsSync(oldPhotoPath)) {
                        fs.unlinkSync(oldPhotoPath);
                    }
                }
                updateData.foto_perfil = `/uploads/perfil/${req.file.filename}`;
            }

            await admin.update(updateData);

            // Retorna admin atualizado sem senha
            const adminAtualizado = await Cidadao.findByPk(req.user!.id, {
                attributes: { exclude: ['senha'] },
            });

            return res.json({ admin: adminAtualizado });
        } catch (error) {
            console.error('Erro ao atualizar admin:', error);
            return res.status(500).json({ error: 'Erro ao atualizar dados do admin' });
        }
    }
);

export default router;
