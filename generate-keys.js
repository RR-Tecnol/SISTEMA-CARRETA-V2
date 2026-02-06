// Script para gerar chaves de segurança
const crypto = require('crypto');

console.log('🔐 CHAVES DE SEGURANÇA - SISTEMA CARRETAS\n');
console.log('='.repeat(80));
console.log('\n📋 COPIE ESTAS CHAVES PARA SEU ARQUIVO .env DE PRODUÇÃO:\n');
console.log('='.repeat(80));

// Gerar JWT Secret (64 bytes)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n# JWT Secret (64 bytes)');
console.log(`JWT_SECRET=${jwtSecret}`);

// Gerar Encryption Key (32 bytes)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n# Encryption Key (32 bytes)');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

// Gerar senha para PostgreSQL
const postgresPassword = crypto.randomBytes(16).toString('hex');
console.log('\n# PostgreSQL Password');
console.log(`POSTGRES_PASSWORD=${postgresPassword}`);

// Gerar senha para MinIO
const minioPassword = crypto.randomBytes(16).toString('hex');
console.log('\n# MinIO Password');
console.log(`MINIO_ROOT_PASSWORD=${minioPassword}`);

console.log('\n' + '='.repeat(80));
console.log('\n⚠️  IMPORTANTE:');
console.log('   1. NUNCA compartilhe estas chaves publicamente');
console.log('   2. NUNCA faça commit destas chaves no Git');
console.log('   3. Guarde estas chaves em local seguro');
console.log('   4. Configure-as no servidor de produção via .env\n');
console.log('='.repeat(80));
console.log('\n✅ Chaves geradas com sucesso!\n');
