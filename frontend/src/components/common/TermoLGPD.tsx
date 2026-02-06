import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Box,
    Divider,
    Alert,
} from '@mui/material';
import { format } from 'date-fns';

interface TermoLGPDProps {
    open: boolean;
    onAccept: (consentData: ConsentData) => void;
    onDecline: () => void;
}

export interface ConsentData {
    consentimento_lgpd: boolean;
    consentimento_comunicacoes?: boolean;
    consentimento_imagens?: boolean;
    data_consentimento: string;
    ip_consentimento: string;
}

const TermoLGPD: React.FC<TermoLGPDProps> = ({ open, onAccept, onDecline }) => {
    const [aceites, setAceites] = useState({
        termos: false,
        comunicacoes: false,
        imagens: false,
    });

    const handleAccept = () => {
        if (!aceites.termos) {
            return;
        }

        const consentData: ConsentData = {
            consentimento_lgpd: aceites.termos,
            consentimento_comunicacoes: aceites.comunicacoes,
            consentimento_imagens: aceites.imagens,
            data_consentimento: new Date().toISOString(),
            ip_consentimento: '', // Will be captured by backend
        };

        onAccept(consentData);
    };

    return (
        <Dialog open={open} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5" component="div" align="center" gutterBottom>
                    📋 Termo de Consentimento e Aviso de Privacidade
                </Typography>
                <Typography variant="subtitle2" align="center" color="text.secondary">
                    Lei Geral de Proteção de Dados (LGPD)
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ maxHeight: '60vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" paragraph>
                        Ao prosseguir com o cadastro, você declara estar ciente e concordar com os seguintes termos:
                    </Typography>
                </Box>

                {/* 1. FINALIDADE DA COLETA */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        1. FINALIDADE DA COLETA DE DADOS
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Seus dados pessoais serão coletados EXCLUSIVAMENTE para:
                    </Typography>
                    <Box component="ul" sx={{ ml: 2 }}>
                        <Typography component="li" variant="body2">
                            ✓ Inscrição e participação nas ações educacionais e de saúde
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Emissão de certificados e diplomas
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Envio de comunicações relacionadas às ações (WhatsApp/SMS/e-mail)
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Controle de presença e aproveitamento
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Estatísticas agregadas e anônimas para melhoria dos serviços
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 2. DADOS COLETADOS */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        2. DADOS COLETADOS
                    </Typography>
                    <Box component="ul" sx={{ ml: 2 }}>
                        <Typography component="li" variant="body2">
                            • Dados pessoais: Nome completo, CPF, data de nascimento
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Dados de contato: Telefone, e-mail, endereço
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Dados educacionais/saúde: Conforme aplicável à ação
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 3. COMPARTILHAMENTO */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        3. COMPARTILHAMENTO DE DADOS
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Seus dados poderão ser compartilhados com:
                    </Typography>
                    <Box component="ul" sx={{ ml: 2 }}>
                        <Typography component="li" variant="body2">
                            • Instituição contratante do serviço (prefeitura/órgão público)
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Entidades certificadoras dos cursos
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Sistemas governamentais quando exigido por lei
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 4. PRAZO DE RETENÇÃO */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        4. PRAZO DE RETENÇÃO
                    </Typography>
                    <Alert severity="info" sx={{ mb: 1 }}>
                        Seus dados serão mantidos pelo período necessário para cumprimento das finalidades
                        descritas e conforme exigências legais.
                    </Alert>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 5. DIREITOS */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        5. SEUS DIREITOS (Art. 18 da LGPD)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Você tem direito a:
                    </Typography>
                    <Box component="ul" sx={{ ml: 2 }}>
                        <Typography component="li" variant="body2">
                            ✓ Confirmar a existência de tratamento dos seus dados
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Acessar seus dados a qualquer momento
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Corrigir dados incompletos, inexatos ou desatualizados
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Solicitar a anonimização, bloqueio ou eliminação
                        </Typography>
                        <Typography component="li" variant="body2">
                            ✓ Revogar o consentimento (impossibilitando participação futura)
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 6. SEGURANÇA */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        6. SEGURANÇA DOS DADOS
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Implementamos medidas técnicas e organizacionais para proteger seus dados:
                    </Typography>
                    <Box component="ul" sx={{ ml: 2 }}>
                        <Typography component="li" variant="body2">
                            • Criptografia de dados sensíveis (CPF)
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Controle de acesso restrito
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Logs de auditoria
                        </Typography>
                        <Typography component="li" variant="body2">
                            • Backups seguros
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* IMPORTANTE */}
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                        ⚠️ IMPORTANTE:
                    </Typography>
                    <Typography variant="body2">
                        • Este consentimento é condição necessária para participação nas ações oferecidas.
                    </Typography>
                    <Typography variant="body2">
                        • A recusa ou revogação do consentimento impossibilita o cadastro e participação.
                    </Typography>
                    <Typography variant="body2">
                        • Você pode acessar este termo a qualquer momento em seu perfil.
                    </Typography>
                </Alert>

                {/* CHECKBOXES DE CONSENTIMENTO */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={aceites.termos}
                                    onChange={(e) => setAceites({ ...aceites, termos: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" fontWeight="bold">
                                    Li e concordo com os termos acima *
                                </Typography>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={aceites.comunicacoes}
                                    onChange={(e) => setAceites({ ...aceites, comunicacoes: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Autorizo o envio de comunicações via WhatsApp/SMS/e-mail
                                </Typography>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={aceites.imagens}
                                    onChange={(e) => setAceites({ ...aceites, imagens: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Autorizo o uso de imagens para divulgação
                                </Typography>
                            }
                        />
                    </FormGroup>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        Data do consentimento: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onDecline} color="inherit">
                    Não Concordo
                </Button>
                <Button
                    onClick={handleAccept}
                    variant="contained"
                    disabled={!aceites.termos}
                    size="large"
                >
                    Concordo e Prosseguir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TermoLGPD;
