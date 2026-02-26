import { Router, Response } from 'express';
import { Cidadao } from '../models/Cidadao';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { uploadPerfil } from '../config/upload';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// ── Multer config para laudos ──────────────────────────────────────────────────
const laudoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = 'uploads/laudos';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'laudo-' + unique + path.extname(file.originalname));
    },
});
const uploadLaudo = multer({
    storage: laudoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens (JPEG, PNG) e PDF são permitidos'));
        }
    },
});


/**
 * GET /api/cidadaos/autocomplete-cpf
 * Buscar cidadãos por CPF parcial (admin only)
 */
router.get('/autocomplete-cpf', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.tipo !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            res.json([]);
            return;
        }

        const cidadaos = await Cidadao.findAll({
            where: {
                cpf: { [Op.like]: `${q}%` }
            },
            limit: 10,
            attributes: ['id', 'nome_completo', 'cpf', 'email']
        });

        res.json(cidadaos);
    } catch (error) {
        console.error('Error autocomplete cpf:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadão' });
    }
});

/**
 * GET /api/cidadaos

 * Listar todos os cidadãos (admin only)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        if (req.user!.tipo !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const { search = '', page = '1', limit = '20' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Build search condition
        const whereCondition = search
            ? {
                [Op.or]: [
                    { nome_completo: { [Op.iLike]: `%${search}%` } },
                    { cpf: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                ],
            }
            : {};

        // Get total count
        const total = await Cidadao.count({ where: whereCondition });

        // Get cidadaos
        const cidadaos = await Cidadao.findAll({
            where: whereCondition,
            limit: parseInt(limit as string),
            offset,
            order: [['id', 'ASC']],
            attributes: { exclude: ['senha'] }, // Don't send passwords
        });

        res.json({
            cidadaos: cidadaos.map(c => c.toJSON()),
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error) {
        console.error('Error fetching cidadaos:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadãos' });
    }
});

/**
 * POST /api/cidadaos
 * Criar novo cidadão (admin only)
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        if (req.user!.tipo !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const {
            nome_completo,
            nome_mae,
            cpf,
            data_nascimento,
            sexo,
            raca,
            telefone,
            email,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            municipio,
            estado,
            senha
        } = req.body;

        // Validações básicas
        if (!nome_completo || !cpf || !data_nascimento) {
            res.status(400).json({ error: 'Nome completo, CPF e data de nascimento são obrigatórios' });
            return;
        }

        // Verificar se CPF já existe
        const cleanCPF = cpf.replace(/\D/g, '');
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

        const cidadaoExistente = await Cidadao.findOne({
            where: {
                [Op.or]: [
                    { cpf: cleanCPF },
                    { cpf: formattedCPF },
                ],
            },
        });

        if (cidadaoExistente) {
            res.status(400).json({ error: 'CPF já cadastrado' });
            return;
        }

        // Criar cidadão
        const novoCidadao = await Cidadao.create({
            nome_completo,
            nome_mae,
            cpf: formattedCPF,
            data_nascimento,
            sexo,
            raca,
            telefone,
            email,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            municipio,
            estado,
            senha: senha || '123456', // Senha padrão se não fornecida
        } as any);

        // Return cidadao data without senha
        const cidadaoData = novoCidadao.toJSON();
        delete cidadaoData.senha;

        res.status(201).json({
            message: 'Cidadão criado com sucesso',
            cidadao: cidadaoData,
        });
    } catch (error) {
        console.error('Error creating cidadao:', error);
        res.status(500).json({ error: 'Erro ao criar cidadão' });
    }
});


/**
 * GET /api/cidadaos/me
 * Obter dados do cidadão autenticado
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const cidadao_id = req.user!.id;

        const cidadao = await Cidadao.findByPk(cidadao_id);

        if (!cidadao) {
            res.status(404).json({ error: 'Cidadão não encontrado' });
            return;
        }

        // CPF já está em formato legível
        res.json(cidadao.toJSON());
    } catch (error) {
        console.error('Error fetching cidadao:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do cidadão' });
    }
});

/**
 * PUT /api/cidadaos/me
 * Atualizar dados do cidadão autenticado (incluindo foto de perfil)
 */
