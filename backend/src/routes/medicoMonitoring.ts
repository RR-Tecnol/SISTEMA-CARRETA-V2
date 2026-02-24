import { Router, Request, Response } from 'express';
import { Op, fn, col, literal, where as seqWhere } from 'sequelize';

// Condição reutilizável para identificar médicos (suporta acento ou sem acento)
const cargoMedicoWhere = {
    [Op.or]: [
        { cargo: { [Op.iLike]: '%medic%' } },
        { cargo: { [Op.iLike]: '%m\u00e9dic%' } },
        { cargo: { [Op.iLike]: '%doutor%' } },
        { cargo: { [Op.iLike]: '%dr.%' } },
    ],
};
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { Funcionario } from '../models/Funcionario';
import { PontoMedico } from '../models/PontoMedico';
import { AtendimentoMedico } from '../models/AtendimentoMedico';
import { Acao } from '../models/Acao';
import { Cidadao } from '../models/Cidadao';
import { AcaoFuncionario } from '../models/AcaoFuncionario';
import { Inscricao } from '../models/Inscricao';
import { CursoExame } from '../models/CursoExame';

const router = Router();


// Middleware que permite admin OU médico autenticado
const authorizeMedicoOrAdmin = (req: any, res: any, next: any) => {
    if (!req.user) { res.status(401).json({ error: 'Não autenticado' }); return; }
    if (req.user.tipo === 'admin' || req.user.tipo === 'medico') { next(); return; }
    res.status(403).json({ error: 'Acesso negado' });
};

// ═══ GET /minhas-acoes ═══ Ações em que o médico está cadastrado
router.get('/minhas-acoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;
        const hoje = new Date();

        // Buscar vínculos ação-funcionário
        const vinculos = await AcaoFuncionario.findAll({
            where: { funcionario_id: funcionarioId },
        });
        const acaoIds = vinculos.map((v) => v.acao_id);

        if (acaoIds.length === 0) {
            res.json([]);
            return;
        }

        // Buscar ações vinculadas (ativas ou planejadas — sem filtro de data)
        const acoes = await Acao.findAll({
            where: {
                id: { [Op.in]: acaoIds },
                status: { [Op.in]: ['ativa', 'planejada'] },
            },
            order: [['data_inicio', 'ASC']],
        });

        // Para cada ação, contar inscritos pendentes
        const acoesCom = await Promise.all(acoes.map(async (acao) => {
            const totalInscritos = await Inscricao.count({
                where: { acao_id: acao.id },
            });
            const pendentes = await Inscricao.count({
                where: { acao_id: acao.id, status: 'pendente' },
            });
            const atendidos = await Inscricao.count({
                where: { acao_id: acao.id, status: 'atendido' },
            });
            return {
                ...acao.toJSON(),
                totalInscritos,
                pendentes,
                atendidos,
            };
        }));

        res.json(acoesCom);
    } catch (error) {
        console.error('Erro ao buscar ações do médico:', error);
        res.status(500).json({ error: 'Erro ao buscar ações' });
    }
});

// ═══ GET /acao/:id/inscricoes ═══ Lista inscritos de uma ação para o médico atender
router.get('/acao/:id/inscricoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { id: acaoId } = req.params;
        const { status = 'pendente', page = '1', limit = '50' } = req.query as any;
        const offset = (Number(page) - 1) * Number(limit);

        console.log(`[inscricoes] acao_id=${acaoId} status=${status} limit=${limit}`);

        // Verificar total sem filtro de status
        const totalSemFiltro = await Inscricao.count({ where: { acao_id: acaoId } });
        console.log(`[inscricoes] Total de inscrições na ação (sem filtro de status): ${totalSemFiltro}`);

        const whereClause: any = {
            acao_id: acaoId,
            ...(status !== 'todos' ? { status } : {}),
        };

        const { rows: inscricoes, count } = await Inscricao.findAndCountAll({
            where: whereClause,
            include: [{ model: Cidadao, as: 'cidadao', attributes: [['nome_completo', 'nome'], 'id', 'cpf', 'data_nascimento', 'telefone', 'genero'] }],
            order: [['data_inscricao', 'ASC']],
            limit: Number(limit),
            offset,
        });

        console.log(`[inscricoes] Encontrados: ${count} inscrições com filtro status=${status}`);

        res.json({ inscricoes, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) });
    } catch (error) {
        console.error('Erro ao buscar inscritos:', error);
        res.status(500).json({ error: 'Erro ao buscar inscritos' });
    }
});


