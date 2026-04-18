import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    CardMedia,
    Grid,
    Chip,
    Button,
    Paper,
    Dialog,
    DialogContent,
    DialogActions,
    Fab
} from '@mui/material';
import {
    Favorite,
    HealthAndSafety,
    Groups,
    LocalHospital,
    Lightbulb,
    EmojiEvents,
    CalendarToday,
    ArrowForward,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { getSocket } from '../../utils/socket';
import api, { BASE_URL } from '../../services/api';

interface NoticiaAPI {
    id: string;
    titulo: string;
    conteudo: string;
    imagem_url?: string;
    destaque: boolean;
    data_publicacao: string;
    campos_customizados?: {
        resumo?: string;
        categoria?: string;
    };
}

const Portal: React.FC = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const { enqueueSnackbar } = useSnackbar();

    const [noticias, setNoticias] = useState<NoticiaAPI[]>([]);
    const [youtubeVideo, setYoutubeVideo] = useState<{ id: string; title: string } | null>(null);

    const [inscricoesAtivas, setInscricoesAtivas] = useState<any[]>([]);
    const [inscricaoSelecionada, setInscricaoSelecionada] = useState<any | null>(null);
    const [sosModalOpen, setSosModalOpen] = useState(false);
    const [enviandoSos, setEnviandoSos] = useState(false);
    const [emergenciaEnviadaId, setEmergenciaEnviadaId] = useState<string | null>(null);

    useEffect(() => {
        api.get('/noticias?limit=3')
            .then(res => setNoticias(Array.isArray(res.data) ? res.data.slice(0, 3) : []))
            .catch(() => { });

        api.get('/configuracoes/sistema')
            .then(res => {
                const id = res.data?.youtube_video_id;
                const title = res.data?.youtube_video_titulo || 'Conheça Nossas Ações de Saúde';
                if (id) setYoutubeVideo({ id, title });
            })
            .catch(() => { });

        api.get('/inscricoes/me')
            .then(res => {
                if (res.data && res.data.length > 0) {
                    const ativas = res.data.filter((i: any) => i.status === 'pendente' || i.status === 'em_andamento');
                    
                    if (ativas.length > 0) {
                        setInscricoesAtivas(ativas);
                        setInscricaoSelecionada(ativas[0]);
                    } else {
                        setInscricoesAtivas([res.data[0]]);
                        setInscricaoSelecionada(res.data[0]);
                    }
                }
            })
            .catch(() => { });
    }, []);

    const handleTriggerEmergency = () => {
        if (!user?.id || !inscricaoSelecionada || emergenciaEnviadaId) return;

        setEnviandoSos(true);
        const socket = getSocket();
        socket.emit('emergencia', {
            acao_id: inscricaoSelecionada.acao.id,
            cidadao_id: user.id,
            nome: user.nome || user.nome_completo || 'Cidadão',
        });
        
        setTimeout(() => {
            setEnviandoSos(false);
            setSosModalOpen(false);
            setEmergenciaEnviadaId(inscricaoSelecionada.id);
            enqueueSnackbar('🚨 SINAL DE EMERGÊNCIA ENVIADO! Fique calmo, a equipe médica foi notificada.', {
                variant: 'error',
                autoHideDuration: 10000,
            });
            setTimeout(() => setEmergenciaEnviadaId(null), 60000);
        }, 800);
    };

    const getImgSrc = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    return (
        <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 6 }}>
            {/* Hero Section - Boas-vindas */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                    color: 'white',
                    py: 8,
                    px: 3,
                    borderRadius: '0 0 50px 50px',
                    mb: 6,
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            mb: 2,
                            textAlign: 'center',
                        }}
                    >
                        Bem-vindo ao Portal do Cidadão
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            textAlign: 'center',
                            opacity: 0.95,
                            maxWidth: 800,
                            mx: 'auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Levando saúde e cuidado até onde você está. Acesso, prevenção e qualidade de vida em cada lugar que chegamos.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* Seção: Nossa Missão */}
                <Box sx={{ mb: 8 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            mb: 4,
                            textAlign: 'center',
                            color: '#2d3748',
                        }}
                    >
                        Nossa Missão
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                                    color: 'white',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <HealthAndSafety sx={{ fontSize: 40, mr: 2 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        Propósito
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                                    Levar saúde e cuidado até onde eles são mais necessários, promovendo acesso,
                                    prevenção e qualidade de vida em cada lugar que chegamos.
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    borderRadius: 3,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Groups sx={{ fontSize: 40, mr: 2 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        Visão
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                                    Ser referência nacional em soluções móveis de saúde, reconhecida pela eficiência,
                                    inovação e compromisso com a promoção da saúde preventiva e inclusiva.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Seção: Nossos Valores */}
                <Box sx={{ mb: 8 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            mb: 4,
                            textAlign: 'center',
                            color: '#2d3748',
                        }}
                    >
                        Nossos Valores
                    </Typography>

                    <Grid container spacing={3}>
                        {[
                            {
                                icon: <Favorite />,
                                title: 'Acolhimento',
                                description: 'Tratar cada pessoa com empatia, respeito e atenção genuína.',
                                color: '#e91e63',
                            },
                            {
                                icon: <EmojiEvents />,
                                title: 'Comprometimento',
                                description: 'Atuar com responsabilidade e dedicação em cada atendimento.',
                                color: '#ff9800',
                            },
                            {
                                icon: <LocalHospital />,
                                title: 'Prevenção',
                                description: 'Incentivar hábitos saudáveis e o diagnóstico precoce.',
                                color: '#4caf50',
                            },
                            {
                                icon: <Lightbulb />,
                                title: 'Inovação',
                                description: 'Buscar constantemente novas formas de cuidar e conectar pessoas à saúde.',
                                color: '#2196f3',
                            },
                            {
                                icon: <HealthAndSafety />,
                                title: 'Ética',
                                description: 'Conduzir todas as ações com integridade, transparência e respeito à vida.',
                                color: '#9c27b0',
                            },
                            {
                                icon: <EmojiEvents />,
                                title: 'Excelência',
                                description: 'Garantir qualidade em cada processo, buscando sempre superar expectativas.',
                                color: '#ff5722',
                            },
                        ].map((value, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        border: '2px solid',
                                        borderColor: value.color,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: `0 12px 24px ${value.color}40`,
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 2,
                                                bgcolor: `${value.color}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 2,
                                                color: value.color,
                                            }}
                                        >
                                            {React.cloneElement(value.icon, { sx: { fontSize: 32 } })}
                                        </Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1,
                                                color: '#2d3748',
                                            }}
                                        >
                                            {value.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {value.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Seção: Vídeos */}
                {youtubeVideo && (
                    <Box sx={{ mb: 8 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mb: 4,
                                textAlign: 'center',
                                color: '#2d3748',
                            }}
                        >
                            Conheça Nosso Trabalho
                        </Typography>

                        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        paddingTop: '56.25%', // 16:9 aspect ratio
                                        bgcolor: '#000',
                                    }}
                                >
                                    <iframe
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                        }}
                                        src={`https://www.youtube.com/embed/${youtubeVideo.id}`}
                                        title={youtubeVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </Box>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                                        {youtubeVideo.title}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                )}

                {/* Seção: Notícias */}
                {noticias.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mb: 4,
                                textAlign: 'center',
                                color: '#2d3748',
                            }}
                        >
                            Últimas Notícias
                        </Typography>

                        <Grid container spacing={4}>
                            {noticias.map((n) => (
                                <Grid item xs={12} md={4} key={n.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            borderRadius: 3,
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                                                borderColor: '#5DADE2',
                                            },
                                        }}
                                    >
                                        {/* Imagem */}
                                        {getImgSrc(n.imagem_url) ? (
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={getImgSrc(n.imagem_url)}
                                                alt={n.titulo}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Box sx={{
                                                height: 200,
                                                bgcolor: 'linear-gradient(135deg, #E8F4F8, #D0E8F5)',
                                                background: 'linear-gradient(135deg, #E8F4F8 0%, #D0E8F5 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#5DADE2',
                                                opacity: 0.4,
                                            }}>
                                                <LocalHospital sx={{ fontSize: 48 }} />
                                            </Box>
                                        )}

                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={n.campos_customizados?.categoria || 'Geral'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#5DADE220',
                                                        color: '#1B4F72',
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#718096' }}>
                                                    <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                                                    <Typography variant="caption">
                                                        {new Date(n.data_publicacao).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography
                                                variant="h6"
                                                sx={{ fontWeight: 600, mb: 1, color: '#2d3748', fontSize: '1rem' }}
                                            >
                                                {n.titulo}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2, flex: 1,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                } as any}
                                            >
                                                {n.campos_customizados?.resumo || n.conteudo}
                                            </Typography>
                                            <Button
                                                component={RouterLink}
                                                to={`/noticias/${n.id}`}
                                                endIcon={<ArrowForward />}
                                                sx={{
                                                    color: '#5DADE2',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    alignSelf: 'flex-start',
                                                    p: 0,
                                                }}
                                            >
                                                Ler mais
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Container>

            {/* BOTAO SOS FLOAT */}
            {inscricaoSelecionada && !emergenciaEnviadaId && (
                <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 9999 }}>
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                        <Fab 
                            aria-label="Emergência SOS"
                            onClick={() => setSosModalOpen(true)}
                            sx={{ 
                                width: 85, height: 85, 
                                background: 'radial-gradient(circle, #ff4b2b 0%, #dc2626 100%)',
                                color: '#fff',
                                boxShadow: '0 0 25px rgba(220, 38, 38, 0.7)',
                                '&:hover': { background: '#b91c1c' }
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0.5 }}>
                                <AlertTriangle size={32} color="#fff" />
                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', mt: 0.3, letterSpacing: '0.5px' }}>SOS</Typography>
                            </Box>
                        </Fab>
                    </motion.div>
                </Box>
            )}

            {/* Modal de Confirmação do SOS */}
            {inscricaoSelecionada && (
                <Dialog 
                    open={sosModalOpen} 
                    onClose={() => !enviandoSos && setSosModalOpen(false)}
                    PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } }}
                >
                    <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                        <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                            <Box sx={{ width: 80, height: 80, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                                <AlertTriangle size={44} color="#dc2626" />
                            </Box>
                        </motion.div>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626', mb: 2 }}>
                            Emergência Médica
                        </Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.95rem', mb: 3, px: 1 }}>
                            Você está solicitando <strong>assistência imediata</strong>. A equipe da ação estruturada será alertada.
                        </Typography>
                        
                        {inscricoesAtivas.length > 1 ? (
                            <Box sx={{ mb: 3, textAlign: 'left' }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, mb: 1, textTransform: 'uppercase' }}>
                                    Em qual local você precisa de ajuda?
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {inscricoesAtivas.map((insc: any) => (
                                        <Box 
                                            key={insc.id}
                                            onClick={() => setInscricaoSelecionada(insc)}
                                            sx={{ 
                                                p: 1.5, borderRadius: '10px', 
                                                border: inscricaoSelecionada.id === insc.id ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                                background: inscricaoSelecionada.id === insc.id ? '#fef2f2' : '#fff',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 1.5
                                            }}
                                        >
                                            <MapPin size={20} color={inscricaoSelecionada.id === insc.id ? '#dc2626' : '#64748b'} />
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: inscricaoSelecionada.id === insc.id ? 700 : 500, color: '#334155' }}>
                                                {insc.acao?.nome || 'Unidade'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ background: '#f8fafc', p: 2, borderRadius: '12px', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, border: '1px solid #e2e8f0' }}>
                                <MapPin size={18} color="#64748b" />
                                <Box>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Unidade / Ação Vinculada</Typography>
                                    <Typography sx={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
                                        {inscricaoSelecionada.acao?.nome || 'Posto Médico Base'}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Use este botão APENAS em casos de necessidade médica urgente.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 3, gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            color="inherit" 
                            onClick={() => setSosModalOpen(false)}
                            disabled={enviandoSos}
                            sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={handleTriggerEmergency}
                            disabled={enviandoSos}
                            sx={{ borderRadius: '12px', px: 3, fontWeight: 800, background: '#dc2626', boxShadow: '0 8px 20px rgba(220, 38, 38, 0.4)' }}
                        >
                            {enviandoSos ? 'Enviando Alerta...' : 'CONFIRMAR EMERGÊNCIA'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

        </Box>
    );
};

export default Portal;
