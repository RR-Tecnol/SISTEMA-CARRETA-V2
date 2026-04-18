import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, Chip, Grid, Divider, CircularProgress,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Download, X, AlertTriangle, Heart, Pill, Activity, User, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { expressoTheme } from '../../theme/expressoTheme';
import jsPDF from 'jspdf';

interface QrCodePacienteProps {
    open: boolean;
    onClose: () => void;
    cidadao: any;
    historicoClinico?: {
        total_atendimentos: number;
        ultima_consulta: string | null;
        ultima_ficha: any;
        atendimentos: Array<{ data: string; observacoes: string; ficha: any }>;
    } | null;
}

const QrCodePaciente: React.FC<QrCodePacienteProps> = ({
    open, onClose, cidadao, historicoClinico,
}) => {
    if (!cidadao) return null;

    const ficha = historicoClinico?.ultima_ficha || {};
    const camposCustom = cidadao.campos_customizados || {};

    // Construir dados clínicos consolidados
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

    const calcIdade = () => {
        if (!cidadao.data_nascimento) return null;
        const hoje = new Date();
        const nasc = new Date(cidadao.data_nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        return idade;
    };

    // QR Code: URL para a ficha clínica autenticada
    const qrString = `${window.location.origin}/ficha/${cidadao.id}`;

    const handleDownloadPDF = async () => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const PW = 210; // página A4: 210mm
        const ML = 15; // margem esquerda
        const MR = 15; // margem direita
        const CW = PW - ML - MR; // largura útil
        let y = 0;

        // ── Cabeçalho gradiente ──
        doc.setFillColor(26, 188, 156); // #1ABC9C
        doc.rect(0, 0, PW, 36, 'F');
        doc.setFillColor(22, 160, 133); // #16A085 (faixa inferior)
        doc.rect(0, 30, PW, 6, 'F');

        // Logo/marca
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('Gestão Sobre Rodas', ML, 14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Prontuário Eletrônico — Sistema Carretas', ML, 20);
        doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, ML, 26);

        // Código único
        doc.setFontSize(8);
        doc.text(`ID: ${cidadao.id}`, PW - MR - 45, 26);

        y = 44;

        // ── Dados do paciente ──
        const azulTit = [26, 188, 156] as [number, number, number];
        const cinza = [71, 85, 105] as [number, number, number];
        const preto = [15, 23, 42] as [number, number, number];

        const secTitulo = (label: string) => {
            doc.setFillColor(...azulTit);
            doc.rect(ML, y, CW, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text(label, ML + 2, y + 4.2);
            y += 9;
        };

        const dataRow = (label: string, value: string) => {
            if (!value) return;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...cinza);
            doc.text(`${label}:`, ML + 2, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...preto);
            const lines = doc.splitTextToSize(value, CW - 40);
            doc.text(lines, ML + 42, y);
            y += 5 * lines.length + 1;
        };

        const bloco = (label: string, valor: string, bgHex?: string) => {
            if (!valor) return;
            const rgb = bgHex ? hexToRGB(bgHex) : [241, 245, 249] as [number, number, number];
            const linhas = doc.splitTextToSize(valor, CW - 8);
            const h = 5 * linhas.length + 7;
            if (y + h > 275) { doc.addPage(); y = 20; }
            doc.setFillColor(...rgb);
            doc.roundedRect(ML, y, CW, h, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...cinza);
            doc.text(label.toUpperCase(), ML + 3, y + 4.5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...preto);
            doc.text(linhas, ML + 3, y + 9);
            y += h + 3;
        };

        secTitulo('DADOS DO PACIENTE');
        dataRow('Nome Completo', cidadao.nome || cidadao.nome_completo || '');
        dataRow('CPF', cidadao.cpf || '');
        dataRow('Data de Nascimento', cidadao.data_nascimento ? new Date(cidadao.data_nascimento).toLocaleDateString('pt-BR') : '');
        dataRow('Cartão SUS', cidadao.cartao_sus || '');
        dataRow('Telefone', cidadao.telefone || '');
        dataRow('Município/Estado', [cidadao.municipio, cidadao.estado].filter(Boolean).join(' / '));
        const idadeCalc = calcIdade();
        if (idadeCalc) dataRow('Idade', `${idadeCalc} anos`);
        y += 3;

        // ── Alertas clínicos ──
        secTitulo('ALERTAS CLÍNICOS');
        bloco('ALERGIAS', alergias || 'Nenhuma alergia registrada', alergias ? '#fee2e2' : '#dcfce7');
        if (doencasCronicas) bloco('DOENÇAS CRÔNICAS', doencasCronicas, '#fef3c7');
        if (medicamentos) bloco('MEDICAMENTOS EM USO', medicamentos, '#dbeafe');
        y += 2;

        // ── Sinais Vitais ──
        if (peso || pressao || glicemia || ficha.frequencia_cardiaca || ficha.temperatura || ficha.spo2) {
            secTitulo('SINAIS VITAIS — Última consulta');
            const vitais = [
                { l: 'Pressão Arterial', v: pressao },
                { l: 'FC (bpm)', v: ficha.frequencia_cardiaca },
                { l: 'Temperatura', v: ficha.temperatura ? `${ficha.temperatura}°C` : '' },
                { l: 'SpO2', v: ficha.spo2 ? `${ficha.spo2}%` : '' },
                { l: 'Peso', v: peso ? `${peso} kg` : '' },
                { l: 'Altura', v: ficha.altura ? `${ficha.altura} cm` : '' },
                { l: 'IMC', v: imc || '' },
            ].filter(v => v.v);
            vitais.forEach(v => dataRow(v.l, v.v));
            y += 2;
        }

        // ── Último atendimento ──
        if (diagnostico || queixaPrincipal || conduta) {
            secTitulo('ÚTIMO ATENDIMENTO');
            if (queixaPrincipal) bloco('Queixa Principal', queixaPrincipal);
            if (diagnostico) bloco(`Diagnóstico${cid ? ` (CID: ${cid})` : ''}`, diagnostico, '#f0fdf4');
            if (conduta) bloco('Conduta', conduta, '#eff6ff');
            y += 2;
        }

        // ── Histórico completo ──
        if (historicoClinico?.atendimentos?.length) {
            secTitulo(`HISTÓRICO COMPLETO (${historicoClinico.total_atendimentos} atendimento(s))`);
            historicoClinico.atendimentos.forEach((atd: any, i: number) => {
                if (y > 265) { doc.addPage(); y = 20; }
                const dt = new Date(atd.data).toLocaleDateString('pt-BR');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(...azulTit);
                doc.text(`${i + 1}. ${dt}`, ML + 2, y);
                y += 5;
                if (atd.ficha) {
                    const campos = [
                        { l: 'Queixa', v: atd.ficha.queixa_principal },
                        { l: 'Diagnóstico', v: atd.ficha.diagnostico },
                        { l: 'CID', v: atd.ficha.cid },
                        { l: 'Conduta', v: atd.ficha.conduta },
                        { l: 'Prescrição', v: atd.ficha.prescricao },
                        { l: 'Retorno', v: atd.ficha.retorno },
                        { l: 'Obs.', v: atd.ficha.observacoes_medico || atd.observacoes },
                    ].filter(c => c.v);
                    campos.forEach(c => {
                        if (y > 272) { doc.addPage(); y = 20; }
                        dataRow(c.l, c.v);
                    });
                } else if (atd.observacoes) {
                    bloco('Observações', atd.observacoes);
                }
                y += 2;
            });
        }

        // ── Rodapé ──
        const pg = (doc as any).internal.getCurrentPageInfo().pageNumber;
        for (let i = 1; i <= pg; i++) {
            doc.setPage(i);
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 287, PW, 10, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text('Gestão Sobre Rodas — Sistema Carretas | Docto confidencial — uso exclusivo da equipe médica', ML, 293);
            doc.text(`Pág. ${i}`, PW - MR - 5, 293, { align: 'right' });
        }

        const nomeSanitizado = (cidadao.nome || cidadao.nome_completo || 'paciente').replace(/[^a-zA-Z0-9À-ú ]/g, '').trim();
        doc.save(`historico-${nomeSanitizado}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Helper: hex '#rrggbb' -> [r,g,b]
    const hexToRGB = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    const InfoRow = ({ icon, label, value, color = '#1e293b' }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
        value ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
                <Box sx={{ mt: 0.3, flexShrink: 0, color: expressoTheme.colors.primary }}>{icon}</Box>
                <Box>
                    <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.82rem', color, fontWeight: 600, lineHeight: 1.3 }}>{value}</Typography>
                </Box>
            </Box>
        ) : null
    );

    const AlertChip = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
        <Chip label={label} size="small" sx={{ background: bg, color, fontWeight: 700, fontSize: '0.72rem', height: 26 }} />
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
        >
            <DialogTitle
                className="no-print"
                sx={{
                    background: expressoTheme.gradients.primary,
                    color: 'white', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}
            >
                🔲 Perfil Clínico — {(cidadao.nome || '').split(' ')[0]}
            </DialogTitle>

            <DialogContent sx={{ pt: '20px !important', pb: 1 }}>
                {/* ── CABEÇALHO PACIENTE ── */}
                <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: 'wrap' }}>
                    {/* QR Code compacto */}
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        p: 1.5, background: 'white', borderRadius: '12px',
                        border: '2px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        flexShrink: 0,
                    }}>
                        <QRCodeSVG value={qrString} size={140} level="M" includeMargin={false} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', mt: 0.5, fontWeight: 600 }}>
                            Escaneie para dados
                        </Typography>
                    </Box>

                    {/* Dados pessoais */}
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', mb: 0.5 }}>
                            {cidadao.nome}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                            {calcIdade() !== null && <Chip label={`${calcIdade()} anos`} size="small" sx={{ background: '#EFF6FF', color: expressoTheme.colors.primary, fontWeight: 700, fontSize: '0.72rem' }} />}
                            {cidadao.genero && <Chip label={cidadao.genero === 'feminino' ? '♀ Feminino' : cidadao.genero === 'masculino' ? '♂ Masculino' : cidadao.genero} size="small" sx={{ background: '#F3E8FF', color: '#7C3AED', fontWeight: 700, fontSize: '0.72rem' }} />}
                            {tipoSanguineo && <Chip label={`🩸 ${tipoSanguineo}`} size="small" sx={{ background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.72rem' }} />}
                        </Box>

                        <InfoRow icon={<Shield size={13} />} label="CPF" value={cidadao.cpf || 'N/A'} />
                        <InfoRow icon={<Heart size={13} />} label="Cartão SUS" value={cidadao.cartao_sus || 'N/A'} />
                        <InfoRow icon={<Phone size={13} />} label="Telefone" value={cidadao.telefone || 'N/A'} />
                        <InfoRow icon={<MapPin size={13} />} label="Município" value={cidadao.municipio || ''} />
                        {cidadao.data_nascimento && (
                            <InfoRow icon={<Calendar size={13} />} label="Data Nascimento" value={new Date(cidadao.data_nascimento).toLocaleDateString('pt-BR')} />
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* ── ALERTAS CLÍNICOS ── */}
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AlertTriangle size={16} color={expressoTheme.colors.warning} /> Alertas Clínicos
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {alergias ? (
                        <AlertChip label={`⚠️ Alergias: ${alergias}`} bg="#FEE2E2" color="#B91C1C" />
                    ) : (
                        <AlertChip label="✅ Sem alergias registradas" bg="#D4EDDA" color="#166534" />
                    )}
                    {doencasCronicas && <AlertChip label={`🏥 ${doencasCronicas}`} bg="#FEF3C7" color="#92400E" />}
                    {medicamentos && <AlertChip label={`💊 ${medicamentos}`} bg="#DBEAFE" color="#1E40AF" />}
                </Box>

                {/* ── SINAIS VITAIS ── */}
                {(peso || pressao || glicemia) && (
                    <>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Activity size={16} color={expressoTheme.colors.primary} /> Sinais Vitais (última consulta)
                        </Typography>
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                            {pressao && (
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>PA</Typography>
                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#166534' }}>{pressao}</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {peso && (
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Peso</Typography>
                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E40AF' }}>{peso} kg</Typography>
                                        {imc && <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>IMC: {imc}</Typography>}
                                    </Box>
                                </Grid>
                            )}
                            {glicemia && (
                                <Grid item xs={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA' }}>
                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Glicemia</Typography>
                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#9A3412' }}>{glicemia} mg/dL</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </>
                )}

                {/* ── ÚLTIMO DIAGNÓSTICO ── */}
                {(diagnostico || queixaPrincipal || conduta) && (
                    <>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Pill size={16} color="#8B5CF6" /> Último Atendimento
                        </Typography>
                        <Box sx={{ background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', p: 1.5, mb: 2 }}>
                            {queixaPrincipal && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>QUEIXA PRINCIPAL</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>{queixaPrincipal}</Typography>
                                </Box>
                            )}
                            {diagnostico && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>DIAGNÓSTICO {cid ? `(CID: ${cid})` : ''}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>{diagnostico}</Typography>
                                </Box>
                            )}
                            {conduta && (
                                <Box>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>CONDUTA</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>{conduta}</Typography>
                                </Box>
                            )}
                        </Box>
                    </>
                )}

                {/* ── HISTÓRICO ── */}
                {historicoClinico && historicoClinico.total_atendimentos > 0 && (
                    <Box sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            📋 {historicoClinico.total_atendimentos} atendimento(s) registrado(s)
                            {historicoClinico.ultima_consulta && ` · Último: ${new Date(historicoClinico.ultima_consulta).toLocaleDateString('pt-BR')}`}
                        </Typography>
                    </Box>
                )}

                {!historicoClinico && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                        <CircularProgress size={14} sx={{ color: expressoTheme.colors.primary }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>Carregando histórico clínico...</Typography>
                    </Box>
                )}

                {historicoClinico && historicoClinico.total_atendimentos === 0 && !alergias && !doencasCronicas && (
                    <Box sx={{ textAlign: 'center', py: 2, color: '#94a3b8' }}>
                        <User size={24} />
                        <Typography sx={{ fontSize: '0.82rem', mt: 0.5 }}>Primeiro atendimento — sem histórico clínico prévio</Typography>
                    </Box>
                )}

                {/* CSS de impressão */}
                <style>{`
                    @media print {
                        .no-print, .MuiDialogActions-root { display: none !important; }
                        .MuiDialog-paper { box-shadow: none !important; border: none !important; }
                    }
                `}</style>
            </DialogContent>

            <DialogActions className="no-print" sx={{ p: 2.5, gap: 1.5 }}>
                <Button onClick={onClose} sx={{ color: '#64748b', textTransform: 'none' }}>
                    <X size={14} style={{ marginRight: 4 }} /> Fechar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleDownloadPDF}
                    startIcon={<Download size={14} />}
                    sx={{
                        textTransform: 'none', fontWeight: 700,
                        borderRadius: '10px',
                        background: expressoTheme.gradients.primary,
                        boxShadow: expressoTheme.shadows.button,
                    }}
                >
                    ⬇️ Baixar PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QrCodePaciente;
