import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Chip, Grid, Divider, CircularProgress,
    Container, Button, Alert, Paper,
} from '@mui/material';
import {
    AlertTriangle, Heart, Pill, Activity, User, Phone, MapPin,
    Calendar, Shield, ArrowLeft, Printer, Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

const FichaPaciente: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cidadao, setCidadao] = useState<any>(null);
    const [historico, setHistorico] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const r = await api.get(`/medico-monitoring/cidadao/${id}/perfil-clinico`);
                setCidadao(r.data.cidadao);
                setHistorico(r.data.historico_clinico);
            } catch (err: any) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError('Acesso negado. Faça login com um perfil autorizado.');
                } else if (err.response?.status === 404) {
                    setError('Paciente não encontrado.');
                } else {
                    setError('Erro ao carregar dados do paciente.');
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background }}>
            <CircularProgress sx={{ color: expressoTheme.colors.primary }} size={48} />
            <Typography sx={{ mt: 2, color: expressoTheme.colors.textSecondary }}>Carregando ficha clínica...</Typography>
        </Box>
    );

    if (error) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background, p: 3 }}>
            <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', maxWidth: 400 }}>
                <Lock size={48} color={expressoTheme.colors.danger} />
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>{error}</Typography>
                <Typography sx={{ color: expressoTheme.colors.textSecondary, mb: 3, fontSize: '0.88rem' }}>
                    Acesso restrito a profissionais de saúde autorizados e ao próprio paciente (LGPD).
                </Typography>
                <Button variant="contained" onClick={() => navigate('/login')}
                    sx={{ background: expressoTheme.gradients.primary, textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                    Fazer Login
                </Button>
            </Paper>
        </Box>
    );

    if (!cidadao) return null;

    const ficha = historico?.ultima_ficha || {};
    const camposCustom = cidadao.campos_customizados || {};

    // Dados clínicos consolidados
    const alergias = ficha.alergias || camposCustom.alergias || '';
    const doencasCronicas = ficha.doencas_cronicas || ficha.antecedentes_pessoais || camposCustom.doencas_cronicas || '';
    const medicamentos = ficha.medicamentos || ficha.medicamentos_uso || camposCustom.medicamentos_uso || '';
    const tipoSanguineo = ficha.tipo_sanguineo || camposCustom.tipo_sanguineo || '';
    const peso = ficha.peso || '';
    const altura = ficha.altura || '';
    const imc = peso && altura ? (Number(peso) / ((Number(altura) / 100) ** 2)).toFixed(1) : '';
    const pressao = ficha.pressao_arterial || '';
    const glicemia = ficha.glicemia || '';
    const diagnostico = ficha.diagnostico || ficha.hipotese_diagnostica || '';
    const cid = ficha.cid || '';
    const conduta = ficha.conduta || '';
    const queixaPrincipal = ficha.queixa_principal || '';
    const antecedentesFamiliares = ficha.antecedentes_familiares || '';
    const examesFisicos = ficha.exame_fisico || '';
    const frequenciaCardiaca = ficha.frequencia_cardiaca || '';
    const temperatura = ficha.temperatura || '';
    const saturacao = ficha.saturacao || '';

    const calcIdade = () => {
        if (!cidadao.data_nascimento) return null;
        const hoje = new Date();
        const nasc = new Date(cidadao.data_nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        return idade;
    };

    // QR Code aponta para esta mesma página
    const qrUrl = `${window.location.origin}/ficha/${id}`;

    const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
        value ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
                <Box sx={{ mt: 0.3, flexShrink: 0, color: expressoTheme.colors.primary }}>{icon}</Box>
                <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.4 }}>{value}</Typography>
                </Box>
            </Box>
        ) : null
    );

    const SectionTitle = ({ icon, title, color = expressoTheme.colors.primary }: { icon: React.ReactNode; title: string; color?: string }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 2 }}>
            <Box sx={{ color }}>{icon}</Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{title}</Typography>
        </Box>
    );

    const VitalCard = ({ label, value, unit, bg, borderColor, textColor }: { label: string; value: string; unit?: string; bg: string; borderColor: string; textColor: string }) => (
        <Grid item xs={6} sm={4} md={3}>
            <Box sx={{ textAlign: 'center', p: 1.5, background: bg, borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: textColor, lineHeight: 1.2 }}>{value}</Typography>
                {unit && <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>{unit}</Typography>}
            </Box>
        </Grid>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, py: 3 }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box className="no-print" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}
                        sx={{ color: expressoTheme.colors.textSecondary, textTransform: 'none', fontWeight: 600 }}>
                        Voltar
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<Lock size={12} />} label="Dados Protegidos · LGPD" size="small"
                            sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.72rem' }} />
                        <Button variant="outlined" startIcon={<Printer size={14} />} onClick={async () => {
                            try {
                                const { default: html2canvas } = await import('html2canvas');
                                const { default: jsPDF } = await import('jspdf');
                                const docElement = document.querySelector('.pc-card-main') as HTMLElement;
                                if (!docElement) { window.print(); return; }
                                const canvas = await html2canvas(docElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p', 'mm', 'a4');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                pdf.save(`FichaClinica_${cidadao.nome}.pdf`);
                            } catch (e) {
                                console.error('Erro ao gerar PDF', e);
                                window.print(); // fallback
                            }
                        }}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '10px', borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary }}>
                            Salvar PDF
                        </Button>
                    </Box>
                </Box>

                {/* Card Principal */}
                <Paper className="pc-card-main" sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
                    {/* Banner */}
                    <Box sx={{ background: expressoTheme.gradients.primary, px: 4, py: 3, color: 'white' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1.5, mb: 0.5 }}>
                            Ficha Clínica — Gestão Sobre Rodas
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                            {cidadao.nome}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                            {calcIdade() !== null && <Chip label={`${calcIdade()} anos`} size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
                            {cidadao.genero && <Chip label={cidadao.genero === 'feminino' ? '♀ Feminino' : cidadao.genero === 'masculino' ? '♂ Masculino' : cidadao.genero} size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
                            {tipoSanguineo && <Chip label={`🩸 ${tipoSanguineo}`} size="small" sx={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }} />}
                            {cidadao.raca && <Chip label={cidadao.raca} size="small" sx={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }} />}
                        </Box>
                    </Box>

                    <Box sx={{ p: 4 }}>
                        {/* Dados pessoais + QR */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <SectionTitle icon={<User size={18} />} title="Dados Pessoais" />
                                <Grid container spacing={0}>
                                    <Grid item xs={6}>
                                        <InfoRow icon={<Shield size={14} />} label="CPF" value={cidadao.cpf || 'N/A'} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <InfoRow icon={<Heart size={14} />} label="Cartão SUS" value={cidadao.cartao_sus || 'N/A'} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <InfoRow icon={<Phone size={14} />} label="Telefone" value={cidadao.telefone || 'N/A'} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <InfoRow icon={<MapPin size={14} />} label="Município" value={cidadao.municipio || ''} />
                                    </Grid>
                                    {cidadao.data_nascimento && (
                                        <Grid item xs={6}>
                                            <InfoRow icon={<Calendar size={14} />} label="Nascimento" value={new Date(cidadao.data_nascimento).toLocaleDateString('pt-BR')} />
                                        </Grid>
                                    )}
                                    {cidadao.email && (
                                        <Grid item xs={6}>
                                            <InfoRow icon={<User size={14} />} label="Email" value={cidadao.email} />
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                    <QRCodeSVG value={qrUrl} size={130} level="M" includeMargin={false} />
                                    <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 1, fontWeight: 600, textAlign: 'center' }}>
                                        Escaneie para abrir esta ficha
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* Alertas Clínicos */}
                        <SectionTitle icon={<AlertTriangle size={18} />} title="Alertas Clínicos" color={expressoTheme.colors.warning} />
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {alergias ? (
                                <Chip label={`⚠️ Alergias: ${alergias}`} sx={{ background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '0.78rem', height: 30 }} />
                            ) : (
                                <Chip label="✅ Sem alergias registradas" sx={{ background: '#D4EDDA', color: '#166534', fontWeight: 700, fontSize: '0.78rem', height: 30 }} />
                            )}
                            {doencasCronicas && <Chip label={`🏥 Doenças crônicas: ${doencasCronicas}`} sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.78rem', height: 30 }} />}
                            {medicamentos && <Chip label={`💊 Medicamentos: ${medicamentos}`} sx={{ background: '#DBEAFE', color: '#1E40AF', fontWeight: 700, fontSize: '0.78rem', height: 30 }} />}
                            {antecedentesFamiliares && <Chip label={`👨‍👩‍👧 Antec. Familiares: ${antecedentesFamiliares}`} sx={{ background: '#F3E8FF', color: '#7C3AED', fontWeight: 700, fontSize: '0.78rem', height: 30 }} />}
                        </Box>

                        {/* Sinais Vitais */}
                        {(peso || pressao || glicemia || frequenciaCardiaca || temperatura || saturacao) && (
                            <>
                                <SectionTitle icon={<Activity size={18} />} title="Sinais Vitais (Última Consulta)" />
                                <Grid container spacing={1.5} sx={{ mb: 1 }}>
                                    {pressao && <VitalCard label="Pressão Arterial" value={pressao} bg="#F0FDF4" borderColor="#BBF7D0" textColor="#166534" />}
                                    {frequenciaCardiaca && <VitalCard label="Freq. Cardíaca" value={frequenciaCardiaca} unit="bpm" bg="#FFF1F2" borderColor="#FECDD3" textColor="#BE123C" />}
                                    {temperatura && <VitalCard label="Temperatura" value={temperatura} unit="°C" bg="#FFF7ED" borderColor="#FED7AA" textColor="#9A3412" />}
                                    {saturacao && <VitalCard label="Saturação O₂" value={saturacao} unit="%" bg="#EFF6FF" borderColor="#BFDBFE" textColor="#1E40AF" />}
                                    {glicemia && <VitalCard label="Glicemia" value={glicemia} unit="mg/dL" bg="#FFF7ED" borderColor="#FED7AA" textColor="#9A3412" />}
                                    {peso && <VitalCard label="Peso" value={`${peso}kg`} unit={imc ? `IMC: ${imc}` : ''} bg="#EFF6FF" borderColor="#BFDBFE" textColor="#1E40AF" />}
                                    {altura && <VitalCard label="Altura" value={`${altura}cm`} bg="#F8FAFC" borderColor="#E2E8F0" textColor="#334155" />}
                                </Grid>
                            </>
                        )}

                        {/* Último Atendimento */}
                        {(diagnostico || queixaPrincipal || conduta || examesFisicos) && (
                            <>
                                <SectionTitle icon={<Pill size={18} />} title="Último Atendimento" color="#8B5CF6" />
                                <Box sx={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', p: 2.5 }}>
                                    {queixaPrincipal && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Queixa Principal</Typography>
                                            <Typography sx={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{queixaPrincipal}</Typography>
                                        </Box>
                                    )}
                                    {examesFisicos && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Exame Físico</Typography>
                                            <Typography sx={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{examesFisicos}</Typography>
                                        </Box>
                                    )}
                                    {diagnostico && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>
                                                Diagnóstico {cid ? `(CID: ${cid})` : ''}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{diagnostico}</Typography>
                                        </Box>
                                    )}
                                    {conduta && (
                                        <Box>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Conduta / Prescrição</Typography>
                                            <Typography sx={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{conduta}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </>
                        )}

                        {/* Histórico de Atendimentos */}
                        {historico && historico.total_atendimentos > 0 && (
                            <>
                                <SectionTitle icon={<Calendar size={18} />} title={`Histórico (${historico.total_atendimentos} atendimento${historico.total_atendimentos > 1 ? 's' : ''})`} />
                                {historico.atendimentos.map((at: any, i: number) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #F1F5F9' }}>
                                        <Chip label={new Date(at.data).toLocaleDateString('pt-BR')} size="small" sx={{ background: '#EFF6FF', color: expressoTheme.colors.primary, fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                                            {at.ficha?.diagnostico || at.ficha?.queixa_principal || at.observacoes || 'Consulta realizada'}
                                        </Typography>
                                    </Box>
                                ))}
                            </>
                        )}

                        {historico && historico.total_atendimentos === 0 && !alergias && !doencasCronicas && (
                            <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                                <User size={32} />
                                <Typography sx={{ fontSize: '0.92rem', mt: 1, fontWeight: 600 }}>Primeiro atendimento — sem histórico clínico prévio</Typography>
                            </Box>
                        )}

                        {/* Rodapé LGPD */}
                        <Divider sx={{ my: 3 }} />
                        <Alert severity="info" icon={<Lock size={16} />}
                            sx={{ borderRadius: '12px', fontSize: '0.75rem', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                            Dados protegidos pela Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
                            Acesso restrito a profissionais de saúde autorizados e ao próprio paciente.
                        </Alert>
                    </Box>
                </Paper>

                {/* CSS impressão */}
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                `}</style>
            </Container>
        </Box>
    );
};

export default FichaPaciente;
