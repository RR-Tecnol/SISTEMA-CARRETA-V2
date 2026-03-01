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
    FormControlLabel,
    Switch,
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
    Activity,
    Users,
    Trash2,
    Globe,
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
        tipo: 'saude' as 'saude',
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
        permitir_inscricao_previa: true,
        // Campos para Prestação de Contas
        meta_mensal_total: '' as string | number,
        numero_processo: '',
        lote_regiao: '',
        numero_cnes: '',
    });

    const loadInstituicoes = useCallback(async () => {
        try {
            const response = await api.get('/instituicoes');
            const instData = response.data;
            setInstituicoes(Array.isArray(instData) ? instData : (instData.instituicoes || instData.data || []));
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar instituições',
                { variant: 'error' }
            );
        } finally {
            setLoadingInstituicoes(false);
        }
    }, [enqueueSnackbar]);

    const loadCursosExames = useCallback(async () => {
        try {
            setLoadingCursosExames(true);
            const response = await api.get('/cursos-exames?tipo=exame');
            const ceData = response.data;
            setCursosExames(Array.isArray(ceData) ? ceData : (ceData.cursosExames || ceData.data || []));
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar exames',
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
        loadCursosExames();
    }, [loadCursosExames]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: (name === 'vagas_disponiveis' || name === 'meta_mensal_total')
                ? (parseInt(value) || (value === '' ? '' : 0))
                : value,
        });
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
            enqueueSnackbar('Selecione pelo menos um exame', { variant: 'error' });
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
                            Nova Ação de Saúde
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                            Cadastre uma nova ação de exames de saúde
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

                                        <Grid item xs={12}>
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

                                        <Grid item xs={12}>
                                            <Box
                                                sx={{
                                                    background: systemTruckTheme.colors.background,
                                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                                    p: 2,
                                                }}
                                            >
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.permitir_inscricao_previa}
                                                            onChange={(e) => setFormData({ ...formData, permitir_inscricao_previa: e.target.checked })}
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: systemTruckTheme.colors.primary,
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: systemTruckTheme.colors.primary,
                                                                },
                                                            }}
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Globe size={20} color={systemTruckTheme.colors.primary} />
                                                            <Box>
                                                                <Typography variant="body1" sx={{ fontWeight: 600, color: systemTruckTheme.colors.text }}>
                                                                    Permitir Inscrições Online
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                                                    Quando ativado, cidadãos podem se inscrever antecipadamente pelo portal
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    }
                                                />
                                            </Box>
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
                                            <Activity size={24} color={systemTruckTheme.colors.primary} />
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                                Exames Oferecidos
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
                                            Adicionar Exame
                                        </Button>
                                    </Box>

                                    {cursosExamesSelecionados.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Users size={48} color={systemTruckTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                                Nenhum exame adicionado ainda.
                                            </Typography>
                                            <Typography sx={{ color: systemTruckTheme.colors.textLight, fontSize: '0.875rem' }}>
                                                Clique em "Adicionar Exame" para começar.
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
                                                                            label="Exame"
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
                                                                            value={item.vagas || ''}
                                                                            onChange={(e) => handleCursoExameChange(index, 'vagas', e.target.value)}
                                                                            onFocus={() => {
                                                                                if (item.vagas === 0) {
                                                                                    handleCursoExameChange(index, 'vagas', '');
                                                                                }
                                                                            }}
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
                                                value={formData.vagas_disponiveis || ''}
                                                onChange={handleChange}
                                                onFocus={() => {
                                                    if (formData.vagas_disponiveis === 0) {
                                                        setFormData({ ...formData, vagas_disponiveis: '' as any });
                                                    }
                                                }}
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
                                                value={formData.distancia_km || ''}
                                                onChange={(e) => setFormData({ ...formData, distancia_km: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                onFocus={() => {
                                                    if (formData.distancia_km === 0) {
                                                        setFormData({ ...formData, distancia_km: '' as any });
                                                    }
                                                }}
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
                                                value={formData.preco_combustivel_referencia || ''}
                                                onChange={(e) => setFormData({ ...formData, preco_combustivel_referencia: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                onFocus={() => {
                                                    if (formData.preco_combustivel_referencia === 0) {
                                                        setFormData({ ...formData, preco_combustivel_referencia: '' as any });
                                                    }
                                                }}
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

                        {/* Card: Prestação de Contas */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <Box
                                    sx={{
                                        background: systemTruckTheme.colors.cardBackground,
                                        borderRadius: systemTruckTheme.borderRadius.large,
                                        border: `2px solid #5DADE2`,
                                        p: 4,
                                        boxShadow: systemTruckTheme.shadows.card,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4F72' }}>
                                            📋 Prestação de Contas (SUS)
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.82rem', mb: 3 }}>
                                        Preencha os dados contratuais para gerar o relatório de Prestação de Contas corretamente.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Meta Mensal de Atendimentos"
                                                name="meta_mensal_total"
                                                value={formData.meta_mensal_total}
                                                onChange={handleChange}
                                                placeholder="Ex: 200"
                                                helperText="Número contratual de atendimentos/mês"
                                                inputProps={{ min: 0 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                        borderColor: '#5DADE2',
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Número do Processo"
                                                name="numero_processo"
                                                value={formData.numero_processo}
                                                onChange={handleChange}
                                                placeholder="Ex: AGS05.002888/2025-81"
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
                                                label="CNES da Unidade Móvel"
                                                name="numero_cnes"
                                                value={formData.numero_cnes}
                                                onChange={handleChange}
                                                placeholder="Ex: 0000000"
                                                inputProps={{ maxLength: 20 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Lote / Região"
                                                name="lote_regiao"
                                                value={formData.lote_regiao}
                                                onChange={handleChange}
                                                placeholder="Ex: Lote 01 – Região Norte"
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
