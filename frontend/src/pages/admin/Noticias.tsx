import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Newspaper, Plus, Edit2, Trash2, Eye, EyeOff,
    Star, Calendar, X, Save, Image, AlertTriangle,
    BarChart2, CheckCircle, XCircle, BookOpen,
    Upload, RotateCcw, Youtube, Link
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import api, { BASE_URL } from '../../services/api';
import './Noticias.css';

interface Noticia {
    id: string;
    titulo: string;
    conteudo: string;
    imagem_url?: string;
    destaque: boolean;
    ativo: boolean;
    data_publicacao: string;
    campos_customizados?: {
        resumo?: string;
        categoria?: string;
    };
}

const CATEGORIAS = ['Ações de Saúde', 'Prevenção', 'Especialidades', 'Exames', 'Geral'];

const getCatClass = (cat?: string) => {
    if (!cat) return 'cat-default';
    const map: Record<string, string> = {
        'Ações de Saúde': 'cat-saude',
        'Prevenção': 'cat-prevencao',
        'Especialidades': 'cat-exames',
        'Exames': 'cat-exames',
        'Geral': 'cat-geral',
    };
    return map[cat] || 'cat-default';
};

const defaultForm = {
    titulo: '',
    conteudo: '',
    imagem_url: '',
    destaque: false,
    ativo: true,
    categoria: 'Geral',
    resumo: '',
    data_publicacao: new Date().toISOString().slice(0, 10),
};

