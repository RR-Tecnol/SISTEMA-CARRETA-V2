import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Grid, Button, TextField, IconButton,
    CircularProgress, Chip, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, Fade, InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, Pin, PinOff, Trash2, Edit3, Search, X,
    StickyNote, Clock, Tag,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

// ─── Paleta de cores para etiquetas ──────────────────────────────────────────
const ETIQUETA_CORES = [
    { label: 'Azul', value: '#4682b4' },
    { label: 'Verde', value: '#27ae60' },
    { label: 'Laranja', value: '#e67e22' },
    { label: 'Vermelho', value: '#e74c3c' },
    { label: 'Roxo', value: '#8e44ad' },
    { label: 'Cinza', value: '#607d8b' },
];

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface Anotacao {
    id: string;
    funcionario_id: string;
    titulo: string;
    conteudo: string;
    cor: string;
    pinned: boolean;
    created_at: string;
    updated_at: string;
}

interface Funcionario {
    id: string;
    nome: string;
    cargo: string;
    especialidade?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatDate = (a: Anotacao): string => {
    // Sequelize pode retornar como updated_at ou updatedAt dependendo da serialização
    const raw = (a as any).updatedAt || (a as any).updated_at || (a as any).createdAt || (a as any).created_at;
    if (!raw) return 'agora';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'agora';
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

// número de linhas a partir do qual o card é truncado
const MAX_LINHAS = 5;

// ─── Componente de card de anotação ───────────────────────────────────────
interface CardProps {
    anotacao: Anotacao;
    index: number;
    onEdit: (a: Anotacao) => void;
    onDelete: (a: Anotacao) => void;
    onTogglePin: (a: Anotacao) => void;
}

function AnotacaoCard({ anotacao, index, onEdit, onDelete, onTogglePin }: CardProps) {
    const [expandido, setExpandido] = useState(false);
    // estima se o conteúdo é longo o suficiente para precisar do botão
    const precisaExpandir = anotacao.conteudo.split('\n').length > MAX_LINHAS ||
        anotacao.conteudo.length > 300;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
            whileHover={{ y: -4 }}
            style={{ height: '100%' }}
        >
            <Box
                sx={{
                    height: '100%',
                    borderRadius: '16px',
                    background: '#fff',
                    boxShadow: anotacao.pinned
                        ? `0 4px 24px 0 ${anotacao.cor}44, 0 1px 4px #0001`
                        : '0 2px 12px #0001',
                    border: `2px solid ${anotacao.pinned ? anotacao.cor : '#e8edf3'}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                }}
            >
                {/* Barra colorida lateral */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: '5px',
                        background: anotacao.cor,
                        borderRadius: '16px 0 0 16px',
                    }}
                />

                {/* Header */}
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1, pl: 3.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {anotacao.pinned && (
                                    <Chip
                                        label="Fixada"
                                        size="small"
                                        icon={<Pin size={11} />}
                                        sx={{
                                            height: 20, fontSize: '0.68rem', fontWeight: 700,
                                            background: `${anotacao.cor}22`, color: anotacao.cor,
                                            border: `1px solid ${anotacao.cor}55`,
                                            '& .MuiChip-icon': { color: anotacao.cor, ml: 0.5 },
                                        }}
                                    />
                                )}
                                <Box
                                    sx={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: anotacao.cor, flexShrink: 0,
                                    }}
                                />
                            </Box>
                            <Typography
                                sx={{
                                    fontWeight: 700, fontSize: '1rem', color: '#1a2234',
                                    lineHeight: 1.3, wordBreak: 'break-word',
                                }}
                            >
                                {anotacao.titulo}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <Tooltip title={anotacao.pinned ? 'Desafixar' : 'Fixar no topo'}>
                                <IconButton
                                    size="small"
                                    onClick={() => onTogglePin(anotacao)}
                                    sx={{
                                        color: anotacao.pinned ? anotacao.cor : '#90a0b0',
                                        '&:hover': { color: anotacao.cor, background: `${anotacao.cor}15` },
                                    }}
                                >
                                    {anotacao.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                                <IconButton
                                    size="small"
                                    onClick={() => onEdit(anotacao)}
                                    sx={{ color: '#90a0b0', '&:hover': { color: '#4682b4', background: '#4682b415' } }}
                                >
                                    <Edit3 size={16} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                                <IconButton
                                    size="small"
                                    onClick={() => onDelete(anotacao)}
                                    sx={{ color: '#90a0b0', '&:hover': { color: '#e74c3c', background: '#e74c3c15' } }}
                                >
                                    <Trash2 size={16} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Box>

                {/* Conteúdo */}
                <Box sx={{ flex: 1, px: 2.5, pb: precisaExpandir ? 0.5 : 1.5, pl: 3.5 }}>
                    <Typography
                        sx={{
                            color: '#4a5568', fontSize: '0.88rem', lineHeight: 1.65,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            ...(!expandido && {
                                display: '-webkit-box',
                                WebkitLineClamp: MAX_LINHAS,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }),
                        }}
                    >
                        {anotacao.conteudo}
                    </Typography>
                    {precisaExpandir && (
                        <Button
                            size="small"
                            onClick={() => setExpandido((e) => !e)}
                            sx={{
                                mt: 0.5,
                                p: 0,
                                minWidth: 0,
                                color: '#4682b4',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                background: 'none',
                                '&:hover': { background: 'none', textDecoration: 'underline' },
                            }}
                        >
                            {expandido ? '▲ Ver menos' : '▼ Ver mais'}
                        </Button>
                    )}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        px: 2.5, py: 1, pl: 3.5,
                        borderTop: '1px solid #f0f4f8',
                        display: 'flex', alignItems: 'center', gap: 0.8,
                    }}
                >
                    <Clock size={12} color="#a0b0c0" />
                    <Typography sx={{ fontSize: '0.72rem', color: '#a0b0c0' }}>
                        {formatDate(anotacao)}
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    );
}

// ─── Página Principal ──────────────────────────────────────────────────────
const FuncionarioAnotacoes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
    const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroCor, setFiltroCor] = useState('');

    // Modal
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAnotacao, setEditingAnotacao] = useState<Anotacao | null>(null);
    const [form, setForm] = useState({ titulo: '', conteudo: '', cor: '#4682b4' });
    const [saving, setSaving] = useState(false);

    // Confirmação delete
    const [confirmDelete, setConfirmDelete] = useState<Anotacao | null>(null);

    const loadFuncionario = useCallback(async () => {
        try {
            const res = await api.get('/funcionarios');
            const lista = Array.isArray(res.data) ? res.data : (res.data.funcionarios || []);
            const f = lista.find((x: Funcionario) => x.id === id);
            if (f) setFuncionario(f);
        } catch { /* silent */ }
    }, [id]);

    const loadAnotacoes = useCallback(async () => {
        try {
            const res = await api.get(`/funcionarios/${id}/anotacoes`);
            setAnotacoes(Array.isArray(res.data) ? res.data : []);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadFuncionario();
        loadAnotacoes();
    }, [loadFuncionario, loadAnotacoes]);

    const openNew = () => {
        setEditingAnotacao(null);
        setForm({ titulo: '', conteudo: '', cor: '#4682b4' });
        setOpenDialog(true);
    };

    const openEdit = (a: Anotacao) => {
        setEditingAnotacao(a);
        setForm({ titulo: a.titulo, conteudo: a.conteudo, cor: a.cor });
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!form.titulo.trim() || !form.conteudo.trim()) {
            enqueueSnackbar('Preencha o título e o conteúdo.', { variant: 'warning' });
            return;
        }
        setSaving(true);
        try {
            if (editingAnotacao) {
                await api.put(`/funcionarios/${id}/anotacoes/${editingAnotacao.id}`, form);
                enqueueSnackbar('Anotação atualizada!', { variant: 'success' });
            } else {
                await api.post(`/funcionarios/${id}/anotacoes`, form);
                enqueueSnackbar('Anotação criada!', { variant: 'success' });
            }
            setOpenDialog(false);
            loadAnotacoes();
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao salvar.', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePin = async (a: Anotacao) => {
        try {
            await api.put(`/funcionarios/${id}/anotacoes/${a.id}`, { pinned: !a.pinned });
            loadAnotacoes();
        } catch {
            enqueueSnackbar('Erro ao fixar anotação.', { variant: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/funcionarios/${id}/anotacoes/${confirmDelete.id}`);
            enqueueSnackbar('Anotação excluída.', { variant: 'info' });
            setConfirmDelete(null);
            loadAnotacoes();
        } catch {
            enqueueSnackbar('Erro ao excluir.', { variant: 'error' });
        }
    };

    const filtered = anotacoes.filter((a) => {
        const matchBusca =
            a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            a.conteudo.toLowerCase().includes(busca.toLowerCase());
        const matchCor = filtroCor ? a.cor === filtroCor : true;
        return matchBusca && matchCor;
    });

    const pinned = filtered.filter((a) => a.pinned);
    const outros = filtered.filter((a) => !a.pinned);

    // ── render ──────────────────────────────────────────────────────────────
    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 50%, #f8faff 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="xl">

                {/* ── Cabeçalho ─────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Tooltip title="Voltar para Funcionários">
                            <IconButton
                                onClick={() => navigate('/admin/funcionarios')}
                                sx={{
                                    background: 'white',
                                    boxShadow: '0 2px 8px #0001',
                                    color: '#4682b4',
                                    '&:hover': { background: '#4682b4', color: 'white' },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ArrowLeft size={20} />
                            </IconButton>
                        </Tooltip>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#4682b4', fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', mb: 0.2 }}>
                                Bloco de Anotações
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a2234', lineHeight: 1.1 }}>
                                {funcionario?.nome || 'Funcionário'}
                            </Typography>
                            {funcionario?.cargo && (
                                <Typography sx={{ color: '#6b7a99', fontSize: '0.92rem', mt: 0.3 }}>
                                    {funcionario.cargo}{funcionario.especialidade ? ` · ${funcionario.especialidade}` : ''}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip
                                label={`${anotacoes.length} anotaç${anotacoes.length !== 1 ? 'ões' : 'ão'}`}
                                icon={<StickyNote size={14} />}
                                sx={{
                                    background: 'white', color: '#4682b4', fontWeight: 700,
                                    boxShadow: '0 2px 8px #0001', border: '1px solid #d0e4ff',
                                    '& .MuiChip-icon': { color: '#4682b4' },
                                }}
                            />
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Plus size={18} />}
                                    onClick={openNew}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: 'white',
                                        fontWeight: 700,
                                        px: 3,
                                        py: 1.3,
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        boxShadow: '0 4px 16px #4682b455',
                                        '&:hover': { boxShadow: '0 6px 20px #4682b466' },
                                    }}
                                >
                                    Nova Anotação
                                </Button>
                            </motion.div>
                        </Box>
                    </Box>
                </motion.div>

                {/* ── Filtros ───────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box
                        sx={{
                            background: 'white',
                            borderRadius: '16px',
                            p: 2.5,
                            mb: 3,
                            boxShadow: '0 2px 12px #0001',
                            border: '1px solid #e8edf3',
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <TextField
                            placeholder="Buscar nas anotações..."
                            size="small"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            sx={{
                                flex: 1, minWidth: 220,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    '&:hover fieldset': { borderColor: '#4682b4' },
                                    '&.Mui-focused fieldset': { borderColor: '#4682b4' },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={16} color="#90a0b0" />
                                    </InputAdornment>
                                ),
                                endAdornment: busca && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setBusca('')}>
                                            <X size={14} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tag size={14} color="#90a0b0" />
                            <Typography sx={{ fontSize: '0.8rem', color: '#7a8ba0', fontWeight: 600 }}>Cor:</Typography>
                            {ETIQUETA_CORES.map((c) => (
                                <Tooltip key={c.value} title={c.label}>
                                    <Box
                                        onClick={() => setFiltroCor(filtroCor === c.value ? '' : c.value)}
                                        sx={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: c.value, cursor: 'pointer',
                                            border: filtroCor === c.value ? `3px solid ${c.value}` : '2px solid transparent',
                                            outline: filtroCor === c.value ? '2px solid white' : 'none',
                                            boxShadow: filtroCor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                                            transition: 'all 0.15s',
                                            '&:hover': { transform: 'scale(1.2)' },
                                        }}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>
                </motion.div>

                {/* ── Loading ───────────────────────────────────────────────── */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#4682b4' }} size={48} thickness={3} />
                    </Box>
                )}

