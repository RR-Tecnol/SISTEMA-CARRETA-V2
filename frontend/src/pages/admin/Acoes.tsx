import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    CircularProgress,
    TextField,
    Grid,
    MenuItem,
    InputAdornment,
    Collapse,
    IconButton,
    Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    X,
    Calendar,
    MapPin,
    Users,
    Eye,
    Activity
} from 'lucide-react';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface Acao {
    id: string;
    numero_acao?: number;
    nome: string;
    tipo: 'curso' | 'saude';
    municipio: string;
    estado: string;
    data_inicio: string;
    data_fim: string;
    status: 'planejada' | 'ativa' | 'concluida';
    descricao: string;
    local_execucao: string;
    vagas_disponiveis: number;
}

const Acoes = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [acoes, setAcoes] = useState<Acao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filtros
    const [filterTipo, setFilterTipo] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterEstado, setFilterEstado] = useState('');


    const fetchAcoes = useCallback(async () => {
        try {
            const response = await api.get('/acoes');
            // Garantir que sempre seja um array
            setAcoes(Array.isArray(response.data) ? response.data : []);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar ações', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchAcoes();
    }, [fetchAcoes]);

    const filteredAcoes = acoes.filter((acao) => {
        const matchesSearch = acao.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acao.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acao.numero_acao?.toString().includes(searchTerm);
        const matchesTipo = !filterTipo || acao.tipo === filterTipo;
        const matchesStatus = !filterStatus || acao.status === filterStatus;
        const matchesMunicipio = !filterMunicipio || acao.municipio.toLowerCase().includes(filterMunicipio.toLowerCase());
        const matchesEstado = !filterEstado || acao.estado.toLowerCase().includes(filterEstado.toLowerCase());

        return matchesSearch && matchesTipo && matchesStatus && matchesMunicipio && matchesEstado;
    });

    const clearFilters = () => {
        setFilterTipo('');
        setFilterStatus('');
        setFilterMunicipio('');
        setFilterEstado('');
        setSearchTerm('');
    };

    const hasActiveFilters = filterTipo || filterStatus || filterMunicipio || filterEstado;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ativa': return expressoTheme.colors.success;
            case 'planejada': return expressoTheme.colors.warning;
            case 'concluida': return expressoTheme.colors.textSecondary;
            default: return expressoTheme.colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ativa': return 'Ativa';
            case 'planejada': return 'Planejada';
            case 'concluida': return 'Concluída';
            default: return status;
        }
    };

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
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5 }}>
                                Gerenciar Ações de Saúde
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                {filteredAcoes.length} ações encontradas
                            </Typography>
                        </Box>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={20} />}
                                onClick={() => navigate('/admin/acoes/nova')}
                                sx={{
                                    background: expressoTheme.gradients.primary,
                                    color: 'white',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: expressoTheme.shadows.button,
                                    '&:hover': {
                                        background: expressoTheme.colors.primaryDark,
                                    }
                                }}
                            >
                                Nova Ação
                            </Button>
                        </motion.div>
                    </Box>
                </motion.div>

                {/* Barra de Pesquisa e Filtros */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar ações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    '&:hover fieldset': {
                                        borderColor: expressoTheme.colors.primary,
                                    },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={20} color={expressoTheme.colors.textSecondary} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <X size={18} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                startIcon={<Filter size={18} />}
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{
                                    color: expressoTheme.colors.text,
                                    textTransform: 'none',
                                    background: showFilters ? expressoTheme.colors.cardHover : 'transparent',
                                    '&:hover': { background: expressoTheme.colors.cardHover }
                                }}
                            >
                                Filtros Avançados
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    startIcon={<X size={18} />}
                                    onClick={clearFilters}
                                    sx={{ color: expressoTheme.colors.textSecondary, textTransform: 'none' }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}
                        </Box>

                        <Collapse in={showFilters}>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} size="small">
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="curso">Curso</MenuItem>
                                        <MenuItem value="saude">Saúde</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small">
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="planejada">Planejada</MenuItem>
                                        <MenuItem value="ativa">Ativa</MenuItem>
                                        <MenuItem value="concluida">Concluída</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Município" value={filterMunicipio} onChange={(e) => setFilterMunicipio(e.target.value)} size="small" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Estado" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} size="small" />
                                </Grid>
                            </Grid>
                        </Collapse>
                    </Box>
                </motion.div>

                {/* Grid de Ações */}
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {filteredAcoes.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 6, textAlign: 'center' }}>
                                    <Activity size={48} color={expressoTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                    <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                        {searchTerm || hasActiveFilters ? 'Nenhuma ação encontrada.' : 'Nenhuma ação cadastrada ainda.'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredAcoes.map((acao, index) => (
                                <Grid item xs={12} sm={6} md={4} key={acao.id}>
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
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: expressoTheme.shadows.card,
                                                '&:hover': {
                                                    background: expressoTheme.colors.cardHover,
                                                    borderColor: expressoTheme.colors.primary,
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                },
                                            }}
                                            onClick={() => navigate(`/admin/acoes/${acao.id}`)}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                                <Box sx={{ display: 'inline-flex', padding: 1.5, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button }}>
                                                    <Activity size={24} color="white" />
                                                </Box>
                                                <Chip
                                                    label={getStatusLabel(acao.status)}
                                                    size="small"
                                                    sx={{
                                                        background: getStatusColor(acao.status),
                                                        color: 'white',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Box>

                                            <Typography variant="h6" sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 1 }}>
                                                {acao.nome || (acao.numero_acao ? `Ação #${acao.numero_acao}` : 'Nova Ação')}
                                            </Typography>

                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem', mb: 2, minHeight: 40 }}>
                                                {acao.descricao.length > 80 ? `${acao.descricao.substring(0, 80)}...` : acao.descricao}
                                            </Typography>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MapPin size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                                        {acao.municipio}/{acao.estado}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Calendar size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                                        {new Date(acao.data_inicio).toLocaleDateString('pt-BR')} - {new Date(acao.data_fim).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Users size={16} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                                        {acao.vagas_disponiveis} vagas disponíveis
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Button
                                                fullWidth
                                                startIcon={<Eye size={18} />}
                                                sx={{
                                                    mt: 2,
                                                    color: expressoTheme.colors.primary,
                                                    borderColor: expressoTheme.colors.primary,
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: expressoTheme.colors.cardHover,
                                                        borderColor: expressoTheme.colors.primaryDark,
                                                    }
                                                }}
                                                variant="outlined"
                                            >
                                                Ver Detalhes
                                            </Button>
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

export default Acoes;
