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

const router = Router();

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
router.post('/ponto/entrada', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
router.put('/ponto/:id/saida', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
            if (data_inicio) where.data_hora_entrada[Op.gte] = new Date(data_inicio as string);
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
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
            status: 'em_andamento',
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

// GET /atendimentos �?" listar com filtros
router.get('/atendimentos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, data_inicio, data_fim, status } = req.query;

        const where: any = {};
        if (funcionario_id) where.funcionario_id = funcionario_id;
        if (acao_id) where.acao_id = acao_id;
        if (status) where.status = status;
        if (data_inicio || data_fim) {
            where.hora_inicio = {};
            if (data_inicio) where.hora_inicio[Op.gte] = new Date(data_inicio as string);
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
                where.hora_inicio[Op.lte] = fim;
            }
        }

        const atendimentos = await AtendimentoMedico.findAll({
            where,
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome'] },
            ],
            order: [['hora_inicio', 'DESC']],
        });

        res.json(atendimentos);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        res.status(500).json({ error: 'Erro ao buscar atendimentos' });
    }
});

// �"?�"?�"? RELAT�"RIO �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
// GET /relatorio/:funcionario_id
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
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome'] },
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

export default router;