                {/* ── Vazio ─────────────────────────────────────────────────── */}
                {!loading && filtered.length === 0 && (
                    <Fade in>
                        <Box sx={{ textAlign: 'center', py: 10 }}>
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            >
                                <StickyNote size={64} color="#c8d8e8" />
                            </motion.div>
                            <Typography sx={{ color: '#a0b0c0', mt: 2, fontWeight: 600, fontSize: '1.1rem' }}>
                                {busca || filtroCor ? 'Nenhuma anotação encontrada com esses filtros.' : 'Nenhuma anotação ainda.'}
                            </Typography>
                            {!busca && !filtroCor && (
                                <Button
                                    variant="outlined"
                                    startIcon={<Plus size={16} />}
                                    onClick={openNew}
                                    sx={{ mt: 2, borderColor: '#4682b4', color: '#4682b4', borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                                >
                                    Criar primeira anotação
                                </Button>
                            )}
                        </Box>
                    </Fade>
                )}

                {/* ── Fixadas ───────────────────────────────────────────────── */}
                {!loading && pinned.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Pin size={16} color="#4682b4" />
                            <Typography sx={{ fontWeight: 700, color: '#4682b4', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Fixadas ({pinned.length})
                            </Typography>
                        </Box>
                        <Grid container spacing={2.5}>
                            <AnimatePresence>
                                {pinned.map((a, idx) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={a.id}>
                                        <AnotacaoCard
                                            anotacao={a} index={idx}
                                            onEdit={openEdit}
                                            onDelete={setConfirmDelete}
                                            onTogglePin={handleTogglePin}
                                        />
                                    </Grid>
                                ))}
                            </AnimatePresence>
                        </Grid>
                    </Box>
                )}

                {/* ── Outras ────────────────────────────────────────────────── */}
                {!loading && outros.length > 0 && (
                    <Box>
                        {pinned.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <StickyNote size={16} color="#6b7a99" />
                                <Typography sx={{ fontWeight: 700, color: '#6b7a99', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Outras ({outros.length})
                                </Typography>
                            </Box>
                        )}
                        <Grid container spacing={2.5}>
                            <AnimatePresence>
                                {outros.map((a, idx) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={a.id}>
                                        <AnotacaoCard
                                            anotacao={a} index={idx}
                                            onEdit={openEdit}
                                            onDelete={setConfirmDelete}
                                            onTogglePin={handleTogglePin}
                                        />
                                    </Grid>
                                ))}
                            </AnimatePresence>
                        </Grid>
                    </Box>
                )}
            </Container>

            {/* ─── Dialog criar/editar ─────────────────────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px #4682b430',
                    },
                }}
            >
                {/* header colorido */}
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                        px: 3, py: 2.5,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', p: 0.8 }}>
                            <StickyNote size={20} color="white" />
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>
                            {editingAnotacao ? 'Editar Anotação' : 'Nova Anotação'}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setOpenDialog(false)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
                    <TextField
                        fullWidth
                        label="Título"
                        value={form.titulo}
                        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                        sx={{
                            mb: 2.5,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&.Mui-focused fieldset': { borderColor: '#4682b4' },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#4682b4' },
                        }}
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Conteúdo"
                        value={form.conteudo}
                        onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                        multiline
                        rows={6}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&.Mui-focused fieldset': { borderColor: '#4682b4' },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#4682b4' },
                        }}
                        placeholder="Escreva suas observações, anotações ou comentários sobre o trabalho deste funcionário..."
                    />