router.put('/me', authenticate, uploadPerfil.single('foto'), async (req: AuthRequest, res: Response) => {
    try {
        const cidadao_id = req.user!.id;
        const { nome_completo, telefone, email, municipio, estado, cep, rua, numero, complemento, bairro, genero, raca, campos_customizados } = req.body;

        const cidadao = await Cidadao.findByPk(cidadao_id);
        if (!cidadao) {
            res.status(404).json({ error: 'Cidadão não encontrado' });
            return;
        }

        // Prepare update data
        const updateData: any = {
            nome_completo: nome_completo || cidadao.nome_completo,
            telefone: telefone || cidadao.telefone,
            email: email || cidadao.email,
            municipio: municipio || cidadao.municipio,
            estado: estado || cidadao.estado,
            cep: cep || cidadao.cep,
            rua: rua || cidadao.rua,
            numero: numero || cidadao.numero,
            complemento: complemento || cidadao.complemento,
            bairro: bairro || cidadao.bairro,
            genero: genero !== undefined ? genero : cidadao.genero,
            raca: raca !== undefined ? raca : cidadao.raca,
            campos_customizados: campos_customizados || cidadao.campos_customizados,
        };

        // If new photo uploaded, update path
        if (req.file) {
            updateData.foto_perfil = `/uploads/perfil/${req.file.filename}`;
        }

        await cidadao.update(updateData);

        // CPF já está em formato legível
        res.json({
            message: 'Dados atualizados com sucesso',
            cidadao: cidadao.toJSON(),
        });
    } catch (error) {
        console.error('Error updating cidadao:', error);
        res.status(500).json({ error: 'Erro ao atualizar dados' });
    }
});

/**
 * PUT /api/cidadaos/:id
 * Atualizar cidadão por ID (admin only)
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        if (req.user!.tipo !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const { id } = req.params;
        const {
            nome_completo,
            nome_mae,
            data_nascimento,
            genero,
            raca,
            telefone,
            email,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            municipio,
            estado,
            cartao_sus,
        } = req.body;

        // Find cidadao
        const cidadao = await Cidadao.findByPk(id);
        if (!cidadao) {
            res.status(404).json({ error: 'Cidadão não encontrado' });
            return;
        }

        // Update cidadao data
        await cidadao.update({
            nome_completo: nome_completo || cidadao.nome_completo,
            nome_mae: nome_mae !== undefined ? nome_mae : cidadao.nome_mae,
            data_nascimento: data_nascimento || cidadao.data_nascimento,
            genero: genero !== undefined ? genero : cidadao.genero,
            raca: raca !== undefined ? raca : cidadao.raca,
            telefone: telefone || cidadao.telefone,
            email: email || cidadao.email,
            cep: cep !== undefined ? cep : cidadao.cep,
            rua: rua !== undefined ? rua : cidadao.rua,
            numero: numero !== undefined ? numero : cidadao.numero,
            complemento: complemento !== undefined ? complemento : cidadao.complemento,
            bairro: bairro !== undefined ? bairro : cidadao.bairro,
            municipio: municipio || cidadao.municipio,
            estado: estado || cidadao.estado,
            cartao_sus: cartao_sus !== undefined ? cartao_sus : cidadao.cartao_sus,
        });

        // Return updated cidadao without senha
        const cidadaoData = cidadao.toJSON();
        delete cidadaoData.senha;

        res.json({
            message: 'Cidadão atualizado com sucesso',
            cidadao: cidadaoData,
        });
    } catch (error) {
        console.error('Error updating cidadao:', error);
        res.status(500).json({ error: 'Erro ao atualizar cidadão' });
    }
});

/**
 * GET /api/cidadaos/buscar-cpf/:cpf
 * Buscar cidadão por CPF (admin only)
 */
