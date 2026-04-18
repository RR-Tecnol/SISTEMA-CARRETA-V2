# 🧪 GUIA DE TESTES — Sistema Gestão Sobre Rodas

> Atualizado com a Última Rodada de Estabilização (Multi-perfil, Rebranding e BI Comparativo)
> Execute com o sistema rodando em localhost (docker-compose up -d).

---

## PRÉ-REQUISITO: Reiniciar o backend para rodar as migrations novas

```powershell
# No terminal do Docker:
docker-compose restart backend
# ou no terminal de dev:
# Ctrl+C → npm run dev
```

Aguardar no log: `✅ Migration chat_mensagens` e `✅ Migration logs_auditoria`

---

## CONTAS DE TESTE NECESSÁRIAS

Antes de começar, ter em mãos:

- 1 login **admin** (tipo=admin)
- 1 login **médico** (funcionário com is_medico=true)
- 1 login **cidadão** (cadastrado e inscrito em uma ação ativa)

---

## BLOCO 1 — Fluxo Completo de Campo 🔴 (mais crítico)

### TESTE 1.1 — Ciclo de uma ação do zero

| Passo | Onde                | O que fazer                                            | Resultado esperado                |
| ----- | ------------------- | ------------------------------------------------------ | --------------------------------- |
| 1     | `/admin/acoes/nova` | Criar ação com 2 exames: "Ultrassom" e "Clínico Geral" | Ação criada com número sequencial |
| 2     | Lista de ações      | Verificar data exibida                                 | Data correta, não -1 dia          |
| 3     | `GerenciarAcao`     | Vincular um caminhão disponível                        | Caminhão muda para "em_acao"      |
| 4     | `GerenciarAcao`     | Vincular o médico de teste                             | Aparece na aba Equipe             |
| 5     | `GerenciarAcao`     | Mudar status para "ativa"                              | Status verde na listagem          |

### TESTE 1.2 — Cadastro de cidadão com autopreenchimento

| Passo | Onde                                 | O que fazer                                            | Resultado esperado                                                |
| ----- | ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------- |
| 1     | `/admin/cidadaos` (modal novo)       | Digitar CEP válido → sair do campo                     | Rua, bairro, município e UF preenchem automaticamente             |
| 2     | Mesmo modal                          | Digitar CPF completo → sair do campo                   | Se CPF já existe: campos preenchem com dados do cidadão existente |
| 3     | Tentar salvar sem data de nascimento | Clicar "Salvar"                                        | Mensagem: "Data de nascimento é obrigatória"                      |
| 4     | Salvar cidadão completo              | Preencher nome + CPF novo + telefone + data nascimento | Snackbar com botão "Inscrever em Exame →" visível por 8s          |
| 5     | Tentar cadastrar mesmo CPF           | Repetir cadastro                                       | Mensagem de duplicado (não tela branca)                           |

### TESTE 1.3 — Fila e Painel TV com voz

Abrir **4 abas simultâneas**:

- Aba A: `http://localhost:3000/admin/fila` (login admin)
- Aba B: `http://localhost:3000/painel/{ID_DA_ACAO}` (sem login)
- Aba C: `http://localhost:3000/medico/acao/{ID_DA_ACAO}` (login médico)
- Aba D: `http://localhost:3000/portal/inscricoes` (login cidadão)

| Passo | Aba | O que fazer                                                | Resultado esperado                                                                         |
| ----- | --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1     | B   | Clicar "🔊 Ativar Voz"                                     | Botão desaparece, ícone pequeno "🔊 Voz ativa" no header                                   |
| 2     | A   | Selecionar a ação → clicar "🔄 Carregar Inscritos na Fila" | Fichas criadas, lista aparece agrupada por exame                                           |
| 3     | A   | Clicar "📢 Chamar Próximo"                                 | Ficha muda para "Chamado ▶"                                                                |
| 4     | B   | Observar painel TV                                         | Número grande aparece, **voz fala**: "Senha zero zero um. Dirija-se ao Sala 1, por favor." |
| 5     | B   | Verificar histórico                                        | Card da ficha aparece na coluna direita com hora                                           |
| 6     | A   | Chamar mais 2 fichas                                       | Contador "Aguardando" diminui, histórico cresce                                            |

### TESTE 1.4 — Prontuário eletrônico completo

