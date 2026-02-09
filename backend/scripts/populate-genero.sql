-- Script para popular o campo genero dos cidadãos
-- Atualiza todos os cidadãos que não têm gênero definido

UPDATE cidadaos
SET genero = CASE 
    WHEN RANDOM() < 0.5 THEN 'Masculino'
    ELSE 'Feminino'
END
WHERE genero IS NULL OR genero = '';

-- Verificar resultado
SELECT genero, COUNT(*) as quantidade
FROM cidadaos
GROUP BY genero
ORDER BY genero;
