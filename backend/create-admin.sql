-- Script para criar usuário administrador
-- Senha: admin123

INSERT INTO admins (id, nome, email, senha, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Administrador',
    'admin@systemtruck.com',
    '$2b$10$EcC.QvSAKLgzhBL0W2sSAeRrHHk9aKVdnZEIm0jcT6L6sgenoMMgdO',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