// ═══ GET /me ═══ Dados do médico logado (para o painel médico) — aceita ?acao_id
router.get('/me', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;
        const { acao_id } = req.query as any;
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        // Ponto ativo
        const pontoAtivo = await PontoMedico.findOne({
            where: { funcionario_id: funcionarioId, status: 'trabalhando' },
        });

        // Atendimentos do dia (filtrar por acao_id se informado; excluir 'aguardando' = fila de espera)
        const whereAtend: any = {
            funcionario_id: funcionarioId,
            hora_inicio: { [Op.between]: [hoje, amanha] },
            status: { [Op.ne]: 'aguardando' }, // Exclui pacientes na fila (gerenciados pelo admin)
        };
        if (acao_id) whereAtend.acao_id = acao_id;

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtend,
            order: [['hora_inicio', 'DESC']],
        });

        const emAndamento = atendimentos.find((a) => a.status === 'em_andamento') || null;

        res.json({
            pontoId: pontoAtivo?.id || null,
            pontoStatus: pontoAtivo?.status || null,
            emAndamento,
            atendimentos: atendimentos.map((a) => a.toJSON()),
        });
    } catch (error) {
        console.error('Erro ao buscar dados do médico:', error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});



// ═══ POST /atendimento/iniciar ═══ Inicia consulta (médico ou admin)
router.post('/atendimento/iniciar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { funcionario_id, nome_paciente, cidadao_id, acao_id, ponto_id, observacoes } = req.body;
        const funcId = funcionario_id || req.user.id;

        if (!funcId) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        // Verificar ponto ativo — abrir automaticamente se não tiver
        let pontoAtivo = ponto_id;
        if (!pontoAtivo) {
            const ponto = await PontoMedico.findOne({ where: { funcionario_id: funcId, status: 'trabalhando' } });
            if (ponto) {
                pontoAtivo = ponto.id;
            } else {
                // Abrir ponto automaticamente
                const novoPonto = await PontoMedico.create({
                    funcionario_id: funcId,
                    data_hora_entrada: new Date(),
                    status: 'trabalhando',
                });
                pontoAtivo = novoPonto.id;
            }
        }

        const atendimento = await AtendimentoMedico.create({
            funcionario_id: funcId,
            acao_id: acao_id || undefined,
            cidadao_id: cidadao_id || undefined,
            ponto_id: pontoAtivo || undefined,
            hora_inicio: new Date(),
            status: 'em_andamento',
            observacoes,
            nome_paciente,
        });

        res.status(201).json(atendimento);
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento' });
    }
});

// ═══ PUT /atendimento/:id/finalizar ═══ (médico ou admin)
router.put('/atendimento/:id/finalizar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento não encontrado' }); return; }
        const fim = new Date();
        const duracaoMs = fim.getTime() - atendimento.hora_inicio.getTime();
        const duracaoMinutos = Math.max(1, Math.round(duracaoMs / (1000 * 60)));
        await atendimento.update({ hora_fim: fim, duracao_minutos: duracaoMinutos, status: 'concluido', observacoes: req.body.observacoes || atendimento.observacoes });

        // Atualizar status da inscrição para 'atendido' se existir
        if (atendimento.cidadao_id && atendimento.acao_id) {
            await Inscricao.update(
                { status: 'atendido' },
                { where: { cidadao_id: atendimento.cidadao_id, acao_id: atendimento.acao_id, status: 'pendente' } }
            );
        }

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
});

// ═══ PUT /atendimento/:id/cancelar ═══ (médico ou admin)
router.put('/atendimento/:id/cancelar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento não encontrado' }); return; }
        await atendimento.update({ status: 'cancelado', hora_fim: new Date() });

        // Manter inscrição como pendente (não foi atendido, mas pode ser reagendado)
        // Não altera o status da inscrição ao cancelar

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao cancelar atendimento:', error);
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});



