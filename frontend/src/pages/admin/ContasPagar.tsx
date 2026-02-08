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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    X,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Edit,
    Trash2,
    FileText,

    Truck,
    Wrench,
    Droplet,
    Fuel,
    MapPin,
} from 'lucide-react';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface ContaPagar {
    id: string;
    tipo_conta: string;
    tipo_espontaneo?: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
    comprovante_url?: string;
    recorrente: boolean;
    observacoes?: string;
    acao_id?: string;
    cidade?: string;
    caminhao_id?: string;
}

const ContasPagar = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [contas, setContas] = useState<ContaPagar[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);
    const [acoes, setAcoes] = useState<Array<{ id: string; nome: string }>>([]);

    // Filtros
    const [filterTipo, setFilterTipo] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCidade, setFilterCidade] = useState('');

    // Form Data
    const [formData, setFormData] = useState<{
        tipo_conta: string;
        tipo_espontaneo: string;
        descricao: string;
        valor: number;
        data_vencimento: string;
        status: 'pendente' | 'paga' | 'vencida' | 'cancelada';
        recorrente: boolean;
        observacoes: string;
        acao_id: string;
        cidade: string;
        caminhao_id: string;
    }>({
        tipo_conta: '',
        tipo_espontaneo: '',
        descricao: '',
        valor: 0,
        data_vencimento: '',
        status: 'pendente',
        recorrente: false,
        observacoes: '',
        acao_id: '',
        cidade: '',
        caminhao_id: '',
    });

    // Tipos de conta com ícones e cores (foco em custos de estrada)
    const tiposConta = [
        // Custos de Estrada (Prioridade)
        { value: 'pneu_furado', label: '🛞 Pneu Furado', color: '#DC3545', icon: AlertCircle, categoria: 'estrada' },
        { value: 'troca_oleo', label: '🛢️ Troca de Óleo', color: '#F97316', icon: Droplet, categoria: 'estrada' },
        { value: 'abastecimento', label: '⛽ Abastecimento', color: '#10B981', icon: Fuel, categoria: 'estrada' },
        { value: 'manutencao_mecanica', label: '🔧 Manutenção Mecânica', color: '#6366F1', icon: Wrench, categoria: 'estrada' },
        { value: 'reboque', label: '🚛 Reboque', color: '#EC4899', icon: Truck, categoria: 'estrada' },
        { value: 'lavagem', label: '🧼 Lavagem', color: '#06B6D4', icon: Droplet, categoria: 'estrada' },
        { value: 'pedagio', label: '🛣️ Pedágio', color: '#84CC16', icon: MapPin, categoria: 'estrada' },
        // Contas Habituais
        { value: 'agua', label: '💧 Água', color: '#3B82F6', icon: Droplet, categoria: 'habitual' },
        { value: 'energia', label: '⚡ Energia', color: '#F59E0B', icon: AlertCircle, categoria: 'habitual' },
        { value: 'aluguel', label: '🏠 Aluguel', color: '#8B5CF6', icon: FileText, categoria: 'habitual' },
        { value: 'internet', label: '🌐 Internet', color: '#10B981', icon: FileText, categoria: 'habitual' },
        { value: 'telefone', label: '📱 Telefone', color: '#06B6D4', icon: FileText, categoria: 'habitual' },
        // Outros
        { value: 'espontaneo', label: '✨ Personalizado', color: '#A855F7', icon: FileText, categoria: 'outros' },
        { value: 'outros', label: '📦 Outros', color: '#64748B', icon: FileText, categoria: 'outros' },
    ];

    const statusConfig = {
        pendente: { icon: Clock, color: expressoTheme.colors.warning, label: 'Pendente', bg: 'rgba(255, 193, 7, 0.1)' },
        paga: { icon: CheckCircle, color: expressoTheme.colors.success, label: 'Paga', bg: 'rgba(40, 167, 69, 0.1)' },
        vencida: { icon: AlertCircle, color: expressoTheme.colors.danger, label: 'Vencida', bg: 'rgba(220, 53, 69, 0.1)' },
        cancelada: { icon: XCircle, color: expressoTheme.colors.textSecondary, label: 'Cancelada', bg: 'rgba(108, 117, 125, 0.1)' },
    };

    const fetchContas = useCallback(async () => {
        try {
            const response = await api.get('/contas-pagar');
            setContas(Array.isArray(response.data.contas) ? response.data.contas : []);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar contas', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    const fetchAcoes = useCallback(async () => {
        try {
            const response = await api.get('/acoes');
            // A API retorna formato diferente com/sem paginação
            // Com paginação: { acoes: [...], pagination: {...} }
            // Sem paginação: [...]
            const acoesData = Array.isArray(response.data)
                ? response.data
                : (Array.isArray(response.data.acoes) ? response.data.acoes : []);
            setAcoes(acoesData.map((acao: any) => ({ id: acao.id, nome: acao.nome })));
        } catch (error: any) {
            console.error('Erro ao carregar ações:', error);
        }
    }, []);

    useEffect(() => {
        fetchContas();
        fetchAcoes();
    }, [fetchContas, fetchAcoes]);

    const filteredContas = contas.filter((conta) => {
        const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = !filterTipo || conta.tipo_conta === filterTipo;
        const matchesStatus = !filterStatus || conta.status === filterStatus;
        const matchesCidade = !filterCidade || conta.cidade?.toLowerCase().includes(filterCidade.toLowerCase());
        return matchesSearch && matchesTipo && matchesStatus && matchesCidade;
    });

    const getTotalPorStatus = (status: string) => {
        return contas
            .filter(c => c.status === status)
            .reduce((sum, c) => sum + Number(c.valor), 0);
    };

    const handleOpenDialog = (conta?: ContaPagar) => {
        if (conta) {
            setEditingConta(conta);
            setFormData({
                tipo_conta: conta.tipo_conta,
                tipo_espontaneo: conta.tipo_espontaneo || '',
                descricao: conta.descricao,
                valor: conta.valor,
                data_vencimento: conta.data_vencimento.split('T')[0],
                status: conta.status,
                recorrente: conta.recorrente,
                observacoes: conta.observacoes || '',
                acao_id: conta.acao_id || '',
                cidade: conta.cidade || '',
                caminhao_id: conta.caminhao_id || '',
            });
        } else {
            setEditingConta(null);
            setFormData({
                tipo_conta: '',
                tipo_espontaneo: '',
                descricao: '',
                valor: 0,
                data_vencimento: '',
                status: 'pendente',
                recorrente: false,
                observacoes: '',
                acao_id: '',
                cidade: '',
                caminhao_id: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingConta) {
                await api.put(`/contas-pagar/${editingConta.id}`, formData);
                enqueueSnackbar('Conta atualizada com sucesso!', { variant: 'success' });
            } else {
                await api.post('/contas-pagar', formData);
                enqueueSnackbar('Conta criada com sucesso!', { variant: 'success' });
            }
            setShowModal(false);
            fetchContas();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao salvar conta', { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja deletar esta conta?')) return;
        try {
            await api.delete(`/contas-pagar/${id}`);
            enqueueSnackbar('Conta deletada com sucesso!', { variant: 'success' });
            fetchContas();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao deletar conta', { variant: 'error' });
        }
    };

    const clearFilters = () => {
        setFilterTipo('');
        setFilterStatus('');
        setFilterCidade('');
        setSearchTerm('');
    };

    const hasActiveFilters = filterTipo || filterStatus || filterCidade;

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
                                Contas a Pagar
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                Gestão de custos de estrada e despesas operacionais
                            </Typography>
                        </Box>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={20} />}
                                onClick={() => handleOpenDialog()}
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
                                Nova Conta
                            </Button>
                        </motion.div>
                    </Box>
                </motion.div>

                {/* Cards de Resumo */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <AnimatePresence>
                        {Object.entries(statusConfig).map(([status, config], index) => {
                            const Icon = config.icon;
                            const total = getTotalPorStatus(status);
                            return (
                                <Grid item xs={12} sm={6} md={3} key={status}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                    >
                                        <Box
                                            sx={{
                                                background: expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: `1px solid ${expressoTheme.colors.border}`,
                                                borderLeft: `4px solid ${config.color}`,
                                                p: 2.5,
                                                boxShadow: expressoTheme.shadows.card,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                                <Box sx={{ display: 'inline-flex', padding: 1, borderRadius: expressoTheme.borderRadius.medium, background: config.bg }}>
                                                    <Icon size={24} color={config.color} />
                                                </Box>
                                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 }}>
                                                    {config.label}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ color: expressoTheme.colors.text, fontWeight: 700 }}>
                                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            );
                        })}
                    </AnimatePresence>
                </Grid>

                {/* Seção de Relatórios */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'inline-flex', padding: 1.5, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary }}>
                                    <FileText size={24} color="white" />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: expressoTheme.colors.text }}>
                                        Relatórios e Exportação
                                    </Typography>
                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                        Exporte dados em múltiplos formatos
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<FileText size={18} />}
                                        onClick={async () => {
                                            try {
                                                const periodo = new Date().toISOString().slice(0, 7);
                                                const response = await api.get(`/contas-pagar/relatorios/exportar?formato=xlsx&periodo=${periodo}`, {
                                                    responseType: 'blob',
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `contas-pagar-${periodo}.xlsx`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                enqueueSnackbar('Relatório XLSX exportado com sucesso!', { variant: 'success' });
                                            } catch (error: any) {
                                                enqueueSnackbar('Erro ao exportar relatório', { variant: 'error' });
                                            }
                                        }}
                                        sx={{
                                            borderColor: expressoTheme.colors.primary,
                                            color: expressoTheme.colors.primary,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            py: 1.5,
                                            '&:hover': {
                                                borderColor: expressoTheme.colors.primaryDark,
                                                background: `${expressoTheme.colors.primary}10`,
                                            }
                                        }}
                                    >
                                        Exportar XLSX
                                    </Button>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<FileText size={18} />}
                                        onClick={async () => {
                                            try {
                                                const periodo = new Date().toISOString().slice(0, 7);
                                                const response = await api.get(`/contas-pagar/relatorios/exportar?formato=csv&periodo=${periodo}`, {
                                                    responseType: 'blob',
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `contas-pagar-${periodo}.csv`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                enqueueSnackbar('Relatório CSV exportado com sucesso!', { variant: 'success' });
                                            } catch (error: any) {
                                                enqueueSnackbar('Erro ao exportar relatório', { variant: 'error' });
                                            }
                                        }}
                                        sx={{
                                            borderColor: expressoTheme.colors.success,
                                            color: expressoTheme.colors.success,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            py: 1.5,
                                            '&:hover': {
                                                borderColor: expressoTheme.colors.success,
                                                background: `${expressoTheme.colors.success}10`,
                                            }
                                        }}
                                    >
                                        Exportar CSV
                                    </Button>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<MapPin size={18} />}
                                        onClick={async () => {
                                            try {
                                                const response = await api.get('/contas-pagar/relatorios/por-cidade');
                                                console.log('Relatório por cidade:', response.data);
                                                enqueueSnackbar('Relatório por cidade gerado!', { variant: 'info' });
                                            } catch (error: any) {
                                                enqueueSnackbar('Erro ao gerar relatório', { variant: 'error' });
                                            }
                                        }}
                                        sx={{
                                            borderColor: expressoTheme.colors.warning,
                                            color: expressoTheme.colors.warning,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            py: 1.5,
                                            '&:hover': {
                                                borderColor: expressoTheme.colors.warning,
                                                background: `${expressoTheme.colors.warning}10`,
                                            }
                                        }}
                                    >
                                        Por Cidade
                                    </Button>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Truck size={18} />}
                                        onClick={async () => {
                                            try {
                                                const response = await api.get('/contas-pagar/relatorios/por-acao');
                                                console.log('Relatório por ação:', response.data);
                                                enqueueSnackbar('Relatório por ação gerado!', { variant: 'info' });
                                            } catch (error: any) {
                                                enqueueSnackbar('Erro ao gerar relatório', { variant: 'error' });
                                            }
                                        }}
                                        sx={{
                                            borderColor: expressoTheme.colors.danger,
                                            color: expressoTheme.colors.danger,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            py: 1.5,
                                            '&:hover': {
                                                borderColor: expressoTheme.colors.danger,
                                                background: `${expressoTheme.colors.danger}10`,
                                            }
                                        }}
                                    >
                                        Por Ação
                                    </Button>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Box>
                </motion.div>

                {/* Barra de Pesquisa e Filtros */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar contas..."
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
                                    background: expressoTheme.gradients.primary,
                                    color: 'white',
                                    textTransform: 'none',
                                    px: 2,
                                    py: 1,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    fontWeight: 600,
                                    boxShadow: expressoTheme.shadows.button,
                                    '&:hover': {
                                        background: expressoTheme.colors.primaryDark,
                                    }
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
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField select fullWidth label="Tipo de Conta" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} size="small">
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem disabled sx={{ fontWeight: 700, color: expressoTheme.colors.primary }}>Custos de Estrada</MenuItem>
                                        {tiposConta.filter(t => t.categoria === 'estrada').map(tipo => (
                                            <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                                        ))}
                                        <MenuItem disabled sx={{ fontWeight: 700, color: expressoTheme.colors.primary }}>Contas Habituais</MenuItem>
                                        {tiposConta.filter(t => t.categoria === 'habitual').map(tipo => (
                                            <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                                        ))}
                                        <MenuItem disabled sx={{ fontWeight: 700, color: expressoTheme.colors.primary }}>Outros</MenuItem>
                                        {tiposConta.filter(t => t.categoria === 'outros').map(tipo => (
                                            <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField select fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small">
                                        <MenuItem value="">Todos</MenuItem>
                                        {Object.entries(statusConfig).map(([status, config]) => (
                                            <MenuItem key={status} value={status}>{config.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField fullWidth label="Cidade" value={filterCidade} onChange={(e) => setFilterCidade(e.target.value)} size="small" />
                                </Grid>
                            </Grid>
                        </Collapse>
                    </Box>
                </motion.div>

                {/* Grid de Contas */}
                <Grid container spacing={2}>
                    <AnimatePresence>
                        {filteredContas.length === 0 ? (
                            <Grid item xs={12}>
                                <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 6, textAlign: 'center' }}>
                                    <DollarSign size={48} color={expressoTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                    <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                        {searchTerm || hasActiveFilters ? 'Nenhuma conta encontrada.' : 'Nenhuma conta cadastrada ainda.'}
                                    </Typography>
                                </Box>
                            </Grid>
                        ) : (
                            filteredContas.map((conta, index) => {
                                const StatusIcon = statusConfig[conta.status].icon;
                                const tipoInfo = tiposConta.find(t => t.value === conta.tipo_conta);
                                const TipoIcon = tipoInfo?.icon || FileText;

                                return (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={conta.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <Box
                                                sx={{
                                                    background: expressoTheme.colors.cardBackground,
                                                    borderRadius: expressoTheme.borderRadius.large,
                                                    border: `1px solid ${expressoTheme.colors.border}`,
                                                    p: 2,
                                                    height: '100%',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: expressoTheme.shadows.card,
                                                    '&:hover': {
                                                        background: expressoTheme.colors.cardHover,
                                                        borderColor: expressoTheme.colors.primary,
                                                        boxShadow: expressoTheme.shadows.cardHover,
                                                    },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                    >
                                                        <Box sx={{ display: 'inline-flex', padding: 1, borderRadius: expressoTheme.borderRadius.medium, background: `${tipoInfo?.color}20` }}>
                                                            <TipoIcon size={20} color={tipoInfo?.color} />
                                                        </Box>
                                                    </motion.div>
                                                    <Chip
                                                        icon={<StatusIcon size={14} />}
                                                        label={statusConfig[conta.status].label}
                                                        size="small"
                                                        sx={{
                                                            background: statusConfig[conta.status].bg,
                                                            color: statusConfig[conta.status].color,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                        }}
                                                    />
                                                </Box>

                                                <Typography variant="h6" sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 0.5, fontSize: '0.95rem' }}>
                                                    {tipoInfo?.label}
                                                </Typography>

                                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.8rem', mb: 1, minHeight: 32 }}>
                                                    {conta.descricao.length > 50 ? `${conta.descricao.substring(0, 50)}...` : conta.descricao}
                                                </Typography>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <DollarSign size={14} color={expressoTheme.colors.primary} />
                                                        <Typography sx={{ color: expressoTheme.colors.text, fontSize: '0.85rem', fontWeight: 700 }}>
                                                            R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Calendar size={14} color={expressoTheme.colors.primary} />
                                                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem' }}>
                                                            {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                                                        </Typography>
                                                    </Box>
                                                    {conta.cidade && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <MapPin size={14} color={expressoTheme.colors.primary} />
                                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem' }}>
                                                                {conta.cidade}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ flex: 1 }}>
                                                        <Button
                                                            fullWidth
                                                            size="small"
                                                            startIcon={<Edit size={14} />}
                                                            onClick={() => handleOpenDialog(conta)}
                                                            sx={{
                                                                color: expressoTheme.colors.primary,
                                                                borderColor: expressoTheme.colors.primary,
                                                                textTransform: 'none',
                                                                fontSize: '0.75rem',
                                                                '&:hover': {
                                                                    background: expressoTheme.colors.cardHover,
                                                                    borderColor: expressoTheme.colors.primaryDark,
                                                                }
                                                            }}
                                                            variant="outlined"
                                                        >
                                                            Editar
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(conta.id)}
                                                            sx={{
                                                                color: expressoTheme.colors.danger,
                                                                '&:hover': {
                                                                    background: 'rgba(220, 53, 69, 0.1)',
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    </motion.div>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                );
                            })
                        )}
                    </AnimatePresence>
                </Grid>

                {/* Modal de Cadastro/Edição */}
                <Dialog
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: expressoTheme.borderRadius.large,
                            boxShadow: expressoTheme.shadows.dialog,
                        }
                    }}
                >
                    <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <DollarSign size={24} />
                        {editingConta ? 'Editar Conta' : 'Nova Conta'}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Grid container spacing={2.5}>
                            {/* Seleção de Tipo de Conta */}
                            <Grid item xs={12}>
                                <Typography sx={{ fontWeight: 600, mb: 1.5, color: expressoTheme.colors.text }}>
                                    Tipo de Conta
                                </Typography>

                                {/* Custos de Estrada */}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: expressoTheme.colors.primary, mb: 1 }}>
                                    🚛 Custos de Estrada
                                </Typography>
                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                    {tiposConta.filter(t => t.categoria === 'estrada').map(tipo => {
                                        const TipoIcon = tipo.icon;
                                        const isSelected = formData.tipo_conta === tipo.value;
                                        return (
                                            <Grid item xs={6} sm={4} md={3} key={tipo.value}>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Box
                                                        onClick={() => setFormData({ ...formData, tipo_conta: tipo.value })}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: expressoTheme.borderRadius.medium,
                                                            border: `2px solid ${isSelected ? tipo.color : expressoTheme.colors.border}`,
                                                            background: isSelected ? `${tipo.color}15` : expressoTheme.colors.cardBackground,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            '&:hover': {
                                                                borderColor: tipo.color,
                                                                background: `${tipo.color}10`,
                                                            }
                                                        }}
                                                    >
                                                        <TipoIcon size={24} color={tipo.color} />
                                                        <Typography sx={{ fontSize: '0.7rem', textAlign: 'center', color: expressoTheme.colors.text }}>
                                                            {tipo.label.replace(/[🛞🛢️⛽🔧🚛🧼🛣️]/g, '').trim()}
                                                        </Typography>
                                                    </Box>
                                                </motion.div>
                                            </Grid>
                                        );
                                    })}
                                </Grid>

                                {/* Contas Habituais */}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: expressoTheme.colors.primary, mb: 1 }}>
                                    🏢 Contas Habituais
                                </Typography>
                                <Grid container spacing={1} sx={{ mb: 2 }}>
                                    {tiposConta.filter(t => t.categoria === 'habitual').map(tipo => {
                                        const TipoIcon = tipo.icon;
                                        const isSelected = formData.tipo_conta === tipo.value;
                                        return (
                                            <Grid item xs={6} sm={4} md={3} key={tipo.value}>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Box
                                                        onClick={() => setFormData({ ...formData, tipo_conta: tipo.value })}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: expressoTheme.borderRadius.medium,
                                                            border: `2px solid ${isSelected ? tipo.color : expressoTheme.colors.border}`,
                                                            background: isSelected ? `${tipo.color}15` : expressoTheme.colors.cardBackground,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            '&:hover': {
                                                                borderColor: tipo.color,
                                                                background: `${tipo.color}10`,
                                                            }
                                                        }}
                                                    >
                                                        <TipoIcon size={24} color={tipo.color} />
                                                        <Typography sx={{ fontSize: '0.7rem', textAlign: 'center', color: expressoTheme.colors.text }}>
                                                            {tipo.label.replace(/[💧⚡🏠🌐📱]/g, '').trim()}
                                                        </Typography>
                                                    </Box>
                                                </motion.div>
                                            </Grid>
                                        );
                                    })}
                                </Grid>

                                {/* Outros */}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: expressoTheme.colors.primary, mb: 1 }}>
                                    📦 Outros
                                </Typography>
                                <Grid container spacing={1}>
                                    {tiposConta.filter(t => t.categoria === 'outros').map(tipo => {
                                        const TipoIcon = tipo.icon;
                                        const isSelected = formData.tipo_conta === tipo.value;
                                        return (
                                            <Grid item xs={6} sm={4} md={3} key={tipo.value}>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Box
                                                        onClick={() => setFormData({ ...formData, tipo_conta: tipo.value })}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: expressoTheme.borderRadius.medium,
                                                            border: `2px solid ${isSelected ? tipo.color : expressoTheme.colors.border}`,
                                                            background: isSelected ? `${tipo.color}15` : expressoTheme.colors.cardBackground,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            '&:hover': {
                                                                borderColor: tipo.color,
                                                                background: `${tipo.color}10`,
                                                            }
                                                        }}
                                                    >
                                                        <TipoIcon size={24} color={tipo.color} />
                                                        <Typography sx={{ fontSize: '0.7rem', textAlign: 'center', color: expressoTheme.colors.text }}>
                                                            {tipo.label.replace(/[✨📦]/g, '').trim()}
                                                        </Typography>
                                                    </Box>
                                                </motion.div>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Grid>

                            {/* Campo Tipo Espontâneo (condicional) */}
                            {formData.tipo_conta === 'espontaneo' && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Especifique o Tipo"
                                        value={formData.tipo_espontaneo}
                                        onChange={(e) => setFormData({ ...formData, tipo_espontaneo: e.target.value })}
                                        placeholder="Ex: Multa de trânsito, Seguro, etc."
                                    />
                                </Grid>
                            )}

                            {/* Descrição */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Descrição"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descreva a conta..."
                                    multiline
                                    rows={2}
                                />
                            </Grid>

                            {/* Valor e Data de Vencimento */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Valor (R$)"
                                    type="number"
                                    value={formData.valor || ''}
                                    onChange={(e) => setFormData({ ...formData, valor: Number(e.target.value) || 0 })}
                                    onFocus={() => {
                                        if (formData.valor === 0) {
                                            setFormData({ ...formData, valor: '' as any });
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DollarSign size={18} color={expressoTheme.colors.primary} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Data de Vencimento"
                                    type="date"
                                    value={formData.data_vencimento}
                                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Calendar size={18} color={expressoTheme.colors.primary} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Vincular a Ação (opcional) */}
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Vincular a Ação (opcional)"
                                    value={formData.acao_id}
                                    onChange={(e) => setFormData({ ...formData, acao_id: e.target.value })}
                                    helperText="Vincule esta conta a uma ação específica para rastreamento de custos"
                                >
                                    <MenuItem value="">
                                        <em>Nenhuma ação</em>
                                    </MenuItem>
                                    {acoes.map((acao) => (
                                        <MenuItem key={acao.id} value={acao.id}>
                                            {acao.nome}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Cidade e Status */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Cidade (para relatórios)"
                                    value={formData.cidade}
                                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                    placeholder="Ex: São Luís"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <MapPin size={18} color={expressoTheme.colors.primary} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    {Object.entries(statusConfig).map(([status, config]) => (
                                        <MenuItem key={status} value={status}>
                                            {config.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Recorrente */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.colors.cardHover }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.recorrente}
                                        onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                    />
                                    <Typography sx={{ color: expressoTheme.colors.text }}>
                                        Conta recorrente (mensal)
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Observações */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Observações (opcional)"
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    multiline
                                    rows={2}
                                    placeholder="Informações adicionais..."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, gap: 1 }}>
                        <Button
                            onClick={() => setShowModal(false)}
                            sx={{
                                color: expressoTheme.colors.textSecondary,
                                textTransform: 'none',
                            }}
                        >
                            Cancelar
                        </Button>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={handleSave}
                                variant="contained"
                                sx={{
                                    background: expressoTheme.gradients.primary,
                                    color: 'white',
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: expressoTheme.shadows.button,
                                    '&:hover': {
                                        background: expressoTheme.colors.primaryDark,
                                    }
                                }}
                            >
                                {editingConta ? 'Atualizar' : 'Salvar'}
                            </Button>
                        </motion.div>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default ContasPagar;