| Passo | Aba C (médico)               | O que fazer                               | Resultado esperado                                                   |
| ----- | ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1     | `/medico/acao/{id}`          | Clicar "▶ Iniciar Turno"                  | Banner verde "Turno iniciado"                                        |
| 2     | Lista de inscritos           | Clicar no paciente pendente               | Consulta inicia, card verde aparece com cronômetro                   |
| 3     | Card "Consulta em Andamento" | Clicar "📋 Prontuário"                    | Drawer desliza da direita com 7 seções                               |
| 4     | Seção Identificação          | Verificar dados                           | Nome, CPF, idade, cartão SUS aparecem                                |
| 5     | Seção Anamnese               | Preencher Queixa Principal                | Campo aceita texto                                                   |
| 6     | Seção Exame Físico           | Preencher Peso: 70, Altura: 175           | IMC calculado automaticamente: "22.9 — Normal"                       |
| 7     | Seção Conduta                | Preencher diagnóstico + CID "J06.9"       | Campos livres                                                        |
| 8     | Observações com Voz          | Clicar "🎤 Iniciar Gravação" → falar algo | Botão fica vermelho pulsante "🔴 Parar"                              |
| 9     | —                            | Clicar "🔴 Parar Gravação"                | Texto transcrito aparece no campo                                    |
| 10    | —                            | Aguardar 3 segundos sem clicar            | Indicador "💾 Salvamento automático em 3 segundos..." aparece e some |
| 11    | —                            | Clicar "Finalizar Consulta" no footer     | Drawer fecha, paciente muda para "Atendido"                          |

---

## BLOCO 2 — Funcionalidades Novas 🟡

### TESTE 2.1 — QR Code do paciente

| Passo | Onde                            | O que fazer                            | Resultado esperado                                                  |
| ----- | ------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| 1     | Painel médico → lista inscritos | Clicar ícone 🔲 ao lado de um paciente | Dialog abre com QR Code 220px                                       |
| 2     | Dialog                          | Ler QR com celular                     | JSON com: `n` (nome), `c` (CPF), `ns` (cartão SUS), `al` (alergias) |
| 3     | Dialog                          | Clicar "🖨️ Imprimir"                   | Preview de impressão — apenas o QR, sem botões                      |

### TESTE 2.2 — Emergência e chat em tempo real

| Passo | Aba D (cidadão)                 | Aba C (médico)                   | Resultado esperado                                                  |
| ----- | ------------------------------- | -------------------------------- | ------------------------------------------------------------------- |
| 1     | `/portal/inscricoes`            | —                                | Botão 🆘 vermelho visível nas inscrições "pendente"                 |
| 2     | Clicar 🆘                       | —                                | Snackbar: "Sinal enviado! A equipe foi notificada"                  |
| 3     | Clicar 🆘 novamente             | —                                | Botão desabilitado "✓ Sinal enviado" (cooldown 30s)                 |
| 4     | —                               | Painel médico                    | Overlay vermelho pulsante aparece: "EMERGÊNCIA! [nome do paciente]" |
| 5     | —                               | Clicar "💬 Abrir Chat" no alerta | Drawer de chat abre à esquerda                                      |
| 6     | —                               | Médico digita mensagem → Enter   | Bolha azul aparece à direita no drawer                              |
| 7     | Aba D → clicar "💬 Chat"        | —                                | Mensagem do médico aparece como bolha cinza à esquerda              |
| 8     | Cidadão digita resposta → Enter | —                                | Mensagem aparece no drawer do médico em tempo real                  |
| 9     | —                               | Fechar drawer e reabrir          | Histórico de mensagens carregado do banco                           |

### TESTE 2.3 — Intervalo de almoço

| Passo | Onde             | O que fazer                              | Resultado esperado                               |
| ----- | ---------------- | ---------------------------------------- | ------------------------------------------------ |
| 1     | `/admin/medicos` | Localizar card de médico com ponto ativo | Botão "☕ Almoço" âmbar visível                  |
| 2     | —                | Clicar "☕ Almoço"                       | Botão muda para vermelho "☕ Fim"                |
| 3     | —                | Aguardar ~1 minuto                       | Banner de status no card atualiza                |
| 4     | —                | Clicar "☕ Fim"                          | Botão volta para "☕ Almoço", duração registrada |

### TESTE 2.4 — Meus Resultados (portal do cidadão)