// �"?�"?�"? M�?DICOS �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// GET /medicos �?" lista apenas funcionários com cargo médico
router.get('/medicos', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const medicos = await Funcionario.findAll({
            where: {
                ...cargoMedicoWhere,
                ativo: true,
            },
            order: [['nome', 'ASC']],
        });
        res.json(medicos);
    } catch (error) {
        console.error('Erro ao buscar médicos:', error);
        res.status(500).json({ error: 'Erro ao buscar médicos' });
    }
});

// �"?�"?�"? DASHBOARD �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// GET /dashboard �?" KPIs globais
router.get('/dashboard', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Médicos ativos agora (com ponto aberto)
        const medicosAtivos = await PontoMedico.count({
            where: { status: 'trabalhando' },
        });

        // Total de atendimentos hoje
        const atendimentosHoje = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.in]: ['concluido', 'em_andamento'] },
            },
        });

        // Atendimentos concluídos hoje
        const atendimentosConcluidos = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
            },
        });

        // Tempo médio de atendimento (em minutos) �?" apenas concluídos hoje
        const tempoMedioRaw = await AtendimentoMedico.findOne({
            attributes: [[fn('AVG', col('duracao_minutos')), 'media']],
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
                duracao_minutos: { [Op.ne]: null },
            },
            raw: true,
        }) as any;
        const tempoMedio = tempoMedioRaw?.media ? Math.round(Number(tempoMedioRaw.media)) : 0;

        // Total de médicos cadastrados (ativos)
        const totalMedicos = await Funcionario.count({
            where: { ...cargoMedicoWhere, ativo: true },
        });

        // Top médico do dia (mais atendimentos)
        const topMedicoRaw = await AtendimentoMedico.findAll({
            attributes: [
                'funcionario_id',
                [fn('COUNT', col('AtendimentoMedico.id')), 'total'],
            ],
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
            },
            include: [{ model: Funcionario, as: 'funcionario', attributes: ['nome', 'especialidade'] }],
            group: ['funcionario_id', 'funcionario.id'],
            order: [[literal('"total"'), 'DESC']],
            limit: 1,
            raw: false,
        });

        const topMedico = topMedicoRaw.length > 0 ? {
            nome: (topMedicoRaw[0] as any).funcionario?.nome,
            total: (topMedicoRaw[0] as any).dataValues.total,
        } : null;

        // Alertas: médicos trabalhando sem atendimentos na última 1h
        const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
        const pontosSemAtendimento = await PontoMedico.findAll({
            where: {
                status: 'trabalhando',
                data_hora_entrada: { [Op.lt]: umaHoraAtras },
            },
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['nome', 'cargo'] },
                {
                    model: AtendimentoMedico,
                    as: 'atendimentos',
                    required: false,
                    where: { hora_inicio: { [Op.gt]: umaHoraAtras } },
                    attributes: ['id'],
                },
            ],
        });

        const alertas = pontosSemAtendimento
            .filter((p: any) => !p.atendimentos || p.atendimentos.length === 0)
            .map((p: any) => ({
                medico_nome: p.funcionario?.nome,
                entrada: p.data_hora_entrada,
                ponto_id: p.id,
            }));

        res.json({
            medicosAtivos,
            atendimentosHoje,
            atendimentosConcluidos,
            tempoMedioMinutos: tempoMedio,
            totalMedicos,
            topMedico,
            alertas,
        });
    } catch (error) {
        console.error('Erro no dashboard médico:', error);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
});

// �"?�"?�"? PONTO �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// POST /ponto/entrada
router.post('/ponto/entrada', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, observacoes } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        // Verificar se já tem ponto aberto
        const pontoAberto = await PontoMedico.findOne({
            where: { funcionario_id, status: 'trabalhando' },
        });
        if (pontoAberto) {
            res.status(409).json({ error: 'Médico já possui ponto aberto', ponto: pontoAberto });
            return;
        }

        const ponto = await PontoMedico.create({
            funcionario_id,
            acao_id: acao_id || undefined,
            data_hora_entrada: new Date(),
            status: 'trabalhando',
            observacoes,
        });

        res.status(201).json(ponto);
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        res.status(500).json({ error: 'Erro ao registrar entrada' });
    }
});

