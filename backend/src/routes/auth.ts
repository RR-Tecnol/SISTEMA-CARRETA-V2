import { Router, Request, Response } from 'express';
import { generateToken } from '../utils/auth';
import { Cidadao } from '../models/Cidadao';
import { Funcionario } from '../models/Funcionario';
import { validarCPF } from '../utils/validators';
import Joi from 'joi';
import { validate } from '../middlewares/validation';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email';
import { Op } from 'sequelize';
import { registrarAuditoria, extrairDadosUsuario } from '../utils/auditoria';

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
    perfilSelecionado: Joi.string().optional(),
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
 * Login unificado: cidadão, admin, médico ou admin_estrada
 *
 * IMPORTANT: Médico e Admin Estrada são checados ANTES de validarCPF()
 * porque o campo login_cpf/admin_estrada_login_cpf pode ser qualquer string,
 * não necessariamente um CPF matematicamente válido.
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { cpf, perfilSelecionado } = req.body;
        const senhaRaw = req.body.senha;
        const senha = String(senhaRaw || '').trim();

        const cleanCPF = cpf.replace(/\D/g, '');
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

        const perfisEncontrados: any[] = [];

        // ── 1. Verificar se é MÉDICO (antes do validarCPF) ──
        const medico = await Funcionario.findOne({
            where: {
                is_medico: true,
                [Op.or]: [
                    { login_cpf: cpf }, { login_cpf: cleanCPF }, { login_cpf: formattedCPF },
                    { cpf: cleanCPF }, { cpf: formattedCPF },
                ],
            },
        });

        if (medico && medico.senha && (medico as any).ativo) {
            const senhaValida = await bcrypt.compare(senha, medico.senha);
            if (senhaValida) {
                perfisEncontrados.push({ id: medico.id, nome: medico.nome, email: medico.email || '', tipo: 'medico', data: medico });
            }
        } else if (medico && medico.senha && !(medico as any).ativo && perfisEncontrados.length === 0) {
             // Conta bloqueada (só joga erro se não houver outra opção)
        }

        // ── 2. Verificar se é ADMIN ESTRADA (antes do validarCPF) ──
        const adminEstrada = await Funcionario.findOne({
            where: {
                is_admin_estrada: true,
                [Op.or]: [
                    { admin_estrada_login_cpf: cpf }, { admin_estrada_login_cpf: cleanCPF }, { admin_estrada_login_cpf: formattedCPF },
                    { cpf: cleanCPF }, { cpf: formattedCPF },
                ],
            },
        });

        if (adminEstrada && (adminEstrada as any).admin_estrada_senha && (adminEstrada as any).ativo) {
            const senhaValida = await bcrypt.compare(senha, (adminEstrada as any).admin_estrada_senha);
            if (senhaValida) {
                perfisEncontrados.push({ id: adminEstrada.id, nome: adminEstrada.nome, email: adminEstrada.email || '', tipo: 'admin_estrada', data: adminEstrada });
            }
        }

        // 👤 3. Verificar se é CIDADÃO ou ADMIN GERAL 👤
        const cidadao = await Cidadao.findOne({
            where: { [Op.or]: [{ cpf: cleanCPF }, { cpf: formattedCPF }] },
        });

        if (cidadao && cidadao.senha) {
            const senhaValida = await bcrypt.compare(senha, cidadao.senha);
            if (senhaValida) {
                const tipoUser = cidadao.tipo === 'admin' ? 'admin' : 'cidadao';
                perfisEncontrados.push({ id: cidadao.id, nome: cidadao.nome_completo, email: cidadao.email, tipo: tipoUser, data: cidadao });
            }
        }

        if (perfisEncontrados.length === 0) {
            res.status(401).json({ error: 'CPF ou senha inválidos' });
            return;
        }

        // Se encontrou multiplos perfis e o front nao informou qual quer, pedir selecao (L1-12)
        if (perfisEncontrados.length > 1 && !perfilSelecionado) {
            res.json({
                requireProfileSelection: true,
                profiles: perfisEncontrados.map(p => ({ tipo: p.tipo, nome: p.nome }))
            });
            return;
        }

        // Pega o perfil selecionado ou o unico disponivel
        let targetProfile = perfisEncontrados[0];
        if (perfilSelecionado) {
            const found = perfisEncontrados.find(p => p.tipo === perfilSelecionado);
            if (!found) {
                res.status(401).json({ error: 'Perfil selecionado inválido ou senha incorreta' });
                return;
            }
            targetProfile = found;
        }

        const redirectPath = targetProfile.tipo === 'admin' || targetProfile.tipo === 'admin_estrada' 
            ? '/admin' 
            : targetProfile.tipo === 'medico' ? '/medico' : '/portal';

        const token = generateToken({ 
            id: targetProfile.id, 
            tipo: targetProfile.tipo as any, 
            email: targetProfile.email, 
            roles: [targetProfile.tipo] 
        });

        registrarAuditoria({
            ...extrairDadosUsuario(req),
            usuario_id: targetProfile.id,
            acao: 'LOGIN',
            tabela_afetada: targetProfile.tipo === 'cidadao' || targetProfile.tipo === 'admin' ? 'cidadaos' : 'funcionarios',
            descricao: `Login ${targetProfile.tipo} bem-sucedido: ${cpf}`,
        }).catch(() => {});

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: targetProfile.id,
                nome: targetProfile.nome,
                email: targetProfile.email,
                tipo: targetProfile.tipo,
                roles: [targetProfile.tipo],
                redirect: redirectPath,
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
            cpf, nome_completo, data_nascimento, telefone, email,
            senha, municipio, estado, genero, raca, consentimento_lgpd, campos_customizados,
        } = req.body;

        if (!validarCPF(cpf)) {
            res.status(400).json({ error: 'CPF inválido' });
            return;
        }

        const cleanCPF = cpf.replace(/\D/g, '');
        const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

        const existingEmail = await Cidadao.findOne({ where: { email } });
        if (existingEmail) { res.status(409).json({ error: 'E-mail já cadastrado.' }); return; }

        const existingCPF = await Cidadao.findOne({ where: { [Op.or]: [{ cpf: cleanCPF }, { cpf: formattedCPF }] } });
        if (existingCPF) { res.status(409).json({ error: 'CPF já cadastrado.' }); return; }

        const ipAddress = req.ip || req.socket.remoteAddress || '';

        const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;

        const cidadao = await Cidadao.create({
            cpf: formattedCPF, nome_completo, data_nascimento, telefone, email,
            senha: senhaHash, municipio, estado,
            genero: genero || 'nao_declarado',
            raca: raca || 'nao_declarada',
            consentimento_lgpd,
            data_consentimento: new Date(),
            ip_consentimento: ipAddress,
            campos_customizados: campos_customizados || {},
        } as any);

        const token = generateToken({ id: cidadao.id, tipo: 'cidadao', email: cidadao.email });

        res.status(201).json({
            message: 'Cadastro realizado com sucesso',
            token,
            user: { id: cidadao.id, nome: cidadao.nome_completo, email: cidadao.email, tipo: 'cidadao' },
        });
    } catch (error) {
        console.error('Cadastro error:', error);
        res.status(500).json({ error: 'Erro ao realizar cadastro' });
    }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email, cpf } = req.body;

        if (!email && !cpf) { res.status(400).json({ error: 'E-mail ou CPF é obrigatório' }); return; }

        let cidadao = null;

        if (email) {
            cidadao = await Cidadao.findOne({ where: { email } });
        } else if (cpf) {
            const cleanCPF = cpf.replace(/\D/g, '');
            const formattedCPF = cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            cidadao = await Cidadao.findOne({ where: { [Op.or]: [{ cpf: cleanCPF }, { cpf: formattedCPF }] } });
        }

        if (!cidadao) {
            res.json({ message: 'Se o e-mail/CPF estiver cadastrado, você receberá um link para redefinir a senha.' });
            return;
        }

        const token = crypto.randomBytes(20).toString('hex');
        const now = new Date();
        now.setHours(now.getHours() + 1);

        cidadao.reset_password_token = token;
        cidadao.reset_password_expires = now;
        await cidadao.save();

        await sendPasswordResetEmail(cidadao.email, token);

        res.json({ message: 'Se o e-mail/CPF estiver cadastrado, você receberá um link para redefinir a senha.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, senha } = req.body;

        if (!token || !senha) { res.status(400).json({ error: 'Token e nova senha são obrigatórios' }); return; }

        const cidadao = await Cidadao.findOne({
            where: { reset_password_token: token, reset_password_expires: { [Op.gt]: new Date() } },
        });

        if (!cidadao) { res.status(400).json({ error: 'Token inválido ou expirado' }); return; }

        const senhaHash = await bcrypt.hash(senha, 10);
        cidadao.senha = senhaHash;
        cidadao.reset_password_token = null;
        cidadao.reset_password_expires = null;
        await cidadao.save();

        await Cidadao.update(
            { senha: senhaHash, reset_password_token: null, reset_password_expires: null },
            { where: { email: cidadao.email } }
        );

        res.json({ message: 'Senha redefinida com sucesso para todas as contas vinculadas a este e-mail.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

export default router;
