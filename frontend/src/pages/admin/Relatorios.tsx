import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, TextField, MenuItem, Button, Collapse, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Filter, X, DollarSign, Users, TrendingUp, BarChart3, Activity, MapPin, RefreshCw, Calendar } from 'lucide-react';
import api from '../../services/api';
// import analyticsService from '../../services/analytics'; // Não usado - usando dados locais
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
    const [filterNomeAcao, setFilterNomeAcao] = useState('');
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
            let inscricoesData: any[] = [];
            try {
                const inscricoesRes = await api.get('/inscricoes');
                setInscricoes(inscricoesRes.data);
                inscricoesData = inscricoesRes.data;
            } catch (inscError) {
                console.warn('⚠️ Erro ao buscar inscrições:', inscError);
                setInscricoes([]);
            }

            // Carregar dados de analytics (BI) - COMENTADO: dependem de resultados_exames
            // Vamos usar os dados de ações e inscrições que já temos
            const totalInscricoes = inscricoesData.length;
            // const inscricoesAtendidas = inscricoesData.filter((i: any) => i.status === 'atendido').length;

            // Cidades únicas das ações
            const cidadesUnicas = new Set(acoesComDetalhes.map((a: any) => a.municipio));

            // Criar métricas baseadas em dados reais
            const dashboardMetrics = {
                totalExames: totalInscricoes, // Total de inscrições como proxy
                examesMes: inscricoesData.filter((i: any) => {
                    const dataInscricao = new Date(i.created_at);
                    const mesAtual = new Date().getMonth();
                    const anoAtual = new Date().getFullYear();
                    return dataInscricao.getMonth() === mesAtual && dataInscricao.getFullYear() === anoAtual;
                }).length,
                cidadesAtendidas: cidadesUnicas.size,
            };

            setMetrics(dashboardMetrics);

            // Gráficos baseados em inscrições e ações

            // Inscrições por cidade (baseado nas ações)
            const inscricoesPorCidade = acoesComDetalhes.reduce((acc: any, acao: any) => {
                const key = acao.municipio;
                const inscricoesAcao = inscricoesData.filter((i: any) => i.acao_id === acao.id);
                if (!acc[key]) {
                    acc[key] = { municipio: key, quantidade: 0 };
                }
                acc[key].quantidade += inscricoesAcao.length;
                return acc;
            }, {});

            // Buscar dados de cidadãos para gráficos de gênero e idade
            let cidadaosData: any[] = [];
            try {
                const cidadaosRes = await api.get('/cidadaos');
                // Garantir que seja um array
                cidadaosData = Array.isArray(cidadaosRes.data) ? cidadaosRes.data : (cidadaosRes.data.cidadaos || []);

            } catch (error) {
                console.warn('⚠️ Erro ao buscar cidadãos:', error);
            }

            // Criar mapa de cidadãos por ID
            const cidadaosMap = cidadaosData.reduce((acc: any, c: any) => {
                acc[c.id] = c;
                return acc;
            }, {});

            // Inscrições por tipo (baseado no tipo da ação)
            const inscricoesPorTipo = acoesComDetalhes.reduce((acc: any, acao: any) => {
                const tipo = acao.tipo || 'Geral';
                const inscricoesAcao = inscricoesData.filter((i: any) => i.acao_id === acao.id);
                if (!acc[tipo]) {
                    acc[tipo] = { tipo_exame: tipo, nome_exame: tipo, quantidade: 0 };
                }
                acc[tipo].quantidade += inscricoesAcao.length;
                return acc;
            }, {});

            // Inscrições por gênero
            const inscricoesPorGenero = inscricoesData.reduce((acc: any, inscricao: any) => {
                const cidadao = cidadaosMap[inscricao.cidadao_id];
                if (cidadao && cidadao.genero) {
                    const genero = cidadao.genero;
                    if (!acc[genero]) {
                        acc[genero] = { genero, quantidade: 0 };
                    }
                    acc[genero].quantidade++;
                }
                return acc;
            }, {});

            // Inscrições por faixa etária
            const inscricoesPorIdade = inscricoesData.reduce((acc: any, inscricao: any) => {
                const cidadao = cidadaosMap[inscricao.cidadao_id];
                if (cidadao && cidadao.data_nascimento) {
                    const idade = new Date().getFullYear() - new Date(cidadao.data_nascimento).getFullYear();
                    let faixa = '60+';
                    if (idade < 18) faixa = '0-17';
                    else if (idade >= 18 && idade <= 29) faixa = '18-29';
                    else if (idade >= 30 && idade <= 39) faixa = '30-39';
                    else if (idade >= 40 && idade <= 49) faixa = '40-49';
                    else if (idade >= 50 && idade <= 59) faixa = '50-59';

                    if (!acc[faixa]) {
                        acc[faixa] = { faixa_etaria: faixa, quantidade: 0 };
                    }
                    acc[faixa].quantidade++;
                }
                return acc;
            }, {});


            setExamesPorTipo(Object.values(inscricoesPorTipo));
            setExamesPorCidade(Object.values(inscricoesPorCidade));
            setExamesPorGenero(Object.values(inscricoesPorGenero));
            setExamesPorIdade(Object.values(inscricoesPorIdade));

            // Debug detalhado
            console.log('📊 Dados de gênero:', Object.values(inscricoesPorGenero));
            console.log('👥 Cidadãos por inscrição:', inscricoesData.map((i: any) => {
                const c = cidadaosMap[i.cidadao_id];
                return { nome: c?.nome, genero: c?.genero, generoType: typeof c?.genero };
            }));
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAcoes = acoes.filter((acao: any) => {
        const matchesNomeAcao = !filterNomeAcao || (acao.nome && acao.nome.toLowerCase().includes(filterNomeAcao.toLowerCase()));
        const matchesTipo = !filterTipo || acao.tipo === filterTipo;
        const matchesStatus = !filterStatus || acao.status === filterStatus;
        const matchesMunicipio = !filterMunicipio || acao.municipio.toLowerCase().includes(filterMunicipio.toLowerCase());
        const matchesEstado = !filterEstado || acao.estado.toLowerCase().includes(filterEstado.toLowerCase());
        const matchesDataInicio = !filterDataInicio || new Date(acao.data_inicio) >= new Date(filterDataInicio);
        const matchesDataFim = !filterDataFim || new Date(acao.data_fim) <= new Date(filterDataFim);
        const custo = acao.resumo_financeiro?.custo_total || 0;
        const matchesCustoMin = !filterCustoMin || custo >= parseFloat(filterCustoMin);
        const matchesCustoMax = !filterCustoMax || custo <= parseFloat(filterCustoMax);

        return matchesNomeAcao && matchesTipo && matchesStatus && matchesMunicipio && matchesEstado &&
            matchesDataInicio && matchesDataFim && matchesCustoMin && matchesCustoMax;
    });

    const clearFilters = () => {
        setFilterNomeAcao('');
        setFilterTipo('');
        setFilterStatus('');
        setFilterMunicipio('');
        setFilterEstado('');
        setFilterDataInicio('');
        setFilterDataFim('');
        setFilterCustoMin('');
        setFilterCustoMax('');
    };

    const hasActiveFilters = filterNomeAcao || filterTipo || filterStatus || filterMunicipio || filterEstado ||
        filterDataInicio || filterDataFim || filterCustoMin || filterCustoMax;

    const activeFilterCount = [filterNomeAcao, filterTipo, filterStatus, filterMunicipio, filterEstado,
        filterDataInicio, filterDataFim, filterCustoMin, filterCustoMax].filter(Boolean).length;

    const totalCusto = filteredAcoes.reduce((acc, acao: any) => acc + (acao.resumo_financeiro?.custo_total || 0), 0);
    const totalAtendidos = filteredAcoes.reduce((acc, acao: any) => acc + (acao.resumo_financeiro?.atendidos || 0), 0);

    const custoPorMunicipio = filteredAcoes.reduce((acc: any, acao: any) => {
        const key = acao.municipio;
        if (!acc[key]) {
            acc[key] = { name: key, custo: 0, atendidos: 0, acoes: [] };
        }
        const custoAcao = acao.resumo_financeiro?.custo_total || 0;
        acc[key].custo += custoAcao;
        acc[key].atendidos += acao.resumo_financeiro?.atendidos || 0;
        // Adicionar detalhes da ação para o tooltip
        acc[key].acoes.push({
            nome: acao.nome,
            custo: custoAcao,
            atendidos: acao.resumo_financeiro?.atendidos || 0
        });
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fa' }}>
                <CircularProgress sx={{ color: expressoTheme.colors.primaryDark }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: '#f5f7fa', py: 4 }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, mb: 0.5 }}>
                                Relatórios e Business Intelligence
                            </Typography>
                            <Typography sx={{ color: '#64748b' }}>
                                Análise completa de custos, atendimentos e métricas
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                size="small"
                                value={filtros.mes}
                                onChange={(e) => setFiltros({ ...filtros, mes: Number(e.target.value) })}
                                sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }}
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
                                sx={{ minWidth: 100, '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }}
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </TextField>
                            <Button
                                onClick={carregarTodosDados}
                                sx={{ minWidth: 'auto', p: 1.5, background: 'white', color: expressoTheme.colors.primaryDark, borderRadius: '8px', border: '1px solid #e2e8f0', '&:hover': { background: '#f1f5f9' } }}
                            >
                                <RefreshCw size={20} />
                            </Button>
                        </Box>
                    </Box>
                </motion.div>

                {/* Filtros de Ações */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Button startIcon={<Filter size={18} />} onClick={() => setShowFilters(!showFilters)} sx={{ color: 'white', textTransform: 'none', background: expressoTheme.gradients.primary, '&:hover': { background: expressoTheme.colors.primaryDark } }}>
                                Filtros de Ações{hasActiveFilters && ` (${activeFilterCount})`}
                            </Button>
                            {hasActiveFilters && (
                                <Button startIcon={<X size={18} />} onClick={clearFilters} sx={{ color: expressoTheme.colors.primaryDark, textTransform: 'none', '&:hover': { background: '#f1f5f9' } }}>
                                    Limpar
                                </Button>
                            )}
                        </Box>

                        <Collapse in={showFilters}>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Nome da Ação" value={filterNomeAcao} onChange={(e) => setFilterNomeAcao(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }}>
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="curso">Curso</MenuItem>
                                        <MenuItem value="saude">Saúde</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField select fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }}>
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="planejada">Planejada</MenuItem>
                                        <MenuItem value="ativa">Ativa</MenuItem>
                                        <MenuItem value="concluida">Concluída</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField fullWidth label="Município" value={filterMunicipio} onChange={(e) => setFilterMunicipio(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { background: 'white', borderRadius: '8px', '& fieldset': { borderColor: '#e2e8f0' } } }} />
                                </Grid>
                            </Grid>
                        </Collapse>

                        {hasActiveFilters && (
                            <Box sx={{ mt: 2, p: 2, background: '#f1f5f9', borderRadius: '12px' }}>
                                <Typography sx={{ fontWeight: 600, color: expressoTheme.colors.primaryDark, fontSize: '0.9rem' }}>
                                    📊 Mostrando {filteredAcoes.length} de {acoes.length} ações
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </motion.div>

                {/* Cards de Métricas Principais */}
                <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
                    {metrics && [
                        { icon: Activity, label: 'Total de Exames', value: metrics.totalExames?.toString() || '0', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
                        { icon: TrendingUp, label: 'Exames Este Mês', value: metrics.examesMes?.toString() || '0', gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)' },
                        { icon: MapPin, label: 'Cidades Atendidas', value: metrics.cidadesAtendidas?.toString() || '0', gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' },
                        { icon: DollarSign, label: 'Custo Total Ações', value: `R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
                        { icon: Users, label: 'Total Atendidos', value: totalAtendidos.toString(), gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
                        { icon: BarChart3, label: 'Custo Médio/Pessoa', value: `R$ ${totalAtendidos > 0 ? (totalCusto / totalAtendidos).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`, gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }
                    ].map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={1.7} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.05 }}
                                    whileHover={{ scale: 1.08, y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                                >
                                    <Box sx={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        border: '1px solid #e2e8f0',
                                        p: 2.5,
                                        boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.25), 0 10px 25px -10px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: card.gradient,
                                            borderRadius: '20px 20px 0 0'
                                        },
                                        '&:hover': {
                                            boxShadow: '0 30px 60px -15px rgba(59, 130, 246, 0.35), 0 15px 35px -10px rgba(0,0,0,0.15)',
                                            transform: 'translateY(-4px)'
                                        }
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: 1.5,
                                            borderRadius: '16px',
                                            background: card.gradient,
                                            boxShadow: `0 12px 24px ${card.gradient.match(/#[0-9A-F]{6}/i)?.[0]}50, inset 0 -2px 8px rgba(0,0,0,0.2)`,
                                            mb: 1.5,
                                            position: 'relative',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: '10%',
                                                left: '10%',
                                                right: '50%',
                                                bottom: '50%',
                                                background: 'rgba(255,255,255,0.3)',
                                                borderRadius: '50%',
                                                filter: 'blur(4px)'
                                            }
                                        }}>
                                            <Icon size={22} color="white" style={{ position: 'relative', zIndex: 1 }} />
                                        </Box>
                                        <Typography sx={{
                                            color: '#64748b',
                                            fontSize: '0.72rem',
                                            mb: 0.8,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {card.label}
                                        </Typography>
                                        <Typography variant="h6" sx={{
                                            color: '#1e293b',
                                            fontWeight: 800,
                                            fontSize: '1.15rem',
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {card.value}
                                        </Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Gráficos - Linha 1: Custos e Atendimentos */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={8}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            style={{ position: 'relative', zIndex: 10 }}
                        >
                            <Box sx={{
                                background: 'white',
                                borderRadius: '20px',
                                border: '1px solid #e2e8f0',
                                p: 3,
                                height: 400,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                position: 'relative',
                                overflow: 'visible'
                            }}>
                                <Typography variant="h6" sx={{
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    mb: 2.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    fontSize: '1.1rem',
                                    letterSpacing: '-0.02em'
                                }}>
                                    <Box sx={{
                                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                        borderRadius: '12px',
                                        p: 1,
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                                    }}>
                                        <BarChart3 size={20} color="white" />
                                    </Box>
                                    Custos por Município
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={dataCustos}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11, fill: '#1e293b' }} />
                                        <YAxis tick={{ fill: '#1e293b' }} />
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                                            contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                            border: '2px solid #3B82F6',
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1)',
                                                            minWidth: '280px',
                                                            maxWidth: '350px'
                                                        }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '12px',
                                                                fontWeight: 700,
                                                                fontSize: '15px',
                                                                letterSpacing: '-0.02em',
                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                                            }}>
                                                                📍 {data.name}
                                                            </div>

                                                            <div style={{ marginBottom: '12px' }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '6px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>💰 Custo Total</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 800 }}>
                                                                        R$ {data.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>👥 Atendidos</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 800 }}>{data.atendidos}</span>
                                                                </div>
                                                            </div>

                                                            {data.acoes && data.acoes.length > 0 && (
                                                                <>
                                                                    <div style={{
                                                                        borderTop: '2px solid #e2e8f0',
                                                                        paddingTop: '12px',
                                                                        marginTop: '12px'
                                                                    }}>
                                                                        <p style={{
                                                                            fontWeight: 700,
                                                                            fontSize: '13px',
                                                                            marginBottom: '8px',
                                                                            color: '#3B82F6',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.5px'
                                                                        }}>
                                                                            📋 Ações Realizadas
                                                                        </p>
                                                                        {data.acoes.map((acao: any, idx: number) => (
                                                                            <div key={idx} style={{
                                                                                fontSize: '12px',
                                                                                marginBottom: '6px',
                                                                                padding: '6px 10px',
                                                                                background: 'white',
                                                                                borderRadius: '6px',
                                                                                borderLeft: '3px solid #3B82F6',
                                                                                color: '#475569'
                                                                            }}>
                                                                                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>
                                                                                    {acao.nome}
                                                                                </div>
                                                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                                                    💵 R$ {acao.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} •
                                                                                    👤 {acao.atendidos} {acao.atendidos === 1 ? 'atendido' : 'atendidos'}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="custo" name="Custo Total (R$)" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, height: 400, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                            <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, height: 400, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                        borderRadius: '12px',
                                        p: 1,
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        <BarChart3 size={20} color="white" />
                                    </Box>
                                    Exames por Tipo
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={examesPorTipo}>
                                        <defs>
                                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                        <XAxis dataKey="nome_exame" tick={{ fontSize: 10, fill: '#1e293b' }} angle={-15} textAnchor="end" height={80} />
                                        <YAxis tick={{ fill: '#1e293b' }} />
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                            border: '2px solid #3B82F6',
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1)',
                                                            minWidth: '220px'
                                                        }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '12px',
                                                                fontWeight: 700,
                                                                fontSize: '14px',
                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                                            }}>
                                                                📋 {data.nome_exame}
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '10px 12px',
                                                                background: '#f1f5f9',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📊 Quantidade</span>
                                                                <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{data.quantidade}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="quantidade" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                            <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, height: 400, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                                        borderRadius: '12px',
                                        p: 1,
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                                    }}>
                                        <MapPin size={20} color="white" />
                                    </Box>
                                    Exames por Cidade
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={examesPorCidade} cx="50%" cy="50%" labelLine={false} label={({ municipio, percent }) => `${municipio} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="quantidade">
                                            {examesPorCidade.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    const percent = (payload[0] as any).percent || 0;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                            border: '2px solid #10B981',
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1)',
                                                            minWidth: '220px'
                                                        }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '12px',
                                                                fontWeight: 700,
                                                                fontSize: '14px',
                                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                                            }}>
                                                                📍 {data.municipio}
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '6px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📊 Exames</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{data.quantidade}</span>
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📈 Percentual</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{(percent * 100).toFixed(1)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
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
                            <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, height: 400, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                        borderRadius: '12px',
                                        p: 1,
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
                                    }}>
                                        <Users size={20} color="white" />
                                    </Box>
                                    Distribuição por Gênero
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={examesPorGenero} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="quantidade" label>
                                            {examesPorGenero.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    const percent = (payload[0] as any).percent || 0;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                            border: '2px solid #F59E0B',
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px -10px rgba(245, 158, 11, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1)',
                                                            minWidth: '220px'
                                                        }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '12px',
                                                                fontWeight: 700,
                                                                fontSize: '14px',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                                            }}>
                                                                👥 {data.genero}
                                                            </div>
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '6px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📊 Quantidade</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{data.quantidade}</span>
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '8px 12px',
                                                                    background: '#f1f5f9',
                                                                    borderRadius: '8px'
                                                                }}>
                                                                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📈 Percentual</span>
                                                                    <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{(percent * 100).toFixed(1)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                            <Box sx={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', p: 3, height: 400, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <Typography variant="h6" sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                        borderRadius: '12px',
                                        p: 1,
                                        display: 'flex',
                                        boxShadow: '0 8px 16px rgba(67, 233, 123, 0.3)'
                                    }}>
                                        <Calendar size={20} color="white" />
                                    </Box>
                                    Distribuição por Faixa Etária
                                </Typography>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={examesPorIdade}>
                                        <defs>
                                            <linearGradient id="colorAge" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                        <XAxis dataKey="faixa_etaria" tick={{ fill: '#1e293b' }} />
                                        <YAxis tick={{ fill: '#1e293b' }} />
                                        <Tooltip
                                            wrapperStyle={{ zIndex: 9999, overflow: 'visible' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                                            border: '2px solid #10B981',
                                                            borderRadius: '16px',
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 10px 20px -5px rgba(0,0,0,0.1)',
                                                            minWidth: '220px'
                                                        }}>
                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                marginBottom: '12px',
                                                                fontWeight: 700,
                                                                fontSize: '14px',
                                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                                            }}>
                                                                📅 {data.faixa_etaria}
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '10px 12px',
                                                                background: '#f1f5f9',
                                                                borderRadius: '8px'
                                                            }}>
                                                                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>📊 Quantidade</span>
                                                                <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>{data.quantidade}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
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
