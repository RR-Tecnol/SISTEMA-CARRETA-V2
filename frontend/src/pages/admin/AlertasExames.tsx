import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CheckCircle, Lock, Search, RefreshCw,
    User, Calendar, Activity, ChevronRight, Bell, Zap, XCircle
} from 'lucide-react';
import api from '../../services/api';
import './AlertasExames.css';

type TipoAlerta = 'todos' | 'vencido' | 'vencendo' | 'pendente' | 'bloqueado';

interface AlertaCidadao {
    tipo: 'vencido' | 'vencendo' | 'pendente' | 'bloqueado';
    cidadao: { id: string; nome: string; cpf: string; telefone: string };
    curso_exame_id: string;
    nome_exame: string;
    nome_acao: string;
    numero_acao?: string | number;
    data_ultimo_exame?: string;
    data_inscricao?: string;
    data_vencimento?: string;
    dias_atraso?: number;
    dias_restantes?: number;
    mensagem: string;
    urgente?: boolean;
}

interface Resumo {
    total_vencidos: number;
    total_vencendo: number;
    total_pendentes: number;
    total_bloqueados: number;
    total_geral: number;
}

const tipoConfig = {
    vencido: {
        label: 'Vencidos',
        icon: XCircle,
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        glow: '0 4px 12px rgba(239,68,68,0.15)',
    },
    vencendo: {
        label: 'Vencendo em Breve',
        icon: Clock,
        color: '#d97706',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        bg: 'rgba(217,119,6,0.08)',
        border: 'rgba(217,119,6,0.25)',
        glow: '0 4px 12px rgba(217,119,6,0.15)',
    },
    pendente: {
        label: 'Pendentes',
        icon: Clock,
        color: '#4682b4',
        gradient: 'linear-gradient(135deg, #4682b4, #5b9bd5)',
        bg: 'rgba(70,130,180,0.08)',
        border: 'rgba(70,130,180,0.25)',
        glow: '0 4px 12px rgba(70,130,180,0.15)',
    },
    bloqueado: {
        label: 'Bloqueados',
        icon: Lock,
        color: '#475569',
        gradient: 'linear-gradient(135deg, #475569, #334155)',
        bg: 'rgba(71,85,105,0.08)',
        border: 'rgba(71,85,105,0.25)',
        glow: '0 4px 12px rgba(71,85,105,0.15)',
    },
};

