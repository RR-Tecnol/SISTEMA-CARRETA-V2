import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Calendar, DollarSign,
    AlertCircle, CheckCircle, Clock, XCircle, Search, Trash2, Edit
} from 'lucide-react';
import contasPagarService, { ContaPagar, ContasPagarFilters } from '../../services/contasPagar';
import './ContasPagar.css';

const ContasPagar: React.FC = () => {
    const [contas, setContas] = useState<ContaPagar[]>([]);
    const [loading, setLoading] = useState(false);
    const [, setShowModal] = useState(false);
    const [, setEditingConta] = useState<ContaPagar | null>(null);
    const [filtros, setFiltros] = useState<ContasPagarFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const tiposConta = [
        { value: 'agua', label: '💧 Água', color: '#3B82F6' },
        { value: 'energia', label: '⚡ Energia', color: '#F59E0B' },
        { value: 'aluguel', label: '🏠 Aluguel', color: '#8B5CF6' },
        { value: 'internet', label: '🌐 Internet', color: '#10B981' },
        { value: 'telefone', label: '📱 Telefone', color: '#06B6D4' },
        { value: 'pneu_furado', label: '🛞 Pneu Furado', color: '#EF4444' },
        { value: 'troca_oleo', label: '🛢️ Troca de Óleo', color: '#F97316' },
        { value: 'abastecimento', label: '⛽ Abastecimento', color: '#14B8A6' },
        { value: 'manutencao_mecanica', label: '🔧 Manutenção Mecânica', color: '#6366F1' },
        { value: 'reboque', label: '🚛 Reboque', color: '#EC4899' },
        { value: 'lavagem', label: '🧼 Lavagem', color: '#06B6D4' },
        { value: 'pedagio', label: '🛣️ Pedágio', color: '#84CC16' },
        { value: 'espontaneo', label: '✨ Espontâneo', color: '#A855F7' },
        { value: 'outros', label: '📦 Outros', color: '#64748B' },
    ];

    const statusConfig = {
        pendente: { icon: Clock, color: '#F59E0B', label: 'Pendente', bg: 'rgba(245, 158, 11, 0.1)' },
        paga: { icon: CheckCircle, color: '#10B981', label: 'Paga', bg: 'rgba(16, 185, 129, 0.1)' },
        vencida: { icon: AlertCircle, color: '#EF4444', label: 'Vencida', bg: 'rgba(239, 68, 68, 0.1)' },
        cancelada: { icon: XCircle, color: '#6B7280', label: 'Cancelada', bg: 'rgba(107, 114, 128, 0.1)' },
    };

    useEffect(() => {
        carregarContas();
    }, [filtros, page]);

    const carregarContas = async () => {
        setLoading(true);
        try {
            const response = await contasPagarService.listar({ ...filtros, page });
            setContas(response.contas);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja deletar esta conta?')) return;

        try {
            await contasPagarService.deletar(id);
            carregarContas();
        } catch (error) {
            console.error('Erro ao deletar conta:', error);
        }
    };

    const getTotalPorStatus = (status: string) => {
        return contas
            .filter(c => c.status === status)
            .reduce((sum, c) => sum + Number(c.valor), 0);
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
        <div className="contas-pagar-container">
            {/* Header com Glassmorphism */}
            <motion.div
                className="header-glass"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
            >
                <div className="header-content">
                    <div className="header-title">
                        <motion.div
                            className="icon-wrapper"
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <DollarSign size={32} />
                        </motion.div>
                        <div>
                            <h1>Contas a Pagar</h1>
                            <p>Gestão financeira inteligente</p>
                        </div>
                    </div>
                    <motion.button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus size={20} />
                        Nova Conta
                    </motion.button>
                </div>
            </motion.div>

            {/* Cards de Resumo com Animação */}
            <motion.div
                className="summary-cards"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {Object.entries(statusConfig).map(([status, config]) => {
                    const Icon = config.icon;
                    const total = getTotalPorStatus(status);

                    return (
                        <motion.div
                            key={status}
                            className="summary-card"
                            variants={itemVariants}
                            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                            style={{
                                background: `linear - gradient(135deg, ${config.bg} 0 %, ${config.color}20 100 %)`,
                                borderLeft: `4px solid ${config.color} `
                            }}
                        >
                            <div className="card-icon" style={{ color: config.color }}>
                                <Icon size={24} />
                            </div>
                            <div className="card-content">
                                <span className="card-label">{config.label}</span>
                                <motion.span
                                    className="card-value"
                                    key={total}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </motion.span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Filtros Avançados */}
            <motion.div
                className="filters-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
            >
                <div className="filters-grid">
                    <div className="filter-group">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    <select
                        className="filter-select"
                        value={filtros.status || ''}
                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                    >
                        <option value="">Todos os Status</option>
                        {Object.entries(statusConfig).map(([status, config]) => (
                            <option key={status} value={status}>{config.label}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={filtros.tipo_conta || ''}
                        onChange={(e) => setFiltros({ ...filtros, tipo_conta: e.target.value })}
                    >
                        <option value="">Todos os Tipos</option>
                        {tiposConta.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Tabela com Animações */}
            <motion.div
                className="table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="loading-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="loading-spinner" />
                            <p>Carregando contas...</p>
                        </motion.div>
                    ) : (
                        <motion.table
                            key="table"
                            className="modern-table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Vencimento</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {contas
                                        .filter(c => c.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((conta, index) => {
                                            const StatusIcon = statusConfig[conta.status].icon;
                                            const tipoInfo = tiposConta.find(t => t.value === conta.tipo_conta);

                                            return (
                                                <motion.tr
                                                    key={conta.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                >
                                                    <td>
                                                        <motion.div
                                                            className="status-badge"
                                                            style={{
                                                                backgroundColor: statusConfig[conta.status].bg,
                                                                color: statusConfig[conta.status].color
                                                            }}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <StatusIcon size={16} />
                                                            {statusConfig[conta.status].label}
                                                        </motion.div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="tipo-badge"
                                                            style={{
                                                                backgroundColor: `${tipoInfo?.color} 20`,
                                                                color: tipoInfo?.color
                                                            }}
                                                        >
                                                            {tipoInfo?.label}
                                                        </span>
                                                    </td>
                                                    <td className="descricao-cell">{conta.descricao}</td>
                                                    <td>
                                                        <div className="date-cell">
                                                            <Calendar size={14} />
                                                            {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </td>
                                                    <td className="valor-cell">
                                                        R$ {Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <motion.button
                                                                className="btn-icon btn-edit"
                                                                onClick={() => {
                                                                    setEditingConta(conta);
                                                                    setShowModal(true);
                                                                }}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Edit size={16} />
                                                            </motion.button>
                                                            <motion.button
                                                                className="btn-icon btn-delete"
                                                                onClick={() => handleDelete(conta.id)}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                </AnimatePresence>
                            </tbody>
                        </motion.table>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Paginação */}
            {totalPages > 1 && (
                <motion.div
                    className="pagination"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <motion.button
                            key={p}
                            className={`page - btn ${p === page ? 'active' : ''} `}
                            onClick={() => setPage(p)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {p}
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default ContasPagar;
