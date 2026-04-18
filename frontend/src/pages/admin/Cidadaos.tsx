import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCPF, formatPhone, formatCNS, formatCEP, validateCPF, toTitleCase } from '../../utils/formatters';
import { buscarCEP } from '../../utils/cep';
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
    Autocomplete,
    FormControlLabel,
    Checkbox,
    ListItemText,
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
    Paperclip,
    Trash2,
    ExternalLink,
    FileText,
    Send,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import api, { BASE_URL } from '../../services/api';
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

const EMAIL_DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com.br', '@icloud.com'];

const Cidadaos: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
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
    const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

    // ─── Enviar Resultado de Exame ──────────────────────────────────────────────
    const [envioResultadoOpen, setEnvioResultadoOpen] = useState(false);
    const [envioResultadoCidadao, setEnvioResultadoCidadao] = useState<Cidadao | null>(null);
    const [arquivoResultado, setArquivoResultado] = useState<File | null>(null);
    const [descricaoResultado, setDescricaoResultado] = useState('');
    const [enviandoResultado, setEnviandoResultado] = useState(false);

    // ─── Prontuário Médico ──────────────────────────────────────────────────────
    const [historicoMedico, setHistoricoMedico] = useState<any[]>([]);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [prontuarioModalOpen, setProntuarioModalOpen] = useState<any | null>(null);

    useEffect(() => {
        if (detailsOpen && selectedCidadao) {
            setLoadingHistorico(true);
            api.get(`/medico-monitoring/cidadao/${selectedCidadao.id}/historico`)
                .then(r => setHistoricoMedico(r.data.historico || []))
                .catch(() => setHistoricoMedico([]))
                .finally(() => setLoadingHistorico(false));
        } else {
            setHistoricoMedico([]);
        }
    }, [detailsOpen, selectedCidadao]);

    const [laudosOpen, setLaudosOpen] = useState(false);
    const [laudosCidadao, setLaudosCidadao] = useState<Cidadao | null>(null);
    const [laudos, setLaudos] = useState<any[]>([]);
    const [loadingLaudos, setLoadingLaudos] = useState(false);
    const [uploadingLaudo, setUploadingLaudo] = useState(false);
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
        cartao_sus: '',
        sem_cartao_sus: false,
    });

    // ─── Cadastro: Duplicidade e Vinculação a Ação ───────────────────────────
    const [cpfExistente, setCpfExistente] = useState(false);
    const [nomeExistente, setNomeExistente] = useState(false);
    const [duplicidadeMotivo, setDuplicidadeMotivo] = useState('');
    const [acoesAtivas, setAcoesAtivas] = useState<any[]>([]);
    const [vincularAcaoId, setVincularAcaoId] = useState<string>('');
    const [vincularExamesIds, setVincularExamesIds] = useState<string[]>([]);
    const [examesDisponiveis, setExamesDisponiveis] = useState<any[]>([]);

    useEffect(() => {
        if (createOpen) {
            api.get('/acoes?status=ativa').then(r => {
                const data = Array.isArray(r.data) ? r.data : (r.data.acoes || r.data.data || []);
                setAcoesAtivas(data);
            }).catch(console.error);
        }
    }, [createOpen]);

    useEffect(() => {
        if (createOpen && vincularAcaoId) {
            api.get(`/acoes/${vincularAcaoId}`).then(r => {
                setExamesDisponiveis(r.data.cursos_exames || []);
            }).catch(() => setExamesDisponiveis([]));
        } else {
            setExamesDisponiveis([]);
            setVincularExamesIds([]); // Reset selection if Acao changes
        }
    }, [vincularAcaoId, createOpen]);

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
            cartao_sus: '',
            sem_cartao_sus: false,
        });
        setCpfExistente(false);
        setNomeExistente(false);
        setDuplicidadeMotivo('');
        setVincularAcaoId('');
        setVincularExamesIds([]);
    };

    const TITLE_CASE_FIELDS = ['nome_completo', 'nome_mae', 'bairro', 'rua', 'municipio', 'complemento'];

    const handleChange = (field: string, value: string) => {
        const formatted = TITLE_CASE_FIELDS.includes(field) ? toTitleCase(value) : value;
        setFormData(prev => ({ ...prev, [field]: formatted }));
    };

    const handleEmailChange = (value: string) => {
        setFormData(prev => ({ ...prev, email: value }));
        if (!value || value.includes('@')) {
            setEmailSuggestions([]);
            return;
        }
        if (value.length > 2) {
            setEmailSuggestions(EMAIL_DOMAINS.map(d => `${value}${d}`));
        }
    };

    const verificarDuplicidade = async (cpf: string, nome: string) => {
        if (!cpf && !nome) return;
        try {
            const { data } = await api.get('/cidadaos/check-duplicidade', { params: { cpf, nome } });
            if (data.duplicado) {
                setCpfExistente(data.motivo.includes('CPF'));
                setNomeExistente(data.motivo.includes('Nome'));
                setDuplicidadeMotivo(`Cidadão já cadastrado com este ${data.motivo}.`);
                enqueueSnackbar(`Atenção: ${data.motivo} já existe no sistema.`, { variant: 'warning' });
            } else {
                setCpfExistente(false);
                setNomeExistente(false);
                setDuplicidadeMotivo('');
            }
        } catch (err) {
            console.error('Erro ao verificar duplicidade', err);
        }
    };

    const handleCEPBlur = async (cep: string) => {
        const endereco = await buscarCEP(cep);
        if (endereco) {
            setFormData(prev => ({
                ...prev,
                rua: endereco.rua,
                bairro: endereco.bairro,
                municipio: endereco.municipio,
                estado: endereco.estado,
                complemento: endereco.complemento || prev.complemento,
            }));
            enqueueSnackbar('Endereço preenchido automaticamente!', { variant: 'success' });
        }
    };

    const handleCPFBlur = async (cpf: string) => {
        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length === 11) verificarDuplicidade(cpfLimpo, formData.nome_completo);
        
        if (cpfLimpo.length !== 11) return;
        try {
            await api.get(`/cidadaos/buscar-cpf/${cpfLimpo}`);
            // Removendo autopreenchimento total para evitar edição acidental ao criar
            enqueueSnackbar('Cidadão já cadastrado! O cadastro não pode ser duplicado.', { variant: 'error' });
        } catch (err: any) {
             // Ignorar erro 404
        }
    };

    const handleSubmit = async () => {
        if (cpfExistente || nomeExistente) {
            enqueueSnackbar(duplicidadeMotivo || 'Corrija os dados duplicados antes de continuar', { variant: 'error' });
            return;
        }

        // Email agora é opcional — apenas nome, CPF e telefone são obrigatórios
        if (!formData.nome_completo || !formData.cpf || !formData.telefone) {
            enqueueSnackbar('Preencha os campos obrigatórios: Nome, CPF e Telefone', { variant: 'warning' });
            return;
        }

        // A8 — Data de nascimento obrigatória
        if (!formData.data_nascimento) {
            enqueueSnackbar('Data de nascimento é obrigatória', { variant: 'warning' });
            return;
        }

        // Cartão SUS obrigatório
        if (!formData.cartao_sus && !formData.sem_cartao_sus) {
            enqueueSnackbar('Informe o Cartão SUS ou marque a opção "Não possuo"', { variant: 'warning' });
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post('/cidadaos', formData);
            
            // Inscrição Opcional se vinculado
            const newCidadaoId = res.data.id || res.data.cidadao?.id;
            if (vincularAcaoId && vincularExamesIds.length > 0 && newCidadaoId) {
                try {
                    await api.post(`/inscricoes/bulk`, {
                        cidadao_id: newCidadaoId,
                        acaoId: vincularAcaoId,
                        acao_curso_ids: vincularExamesIds
                    });
                    enqueueSnackbar(`Cidadão criado e inscrito em ${vincularExamesIds.length} exame(s) com sucesso!`, { variant: 'success' });
                } catch (e: any) {
                    enqueueSnackbar(`Cidadão criado, mas ocorreram falhas em algumas inscrições.`, { variant: 'warning' });
                }
            } else {
                enqueueSnackbar('Cidadão cadastrado com sucesso!', {
                    variant: 'success',
                    autoHideDuration: 8000,
                    action: (
                        <Button
                            size="small"
                            color="inherit"
                            sx={{ fontWeight: 700 }}
                            onClick={() => navigate(`/admin/acoes`)}
                        >
                            Ver Ações Disponíveis →
                        </Button>
                    ),
                });
            }

            handleCloseCreate();
            fetchCidadaos();
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

    // ─── Laudos helpers ────────────────────────────────────────────────────────
    const openLaudos = async (cidadao: Cidadao) => {
        setLaudosCidadao(cidadao);
        setLaudosOpen(true);
        setLoadingLaudos(true);
        try {
            const res = await api.get(`/cidadaos/${cidadao.id}/laudos`);
            setLaudos(Array.isArray(res.data) ? res.data : []);
        } catch { setLaudos([]); }
        finally { setLoadingLaudos(false); }
    };

    const uploadLaudo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !laudosCidadao) return;
        const file = e.target.files[0];
        const form = new FormData();
        form.append('laudo', file);
        setUploadingLaudo(true);
        try {
            const res = await api.post(`/cidadaos/${laudosCidadao.id}/laudos`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setLaudos(prev => [...prev, res.data.laudo]);
            enqueueSnackbar('Laudo enviado com sucesso!', { variant: 'success' });
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao enviar laudo', { variant: 'error' });
        } finally {
            setUploadingLaudo(false);
            e.target.value = '';
        }
    };

    const deleteLaudo = async (filename: string) => {
        if (!laudosCidadao) return;
        try {
            await api.delete(`/cidadaos/${laudosCidadao.id}/laudos/${filename}`);
            setLaudos(prev => prev.filter(l => l.filename !== filename));
            enqueueSnackbar('Laudo removido', { variant: 'success' });
        } catch {
            enqueueSnackbar('Erro ao remover laudo', { variant: 'error' });
        }
    };

    // ─── Enviar Resultado ──────────────────────────────────────────────────────
    const openEnvioResultado = (cidadao: Cidadao) => {
        setEnvioResultadoCidadao(cidadao);
        setArquivoResultado(null);
        setDescricaoResultado('');
        setEnvioResultadoOpen(true);
    };

    const handleEnviarResultado = async () => {
        if (!envioResultadoCidadao || !arquivoResultado) {
            enqueueSnackbar('Selecione um arquivo para enviar', { variant: 'warning' });
            return;
        }
        if (!envioResultadoCidadao.email) {
            enqueueSnackbar('Este cidadão não possui e-mail cadastrado', { variant: 'error' });
            return;
        }
        setEnviandoResultado(true);
        try {
            const form = new FormData();
            form.append('arquivo', arquivoResultado);
            form.append('descricao', descricaoResultado);
            await api.post(`/cidadaos/${envioResultadoCidadao.id}/enviar-resultado`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            enqueueSnackbar(`Resultado enviado para ${envioResultadoCidadao.email}! ✅`, { variant: 'success' });
            setEnvioResultadoOpen(false);
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao enviar resultado', { variant: 'error' });
        } finally {
            setEnviandoResultado(false);
        }
    };

    // Removido early return agressivo que causava perda de focus no TextField.

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{
                        mb: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 },
                    }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
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
                                alignSelf: { xs: 'flex-start', sm: 'auto' },
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
                        {loading && cidadaos.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                                    <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
                                </Box>
                            </Grid>
                        ) : cidadaos.length === 0 ? (
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
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={cidadao.id}>
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
                                                        src={cidadao.foto_perfil ? `${BASE_URL}${cidadao.foto_perfil}` : undefined}
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
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
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
                                                    {/* Laudos clip icon */}
                                                    <IconButton
                                                        onClick={() => openLaudos(cidadao)}
                                                        size="small"
                                                        title="Laudos / Anexos"
                                                        sx={{
                                                            border: `1px solid ${systemTruckTheme.colors.border}`,
                                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                                            color: systemTruckTheme.colors.primary,
                                                            p: 1,
                                                            flexShrink: 0,
                                                            '&:hover': { background: systemTruckTheme.colors.cardHover },
                                                        }}
                                                    >
                                                        <Paperclip size={18} />
                                                    </IconButton>
                                                    {/* Enviar Resultado */}
                                                    <IconButton
                                                        onClick={() => openEnvioResultado(cidadao)}
                                                        size="small"
                                                        title="Enviar Resultado de Exame"
                                                        sx={{
                                                            border: `1px solid ${cidadao.email ? '#0097a7' : systemTruckTheme.colors.border}`,
                                                            borderRadius: systemTruckTheme.borderRadius.medium,
                                                            color: cidadao.email ? '#0097a7' : systemTruckTheme.colors.textLight,
                                                            p: 1,
                                                            flexShrink: 0,
                                                            '&:hover': { background: cidadao.email ? 'rgba(0,151,167,0.08)' : systemTruckTheme.colors.cardHover },
                                                        }}
                                                    >
                                                        <Send size={18} />
                                                    </IconButton>
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

            {/* Prontuário Focus Modal */}
            <Dialog open={!!prontuarioModalOpen} onClose={() => setProntuarioModalOpen(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: systemTruckTheme.borderRadius.large, zIndex: 9999 } }}>
                {prontuarioModalOpen && prontuarioModalOpen.ficha_clinica && (
                    <>
                        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography sx={{ fontWeight: 800, color: systemTruckTheme.colors.primaryDark }}>
                                    🩺 Prontuário Médico: {prontuarioModalOpen.nome_completo}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: systemTruckTheme.colors.textSecondary }}>
                                    {new Date(prontuarioModalOpen.ficha_clinica.hora_inicio).toLocaleDateString()} às {new Date(prontuarioModalOpen.ficha_clinica.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {prontuarioModalOpen.ficha_clinica.duracao_minutos ? ` · ${prontuarioModalOpen.ficha_clinica.duracao_minutos} min` : ''}
                                    {prontuarioModalOpen.ficha_clinica.funcionario?.nome ? ` · Dr(a). ${prontuarioModalOpen.ficha_clinica.funcionario.nome}` : ''}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setProntuarioModalOpen(null)}><X size={20} /></IconButton>
                        </DialogTitle>
                        
                        <DialogContent dividers sx={{ pt: 2 }}>
                            {/* Sinais Vitais */}
                            {(prontuarioModalOpen.ficha_clinica.pressao_arterial || prontuarioModalOpen.ficha_clinica.frequencia_cardiaca || prontuarioModalOpen.ficha_clinica.temperatura || prontuarioModalOpen.ficha_clinica.spo2 || prontuarioModalOpen.ficha_clinica.peso || prontuarioModalOpen.ficha_clinica.altura) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1 }}>
                                        Sinais Vitais
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {prontuarioModalOpen.ficha_clinica.pressao_arterial && <Chip label={`PA (mmHg): ${prontuarioModalOpen.ficha_clinica.pressao_arterial}`} size="small" sx={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                        {prontuarioModalOpen.ficha_clinica.frequencia_cardiaca && <Chip label={`FC (bpm): ${prontuarioModalOpen.ficha_clinica.frequencia_cardiaca}`} size="small" sx={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                        {prontuarioModalOpen.ficha_clinica.temperatura && <Chip label={`Temperatura (°C): ${prontuarioModalOpen.ficha_clinica.temperatura}`} size="small" sx={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                        {prontuarioModalOpen.ficha_clinica.spo2 && <Chip label={`SpO2 (%): ${prontuarioModalOpen.ficha_clinica.spo2}`} size="small" sx={{ background: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                        {prontuarioModalOpen.ficha_clinica.peso && <Chip label={`Peso (kg): ${prontuarioModalOpen.ficha_clinica.peso}`} size="small" sx={{ background: '#f0fdf4', color: '#15803d', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                        {prontuarioModalOpen.ficha_clinica.altura && <Chip label={`Altura (cm): ${prontuarioModalOpen.ficha_clinica.altura}`} size="small" sx={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />}
                                    </Box>
                                </Box>
                            )}

                            {/* Anamnese */}
                            {(prontuarioModalOpen.ficha_clinica.queixa_principal || prontuarioModalOpen.ficha_clinica.historia_doenca || prontuarioModalOpen.ficha_clinica.alergias || prontuarioModalOpen.ficha_clinica.medicamentos_uso || prontuarioModalOpen.ficha_clinica.doencas_cronicas) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1 }}>
                                        Anamnese
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {prontuarioModalOpen.ficha_clinica.queixa_principal && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>Queixa Principal</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{prontuarioModalOpen.ficha_clinica.queixa_principal}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.historia_doenca && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>História da Doença</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{prontuarioModalOpen.ficha_clinica.historia_doenca}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.alergias && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>Alergias</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{prontuarioModalOpen.ficha_clinica.alergias}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.medicamentos_uso && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>Medicamentos em uso</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{prontuarioModalOpen.ficha_clinica.medicamentos_uso}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.doencas_cronicas && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>Doenças crônicas</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{prontuarioModalOpen.ficha_clinica.doencas_cronicas}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Conduta e Diagnóstico */}
                            {(prontuarioModalOpen.ficha_clinica.diagnostico || prontuarioModalOpen.ficha_clinica.cid || prontuarioModalOpen.ficha_clinica.conduta || prontuarioModalOpen.ficha_clinica.prescricao || prontuarioModalOpen.ficha_clinica.retorno || prontuarioModalOpen.ficha_clinica.observacoes_medico) && (
                                <Box sx={{ mb: 2, p: 1.5, borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', mb: 1 }}>
                                        Conduta Médica
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {prontuarioModalOpen.ficha_clinica.diagnostico && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>Diagnóstico</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D', fontWeight: 700 }}>{prontuarioModalOpen.ficha_clinica.diagnostico}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.cid && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>CID</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D' }}>{prontuarioModalOpen.ficha_clinica.cid}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.conduta && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>Conduta</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D' }}>{prontuarioModalOpen.ficha_clinica.conduta}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.prescricao && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>Prescrição</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D', whiteSpace: 'pre-wrap' }}>{prontuarioModalOpen.ficha_clinica.prescricao}</Typography>
                                            </Box>
                                        )}
                                        {prontuarioModalOpen.ficha_clinica.retorno && (
                                            <Box>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>Retorno</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D' }}>{prontuarioModalOpen.ficha_clinica.retorno}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setProntuarioModalOpen(null)} sx={{ textTransform: 'none' }}>Fechar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── Enviar Resultado de Exame Dialog ────────────────────────────── */}
            <Dialog
                open={envioResultadoOpen}
                onClose={() => !enviandoResultado && setEnvioResultadoOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: systemTruckTheme.borderRadius.large,
                        background: systemTruckTheme.colors.cardBackground,
                        overflow: 'hidden',
                    },
                }}
            >
                {/* Header com gradiente */}
                <Box sx={{ background: 'linear-gradient(135deg, #0097a7 0%, #006064 100%)', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ background: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1 }}>
                            <Send size={22} color="white" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                                Enviar Resultado de Exame
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                                {envioResultadoCidadao?.nome_completo}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <DialogContent sx={{ pt: 3 }}>
                    {/* Info e-mail */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 3,
                        borderRadius: systemTruckTheme.borderRadius.medium,
                        background: envioResultadoCidadao?.email ? 'rgba(0,151,167,0.06)' : '#FFF3E0',
                        border: `1px solid ${envioResultadoCidadao?.email ? '#00ACC1' : '#FFB74D'}`,
                    }}>
                        <Mail size={20} color={envioResultadoCidadao?.email ? '#0097a7' : '#FF8F00'} />
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: envioResultadoCidadao?.email ? '#006064' : '#E65100' }}>
                                {envioResultadoCidadao?.email
                                    ? `Será enviado para: ${envioResultadoCidadao.email}`
                                    : 'Cidadão sem e-mail cadastrado'}
                            </Typography>
                            {!envioResultadoCidadao?.email && (
                                <Typography sx={{ fontSize: '0.75rem', color: '#E65100' }}>
                                    Cadastre um e-mail no perfil do cidadão antes de enviar.
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Upload zone */}
                    <Box
                        component="label"
                        htmlFor="resultado-file-input"
                        sx={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: 1.5, p: 4, mb: 2.5,
                            border: `2px dashed ${arquivoResultado ? '#0097a7' : systemTruckTheme.colors.primary}`,
                            borderRadius: systemTruckTheme.borderRadius.large,
                            background: arquivoResultado ? 'rgba(0,151,167,0.07)' : 'rgba(0,188,212,0.04)',
                            cursor: enviandoResultado ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { background: 'rgba(0,151,167,0.1)' },
                        }}
                    >
                        <input
                            id="resultado-file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.dcm,.tiff,.tif,.bmp,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={(e) => setArquivoResultado(e.target.files?.[0] || null)}
                            disabled={enviandoResultado}
                        />
                        {arquivoResultado ? (
                            <>
                                <FileText size={32} color="#0097a7" />
                                <Typography sx={{ fontWeight: 700, color: '#006064', fontSize: '0.92rem', textAlign: 'center' }}>
                                    {arquivoResultado.name}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary }}>
                                    {Math.round(arquivoResultado.size / 1024)} KB · Clique para trocar
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Send size={32} color={systemTruckTheme.colors.primary} />
                                <Typography sx={{ fontWeight: 700, color: systemTruckTheme.colors.primary, fontSize: '0.92rem' }}>
                                    Clique para selecionar o arquivo do exame
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary, textAlign: 'center' }}>
                                    PDF, JPG, PNG, DICOM, TIFF, BMP, DOC, DOCX · máx. 20 MB
                                </Typography>
                            </>
                        )}
                    </Box>

                    {/* Descrição */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Observações (opcional)"
                        placeholder="Ex: Resultado do exame de vista realizado em 07/04/2025..."
                        value={descricaoResultado}
                        onChange={(e) => setDescricaoResultado(e.target.value)}
                        disabled={enviandoResultado}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: systemTruckTheme.borderRadius.medium,
                                '&:hover fieldset': { borderColor: '#0097a7' },
                                '&.Mui-focused fieldset': { borderColor: '#0097a7' },
                            },
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2.5, gap: 1 }}>
                    <Button
                        onClick={() => setEnvioResultadoOpen(false)}
                        disabled={enviandoResultado}
                        sx={{ textTransform: 'none', fontWeight: 600, color: systemTruckTheme.colors.textSecondary }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEnviarResultado}
                        disabled={!arquivoResultado || !envioResultadoCidadao?.email || enviandoResultado}
                        startIcon={enviandoResultado ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Send size={18} />}
                        sx={{
                            background: 'linear-gradient(135deg, #0097a7 0%, #006064 100%)',
                            color: 'white',
                            borderRadius: systemTruckTheme.borderRadius.medium,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            boxShadow: '0 4px 16px rgba(0,151,167,0.35)',
                            '&:hover': { boxShadow: '0 6px 20px rgba(0,151,167,0.5)' },
                            '&.Mui-disabled': { background: '#B0BEC5', color: 'white' },
                        }}
                    >
                        {enviandoResultado ? 'Enviando...' : 'Enviar por E-mail'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Laudos Dialog ──────────────────────────────────────────────── */}
            <Dialog
                open={laudosOpen}

                onClose={() => setLaudosOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: systemTruckTheme.borderRadius.large, background: systemTruckTheme.colors.cardBackground } }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${systemTruckTheme.colors.border}`, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Paperclip size={22} color={systemTruckTheme.colors.primary} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, lineHeight: 1.2 }}>
                                Laudos / Anexos
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: systemTruckTheme.colors.textSecondary }}>
                                {laudosCidadao?.nome_completo}
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    {/* Upload zone */}
                    <Box
                        component="label"
                        htmlFor="laudo-file-input"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            p: 3,
                            mb: 3,
                            border: `2px dashed ${systemTruckTheme.colors.primary}`,
                            borderRadius: systemTruckTheme.borderRadius.large,
                            background: 'rgba(0,188,212,0.04)',
                            cursor: uploadingLaudo ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { background: 'rgba(0,188,212,0.09)' },
                        }}
                    >
                        <input
                            id="laudo-file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={uploadLaudo}
                            disabled={uploadingLaudo}
                        />
                        {uploadingLaudo ? (
                            <CircularProgress size={28} sx={{ color: systemTruckTheme.colors.primary }} />
                        ) : (
                            <Paperclip size={28} color={systemTruckTheme.colors.primary} />
                        )}
                        <Typography sx={{ fontWeight: 600, color: systemTruckTheme.colors.primary, fontSize: '0.9rem' }}>
                            {uploadingLaudo ? 'Enviando...' : 'Clique para adicionar laudo'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary }}>
                            PDF, JPEG ou PNG · máx. 10 MB
                        </Typography>
                    </Box>

                    {/* Lista de laudos */}
                    {loadingLaudos ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={32} sx={{ color: systemTruckTheme.colors.primary }} />
                        </Box>
                    ) : laudos.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: systemTruckTheme.colors.textSecondary }}>
                            <FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <Typography sx={{ fontSize: '0.9rem' }}>Nenhum laudo anexado</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {laudos.map((laudo, i) => {
                                const isPdf = laudo.mimetype === 'application/pdf';
                                const sizeKb = Math.round((laudo.size || 0) / 1024);
                                const date = laudo.uploadedAt ? new Date(laudo.uploadedAt).toLocaleDateString('pt-BR') : '';
                                return (
                                    <Box key={i} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                        border: `1px solid ${systemTruckTheme.colors.border}`,
                                        background: systemTruckTheme.colors.background,
                                    }}>
                                        <Box sx={{ p: 1, borderRadius: 2, background: isPdf ? '#fee2e2' : '#e0f2fe', flexShrink: 0 }}>
                                            <FileText size={20} color={isPdf ? '#dc2626' : '#0284c7'} />
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {laudo.originalname}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: systemTruckTheme.colors.textSecondary }}>
                                                {sizeKb} KB · {date}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                            <IconButton
                                                size="small"
                                                title="Abrir / Baixar"
                                                onClick={() => window.open(`${BASE_URL}${laudo.url}`, '_blank')}
                                                sx={{ color: systemTruckTheme.colors.primary }}
                                            >
                                                <ExternalLink size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                title="Remover laudo"
                                                onClick={() => deleteLaudo(laudo.filename)}
                                                sx={{ color: systemTruckTheme.colors.danger || '#dc2626' }}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                    <Button onClick={() => setLaudosOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

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

                                {/* Histórico Médico */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FileText size={20} />
                                        Histórico Médico / Prontuário
                                    </Typography>

                                    {loadingHistorico ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <CircularProgress size={30} />
                                        </Box>
                                    ) : historicoMedico.length === 0 ? (
                                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontStyle: 'italic' }}>
                                            Nenhum atendimento médico finalizado para este cidadão.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {historicoMedico.map((atend, i) => (
                                                <Box key={i} sx={{ 
                                                    p: 2, 
                                                    borderRadius: systemTruckTheme.borderRadius.medium, 
                                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                                    background: systemTruckTheme.colors.cardHover || '#f8fafc' 
                                                }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography sx={{ fontWeight: 700, color: systemTruckTheme.colors.primary }}>
                                                            {atend.funcionario?.nome || 'Médico não informado'} <Typography component="span" sx={{ fontSize: '0.8rem', color: systemTruckTheme.colors.textSecondary }}>({atend.funcionario?.especialidade || 'Geral'})</Typography>
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.85rem', color: systemTruckTheme.colors.textSecondary }}>
                                                            {new Date(atend.hora_inicio).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{ fontSize: '0.85rem', color: systemTruckTheme.colors.textSecondary, mb: 1 }}>
                                                        <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                                                        {atend.acao?.nome || 'Ação'} ({atend.acao?.municipio || 'Local'})
                                                    </Typography>
                                                    {atend.ficha_clinica && Object.keys(atend.ficha_clinica).length > 0 ? (
                                                        <Box sx={{ mt: 2, background: '#f8fafc', p: 1.5, borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Box>
                                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Prontuário Médico Preenchido</Typography>
                                                                {atend.ficha_clinica.diagnostico && (
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Diagnóstico: {atend.ficha_clinica.diagnostico}</Typography>
                                                                )}
                                                            </Box>
                                                            <Button 
                                                                variant="contained" 
                                                                size="small" 
                                                                onClick={() => setProntuarioModalOpen(atend)}
                                                                sx={{ background: systemTruckTheme.colors.primary, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                                                            >
                                                                Ver Prontuário
                                                            </Button>
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ 
                                                            whiteSpace: 'pre-wrap', 
                                                            fontSize: '0.9rem', 
                                                            color: systemTruckTheme.colors.text,
                                                            background: '#fff',
                                                            p: 1.5,
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            mt: 1
                                                        }}>
                                                            {atend.observacoes || 'Nenhuma observação clínica ou prontuário registrado.'}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
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
                            <Typography component="div" variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
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
                                        onChange={(e) => setEditData({ ...editData, telefone: formatPhone(e.target.value) })}
                                        inputProps={{ maxLength: 15 }}
                                        placeholder="(00) 00000-0000"
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
                                <Grid item xs={12} sm={4}>
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
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Nova Senha (Opcional)"
                                        type="password"
                                        placeholder="Deixe em branco para manter"
                                        value={(editData as any).senha || ''}
                                        onChange={(e) => setEditData({ ...editData, senha: e.target.value } as any)}
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
                                        value={(editData as any).raca || ''}
                                        onChange={(e) => setEditData({ ...editData, raca: e.target.value } as any)}
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
                                        label="Cartão SUS (CNS)"
                                        placeholder="000 0000 0000 0000"
                                        helperText={`${(editData as any).cartao_sus?.replace(/\D/g,'')?.length || 0}/15 dígitos`}
                                        value={(editData as any).cartao_sus || ''}
                                        onChange={(e) => setEditData({ ...editData, cartao_sus: formatCNS(e.target.value) } as any)}
                                        inputProps={{ maxLength: 19 }}
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
                                        label="Município"
                                        value={editData.municipio || ''}
                                        onChange={(e) => setEditData({ ...editData, municipio: e.target.value })}
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
                    <Typography component="div" variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
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
                                helperText="Obrigatório"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nome da Mãe (opcional)"
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
                                onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
                                onBlur={(e) => handleCPFBlur(e.target.value)}
                                placeholder="000.000.000-00"
                                inputProps={{ maxLength: 14 }}
                                error={formData.cpf.replace(/\D/g, '').length === 11 && !validateCPF(formData.cpf)}
                                helperText={
                                    formData.cpf.replace(/\D/g, '').length === 11 && !validateCPF(formData.cpf)
                                        ? '⚠️ CPF inválido — verifique os números'
                                        : formData.cpf.replace(/\D/g, '').length === 11
                                            ? '✅ CPF válido — preenche dados automaticamente ao sair do campo'
                                            : 'Obrigatório · Formato: 000.000.000-00'
                                }
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="date"
                                label="Data de Nascimento *"
                                value={formData.data_nascimento}
                                onChange={(e) => handleChange('data_nascimento', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                helperText="Obrigatório"
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

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required={!formData.sem_cartao_sus}
                                disabled={formData.sem_cartao_sus}
                                label="Cartão SUS — CNS *"
                                placeholder="000 0000 0000 0000"
                                helperText={formData.cartao_sus.replace(/\D/g, '').length > 0 && formData.cartao_sus.replace(/\D/g, '').length < 15 ? `${15 - formData.cartao_sus.replace(/\D/g,'').length} dígitos restantes` : '15 dígitos'}
                                value={formData.cartao_sus}
                                onChange={(e) => handleChange('cartao_sus', formatCNS(e.target.value))}
                                inputProps={{ maxLength: 19 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.sem_cartao_sus}
                                        onChange={(e) => {
                                            handleChange('sem_cartao_sus', e.target.checked as any);
                                            if (e.target.checked) handleChange('cartao_sus', '');
                                        }}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2" color="text.secondary">Não possuo</Typography>}
                                sx={{ mt: 0.5, ml: 0.5 }}
                            />
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
                                onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                inputProps={{ maxLength: 15 }}
                                helperText="Obrigatório"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            />
                        </Grid>

                        {/* #7 — Email com sugestão de domínio + F4 — email opcional */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                freeSolo
                                options={emailSuggestions}
                                value={formData.email}
                                onInputChange={(_, value) => handleEmailChange(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        type="email"
                                        label="E-mail (opcional)"
                                        helperText="Sugestões de domínio aparecem automaticamente"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Endereço */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Endereço
                            </Typography>
                        </Grid>

                        {/* #5 — CEP com preenchimento automático via ViaCEP */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="CEP (opcional)"
                                value={formData.cep}
                                onChange={(e) => handleChange('cep', formatCEP(e.target.value))}
                                onBlur={(e) => handleCEPBlur(e.target.value)}
                                placeholder="00000-000"
                                inputProps={{ maxLength: 9 }}
                                helperText="Preenche endereço automaticamente ao sair do campo"
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

                        {/* Vinculação Direta à Ação */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Inscrição Rápida (Opcional)
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Vincular a uma Ação Ativa"
                                value={vincularAcaoId}
                                onChange={(e) => setVincularAcaoId(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                            >
                                <MenuItem value=""><em>Nenhuma Ação</em></MenuItem>
                                {acoesAtivas.map(acao => (
                                    <MenuItem key={acao.id} value={acao.id}>{acao.nome} ({acao.municipio} - {new Date(acao.data_inicio).toLocaleDateString()})</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Inscrever em Exame(s)"
                                value={vincularExamesIds}
                                onChange={(e) => setVincularExamesIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                disabled={!vincularAcaoId || examesDisponiveis.length === 0}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: systemTruckTheme.borderRadius.medium } }}
                                SelectProps={{
                                    multiple: true,
                                    renderValue: (selected) => {
                                        const selectedIds = selected as string[];
                                        if (selectedIds.length === 0) return <em>Nenhum Exame</em>;
                                        return selectedIds
                                            .map(id => examesDisponiveis.find(e => e.id === id)?.curso_exame?.nome || id)
                                            .join(', ');
                                    }
                                }}
                            >
                                {examesDisponiveis.map(exame => (
                                    <MenuItem key={exame.id} value={exame.id}>
                                        <Checkbox checked={vincularExamesIds.indexOf(exame.id) > -1} />
                                        <ListItemText primary={exame.curso_exame?.nome} />
                                    </MenuItem>
                                ))}
                            </TextField>
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