// PUT /ponto/:id/saida
router.put('/ponto/:id/saida', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const ponto = await PontoMedico.findByPk(req.params.id);
        if (!ponto) {
            res.status(404).json({ error: 'Ponto não encontrado' });
            return;
        }
        if (ponto.status === 'saiu') {
            res.status(409).json({ error: 'Ponto já encerrado' });
            return;
        }

        const saida = new Date();
        const diferencaMs = saida.getTime() - ponto.data_hora_entrada.getTime();
        const horasTrabalhadas = parseFloat((diferencaMs / (1000 * 60 * 60)).toFixed(2));

        await ponto.update({
            data_hora_saida: saida,
            status: 'saiu',
            horas_trabalhadas: horasTrabalhadas,
            observacoes: req.body.observacoes || ponto.observacoes,
        });

        // Finalizar atendimentos em andamento
        await AtendimentoMedico.update(
            { status: 'cancelado' },
            { where: { ponto_id: ponto.id, status: 'em_andamento' } }
        );

        res.json(ponto);
    } catch (error) {
        console.error('Erro ao registrar saída:', error);
        res.status(500).json({ error: 'Erro ao registrar saída' });
    }
});

// GET /ponto �?" listar pontos com filtros
router.get('/ponto', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, data_inicio, data_fim, status } = req.query;

        const where: any = {};
        if (funcionario_id) where.funcionario_id = funcionario_id;
        if (acao_id) where.acao_id = acao_id;
        if (status) where.status = status;
        if (data_inicio || data_fim) {
            where.data_hora_entrada = {};
            if (data_inicio) {
                const inicio = new Date(data_inicio as string);
                inicio.setTime(inicio.getTime() + 3 * 60 * 60 * 1000); // 00:00 BRT = 03:00 UTC
                where.data_hora_entrada[Op.gte] = inicio;
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setTime(fim.getTime() + 27 * 60 * 60 * 1000 - 1); // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
                where.data_hora_entrada[Op.lte] = fim;
            }
        }

        // Step 1: buscar pontos sem include aninhado (evita ambiguidade de colunas SQL)
        const pontos = await PontoMedico.findAll({
            where,
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'], required: false },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'], required: false },
            ],
            order: [['data_hora_entrada', 'DESC']],
        });

        // Step 2: buscar atendimentos separadamente para os pontos encontrados
        const pontoIds = pontos.map((p) => p.id);
        const atendimentosMap: Record<string, any[]> = {};

        if (pontoIds.length > 0) {
            const atendimentos = await AtendimentoMedico.findAll({
                where: { ponto_id: { [Op.in]: pontoIds } },
                attributes: ['id', 'ponto_id', 'hora_inicio', 'hora_fim', 'duracao_minutos', 'status', 'nome_paciente', 'cidadao_id', 'observacoes'],
                order: [['hora_inicio', 'ASC']],
            });
            atendimentos.forEach((atd) => {
                const pid = String(atd.ponto_id);
                if (!atendimentosMap[pid]) atendimentosMap[pid] = [];
                atendimentosMap[pid].push(atd.toJSON());
            });
        }

        // Step 3: combinar resultado
        const resultado = pontos.map((p) => ({
            ...(p.toJSON() as any),
            atendimentos: atendimentosMap[p.id] || [],
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({ error: 'Erro ao buscar pontos' });
    }
});

// �"?�"?�"? ATENDIMENTOS �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// POST /atendimentos �?" iniciar atendimento
router.post('/atendimentos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, cidadao_id, ponto_id, observacoes, nome_paciente } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        // Buscar ponto ativo automaticamente se não informado
        let pontoAtivo = ponto_id;
        if (!pontoAtivo) {
            const ponto = await PontoMedico.findOne({
                where: { funcionario_id, status: 'trabalhando' },
            });
            pontoAtivo = ponto?.id;
        }

        const atendimento = await AtendimentoMedico.create({
            funcionario_id,
            acao_id: acao_id || undefined,
            cidadao_id: cidadao_id || undefined,
            ponto_id: pontoAtivo || undefined,
            hora_inicio: new Date(),
            status: 'aguardando', // Admin adiciona à fila de espera; médico muda para em_andamento ao chamar
            observacoes,
            nome_paciente,
        });

        const atendimentoCompleto = await AtendimentoMedico.findByPk(atendimento.id, {
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome'] },
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome'] },
            ],
        });

        res.status(201).json(atendimentoCompleto);
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento' });
    }
});

