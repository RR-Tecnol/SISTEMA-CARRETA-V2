import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Package,
    AlertTriangle,
    Search,
    Plus,
    Download,
    ArrowUpDown,
    Edit,
    Trash2,
    PackageX,
    Clock,
    History,
} from 'lucide-react';
import {
    Insumo,
    listarInsumos,
    criarInsumo,
    atualizarInsumo,
    deletarInsumo,
    buscarAlertasEstoqueBaixo,
    buscarInsumosVencendo,
    registrarMovimentacao,
    listarMovimentacoes,
    exportarRelatorio,
} from '../../services/estoque';

const Estoque: React.FC = () => {
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [alertasBaixo, setAlertasBaixo] = useState<any[]>([]);
    const [alertasVencendo, setAlertasVencendo] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroVencimento, setFiltroVencimento] = useState('');
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalMovimentacao, setModalMovimentacao] = useState(false);
    const [modalHistorico, setModalHistorico] = useState(false);
    const [insumoSelecionado, setInsumoSelecionado] = useState<Insumo | null>(null);
    const [movimentacoesHistorico, setMovimentacoesHistorico] = useState<any[]>([]);
    const [modoEdicao, setModoEdicao] = useState(false);

    // Estados do formulário de insumo
    const [formInsumo, setFormInsumo] = useState<Partial<Insumo>>({
        nome: '',
        categoria: 'OUTROS',
        unidade: '',
        quantidade_minima: 0,
        quantidade_atual: 0,
        ativo: true,
    });

    // Estados do formulário de movimentação
    const [formMovimentacao, setFormMovimentacao] = useState({
        insumo_id: '',
        tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE' | 'PERDA',
        quantidade: 0,
        observacoes: '',
    });

    useEffect(() => {
        carregarDados();
    }, [filtroCategoria, filtroStatus, filtroVencimento, busca]);

    const carregarDados = async () => {
        try {
            const [insumosData, alertasBaixoData, alertasVencendoData] = await Promise.all([
                listarInsumos({ categoria: filtroCategoria, status: filtroStatus, vencimento: filtroVencimento, busca }),
                buscarAlertasEstoqueBaixo(),
                buscarInsumosVencendo(),
            ]);

            setInsumos(insumosData);
            setAlertasBaixo(alertasBaixoData);
            setAlertasVencendo(alertasVencendoData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const calcularPercentual = (atual: number, minimo: number) => {
        return (atual / minimo) * 100;
    };

    const getStatusEstoque = (insumo: Insumo) => {
        const percentual = calcularPercentual(insumo.quantidade_atual, insumo.quantidade_minima);

        if (insumo.quantidade_atual === 0 || percentual < 50) {
            return { label: 'CRÍTICO', color: '#ef4444', icon: PackageX };
        } else if (percentual <= 100) {
            return { label: 'BAIXO', color: '#f59e0b', icon: AlertTriangle };
        } else {
            return { label: 'OK', color: '#10b981', icon: Package };
        }
    };

    const handleSalvarInsumo = async () => {
        try {
            if (modoEdicao && insumoSelecionado) {
                await atualizarInsumo(insumoSelecionado.id, formInsumo);
            } else {
                await criarInsumo(formInsumo);
            }
            setModalInsumo(false);
            setFormInsumo({
                nome: '',
                categoria: 'OUTROS',
                unidade: '',
                quantidade_minima: 0,
                quantidade_atual: 0,
                ativo: true,
            });
            carregarDados();
        } catch (error) {
            console.error('Erro ao salvar insumo:', error);
        }
    };

    const handleRegistrarMovimentacao = async () => {
        try {
            const adminId = localStorage.getItem('adminId') || '';
            const dadosMovimentacao = {
                ...formMovimentacao,
                usuario_id: adminId,
            };
            console.log('📤 Enviando movimentação:', JSON.stringify(dadosMovimentacao, null, 2));
            console.log('📋 Form atual:', JSON.stringify(formMovimentacao, null, 2));
            await registrarMovimentacao(dadosMovimentacao);
            setModalMovimentacao(false);
            setFormMovimentacao({
                insumo_id: '',
                tipo: 'ENTRADA',
                quantidade: 0,
                observacoes: '',
            });
            carregarDados();
        } catch (error: any) {
            console.error('Erro ao registrar movimentação:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            console.error('Response headers:', error.response?.headers);
            alert(`Erro: ${error.response?.data?.details || error.message}\n\nStack: ${error.response?.data?.stack || 'N/A'}`);
        }
    };

    const handleDeletarInsumo = async (id: string) => {
        if (window.confirm('Tem certeza que deseja deletar este insumo?')) {
            try {
                await deletarInsumo(id);
                carregarDados();
            } catch (error) {
                console.error('Erro ao deletar insumo:', error);
            }
        }
    };

    const handleVerHistorico = async (insumo: Insumo) => {
        try {
            const movimentacoes = await listarMovimentacoes({ insumo_id: insumo.id });
            setMovimentacoesHistorico(movimentacoes);
            setInsumoSelecionado(insumo);
            setModalHistorico(true);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    };

    const handleExportar = async (formato: 'xlsx' | 'csv', tipo: 'estoque' | 'movimentacoes') => {
        try {
            await exportarRelatorio(formato, tipo);
        } catch (error) {
            console.error('Erro ao exportar:', error);
        }
    };

    const categorias = ['EPI', 'MEDICAMENTO', 'MATERIAL_DESCARTAVEL', 'EQUIPAMENTO', 'OUTROS'];

    return (
        <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                            }}
                        >
                            📦 Controle de Estoque
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Gestão completa de insumos e movimentações
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Plus size={20} />}
                            onClick={() => {
                                setModoEdicao(false);
                                setInsumoSelecionado(null);
                                setFormInsumo({
                                    nome: '',
                                    categoria: 'OUTROS',
                                    unidade: '',
                                    quantidade_minima: 0,
                                    quantidade_atual: 0,
                                    ativo: true,
                                });
                                setModalInsumo(true);
                            }}
                            sx={{
                                background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                            }}
                        >
                            Novo Insumo
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowUpDown size={20} />}
                            onClick={() => setModalMovimentacao(true)}
                            sx={{
                                borderColor: '#5DADE2',
                                color: '#5DADE2',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                            }}
                        >
                            Movimentação
                        </Button>
                    </Box>
                </Box>
            </motion.div>

            {/* Cards de Resumo */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    {
                        title: 'Total de Insumos',
                        value: insumos.length,
                        icon: Package,
                        color: '#5DADE2',
                        gradient: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                    },
                    {
                        title: 'Estoque Crítico',
                        value: alertasBaixo.filter((a: any) => a.status === 'CRITICO').length,
                        icon: PackageX,
                        color: '#ef4444',
                        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    },
                    {
                        title: 'Estoque Baixo',
                        value: alertasBaixo.filter((a: any) => a.status === 'BAIXO').length,
                        icon: AlertTriangle,
                        color: '#f59e0b',
                        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    },
                    {
                        title: 'Vencendo em 30 dias',
                        value: alertasVencendo.length,
                        icon: Clock,
                        color: '#5DADE2',
                        gradient: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                    },
                ].map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card
                                sx={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 3,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: `0 10px 30px ${card.color}40`,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '100px',
                                        height: '100px',
                                        background: card.gradient,
                                        opacity: 0.1,
                                        borderRadius: '0 0 0 100%',
                                    }}
                                />
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                                {card.title}
                                            </Typography>
                                            <Typography
                                                variant="h3"
                                                sx={{
                                                    fontWeight: 700,
                                                    background: card.gradient,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                {card.value}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: 2,
                                                background: card.gradient,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <card.icon size={24} color="white" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Filtros */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Card
                    sx={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                        mb: 3,
                    }}
                >
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    placeholder="Buscar insumo..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search size={20} color="#94a3b8" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#1e293b',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#5DADE2' },
                                            '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#64748b' }}>Categoria</InputLabel>
                                    <Select
                                        value={filtroCategoria}
                                        onChange={(e) => setFiltroCategoria(e.target.value)}
                                        label="Categoria"
                                        sx={{
                                            color: '#1e293b',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        }}
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {categorias.map((cat) => (
                                            <MenuItem key={cat} value={cat}>
                                                {cat.replace(/_/g, ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#64748b' }}>Status</InputLabel>
                                    <Select
                                        value={filtroStatus}
                                        onChange={(e) => setFiltroStatus(e.target.value)}
                                        label="Status"
                                        sx={{
                                            color: '#1e293b',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        }}
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="OK">OK</MenuItem>
                                        <MenuItem value="BAIXO">Baixo</MenuItem>
                                        <MenuItem value="CRITICO">Crítico</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#64748b' }}>Vencimento</InputLabel>
                                    <Select
                                        value={filtroVencimento}
                                        onChange={(e) => setFiltroVencimento(e.target.value)}
                                        label="Vencimento"
                                        sx={{
                                            color: '#1e293b',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        }}
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="OK">OK</MenuItem>
                                        <MenuItem value="VENCENDO">Vencendo</MenuItem>
                                        <MenuItem value="VENCIDO">Vencido</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Download size={20} />}
                                    onClick={() => handleExportar('xlsx', 'estoque')}
                                    sx={{
                                        borderColor: '#5DADE2',
                                        color: '#5DADE2',
                                        textTransform: 'none',
                                        height: '56px',
                                    }}
                                >
                                    Exportar
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Tabela de Insumos */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <Card
                    sx={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" sx={{ color: '#1e293b', mb: 2, fontWeight: 600 }}>
                            Lista de Insumos
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Nome</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Categoria</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Quantidade</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Mínimo</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Vencimento</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {insumos.map((insumo) => {
                                        const status = getStatusEstoque(insumo);
                                        const StatusIcon = status.icon;

                                        return (
                                            <TableRow
                                                key={insumo.id}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                                                    },
                                                }}
                                            >
                                                <TableCell sx={{ color: '#1e293b' }}>{insumo.nome}</TableCell>
                                                <TableCell sx={{ color: '#64748b' }}>
                                                    {insumo.categoria.replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell sx={{ color: '#1e293b', fontWeight: 600 }}>
                                                    {insumo.quantidade_atual} {insumo.unidade}
                                                </TableCell>
                                                <TableCell sx={{ color: '#64748b' }}>
                                                    {insumo.quantidade_minima} {insumo.unidade}
                                                </TableCell>
                                                <TableCell sx={{ color: '#1e293b' }}>
                                                    {insumo.data_validade ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Clock size={16} color="#64748b" />
                                                            {new Date(insumo.data_validade).toLocaleDateString('pt-BR')}
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={<StatusIcon size={16} />}
                                                        label={status.label}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: `${status.color}20`,
                                                            color: status.color,
                                                            fontWeight: 600,
                                                            border: `1px solid ${status.color}40`,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Movimentação">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    console.log('🔍 Insumo selecionado:', insumo.id, insumo.nome);
                                                                    setFormMovimentacao({
                                                                        insumo_id: insumo.id,
                                                                        tipo: 'ENTRADA',
                                                                        quantidade: 0,
                                                                        observacoes: '',
                                                                    });
                                                                    console.log('✅ Form atualizado com insumo_id:', insumo.id);
                                                                    setModalMovimentacao(true);
                                                                }}
                                                                sx={{ color: '#10b981' }}
                                                            >
                                                                <ArrowUpDown size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Histórico">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleVerHistorico(insumo)}
                                                                sx={{ color: '#3b82f6' }}
                                                            >
                                                                <History size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setModoEdicao(true);
                                                                    setInsumoSelecionado(insumo);
                                                                    setFormInsumo(insumo);
                                                                    setModalInsumo(true);
                                                                }}
                                                                sx={{ color: '#5DADE2' }}
                                                            >
                                                                <Edit size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Deletar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeletarInsumo(insumo.id)}
                                                                sx={{ color: '#ef4444' }}
                                                            >
                                                                <Trash2 size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Modal de Insumo */}
            <Dialog
                open={modalInsumo}
                onClose={() => setModalInsumo(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {modoEdicao ? 'Editar Insumo' : 'Novo Insumo'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Nome"
                                value={formInsumo.nome}
                                onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#64748b' }}>Categoria</InputLabel>
                                <Select
                                    value={formInsumo.categoria}
                                    onChange={(e) => setFormInsumo({ ...formInsumo, categoria: e.target.value as any })}
                                    label="Categoria"
                                    sx={{
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148, 163, 184, 0.2)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                    }}
                                >
                                    {categorias.map((cat) => (
                                        <MenuItem key={cat} value={cat}>
                                            {cat.replace(/_/g, ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descrição"
                                multiline
                                rows={2}
                                value={formInsumo.descricao || ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, descricao: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Unidade"
                                value={formInsumo.unidade}
                                onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })}
                                placeholder="Ex: unidade, caixa, litro"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Quantidade Atual"
                                type="number"
                                value={formInsumo.quantidade_atual}
                                onChange={(e) => setFormInsumo({ ...formInsumo, quantidade_atual: Number(e.target.value) })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Quantidade Mínima"
                                type="number"
                                value={formInsumo.quantidade_minima}
                                onChange={(e) => setFormInsumo({ ...formInsumo, quantidade_minima: Number(e.target.value) })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Código de Barras"
                                value={formInsumo.codigo_barras || ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, codigo_barras: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Lote"
                                value={formInsumo.lote || ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, lote: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Data de Vencimento"
                                type="date"
                                value={formInsumo.data_validade ? new Date(formInsumo.data_validade).toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, data_validade: e.target.value ? new Date(e.target.value) : undefined })}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Fornecedor"
                                value={formInsumo.fornecedor || ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, fornecedor: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Localização"
                                value={formInsumo.localizacao || ''}
                                onChange={(e) => setFormInsumo({ ...formInsumo, localizacao: e.target.value })}
                                placeholder="Ex: Prateleira A3"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setModalInsumo(false)} sx={{ color: '#64748b' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSalvarInsumo}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {modoEdicao ? 'Atualizar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Movimentação */}
            <Dialog
                open={modalMovimentacao}
                onClose={() => {
                    setModalMovimentacao(false);
                    setFormMovimentacao({
                        insumo_id: '',
                        tipo: 'ENTRADA',
                        quantidade: 0,
                        observacoes: '',
                    });
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
                    Registrar Movimentação
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#64748b' }}>Insumo</InputLabel>
                                <Select
                                    value={formMovimentacao.insumo_id}
                                    onChange={(e) => setFormMovimentacao({ ...formMovimentacao, insumo_id: e.target.value })}
                                    label="Insumo"
                                    disabled={formMovimentacao.insumo_id !== ''}
                                    sx={{
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148, 163, 184, 0.2)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                    }}
                                >
                                    {insumos.map((insumo) => (
                                        <MenuItem key={insumo.id} value={insumo.id}>
                                            {insumo.nome}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#64748b' }}>Tipo</InputLabel>
                                <Select
                                    value={formMovimentacao.tipo}
                                    onChange={(e) => setFormMovimentacao({ ...formMovimentacao, tipo: e.target.value as any })}
                                    label="Tipo"
                                    sx={{
                                        color: '#1e293b',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                    }}
                                >
                                    <MenuItem value="ENTRADA">Entrada</MenuItem>
                                    <MenuItem value="SAIDA">Saída</MenuItem>
                                    <MenuItem value="AJUSTE">Ajuste</MenuItem>
                                    <MenuItem value="PERDA">Perda</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Quantidade"
                                type="number"
                                value={formMovimentacao.quantidade}
                                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, quantidade: Number(e.target.value) })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observações"
                                multiline
                                rows={3}
                                value={formMovimentacao.observacoes}
                                onChange={(e) => setFormMovimentacao({ ...formMovimentacao, observacoes: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1e293b',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#5DADE2' },
                                        '&.Mui-focused fieldset': { borderColor: '#5DADE2' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#64748b' },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => {
                        setModalMovimentacao(false);
                        setFormMovimentacao({
                            insumo_id: '',
                            tipo: 'ENTRADA',
                            quantidade: 0,
                            observacoes: '',
                        });
                    }} sx={{ color: '#64748b' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRegistrarMovimentacao}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Histórico */}
            <Dialog
                open={modalHistorico}
                onClose={() => setModalHistorico(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ color: '#1e293b', fontWeight: 600 }}>
                    Histórico de Movimentações - {insumoSelecionado?.nome}
                </DialogTitle>
                <DialogContent>
                    {movimentacoesHistorico.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                Nenhuma movimentação registrada para este insumo.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Quantidade</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Qtd. Anterior</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Qtd. Atual</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Observações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {movimentacoesHistorico.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell>
                                                {new Date(mov.data_movimento).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={mov.tipo}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: mov.tipo === 'ENTRADA' ? '#10b981' :
                                                            mov.tipo === 'SAIDA' ? '#ef4444' :
                                                                mov.tipo === 'TRANSFERENCIA' ? '#3b82f6' : '#f59e0b',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{mov.quantidade}</TableCell>
                                            <TableCell>{mov.quantidade_anterior}</TableCell>
                                            <TableCell>{mov.quantidade_atual}</TableCell>
                                            <TableCell>{mov.observacoes || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setModalHistorico(false)} sx={{ color: '#64748b' }}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Estoque;
