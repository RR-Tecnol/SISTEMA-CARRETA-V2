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
    MenuItem,
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
    UserPlus,
    Save,
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
    nome_mae?: string;
    data_nascimento?: string;
    genero?: 'masculino' | 'feminino' | 'outro' | 'nao_declarado';
    raca?: 'branca' | 'preta' | 'parda' | 'amarela' | 'indigena' | 'nao_declarada';
    cartao_sus?: string;
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
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nome_completo: '',
        nome_mae: '',
        cpf: '',
        data_nascimento: '',
        sexo: '',
        raca: '',
        telefone: '',
        email: '',
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        estado: '',
        senha: '',
    });

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

    const handleCreate = () => {
        setCreateOpen(true);
    };

    const handleCloseCreate = () => {
        setCreateOpen(false);
        setFormData({
            nome_completo: '',
            nome_mae: '',
            cpf: '',
            data_nascimento: '',
            sexo: '',
            raca: '',
            telefone: '',
            email: '',
            cep: '',
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            municipio: '',
            estado: '',
            senha: '',
        });
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.nome_completo || !formData.cpf || !formData.email || !formData.telefone) {
            enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
            return;
        }

        try {
            setSubmitting(true);
            await api.post('/cidadaos', formData);
            enqueueSnackbar('Cidadão cadastrado com sucesso!', { variant: 'success' });
            handleCloseCreate();
            fetchCidadaos(); // Recarregar lista
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao cadastrar cidadão', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
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
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 0.5 }}>
                                Gerenciar Cidadãos
                            </Typography>
                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                {total} {total === 1 ? 'cidadão cadastrado' : 'cidadãos cadastrados'}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<UserPlus size={20} />}
                            onClick={handleCreate}
                            sx={{
                                background: systemTruckTheme.gradients.primary,
                                color: 'white',
                                borderRadius: systemTruckTheme.borderRadius.medium,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1.5,
                                boxShadow: systemTruckTheme.shadows.button,
                                '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)',
                                },
                            }}
                        >
                            Novo Cidadão
                        </Button>
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
                                {/* Personal Information */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 2 }}>
                                        Dados Pessoais
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {selectedCidadao.data_nascimento && (
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>Data de Nascimento</Typography>
                                                <Typography>{new Date(selectedCidadao.data_nascimento).toLocaleDateString('pt-BR')}</Typography>
                                            </Box>
                                        )}
                                        {selectedCidadao.genero && (
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>Gênero</Typography>
                                                <Typography>
                                                    {selectedCidadao.genero === 'masculino' ? 'Masculino' :
                                                        selectedCidadao.genero === 'feminino' ? 'Feminino' :
                                                            selectedCidadao.genero === 'outro' ? 'Outro' : 'Não declarado'}
                                                </Typography>
                                            </Box>
                                        )}
                                        {selectedCidadao.nome_mae && (
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>Nome da Mãe</Typography>
                                                <Typography>{selectedCidadao.nome_mae}</Typography>
                                            </Box>
                                        )}
                                        {selectedCidadao.raca && (
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>Raça/Cor</Typography>
                                                <Typography>
                                                    {selectedCidadao.raca === 'branca' ? 'Branca' :
                                                        selectedCidadao.raca === 'preta' ? 'Preta' :
                                                            selectedCidadao.raca === 'parda' ? 'Parda' :
                                                                selectedCidadao.raca === 'amarela' ? 'Amarela' :
                                                                    selectedCidadao.raca === 'indigena' ? 'Indígena' : 'Não declarada'}
                                                </Typography>
                                            </Box>
                                        )}
                                        {selectedCidadao.cartao_sus && (
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>Cartão SUS</Typography>
                                                <Typography>{selectedCidadao.cartao_sus}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>

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
                                        value={editData.nome_completo || ''}
                                        onChange={(e) => setEditData({ ...editData, nome_completo: e.target.value })}
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
                                        value={editData.telefone || ''}
                                        onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
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
                                        value={editData.email || ''}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
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
                                        label="CPF *"
                                        defaultValue={editData.cpf}
                                        disabled
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
                                        label="Data de Nascimento"
                                        type="date"
                                        value={(editData as any).data_nascimento || ''}
                                        onChange={(e) => setEditData({ ...editData, data_nascimento: e.target.value } as any)}
                                        InputLabelProps={{ shrink: true }}
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
                                        select
                                        label="Sexo"
                                        value={(editData as any).genero || ''}
                                        onChange={(e) => setEditData({ ...editData, genero: e.target.value } as any)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                            '& .MuiInputBase-input': {
                                                fontWeight: '600 !important',
                                            },
                                        }}
                                    >
                                        <MenuItem value="masculino">Masculino</MenuItem>
                                        <MenuItem value="feminino">Feminino</MenuItem>
                                        <MenuItem value="outro">Outro</MenuItem>
                                        <MenuItem value="nao_declarado">Não declarado</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Raça/Cor"
                                        value={(editData as any).raca_cor || ''}
                                        onChange={(e) => setEditData({ ...editData, raca_cor: e.target.value } as any)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                            },
                                            '& .MuiInputBase-input': {
                                                fontWeight: '600 !important',
                                            },
                                        }}
                                    >
                                        <MenuItem value="branca">Branca</MenuItem>
                                        <MenuItem value="preta">Preta</MenuItem>
                                        <MenuItem value="parda">Parda</MenuItem>
                                        <MenuItem value="amarela">Amarela</MenuItem>
                                        <MenuItem value="indigena">Indígena</MenuItem>
                                        <MenuItem value="nao_declarado">Não declarado</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Nome da Mãe"
                                        value={(editData as any).nome_mae || ''}
                                        onChange={(e) => setEditData({ ...editData, nome_mae: e.target.value } as any)}
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
                                        label="CEP"
                                        value={editData.cep || ''}
                                        onChange={(e) => setEditData({ ...editData, cep: e.target.value })}
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
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        fullWidth
                                        label="Rua"
                                        value={editData.rua || ''}
                                        onChange={(e) => setEditData({ ...editData, rua: e.target.value })}
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
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Número"
                                        value={editData.numero || ''}
                                        onChange={(e) => setEditData({ ...editData, numero: e.target.value })}
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
                                        label="Complemento"
                                        value={editData.complemento || ''}
                                        onChange={(e) => setEditData({ ...editData, complemento: e.target.value })}
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
                                        label="Bairro"
                                        value={editData.bairro || ''}
                                        onChange={(e) => setEditData({ ...editData, bairro: e.target.value })}
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
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        fullWidth
                                        label="Cidade"
                                        value={(editData as any).cidade || ''}
                                        onChange={(e) => setEditData({ ...editData, cidade: e.target.value } as any)}
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
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Estado"
                                        value={editData.estado || ''}
                                        onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
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
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                            <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={async () => {
                                    try {
                                        setSubmitting(true);
                                        await api.put(`/cidadaos/${editData.id}`, editData);
                                        enqueueSnackbar('Cidadão atualizado com sucesso!', { variant: 'success' });
                                        setEditOpen(false);
                                        fetchCidadaos();
                                    } catch (error: any) {
                                        enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar cidadão', { variant: 'error' });
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                disabled={submitting}
                                sx={{
                                    background: systemTruckTheme.gradients.primary,
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: systemTruckTheme.shadows.button,
                                }}
                            >
                                {submitting ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Create Dialog */}
            <Dialog
                open={createOpen}
                onClose={handleCloseCreate}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: systemTruckTheme.borderRadius.large,
                        background: systemTruckTheme.colors.cardBackground,
                    },
                }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${systemTruckTheme.colors.border}` }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                        Cadastrar Novo Cidadão
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 4 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Dados Pessoais */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1 }}>
                                Dados Pessoais
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome Completo *"
                                value={formData.nome_completo}
                                onChange={(e) => handleChange('nome_completo', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nome da Mãe"
                                value={formData.nome_mae}
                                onChange={(e) => handleChange('nome_mae', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="CPF *"
                                value={formData.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                placeholder="000.000.000-00"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data de Nascimento"
                                value={formData.data_nascimento}
                                onChange={(e) => handleChange('data_nascimento', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Sexo"
                                value={formData.sexo}
                                onChange={(e) => handleChange('sexo', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            >
                                <MenuItem value="M">Masculino</MenuItem>
                                <MenuItem value="F">Feminino</MenuItem>
                                <MenuItem value="O">Outro</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Raça/Cor"
                                value={formData.raca}
                                onChange={(e) => handleChange('raca', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            >
                                <MenuItem value="branca">Branca</MenuItem>
                                <MenuItem value="preta">Preta</MenuItem>
                                <MenuItem value="parda">Parda</MenuItem>
                                <MenuItem value="amarela">Amarela</MenuItem>
                                <MenuItem value="indigena">Indígena</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Contato */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Contato
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Telefone *"
                                value={formData.telefone}
                                onChange={(e) => handleChange('telefone', e.target.value)}
                                placeholder="(00) 00000-0000"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="email"
                                label="E-mail *"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        {/* Endereço */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Endereço
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="CEP"
                                value={formData.cep}
                                onChange={(e) => handleChange('cep', e.target.value)}
                                placeholder="00000-000"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Rua"
                                value={formData.rua}
                                onChange={(e) => handleChange('rua', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Número"
                                value={formData.numero}
                                onChange={(e) => handleChange('numero', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Complemento"
                                value={formData.complemento}
                                onChange={(e) => handleChange('complemento', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Bairro"
                                value={formData.bairro}
                                onChange={(e) => handleChange('bairro', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Município"
                                value={formData.municipio}
                                onChange={(e) => handleChange('municipio', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={2}>
                            <TextField
                                select
                                fullWidth
                                label="UF"
                                value={formData.estado}
                                onChange={(e) => handleChange('estado', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            >
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                                    <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Senha */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Acesso
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Senha"
                                value={formData.senha}
                                onChange={(e) => handleChange('senha', e.target.value)}
                                placeholder="Deixe em branco para gerar automaticamente"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                    <Button onClick={handleCloseCreate} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save size={18} />}
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            background: systemTruckTheme.gradients.primary,
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: systemTruckTheme.shadows.button,
                        }}
                    >
                        {submitting ? 'Salvando...' : 'Salvar Cidadão'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Cidadaos;
