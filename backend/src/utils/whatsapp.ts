/**
 * utils/whatsapp.ts — WhatsApp via Z-API
 * Variáveis necessárias no .env:
 *   ZAPI_INSTANCE_ID=seu-instance-id
 *   ZAPI_TOKEN=seu-token
 *   ZAPI_CLIENT_TOKEN=seu-client-token (security token do painel Z-API)
 */
import axios from 'axios';

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || '';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || '';
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || '';
const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;

export async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
        console.warn('⚠️ WhatsApp: ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados');
        return false;
    }

    const tel = normalizarTelefoneZAPI(telefone);
    if (!tel) {
        console.warn(`⚠️ WhatsApp: Telefone inválido: ${telefone}`);
        return false;
    }

    try {
        await axios.post(
            `${ZAPI_BASE}/send-text`,
            { phone: tel, message: mensagem },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Client-Token': ZAPI_CLIENT_TOKEN,
                },
            }
        );
        console.log(`✅ WhatsApp enviado para ${tel}`);
        return true;
    } catch (err: any) {
        console.error(`❌ Erro ao enviar WhatsApp para ${tel}:`, err.response?.data || err.message);
        return false;
    }
}

function normalizarTelefoneZAPI(tel: string): string | null {
    // Z-API aceita formato: 5511999999999 (sem + ou espaços)
    const digits = tel.replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return digits;
    }
    if (digits.length === 10 || digits.length === 11) {
        return `55${digits}`;
    }
    return null;
}
