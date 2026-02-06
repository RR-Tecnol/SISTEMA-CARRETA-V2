import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

export function validate(schema: ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            res.status(400).json({
                error: 'Erro de validação',
                details: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                })),
            });
            return;
        }

        req.body = value;
        next();
    };
}
