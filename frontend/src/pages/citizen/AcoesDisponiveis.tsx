import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Box,
    Button,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Filter, Search, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Acao {
    id: string;
    nome: string;
    tipo: string;
    municipio: string;
    estado: string;
    data_inicio: string;
    data_fim: string;
    local_execucao: string;
    descricao: string;
    vagas_disponiveis: number;
    cursos_exames: AcaoCursoExame[];
}

interface AcaoCursoExame {
    id: string;
    vagas: number;
    curso_exame: {
        id: string;
        nome: string;
        tipo: 'curso' | 'exame';
        descricao?: string;
    };
}

const AcoesDisponiveis: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [acoes, setAcoes] = useState<Acao[]>([]);
    const [acoesFiltered, setAcoesFiltered] = useState<Acao[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroMunicipio, setFiltroMunicipio] = useState('');

    // Dialog de inscrição
    const [openInscricao, setOpenInscricao] = useState(false);
    const [acaoSelecionada, setAcaoSelecionada] = useState<Acao | null>(null);
    const [cursoSelecionado, setCursoSelecionado] = useState('');
    const [inscrevendo, setInscrevendo] = useState(false);

    useEffect(() => {
        loadAcoes();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [filtroTipo, filtroMunicipio, acoes]);

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

    const loadAcoes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/acoes');
            setAcoes(response.data);
        } catch (error) {
            console.error('Erro ao carregar ações:', error);
            enqueueSnackbar('Erro ao carregar ações', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let filtered = [...acoes];

        if (filtroTipo !== 'todos') {
            filtered = filtered.filter(a => a.tipo.toLowerCase() === filtroTipo);
        }

        if (filtroMunicipio) {
            filtered = filtered.filter(a =>
                a.municipio.toLowerCase().includes(filtroMunicipio.toLowerCase())
            );
        }

        setAcoesFiltered(filtered);
    };

    const getAcaoTitle = (acao: Acao): string => {
        if (acao.descricao && acao.descricao.trim()) {
            return acao.descricao;
        }

        if (acao.cursos_exames && acao.cursos_exames.length > 0) {
            const nomes = acao.cursos_exames
                .map((ce) => ce.curso_exame?.nome)
                .filter((nome) => nome);

            if (nomes.length > 0) {
                if (nomes.length > 1) {
                    return `${nomes[0]} (+${nomes.length - 1})`;
                }
                return nomes[0];
            }
        }

        return `Ação de Saúde - ${acao.municipio}/${acao.estado}`;
    };

    const handleAbrirInscricao = (acao: Acao) => {
        setAcaoSelecionada(acao);
        setCursoSelecionado('');
        setOpenInscricao(true);
    };

    const handleInscrever = async () => {
        if (!cursoSelecionado || !acaoSelecionada) {
            enqueueSnackbar('Selecione um curso/exame', { variant: 'warning' });
            return;
        }

        try {
            setInscrevendo(true);
            await api.post('/inscricoes', {
                acao_id: acaoSelecionada.id,
                curso_exame_id: cursoSelecionado,
            });
            enqueueSnackbar('Inscrição realizada com sucesso!', { variant: 'success' });
            setOpenInscricao(false);
            loadAcoes();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao realizar inscrição',
                { variant: 'error' }
            );
        } finally {
            setInscrevendo(false);
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
                            <Calendar size={32} color="white" />
                            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                                Ações Próximas
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Confira as ações de saúde disponíveis e inscreva-se
                        </Typography>
                    </Box>
                </motion.div>

                {/* Filtros */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <Card
                        sx={{
                            mb: 3,
                            borderRadius: systemTruckTheme.borderRadius.medium,
                            boxShadow: systemTruckTheme.shadows.card,
                            background: systemTruckTheme.colors.cardBackground,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Filter size={20} color={systemTruckTheme.colors.primary} />
                                <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text }}>
                                    Filtros
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Tipo de Ação"
                                        value={filtroTipo}
                                        onChange={(e) => setFiltroTipo(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&:hover fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="todos">Todos</MenuItem>
                                        <MenuItem value="saude">Saúde</MenuItem>
                                        <MenuItem value="educacao">Educação</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Município"
                                        value={filtroMunicipio}
                                        onChange={(e) => setFiltroMunicipio(e.target.value)}
                                        InputProps={{
                                            startAdornment: <Search size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.primary }} />,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&:hover fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                            },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Lista de Ações */}
                {acoesFiltered.length === 0 ? (
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
                            <Calendar size={64} color={systemTruckTheme.colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Nenhuma ação encontrada
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ajuste os filtros ou aguarde novas ações
                            </Typography>
                        </Card>
                    </motion.div>
                ) : (
                    <Grid container spacing={3}>
                        {acoesFiltered.map((acao, index) => (
                            <Grid item xs={12} md={6} key={acao.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                                >
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                            boxShadow: systemTruckTheme.shadows.card,
                                            background: systemTruckTheme.colors.cardBackground,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: systemTruckTheme.shadows.hover,
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            {/* Badge de Status */}
                                            <Box sx={{ mb: 2 }}>
                                                <Chip
                                                    label="Saúde"
                                                    size="small"
                                                    sx={{
                                                        background: systemTruckTheme.gradients.success,
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        borderRadius: systemTruckTheme.borderRadius.small,
                                                    }}
                                                />
                                            </Box>

                                            {/* Título */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    color: systemTruckTheme.colors.text,
                                                    fontWeight: 700,
                                                    mb: 2,
                                                }}
                                            >
                                                {getAcaoTitle(acao)}
                                            </Typography>

                                            {/* Informações */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MapPin size={18} color={systemTruckTheme.colors.primary} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {acao.local_execucao}, {acao.municipio} - {acao.estado}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Clock size={18} color={systemTruckTheme.colors.primary} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDate(acao.data_inicio)} a {formatDate(acao.data_fim)}
                                                    </Typography>
                                                </Box>
                                                {acao.vagas_disponiveis > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Users size={18} color={systemTruckTheme.colors.success} />
                                                        <Typography variant="body2" sx={{ color: systemTruckTheme.colors.success, fontWeight: 600 }}>
                                                            {acao.vagas_disponiveis} vagas disponíveis
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Botão de Inscrição */}
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => handleAbrirInscricao(acao)}
                                                disabled={acao.vagas_disponiveis === 0}
                                                sx={{
                                                    mt: 2,
                                                    background: systemTruckTheme.gradients.primary,
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    py: 1.5,
                                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                                    textTransform: 'none',
                                                    fontSize: '1rem',
                                                    '&:hover': {
                                                        background: systemTruckTheme.gradients.primaryHover,
                                                        transform: 'scale(1.02)',
                                                    },
                                                    '&:disabled': {
                                                        background: '#ccc',
                                                        color: '#666',
                                                    },
                                                }}
                                            >
                                                {acao.vagas_disponiveis === 0 ? 'Sem vagas' : 'Inscrever-se'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Dialog de Inscrição */}
                <Dialog
                    open={openInscricao}
                    onClose={() => setOpenInscricao(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: systemTruckTheme.borderRadius.medium,
                            background: systemTruckTheme.colors.cardBackground,
                        },
                    }}
                >
                    <DialogTitle sx={{ background: systemTruckTheme.gradients.primary, color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Realizar Inscrição
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {acaoSelecionada && (
                            <>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Você está se inscrevendo para: <strong>{getAcaoTitle(acaoSelecionada)}</strong>
                                </Alert>
                                <TextField
                                    select
                                    fullWidth
                                    label="Selecione o Curso/Exame"
                                    value={cursoSelecionado}
                                    onChange={(e) => setCursoSelecionado(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: systemTruckTheme.colors.primary,
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: systemTruckTheme.colors.primary,
                                            },
                                        },
                                    }}
                                >
                                    {acaoSelecionada.cursos_exames?.map((ce) => (
                                        <MenuItem key={ce.id} value={ce.curso_exame.id}>
                                            {ce.curso_exame.nome} ({ce.vagas} vagas)
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            onClick={() => setOpenInscricao(false)}
                            sx={{
                                color: systemTruckTheme.colors.textSecondary,
                                textTransform: 'none',
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleInscrever}
                            disabled={inscrevendo || !cursoSelecionado}
                            sx={{
                                background: systemTruckTheme.gradients.primary,
                                color: 'white',
                                fontWeight: 600,
                                px: 3,
                                textTransform: 'none',
                                '&:hover': {
                                    background: systemTruckTheme.gradients.primaryHover,
                                },
                            }}
                        >
                            {inscrevendo ? 'Inscrevendo...' : 'Confirmar Inscrição'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default AcoesDisponiveis;
