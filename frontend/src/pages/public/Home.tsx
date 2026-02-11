import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import {
    Activity, Users, FileText, TrendingUp,
    Truck, Shield, Clock, Award,
    BarChart3, DollarSign, Package, ArrowRight,
    MapPin, Calendar
} from 'lucide-react';
import api from '../../services/api';
import 'swiper/css';
import 'swiper/css/effect-fade';
import './Home.css';

interface Acao {
    id: number;
    nome: string;
    data_inicio: string;
    municipio: string;
}

const Home: React.FC = () => {
    const [acoes, setAcoes] = useState<Acao[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const acoesRes = await api.get('/acoes');
            setAcoes(acoesRes.data.slice(0, 3));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const features = [
        {
            icon: <Activity size={20} />,
            title: 'Gestão de Ações',
            description: 'Planeje e gerencie ações de saúde itinerantes com facilidade',
            color: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)'
        },
        {
            icon: <Users size={20} />,
            title: 'Cadastro de Cidadãos',
            description: 'Mantenha um registro completo e organizado de todos os atendidos',
            color: 'linear-gradient(135deg, #28A745 0%, #20803A 100%)'
        },
        {
            icon: <FileText size={20} />,
            title: 'Controle de Inscrições',
            description: 'Gerencie inscrições e acompanhe o status de cada atendimento',
            color: 'linear-gradient(135deg, #17A2B8 0%, #117A8B 100%)'
        },
        {
            icon: <BarChart3 size={20} />,
            title: 'Relatórios e BI',
            description: 'Análises detalhadas e relatórios personalizados para tomada de decisão',
            color: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)'
        },
        {
            icon: <DollarSign size={20} />,
            title: 'Gestão Financeira',
            description: 'Controle completo de custos, despesas e contas a pagar',
            color: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)'
        },
        {
            icon: <Package size={20} />,
            title: 'Controle de Estoque',
            description: 'Gerencie insumos e equipamentos de forma eficiente',
            color: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
        }
    ];

    const benefits = [
        {
            icon: <TrendingUp size={16} />,
            title: 'Aumento de Eficiência',
            description: 'Otimize processos e reduza tempo de gestão em até 60%'
        },
        {
            icon: <Shield size={16} />,
            title: 'Segurança de Dados',
            description: 'Proteção total das informações com criptografia avançada'
        },
        {
            icon: <Clock size={16} />,
            title: 'Economia de Tempo',
            description: 'Automatize tarefas repetitivas e foque no que importa'
        },
        {
            icon: <Award size={16} />,
            title: 'Qualidade no Atendimento',
            description: 'Melhore a experiência dos cidadãos atendidos'
        }
    ];

    return (
        <div className="home-container">
            {/* Hero Section with Slideshow */}
            <section className="hero-section">
                <Swiper
                    modules={[Autoplay, EffectFade]}
                    effect="fade"
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    loop={true}
                    className="hero-slideshow"
                >
                    <SwiperSlide>
                        <div
                            className="hero-slide"
                            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/truck-hero.png)` }}
                        />
                    </SwiperSlide>
                    <SwiperSlide>
                        <div
                            className="hero-slide"
                            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/truck-hero.png)` }}
                        />
                    </SwiperSlide>
                </Swiper>

                <div className="hero-overlay" />

                <div className="hero-content">
                    <div className="hero-text">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/logo-system-truck.png`}
                            alt="System Truck Logo"
                            className="hero-logo"
                        />
                        <h1 className="hero-title">
                            Gestão Completa de Saúde Móvel
                        </h1>
                        <p className="hero-subtitle">
                            Sistema integrado para gerenciar ações de saúde itinerantes com eficiência e praticidade
                        </p>
                        <RouterLink to="/login" className="hero-cta">
                            <span>Acessar Sistema</span>
                            <ArrowRight size={20} />
                        </RouterLink>
                    </div>
                </div>
            </section>

            {/* Actions Section */}
            <section className="actions-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Ações Disponíveis</h2>
                        <p className="section-subtitle">Confira as próximas ações de saúde programadas</p>
                    </div>

                    {acoes.length > 0 ? (
                        <div className="actions-grid">
                            {acoes.map((acao) => (
                                <div key={acao.id} className="action-card">
                                    <div className="action-header">
                                        <div className="action-icon">
                                            <Truck size={28} />
                                        </div>
                                        <div className="action-info">
                                            <h3 className="action-title">{acao.nome}</h3>
                                            <p className="action-location">
                                                <MapPin size={16} />
                                                {acao.municipio}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="action-footer">
                                        <div className="action-date">
                                            <Calendar size={16} />
                                            {new Date(acao.data_inicio).toLocaleDateString('pt-BR')}
                                        </div>
                                        <RouterLink to="/login" className="action-link">
                                            Ver detalhes
                                            <ArrowRight size={16} />
                                        </RouterLink>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-actions">
                            <p>Nenhuma ação disponível no momento</p>
                        </div>
                    )}
                </div>
            </section>

            {/* About Section */}
            <section className="about-section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <h2 className="section-title">O System Truck</h2>
                            <p className="about-text">
                                O <strong>System Truck</strong> nasceu com a missão de facilitar a gestão de operações de saúde móvel,
                                oferecendo uma plataforma completa e integrada para o gerenciamento de ações itinerantes.
                            </p>
                            <p className="about-text">
                                Desde sua criação, o sistema tem sido utilizado para promover <strong>eficiência, organização e qualidade</strong> no
                                atendimento à população, através de ferramentas modernas e intuitivas.
                            </p>
                            <div className="about-features-grid">
                                <div className="feature-mini-card">
                                    <div className="feature-mini-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                        <Activity size={24} />
                                    </div>
                                    <div className="feature-mini-content">
                                        <h4>Interface Moderna</h4>
                                        <p>Design intuitivo e responsivo</p>
                                    </div>
                                </div>

                                <div className="feature-mini-card">
                                    <div className="feature-mini-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                        <BarChart3 size={24} />
                                    </div>
                                    <div className="feature-mini-content">
                                        <h4>Relatórios Avançados</h4>
                                        <p>Análises detalhadas em tempo real</p>
                                    </div>
                                </div>

                                <div className="feature-mini-card">
                                    <div className="feature-mini-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                        <DollarSign size={24} />
                                    </div>
                                    <div className="feature-mini-content">
                                        <h4>Gestão Financeira</h4>
                                        <p>Controle total de custos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="about-image">
                            <div className="image-card">
                                <img
                                    src={`${process.env.PUBLIC_URL}/images/truck-about-new.jpg`}
                                    alt="System Truck Dashboard"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Funcionalidades</h2>
                        <p className="section-subtitle">Tudo que você precisa em um único sistema</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon" style={{ background: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="container">
                    <div className="benefits-grid">
                        <div className="benefits-content">
                            <h2 className="section-title">Benefícios</h2>
                            <h3 className="benefits-subtitle">Por que escolher o System Truck?</h3>

                            <div className="benefits-list">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="benefit-item">
                                        <div className="benefit-icon">
                                            {benefit.icon}
                                        </div>
                                        <div className="benefit-content">
                                            <h4 className="benefit-title">{benefit.title}</h4>
                                            <p className="benefit-description">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="benefits-image">
                            <div className="image-card">
                                <img
                                    src={`${process.env.PUBLIC_URL}/images/truck-benefits-new.jpg`}
                                    alt="System Truck Benefits"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Transforme a gestão da sua operação de saúde móvel</h2>
                        <p className="cta-subtitle">Comece agora e descubra como o System Truck pode otimizar seus processos</p>
                        <RouterLink to="/login" className="cta-button">
                            <span>Começar Agora</span>
                            <ArrowRight size={20} />
                        </RouterLink>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h3 className="footer-logo">System Truck</h3>
                            <p className="footer-description">
                                Sistema completo de gestão para operações de saúde móvel,
                                promovendo eficiência e qualidade no atendimento à população.
                            </p>
                        </div>

                        <div className="footer-info">
                            <h4 className="footer-title">Contato</h4>
                            <p className="footer-text">Sistema desenvolvido para gestão de saúde itinerante</p>
                            <p className="footer-text">© 2026 System Truck. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
