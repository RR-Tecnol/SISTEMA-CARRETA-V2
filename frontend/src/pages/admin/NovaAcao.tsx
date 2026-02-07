import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Box,
    CircularProgress,
    IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Calendar,
    MapPin,
    Plus,
    X,
    Save,
    ArrowLeft,
    GraduationCap,
    Activity,
    Users,
    Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Instituicao {
    id: string;
    razao_social: string;
}

interface CursoExame {
    id: string;
    nome: string;
    tipo: 'curso' | 'exame';
}

interface CursoExameSelecionado {
    curso_exame_id: string;
    vagas: number;
}

const NovaAcao = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(false);
    const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);
    const [loadingCursosExames, setLoadingCursosExames] = useState(false);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [cursosExames, setCursosExames] = useState<CursoExame[]>([]);
    const [cursosExamesSelecionados, setCursosExamesSelecionados] = useState<CursoExameSelecionado[]>([]);

    const [formData, setFormData] = useState({
        nome: '',
        instituicao_id: '',
        tipo: 'curso' as 'curso' | 'saude',
        municipio: '',
        estado: '',
        data_inicio: '',
        data_fim: '',
        status: 'planejada' as 'planejada' | 'ativa' | 'concluida',
        descricao: '',
        local_execucao: '',
        vagas_disponiveis: 0,
        distancia_km: 0,
        preco_combustivel_referencia: 0,
    });

    const loadInstituicoes = useCallback(async () => {
        try {
            const response = await api.get('/instituicoes');
            setInstituicoes(response.data);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar instituições',
                { variant: 'error' }
            );
        } finally {
            setLoadingInstituicoes(false);
        }
    }, [enqueueSnackbar]);

    const loadCursosExames = useCallback(async (tipo: 'curso' | 'saude') => {
        try {
            setLoadingCursosExames(true);
            const tipoParam = tipo === 'curso' ? 'curso' : 'exame';
            const response = await api.get(`/cursos-exames?tipo=${tipoParam}`);
            setCursosExames(response.data);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar cursos/exames',
                { variant: 'error' }
            );
        } finally {
            setLoadingCursosExames(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        loadInstituicoes();
    }, [loadInstituicoes]);

    useEffect(() => {
        if (formData.tipo) {
            loadCursosExames(formData.tipo);
        }
    }, [formData.tipo, loadCursosExames]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'vagas_disponiveis' ? parseInt(value) || 0 : value,
        });

        if (name === 'tipo') {
            setCursosExamesSelecionados([]);
        }
    };

    const handleAddCursoExame = () => {
        setCursosExamesSelecionados([
            ...cursosExamesSelecionados,
            { curso_exame_id: '', vagas: 0 },
        ]);
    };

    const handleRemoveCursoExame = (index: number) => {
        const newList = cursosExamesSelecionados.filter((_, i) => i !== index);
        setCursosExamesSelecionados(newList);
    };

    const handleCursoExameChange = (index: number, field: 'curso_exame_id' | 'vagas', value: string | number) => {
        const newList = [...cursosExamesSelecionados];
        newList[index] = {
            ...newList[index],
            [field]: field === 'vagas' ? parseInt(value as string) || 0 : value,
        };
        setCursosExamesSelecionados(newList);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.instituicao_id) {
            enqueueSnackbar('Selecione uma instituição', { variant: 'error' });
            return;
        }

        if (cursosExamesSelecionados.length === 0) {
            enqueueSnackbar('Selecione pelo menos um curso/exame', { variant: 'error' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                cursos_exames: cursosExamesSelecionados,
            };
            await api.post('/acoes', payload);
            enqueueSnackbar('Ação criada com sucesso!', { variant: 'success' });
            navigate('/admin/acoes');
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao criar ação',
                { variant: 'error' }
            );
        } finally {
            setLoading(false);
        }
    };

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    if (loadingInstituicoes) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: systemTruckTheme.colors.background }}>
                <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    if (instituicoes.length === 0) {
        return (
            <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Box
                            sx={{
                                background: systemTruckTheme.colors.cardBackground,
                                borderRadius: systemTruckTheme.borderRadius.large,
                                border: `1px solid ${systemTruckTheme.colors.border}`,
                                p: 6,
                                textAlign: 'center',
                                boxShadow: systemTruckTheme.shadows.card,
                            }}
                        >
                            <Building2 size={64} color={systemTruckTheme.colors.primary} style={{ marginBottom: 24 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 2 }}>
                                Nenhuma instituição cadastrada
                            </Typography>
                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary, mb: 4 }}>
                                Você precisa cadastrar pelo menos uma instituição antes de criar ações.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={20} />}
                                onClick={() => navigate('/admin/instituicoes/nova')}
                                sx={{
                                    background: systemTruckTheme.gradients.primary,
                                    color: 'white',
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: systemTruckTheme.shadows.button,
                                }}
                            >
                                Cadastrar Instituição
                            </Button>
                        </Box>
                    </motion.div>
                </Container>
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
                            onClick={() => navigate('/admin/acoes')}
                            sx={{
                                color: systemTruckTheme.colors.textSecondary,
                                mb: 2,
                                textTransform: 'none',
                                '&:hover': {
                                    background: systemTruckTheme.colors.cardHover,
                                },
                            }}
                        >
                            Voltar para Ações
                        </Button>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: systemTruckTheme.colors.primaryDark,
                                mb: 0.5,
                            }}
                        >
                            Nova Ação
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                            Cadastre uma nova ação de curso ou saúde
                        </Typography>
                    </Box>
                </motion.div>

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Card: Informações Básicas */}
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
                                            Informações Básicas
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Nome da Ação"
                                                name="nome"
                                                value={formData.nome}
                                                onChange={handleChange}
                                                placeholder="Ex: Campanha de Hemograma"
                                                helperText="Nome que identificará esta ação"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                required
                                                select
                                                fullWidth
                                                label="Instituição"
                                                name="instituicao_id"
                                                value={formData.instituicao_id}
                                                onChange={handleChange}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            >
                                                {instituicoes.map((inst) => (
                                                    <MenuItem key={inst.id} value={inst.id}>
                                                        {inst.razao_social}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                select
                                                fullWidth
                                                label="Tipo"
                                                name="tipo"
                                                value={formData.tipo}
                                                onChange={handleChange}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            >
                                                <MenuItem value="curso">Curso</MenuItem>
                                                <MenuItem value="saude">Saúde</MenuItem>
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                select
                                                fullWidth
                                                label="Status"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            >
                                                <MenuItem value="planejada">Planejada</MenuItem>
                                                <MenuItem value="ativa">Ativa</MenuItem>
                                                <MenuItem value="concluida">Concluída</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* Card: Cursos/Exames */}
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
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {formData.tipo === 'curso' ? (
                                                <GraduationCap size={24} color={systemTruckTheme.colors.primary} />
                                            ) : (
                                                <Activity size={24} color={systemTruckTheme.colors.primary} />
                                            )}
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                                {formData.tipo === 'curso' ? 'Cursos Oferecidos' : 'Exames Oferecidos'}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Plus size={20} />}
                                            onClick={handleAddCursoExame}
                                            sx={{
                                                borderColor: systemTruckTheme.colors.primary,
                                                color: systemTruckTheme.colors.primary,
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    borderColor: systemTruckTheme.colors.primaryDark,
                                                    background: systemTruckTheme.colors.cardHover,
                                                },
                                            }}
                                        >
                                            Adicionar {formData.tipo === 'curso' ? 'Curso' : 'Exame'}
                                        </Button>
                                    </Box>

                                    {cursosExamesSelecionados.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Users size={48} color={systemTruckTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                                Nenhum {formData.tipo === 'curso' ? 'curso' : 'exame'} adicionado ainda.
                                            </Typography>
                                            <Typography sx={{ color: systemTruckTheme.colors.textLight, fontSize: '0.875rem' }}>
                                                Clique em "Adicionar" para começar.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Grid container spacing={2}>
                                            <AnimatePresence>
                                                {cursosExamesSelecionados.map((item, index) => (
                                                    <Grid item xs={12} key={index}>
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    background: systemTruckTheme.colors.background,
                                                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                                                    p: 2,
                                                                }}
                                                            >
                                                                <Grid container spacing={2} alignItems="center">
                                                                    <Grid item xs={12} sm={6}>
                                                                        <TextField
                                                                            required
                                                                            select
                                                                            fullWidth
                                                                            label={formData.tipo === 'curso' ? 'Curso' : 'Exame'}
                                                                            value={item.curso_exame_id}
                                                                            onChange={(e) => handleCursoExameChange(index, 'curso_exame_id', e.target.value)}
                                                                            disabled={loadingCursosExames}
                                                                            sx={{
                                                                                '& .MuiOutlinedInput-root': {
                                                                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                                                                },
                                                                            }}
                                                                        >
                                                                            {cursosExames.length === 0 ? (
                                                                                <MenuItem value="" disabled>
                                                                                    {loadingCursosExames ? 'Carregando...' : 'Nenhum disponível'}
                                                                                </MenuItem>
                                                                            ) : (
                                                                                cursosExames.map((ce) => (
                                                                                    <MenuItem key={ce.id} value={ce.id}>
                                                                                        {ce.nome}
                                                                                    </MenuItem>
                                                                                ))
                                                                            )}
                                                                        </TextField>
                                                                    </Grid>
                                                                    <Grid item xs={12} sm={4}>
                                                                        <TextField
                                                                            required
                                                                            fullWidth
                                                                            type="number"
                                                                            label="Vagas"
                                                                            value={item.vagas}
                                                                            onChange={(e) => handleCursoExameChange(index, 'vagas', e.target.value)}
                                                                            inputProps={{ min: 0 }}
                                                                            sx={{
                                                                                '& .MuiOutlinedInput-root': {
                                                                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                                                                },
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12} sm={2}>
                                                                        <IconButton
                                                                            onClick={() => handleRemoveCursoExame(index)}
                                                                            sx={{
                                                                                color: systemTruckTheme.colors.danger,
                                                                                '&:hover': {
                                                                                    background: `${systemTruckTheme.colors.danger}20`,
                                                                                },
                                                                            }}
                                                                        >
                                                                            <Trash2 size={20} />
                                                                        </IconButton>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </motion.div>
                                                    </Grid>
                                                ))}
                                            </AnimatePresence>
                                        </Grid>
                                    )}
                                </Box>
                            </motion.div>
                        </Grid>

                        {/* Card: Localização e Datas */}
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
                                            Localização e Período
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Município"
                                                name="municipio"
                                                value={formData.municipio}
                                                onChange={handleChange}
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
                                                select
                                                fullWidth
                                                label="Estado"
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleChange}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            >
                                                {estados.map((uf) => (
                                                    <MenuItem key={uf} value={uf}>
                                                        {uf}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Local de Execução"
                                                name="local_execucao"
                                                value={formData.local_execucao}
                                                onChange={handleChange}
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
                                                type="date"
                                                label="Data Início"
                                                name="data_inicio"
                                                value={formData.data_inicio}
                                                onChange={handleChange}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    startAdornment: <Calendar size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
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
                                                type="date"
                                                label="Data Fim"
                                                name="data_fim"
                                                value={formData.data_fim}
                                                onChange={handleChange}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{
                                                    startAdornment: <Calendar size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
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
                                                type="number"
                                                label="Vagas Disponíveis"
                                                name="vagas_disponiveis"
                                                value={formData.vagas_disponiveis}
                                                onChange={handleChange}
                                                inputProps={{ min: 0 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Distância (km)"
                                                name="distancia_km"
                                                value={formData.distancia_km}
                                                onChange={(e) => setFormData({ ...formData, distancia_km: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                onFocus={e => e.target.select()}
                                                inputProps={{ min: 0 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Preço Combustível (R$/L)"
                                                name="preco_combustivel_referencia"
                                                value={formData.preco_combustivel_referencia}
                                                onChange={(e) => setFormData({ ...formData, preco_combustivel_referencia: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                onFocus={e => e.target.select()}
                                                inputProps={{ step: "0.01", min: 0 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                label="Descrição"
                                                name="descricao"
                                                value={formData.descricao}
                                                onChange={handleChange}
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
                                        onClick={() => navigate('/admin/acoes')}
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
                                        {loading ? 'Salvando...' : 'Criar Ação'}
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

export default NovaAcao;
