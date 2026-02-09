import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { testConnection, sequelize } from './config/database';
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

const app: Application = express();

console.log('✅ VERSÃO ATUALIZADA: 2026-02-03 20:50');


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

        // Connect to Redis
        await connectRedis();

        // Start server
        app.listen(config.port, () => {
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📝 Environment: ${config.env}`);
            console.log(`🔗 API: http://localhost:${config.port}/api`);
        });
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
