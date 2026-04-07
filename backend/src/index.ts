import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { testConnection, sequelize } from './config/database';
import { Op } from 'sequelize';
import { connectRedis } from './config/redis';
import { setupAssociations } from './models';
import { errorHandler } from './middlewares/errorHandler';


// Import routes (will be created)
import authRoutes from './routes/auth';
import instituicoesRoutes from './routes/instituicoes';
import cursosExamesRoutes from './routes/cursosExames';
import acoesRoutes from './routes/acoes';
import cidadaosRoutes from './routes/cidadaos';
import inscricoesRoutes from './routes/inscricoes';
import notificacoesRoutes from './routes/notificacoes';
import noticiasRoutes from './routes/noticias';
import configuracoesRoutes from './routes/configuracoes';
import caminhoesRoutes from './routes/caminhoes';
import funcionariosRoutes from './routes/funcionarios';
import adminsRoutes from './routes/admins';
import exportRoutes from './routes/export';
import abastecimentosRoutes from './routes/abastecimentos';
import contasPagarRoutes from './routes/contasPagar';
import relatoriosRoutes from './routes/relatorios';
import analyticsRoutes from './routes/analytics';
import debugRoutes from './routes/debug';
import cidadaoExamesRoutes from './routes/cidadaoExames';
import estoqueRoutes from './routes/estoque';
import utilsRoutes from './routes/utils';
import alertasRoutes from './routes/alertas';
import medicoMonitoringRoutes from './routes/medicoMonitoring';
import fichasRoutes from './routes/fichas';
import estacoesRoutes from './routes/estacoes';
import configuracaoFilaRoutes from './routes/configuracaoFila';
import equipamentosRoutes from './routes/equipamentos';

import { FichaAtendimento } from './models/FichaAtendimento';
import { getFila } from './routes/fichas';

import { ManutencaoCaminhao } from './models/ManutencaoCaminhao';
import { Caminhao } from './models/Caminhao';
import { AcaoCaminhao } from './models/AcaoCaminhao';
import { Acao } from './models/Acao';

/**
 * Job automático: a cada hora verifica manutenções vencidas e libera os caminhões.
 * Se data_conclusao já passou e a manutenção ainda está agendada/em_andamento,
 * ela é marcada como "concluida" e o caminhão volta para disponivel (ou em_acao se ainda em ação ativa).
 */
async function liberarManutencoesvencidas() {
    try {
        const hoje = new Date();
        const vencidas = await ManutencaoCaminhao.findAll({
            where: {
                status: { [Op.in]: ['agendada', 'em_andamento'] },
                data_conclusao: { [Op.lt]: hoje },
            },
        });

        for (const m of vencidas) {
            await m.update({ status: 'concluida' });
            const caminhao = await Caminhao.findByPk(m.caminhao_id);
            if (!caminhao || caminhao.status !== 'em_manutencao') continue;

            // Ainda tem outras manutenções ativas?
            const outrasAtivas = await ManutencaoCaminhao.count({
                where: {
                    caminhao_id: m.caminhao_id,
                    status: { [Op.in]: ['agendada', 'em_andamento'] },
                    id: { [Op.ne]: m.id },
                },
            });
            if (outrasAtivas > 0) continue;

            // Está em alguma ação ativa?
            const emAcaoAtiva = await AcaoCaminhao.count({
                where: { caminhao_id: m.caminhao_id },
                include: [{ model: Acao, as: 'acao', where: { status: 'ativa' }, required: true }] as any,
            });

            await caminhao.update({ status: emAcaoAtiva > 0 ? 'em_acao' : 'disponivel' });
            console.log(`🔧→✅ Manutenção ${m.titulo} vencida: caminhão ${caminhao.placa} → ${emAcaoAtiva > 0 ? 'em_acao' : 'disponivel'}`);
        }
    } catch (err) {
        console.error('❌ Erro no job de manutenção:', err);
    }
}

const app: Application = express();
const httpServer = http.createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.frontend.url,
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Armazena a instância do io no app para que as rotas possam acessar via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // Entrar na sala de uma ação específica (recepção, médico e painel TV todos entram)
    socket.on('join_acao', async (acao_id: string) => {
        socket.join(`acao:${acao_id}`);
        console.log(`📡 Socket ${socket.id} entrou em acao:${acao_id}`);

        // Enviar fila atual ao conectar
        try {
            const fila = await getFila(acao_id);
            socket.emit('fila_atualizada', { acao_id, fila });
        } catch (err) {
            console.error('Erro ao buscar fila inicial:', err);
        }
    });

    // Cliente saiu da sala
    socket.on('leave_acao', (acao_id: string) => {
        socket.leave(`acao:${acao_id}`);
        console.log(`📡 Socket ${socket.id} saiu de acao:${acao_id}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket desconectado: ${socket.id}`);
    });
});


