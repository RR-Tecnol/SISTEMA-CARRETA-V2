import { Router, Request, Response } from 'express';
import { generateToken } from '../utils/auth';
import { Cidadao } from '../models/Cidadao';
import { validarCPF } from '../utils/validators';
import Joi from 'joi';
import { validate } from '../middlewares/validation';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email';
import { Op } from 'sequelize';

const router = Router();

// Validation schema for login
const loginSchema = Joi.object({
    cpf: Joi.string().required().messages({
        'string.empty': 'CPF é obrigatório',
        'any.required': 'CPF é obrigatório',
    }),
    senha: Joi.string().required().messages({
        'string.empty': 'Senha é obrigatória',
        'any.required': 'Senha é obrigatória',
    }),
});

// Validation schema for cadastro
const cadastroSchema = Joi.object({
    cpf: Joi.string().required(),
    nome_completo: Joi.string().required(),
    data_nascimento: Joi.date().required(),
    telefone: Joi.string().required(),
    email: Joi.string().email().required(),
    senha: Joi.string().min(6).required().messages({
        'string.empty': 'Senha é obrigatória',
        'string.min': 'A senha deve ter no mínimo 6 caracteres',
        'any.required': 'Senha é obrigatória',
    }),
    municipio: Joi.string().required(),
    estado: Joi.string().length(2).required(),
    genero: Joi.string().valid('masculino', 'feminino', 'outro', 'nao_declarado', '').optional(),
    raca: Joi.string().valid('branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarada', '').optional(),
    consentimento_lgpd: Joi.boolean().valid(true).required().messages({
        'any.only': 'Você deve aceitar os termos LGPD para prosseguir',
    }),
    campos_customizados: Joi.object().optional(),
});

/**
 * POST /api/auth/login
 * Login de cidadão (autenticação por CPF)
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { cpf } = req.body;
        const senhaRaw = req.body.senha;
        const senha = String(senhaRaw || '').trim(); // Forçar string e remover espaços

        // Validate CPF
        if (!validarCPF(cpf)) {
            res.status(400).json({ error: 'CPF inválido' });
            return;
        }

        const cleanCPF = cpf.replace(/\D/g, ''); // Remove formatação: 12345678909
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'); // 123.456.789-09

        // Buscar cidadão por CPF (aceita com ou sem formatação)
        const cidadao = await Cidadao.findOne({
            where: {
                [Op.or]: [
                    { cpf: cleanCPF },      // 12345678909
                    { cpf: formattedCPF },  // 123.456.789-09
                ],
            },
        });

        if (!cidadao) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        // Validate password
        if (!cidadao.senha) {
            console.log('LOGIN_DEBUG: Senha não cadastrada para CPF:', cpf);
            res.status(401).json({ error: 'Senha não cadastrada' });
            return;
        }

        console.log('LOGIN_DEBUG: Comparando senha...');
        console.log('LOGIN_DEBUG: Senha Recebida:', senha);
        console.log('LOGIN_DEBUG: Hash no Banco:', cidadao.senha);

        const senhaValida = await bcrypt.compare(senha, cidadao.senha);
        console.log('LOGIN_DEBUG: Resultado da comparação:', senhaValida);

        if (!senhaValida) {
            console.log('LOGIN_DEBUG: Senha inválida');
            res.status(401).json({ error: 'CPF ou senha inválidos' });
            return;
        }

        // Generate JWT token
        // Check if user is admin (based on tipo field in database)
        const isAdmin = cidadao.tipo === 'admin';

        const token = generateToken({
            id: cidadao.id,
            tipo: isAdmin ? 'admin' : 'cidadao',
            email: cidadao.email,
        });

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: cidadao.id,
                nome: cidadao.nome_completo,
                email: cidadao.email,
                tipo: isAdmin ? 'admin' : 'cidadao',
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

/**
 * POST /api/auth/cadastro
 * Cadastro de novo cidadão com termo LGPD
 */
