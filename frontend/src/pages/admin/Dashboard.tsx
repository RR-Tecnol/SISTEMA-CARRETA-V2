import React from 'react';
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
    FileText,
    BarChart3,
    DollarSign,
    Package,
} from 'lucide-react';
import { expressoTheme } from '../../theme/expressoTheme';

const menuItems = [
    { title: 'Relatórios e BI', icon: BarChart3, path: '/admin/relatorios', description: 'Analytics e métricas' },
    { title: 'Ações', icon: Activity, path: '/admin/acoes', description: 'Gerenciar ações de saúde' },
    { title: 'Contas a Pagar', icon: DollarSign, path: '/admin/contas-pagar', description: 'Custos e despesas' },
    { title: 'Estoque', icon: Package, path: '/admin/estoque', description: 'Controle de insumos' },
    { title: 'Instituições', icon: Building2, path: '/admin/instituicoes', description: 'Parceiros e convênios' },
    { title: 'Caminhões', icon: Truck, path: '/admin/caminhoes', description: 'Frota de veículos' },
    { title: 'Funcionários', icon: Users, path: '/admin/funcionarios', description: 'Equipe e colaboradores' },
    { title: 'Exames', icon: Stethoscope, path: '/admin/cursos-exames', description: 'Exames de saúde' },
    { title: 'Cidadãos', icon: UserCheck, path: '/admin/cidadaos', description: 'Cadastro de cidadãos' },
    { title: 'Inscrições', icon: FileText, path: '/admin/inscricoes', description: 'Gerenciar inscrições' },
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
                                                background: expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: `1px solid ${expressoTheme.colors.border}`,
                                                p: 3,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                boxShadow: expressoTheme.shadows.card,
                                                '&:hover': {
                                                    background: expressoTheme.colors.cardHover,
                                                    borderColor: expressoTheme.colors.primary,
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                },
                                            }}
                                        >
                                            {/* Ícone */}
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignSelf: 'flex-start',
                                                    padding: 2,
                                                    borderRadius: expressoTheme.borderRadius.medium,
                                                    background: expressoTheme.gradients.primary,
                                                    boxShadow: expressoTheme.shadows.button,
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
                                                        color: expressoTheme.colors.text,
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
