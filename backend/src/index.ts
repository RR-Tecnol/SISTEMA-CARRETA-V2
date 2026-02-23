import express, { Application, Request, Response } from 'express';
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

        // Connect to Redis
        await connectRedis();

        // Start server
        app.listen(config.port, () => {
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📝 Environment: ${config.env}`);
            console.log(`🔗 API: http://localhost:${config.port}/api`);
        });

        // Job: liberar caminhões com manutenção vencida (roda na inicialização e a cada hora)
        liberarManutencoesvencidas();
        setInterval(liberarManutencoesvencidas, 60 * 60 * 1000); // a cada 1 hora
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