// PUT /atendimentos/:id/finalizar
router.put('/atendimentos/:id/finalizar', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) {
            res.status(404).json({ error: 'Atendimento não encontrado' });
            return;
        }

        const fim = new Date();
        const duracaoMs = fim.getTime() - atendimento.hora_inicio.getTime();
        const duracaoMinutos = Math.round(duracaoMs / (1000 * 60));

        await atendimento.update({
            hora_fim: fim,
            duracao_minutos: duracaoMinutos,
            status: 'concluido',
            observacoes: req.body.observacoes || atendimento.observacoes,
        });

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
});

// PUT /atendimentos/:id/cancelar
router.put('/atendimentos/:id/cancelar', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) {
            res.status(404).json({ error: 'Atendimento não encontrado' });
            return;
        }
        await atendimento.update({ status: 'cancelado', observacoes: req.body.observacoes || atendimento.observacoes });
        res.json(atendimento);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});

// GET /debug-timestamps — endpoint temporário para diagnóstico de timezone
// Remove este endpoint após diagnosticar o problema
router.get('/debug-timestamps', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const ultimos = await AtendimentoMedico.findAll({
            order: [['hora_inicio', 'DESC']],
            limit: 10,
            attributes: ['id', 'funcionario_id', 'hora_inicio', 'hora_fim', 'status', 'nome_paciente'],
        });

        const dataParam = req.query.data as string || new Date().toISOString().split('T')[0];
        // Range sem ajuste (como o frontend envia)
        const inicioSemAjuste = new Date(dataParam);
        const fimSemAjuste = new Date(dataParam);
        fimSemAjuste.setHours(23, 59, 59, 999);

        // Range com ajuste UTC-3 (brasileiro)
        const inicioComAjuste = new Date(dataParam);
        inicioComAjuste.setHours(0 + 3, 0, 0, 0); // 03:00 UTC = 00:00 BRT
        const fimComAjuste = new Date(dataParam);
        fimComAjuste.setHours(23 + 3, 59, 59, 999); // Próximo dia 02:59:59 UTC = 23:59 BRT

        res.json({
            serverTime: new Date().toISOString(),
            serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dataParam,
            rangeSemAjuste: { inicio: inicioSemAjuste.toISOString(), fim: fimSemAjuste.toISOString() },
            rangeComAjusteBRT: { inicio: inicioComAjuste.toISOString(), fim: fimComAjuste.toISOString() },
            ultimosAtendimentos: ultimos.map(a => ({
                id: a.id,
                funcionario_id: a.funcionario_id,
                hora_inicio_iso: new Date(a.hora_inicio).toISOString(),
                hora_inicio_local: new Date(a.hora_inicio).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }),
                status: a.status,
                nome_paciente: a.nome_paciente,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// GET /atendimentos — listar com filtros
router.get('/atendimentos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, data_inicio, data_fim, status, limit } = req.query;

        const where: any = {};
        if (funcionario_id) where.funcionario_id = funcionario_id;
        if (acao_id) where.acao_id = acao_id;
        if (status) where.status = status;
        if (data_inicio || data_fim) {
            where.hora_inicio = {};
            if (data_inicio) {
                // data_inicio = 'YYYY-MM-DD' (dia no fuso BRT = UTC-3)
                // new Date('YYYY-MM-DD') = UTC midnight. Para cobrir BRT, precisamos de UTC+3h = início do dia BRT
                const inicio = new Date(data_inicio as string);
                inicio.setTime(inicio.getTime() + 3 * 60 * 60 * 1000); // 00:00 BRT = 03:00 UTC
                where.hora_inicio[Op.gte] = inicio;
            }
            if (data_fim) {
                // Fim do dia BRT (23:59:59) = próximo dia 02:59:59 UTC
                const fim = new Date(data_fim as string);
                fim.setTime(fim.getTime() + 27 * 60 * 60 * 1000 - 1); // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
                where.hora_inicio[Op.lte] = fim;
            }
        }

        const atendimentos = await AtendimentoMedico.findAll({
            where,
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                // 'nome' é alias de 'nome_completo' para manter compatibilidade com o frontend
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome']] },
            ],
            order: [['hora_inicio', 'DESC']],
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.json(atendimentos);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        res.status(500).json({ error: 'Erro ao buscar atendimentos' });
    }
});


// �"?�"?�"? RELAT�"RIO �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// GET /relatorio/geral — DEVE vir ANTES de /relatorio/:funcionario_id
router.get('/relatorio/geral', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim, acao_id } = req.query;

        const whereAtendimento: any = {};
        const wherePonto: any = {};

        if (acao_id) {
            whereAtendimento.acao_id = acao_id;
            wherePonto.acao_id = acao_id;
        }
        if (data_inicio || data_fim) {
            whereAtendimento.hora_inicio = {};
            wherePonto.data_hora_entrada = {};
            if (data_inicio) {
                whereAtendimento.hora_inicio[Op.gte] = new Date(data_inicio as string);
                wherePonto.data_hora_entrada[Op.gte] = new Date(data_inicio as string);
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
                whereAtendimento.hora_inicio[Op.lte] = fim;
                wherePonto.data_hora_entrada[Op.lte] = fim;
            }
        }

        const medicos = await Funcionario.findAll({
            where: { ...cargoMedicoWhere, ativo: true },
            order: [['nome', 'ASC']],
        });

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtendimento,
            include: [
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal("nome_completo"), 'nome']] },
            ],
            order: [['funcionario_id', 'ASC'], ['hora_inicio', 'ASC']],
        });

        const pontos = await PontoMedico.findAll({
            where: wherePonto,
            order: [['funcionario_id', 'ASC'], ['data_hora_entrada', 'ASC']],
        });

        const resumoPorMedico = medicos.map((m: any) => {
            const atdMedico = atendimentos.filter((a: any) => String(a.funcionario_id) === String(m.id));
            const pontosMedico = pontos.filter((p: any) => String(p.funcionario_id) === String(m.id));
            const concluidos = atdMedico.filter((a: any) => a.status === 'concluido');
            const duracoes = concluidos.filter((a: any) => a.duracao_minutos != null);
            const tempoMedio = duracoes.length > 0
                ? Math.round(duracoes.reduce((acc: number, a: any) => acc + (a.duracao_minutos || 0), 0) / duracoes.length)
                : 0;
            const horasTrabalhadas = pontosMedico
                .filter((p: any) => p.status === 'saiu' && p.horas_trabalhadas)
                .reduce((acc: number, p: any) => acc + Number(p.horas_trabalhadas || 0), 0);
            const diasTrabalhados = pontosMedico.filter((p: any) => p.status === 'saiu').length;
            const custoTotal = parseFloat((Number(m.custo_diaria || 0) * diasTrabalhados).toFixed(2));
            return {
                medico: { id: m.id, nome: m.nome, cargo: m.cargo, especialidade: m.especialidade, custo_diaria: m.custo_diaria },
                metricas: {
                    totalAtendidos: concluidos.length,
                    totalAtendimentos: atdMedico.length,
                    atendimentosCancelados: atdMedico.filter((a: any) => a.status === 'cancelado').length,
                    atendimentosEmAndamento: atdMedico.filter((a: any) => a.status === 'em_andamento').length,
                    tempoMedioMinutos: tempoMedio,
                    totalHorasTrabalhadas: parseFloat(horasTrabalhadas.toFixed(2)),
                    totalDiasTrabalhados: diasTrabalhados,
                    custoTotal,
                },
                atendimentos: atdMedico.map((a: any) => a.toJSON()),
            };
        });

        const totalAtendidos = resumoPorMedico.reduce((acc, m) => acc + m.metricas.totalAtendidos, 0);
        const allDuracoes = atendimentos.filter((a: any) => a.status === 'concluido' && a.duracao_minutos != null);
        const tempoMedioGeral = allDuracoes.length > 0
            ? Math.round((allDuracoes as any[]).reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / allDuracoes.length)
            : 0;

        res.json({
            periodo: { data_inicio: data_inicio || null, data_fim: data_fim || null },
            totais: {
                totalAtendidos,
                totalMedicos: medicos.length,
                tempoMedioMinutos: tempoMedioGeral,
                custoTotalGeral: parseFloat(resumoPorMedico.reduce((acc, m) => acc + m.metricas.custoTotal, 0).toFixed(2)),
            },
            medicos: resumoPorMedico,
            gerado_em: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao gerar relatório geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral' });
    }
});