| Passo | Onde             | O que fazer                           | Resultado esperado                                                  |
| ----- | ---------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 1     | `/portal/exames` | Acessar com login de cidadão atendido | Lista de atendimentos concluídos                                    |
| 2     | —                | Verificar card                        | Mostra: ação, médico, diagnóstico, CID-10, prescrição, retorno      |
| 3     | —                | Clicar "Ver prontuário completo ▼"    | Accordion abre com PA, FC, Temp, Peso, Altura, IMC, queixa, conduta |
| 4     | —                | Se cidadão nunca foi atendido         | Mensagem: "Nenhum atendimento registrado ainda"                     |
| 5     | —                | Clicar 🖨️ Imprimir                    | Todos os cards imprimem com accordion expandido                     |

> **Atenção:** A rota `/portal/exames` só retorna dados se o cidadão logado tiver atendimentos com `status='concluido'` E `ficha_clinica` preenchida (implementado no B1). Cidadãos atendidos antes do B1 aparecem mas com "—" nos campos clínicos.

### TESTE 2.5 — Relatório de Prestação de Contas

| Passo | Onde                | O que fazer                                            | Resultado esperado                                                    |
| ----- | ------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 1     | `/admin/relatorios` | Clicar "📊 Prestação de Contas (PDF)"                  | Dialog abre                                                           |
| 2     | Dialog              | Selecionar ação com atendimentos                       | Datas e processo preenchem automaticamente                            |
| 3     | —                   | Preencher Nº Processo: "001/2026", Lote: "Interior MA" | Campos livres                                                         |
| 4     | —                   | Clicar "Gerar PDF"                                     | Botão fica "Gerando..." (pode levar 5-15s)                            |
| 5     | —                   | PDF baixado                                            | Nome: `prestacao_contas_[N]_[municipio]_[data_inicio]_[data_fim].pdf` |
| 6     | Abrir PDF           | Verificar Página 1                                     | Capa azul com nome da ação, período, processo, CNES, RT               |
| 7     | —                   | Verificar Página 2                                     | Tabela BPA-I com código SUS, quantidade, valor                        |
| 8     | —                   | Verificar última página                                | Quadro de assinatura do Responsável Técnico                           |

---

## BLOCO 3 — Regressão 🟢 (confirmar que nada quebrou)

### TESTE 3.1 — Autenticação

```
✓ Admin → acessa /admin sem problema
✓ Médico → vai para /medico, NÃO consegue acessar /admin/contas-pagar (403)
✓ Cidadão → vai para /portal, NÃO consegue acessar /admin
✓ Token expirado → toast vermelho 2s → redirect /login (não tela branca)
```

### TESTE 3.2 — Exportação de PDF de inscritos

| Passo | Onde                             | Verificar                                                                        |
| ----- | -------------------------------- | -------------------------------------------------------------------------------- |
| 1     | `GerenciarAcao` → aba Inscrições | Clicar "Exportar PDF"                                                            |
| 2     | PDF aberto                       | **Página 1** = capa com 4 boxes KPI (Total / Pendentes / Atendidos / Cancelados) |
| 3     | —                                | **Página 2+** = dados dos inscritos agrupados por exame                          |
| 4     | —                                | Total geral aparece NO FIM dos dados, **não em página em branco separada**       |

### TESTE 3.3 — Estoque crítico

| Passo                           | Resultado esperado                                   |
| ------------------------------- | ---------------------------------------------------- |
| Criar insumo com qtd mínima 10  | Cadastrado                                           |
| Registrar entrada de 5 unidades | Quantidade = 5, indicador AMARELO (abaixo do mínimo) |
| Registrar saída de 6 unidades   | Erro: "Estoque insuficiente"                         |
| Registrar saída de 3 unidades   | Aceita, quantidade = 2, indicador VERMELHO (crítico) |

### TESTE 3.4 — Auto-refresh das telas

Abrir DevTools (F12) → aba Network. Acessar cada tela e aguardar:

```
Dashboard.tsx       → requisição automática a cada 60s ✓
AlertasExames.tsx   → requisição automática a cada 60s ✓
BI.tsx              → requisição automática a cada 60s ✓
MedicoMonitoring.tsx→ requisição automática a cada 30s ✓
```

---

## BLOCO 4 — Auditoria LGPD 🔵

### TESTE 4.1 — Verificar registro de eventos

| Ação                            | Evento esperado em /admin/auditoria |
| ------------------------------- | ----------------------------------- |
| Login de qualquer perfil        | `LOGIN` com IP, tipo, nome          |
| Admin cadastra cidadão          | `CIDADAO_CRIADO`                    |
| Admin edita dados do cidadão    | `CIDADAO_EDITADO`                   |
| Admin redefine senha do cidadão | `SENHA_REDEFINIDA`                  |
| Médico inicia atendimento       | `ATENDIMENTO_INICIADO`              |
| Médico salva prontuário         | `PRONTUARIO_ATUALIZADO`             |
| Médico finaliza atendimento     | `ATENDIMENTO_FINALIZADO`            |

