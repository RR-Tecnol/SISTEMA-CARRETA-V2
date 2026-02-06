import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: 'Token não fornecido' });
            return;
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            res.status(401).json({ error: 'Formato de token inválido' });
            return;
        }

        const payload = verifyToken(token);
        req.user = payload;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

export function authorizeAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }

    if (req.user.tipo !== 'admin') {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        return;
    }

    next();
}
