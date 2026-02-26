import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Star, Share2,
    Link2, ChevronRight, Newspaper, AlertTriangle
} from 'lucide-react';
import api, { BASE_URL } from '../../services/api';
import './NoticiaDetalhe.css';

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

const getCatClass = (cat?: string) => {
    const map: Record<string, string> = {
        'Ações de Saúde': 'cat-saude',
        'Prevenção': 'cat-prevencao',
        'Especialidades': 'cat-exames',
        'Exames': 'cat-exames',
        'Geral': 'cat-geral',
    };
    return map[cat || ''] || 'cat-default';
};

const NoticiaDetalhe: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [noticia, setNoticia] = useState<Noticia | null>(null);
    const [outras, setOutras] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [copied, setCopied] = useState(false);

    const getImgSrc = (url?: string): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadNoticia();
    }, [id]);

    const loadNoticia = async () => {
        try {
            setLoading(true);
            setError(false);
            const [noticiaRes, outrasRes] = await Promise.all([
                api.get(`/noticias/${id}`),
                api.get('/noticias?limit=10'),
            ]);
            setNoticia(noticiaRes.data);
            setOutras(
                (Array.isArray(outrasRes.data) ? outrasRes.data : [])
                    .filter((n: Noticia) => n.id !== id)
                    .slice(0, 4)
            );
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

    /* ── Skeleton ──────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="artigo-page">
                <div className="skeleton skeleton-hero" />
                <div className="artigo-breadcrumb" style={{ padding: '16px 60px' }}>
                    <div className="skeleton skeleton-block" style={{ width: 200, height: 14 }} />
                </div>
                <div className="artigo-body">
                    <div className="artigo-main">
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-block" style={{ width: '95%' }} />
                        <div className="skeleton skeleton-block" style={{ width: '90%' }} />
                        <div className="skeleton skeleton-block" style={{ width: '80%' }} />
                        <div className="skeleton skeleton-block" style={{ width: '92%', marginTop: 24 }} />
                        <div className="skeleton skeleton-block" style={{ width: '88%' }} />
                        <div className="skeleton skeleton-block" style={{ width: '75%' }} />
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error ─────────────────────────────────────────────── */
    if (error || !noticia) {
        return (
            <div className="artigo-page">
                <div className="artigo-error">
                    <div className="artigo-error-icon">
                        <AlertTriangle size={36} />
                    </div>
                    <h2>Notícia não encontrada</h2>
                    <p>Essa notícia pode ter sido removida ou o link está incorreto.</p>
                    <Link to="/" className="btn-voltar">
                        <ArrowLeft size={16} /> Voltar para início
                    </Link>
                </div>
            </div>
        );
    }

    const categoria = noticia.campos_customizados?.categoria;
    const resumo = noticia.campos_customizados?.resumo;

    return (
        <div className="artigo-page">
            {/* ── Hero ──────────────────────────────────────────── */}
            <motion.section
                className="artigo-hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                {noticia.imagem_url ? (
                    <img
                        className={`artigo-hero-img ${imgLoaded ? 'loaded' : ''}`}
                        src={getImgSrc(noticia.imagem_url)}
                        alt={noticia.titulo}
                        onLoad={() => setImgLoaded(true)}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #1B4F72 0%, #5DADE2 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Newspaper size={80} color="rgba(255,255,255,0.2)" />
                    </div>
                )}
                <div className="artigo-hero-overlay" />
                <motion.div
                    className="artigo-hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <div className="artigo-hero-meta">
                        {categoria && (
                            <span className={`artigo-categoria-badge ${getCatClass(categoria)}`}>
                                {categoria}
                            </span>
                        )}
                        <span className="artigo-data-badge">
                            <Calendar size={12} />
                            {formatDate(noticia.data_publicacao)}
                        </span>
                        {noticia.destaque && (
                            <span className="artigo-destaque-badge">
                                <Star size={11} fill="currentColor" /> Destaque
                            </span>
                        )}
                    </div>
                    <h1 className="artigo-hero-title">{noticia.titulo}</h1>
                </motion.div>
            </motion.section>

            {/* ── Breadcrumb ────────────────────────────────────── */}
            <nav className="artigo-breadcrumb">
                <Link to="/">Início</Link>
                <ChevronRight size={14} className="artigo-breadcrumb-sep" />
                <span>Notícias</span>
                <ChevronRight size={14} className="artigo-breadcrumb-sep" />
                <span className="artigo-breadcrumb-current">{noticia.titulo.slice(0, 50)}{noticia.titulo.length > 50 ? '...' : ''}</span>
            </nav>

            {/* ── Body ──────────────────────────────────────────── */}
            <div className="artigo-body">
                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link to="/" className="btn-voltar">
                        <ArrowLeft size={16} /> Voltar para início
                    </Link>

                    <article className="artigo-main">
                        {resumo && (
                            <p className="artigo-resumo">{resumo}</p>
                        )}

                        <hr className="artigo-divider" />

                        <div className="artigo-conteudo">
                            {noticia.conteudo.split('\n').map((paragraph, i) =>
                                paragraph.trim()
                                    ? <p key={i}>{paragraph}</p>
                                    : <br key={i} />
                            )}
                        </div>
                    </article>
                </motion.div>

                {/* Sidebar */}
                <motion.div
                    className="artigo-sidebar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    {/* Compartilhar */}
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">
                            <Share2 size={14} /> Compartilhar
                        </div>
                        <div className="share-buttons">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(noticia.titulo + ' - ' + window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="share-btn"
                            >
                                <span>📱</span> WhatsApp
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="share-btn"
                            >
                                <span>👍</span> Facebook
                            </a>
                            <button className="share-btn" onClick={handleCopyLink}>
                                <Link2 size={15} />
                                {copied ? '✓ Link copiado!' : 'Copiar link'}
                            </button>
                        </div>
                    </div>

                    {/* Outras notícias */}
                    {outras.length > 0 && (
                        <div className="sidebar-card">
                            <div className="sidebar-card-title">
                                <Newspaper size={14} /> Outras Notícias
                            </div>
                            {outras.map(o => (
                                <Link
                                    key={o.id}
                                    to={`/noticias/${o.id}`}
                                    className="outras-mini-card"
                                >
                                    {o.imagem_url ? (
                                        <img
                                            className="outras-mini-img"
                                            src={getImgSrc(o.imagem_url)}
                                            alt={o.titulo}
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="outras-mini-img-placeholder">
                                            <Newspaper size={22} />
                                        </div>
                                    )}
                                    <div className="outras-mini-info">
                                        <div className="outras-mini-title">{o.titulo}</div>
                                        <div className="outras-mini-data">
                                            {new Date(o.data_publicacao).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="sidebar-card" style={{
                        background: 'linear-gradient(135deg, #E8F4F8 0%, #D0E8F5 100%)',
                        border: '1px solid #C0DDEF'
                    }}>
                        <div className="sidebar-card-title" style={{ color: '#1B4F72' }}>
                            <Calendar size={14} /> Publicação
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#1B4F72', fontWeight: 600 }}>
                            {formatDate(noticia.data_publicacao)}
                        </div>
                        {categoria && (
                            <div style={{ fontSize: '0.8rem', color: '#5DADE2', marginTop: 6 }}>
                                Categoria: {categoria}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default NoticiaDetalhe;
