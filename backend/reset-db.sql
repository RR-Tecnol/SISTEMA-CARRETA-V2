-- Fix: Recria banco do zero com schema correto

-- 1. Drop e recria database (CUIDADO!)
DROP DATABASE IF EXISTS sistema_carretas;
CREATE DATABASE sistema_carretas;

\c sistema_carretas;

-- 2. Cria todas as tabelas
-- (executar o init-database.sql completo)
