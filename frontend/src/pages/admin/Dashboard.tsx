import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    Building2,
    Truck,
    Users,
    Stethoscope,
    UserCheck,
    BarChart3,
    DollarSign,
    Package,
    Bell,
    FileText,
} from 'lucide-react';
import { expressoTheme } from '../../theme/expressoTheme';
import api from '../../services/api';

const menuItems = [
    { title: 'Alertas de Exames', icon: Bell, path: '/admin/alertas', description: 'Periodicidade e pendências', destaque: true },
    { title: 'Relatórios e BI', icon: BarChart3, path: '/admin/relatorios', description: 'Analytics e métricas' },
    { title: 'Prestação de Contas', icon: FileText, path: '/admin/prestacao-contas', description: 'Relatório mensal executivo' },
    { title: 'Ações', icon: Activity, path: '/admin/acoes', description: 'Gerenciar ações de saúde' },
    { title: 'Contas a Pagar', icon: DollarSign, path: '/admin/contas-pagar', description: 'Custos e despesas' },
    { title: 'Estoque', icon: Package, path: '/admin/estoque', description: 'Controle de insumos' },
    { title: 'Instituições', icon: Building2, path: '/admin/instituicoes', description: 'Parceiros e convênios' },
    { title: 'Caminhões', icon: Truck, path: '/admin/caminhoes', description: 'Frota de veículos' },
    { title: 'Funcionários', icon: Users, path: '/admin/funcionarios', description: 'Equipe e colaboradores' },
    { title: 'Exames', icon: Stethoscope, path: '/admin/cursos-exames', description: 'Exames de saúde' },
    { title: 'Cidadãos', icon: UserCheck, path: '/admin/cidadaos', description: 'Cadastro de cidadãos' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
        },
    },
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [totalAlertas, setTotalAlertas] = useState<number | null>(null);

    useEffect(() => {
        api.get('/alertas/admin/dashboard')
            .then(res => setTotalAlertas(res.data?.resumo?.total_geral || 0))
            .catch(() => setTotalAlertas(null));
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: expressoTheme.colors.background,
                py: 4,
            }}
        >
            <Container maxWidth="xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ mb: 5, textAlign: 'center' }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: expressoTheme.colors.primaryDark,
                                mb: 1,
                            }}
                        >
                            Painel Administrativo
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: expressoTheme.colors.textSecondary,
                                fontWeight: 400,
                            }}
                        >
                            Sistema de Gestão Expresso Saúde
                        </Typography>
                    </Box>
                </motion.div>

                {/* Grid de Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Grid container spacing={3}>
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <motion.div
                                        variants={itemVariants}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Box
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                position: 'relative',
                                                background: (item as any).destaque
                                                    ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(99,102,241,0.08))'
                                                    : expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: (item as any).destaque
                                                    ? '1px solid rgba(239,68,68,0.35)'
                                                    : `1px solid ${expressoTheme.colors.border}`,
                                                p: 3,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                boxShadow: (item as any).destaque
                                                    ? '0 0 20px rgba(239,68,68,0.15)'
                                                    : expressoTheme.shadows.card,
                                                '&:hover': {
                                                    background: expressoTheme.colors.cardHover,
                                                    borderColor: expressoTheme.colors.primary,
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                },
                                            }}
                                        >
                                            {/* Badge de alertas */}
                                            {(item as any).destaque && totalAlertas !== null && totalAlertas > 0 && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 12, right: 12,
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    borderRadius: '100px',
                                                    px: 1.2, py: 0.3,
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    lineHeight: 1.4,
                                                    animation: 'pulse 2s ease-in-out infinite',
                                                    '@keyframes pulse': {
                                                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                                        '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                                                    },
                                                }}>
                                                    {totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''}
                                                </Box>
                                            )}
                                            {/* Ícone */}
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignSelf: 'flex-start',
                                                    padding: 2,
                                                    borderRadius: expressoTheme.borderRadius.medium,
                                                    background: (item as any).destaque
                                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                                        : expressoTheme.gradients.primary,
                                                    boxShadow: (item as any).destaque
                                                        ? '0 4px 12px rgba(239,68,68,0.4)'
                                                        : expressoTheme.shadows.button,
                                                }}
                                            >
                                                <Icon size={28} color="white" />
                                            </Box>

                                            {/* Conteúdo */}
                                            <Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: (item as any).destaque ? '#ef4444' : expressoTheme.colors.text,
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: expressoTheme.colors.textSecondary,
                                                    }}
                                                >
                                                    {item.description}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </Grid>
                </motion.div>
            </Container>
        </Box>
    );
};

export default Dashboard;