// GET /relatorio/:funcionario_id — relatório individual (vem DEPOIS de /relatorio/geral)
router.get('/relatorio/:funcionario_id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id } = req.params;
        const { data_inicio, data_fim, acao_id } = req.query;

        const funcionario = await Funcionario.findByPk(funcionario_id);
        if (!funcionario) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }

        const wherePonto: any = { funcionario_id };
        const whereAtendimento: any = { funcionario_id };
        if (acao_id) { wherePonto.acao_id = acao_id; whereAtendimento.acao_id = acao_id; }
        if (data_inicio || data_fim) {
            wherePonto.data_hora_entrada = {};
            whereAtendimento.hora_inicio = {};
            if (data_inicio) {
                wherePonto.data_hora_entrada[Op.gte] = new Date(data_inicio as string);
                whereAtendimento.hora_inicio[Op.gte] = new Date(data_inicio as string);
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
                wherePonto.data_hora_entrada[Op.lte] = fim;
                whereAtendimento.hora_inicio[Op.lte] = fim;
            }
        }

        const pontos = await PontoMedico.findAll({
            where: wherePonto,
            include: [{ model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] }],
            order: [['data_hora_entrada', 'DESC']],
        });

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtendimento,
            include: [
                {
                    model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'],
                    include: [{ model: CursoExame, as: 'cursos', attributes: ['nome'] }]
                },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome']] },
            ],
            order: [['hora_inicio', 'DESC']],
        });

        // Calcular métricas
        const totalHorasTrabalhadas = pontos
            .filter((p) => p.status === 'saiu' && p.horas_trabalhadas)
            .reduce((acc, p) => acc + (Number(p.horas_trabalhadas) || 0), 0);

        const atendimentosConcluidos = atendimentos.filter((a) => a.status === 'concluido');
        const totalAtendidos = atendimentosConcluidos.length;
        const duracoesValidas = atendimentosConcluidos.filter((a) => a.duracao_minutos);
        const tempoMedioMinutos = duracoesValidas.length > 0
            ? Math.round(duracoesValidas.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / duracoesValidas.length)
            : 0;

        const custoDiaria = Number(funcionario.custo_diaria);
        const diasTrabalhados = pontos.filter((p) => p.status === 'saiu').length;

        res.json({
            funcionario: {
                id: funcionario.id,
                nome: funcionario.nome,
                cargo: funcionario.cargo,
                especialidade: funcionario.especialidade,
                custo_diaria: custoDiaria,
            },
            metricas: {
                totalDiasTrabalhados: diasTrabalhados,
                totalHorasTrabalhadas: parseFloat(totalHorasTrabalhadas.toFixed(2)),
                totalAtendidos,
                atendimentosCancelados: atendimentos.filter((a) => a.status === 'cancelado').length,
                atendimentosEmAndamento: atendimentos.filter((a) => a.status === 'em_andamento').length,
                tempoMedioMinutos,
                custoTotal: parseFloat((custoDiaria * diasTrabalhados).toFixed(2)),
            },
            pontos,
            atendimentos,
        });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});


