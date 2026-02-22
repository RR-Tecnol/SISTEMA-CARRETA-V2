import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton, Switch, FormControlLabel, Collapse, Divider } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Users, Briefcase, DollarSign, Edit, Stethoscope } from 'lucide-react';
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
    is_medico?: boolean;
}

const Funcionarios: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
    const [formData, setFormData] = useState({ nome: '', cargo: '', cpf: '', telefone: '', email: '', especialidade: '', custo_diaria: 0, ativo: true, is_medico: false, login_cpf: '', senha: '' });

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const fetchFuncionarios = async () => {
        try {
            const response = await api.get('/funcionarios');
            const data = response.data;
            setFuncionarios(Array.isArray(data) ? data : (data.funcionarios || data.data || []));
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar funcionários', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (funcionario?: Funcionario) => {
        if (funcionario) {
            setEditingFuncionario(funcionario);
            setFormData({ nome: funcionario.nome, cargo: funcionario.cargo, cpf: funcionario.cpf, telefone: funcionario.telefone, email: funcionario.email, especialidade: funcionario.especialidade || '', custo_diaria: funcionario.custo_diaria, ativo: funcionario.ativo, is_medico: funcionario.is_medico || false, login_cpf: '', senha: '' });
        } else {
            setEditingFuncionario(null);
            setFormData({ nome: '', cargo: '', cpf: '', telefone: '', email: '', especialidade: '', custo_diaria: 0, ativo: true, is_medico: false, login_cpf: '', senha: '' });
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
                                                    R$ {Number(func.custo_diaria).toFixed(2)}/dia
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
                                <TextField
                                    fullWidth
                                    label="Custo Diária (R$)"
                                    type="number"
                                    value={formData.custo_diaria}
                                    onChange={(e) => setFormData({ ...formData, custo_diaria: Number(e.target.value) })}
                                    onFocus={(e) => {
                                        if (formData.custo_diaria === 0) {
                                            setFormData({ ...formData, custo_diaria: '' as any });
                                        }
                                        e.target.select();
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value === '') {
                                            setFormData({ ...formData, custo_diaria: 0 });
                                        }
                                    }}
                                />
                            </Grid>

                            {/* Toggle Médico */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_medico}
                                            onChange={(e) => setFormData({ ...formData, is_medico: e.target.checked })}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Stethoscope size={18} color={formData.is_medico ? expressoTheme.colors.primary : expressoTheme.colors.textSecondary} />
                                            <Typography sx={{ fontWeight: formData.is_medico ? 700 : 400, color: formData.is_medico ? expressoTheme.colors.primary : expressoTheme.colors.text }}>
                                                É Médico (habilitar login no painel de consultas)
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>

                            {/* Campos de Login do Médico */}
                            <Collapse in={formData.is_medico} style={{ width: '100%' }}>
                                <Grid container spacing={2} sx={{ px: 2, pt: 1, pb: 2, background: 'rgba(59,130,246,0.05)', borderRadius: 2, border: '1px solid rgba(59,130,246,0.2)', mx: 0 }}>
                                    <Grid item xs={12}>
                                        <Typography sx={{ fontSize: '0.8rem', color: expressoTheme.colors.textSecondary, mb: 1 }}>
                                            🔐 Credenciais de acesso ao Painel Médico
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="CPF de Login"
                                            placeholder="000.000.000-00"
                                            value={formData.login_cpf}
                                            onChange={(e) => setFormData({ ...formData, login_cpf: e.target.value })}
                                            helperText="CPF que o médico usará para login"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label={editingFuncionario ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                                            value={formData.senha}
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                            helperText="Mínimo 6 caracteres"
                                        />
                                    </Grid>
                                </Grid>
                            </Collapse>
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
