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
    CardActions,
} from '@mui/material';
import { CalendarToday, LocationOn } from '@mui/icons-material';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

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
            // Buscar todas as ações (sem filtro de status)
            const response = await api.get('/acoes');
            console.log('Ações carregadas:', response.data);
            console.log('Total de ações:', response.data.length);
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

        console.log('Ações filtradas:', filtered.length);
        setAcoesFiltered(filtered);
    };

    const getAcaoTitle = (acao: Acao): string => {
        // Se tem descrição preenchida, usa ela
        if (acao.descricao && acao.descricao.trim()) {
            return acao.descricao;
        }

        // Se tem cursos/exames vinculados, mostra o nome deles
        if (acao.cursos_exames && acao.cursos_exames.length > 0) {
            const nomes = acao.cursos_exames
                .map((ce) => ce.curso_exame?.nome)
                .filter((nome) => nome);

            if (nomes.length > 0) {
                // Se tem vários, mostra o primeiro + contador
                if (nomes.length > 1) {
                    return `${nomes[0]} (+${nomes.length - 1})`;
                }
                return nomes[0];
            }
        }

        // Fallback genérico
        return `Ação de Saúde - ${acao.municipio}/${acao.estado}`;
    };

    const handleAbrirInscricao = (acao: Acao) => {
        setAcaoSelecionada(acao);
        setCursoSelecionado('');
        setOpenInscricao(true);
    };

    const handleInscrever = async () => {
        if (!cursoSelecionado || !acaoSelecionada) {
            enqueueSnackbar('Selecione um exame', { variant: 'warning' });
            return;
        }

        try {
            setInscrevendo(true);
            await api.post('/inscricoes', {
                acao_curso_id: cursoSelecionado,
            });

            enqueueSnackbar('Inscrição realizada com sucesso!', { variant: 'success' });
            setOpenInscricao(false);
            setCursoSelecionado('');
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
            <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Ações Próximas
            </Typography>

            {/* Filtros */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Tipo de Ação"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="saude">Saúde</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Município"
                                value={filtroMunicipio}
                                onChange={(e) => setFiltroMunicipio(e.target.value)}
                                placeholder="Digite o município..."
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Lista de Ações */}
            <Grid container spacing={3}>
                {acoesFiltered.length === 0 ? (
                    <Grid item xs={12}>
                        <Alert severity="info">
                            Nenhuma ação disponível no momento.
                        </Alert>
                    </Grid>
                ) : (
                    acoesFiltered.map((acao) => (
                        <Grid item xs={12} md={4} key={acao.id}>
                            <Card>
                                <CardContent>
                                    <Chip
                                        label="Saúde"
                                        color="success"
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="h6" gutterBottom>
                                        {getAcaoTitle(acao)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {acao.municipio} - {acao.estado}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(acao.data_inicio)} a {formatDate(acao.data_fim)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        color="primary"
                                        onClick={() => handleAbrirInscricao(acao)}
                                    >
                                        Inscrever-se
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Dialog: Inscrição */}
            <Dialog
                open={openInscricao}
                onClose={() => setOpenInscricao(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Realizar Inscrição</DialogTitle>
                <DialogContent>
                    {acaoSelecionada && (
                        <>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Ação: {acaoSelecionada.tipo.toUpperCase()} - {acaoSelecionada.municipio}/{acaoSelecionada.estado}
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                required
                                label="Selecione o Exame"
                                value={cursoSelecionado}
                                onChange={(e) => setCursoSelecionado(e.target.value)}
                                sx={{ mt: 2 }}
                            >
                                {acaoSelecionada.cursos_exames?.map((ce) => (
                                    <MenuItem key={ce.id} value={ce.id}>
                                        {ce.curso_exame.nome} ({ce.vagas} vagas)
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                Após confirmar, você receberá uma confirmação da sua inscrição.
                            </Alert>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInscricao(false)} disabled={inscrevendo}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleInscrever}
                        disabled={!cursoSelecionado || inscrevendo}
                    >
                        {inscrevendo ? <CircularProgress size={24} /> : 'Confirmar Inscrição'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AcoesDisponiveis;
