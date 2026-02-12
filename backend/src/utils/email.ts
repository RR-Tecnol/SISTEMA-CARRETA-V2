import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

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
