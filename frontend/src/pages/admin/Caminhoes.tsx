import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Truck, Edit, CheckCircle, XCircle } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface Caminhao {
    id: string;
    placa: string;
    modelo: string;
    ano: number;
    autonomia_km_litro: number;
    capacidade_litros: number;
    status: 'disponivel' | 'em_manutencao' | 'em_acao';
}

const Caminhoes: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [caminhoes, setCaminhoes] = useState<Caminhao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCaminhao, setEditingCaminhao] = useState<Caminhao | null>(null);
    const [formData, setFormData] = useState<{ placa: string; modelo: string; ano: number; autonomia_km_litro: number; capacidade_litros: number; status: 'disponivel' | 'em_manutencao' | 'em_acao' }>({ placa: '', modelo: '', ano: new Date().getFullYear(), autonomia_km_litro: 0, capacidade_litros: 0, status: 'disponivel' });

    useEffect(() => {
        fetchCaminhoes();
    }, []);

    const fetchCaminhoes = async () => {
        try {
            const response = await api.get('/caminhoes');
            const data = response.data;
            setCaminhoes(Array.isArray(data) ? data : (data.caminhoes || data.data || []));
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar caminhões', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (caminhao?: Caminhao) => {
        if (caminhao) {
            setEditingCaminhao(caminhao);
            setFormData({ placa: caminhao.placa, modelo: caminhao.modelo, ano: caminhao.ano, autonomia_km_litro: caminhao.autonomia_km_litro, capacidade_litros: caminhao.capacidade_litros, status: caminhao.status });
        } else {
            setEditingCaminhao(null);
            setFormData({ placa: '', modelo: '', ano: new Date().getFullYear(), autonomia_km_litro: 0, capacidade_litros: 0, status: 'disponivel' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCaminhao(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingCaminhao) {
                await api.put(`/caminhoes/${editingCaminhao.id}`, formData);
                enqueueSnackbar('Caminhão atualizado!', { variant: 'success' });
            } else {
                await api.post('/caminhoes', formData);
                enqueueSnackbar('Caminhão cadastrado!', { variant: 'success' });
            }
            handleCloseDialog();
            fetchCaminhoes();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao salvar', { variant: 'error' });
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'disponivel': return { label: 'Disponível', color: expressoTheme.colors.success, icon: CheckCircle };
            case 'em_acao': return { label: 'Em Ação', color: expressoTheme.colors.warning, icon: Truck };
            case 'em_manutencao': return { label: 'Manutenção', color: expressoTheme.colors.danger, icon: XCircle };
            default: return { label: status, color: expressoTheme.colors.textSecondary, icon: Truck };
        }
    };

    const filteredCaminhoes = caminhoes.filter((c) =>
        c.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.modelo.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5 }}>
                                Gerenciar Frota de Caminhões
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                {caminhoes.length} veículos cadastrados
                            </Typography>
                        </Box>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={20} />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    background: expressoTheme.gradients.primary,
                                    color: 'white',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: expressoTheme.shadows.button,
                                }}
                            >
                                Novo Caminhão
                            </Button>
                        </motion.div>
                    </Box>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar caminhões..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, '&:hover fieldset': { borderColor: expressoTheme.colors.primary } } }}
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
                        {filteredCaminhoes.map((caminhao, index) => {
                            const statusConfig = getStatusConfig(caminhao.status);
                            const StatusIcon = statusConfig.icon;
                            return (
                                <Grid item xs={12} sm={6} md={3} key={caminhao.id}>
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
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.1, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <Box sx={{ display: 'inline-flex', padding: 1, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button }}>
                                                        <Truck size={20} color="white" />
                                                    </Box>
                                                </motion.div>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Chip
                                                        icon={<StatusIcon size={16} />}
                                                        label={statusConfig.label}
                                                        size="small"
                                                        sx={{ background: statusConfig.color, color: 'white', fontWeight: 600 }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(caminhao)}
                                                        sx={{ color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover } }}
                                                    >
                                                        <Edit size={18} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Typography variant="h6" sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
                                                {caminhao.placa}
                                            </Typography>

                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem', mb: 0.5 }}>
                                                {caminhao.modelo} - {caminhao.ano}
                                            </Typography>

                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.8rem' }}>
                                                Autonomia: {caminhao.autonomia_km_litro} km/l | Tanque: {caminhao.capacidade_litros}L
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </AnimatePresence>
                </Grid>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700 }}>
                        {editingCaminhao ? 'Editar Caminhão' : 'Novo Caminhão'}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Placa" value={formData.placa} onChange={(e) => setFormData({ ...formData, placa: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Ano" type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Autonomia (km/l)" type="number" value={formData.autonomia_km_litro} onChange={(e) => setFormData({ ...formData, autonomia_km_litro: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Capacidade do Tanque (litros)" type="number" value={formData.capacidade_litros} onChange={(e) => setFormData({ ...formData, capacidade_litros: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField select fullWidth label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} SelectProps={{ native: true }}>
                                    <option value="disponivel">Disponível</option>
                                    <option value="em_acao">Em Ação</option>
                                    <option value="em_manutencao">Manutenção</option>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                        <Button onClick={handleSubmit} variant="contained" sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 600, px: 3 }}>
                            {editingCaminhao ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Caminhoes;
