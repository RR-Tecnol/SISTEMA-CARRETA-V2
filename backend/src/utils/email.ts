import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔧 SMTP Configuration:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.SMTP_USER);
console.log('  From:', process.env.SMTP_FROM);
console.log('  Pass configured:', !!process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});

export const sendPasswordResetEmail = async (email: string, token: string) => {
    // Determine frontend URL (could be env var or hardcoded for now)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${token}`;

    const mailOptions = {
        from: `"Sistema Carretas" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: 'Redefinição de Senha - Sistema Carretas',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #1976d2;">Recuperação de Senha</h2>
                <p>Olá,</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sistema Carretas.</p>
                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Redefinir Minha Senha</a>
                </div>
                <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
                <p style="color: #666; font-size: 14px;">Se não foi você quem solicitou, por favor ignore este e-mail.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">Sistema Carretas - Governo do Maranhão</p>
            </div>
        `,
    };

    try {
        console.log(`📧 Tentando enviar e-mail para: ${email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ E-mail enviado com sucesso! ID:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mail:');
        console.error('  Mensagem:', error.message);
        console.error('  Código:', error.code);
        console.error('  Detalhes:', error);
        throw error;
    }
};

/**
 * F1 — Envia e-mail de boas-vindas com senha ao cidadão recém-cadastrado
 */
export const sendWelcomeEmail = async (email: string, nome: string, senha: string) => {
    const mailOptions = {
        from: `"Sistema Gestão Sobre Rodas" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: 'Bem-vindo ao Sistema Gestão Sobre Rodas — Suas credenciais de acesso',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0097a7;">Bem-vindo ao Sistema Gestão Sobre Rodas! 🎉</h2>
                <p>Olá, <strong>${nome}</strong>!</p>
                <p>Seu cadastro foi realizado com sucesso. Abaixo estão suas credenciais de acesso:</p>
                <div style="background: #f5f5f5; border-left: 4px solid #0097a7; padding: 16px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Login:</strong> Seu CPF cadastrado</p>
                    <p style="margin: 4px 0;"><strong>Senha:</strong> <code style="background:#ddd; padding: 2px 6px; border-radius:3px;">${senha}</code></p>
                </div>
                <p style="color: #666; font-size: 14px;">⚠️ Recomendamos que você altere sua senha após o primeiro acesso.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">Sistema Gestão Sobre Rodas — Governo do Maranhão</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail de boas-vindas enviado para: ${email} | ID: ${info.messageId}`);
        return info;
    } catch (error: any) {
        // Não bloquear o cadastro se o e-mail falhar — logar e continuar
        console.error(`⚠️ Falha ao enviar e-mail de boas-vindas para ${email}:`, error.message);
        return null;
    }
};

/**
 * F3 — Envia e-mail genérico (usado para avisos de imprevistos em massa)
 */
export const sendGenericEmail = async (email: string, assunto: string, mensagem: string) => {
    const mailOptions = {
        from: `"Sistema Gestão Sobre Rodas" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: assunto,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0097a7;">Comunicado do Sistema Gestão Sobre Rodas</h2>
                <div style="margin: 20px 0; line-height: 1.6;">${mensagem.replace(/\n/g, '<br>')}</div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">Sistema Gestão Sobre Rodas — Governo do Maranhão</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error: any) {
        console.error(`⚠️ Falha ao enviar e-mail genérico para ${email}:`, error.message);
        return null;
    }
};

/**
 * F5 — Envia e-mail com resultado de exame para o cidadão
 */
export const sendExameResultadoEmail = async (
    email: string,
    nomeCidadao: string,
    nomeExame: string,
    resultado: string,
    observacoes?: string,
    medicoNome?: string,
    dataExame?: string
) => {
    const mailOptions = {
        from: `"Sistema Gestão Sobre Rodas" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `Resultado de Exame — ${nomeExame}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0097a7;">Resultado do Seu Exame 🩺</h2>
                <p>Olá, <strong>${nomeCidadao}</strong>!</p>
                <p>Seu resultado de exame está disponível:</p>
                <div style="background: #f5f5f5; border-left: 4px solid #0097a7; padding: 16px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Exame:</strong> ${nomeExame}</p>
                    ${dataExame ? `<p style="margin: 4px 0;"><strong>Data:</strong> ${dataExame}</p>` : ''}
                    ${medicoNome ? `<p style="margin: 4px 0;"><strong>Médico:</strong> ${medicoNome}</p>` : ''}
                    <p style="margin: 12px 0 4px 0;"><strong>Resultado:</strong></p>
                    <p style="margin: 4px 0; white-space: pre-line;">${resultado}</p>
                    ${observacoes ? `<p style="margin: 8px 0 4px 0; color: #666;"><strong>Observações:</strong> ${observacoes}</p>` : ''}
                </div>
                <p style="color: #666; font-size: 13px;">⚠️ Este resultado é informativo. Em caso de dúvidas, procure atendimento médico.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">Sistema Gestão Sobre Rodas — Governo do Maranhão</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Resultado de exame enviado para: ${email} | ID: ${info.messageId}`);
        return info;
    } catch (error: any) {
        console.error(`⚠️ Falha ao enviar resultado de exame para ${email}:`, error.message);
        return null;
    }
};

/**
 * F5b — Envia resultado de exame COM ANEXO de arquivo para o cidadão
 */
export const sendResultadoComAnexo = async (
    email: string,
    nomeCidadao: string,
    descricao: string,
    fileBuffer: Buffer,
    fileName: string,
    mimetype: string
) => {
    const mailOptions = {
        from: `"Sistema Gestão Sobre Rodas" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: `Resultado de Exame — ${fileName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0097a7;">Resultado do Seu Exame 🩺</h2>
                <p>Olá, <strong>${nomeCidadao}</strong>!</p>
                <p>Segue em anexo o resultado do seu exame.</p>
                ${descricao ? `
                <div style="background: #f5f5f5; border-left: 4px solid #0097a7; padding: 16px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Observações:</strong></p>
                    <p style="margin: 4px 0; white-space: pre-line;">${descricao}</p>
                </div>` : ''}
                <p style="color: #666; font-size: 13px;">⚠️ Este resultado é informativo. Em caso de dúvidas, procure atendimento médico.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #999; font-size: 12px;">Sistema Gestão Sobre Rodas — Governo do Maranhão</p>
            </div>
        `,
        attachments: [
            {
                filename: fileName,
                content: fileBuffer,
                contentType: mimetype,
            },
        ],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Resultado com anexo enviado para: ${email} | ID: ${info.messageId}`);
        return info;
    } catch (error: any) {
        console.error(`⚠️ Falha ao enviar resultado com anexo para ${email}:`, error.message);
        throw error;
    }
};

