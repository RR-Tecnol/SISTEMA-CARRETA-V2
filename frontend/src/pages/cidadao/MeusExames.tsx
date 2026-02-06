import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Download, Calendar, Activity,
    Search, Eye
} from 'lucide-react';
import api from '../../services/api';
import './MeusExames.css';

interface Exame {
    id: string;
    exame: {
        nome: string;
        tipo: string;
    };
    acao: {
        numero_acao: string;
        municipio: string;
        estado: string;
        data_inicio: string;
    };
    data_realizacao: string;
    resultado?: string;
    observacoes?: string;
    arquivo_resultado_url?: string;
}

const MeusExames: React.FC = () => {
    const [exames, setExames] = useState<Exame[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExame, setSelectedExame] = useState<Exame | null>(null);

    useEffect(() => {
        carregarExames();
    }, []);

    const carregarExames = async () => {
        setLoading(true);
        try {
            const cidadaoId = localStorage.getItem('cidadao_id');
            const response = await api.get(`/ cidadaos / ${cidadaoId}/exames`);
            setExames(response.data.exames);
        } catch (error) {
            console.error('Erro ao carregar exames:', error);
        } finally {
            setLoading(false);
        }
    };

    const examesFiltrados = exames.filter(e => {
        const matchTipo = !filtroTipo || e.exame.tipo === filtroTipo;
        const matchSearch = !searchTerm ||
            e.exame.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchTipo && matchSearch;
    });

    const tiposExame = Array.from(new Set(exames.map(e => e.exame.tipo)));

    return (
        <div className="meus-exames-container">
            {/* Animated Background */}
            <div className="exames-background">
                <div className="wave wave-1" />
                <div className="wave wave-2" />
                <div className="wave wave-3" />
            </div>

            {/* Header */}
            <motion.div
                className="exames-header"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
            >
                <div className="header-content">
                    <div className="header-title">
                        <motion.div
                            className="icon-wrapper-exames"
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <FileText size={32} />
                        </motion.div>
                        <div>
                            <h1>Meus Exames</h1>
                            <p>Histórico completo de exames realizados</p>
                        </div>
                    </div>
                    <motion.div
                        className="total-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                    >
                        <Activity size={20} />
                        <span>{exames.length} exames</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Filtros */}
            <motion.div
                className="exames-filters"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="filter-group-exames">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar exame..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-exames"
                    />
                </div>
                <select
                    className="filter-select-exames"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                >
                    <option value="">Todos os tipos</option>
                    {tiposExame.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>
            </motion.div>

            {/* Timeline de Exames */}
            <div className="exames-timeline">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="loading-state-exames"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="loading-spinner-exames" />
                            <p>Carregando seus exames...</p>
                        </motion.div>
                    ) : examesFiltrados.length === 0 ? (
                        <motion.div
                            key="empty"
                            className="empty-state"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <FileText size={64} />
                            <h3>Nenhum exame encontrado</h3>
                            <p>Você ainda não realizou nenhum exame</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="timeline"
                            className="timeline-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {examesFiltrados.map((exame, index) => (
                                <motion.div
                                    key={exame.id}
                                    className="timeline-item"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ x: 10 }}
                                    onClick={() => setSelectedExame(exame)}
                                >
                                    <div className="timeline-marker">
                                        <div className="marker-dot" />
                                        <div className="marker-line" />
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <div>
                                                <h3>{exame.exame.nome}</h3>
                                                <div className="timeline-meta">
                                                    <span className="tipo-badge-exame">
                                                        {exame.exame.tipo}
                                                    </span>
                                                    <span className="date-badge">
                                                        <Calendar size={14} />
                                                        {new Date(exame.data_realizacao).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <motion.button
                                                className="btn-view"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Eye size={18} />
                                                Ver Detalhes
                                            </motion.button>
                                        </div>
                                        <div className="timeline-info">
                                            <p>
                                                <strong>Ação:</strong> {exame.acao.numero_acao || 'N/A'}
                                            </p>
                                            <p>
                                                <strong>Local:</strong> {exame.acao.municipio} - {exame.acao.estado}
                                            </p>
                                        </div>
                                        {exame.arquivo_resultado_url && (
                                            <motion.a
                                                href={exame.arquivo_resultado_url}
                                                download
                                                className="btn-download"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Download size={16} />
                                                Baixar Resultado
                                            </motion.a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de Detalhes */}
            <AnimatePresence>
                {selectedExame && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedExame(null)}
                    >
                        <motion.div
                            className="modal-content-exames"
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header-exames">
                                <h2>{selectedExame.exame.nome}</h2>
                                <button
                                    className="btn-close"
                                    onClick={() => setSelectedExame(null)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body-exames">
                                <div className="detail-row">
                                    <span className="detail-label">Tipo:</span>
                                    <span className="detail-value">{selectedExame.exame.tipo}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Data:</span>
                                    <span className="detail-value">
                                        {new Date(selectedExame.data_realizacao).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Ação:</span>
                                    <span className="detail-value">{selectedExame.acao.numero_acao}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Local:</span>
                                    <span className="detail-value">
                                        {selectedExame.acao.municipio} - {selectedExame.acao.estado}
                                    </span>
                                </div>
                                {selectedExame.resultado && (
                                    <div className="detail-row-full">
                                        <span className="detail-label">Resultado:</span>
                                        <p className="detail-result">{selectedExame.resultado}</p>
                                    </div>
                                )}
                                {selectedExame.observacoes && (
                                    <div className="detail-row-full">
                                        <span className="detail-label">Observações:</span>
                                        <p className="detail-obs">{selectedExame.observacoes}</p>
                                    </div>
                                )}
                            </div>
                            {selectedExame.arquivo_resultado_url && (
                                <div className="modal-footer-exames">
                                    <motion.a
                                        href={selectedExame.arquivo_resultado_url}
                                        download
                                        className="btn-download-modal"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Download size={18} />
                                        Baixar Resultado Completo
                                    </motion.a>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MeusExames;
