import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, TrendingUp, Users, MapPin, RefreshCw
} from 'lucide-react';
import analyticsService from '../../services/analytics';
import './BI.css';

const BI: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [examesPorTipo, setExamesPorTipo] = useState<any[]>([]);
    const [examesPorCidade, setExamesPorCidade] = useState<any[]>([]);
    const [examesPorGenero, setExamesPorGenero] = useState<any[]>([]);
    const [, setExamesPorRaca] = useState<any[]>([]);
    const [examesPorIdade, setExamesPorIdade] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtros, setFiltros] = useState({
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
    });

    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

    useEffect(() => {
        carregarDados();
    }, [filtros]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [dashboard, porTipo, porCidade, porGenero, porRaca, porIdade] = await Promise.all([
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
            setExamesPorRaca(porRaca);
            setExamesPorIdade(porIdade);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100
            }
        }
    };

    return (
        <div className="bi-container">
            {/* Animated Background */}
            <div className="bi-background">
                <div className="gradient-orb orb-1" />
                <div className="gradient-orb orb-2" />
                <div className="gradient-orb orb-3" />
            </div>

            {/* Header */}
            <motion.div
                className="bi-header"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
            >
                <div className="header-content">
                    <div className="header-title">
                        <motion.div
                            className="icon-wrapper"
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Activity size={32} />
                        </motion.div>
                        <div>
                            <h1>Business Intelligence</h1>
                            <p>Analytics em tempo real</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <select
                            className="filter-select-bi"
                            value={filtros.mes}
                            onChange={(e) => setFiltros({ ...filtros, mes: Number(e.target.value) })}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>
                                    {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="filter-select-bi"
                            value={filtros.ano}
                            onChange={(e) => setFiltros({ ...filtros, ano: Number(e.target.value) })}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <motion.button
                            className="btn-refresh"
                            onClick={carregarDados}
                            whileHover={{ scale: 1.05, rotate: 180 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <RefreshCw size={20} />
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Metrics Cards */}
            <motion.div
                className="metrics-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {metrics && [
                    {
                        icon: Activity,
                        label: 'Total de Exames',
                        value: metrics.totalExames,
                        color: '#3B82F6',
                        gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                    },
                    {
                        icon: TrendingUp,
                        label: 'Exames Este Mês',
                        value: metrics.examesMes,
                        color: '#10B981',
                        gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
                    },
                    {
                        icon: MapPin,
                        label: 'Cidades Atendidas',
                        value: metrics.cidadesAtendidas,
                        color: '#F59E0B',
                        gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
                    },
                    {
                        icon: Users,
                        label: 'Crescimento',
                        value: '+12%',
                        color: '#EC4899',
                        gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
                    },
                ].map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <motion.div
                            key={index}
                            className="metric-card"
                            variants={itemVariants}
                            whileHover={{
                                y: -10,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
                            }}
                            style={{ background: metric.gradient }}
                        >
                            <div className="metric-icon">
                                <Icon size={28} />
                            </div>
                            <div className="metric-content">
                                <span className="metric-label">{metric.label}</span>
                                <motion.span
                                    className="metric-value"
                                    key={metric.value}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    {metric.value.toLocaleString('pt-BR')}
                                </motion.span>
                            </div>
                            <div className="metric-glow" style={{ background: metric.color }} />
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Charts Grid */}
            <motion.div
                className="charts-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Exames por Tipo */}
                <motion.div className="chart-card" variants={itemVariants}>
                    <div className="chart-header">
                        <h3>📊 Exames por Tipo</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={examesPorTipo}>
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="nome_exame" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(20px)'
                                }}
                            />
                            <Bar dataKey="quantidade" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Exames por Cidade */}
                <motion.div className="chart-card" variants={itemVariants}>
                    <div className="chart-header">
                        <h3>🗺️ Exames por Cidade</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={examesPorCidade}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ municipio, percent }) => `${municipio} ${(percent * 100).toFixed(0)}% `}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="quantidade"
                            >
                                {examesPorCidade.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Exames por Gênero */}
                <motion.div className="chart-card" variants={itemVariants}>
                    <div className="chart-header">
                        <h3>👥 Distribuição por Gênero</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={examesPorGenero}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="quantidade"
                                label
                            >
                                {examesPorGenero.map((_, index) => (
                                    <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Exames por Idade */}
                <motion.div className="chart-card chart-card-wide" variants={itemVariants}>
                    <div className="chart-header">
                        <h3>📈 Distribuição por Faixa Etária</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={examesPorIdade}>
                            <defs>
                                <linearGradient id="colorAge" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="faixa_etaria" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px'
                                }}
                            />
                            <Bar dataKey="quantidade" fill="url(#colorAge)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </motion.div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        className="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="loading-content">
                            <motion.div
                                className="loading-spinner-bi"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p>Carregando analytics...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BI;