                    {/* Seletor de cor */}
                    <Box>
                        <Typography sx={{ fontSize: '0.82rem', color: '#6b7a99', fontWeight: 700, mb: 1.2 }}>
                            Etiqueta de cor
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {ETIQUETA_CORES.map((c) => (
                                <Tooltip key={c.value} title={c.label}>
                                    <Box
                                        onClick={() => setForm({ ...form, cor: c.value })}
                                        sx={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: c.value, cursor: 'pointer',
                                            border: form.cor === c.value ? `3px solid ${c.value}` : '2px solid transparent',
                                            outline: form.cor === c.value ? '3px solid white' : 'none',
                                            boxShadow: form.cor === c.value ? `0 0 0 3px ${c.value}` : 'none',
                                            transition: 'all 0.15s',
                                            '&:hover': { transform: 'scale(1.2)' },
                                        }}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                    <Button
                        onClick={() => setOpenDialog(false)}
                        sx={{ color: '#6b7a99', fontWeight: 600, textTransform: 'none', borderRadius: '10px', px: 2 }}
                    >
                        Cancelar
                    </Button>
                    <motion.div whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                background: `linear-gradient(135deg, ${form.cor} 0%, ${form.cor}cc 100%)`,
                                color: 'white',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '12px',
                                py: 1.4,
                                fontSize: '0.95rem',
                                boxShadow: `0 4px 16px ${form.cor}55`,
                                '&:hover': { boxShadow: `0 6px 20px ${form.cor}77` },
                            }}
                        >
                            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editingAnotacao ? 'Salvar Alterações' : 'Criar Anotação')}
                        </Button>
                    </motion.div>
                </DialogActions>
            </Dialog>

            {/* ─── Dialog confirmar delete ──────────────────────────────────── */}
            <Dialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Trash2 size={20} color="#e74c3c" /> Excluir Anotação
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#4a5568' }}>
                        Deseja excluir <strong>"{confirmDelete?.titulo}"</strong>? Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDelete}
                        sx={{ background: '#e74c3c', '&:hover': { background: '#c0392b' }, textTransform: 'none', fontWeight: 700 }}
                    >
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FuncionarioAnotacoes;