### TESTE 4.2 — Filtros da tela de auditoria

| Filtro                     | Teste                                            |
| -------------------------- | ------------------------------------------------ |
| Tipo de usuário = "Médico" | Apenas eventos de médicos aparecem               |
| Ação = "ATENDIMENTO"       | Filtra parcialmente (ILIKE)                      |
| Data início + fim de hoje  | Apenas eventos de hoje                           |
| Limpar filtros             | Todos os eventos voltam                          |
| Paginação                  | Botões < > funcionam, total de registros correto |

---

## BLOCO 5 — UX e Layout 📱

### TESTE 5.1 — Overflow em notebook (1366px)

Reduzir janela para 1366px de largura e verificar em `/admin/medicos`:

```
✓ Status dos médicos exibe "ATENDENDO" / "ATIVO" / "FORA" (não "EM ATENDIMENTO" cortado)
✓ Nomes longos na tabela "Em Atendimento Agora" truncam com "..."
✓ Valores como "7h30min" no card não quebram linha
```

### TESTE 5.2 — Painel TV em tela cheia

```
1. Abrir /painel/{acao_id} → F11 (tela cheia)
2. Verificar: 3 colunas visíveis (senha central + próximas + histórico)
3. Relógio no header atualizando em tempo real
4. Footer com "Atualizado automaticamente a cada 5 segundos"
5. Sem barras de scroll
```

### TESTE 5.3 — Portal no celular

DevTools → modo mobile (375px iPhone SE):

```
✓ Menu do portal (hambúrguer) abre e fecha
✓ Botões 🆘 e 💬 visíveis nos cards de inscrição
✓ Chat inline rola e o input fica acessível
✓ Cards de "Meus Resultados" empilham em coluna única
```

---

## 🎯 ROTEIRO RÁPIDO (20 minutos, cobre tudo)

Use **4 abas** com os logins já feitos:

```
ABA 1 — Admin:   http://localhost:3000/admin
ABA 2 — Médico:  http://localhost:3000/medico
ABA 3 — Cidadão: http://localhost:3000/portal
ABA 4 — TV:      http://localhost:3000/painel/{ID_ACAO}
```

```
[2 min]  ABA 4: Clicar "🔊 Ativar Voz"
[2 min]  ABA 1: Sincronizar fila → chamar 3 fichas → confirmar voz no painel TV
[3 min]  ABA 2: Iniciar turno → selecionar paciente → abrir prontuário →
         preencher PA + diagnóstico + CID → gravar observação por voz →
         finalizar consulta
[2 min]  ABA 3: Ir em /portal/exames → confirmar resultado aparece com diagnóstico
[2 min]  ABA 3: /portal/inscricoes → clicar 🆘 → ABA 2 deve mostrar alerta
[2 min]  ABA 2: Clicar "Abrir Chat" → mandar mensagem → ABA 3 recebe
[2 min]  ABA 3: Responder no chat inline → ABA 2 recebe em tempo real
[2 min]  ABA 2: Clicar 🔲 num inscrito → verificar QR Code
[2 min]  ABA 1: /admin/auditoria → confirmar todos os eventos registrados
[1 min]  ABA 1: /admin/relatorios → Gerar PDF Prestação de Contas
```

---

## 🐛 Problemas Comuns e Soluções

| Sintoma                                 | Causa provável                                               | Solução                                                |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Voz não fala no painel TV               | AudioContext bloqueado pelo navegador                        | Clicar "🔊 Ativar Voz" antes da primeira chamada       |
| Chat não recebe mensagens em tempo real | Socket.IO não conectou                                       | Verificar console → deve mostrar "⚡ Socket conectado" |
| `/portal/exames` aparece vazio          | Cidadão não tem atendimentos `concluido` com `ficha_clinica` | Fazer um atendimento completo pelo prontuário primeiro |
| Migração `chat_mensagens` não rodou     | Backend não reiniciado                                       | `docker-compose restart backend` e verificar log       |
| PDF de prestação de contas falha        | Ação sem atendimentos ou sem médico vinculado                | Usar ação com pelo menos 1 atendimento concluído       |
| Alerta de emergência não aparece        | Médico não está na sala da ação via Socket.IO                | Garantir que médico está na rota `/medico/acao/{id}`   |
| Auditoria sem eventos                   | Migrations não rodaram ou backend antigo em cache            | Reiniciar backend, fazer login novamente               |

