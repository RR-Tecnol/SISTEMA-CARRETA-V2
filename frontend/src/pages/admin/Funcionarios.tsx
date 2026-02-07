import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Users, Briefcase, DollarSign, Edit } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface Funcionario {
    id: string;
    nome: string;
    cargo: string;
    cpf: string;
    telefone: string;
    email: string;
    especialidade?: string;
    custo_diaria: number;
    ativo: boolean;
}

const Funcionarios: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
    const [formData, setFormData] = useState({ nome: '', cargo: '', cpf: '', telefone: '', email: '', especialidade: '', custo_diaria: 0, ativo: true });

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const fetchFuncionarios = async () => {
        try {
            const response = await api.get('/funcionarios');
            setFuncionarios(response.data);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar funcionários', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (funcionario?: Funcionario) => {
        if (funcionario) {
            setEditingFuncionario(funcionario);
            setFormData({ nome: funcionario.nome, cargo: funcionario.cargo, cpf: funcionario.cpf, telefone: funcionario.telefone, email: funcionario.email, especialidade: funcionario.especialidade || '', custo_diaria: funcionario.custo_diaria, ativo: funcionario.ativo });
        } else {
            setEditingFuncionario(null);
            setFormData({ nome: '', cargo: '', cpf: '', telefone: '', email: '', especialidade: '', custo_diaria: 0, ativo: true });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingFuncionario(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingFuncionario) {
                await api.put(`/funcionarios/${editingFuncionario.id}`, formData);
                enqueueSnackbar('Funcionário atualizado!', { variant: 'success' });
            } else {
                await api.post('/funcionarios', formData);
                enqueueSnackbar('Funcionário cadastrado!', { variant: 'success' });
            }
            handleCloseDialog();
            fetchFuncionarios();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao salvar', { variant: 'error' });
        }
    };

    const filteredFuncionarios = funcionarios.filter((f) =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cpf.includes(searchTerm)
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
                                Gerenciar Funcionários
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                {funcionarios.length} colaboradores cadastrados
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
                                Novo Funcionário
                            </Button>
                        </motion.div>
                    </Box>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar funcionários..."
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
                        {filteredFuncionarios.map((func, index) => (
                            <Grid item xs={12} sm={6} md={4} key={func.id}>
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
                                            p: 3,
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
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                            <Box sx={{ display: 'inline-flex', padding: 1.5, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button }}>
                                                <Users size={24} color="white" />
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(func)}
                                                sx={{ color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover } }}
                                            >
                                                <Edit size={18} />
                                            </IconButton>
                                        </Box>

                                        <Typography variant="h6" sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 0.5 }}>
                                            {func.nome}
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Briefcase size={16} color={expressoTheme.colors.primary} />
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem' }}>
                                                {func.cargo}
                                            </Typography>
                                        </Box>

                                        {func.especialidade && (
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem', mb: 2 }}>
                                                {func.especialidade}
                                            </Typography>
                                        )}

                                        <Box sx={{ borderTop: `1px solid ${expressoTheme.colors.border}`, pt: 2, mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <DollarSign size={16} color={expressoTheme.colors.primaryDark} />
                                                <Typography sx={{ color: expressoTheme.colors.primaryDark, fontSize: '0.9rem', fontWeight: 600 }}>
                                                    R$ {func.custo_diaria.toFixed(2)}/dia
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}
                    </AnimatePresence>
                </Grid>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700 }}>
                        {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </DialogTitle>
                    <DialogContent dividers sx={{ pt: 6, px: 3, pb: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Especialidade" value={formData.especialidade} onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Custo Diária (R$)" type="number" value={formData.custo_diaria} onChange={(e) => setFormData({ ...formData, custo_diaria: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                        <Button onClick={handleSubmit} variant="contained" sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 600, px: 3 }}>
                            {editingFuncionario ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Funcionarios;