router.post('/cadastro', validate(cadastroSchema), async (req: Request, res: Response) => {
    try {
        const {
            cpf,
            nome_completo,
            data_nascimento,
            telefone,
            email,
            senha,
            municipio,
            estado,
            genero,
            raca,
            consentimento_lgpd,
            campos_customizados,
        } = req.body;

        // Validate CPF
        if (!validarCPF(cpf)) {
            res.status(400).json({ error: 'CPF inválido' });
            return;
        }

        const cleanCPF = cpf.replace(/\\D/g, '');
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

        // 1. Check if Email already exists
        const existingEmail = await Cidadao.findOne({ where: { email } });
        if (existingEmail) {
            res.status(409).json({ error: 'E-mail já cadastrado.' });
            return;
        }

        // 2. Check if CPF already exists
        const existingCPF = await Cidadao.findOne({
            where: {
                [Op.or]: [
                    { cpf: cleanCPF },
                    { cpf: formattedCPF },
                ],
            },
        });

        if (existingCPF) {
            res.status(409).json({ error: 'CPF já cadastrado.' });
            return;
        }

        // Get client IP
        const ipAddress = req.ip || req.socket.remoteAddress || '';

        // Hash password if provided
        let senhaHash = undefined;
        if (senha) {
            senhaHash = await bcrypt.hash(senha, 10);
        }

        // Create new cidadao
        const cidadao = await Cidadao.create({
            cpf: formattedCPF,  // Salvando com formatação padrão
            nome_completo,
            data_nascimento,
            telefone,
            email,
            senha: senhaHash,
            municipio,
            estado,
            genero: genero || 'nao_declarado',
            raca: raca || 'nao_declarada',
            consentimento_lgpd,
            data_consentimento: new Date(),
            ip_consentimento: ipAddress,
            campos_customizados: campos_customizados || {},
        } as any);

        // Generate token
        const token = generateToken({
            id: cidadao.id,
            tipo: 'cidadao',
            email: cidadao.email,
        });

        res.status(201).json({
            message: 'Cadastro realizado com sucesso',
            token,
            user: {
                id: cidadao.id,
                nome: cidadao.nome_completo,
                email: cidadao.email,
                tipo: 'cidadao',
            },
        });
    } catch (error) {
        console.error('Cadastro error:', error);
        res.status(500).json({ error: 'Erro ao realizar cadastro' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Solicitação de redefinição de senha
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email, cpf } = req.body;

        if (!email && !cpf) {
            res.status(400).json({ error: 'E-mail ou CPF é obrigatório' });
            return;
        }

        let cidadao = null;

        if (email) {
            cidadao = await Cidadao.findOne({ where: { email } });
        } else if (cpf) {
            // Buscar por CPF
            const cleanCPF = cpf.replace(/\D/g, '');
            const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

            cidadao = await Cidadao.findOne({
                where: {
                    [Op.or]: [
                        { cpf: cleanCPF },
                        { cpf: formattedCPF },
                    ],
                },
            });
        }

        if (!cidadao) {
            // Security: don't reveal user doesn't exist
            // But for UX we often do "Se o e-mail existir..."
            res.json({ message: 'Se o e-mail/CPF estiver cadastrado, você receberá um link para redefinir a senha.' });
            return;
        }

        // Generate token
        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1); // 1 hour expiration

        cidadao.reset_password_token = token;
        cidadao.reset_password_expires = now;
        await cidadao.save();

        // Send email
        await sendPasswordResetEmail(cidadao.email, token);

        res.json({ message: 'Se o e-mail/CPF estiver cadastrado, você receberá um link para redefinir a senha.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

/**
 * POST /api/auth/reset-password
 * Redefinição de senha com token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, senha } = req.body;

        if (!token || !senha) {
            res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
            return;
        }

        const cidadao = await Cidadao.findOne({
            where: {
                reset_password_token: token,
                reset_password_expires: {
                    [Op.gt]: new Date() // Expires > Now
                }
            }
        });

        if (!cidadao) {
            res.status(400).json({ error: 'Token inválido ou expirado' });
            return;
        }

        // Hash new password
        const senhaHash = await bcrypt.hash(senha, 10);

        // Update current user
        cidadao.senha = senhaHash;
        cidadao.reset_password_token = null;
        cidadao.reset_password_expires = null;
        await cidadao.save();

        // Also update ANY other user with the same email (handling duplicates)
        await Cidadao.update(
            {
                senha: senhaHash,
                reset_password_token: null,
                reset_password_expires: null
            },
            { where: { email: cidadao.email } }
        );

        res.json({ message: 'Senha redefinida com sucesso para todas as contas vinculadas a este e-mail.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

export default router;