---

## BLOCO 6 — Estabilização Final e Épicos Arquiteturais 🚀

### TESTE 6.1 — Login Multi-Perfil Transparente (L1-12)

| Passo | Onde                           | O que fazer                                                                              | Resultado esperado                                                                                                                |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Tela de Login                  | Inserir um CPF que pertença simultaneamente a um Médico/Admin e a um Cidadão e sua Senha | O sistema intercepta o redirecionamento e abre o **Modal de Seleção de Perfil** ao invés de dar erro ou forçar perfil equivocado. |
| 2     | Modal "Selecione o seu Perfil" | Clicar em "Acesso de Equipe (Admin/Médico)"                                              | O Login é completado injetando o roteamento correto para a Dashboard da Equipe.                                                   |
| 3     | Modal "Selecione o seu Perfil" | Repetir login, mas clicar em "Acesso de Paciente"                                        | O login é completado sendo direcionado para a rota do `/portal`.                                                                  |

### TESTE 6.2 — Business Intelligence e Comparativo Financeiro (L2-46)

| Passo | Onde                   | O que fazer                                          | Resultado esperado                                                                       |
| ----- | ---------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1     | `/admin/cursos-exames` | Editar ou Cadastrar um Exame                         | Há o campo **Valor Unitário (R$)**, insira o valor tabelado (ex: SUS).                   |
| 2     | —                      | Executar alguns atendimentos deste exame em uma ação | Ao finalizar (status "atendido"), o exame acumula valor base.                            |
| 3     | `/admin/bi`            | Abrir a aba Business Intelligence                    | Observar o Card Principal na cor Rosa Arroxado marcado como **Economia ao Estado (R$)**. |
| 4     | `/admin/bi`            | Manter o ponteiro do mouse sobre o card              | O valor exibe no Tooltip o "Custo SUS Estimado" - "Custo Real das Operações".            |

### TESTE 6.3 — Triagem, Auto-Buscas e QoL de Retenção (Quality of Life)

| Passo | Onde                           | O que fazer                                                                                             | Resultado esperado                                                                                                                                                    |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `/admin/cidadaos` (Novo modal) | Digitar **CPF completo** de um paciente já cadastrado e fechar o teclado                                | Se ele já existe, o form realiza autopreenchimento extraindo instantaneamente a base de dados (L1-6).                                                                 |
| 2     | `/admin/cidadaos`              | Digitar o **CEP**                                                                                       | Automaticamente preenche endereço (Rua, Bairro, Cidade, Estado) via integração ViaCEP (L1-5).                                                                         |
| 3     | `/admin/cidadaos`              | Finalizar um Cadastro válido do zero (usando Cartão SUS opcional se quiser)                               | Após o cadastro bem sucedido, o toast fornece atalho automático exibindo aviso `Ver Ações Disponíveis →` por 8s, auto-direcionando para `/admin/acoes`.                  |
| 4     | `GerenciarAcao/Vagas`          | Deixar a aba do Gerenciamento Central de Vagas aberta e logar noutra aba como admin marcando inscrições | O número de **Vagas Restantes** diminui na tela origem sem necessidade de `F5` _(Ao vivo via Websocket L2-43)_.                                                       |
| 5     | `GerenciarAcao`                | Buscar por Cidadão na aba de Inscrições usando um nome ao invés de CPF | A busca aceita letras e encontra via `autocomplete` o paciente, permitindo linkar o cidadão à Ação. |
| 6     | `Médico / Fichas`              | Médico edita dados e tenta fechar aba / ou concluir sem laudo apropriado                                | Aviso bloqueando o fluxo pra não haver perda de dados sensíveis na tela do Médico. O Médico só pode confirmar exame se anexar o mesmo na aba apropriada (L1-8/L1-10). |

### TESTE 6.4 — Rebranding Visual

```
✓ A antiga logo de Caminhão ("Truck") em menus e botões foi generalizada pela Logo "Globo Saúde" nos menus (Reforçando o 'Gestão sobre Rodas').
✓ Menus como "System Truck" foram substituidos integralmente em painéis, home page e login. Emojis desnecessários foram higienizados do Sidebar Administrativo.
✓ Responsividade arrumada no "MedicoMonitoring" e "Panel" com "overflowX: auto" na listagem de paciente/tablets (L2-36).
```
