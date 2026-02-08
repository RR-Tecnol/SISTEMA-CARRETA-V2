import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Box,
    TextField,
    CircularProgress,
    IconButton,
    Avatar,
    Chip,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    X,
    UserCheck,
    Phone,
    Mail,
    MapPin,
    Eye,
    Hash,
    Edit,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Cidadao {
    id: number;
    nome_completo: string;
    cpf: string;
    telefone: string;
    email: string;
    municipio: string;
    estado: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    foto_perfil?: string;
}

interface CidadaosResponse {
    cidadaos: Cidadao[];
    total: number;
    page: number;
    totalPages: number;
}

const Cidadaos: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [cidadaos, setCidadaos] = useState<Cidadao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedCidadao, setSelectedCidadao] = useState<Cidadao | null>(null);
    const [selectedSequentialId, setSelectedSequentialId] = useState<number>(0);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState<Cidadao | null>(null);

    useEffect(() => {
        fetchCidadaos();
    }, [page, searchTerm]);

    const fetchCidadaos = async () => {
        try {
            setLoading(true);
            const response = await api.get<CidadaosResponse>('/cidadaos', {
                params: {
                    search: searchTerm,
                    page,
                    limit: 12,
                },
            });
            setCidadaos(response.data.cidadaos);
            setTotal(response.data.total);
            setTotalPages(response.data.totalPages);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar cidadãos', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (cidadao: Cidadao, sequentialId: number) => {
        setSelectedCidadao(cidadao);
        setSelectedSequentialId(sequentialId);
        setDetailsOpen(true);
    };

    const handleEdit = (cidadao: Cidadao) => {
        setEditData(cidadao);
        setEditOpen(true);
    };

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading && cidadaos.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: systemTruckTheme.colors.background }}>
                <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 0.5 }}>
                            Gerenciar Cidadãos
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                            {total} {total === 1 ? 'cidadão cadastrado' : 'cidadãos cadastrados'}
                        </Typography>
                    </Box>
                </motion.div>

                {/* Search Bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box
                        sx={{
                            background: systemTruckTheme.colors.cardBackground,
                            borderRadius: systemTruckTheme.borderRadius.large,
                            border: `1px solid ${systemTruckTheme.colors.border}`,
                            p: 3,
                            mb: 3,
                            boxShadow: systemTruckTheme.shadows.card,
                        }}
                    >
                        <TextField
                            fullWidth
                            placeholder="Pesquisar por nome, CPF ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset to first page on search
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                    '&:hover fieldset': { borderColor: systemTruckTheme.colors.primary },
                                },
                            }}
                            InputProps={{
                                startAdornment: <Search size={20} color={systemTruckTheme.colors.textSecondary} style={{ marginRight: 8 }} />,
                                endAdornment: searchTerm && (
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <X size={18} />
                                    </IconButton>
                                ),
                            }}
                        />
                    </Box>
                </motion.div>

                {/* Cidadãos Grid */}
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {cidadaos.length === 0 ? (
                            <Grid item xs={12}>
                                <Box
                                    sx={{
                                        background: systemTruckTheme.colors.cardBackground,
                                        borderRadius: systemTruckTheme.borderRadius.large,
                                        border: `1px solid ${systemTruckTheme.colors.border}`,
                                        p: 6,
                                        textAlign: 'center',
                                    }}
                                >
                                    <UserCheck size={48} color={systemTruckTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                    <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                        {searchTerm ? 'Nenhum cidadão encontrado.' : 'Nenhum cidadão cadastrado ainda.'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            cidadaos.map((cidadao, index) => {
                                // ID sequencial baseado na página e índice
                                const sequentialId = (page - 1) * 12 + index + 1;

                                return (
                                    <Grid item xs={12} sm={6} md={3} key={cidadao.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                        >
                                            <Box
                                                sx={{
                                                    background: systemTruckTheme.colors.cardBackground,
                                                    borderRadius: systemTruckTheme.borderRadius.large,
                                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                                    p: 2,
                                                    height: '100%',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: systemTruckTheme.shadows.card,
                                                    '&:hover': {
                                                        background: systemTruckTheme.colors.cardHover,
                                                        borderColor: systemTruckTheme.colors.primary,
                                                        boxShadow: systemTruckTheme.shadows.cardHover,
                                                    },
                                                }}
                                            >
                                                {/* Header with Avatar and ID */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                    <Avatar
                                                        src={cidadao.foto_perfil ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${cidadao.foto_perfil}` : undefined}
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            background: systemTruckTheme.gradients.primary,
                                                            fontSize: '1rem',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {!cidadao.foto_perfil && getInitials(cidadao.nome_completo)}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 700, fontSize: '0.9rem' }}>
                                                            {cidadao.nome_completo}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                            <Hash size={14} color={systemTruckTheme.colors.textSecondary} />
                                                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                ID: {sequentialId}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                {/* CPF */}
                                                <Chip
                                                    label={cidadao.cpf}
                                                    size="small"
                                                    sx={{
                                                        mb: 1.5,
                                                        background: systemTruckTheme.colors.cardHover,
                                                        color: systemTruckTheme.colors.text,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />

                                                {/* Contact Info */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Phone size={16} color={systemTruckTheme.colors.primary} />
                                                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.8rem', fontWeight: 700 }}>
                                                            {cidadao.telefone || 'Não informado'}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Mail size={16} color={systemTruckTheme.colors.primary} />
                                                        <Typography
                                                            sx={{
                                                                color: systemTruckTheme.colors.textSecondary,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {cidadao.email}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <MapPin size={16} color={systemTruckTheme.colors.primary} />
                                                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.8rem', fontWeight: 700 }}>
                                                            {cidadao.municipio}/{cidadao.estado}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Actions */}
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        startIcon={<Eye size={18} />}
                                                        onClick={() => handleViewDetails(cidadao, sequentialId)}
                                                        sx={{
                                                            borderColor: systemTruckTheme.colors.border,
                                                            color: systemTruckTheme.colors.text,
                                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            '&:hover': {
                                                                borderColor: systemTruckTheme.colors.primary,
                                                                background: systemTruckTheme.colors.cardHover,
                                                            },
                                                        }}
                                                    >
                                                        Detalhes
                                                    </Button>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<Edit size={18} />}
                                                        onClick={() => handleEdit(cidadao)}
                                                        sx={{
                                                            background: systemTruckTheme.gradients.primary,
                                                            color: 'white',
                                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            boxShadow: systemTruckTheme.shadows.button,
                                                            '&:hover': {
                                                                boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)',
                                                            },
                                                        }}
                                                    >
                                                        Editar
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                );
                            })
                        )}
                    </AnimatePresence>
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, value) => setPage(value)}
                            color="primary"
                            size="large"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                    fontWeight: 600,
                                },
                            }}
                        />
                    </Box>
                )}
            </Container>

            {/* Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: systemTruckTheme.borderRadius.large,
                        background: systemTruckTheme.colors.cardBackground,
                    },
                }}
            >
                {selectedCidadao && (
                    <>
                        <DialogTitle sx={{ borderBottom: `1px solid ${systemTruckTheme.colors.border}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        background: systemTruckTheme.gradients.primary,
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    {getInitials(selectedCidadao.nome_completo)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                        {selectedCidadao.nome_completo}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Hash size={16} color={systemTruckTheme.colors.textSecondary} />
                                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontWeight: 600 }}>
                                            ID: {selectedSequentialId}
                                        </Typography>
                                        <Chip label={selectedCidadao.cpf} size="small" sx={{ ml: 1 }} />
                                    </Box>
                                </Box>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 3 }}>
                            <Grid container spacing={3}>
                                {/* Contact Information */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 2 }}>
                                        Informações de Contato
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Phone size={20} color={systemTruckTheme.colors.primary} />
                                            <Typography>{selectedCidadao.telefone || 'Não informado'}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Mail size={20} color={systemTruckTheme.colors.primary} />
                                            <Typography>{selectedCidadao.email}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Address */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 2 }}>
                                        Endereço
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {selectedCidadao.cep && <Typography>CEP: {selectedCidadao.cep}</Typography>}
                                        {selectedCidadao.rua && (
                                            <Typography>
                                                {selectedCidadao.rua}, {selectedCidadao.numero}
                                                {selectedCidadao.complemento && ` - ${selectedCidadao.complemento}`}
                                            </Typography>
                                        )}
                                        {selectedCidadao.bairro && <Typography>Bairro: {selectedCidadao.bairro}</Typography>}
                                        <Typography>
                                            {selectedCidadao.municipio}/{selectedCidadao.estado}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                            <Button onClick={() => setDetailsOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                Fechar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: systemTruckTheme.borderRadius.large,
                        background: systemTruckTheme.colors.cardBackground,
                    },
                }}
            >
                {editData && (
                    <>
                        <DialogTitle sx={{ borderBottom: `1px solid ${systemTruckTheme.colors.border}` }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                Editar Cidadão
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 5 }}>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nome Completo"
                                        defaultValue={editData.nome_completo}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                            '& .MuiInputBase-input': {
                                                fontWeight: '600 !important',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Telefone"
                                        defaultValue={editData.telefone}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                            '& .MuiInputBase-input': {
                                                fontWeight: '600 !important',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="E-mail"
                                        defaultValue={editData.email}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                            '& .MuiInputBase-input': {
                                                fontWeight: '600 !important',
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: systemTruckTheme.colors.textSecondary, fontStyle: 'italic' }}>
                                        Funcionalidade de edição em desenvolvimento. Em breve você poderá editar todos os dados do cidadão.
                                    </Typography>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                            <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    enqueueSnackbar('Funcionalidade em desenvolvimento', { variant: 'info' });
                                    setEditOpen(false);
                                }}
                                sx={{
                                    background: systemTruckTheme.gradients.primary,
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: systemTruckTheme.shadows.button,
                                }}
                            >
                                Salvar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default Cidadaos;
