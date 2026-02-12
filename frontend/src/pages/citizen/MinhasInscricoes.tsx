import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, Chip, Box, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, MapPin, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Inscricao {
    id: string;
    status: string;
    created_at: string;
    curso_exame: {
        nome: string;
        tipo: string;
    };
    acao: {
        descricao: string;
        local_execucao: string;
        municipio: string;
        estado: string;
        data_inicio: string;
        data_fim: string;
    };
}

const MinhasInscricoes: React.FC = () => {
    const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInscricoes();
    }, []);

    const fetchInscricoes = async () => {
        try {
            const response = await api.get('/inscricoes/me');
            setInscricoes(response.data);
        } catch (error) {
            console.error('Erro ao buscar inscrições', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'atendido':
                return {
                    label: 'ATENDIDO',
                    color: systemTruckTheme.colors.success,
                    gradient: systemTruckTheme.gradients.success,
                    icon: <CheckCircle size={18} />,
                };
            case 'pendente':
                return {
                    label: 'PENDENTE',
                    color: systemTruckTheme.colors.primary,
                    gradient: systemTruckTheme.gradients.primary,
                    icon: <Clock size={18} />,
                };
            case 'faltou':
                return {
                    label: 'FALTOU',
                    color: systemTruckTheme.colors.warning,
                    gradient: systemTruckTheme.gradients.warning,
                    icon: <AlertCircle size={18} />,
                };
            case 'cancelado':
                return {
                    label: 'CANCELADO',
                    color: systemTruckTheme.colors.error,
                    gradient: systemTruckTheme.gradients.error,
                    icon: <XCircle size={18} />,
                };
            default:
                return {
                    label: status.toUpperCase(),
                    color: systemTruckTheme.colors.textSecondary,
                    gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                    icon: <Clock size={18} />,
                };
        }
    };

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'Data não disponível';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data inválida';
            return date.toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box
                        sx={{
                            background: systemTruckTheme.gradients.primary,
                            borderRadius: systemTruckTheme.borderRadius.large,
                            p: 4,
                            mb: 4,
                            boxShadow: systemTruckTheme.shadows.card,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <ClipboardList size={32} color="white" />
                            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                                Minhas Inscrições
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Acompanhe o status das suas inscrições em ações de saúde
                        </Typography>
                    </Box>
                </motion.div>

                {/* Lista de Inscrições */}
                {inscricoes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card
                            sx={{
                                borderRadius: systemTruckTheme.borderRadius.medium,
                                boxShadow: systemTruckTheme.shadows.card,
                                background: systemTruckTheme.colors.cardBackground,
                                p: 4,
                                textAlign: 'center',
                            }}
                        >
                            <ClipboardList
                                size={64}
                                color={systemTruckTheme.colors.textSecondary}
                                style={{ opacity: 0.5, marginBottom: 16 }}
                            />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Você ainda não possui inscrições
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Acesse "Ações Disponíveis" para se inscrever em ações de saúde
                            </Typography>
                        </Card>
                    </motion.div>
                ) : (
                    <Grid container spacing={3}>
                        {inscricoes.map((inscricao, index) => {
                            const statusConfig = getStatusConfig(inscricao.status);
                            return (
                                <Grid item xs={12} key={inscricao.id}>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                    >
                                        <Card
                                            sx={{
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                                boxShadow: systemTruckTheme.shadows.card,
                                                background: systemTruckTheme.colors.cardBackground,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateX(4px)',
                                                    boxShadow: systemTruckTheme.shadows.hover,
                                                },
                                            }}
                                        >
                                            <CardContent>
                                                <Grid container spacing={2}>
                                                    {/* Coluna Esquerda - Informações */}
                                                    <Grid item xs={12} md={9}>
                                                        {/* Título e Badge */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    color: systemTruckTheme.colors.text,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {inscricao.curso_exame?.nome}
                                                            </Typography>
                                                            <Chip
                                                                icon={statusConfig.icon}
                                                                label={statusConfig.label}
                                                                size="small"
                                                                sx={{
                                                                    background: statusConfig.gradient,
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    borderRadius: systemTruckTheme.borderRadius.small,
                                                                    '& .MuiChip-icon': {
                                                                        color: 'white',
                                                                    },
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Informações da Ação */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ color: systemTruckTheme.colors.textSecondary }}
                                                            >
                                                                <strong>Ação:</strong> {inscricao.acao?.descricao || 'Ação Carreta'}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <MapPin size={16} color={systemTruckTheme.colors.primary} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {inscricao.acao?.local_execucao}, {inscricao.acao?.municipio} - {inscricao.acao?.estado}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Calendar size={16} color={systemTruckTheme.colors.primary} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {formatDate(inscricao.acao?.data_inicio)} a {formatDate(inscricao.acao?.data_fim)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Grid>

                                                    {/* Coluna Direita - Data de Inscrição */}
                                                    <Grid item xs={12} md={3}>
                                                        <Box
                                                            sx={{
                                                                height: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignItems: { xs: 'flex-start', md: 'flex-end' },
                                                                borderLeft: { md: `2px solid ${systemTruckTheme.colors.border}` },
                                                                pl: { md: 2 },
                                                                pt: { xs: 2, md: 0 },
                                                                borderTop: { xs: `2px solid ${systemTruckTheme.colors.border}`, md: 'none' },
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: systemTruckTheme.colors.textSecondary,
                                                                    mb: 0.5,
                                                                }}
                                                            >
                                                                Inscrito em:
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: systemTruckTheme.colors.text,
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {formatDate(inscricao.created_at)}
                                                            </Typography>

                                                            {/* Mensagem de Confirmação para Atendidos */}
                                                            {inscricao.status === 'atendido' && (
                                                                <Box
                                                                    sx={{
                                                                        mt: 2,
                                                                        p: 1.5,
                                                                        borderRadius: systemTruckTheme.borderRadius.small,
                                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                                        border: `1px solid ${systemTruckTheme.colors.success}`,
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CheckCircle size={16} color={systemTruckTheme.colors.success} />
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: systemTruckTheme.colors.success,
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            Presença Confirmada
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default MinhasInscricoes;