router.get('/buscar-cpf/:cpf', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        if (req.user!.tipo !== 'admin') {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const { cpf } = req.params;
        const cleanCPF = cpf.replace(/\D/g, '');
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

        // Buscar cidadão por CPF (aceita com ou sem formatação)
        const cidadaoEncontrado = await Cidadao.findOne({
            where: {
                [Op.or]: [
                    { cpf: cleanCPF },
                    { cpf: formattedCPF },
                ],
            },
        });

        if (!cidadaoEncontrado) {
            res.status(404).json({ error: 'Cidadão não encontrado' });
            return;
        }

        // Return cidadao data without senha
        const cidadaoData = cidadaoEncontrado.toJSON();
        delete cidadaoData.senha;

        res.json(cidadaoData);
    } catch (error) {
        console.error('Error searching cidadao by CPF:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadão' });
    }
});


// ── Laudos ────────────────────────────────────────────────────────────────────

/**
 * POST /api/cidadaos/:id/laudos
 * Upload de laudo para um cidadão (admin)
 */
router.post('/:id/laudos', authenticate, uploadLaudo.single('laudo'), async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.tipo !== 'admin') { res.status(403).json({ error: 'Acesso negado' }); return; }
        const cidadao = await Cidadao.findByPk(req.params.id);
        if (!cidadao) { res.status(404).json({ error: 'Cidadão não encontrado' }); return; }
        if (!req.file) { res.status(400).json({ error: 'Nenhum arquivo enviado' }); return; }

        const laudo = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            url: `/uploads/laudos/${req.file.filename}`,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date().toISOString(),
        };

        // Persist metadata to sidecar JSON
        const metaFile = `uploads/laudos/.meta-${req.params.id}.json`;
        let existing: any[] = [];
        if (fs.existsSync(metaFile)) existing = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        existing.push(laudo);
        fs.writeFileSync(metaFile, JSON.stringify(existing, null, 2));

        res.status(201).json({ message: 'Laudo enviado com sucesso', laudo });
    } catch (err: any) {
        console.error('Error uploading laudo:', err);
        res.status(500).json({ error: err.message || 'Erro ao enviar laudo' });
    }
});

/**
 * GET /api/cidadaos/:id/laudos
 * Listar laudos de um cidadão (admin)
 */
router.get('/:id/laudos', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.tipo !== 'admin') { res.status(403).json({ error: 'Acesso negado' }); return; }
        const cidadao = await Cidadao.findByPk(req.params.id);
        if (!cidadao) { res.status(404).json({ error: 'Cidadão não encontrado' }); return; }

        const dir = 'uploads/laudos';
        const prefix = `cidadao-${req.params.id}-`;
        // Store metadata in a simple JSON sidecar per cidadao
        const metaFile = `${dir}/.meta-${req.params.id}.json`;
        let laudos: any[] = [];
        if (fs.existsSync(metaFile)) {
            laudos = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
            // Remove entries whose files no longer exist
            laudos = laudos.filter(l => fs.existsSync(`${dir}/${l.filename}`));
        }
        res.json(laudos);
    } catch (err) {
        console.error('Error fetching laudos:', err);
        res.status(500).json({ error: 'Erro ao buscar laudos' });
    }
});

/**
 * DELETE /api/cidadaos/:id/laudos/:filename
 * Deletar um laudo (admin)
 */
router.delete('/:id/laudos/:filename', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.tipo !== 'admin') { res.status(403).json({ error: 'Acesso negado' }); return; }
        const { filename } = req.params;
        // Security: only allow filenames starting with laudo-
        if (!filename.startsWith('laudo-')) { res.status(400).json({ error: 'Arquivo inválido' }); return; }
        const filePath = `uploads/laudos/${filename}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // Update sidecar meta
        const metaFile = `uploads/laudos/.meta-${req.params.id}.json`;
        if (fs.existsSync(metaFile)) {
            let laudos = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
            laudos = laudos.filter((l: any) => l.filename !== filename);
            fs.writeFileSync(metaFile, JSON.stringify(laudos, null, 2));
        }
        res.json({ message: 'Laudo removido com sucesso' });
    } catch (err) {
        console.error('Error deleting laudo:', err);
        res.status(500).json({ error: 'Erro ao remover laudo' });
    }
});

export default router;

