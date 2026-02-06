import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, MenuItem, Button, Collapse, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Filter, X, DollarSign, Users, TrendingUp, BarChart3, Activity, MapPin, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import analyticsService from '../../services/analytics';
import { expressoTheme } from '../../theme/expressoTheme';

const STATUS_COLORS = {
    atendidos: '#10b981',
    pendentes: '#f59e0b',
    faltou: '#ef4444'
};

const CHART_COLORS = [expressoTheme.colors.primary, expressoTheme.colors.primaryDark, expressoTheme.colors.success, expressoTheme.colors.warning, expressoTheme.colors.danger, expressoTheme.colors.info, expressoTheme.colors.primaryLight];

const Relatorios: React.FC = () => {
    const [acoes, setAcoes] = useState<any[]>([]);
    const [inscricoes, setInscricoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Estados de Analytics (da BI)
    const [metrics, setMetrics] = useState<any>(null);
    const [examesPorTipo, setExamesPorTipo] = useState<any[]>([]);
    const [examesPorCidade, setExamesPorCidade] = useState<any[]>([]);
    const [examesPorGenero, setExamesPorGenero] = useState<any[]>([]);
    const [examesPorIdade, setExamesPorIdade] = useState<any[]>([]);
    const [filtros, setFiltros] = useState({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
    });

    // Estados dos filtros de ações
    const [filterNumeroAcao, setFilterNumeroAcao] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMunicipio, setFilterMunicipio] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterDataInicio, setFilterDataInicio] = useState('');
    const [filterDataFim, setFilterDataFim] = useState('');
    const [filterCustoMin, setFilterCustoMin] = useState('');
    const [filterCustoMax, setFilterCustoMax] = useState('');

    useEffect(() => {
        carregarTodosDados();
    }, [filtros]);

    const carregarTodosDados = async () => {
        setLoading(true);
        try {
            // Carregar dados de ações
            const acoesRes = await api.get('/acoes');
            const acoesComDetalhes = await Promise.all(
                acoesRes.data.map(async (acao: any) => {
                    const detail = await api.get(`/acoes/${acao.id}`);
                    return detail.data;
                })
            );
            setAcoes(acoesComDetalhes);

            // Carregar inscrições
            try {
                const inscricoesRes = await api.get('/inscricoes');
                setInscricoes(inscricoesRes.data);
            } catch (inscError) {
                console.warn('⚠️ Erro ao buscar inscrições:', inscError);
                setInscricoes([]);
            }

            // Carregar dados de analytics (BI)
            const [dashboard, porTipo, porCidade, porGenero, , porIdade] = await Promise.all([
                analyticsService.dashboard(filtros.mes, filtros.ano),
                analyticsService.examesPorTipo(),
                analyticsService.examesPorCidade(),
                analyticsService.examesPorGenero(),
                analyticsService.examesPorRaca(),
                analyticsService.examesPorIdade(),
            ]);

            setMetrics(dashboard);
            setExamesPorTipo(porTipo);
            setExamesPorCidade(porCidade);
            setExamesPorGenero(porGenero);
            setExamesPorIdade(porIdade);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAcoes = acoes.filter((acao: any) => {
        const matchesNumeroAcao = !filterNumeroAcao || (acao.numero_acao && acao.numero_acao.toString() === filterNumeroAcao);
        const matchesTipo = !filterTipo || acao.tipo === filterTipo;
        const matchesStatus = !filterStatus || acao.status === filterStatus;
        const matchesMunicipio = !filterMunicipio || acao.municipio.toLowerCase().includes(filterMunicipio.toLowerCase());
        const matchesEstado = !filterEstado || acao.estado.toLowerCase().includes(filterEstado.toLowerCase());
        const matchesDataInicio = !filterDataInicio || new Date(acao.data_inicio) >= new Date(filterDataInicio);
        const matchesDataFim = !filterDataFim || new Date(acao.data_fim) <= new Date(filterDataFim);
        const custo = acao.resumo_financeiro?.custo_total || 0;
        const matchesCustoMin = !filterCustoMin || custo >= parseFloat(filterCustoMin);
        const matchesCustoMax = !filterCustoMax || custo <= parseFloat(filterCustoMax);

        return matchesNumeroAcao && matchesTipo && matchesStatus && matchesMunicipio && matchesEstado &&
            matchesDataInicio && matchesDataFim && matchesCustoMin && matchesCustoMax;
    });

    const clearFilters = () => {
        setFilterNumeroAcao('');
        setFilterTipo('');
        setFilterStatus('');
        setFilterMunicipio('');
        setFilterEstado('');
        setFilterDataInicio('');
        setFilterDataFim('');
        setFilterCustoMin('');
        setFilterCustoMax('');
    };

    const hasActiveFilters = filterNumeroAcao || filterTipo || filterStatus || filterMunicipio || filterEstado ||
        filterDataInicio || filterDataFim || filterCustoMin || filterCustoMax;

    const activeFilterCount = [filterNumeroAcao, filterTipo, filterStatus, filterMunicipio, filterEstado,
        filterDataInicio, filterDataFim, filterCustoMin, filterCustoMax].filter(Boolean).length;

    const totalCusto = filteredAcoes.reduce((acc, acao: any) => acc + (acao.resumo_financeiro?.custo_total || 0), 0);
    const totalAtendidos = filteredAcoes.reduce((acc, acao: any) => acc + (acao.resumo_financeiro?.atendidos || 0), 0);

    const custoPorMunicipio = filteredAcoes.reduce((acc: any, acao: any) => {
        const key = acao.municipio;
        if (!acc[key]) {
            acc[key] = { name: key, custo: 0, atendidos: 0 };
        }
        acc[key].custo += acao.resumo_financeiro?.custo_total || 0;
        acc[key].atendidos += acao.resumo_financeiro?.atendidos || 0;
        return acc;
    }, {});

    const dataCustos = Object.values(custoPorMunicipio);

    const atendimentosPorStatus = inscricoes.reduce((acc: any, inscricao: any) => {
        const status = inscricao.status || 'pendente';
        const statusKey = status === 'atendido' ? 'atendidos' : status === 'faltou' ? 'faltou' : 'pendentes';
        if (!acc[statusKey]) acc[statusKey] = 0;
        acc[statusKey]++;
        return acc;
    }, {});

    const dataAtendimentos = [
        { name: 'Atendidos', value: atendimentosPorStatus.atendidos || 0, color: STATUS_COLORS.atendidos },
        { name: 'Pendentes', value: atendimentosPorStatus.pendentes || 0, color: STATUS_COLORS.pendentes },
        { name: 'Faltou', value: atendimentosPorStatus.faltou || 0, color: STATUS_COLORS.faltou }
    ].filter(item => item.value > 0);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background }}>
                <CircularProgress sx={{ color: expressoTheme.colors.primaryDark }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 20% 50%, rgba(250, 112, 154, 0.3), transparent 50%)' } }}>
            <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5 }}>
                                Relatórios e Business Intelligence
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Análise completa de custos, atendimentos e métricas
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                size="small"
                                value={filtros.mes}
                                onChange={(e) => setFiltros({ ...filtros, mes: Number(e.target.value) })}
                                sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <MenuItem key={m} value={m}>
                                        {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                size="small"
                                value={filtros.ano}
                                onChange={(e) => setFiltros({ ...filtros, ano: Number(e.target.value) })}
                                sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }}
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </TextField>
                            <Button
                                onClick={carregarTodosDados}
                                sx={{ minWidth: 'auto', p: 1.5, background: 'rgba(255,255,255,0.2)', color: expressoTheme.colors.primaryDark, borderRadius: '8px', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
                            >
                                <RefreshCw size={20} />
                            </Button>
                        </Box>
                    </Box>
                </motion.div>

                {/* Filtros de Ações */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Button startIcon={<Filter size={18} />} onClick={() => setShowFilters(!showFilters)} sx={{ color: expressoTheme.colors.primaryDark, textTransform: 'none', background: showFilters ? 'rgba(255,255,255,0.2)' : 'transparent', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
                                Filtros de Ações{hasActiveFilters && ` (${activeFilterCount})`}
                            </Button>
                            {hasActiveFilters && (
                                <Button startIcon={<X size={18} />} onClick={clearFilters} sx={{ color: expressoTheme.colors.primaryDark, textTransform: 'none', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
                                    Limpar
                                </Button>
                            )}
                        </Box>

                        <Collapse in={showFilters}>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Número da Ação" value={filterNumeroAcao} onChange={(e) => setFilterNumeroAcao(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }}>
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="curso">Curso</MenuItem>
                                        <MenuItem value="saude">Saúde</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }}>
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="planejada">Planejada</MenuItem>
                                        <MenuItem value="ativa">Ativa</MenuItem>
                                        <MenuItem value="concluida">Concluída</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Município" value={filterMunicipio} onChange={(e) => setFilterMunicipio(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', '& fieldset': { border: 'none' } } }} />
                                </Grid>
                            </Grid>
                        </Collapse>

                        {hasActiveFilters && (
                            <Box sx={{ mt: 2, p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: '12px' }}>
                                <Typography sx={{ fontWeight: 600, color: expressoTheme.colors.primaryDark, fontSize: '0.9rem' }}>
                                    📊 Mostrando {filteredAcoes.length} de {acoes.length} ações
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </motion.div>

                {/* Cards de Métricas Principais */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {metrics && [
                        { icon: Activity, label: 'Total de Exames', value: metrics.totalExames?.toString() || '0', gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' },
                        { icon: TrendingUp, label: 'Exames Este Mês', value: metrics.examesMes?.toString() || '0', gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)' },
                        { icon: MapPin, label: 'Cidades Atendidas', value: metrics.cidadesAtendidas?.toString() || '0', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' },
                        { icon: DollarSign, label: 'Custo Total Ações', value: `R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                        { icon: Users, label: 'Total Atendidos', value: totalAtendidos.toString(), gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
                        { icon: BarChart3, label: 'Custo Médio/Pessoa', value: `R$ ${totalAtendidos > 0 ? (totalCusto / totalAtendidos).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
                    ].map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} whileHover={{ scale: 1.05, y: -5 }}>
                                    <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 2.5, position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ display: 'inline-flex', padding: 1.5, borderRadius: '12px', background: card.gradient, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', mb: 1.5 }}>
                                            <Icon size={24} color="white" />
                                        </Box>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', mb: 0.5 }}>{card.label}</Typography>
                                        <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 700 }}>{card.value}</Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Gráficos - Linha 1: Custos e Atendimentos */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={8}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BarChart3 size={20} /> Custos por Município
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={dataCustos}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11, fill: 'white' }} />
                                        <YAxis tick={{ fill: 'white' }} />
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: expressoTheme.colors.primaryDark }} />
                                        <Bar dataKey="custo" name="Custo Total (R$)" fill="#667eea" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2 }}>Distribuição de Atendimentos</Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={dataAtendimentos} cx="50%" cy="50%" labelLine={true} label={({ percent, name }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={70} dataKey="value">
                                            {dataAtendimentos.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: expressoTheme.colors.primaryDark }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* Gráficos - Linha 2: Analytics de Exames */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2 }}>📊 Exames por Tipo</Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={examesPorTipo}>
                                        <defs>
                                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                        <XAxis dataKey="nome_exame" tick={{ fontSize: 10, fill: 'white' }} angle={-15} textAnchor="end" height={80} />
                                        <YAxis tick={{ fill: 'white' }} />
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="quantidade" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2 }}>🗺️ Exames por Cidade</Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={examesPorCidade} cx="50%" cy="50%" labelLine={false} label={({ municipio, percent }) => `${municipio} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="quantidade">
                                            {examesPorCidade.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* Gráficos - Linha 3: Gênero e Idade */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2 }}>👥 Distribuição por Gênero</Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={examesPorGenero} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="quantidade" label>
                                            {examesPorGenero.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                            <Box sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', p: 3, height: 400 }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2 }}>📈 Distribuição por Faixa Etária</Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={examesPorIdade}>
                                        <defs>
                                            <linearGradient id="colorAge" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                        <XAxis dataKey="faixa_etaria" tick={{ fill: 'white' }} />
                                        <YAxis tick={{ fill: 'white' }} />
                                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="quantidade" fill="url(#colorAge)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Relatorios;
