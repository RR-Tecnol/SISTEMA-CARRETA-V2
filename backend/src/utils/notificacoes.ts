/**
 * utils/notificacoes.ts — Orquestrador de notificações da fila de atendimento
 * Centraliza a lógica de envio via Email, SMS e WhatsApp conforme configuração da ação
 */
import { enviarSMS } from './sms';
import { enviarWhatsApp } from './whatsapp';
import { sendGenericEmail } from './email';

export interface CidadaoNotif {
    nome_completo: string;
    email?: string | null;
    telefone?: string | null;
}

export interface ConfigNotif {
    notif_email: boolean;
    notif_sms: boolean;
    notif_whatsapp: boolean;
}

/**
 * Envia notificação por todos os canais habilitados
 */
export async function notificarCidadao(
    cidadao: CidadaoNotif,
    assunto: string,
    mensagem: string,
    config: ConfigNotif
): Promise<void> {
    const promises: Promise<any>[] = [];

    if (config.notif_email && cidadao.email) {
        promises.push(sendGenericEmail(cidadao.email, assunto, mensagem).catch(() => null));
    }
    if (config.notif_sms && cidadao.telefone) {
        promises.push(enviarSMS(cidadao.telefone, mensagem).catch(() => false));
    }
    if (config.notif_whatsapp && cidadao.telefone) {
        promises.push(enviarWhatsApp(cidadao.telefone, mensagem).catch(() => false));
    }

    await Promise.allSettled(promises);
}

/**
 * Notificação 1 — Ficha gerada
 */
export async function notificarFichaGerada(
    cidadao: CidadaoNotif,
    numeroFicha: number,
    nomeExame: string,
    nomeEstacao: string,
    posicaoFila: number,
    config: ConfigNotif
): Promise<void> {
    const primeiroNome = cidadao.nome_completo.split(' ')[0];
    const assunto = `Sua ficha de atendimento — Nº ${String(numeroFicha).padStart(3, '0')}`;
    const mensagem = `Olá, ${primeiroNome}! 🎫 Sua ficha para *${nomeExame}* é o nº *${String(numeroFicha).padStart(3, '0')}*.\nVocê está em ${posicaoFila}º lugar na fila.\nDirija-se à ${nomeEstacao} e aguarde ser chamado.\n📍 Sistema Gestão Sobre Rodas`;

    await notificarCidadao(cidadao, assunto, mensagem, config);
}

/**
 * Notificação 2 — Atendimento chegando (faltam N fichas)
 */
export async function notificarChegando(
    cidadao: CidadaoNotif,
    numeroFicha: number,
    nomeExame: string,
    nomeEstacao: string,
    faltam: number,
    config: ConfigNotif
): Promise<void> {
    const primeiroNome = cidadao.nome_completo.split(' ')[0];
    const assunto = `Seu atendimento está chegando — Ficha ${String(numeroFicha).padStart(3, '0')}`;
    const mensagem = `⚠️ ${primeiroNome}, seu atendimento está chegando!\nFicha *${String(numeroFicha).padStart(3, '0')}* — ${nomeExame}.\nFaltam apenas *${faltam} fichas*.\nDirija-se à ${nomeEstacao} e aguarde próximo da entrada.`;

    await notificarCidadao(cidadao, assunto, mensagem, config);
}

/**
 * Notificação 3 — Ficha chamada (vez do cidadão)
 */
export async function notificarChamado(
    cidadao: CidadaoNotif,
    numeroFicha: number,
    nomeExame: string,
    nomeEstacao: string,
    guiche: string | null,
    config: ConfigNotif
): Promise<void> {
    const primeiroNome = cidadao.nome_completo.split(' ')[0];
    const localStr = guiche ? `${nomeEstacao} — ${guiche}` : nomeEstacao;
    const assunto = `📣 CHAMADO! Ficha ${String(numeroFicha).padStart(3, '0')} — ${nomeExame}`;
    const mensagem = `📣 *FICHA ${String(numeroFicha).padStart(3, '0')} — CHAMADA!*\n${primeiroNome}, dirija-se AGORA à *${localStr}*.\nVocê tem 5 minutos para se apresentar.`;

    await notificarCidadao(cidadao, assunto, mensagem, config);
}

/**
 * Notificação 4 — Estação retomou (após pausa/manutenção)
 */
export async function notificarRetornoEstacao(
    cidadaos: { cidadao: CidadaoNotif; numeroFicha: number }[],
    nomeEstacao: string,
    nomeExame: string,
    config: ConfigNotif
): Promise<number> {
    let enviados = 0;

    for (const { cidadao, numeroFicha } of cidadaos) {
        const primeiroNome = cidadao.nome_completo.split(' ')[0];
        const assunto = `✅ ${nomeEstacao} voltou ao atendimento!`;
        const mensagem = `✅ Boas notícias, ${primeiroNome}!\nA *${nomeEstacao}* voltou ao atendimento.\nSua ficha *${String(numeroFicha).padStart(3, '0')}* para *${nomeExame}* está na fila.\nDirija-se ao local para retomar o atendimento.`;

        await notificarCidadao(cidadao, assunto, mensagem, config);
        enviados++;
    }

    return enviados;
}