// ═══ GET /stats/tempo-real ═══ (admin) — atendimentos em andamento AGORA + resumo do dia por médico
router.get('/stats/tempo-real', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        // Atendimentos em andamento AGORA
        const ativos = await AtendimentoMedico.findAll({
            where: { status: 'em_andamento' },
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal("nome_completo"), 'nome']] },
            ],
            order: [['hora_inicio', 'ASC']],
        });

        const agora = Date.now();
        const resultado = ativos.map((a: any) => {
            const inicio = new Date(a.hora_inicio).getTime();
            const segundos = Math.floor((agora - inicio) / 1000);
            const json = a.toJSON();
            return {
                ...json,
                tempo_decorrido_segundos: segundos,
                nome_paciente_display: json.cidadao?.nome || json.nome_paciente || '—',
            };
        });

        // Resumo do dia por médico (concluídos, em andamento, aguardando, cancelados)
        const todosHoje = await AtendimentoMedico.findAll({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.ne]: 'aguardando' }, // Fila de espera não conta como atendimento
            },
            attributes: ['funcionario_id', 'status'],
        });

        const resumoPorMedico: Record<string, { concluidos: number; emAndamento: number; cancelados: number; total: number }> = {};
        todosHoje.forEach((a: any) => {
            const fid = String(a.funcionario_id);
            if (!resumoPorMedico[fid]) resumoPorMedico[fid] = { concluidos: 0, emAndamento: 0, cancelados: 0, total: 0 };
            resumoPorMedico[fid].total++;
            if (a.status === 'concluido') resumoPorMedico[fid].concluidos++;
            else if (a.status === 'em_andamento') resumoPorMedico[fid].emAndamento++;
            else if (a.status === 'cancelado') resumoPorMedico[fid].cancelados++;
        });

        const pontosAtivos = await PontoMedico.findAll({
            where: { status: 'trabalhando' },
            include: [{ model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] }]
        });

        res.json({
            total: resultado.length,
            em_andamento: resultado,
            resumoPorMedico,
            pontosAtivos,
            gerado_em: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao buscar tempo real:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de tempo real' });
    }
});