const Noticias: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todas' | 'ativas' | 'inativas' | 'destaque'>('todas');
    const [showModal, setShowModal] = useState(false);
    const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Noticia | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // YouTube config
    const [youtubeInput, setYoutubeInput] = useState<string>('');
    const [savingVideo, setSavingVideo] = useState(false);

    const fetchNoticias = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/noticias/all');
            setNoticias(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            enqueueSnackbar('Erro ao carregar notícias', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    const fetchVideoConfig = useCallback(async () => {
        try {
            const res = await api.get('/configuracoes/sistema');
            const id = res.data?.youtube_video_id || '';
            const titulo = res.data?.youtube_video_titulo || '';
            if (id) {
                setYoutubeInput(titulo ? `https://www.youtube.com/watch?v=${id} | ${titulo}` : `https://www.youtube.com/watch?v=${id}`);
            }
        } catch { }
    }, []);

    const extractYoutubeId = (input: string): string => {
        const cleaned = input.split('|')[0].trim();
        const match = cleaned.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
        return match ? match[1] : cleaned.trim();
    };

    const handleSaveVideo = async () => {
        const id = extractYoutubeId(youtubeInput);
        if (!id) {
            enqueueSnackbar('Cole um link válido do YouTube', { variant: 'warning' });
            return;
        }
        setSavingVideo(true);
        try {
            await api.put('/configuracoes/sistema', { chave: 'youtube_video_id', valor: id });
            await api.put('/configuracoes/sistema', { chave: 'youtube_video_titulo', valor: 'Conheça Nossas Ações de Saúde' });
            enqueueSnackbar('Vídeo do portal atualizado com sucesso! ✅', { variant: 'success' });
        } catch {
            enqueueSnackbar('Erro ao salvar o vídeo', { variant: 'error' });
        } finally {
            setSavingVideo(false);
        }
    };

    const getImgSrc = (url?: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    useEffect(() => { fetchNoticias(); fetchVideoConfig(); }, [fetchNoticias, fetchVideoConfig]);

    const openCreate = () => {
        setEditingNoticia(null);
        setForm(defaultForm);
        setImageFile(null);
        setImagePreviewUrl('');
        setShowModal(true);
    };

    const openEdit = (n: Noticia) => {
        setEditingNoticia(n);
        setForm({
            titulo: n.titulo,
            conteudo: n.conteudo,
            imagem_url: n.imagem_url || '',
            destaque: n.destaque,
            ativo: n.ativo,
            categoria: n.campos_customizados?.categoria || 'Geral',
            resumo: n.campos_customizados?.resumo || '',
            data_publicacao: n.data_publicacao.slice(0, 10),
        });
        setImageFile(null);
        // Mostra a imagem atual como preview
        setImagePreviewUrl(n.imagem_url || '');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.titulo.trim()) {
            enqueueSnackbar('O título é obrigatório', { variant: 'warning' });
            return;
        }
        if (!form.conteudo.trim()) {
            enqueueSnackbar('O conteúdo é obrigatório', { variant: 'warning' });
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('titulo', form.titulo.trim());
            fd.append('conteudo', form.conteudo.trim());
            fd.append('destaque', String(form.destaque));
            fd.append('ativo', String(form.ativo));
            fd.append('data_publicacao', form.data_publicacao);
            fd.append('campos_customizados', JSON.stringify({
                resumo: form.resumo.trim(),
                categoria: form.categoria,
            }));
            if (imageFile) {
                fd.append('imagem', imageFile);
            }

            if (editingNoticia) {
                await api.put(`/noticias/${editingNoticia.id}`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                enqueueSnackbar('Notícia atualizada com sucesso!', { variant: 'success' });
            } else {
                await api.post('/noticias', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                enqueueSnackbar('Notícia criada com sucesso!', { variant: 'success' });
            }
            setShowModal(false);
            fetchNoticias();
        } catch (err) {
            enqueueSnackbar('Erro ao salvar notícia', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAtivo = async (n: Noticia) => {
        try {
            const fd = new FormData();
            fd.append('ativo', String(!n.ativo));
            await api.put(`/noticias/${n.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            enqueueSnackbar(
                n.ativo ? 'Notícia desativada' : 'Notícia ativada',
                { variant: 'info' }
            );
            fetchNoticias();
        } catch {
            enqueueSnackbar('Erro ao alterar status', { variant: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/noticias/${deleteTarget.id}`);
            enqueueSnackbar('Notícia excluída com sucesso', { variant: 'success' });
            setDeleteTarget(null);
            fetchNoticias();
        } catch {
            enqueueSnackbar('Erro ao excluir notícia', { variant: 'error' });
        }
    };

    const filtered = noticias.filter(n => {
        if (filter === 'ativas') return n.ativo;
        if (filter === 'inativas') return !n.ativo;
        if (filter === 'destaque') return n.destaque;
        return true;
    });

    const stats = {
        total: noticias.length,
        ativas: noticias.filter(n => n.ativo).length,
        inativas: noticias.filter(n => !n.ativo).length,
        destaque: noticias.filter(n => n.destaque).length,
    };

    return (
        <div className="noticias-page">
            {/* Header */}
            <motion.div
                className="noticias-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="noticias-header-left">
                    <div className="noticias-header-icon">
                        <Newspaper size={26} />
                    </div>
                    <div className="noticias-header-texts">
                        <h1>Notícias</h1>
                        <p>Gerencie as notícias exibidas no portal do cidadão</p>
                    </div>
                </div>
                <motion.button
                    className="btn-nova-noticia"
                    onClick={openCreate}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <Plus size={18} />
                    Nova Notícia
                </motion.button>
            </motion.div>

            {/* Painel de Configuração do Vídeo YouTube */}
            <motion.div
                className="youtube-config-panel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <div className="youtube-config-header">
                    <div className="youtube-config-icon">
                        <Youtube size={20} />
                    </div>
                    <div>
                        <h3>Vídeo do Portal do Cidadão</h3>
                        <p>Cole o link do YouTube para atualizar o vídeo exibido na tela inicial do cidadão</p>
                    </div>
                </div>
                <div className="youtube-config-body">
                    <div className="youtube-input-row">
                        <div className="youtube-input-wrapper">
                            <Link size={16} className="youtube-input-icon" />
                            <input
                                className="youtube-input"
                                type="text"
                                placeholder="Ex: https://www.youtube.com/watch?v=ABC123xyz"
                                value={youtubeInput}
                                onChange={e => setYoutubeInput(e.target.value)}
                            />
                        </div>
                        <motion.button
                            className="btn-salvar-video"
                            onClick={handleSaveVideo}
                            disabled={savingVideo}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Youtube size={16} />
                            {savingVideo ? 'Salvando...' : 'Salvar Vídeo'}
                        </motion.button>
                    </div>
                    {youtubeInput && (() => {
                        const id = extractYoutubeId(youtubeInput);
                        return id && id.length === 11 ? (
                            <div className="youtube-preview-hint">
                                ✅ ID detectado: <strong>{id}</strong> — <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">Ver no YouTube ↗</a>
                            </div>
                        ) : null;
                    })()}
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                className="noticias-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {[
                    { label: 'Total', value: stats.total, icon: BarChart2, cls: 'blue' },
                    { label: 'Ativas', value: stats.ativas, icon: CheckCircle, cls: 'green' },
                    { label: 'Inativas', value: stats.inativas, icon: XCircle, cls: 'orange' },
                    { label: 'Destaque', value: stats.destaque, icon: Star, cls: 'purple' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="stat-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                    >
                        <div className={`stat-icon ${s.cls}`}>
                            <s.icon size={22} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-number">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                className="noticias-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {(['todas', 'ativas', 'inativas', 'destaque'] as const).map(f => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </motion.div>

            {/* Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '64px', color: '#5DADE2' }}>
                    <BookOpen size={40} style={{ opacity: 0.4 }} />
                    <p style={{ color: '#6C757D', marginTop: 12 }}>Carregando notícias...</p>
                </div>
            ) : (
                <motion.div
                    className="noticias-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    {filtered.length === 0 ? (
                        <div className="noticias-empty">
                            <div className="noticias-empty-icon"><Newspaper size={32} /></div>
                            <h3>Nenhuma notícia encontrada</h3>
                            <p>Clique em "Nova Notícia" para começar</p>
                        </div>
                    ) : (
                        filtered.map((n, i) => (
                            <motion.div
                                key={n.id}
                                className="noticia-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="noticia-card-image">
                                    {n.imagem_url ? (
                                        <img src={getImgSrc(n.imagem_url)} alt={n.titulo} />
                                    ) : (
                                        <div className="noticia-card-image-placeholder">
                                            <Image size={36} />
                                            <span>Sem imagem</span>
                                        </div>
                                    )}
                                    {n.destaque && (
                                        <div className="badge-destaque">
                                            <Star size={11} /> Destaque
                                        </div>
                                    )}
                                    {!n.ativo && (
                                        <div className="badge-inativo">Inativa</div>
                                    )}
                                </div>

                                <div className="noticia-card-body">
                                    <div className="noticia-meta">
                                        <span className={`noticia-categoria ${getCatClass(n.campos_customizados?.categoria)}`}>
                                            {n.campos_customizados?.categoria || 'Geral'}
                                        </span>
                                        <span className="noticia-data">
                                            <Calendar size={12} />
                                            {new Date(n.data_publicacao).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <h3 className="noticia-titulo">{n.titulo}</h3>
                                    <p className="noticia-resumo">
                                        {n.campos_customizados?.resumo || n.conteudo}
                                    </p>
                                </div>

                                <div className="noticia-card-actions">
                                    <button
                                        className="btn-action edit"
                                        onClick={() => openEdit(n)}
                                        title="Editar"
                                    >
                                        <Edit2 size={13} /> Editar
                                    </button>
                                    <button
                                        className={`btn-action toggle ${!n.ativo ? 'off' : ''}`}
                                        onClick={() => handleToggleAtivo(n)}
                                        title={n.ativo ? 'Desativar' : 'Ativar'}
                                    >
                                        {n.ativo
                                            ? <><EyeOff size={13} /> Desativar</>
                                            : <><Eye size={13} /> Ativar</>
                                        }
                                    </button>
                                    <button
                                        className="btn-action delete"
                                        onClick={() => setDeleteTarget(n)}
                                        title="Excluir"
                                    >
                                        <Trash2 size={13} /> Excluir
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className="modal-header">
                                <h2>
                                    <Newspaper size={20} />
                                    {editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}
                                </h2>
                                <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {/* Título */}
                                <div className="form-group">
                                    <label>Título <span className="required">*</span></label>
                                    <input
                                        className="form-input"
                                        placeholder="Ex: Nova Ação de Saúde em São Luís"
                                        value={form.titulo}
                                        onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                    />
                                </div>

                                {/* Categoria + Data */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Categoria</label>
                                        <select
                                            className="form-select"
                                            value={form.categoria}
                                            onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                                        >
                                            {CATEGORIAS.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Publicação</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={form.data_publicacao}
                                            onChange={e => setForm(f => ({ ...f, data_publicacao: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Resumo */}
                                <div className="form-group">
                                    <label>Resumo (exibido nos cards)</label>
                                    <textarea
                                        className="form-textarea"
                                        style={{ minHeight: 80 }}
                                        placeholder="Breve descrição para exibir na listagem..."
                                        value={form.resumo}
                                        onChange={e => setForm(f => ({ ...f, resumo: e.target.value }))}
                                    />
                                </div>

                                {/* Conteúdo completo */}
                                <div className="form-group">
                                    <label>Conteúdo Completo <span className="required">*</span></label>
                                    <textarea
                                        className="form-textarea"
                                        style={{ minHeight: 160 }}
                                        placeholder="Texto completo da notícia que será exibido na página de detalhe..."
                                        value={form.conteudo}
                                        onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                                    />
                                </div>

                                {/* Upload de Imagem */}
                                <div className="form-group">
                                    <label>Imagem da Notícia</label>

                                    {/* Zona de upload / drop */}
                                    {!imagePreviewUrl ? (
                                        <div
                                            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={e => {
                                                e.preventDefault();
                                                setDragOver(false);
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    setImageFile(file);
                                                    setImagePreviewUrl(URL.createObjectURL(file));
                                                }
                                            }}
                                        >
                                            <div className="upload-zone-icon">
                                                <Upload size={32} />
                                            </div>
                                            <div className="upload-zone-text">
                                                <span className="upload-zone-main">Clique ou arraste a imagem aqui</span>
                                                <span className="upload-zone-sub">JPEG, PNG ou WebP • Máx. 8 MB</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="image-preview-container">
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Preview"
                                                className="image-preview-img"
                                            />
                                            <button
                                                type="button"
                                                className="image-remove-btn"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreviewUrl('');
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                title="Remover imagem"
                                            >
                                                <RotateCcw size={14} />
                                                Trocar imagem
                                            </button>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImageFile(file);
                                                setImagePreviewUrl(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="form-group">
                                    <label>Opções</label>
                                    <div className="toggle-row">
                                        <label
                                            className={`toggle-item ${form.ativo ? 'active-ativo' : ''}`}
                                            htmlFor="toggle-ativo"
                                        >
                                            <input
                                                id="toggle-ativo"
                                                type="checkbox"
                                                checked={form.ativo}
                                                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                                            />
                                            <span className="toggle-label">✅ Ativa (publicar)</span>
                                        </label>
                                        <label
                                            className={`toggle-item ${form.destaque ? 'active-destaque' : ''}`}
                                            htmlFor="toggle-destaque"
                                        >
                                            <input
                                                id="toggle-destaque"
                                                type="checkbox"
                                                checked={form.destaque}
                                                onChange={e => setForm(f => ({ ...f, destaque: e.target.checked }))}
                                            />
                                            <span className="toggle-label">⭐ Destaque</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    className="btn-salvar"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    <Save size={16} />
                                    {saving ? 'Salvando...' : editingNoticia ? 'Atualizar' : 'Publicar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="confirm-modal"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                        >
                            <div className="confirm-modal-icon">
                                <AlertTriangle size={32} />
                            </div>
                            <h3>Excluir Notícia?</h3>
                            <p>
                                Tem certeza que deseja excluir <strong>"{deleteTarget.titulo}"</strong>?
                                Esta ação não pode ser desfeita.
                            </p>
                            <div className="confirm-modal-actions">
                                <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>
                                    Cancelar
                                </button>
                                <button className="btn-confirm-delete" onClick={handleDelete}>
                                    Sim, Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Noticias;