console.log('✅ SISTEMA CARRETAS v2.0 — 23/02/2026 — Produção');


// Security middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware (gzip)
app.use(compression());

// Serve static files BEFORE CORS to ensure proper headers
app.use('/uploads', express.static('uploads'));

app.use(cors({
    origin: config.frontend.url,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.env === 'development' ? 1000 : 3000, // Increased limit to support Dashboard N+1 fetching
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos',
});
app.use('/api/', limiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/instituicoes', instituicoesRoutes);
app.use('/api/cursos-exames', cursosExamesRoutes);
app.use('/api/acoes', acoesRoutes);
app.use('/api/inscricoes', inscricoesRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/caminhoes', caminhoesRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api', exportRoutes);
app.use('/api', abastecimentosRoutes);
app.use('/api/contas-pagar', contasPagarRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/medico-monitoring', medicoMonitoringRoutes);
app.use('/api/fichas', fichasRoutes);
app.use('/api/estacoes', estacoesRoutes);
app.use('/api/configuracao-fila', configuracaoFilaRoutes);
// F9 — Equipamentos eletrônicos por carreta (sub-rota de caminhoes)
app.use('/api/caminhoes/:id/equipamentos', equipamentosRoutes);

// IMPORTANTE: cidadaoExamesRoutes deve vir ANTES de cidadaosRoutes
// porque define rotas mais específicas (/:cidadaoId/exames)
app.use('/api/cidadaos', cidadaoExamesRoutes);
app.use('/api/cidadaos', cidadaosRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer(): Promise<void> {
    try {
        // Test database connection
        await testConnection();

        // Setup model associations
        setupAssociations();

        // Sync database (development only)
        if (config.env === 'development') {
            await sequelize.sync({ alter: false }); // Desabilitado alter para evitar erro SERIAL
            console.log('✅ Database synchronized');
        }

        // Migration: adicionar colunas de medico na tabela funcionarios (se não existirem)
        try {
            await sequelize.query(`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS is_medico BOOLEAN NOT NULL DEFAULT FALSE`);
            await sequelize.query(`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS login_cpf VARCHAR(20)`);
            await sequelize.query(`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS senha VARCHAR(255)`);
            console.log('✅ Migration medico: colunas verificadas/adicionadas');
        } catch (migErr) {
            console.warn('⚠️ Migration medico (ignorar se ja existir):', migErr);
        }

        // Migration: campos do módulo de Prestação de Contas
        try {
            await sequelize.query(`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS crm VARCHAR(30)`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS numero_processo VARCHAR(255)`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS lote_regiao VARCHAR(255)`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS numero_cnes VARCHAR(20)`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS responsavel_tecnico_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS meta_mensal_total INTEGER`);
            await sequelize.query(`ALTER TABLE acoes ADD COLUMN IF NOT EXISTS intercorrencias TEXT`);
            await sequelize.query(`ALTER TABLE cursos_exames ADD COLUMN IF NOT EXISTS codigo_sus VARCHAR(20)`);
            await sequelize.query(`ALTER TABLE cursos_exames ADD COLUMN IF NOT EXISTS valor_unitario DECIMAL(10,2)`);
            await sequelize.query(`ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS numero_prontuario VARCHAR(50)`);
            await sequelize.query(`ALTER TABLE resultados_exames ADD COLUMN IF NOT EXISTS numero_laudo VARCHAR(50)`);
            await sequelize.query(`ALTER TABLE resultados_exames ADD COLUMN IF NOT EXISTS data_emissao_laudo TIMESTAMPTZ`);
            console.log('✅ Migration prestação de contas: colunas verificadas/adicionadas');
        } catch (migErr) {
            console.warn('⚠️ Migration prestação de contas (ignorar se ja existir):', migErr);
        }

        // Migration: tabela de fichas de atendimento (Sistema de Fila)
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS fichas_atendimento (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    numero_ficha INTEGER NOT NULL,
                    cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
                    inscricao_id UUID REFERENCES inscricoes(id) ON DELETE SET NULL,
                    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
                    status VARCHAR(20) NOT NULL DEFAULT 'aguardando',
                    hora_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    hora_chamada TIMESTAMPTZ,
                    hora_atendimento TIMESTAMPTZ,
                    hora_conclusao TIMESTAMPTZ,
                    guiche VARCHAR(20),
                    observacoes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            console.log('✅ Migration fichas_atendimento: tabela verificada/criada');
        } catch (migErr) {
            console.warn('⚠️ Migration fichas_atendimento (ignorar se ja existir):', migErr);
        }

        // Migration: adicionar colunas faltantes em acao_funcionarios
        try {
            await sequelize.query(`ALTER TABLE acao_funcionarios ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10,2) DEFAULT NULL`);
            await sequelize.query(`ALTER TABLE acao_funcionarios ADD COLUMN IF NOT EXISTS dias_trabalhados INTEGER DEFAULT 1`);
            console.log('✅ Migration acao_funcionarios: colunas verificadas/adicionadas');
        } catch (migErr) {
            console.warn('⚠️ Migration acao_funcionarios:', migErr);
        }

        // Migration: tabela de equipamentos eletrônicos por carreta (F9)
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS equipamentos_caminhao (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    caminhao_id UUID NOT NULL REFERENCES caminhoes(id) ON DELETE CASCADE,
                    nome VARCHAR(100) NOT NULL,
                    tipo VARCHAR(50) NOT NULL DEFAULT 'outro',
                    modelo VARCHAR(100),
                    fabricante VARCHAR(100),
                    numero_serie VARCHAR(100),
                    numero_patrimonio VARCHAR(50),
                    data_aquisicao DATE,
                    data_ultima_manutencao DATE,
                    data_proxima_manutencao DATE,
                    valor_aquisicao DECIMAL(12,2),
                    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
                    observacoes TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            console.log('✅ Migration equipamentos_caminhao: tabela verificada/criada');
        } catch (migErr) {
            console.warn('⚠️ Migration equipamentos_caminhao (ignorar se ja existir):', migErr);
        }

        // ─── Migration: estações de exame (salas/equipamentos por ação) ────────────
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS estacoes_exame (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
                    curso_exame_id UUID REFERENCES cursos_exames(id) ON DELETE SET NULL,
                    nome VARCHAR(100) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
                    motivo_pausa TEXT,
                    ordem INTEGER DEFAULT 1,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            // Colunas extras de controle de tempo
            await sequelize.query(`ALTER TABLE estacoes_exame ADD COLUMN IF NOT EXISTS pausada_em TIMESTAMPTZ`);
            await sequelize.query(`ALTER TABLE estacoes_exame ADD COLUMN IF NOT EXISTS retomada_em TIMESTAMPTZ`);
            console.log('✅ Migration estacoes_exame: tabela e colunas verificadas/criadas');
        } catch (migErr) {
            console.warn('⚠️ Migration estacoes_exame:', migErr);
        }

        // ─── Migration: configurações de fila por ação ──────────────────────────────
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS configuracoes_fila_acao (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    acao_id UUID NOT NULL UNIQUE REFERENCES acoes(id) ON DELETE CASCADE,
                    notif_email BOOLEAN NOT NULL DEFAULT FALSE,
                    notif_sms BOOLEAN NOT NULL DEFAULT FALSE,
                    notif_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_ficha_gerada BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_chegando BOOLEAN NOT NULL DEFAULT TRUE,
                    notif_chamado BOOLEAN NOT NULL DEFAULT TRUE,
                    fichas_antes_aviso INTEGER NOT NULL DEFAULT 3,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            console.log('✅ Migration configuracoes_fila_acao: tabela verificada/criada');
        } catch (migErr) {
            console.warn('⚠️ Migration configuracoes_fila_acao:', migErr);
        }

        // ─── Migration: adicionar estacao_id em fichas_atendimento ─────────────────
        try {
            await sequelize.query(`ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS estacao_id UUID REFERENCES estacoes_exame(id) ON DELETE SET NULL`);
            await sequelize.query(`ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS hora_atendimento TIMESTAMPTZ`);
            await sequelize.query(`ALTER TABLE fichas_atendimento ADD COLUMN IF NOT EXISTS hora_conclusao TIMESTAMPTZ`);
            console.log('✅ Migration fichas_atendimento extra cols: verificadas/adicionadas');
        } catch (migErr) {
            console.warn('⚠️ Migration fichas_atendimento extra cols:', migErr);
        }

        // Connect to Redis
        await connectRedis();


        // Start server using httpServer (required for Socket.IO)
        httpServer.listen(config.port, () => {
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📝 Environment: ${config.env}`);
            console.log(`🔗 API: http://localhost:${config.port}/api`);
            console.log(`⚡ Socket.IO: ws://localhost:${config.port}`);
        });

        // Job: liberar caminhões com manutenção vencida (roda na inicialização e a cada hora)
        liberarManutencoesvencidas();
        setInterval(liberarManutencoesvencidas, 60 * 60 * 1000);
        console.log('⏰ Job de manutenção agendado (1h)');
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await sequelize.close();
    process.exit(0);
});

// Start the server
// Force restart updated env
startServer();

export default app;

