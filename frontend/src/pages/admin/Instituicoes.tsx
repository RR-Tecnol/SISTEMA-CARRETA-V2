import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, CircularProgress, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Building2, Phone, Mail, MapPin, Edit } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface Instituicao {
    id: string;
    razao_social: string;
    cnpj: string;
    responsavel: string;
    telefone: string;
    email: string;
    endereco: string;
    cidade: string;
    estado: string;
}

const Instituicoes: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInstituicoes();
    }, []);

    const fetchInstituicoes = async () => {
        try {
            const response = await api.get('/instituicoes');
            setInstituicoes(response.data);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar instituições', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredInstituicoes = instituicoes.filter((inst) =>
        inst.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.cnpj.includes(searchTerm) ||
        inst.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background }}>
                <CircularProgress sx={{ color: expressoTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, py: 4 }}>
            <Container maxWidth="xl">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5 }}>
                                Gerenciar Instituições Parceiras
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                {filteredInstituicoes.length} instituições cadastradas
                            </Typography>
                        </Box>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/admin/instituicoes/nova')}
                            style={{
                                background: expressoTheme.gradients.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: expressoTheme.borderRadius.medium,
                                padding: '12px 24px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: expressoTheme.shadows.button,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <Building2 size={20} />
                            Nova Instituição
                        </motion.button>
                    </Box>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar instituições..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    '&:hover fieldset': { borderColor: expressoTheme.colors.primary },
                                },
                            }}
                            InputProps={{
                                startAdornment: <Search size={20} color={expressoTheme.colors.textSecondary} style={{ marginRight: 8 }} />,
                                endAdornment: searchTerm && (
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <X size={18} />
                                    </IconButton>
                                ),
                            }}
                        />
                    </Box>
                </motion.div>

                <Grid container spacing={3}>
                    <AnimatePresence>
                        {filteredInstituicoes.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 6, textAlign: 'center' }}>
                                    <Building2 size={48} color={expressoTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                    <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                        {searchTerm ? 'Nenhuma instituição encontrada.' : 'Nenhuma instituição cadastrada ainda.'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredInstituicoes.map((inst, index) => (
                                <Grid item xs={12} sm={6} md={3} key={inst.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                    >
                                        <Box
                                            sx={{
                                                background: expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: `1px solid ${expressoTheme.colors.border}`,
                                                p: 2,
                                                height: '100%',
                                                transition: 'all 0.3s ease',
                                                boxShadow: expressoTheme.shadows.card,
                                                '&:hover': {
                                                    background: expressoTheme.colors.cardHover,
                                                    borderColor: expressoTheme.colors.primary,
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                                                <Box sx={{ display: 'inline-flex', padding: 1.2, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button }}>
                                                    <Building2 size={20} color="white" />
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/admin/instituicoes/${inst.id}`)}
                                                    sx={{ color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover } }}
                                                >
                                                    <Edit size={18} />
                                                </IconButton>
                                            </Box>

                                            <Typography variant="h6" sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>
                                                {inst.razao_social}
                                            </Typography>

                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.8rem', mb: 1.5 }}>
                                                CNPJ: {inst.cnpj}
                                            </Typography>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Phone size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.8rem' }}>
                                                        {inst.telefone}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Mail size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.8rem' }}>
                                                        {inst.email}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MapPin size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                                        {inst.cidade}/{inst.estado}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))
                        )}
                    </AnimatePresence>
                </Grid>
            </Container>
        </Box>
    );
};

export default Instituicoes;
