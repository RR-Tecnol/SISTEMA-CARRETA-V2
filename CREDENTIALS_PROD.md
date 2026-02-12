# Credenciais de Produção - VPS Hostinger

## 🔐 Senhas Geradas para Produção

### PostgreSQL Database
```
DB_PASSWORD=Pg$2026!SisCarr@Prod#Secure789
```

### JWT Secret
```
JWT_SECRET=JWT$Carr2026!Sec#Key@Prod789XyZ
```

### MinIO
```
MINIO_SECRET_KEY=MinIO$2026!Carr@Secure#Key789
```

## 📝 Arquivo .env de Produção

Copie este conteúdo para o arquivo `.env` no servidor:

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_carretas
DB_USER=postgres
DB_PASSWORD=Pg$2026!SisCarr@Prod#Secure789

# Frontend URL
FRONTEND_URL=http://76.13.170.155:3000

# JWT
JWT_SECRET=JWT$Carr2026!Sec#Key@Prod789XyZ
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=MinIO$2026!Carr@Secure#Key789
MINIO_BUCKET=carretas

# SMTP (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=a11f6b001@smtp-brevo.com
SMTP_PASS=xsmtpsib-a9b8ec2da52cf7aa089ac01c62fa5b68c5ac16c2db9f8a1bafa456a830f17d78-NskKfsodMYVJYbTv
SMTP_FROM=ronaldo@rrtecnol.com.br

# Encryption
ENCRYPTION_KEY=282b84842d3174706989e82a378721eaa0d63a41f448b24138c8824052de0cc08
```

## ⚠️ IMPORTANTE

- **NÃO** compartilhe estas senhas publicamente
- Mantenha este arquivo seguro
- Após o deploy, considere trocar as senhas periodicamente
