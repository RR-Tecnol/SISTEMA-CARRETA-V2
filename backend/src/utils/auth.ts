import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export interface JWTPayload {
    id: string;
    tipo: 'cidadao' | 'admin' | 'medico' | 'admin_estrada';
    email?: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret as string, {
        expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
}
