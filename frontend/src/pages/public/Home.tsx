import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const Home: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [noticias, setNoticias] = useState<any[]>([]);
    const [acoes, setAcoes] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [noticiasRes, acoesRes] = await Promise.all([
                api.get('/noticias?destaque=true'),
                api.get('/acoes'),
            ]);

            setNoticias(noticiasRes.data.slice(0, 3));
            setAcoes(acoesRes.data.slice(0, 6));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const getAcaoTitle = (acao: any): string => {
        // Se tem descrição preenchida, usa ela
        if (acao.descricao && acao.descricao.trim()) {
            return acao.descricao;
        }

        // Se tem cursos/exames vinculados, mostra o nome deles
        if (acao.cursos_exames && acao.cursos_exames.length > 0) {
            const nomes = acao.cursos_exames
                .map((ce: any) => ce.curso_exame?.nome)
                .filter((nome: string) => nome);

            if (nomes.length > 0) {
                // Se tem vários, mostra o primeiro + contador
                if (nomes.length > 1) {
                    return `${nomes[0]} (+${nomes.length - 1})`;
                }
                return nomes[0];
            }
        }

        // Fallback: mostra a data
        return `Ação de ${new Date(acao.data).toLocaleDateString('pt-BR')}`;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 6,
                    mb: 4,
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                        System Truck
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Sistema de Gestão
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {!isAuthenticated && (
                            <>
                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                >
                                    Login Administrativo
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/cidadao/login"
                                    variant="outlined"
                                    sx={{
                                        color: 'white',
                                        borderColor: 'white',
                                        '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                        },
                                    }}
                                    size="large"
                                >
                                    Portal do Cidadão
                                </Button>
                            </>
                        )}
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ pb: 6 }}>
                {/* Notícias em Destaque */}
                {noticias.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                            Notícias em Destaque
                        </Typography>
                        <Grid container spacing={3}>
                            {noticias.map((noticia) => (
                                <Grid item xs={12} md={4} key={noticia.id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                {noticia.titulo}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                {noticia.conteudo.substring(0, 150)}...
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <Button size="small" component={RouterLink} to={`/noticias/${noticia.id}`}>
                                                Ler mais
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Próximas Ações */}
                {acoes.length > 0 && (
                    <Box>
                        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                            Próximas Ações de Saúde
                        </Typography>
                        <Grid container spacing={3}>
                            {acoes.map((acao) => (
                                <Grid item xs={12} sm={6} md={4} key={acao.id}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {getAcaoTitle(acao)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">
                                                    {new Date(acao.data).toLocaleDateString('pt-BR')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">{acao.local}</Typography>
                                            </Box>
                                            {acao.instituicao && (
                                                <Chip
                                                    label={acao.instituicao.razao_social}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default Home;
