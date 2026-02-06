import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Grid, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Activity, Edit, Trash2, Stethoscope } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface ExameSaude {
    id: string;
    nome: string;
    tipo: 'curso' | 'exame';
    created_at: string;
}

const ExamesSaude: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [exames, setExames] = useState<ExameSaude[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingExame, setEditingExame] = useState<ExameSaude | null>(null);
    const [formData, setFormData] = useState({ nome: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchExames();
    }, []);

    const fetchExames = async () => {
        try {
            const response = await api.get('/cursos-exames');
            // Filtrar apenas exames de saúde
            const examesSaude = response.data.filter((item: ExameSaude) => item.tipo === 'exame');
            setExames(examesSaude);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar exames', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (exame?: ExameSaude) => {
        if (exame) {
            setEditingExame(exame);
            setFormData({ nome: exame.nome });
        } else {
            setEditingExame(null);
            setFormData({ nome: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingExame(null);
        setFormData({ nome: '' });
    };

    const handleSubmit = async () => {
        if (!formData.nome.trim()) {
            enqueueSnackbar('Nome do exame é obrigatório', { variant: 'warning' });
            return;
        }

        try {
            const payload = { ...formData, tipo: 'exame' }; // Sempre tipo 'exame'

            if (editingExame) {
                await api.put(`/cursos-exames/${editingExame.id}`, payload);
                enqueueSnackbar('Exame atualizado com sucesso!', { variant: 'success' });
            } else {
                await api.post('/cursos-exames', payload);
                enqueueSnackbar('Exame cadastrado com sucesso!', { variant: 'success' });
            }

            handleCloseDialog();
            fetchExames();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao salvar exame', { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este exame?')) return;

        try {
            await api.delete(`/cursos-exames/${id}`);
            enqueueSnackbar('Exame excluído com sucesso!', { variant: 'success' });
            fetchExames();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao excluir exame', { variant: 'error' });
        }
    };

    const filteredExames = exames.filter((exame) =>
        exame.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background }}>
                <CircularProgress sx={{ color: expressoTheme.colors.primaryDark }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 80% 20%, rgba(17, 153, 142, 0.3), transparent 50%)' } }}>
            <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Stethoscope size={32} />
                                Gerenciar Exames de Saúde
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                {exames.length} exames cadastrados
                            </Typography>
                        </Box>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={20} />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    background: expressoTheme.colors.background,
                                    color: expressoTheme.colors.primaryDark,
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: '0 8px 32px rgba(17, 153, 142, 0.4)',
                                }}
                            >
                                Novo Exame
                            </Button>
                        </motion.div>
                    </Box>
                </motion.div>

                {/* Barra de Pesquisa */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: 'expressoTheme.colors.cardBackground', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, mb: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar exames de saúde..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    '& fieldset': { border: 'none' },
                                },
                            }}
                            InputProps={{
                                startAdornment: <Search size={20} color="#11998e" style={{ marginRight: 8 }} />,
                                endAdornment: searchTerm && (
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <X size={18} />
                                    </IconButton>
                                ),
                            }}
                        />
                    </Box>
                </motion.div>

                {/* Grid de Exames */}
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {filteredExames.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ background: 'expressoTheme.colors.cardBackground', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 6, textAlign: 'center' }}>
                                    <Activity size={48} color="rgba(255,255,255,0.5)" style={{ marginBottom: 16 }} />
                                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {searchTerm ? 'Nenhum exame encontrado.' : 'Nenhum exame cadastrado ainda.'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredExames.map((exame, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={exame.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.05, y: -5 }}
                                    >
                                        <Box
                                            sx={{
                                                background: 'expressoTheme.colors.cardBackground',
                                                backdropFilter: 'blur(20px)',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                p: 3,
                                                height: '100%',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: 'rgba(255, 255, 255, 0.15)',
                                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        display: 'inline-flex',
                                                        padding: 2,
                                                        borderRadius: '16px',
                                                        background: expressoTheme.colors.background,
                                                        boxShadow: '0 8px 32px rgba(17, 153, 142, 0.4)',
                                                    }}
                                                >
                                                    <Activity size={24} color="white" />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenDialog(exame)}
                                                        sx={{ color: expressoTheme.colors.primaryDark, '&:hover': { background: 'rgba(255,255,255,0.2)' } }}
                                                    >
                                                        <Edit size={18} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(exame.id)}
                                                        sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239,68,68,0.2)' } }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 700, mb: 1 }}>
                                                {exame.nome}
                                            </Typography>

                                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                                Cadastrado em: {new Date(exame.created_at).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))
                        )}
                    </AnimatePresence>
                </Grid>

                {/* Dialog de Criação/Edição */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ background: expressoTheme.colors.background, color: expressoTheme.colors.primaryDark, fontWeight: 700 }}>
                        {editingExame ? 'Editar Exame de Saúde' : 'Novo Exame de Saúde'}
                    </DialogTitle>
                    <DialogContent sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            label="Nome do Exame"
                            value={formData.nome}
                            onChange={(e) => setFormData({ nome: e.target.value })}
                            placeholder="Ex: Hemograma Completo, Raio-X de Tórax..."
                            autoFocus
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                            💡 Digite o nome completo do exame de saúde que será oferecido nas ações.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            sx={{
                                background: expressoTheme.colors.background,
                                color: expressoTheme.colors.primaryDark,
                                fontWeight: 600,
                                px: 3,
                            }}
                        >
                            {editingExame ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default ExamesSaude;