// ═══ GET /cidadaos/buscar ═══ Busca cidadãos cadastrados (com filtro por ação)
// Usado pelo autocomplete do modal "Novo Atendimento" no admin
router.get('/cidadaos/buscar', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { q = '', acao_id } = req.query as { q?: string; acao_id?: string };
        const termo = String(q).trim();

        if (acao_id) {
            // Busca inscritos da ação que ainda não foram atendidos
            const inscricoes = await Inscricao.findAll({
                where: { acao_id, status: { [Op.in]: ['pendente', 'atendido'] } },
                include: [{
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone', 'data_nascimento'],
                    ...(termo ? {
                        where: {
                            [Op.or]: [
                                { nome_completo: { [Op.iLike]: `%${termo}%` } },
                                { cpf: { [Op.iLike]: `%${termo}%` } },
                            ],
                        },
                    } : {}),
                    required: Boolean(termo),
                }],
                limit: 20,
            });
            const resultado = inscricoes
                .filter((i: any) => i.cidadao)
                .map((i: any) => ({
                    id: i.cidadao.id,
                    nome: i.cidadao.nome || i.cidadao.nome_completo,
                    cpf: i.cidadao.cpf,
                    telefone: i.cidadao.telefone,
                    inscricao_id: i.id,
                    inscricao_status: i.status,
                }));
            res.json(resultado);
        } else {
            // Busca geral de cidadãos cadastrados
            const where: any = termo
                ? { [Op.or]: [{ nome_completo: { [Op.iLike]: `%${termo}%` } }, { cpf: { [Op.iLike]: `%${termo}%` } }] }
                : {};
            const cidadaos = await Cidadao.findAll({
                where,
                attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone'],
                limit: 20,
                order: [['nome_completo', 'ASC']],
            });
            res.json(cidadaos.map((c: any) => c.toJSON()));
        }
    } catch (error) {
        console.error('Erro ao buscar cidadãos:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadãos' });
    }
});

// ═══ GET /fila/:funcionario_id ═══ Fila de espera do médico (atendimentos aguardando hoje)
// Usado pelo painel do médico via polling para notificações e lista de espera
router.get('/fila/:funcionario_id', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { funcionario_id } = req.params;

        // Apenas o próprio médico ou admin pode ver a fila
        if (req.user.tipo !== 'admin' && String(req.user.id) !== String(funcionario_id)) {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        const { acao_id } = req.query as { acao_id?: string };

        const whereFila: any = {
            funcionario_id,
            status: 'aguardando',
            hora_inicio: { [Op.between]: [hoje, amanha] },
        };
        // Filtra por ação se informada (paciente visto só na ação correta)
        if (acao_id) whereFila.acao_id = acao_id;

        const aguardando = await AtendimentoMedico.findAll({
            where: whereFila,
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
            ],
            order: [['hora_inicio', 'ASC']],
        });

        const agora = Date.now();
        const fila = aguardando.map((a: any) => {
            const json = a.toJSON();
            const segundos = Math.floor((agora - new Date(a.hora_inicio).getTime()) / 1000);
            return {
                ...json,
                nome_display: json.cidadao?.nome || json.nome_paciente || 'Paciente',
                tempo_espera_segundos: segundos,
            };
        });

        res.json({ total: fila.length, fila, gerado_em: new Date().toISOString() });
    } catch (error) {
        console.error('Erro ao buscar fila:', error);
        res.status(500).json({ error: 'Erro ao buscar fila' });
    }
});

export default router;
