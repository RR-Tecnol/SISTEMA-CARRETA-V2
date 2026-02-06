import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Box,
    CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    FileText,
    Save,
    X,
    ArrowLeft,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const NovaInstituicao = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(!!id);

    const [formData, setFormData] = useState({
        razao_social: '',
        cnpj: '',
        responsavel_nome: '',
        responsavel_email: '',
        responsavel_tel: '',
        endereco_completo: '',
    });

    const loadInstituicao = useCallback(async () => {
        if (!id) return;

        try {
            const response = await api.get(`/instituicoes/${id}`);
            setFormData(response.data);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar instituição',
                { variant: 'error' }
            );
            navigate('/admin/instituicoes');
        } finally {
            setLoadingData(false);
        }
    }, [id, enqueueSnackbar, navigate]);

    useEffect(() => {
        loadInstituicao();
    }, [loadInstituicao]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            if (id) {
                await api.put(`/instituicoes/${id}`, formData);
                enqueueSnackbar('Instituição atualizada com sucesso!', { variant: 'success' });
            } else {
                await api.post('/instituicoes', formData);
                enqueueSnackbar('Instituição criada com sucesso!', { variant: 'success' });
            }
            navigate('/admin/instituicoes');
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || `Erro ao ${id ? 'atualizar' : 'criar'} instituição`,
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: systemTruckTheme.colors.background }}>
                <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ mb: 4 }}>
                        <Button
                            startIcon={<ArrowLeft size={20} />}
                            onClick={() => navigate('/admin/instituicoes')}
                            sx={{
                                color: systemTruckTheme.colors.textSecondary,
                                mb: 2,
                                textTransform: 'none',
                                '&:hover': {
                                    background: systemTruckTheme.colors.cardHover,
                                },
                            }}
                        >
                            Voltar para Instituições
                        </Button>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: systemTruckTheme.colors.primaryDark,
                                mb: 0.5,
                            }}
                        >
                            {id ? 'Editar Instituição' : 'Nova Instituição'}
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                            {id ? 'Atualize as informações da instituição parceira' : 'Cadastre uma nova instituição parceira'}
                        </Typography>
                    </Box>
                </motion.div>

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Card: Dados da Instituição */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Box
                                    sx={{
                                        background: systemTruckTheme.colors.cardBackground,
                                        borderRadius: systemTruckTheme.borderRadius.large,
                                        border: `1px solid ${systemTruckTheme.colors.border}`,
                                        p: 4,
                                        boxShadow: systemTruckTheme.shadows.card,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <Building2 size={24} color={systemTruckTheme.colors.primary} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                            Dados da Instituição
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Razão Social"
                                                name="razao_social"
                                                value={formData.razao_social}
                                                onChange={handleChange}
                                                InputProps={{
                                                    startAdornment: <Building2 size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="CNPJ"
                                                name="cnpj"
                                                value={formData.cnpj}
                                                onChange={handleChange}
                                                placeholder="00.000.000/0000-00"
                                                InputProps={{
                                                    startAdornment: <FileText size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* Card: Dados do Responsável */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Box
                                    sx={{
                                        background: systemTruckTheme.colors.cardBackground,
                                        borderRadius: systemTruckTheme.borderRadius.large,
                                        border: `1px solid ${systemTruckTheme.colors.border}`,
                                        p: 4,
                                        boxShadow: systemTruckTheme.shadows.card,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <User size={24} color={systemTruckTheme.colors.primary} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                            Dados do Responsável
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Nome do Responsável"
                                                name="responsavel_nome"
                                                value={formData.responsavel_nome}
                                                onChange={handleChange}
                                                InputProps={{
                                                    startAdornment: <User size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                type="email"
                                                label="E-mail do Responsável"
                                                name="responsavel_email"
                                                value={formData.responsavel_email}
                                                onChange={handleChange}
                                                InputProps={{
                                                    startAdornment: <Mail size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Telefone do Responsável"
                                                name="responsavel_tel"
                                                value={formData.responsavel_tel}
                                                onChange={handleChange}
                                                placeholder="(00) 00000-0000"
                                                InputProps={{
                                                    startAdornment: <Phone size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* Card: Endereço */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Box
                                    sx={{
                                        background: systemTruckTheme.colors.cardBackground,
                                        borderRadius: systemTruckTheme.borderRadius.large,
                                        border: `1px solid ${systemTruckTheme.colors.border}`,
                                        p: 4,
                                        boxShadow: systemTruckTheme.shadows.card,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <MapPin size={24} color={systemTruckTheme.colors.primary} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                            Endereço
                                        </Typography>
                                    </Box>

                                    <TextField
                                        required
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Endereço Completo"
                                        name="endereco_completo"
                                        value={formData.endereco_completo}
                                        onChange={handleChange}
                                        placeholder="Rua, número, complemento, bairro, cidade, estado"
                                        InputProps={{
                                            startAdornment: <MapPin size={20} style={{ marginRight: 8, marginTop: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                        }}
                                    />
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* Botões de Ação */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<X size={20} />}
                                        onClick={() => navigate('/admin/instituicoes')}
                                        disabled={loading}
                                        sx={{
                                            borderColor: systemTruckTheme.colors.border,
                                            color: systemTruckTheme.colors.text,
                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                            textTransform: 'none',
                                            px: 3,
                                            py: 1.5,
                                            fontWeight: 600,
                                            '&:hover': {
                                                borderColor: systemTruckTheme.colors.textSecondary,
                                                background: systemTruckTheme.colors.cardHover,
                                            },
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                                        disabled={loading}
                                        sx={{
                                            background: systemTruckTheme.gradients.primary,
                                            color: 'white',
                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                            textTransform: 'none',
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 600,
                                            boxShadow: systemTruckTheme.shadows.button,
                                            '&:hover': {
                                                background: systemTruckTheme.colors.primaryDark,
                                            },
                                        }}
                                    >
                                        {loading ? 'Salvando...' : id ? 'Atualizar Instituição' : 'Criar Instituição'}
                                    </Button>
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default NovaInstituicao;
