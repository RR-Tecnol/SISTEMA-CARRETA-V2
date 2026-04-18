import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

export interface LogAuditoria {
    usuario_id?: string;
    usuario_tipo?: string;
    usuario_nome?: string;
    acao: string;
    tabela_afetada?: string;
    registro_id?: string;
    descricao?: string;
    ip_address?: string;
    user_agent?: string;
}

/**
 * Registra uma ação de auditoria de forma não-bloqueante.
 * Falhas são silenciosas para não interromper o fluxo principal.
 */
export async function registrarAuditoria(log: LogAuditoria): Promise<void> {
    try {
        await sequelize.query(
            `INSERT INTO logs_auditoria
             (usuario_id, usuario_tipo, usuario_nome, acao, tabela_afetada, registro_id, descricao, ip_address, user_agent)
             VALUES (:usuario_id, :usuario_tipo, :usuario_nome, :acao, :tabela_afetada, :registro_id, :descricao, :ip_address, :user_agent)`,
            {
                replacements: {
                    usuario_id: log.usuario_id || null,
                    usuario_tipo: log.usuario_tipo || null,
                    usuario_nome: log.usuario_nome || null,
                    acao: log.acao,
                    tabela_afetada: log.tabela_afetada || null,
                    registro_id: log.registro_id || null,
                    descricao: log.descricao || null,
                    ip_address: log.ip_address || null,
                    user_agent: log.user_agent || null,
                },
                type: QueryTypes.INSERT,
            }
        );
    } catch {
        // Silencioso — auditoria não deve quebrar o fluxo
    }
}

/**
 * Helper para extrair dados do usuário da request autenticada
 */
export function extrairDadosUsuario(req: any): Pick<LogAuditoria, 'usuario_id' | 'usuario_tipo' | 'usuario_nome' | 'ip_address' | 'user_agent'> {
    return {
        usuario_id: req.user?.id || null,
        usuario_tipo: req.user?.tipo || null,
        usuario_nome: req.user?.nome || req.user?.email || null,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || null,
        user_agent: req.headers['user-agent']?.substring(0, 255) || null,
    };
}