const AlertasExames: React.FC = () => {
    const [alertas, setAlertas] = useState<AlertaCidadao[]>([]);
    const [resumo, setResumo] = useState<Resumo | null>(null);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<TipoAlerta>('todos');
    const [busca, setBusca] = useState('');

    const carregarAlertas = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/alertas/admin/dashboard');
            setAlertas(res.data.alertas || []);
            setResumo(res.data.resumo);
        } catch (e) {
            console.error('Erro ao carregar alertas:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarAlertas();
    }, [carregarAlertas]);

    const alertasFiltrados = alertas.filter(a => {
        const matchTipo = filtroTipo === 'todos' || a.tipo === filtroTipo;
        const matchBusca = !busca ||
            a.cidadao?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            a.nome_exame?.toLowerCase().includes(busca.toLowerCase()) ||
            a.nome_acao?.toLowerCase().includes(busca.toLowerCase());
        return matchTipo && matchBusca;
    });

    const tabs: { key: TipoAlerta; label: string; count: number; icon: React.ElementType; color: string }[] = [
        { key: 'todos', label: 'Todos', count: resumo?.total_geral || 0, icon: Bell, color: '#4682b4' },
        { key: 'vencido', label: 'Vencidos', count: resumo?.total_vencidos || 0, icon: XCircle, color: '#ef4444' },
        { key: 'vencendo', label: 'Vencendo', count: resumo?.total_vencendo || 0, icon: Clock, color: '#d97706' },
        { key: 'pendente', label: 'Pendentes', count: resumo?.total_pendentes || 0, icon: Activity, color: '#4682b4' },
        { key: 'bloqueado', label: 'Bloqueados', count: resumo?.total_bloqueados || 0, icon: Lock, color: '#475569' },
    ];

    return (
        <div className="alertas-page">
            {/* Fundo animado */}
            <div className="alertas-bg">
                <div className="alertas-orb orb-1" />
                <div className="alertas-orb orb-2" />
                <div className="alertas-orb orb-3" />
            </div>

            <div className="alertas-inner">
                {/* Header */}
                <motion.div
                    className="alertas-header"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 90 }}
                >
                    <div className="alertas-title-wrap">
                        <motion.div
                            className="alertas-icon-main"
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
                        >
                            <Bell size={28} />
                        </motion.div>
                        <div>
                            <h1 className="alertas-title">Central de Alertas</h1>
                            <p className="alertas-subtitle">Monitoramento de periodicidade e pendências de exames</p>
                        </div>
                    </div>
                    <motion.button
                        className="alertas-refresh-btn"
                        onClick={carregarAlertas}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                    >
                        <motion.div
                            animate={loading ? { rotate: 360 } : { rotate: 0 }}
                            transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
                        >
                            <RefreshCw size={18} />
                        </motion.div>
                        Atualizar
                    </motion.button>
                </motion.div>

                {/* Cards de resumo */}
                <motion.div
                    className="alertas-summary-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {Object.entries(tipoConfig).map(([key, cfg], i) => {
                        const count = resumo ? (resumo as any)[`total_${key}s`] || 0 : 0;
                        const Icon = cfg.icon;
                        return (
                            <motion.div
                                key={key}
                                className={`summary-card ${key === 'vencido' && count > 0 ? 'summary-card--pulse' : ''}`}
                                style={{ '--card-color': cfg.color, '--card-gradient': cfg.gradient } as any}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + i * 0.08, type: 'spring' }}
                                whileHover={{ y: -4, boxShadow: cfg.glow }}
                                onClick={() => setFiltroTipo(key as TipoAlerta)}
                            >
                                <div className="summary-card-icon">
                                    <Icon size={22} />
                                </div>
                                <div className="summary-card-info">
                                    <span className="summary-card-count">{count}</span>
                                    <span className="summary-card-label">{cfg.label}</span>
                                </div>
                                {key === 'vencido' && count > 0 && (
                                    <motion.div
                                        className="summary-card-badge"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        <Zap size={12} />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Tabs + Búsqueda */}
                <motion.div
                    className="alertas-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="alertas-tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const ativo = filtroTipo === tab.key;
                            return (
                                <motion.button
                                    key={tab.key}
                                    className={`alertas-tab ${ativo ? 'alertas-tab--ativo' : ''}`}
                                    style={ativo ? { '--tab-color': tab.color } as any : {}}
                                    onClick={() => setFiltroTipo(tab.key)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="alertas-tab-badge" style={{ background: tab.color }}>
                                            {tab.count}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="alertas-search">
                        <Search size={16} className="alertas-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por cidadão, exame ou ação..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="alertas-search-input"
                        />
                    </div>
                </motion.div>

                {/* Lista de alertas */}
                <div className="alertas-list-wrap">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                className="alertas-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="alertas-spinner" />
                                <p>Calculando periodicidades...</p>
                            </motion.div>
                        ) : alertasFiltrados.length === 0 ? (
                            <motion.div
                                key="empty"
                                className="alertas-empty"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <CheckCircle size={64} className="alertas-empty-icon" />
                                <h3>Nenhum alerta encontrado</h3>
                                <p>
                                    {filtroTipo === 'todos'
                                        ? 'Todos os exames estão em dia!'
                                        : `Nenhum alerta do tipo "${filtroTipo}" encontrado.`}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                className="alertas-list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {alertasFiltrados.map((alerta, idx) => {
                                    const cfg = tipoConfig[alerta.tipo];
                                    const Icon = cfg.icon;

                                    return (
                                        <motion.div
                                            key={`${alerta.cidadao?.id}-${alerta.curso_exame_id}-${idx}`}
                                            className="alerta-card"
                                            style={{
                                                '--alerta-color': cfg.color,
                                                '--alerta-bg': cfg.bg,
                                                '--alerta-border': cfg.border,
                                            } as any}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04, type: 'spring', stiffness: 100 }}
                                            whileHover={{ scale: 1.015, boxShadow: cfg.glow }}
                                        >
                                            {/* Borda esquerda colorida */}
                                            <div className="alerta-card-stripe" style={{ background: cfg.gradient }} />

                                            {/* Ícone */}
                                            <div className="alerta-card-icon-wrap">
                                                <div className="alerta-card-icon" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                                    <Icon size={22} style={{ color: cfg.color }} />
                                                </div>
                                            </div>

                                            {/* Conteúdo principal */}
                                            <div className="alerta-card-content">
                                                <div className="alerta-card-top">
                                                    <div className="alerta-card-exame">
                                                        <span className="alerta-card-exame-nome">{alerta.nome_exame}</span>
                                                        <span
                                                            className="alerta-card-tipo-badge"
                                                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                                                        >
                                                            {cfg.label}
                                                        </span>
                                                        {alerta.urgente && (
                                                            <motion.span
                                                                className="alerta-card-urgente"
                                                                animate={{ opacity: [1, 0.5, 1] }}
                                                                transition={{ repeat: Infinity, duration: 1.2 }}
                                                            >
                                                                ⚡ URGENTE
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                    <p className="alerta-card-mensagem">{alerta.mensagem}</p>
                                                </div>

                                                <div className="alerta-card-bottom">
                                                    <div className="alerta-card-meta">
                                                        <span className="alerta-meta-item">
                                                            <User size={13} />
                                                            <strong>{alerta.cidadao?.nome}</strong>
                                                        </span>
                                                        <span className="alerta-meta-item alerta-meta-cpf">
                                                            CPF: {alerta.cidadao?.cpf}
                                                        </span>
                                                        <span className="alerta-meta-item">
                                                            <Activity size={13} />
                                                            Ação #{alerta.numero_acao || 'N/A'} — {alerta.nome_acao}
                                                        </span>
                                                        {alerta.data_vencimento && (
                                                            <span className="alerta-meta-item">
                                                                <Calendar size={13} />
                                                                Vence: {new Date(alerta.data_vencimento).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                        {alerta.data_ultimo_exame && (
                                                            <span className="alerta-meta-item">
                                                                <Calendar size={13} />
                                                                Último: {new Date(alerta.data_ultimo_exame).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Barra de progresso para "vencendo" */}
                                                    {alerta.tipo === 'vencendo' && alerta.dias_restantes !== undefined && (
                                                        <div className="alerta-progress-wrap">
                                                            <span className="alerta-progress-label">
                                                                {alerta.dias_restantes}d restantes
                                                            </span>
                                                            <div className="alerta-progress-bar">
                                                                <motion.div
                                                                    className="alerta-progress-fill"
                                                                    style={{ background: cfg.gradient }}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.max(5, Math.min(100, (alerta.dias_restantes / 30) * 100))}%` }}
                                                                    transition={{ delay: idx * 0.04 + 0.3, duration: 0.8 }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dias de atraso para "vencido" */}
                                                    {alerta.tipo === 'vencido' && alerta.dias_atraso !== undefined && (
                                                        <div className="alerta-atraso">
                                                            <motion.span
                                                                style={{ color: cfg.color }}
                                                                animate={{ scale: [1, 1.05, 1] }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                            >
                                                                ⚠ {alerta.dias_atraso} dias em atraso
                                                            </motion.span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <ChevronRight size={18} className="alerta-card-arrow" style={{ color: cfg.color }} />
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AlertasExames;
