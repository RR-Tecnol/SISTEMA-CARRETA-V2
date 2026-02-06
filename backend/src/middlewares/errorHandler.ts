import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
    console.error('Error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        res.status(400).json({
            error: 'Erro de validação',
            details: err.errors.map((e: any) => ({
                field: e.path,
                message: e.message,
            })),
        });
        return;
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({
            error: 'Registro já existe',
            details: err.errors.map((e: any) => ({
                field: e.path,
                message: e.message,
            })),
        });
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Token inválido' });
        return;
    }

    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' });
        return;
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor',
    });
}
