/**
 * utils/sms.ts — SMS via Brevo Transactional SMS API
 * Usa a mesma BREVO_API_KEY configurada para e-mail
 */
import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASS || '';
const SENDER_NAME = process.env.SMS_SENDER_NAME || 'GestaoSaude';

export async function enviarSMS(telefone: string, mensagem: string): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.warn('⚠️ SMS: BREVO_API_KEY não configurada');
        return false;
    }

    // Normalizar telefone para formato internacional (+55)
    const tel = normalizarTelefone(telefone);
    if (!tel) {
        console.warn(`⚠️ SMS: Telefone inválido: ${telefone}`);
        return false;
    }

    try {
        await axios.post(
            'https://api.brevo.com/v3/transactionalSMS/sms',
            {
                sender: SENDER_NAME,
                recipient: tel,
                content: mensagem.substring(0, 160), // Limite SMS
                type: 'transactional',
            },
            {
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`✅ SMS enviado para ${tel}`);
        return true;
    } catch (err: any) {
        console.error(`❌ Erro ao enviar SMS para ${tel}:`, err.response?.data || err.message);
        return false;
    }
}

function normalizarTelefone(tel: string): string | null {
    // Remove tudo que não é dígito
    const digits = tel.replace(/\D/g, '');
    // Se já começa com 55 (código Brasil) e tem 12-13 dígitos
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return `+${digits}`;
    }
    // Número brasileiro sem código do país
    if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`;
    }
    return null;
}
