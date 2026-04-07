---
name: blue-team-defense
description: "Guia de defesa baseado em MITRE ATT&CK — perspectiva Blue Team. Converte conhecimento de tecnicas ofensivas em regras de deteccao, playbooks de resposta a incidentes e hardening de ambiente. Versao defensiva/segura do red-team-tactics."
risk: safe
source: red-team-tactics (community) — reescrita corporativa para perspectiva Blue Team v2026-04-06
security_review: "APROVADA — Tecnicas ofensivas (timestomping, log clearing, AD exploitation) transformadas em regras de DETECCAO e RESPOSTA. Nenhuma instrucao de ataque mantida."
date_added: "2026-04-06"
tags:
  - blue-team
  - siem
  - mitre-attack
  - incident-response
  - detection-engineering
  - hardening
  - active-directory
---

# Blue Team Defense — Deteccao e Resposta Baseada em MITRE ATT&CK
# Reescrita Corporativa do red-team-tactics — Perspectiva Defensiva

> Esta skill converte o conhecimento das tecnicas do MITRE ATT&CK em
> **regras de deteccao, alertas de SIEM e playbooks de resposta**.
> Nenhuma instrucao ofensiva e incluida — apenas mecanismos de defesa.

## O Que Faz

Guia o time de seguranca para:
1. **Detectar** tecnicas de ataque reais mapeadas no MITRE ATT&CK
2. **Responder** a incidentes com playbooks estruturados
3. **Hardening** proativo baseado nas tecnicas mais usadas por atacantes
4. **Documentar** gaps de deteccao para melhoria continua

## Quando Usar

- Montar ou revisar regras de deteccao no SIEM
- Responder a alertas de seguranca ativos
- Fazer threat hunting proativo
- Auditar gaps de visibilidade no ambiente
- Treinar time de seguranca em tecnicas de ataque/defesa

---

## 1. Framework MITRE ATT&CK — Perspectiva Defensiva

### Fases do Ciclo de Ataque e O Que Detectar

| Fase ATT&CK | O Atacante Quer | O Que Monitorar |
|-------------|----------------|-----------------|
| **Reconnaissance** | Mapear superficie de ataque | Scans de rede incomuns, consultas DNS em lote, enumSMB |
| **Initial Access** | Obter primeiro acesso | Falhas de auth repetidas, phishing (emails com links/anexos), exploits em servicos expostos |
| **Execution** | Rodar codigo no alvo | PowerShell/cmd com flags suspeitas (`-enc`, `-nop`), scripts vbs/js, macro Office |
| **Persistence** | Sobreviver a reinicializacoes | Novas chaves em `Run/RunOnce`, tarefas agendadas criadas, servicos novos instalados |
| **Privilege Escalation** | Obter admin/root | Tokens de acesso modificados, processos elevando privilegio, exploits locais |
| **Defense Evasion** | Evitar deteccao | Modificacao de logs, desativacao de AV, processos injetados em legítimos |
| **Credential Access** | Roubar credenciais | Acesso ao LSASS, dump de SAM/NTDS, kerberos tickets anomalos |
| **Discovery** | Mapear rede interna | NetBIOS/LDAP queries em lote, varredura de portas interna, enum de usuarios/grupos |
| **Lateral Movement** | Mover para outros sistemas | Login admin remoto incomum, uso de PsExec/WMI/WinRM, pass-the-hash |
| **Collection** | Coletar dados-alvo | Acesso em massa a arquivos sensiveis, compressao de diretorios, staging de dados |
| **Command & Control** | Manter canal com atacante | Trafego DNS anormal, beaconing periodico, conexoes para IPs novos |
| **Exfiltration** | Extrair dados | Upload grande para destinos externos, uso de DNS/HTTPS para transferencia |

---

## 2. Regras de Deteccao por Tecnica

### 2.1 Defense Evasion — O Que Detectar

> **Contexto:** Atacantes modificam timestamps, limpam logs e ocultam processes.
> Abaixo: como *detectar* essas acoes, nao como executa-las.

#### Deteccao de Timestomping (Modificacao de Metadados)

```yaml
# Regra Sigma — Modificacao anomala de timestamps
title: Timestomping Detected
status: experimental
description: Detecta modificacao de timestamps de arquivo tipica de anti-forense
logsource:
  category: file_change
  product: windows
detection:
  selection:
    EventID: 4663  # Object Access
    ObjectType: File
    AccessMask: '0x40'  # FILE_WRITE_ATTRIBUTES
  filter_system:
    SubjectUserName: 'SYSTEM'
    ObjectName|startswith:
      - 'C:\Windows\System32\'
      - 'C:\Windows\SysWOW64\'
  condition: selection and not filter_system
falsepositives:
  - Software de backup legitimo
  - Instaladores de software
level: medium
tags:
  - attack.defense_evasion
  - attack.t1070.006
```

#### Deteccao de Limpeza de Logs

```yaml
title: Windows Event Log Cleared
status: stable
description: Detecta limpeza de logs de eventos — tecnica comum apos comprometimento
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID:
      - 1102  # Security log cleared
      - 104   # System log cleared
  condition: selection
level: high
tags:
  - attack.defense_evasion
  - attack.t1070.001
response_playbook: |
  1. ISOLAR o sistema imediatamente (desconectar da rede)
  2. Verificar backups de logs no SIEM (logs ja devem ter sido enviados)
  3. Iniciar forensica — o atacante provavelmente ja estava no sistema
  4. Escalar para time de IR
```

#### Deteccao de Process Injection

```yaml
title: Suspicious Process Injection via CreateRemoteThread
status: experimental
description: Detecta injecao de codigo em processos legitimos
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    EventID: 8  # CreateRemoteThread (Sysmon)
    TargetImage|endswith:
      - '\lsass.exe'
      - '\svchost.exe'
      - '\explorer.exe'
      - '\winlogon.exe'
  filter_legit:
    SourceImage|startswith:
      - 'C:\Windows\System32\'
  condition: selection and not filter_legit
level: critical
tags:
  - attack.defense_evasion
  - attack.t1055
```

---

### 2.2 Active Directory — Deteccao de Ataques

> **Contexto:** OS ataques a AD (Kerberoasting, DCSync, Golden Ticket) sao criticos.
> Abaixo: como o SIEM detecta, e como responder — nao como executar os ataques.

#### Kerberoasting — Roubo de Senha de Service Accounts

```
O QUE E (para o defensor entender):
  Atacante solicita tickets Kerberos de service accounts e
  tenta quebrar offline. Service accounts com senhas fracas
  sao comprometidas sem alertar o DC.

COMO DETECTAR no SIEM (evento Windows 4769):
  - EventID 4769 (Kerberos Service Ticket Requested)
  - TicketEncryptionType = 0x17 (RC4-HMAC — fraco, preferido por atacantes)
  - Multiplas requisicoes em curto tempo para accounts diferentes
  - SourceIP nao e servidor de aplicacao legitimo

REGRA DE ALERTA:
  threshold: > 10 eventos 4769 com EncType=0x17 em 1 minuto
  by: mesmo SourceIP
  severity: HIGH

RESPOSTA IMEDIATA:
  1. Identificar service accounts solicitadas
  2. Resetar senhas para senhas longas (> 25 chars) e complexas
  3. Converter para gMSA (Group Managed Service Accounts)
  4. Rever quem tem acesso a essas service accounts
  5. Investigar o SourceIP — provavelmente comprometido

PREVENCAO:
  - Usar gMSA em vez de service accounts tradicionais
  - Senhas de service accounts > 25 caracteres
  - Monitorar continuamente EventID 4769 com EncType RC4
```

#### DCSync — Ataque de Replicacao de Dominio

```
O QUE E (para o defensor entender):
  Atacante simula comportamento de DC para replicar
  hashes NTLM de todos os usuarios via protocolo de
  replicacao do AD. Com NTLM hashes, pode fazer pass-the-hash.

COMO DETECTAR (EventID 4662):
  - EventID 4662 + Access Rights: 0x100 (DS-Replication-Get-Changes)
  - Account NAO e um Domain Controller conhecido
  - Volume alto de requisicoes 4662 de conta nao-DC

REGRA DE ALERTA:
  filter: EventID=4662 AND Rights CONTAINS "1131f6aa" (GetChanges)
  exception: SubjectDN NOT IN lista_de_DCs_conhecidos
  severity: CRITICAL

RESPOSTA IMEDIATA:
  1. Isolar imediatamente a maquina de origem
  2. Assumir que TODOS os hashes do dominio estao comprometidos
  3. Iniciar processo de reset de senha em cascata (krbtgt primeiro!)
  4. Verificar contas com privilegios de replicacao (DS-Replication)
  5. Acionar plano de resposta a incidentes critico

PREVENCAO:
  - Auditar quem tem DS-Replication-Get-Changes no dominio
  - Remover essa permissao de qualquer conta que nao seja DC
  - Usar Protected Users security group para contas privilegiadas
  - Habilitar ATA/Defender for Identity para deteccao automatica
```

---

### 2.3 Credential Access — Protecao do LSASS

```
LSASS (Local Security Authority Subsystem Service):
  Armazena credenciais em memoria. Alvo principal de attackers.

REGRAS DE PROTECAO E DETECCAO:

1. HABILITAR Credential Guard (Windows 10+ Enterprise)
   Isola LSASS em container Hyper-V — torna dump impossivel.

2. DETECTAR acesso suspeito ao processo LSASS (Sysmon EventID 10):
   - SourceImage nao e processo de seguranca conhecido
   - GrantedAccess contem 0x1010 (Read + VM Read)
   - Regra: EventID=10 AND TargetImage CONTAINS "lsass" AND
            GrantedAccess CONTAINS "0x1010"

3. DETECTAR uso de mimikatz (assinatura de memoria):
   - Strings "sekurlsa" ou "lsadump" em linha de comando
   - Carregamento de wdigest.dll de local nao-padrao

4. PREVENCAO via GPO:
   - Habilitar: "Additional LSA Protection" (RunAsPPL)
   - Habilitar: "WDigest Authentication" = Disabled
   - Habilitar: Credential Guard via Device Guard
```

---

## 3. Playbooks de Resposta a Incidentes

### Playbook: Acesso Inicial Detectado (Phishing/Exploit)

```
FASE 1 — TRIAGEM (0-15 minutos)
[ ] Identificar usuario/maquina afetada
[ ] Confirmar se e verdadeiro positivo (nao falso alarme)
[ ] Coletar: hostname, IP, usuario, timestamp, IOC

FASE 2 — CONTENCAO (15-30 minutos)
[ ] Isolar maquina da rede (desativar NIC ou mover para VLAN quarentena)
[ ] Resetar senha do usuario afetado
[ ] Revogar tokens de sessao ativos (Azure AD, VPN)
[ ] Bloquear IOCs no firewall/proxy (IPs, dominios, hashes)

FASE 3 — INVESTIGACAO (30 min - 4 horas)
[ ] Coletar logs: Windows Event, Sysmon, EDR, proxy, DNS
[ ] Construir timeline do ataque (quando entrou? o que fez?)
[ ] Verificar lateral movement (outros sistemas afetados?)
[ ] Identificar qual dado pode ter sido acessado/exfiltrado

FASE 4 — ERRADICACAO
[ ] Remover malware/backdoor identificado
[ ] Corrigir vulnerabilidade explorada (patch, config)
[ ] Verificar persistencia (tarefas agendadas, servicos, Run keys)
[ ] Resetar TODAS as credenciais que o atacante pode ter acessado

FASE 5 — RECUPERACAO
[ ] Reimagem da maquina se comprometimento profundo
[ ] Restaurar de backup verificado se dados corrompidos
[ ] Monitoramento intensificado por 72h apos remediacao

FASE 6 — LICOES APRENDIDAS (pos-incidente)
[ ] Root cause analysis
[ ] Identificar gaps de deteccao que permitiram o ataque
[ ] Criar/melhorar regras de SIEM baseadas no incidente
[ ] Documentar IOCs para inteligencia de ameacas
```

---

## 4. Hardening Proativo por Fase de Ataque

| Fase Prevenida | Controle | Implementacao |
|---------------|---------|--------------|
| Initial Access | MFA obrigatorio | Enforce MFA em todos os logins corporativos |
| Execution | Application Whitelisting | AppLocker ou WDAC — bloquear executaveis nao autorizados |
| Persistence | Monitorar Run keys | Auditoria de EventID 13 (Sysmon — Registry set value) |
| Privilege Esc | Least Privilege | Nenhum usuario de dia-a-dia deve ser admin local |
| Defense Evasion | Log centralizado | Todos os logs → SIEM em tempo real (nao pode ser deletado localmente) |
| Credential Access | Credential Guard | Habilitar em todas as estacoes Windows 10+ |
| Lateral Movement | Segmentacao de rede | VLANs + microsegmentacao; negar admin-to-admin lateral |
| Collection | DLP (Data Loss Prevention) | Alertas de acesso em massa a arquivos sensiveis |
| C2 | DNS filtering + Proxy | Bloquear dominios novos/desconhecidos; forcar proxy corporativo |
| Exfiltration | Egress filtering | Limitar destinos permitidos; alertar em uploads > threshold |

---

## 5. Deteccao de Gaps — Template de Avaliacao

```
AVALIACAO DE COBERTURA MITRE ATT&CK
=====================================
Ambiente: ____________  Data: ____________

Para cada tecnica, avaliar: DETECTADO / PARCIAL / NAO DETECTADO

INITIAL ACCESS:
[ ] T1566 Phishing         → Regra SIEM? ___  EDR? ___  Email Gateway? ___
[ ] T1190 Exploit Pub Vuln → Patch mgmt? ___ WAF? ___  IPS? ___

EXECUTION:
[ ] T1059 Command Line     → Sysmon? ___  PowerShell logging? ___
[ ] T1053 Schedule Task    → EventID 4698 monitorado? ___

PERSISTENCE:
[ ] T1547 Boot Autostart   → Run keys auditados? ___  Servicos? ___

PRIVILEGE ESCALATION:
[ ] T1068 Exploitation     → EDR? ___  Patch nivel? ___

CREDENTIAL ACCESS:
[ ] T1003 OS Cred Dumping  → LSASS protegido? ___  Credential Guard? ___
[ ] T1558 Kerberoasting    → EventID 4769 monitorado? ___

LATERAL MOVEMENT:
[ ] T1550 Pass-the-Hash    → Segmentacao? ___  EventID 4624 Type 3? ___

GAPS IDENTIFICADOS:
1. ___________________________
2. ___________________________
3. ___________________________

PROXIMAS ACOES:
1. ___________________________
Responsavel: ___  Prazo: ___
```

---

## Recursos Essenciais Blue Team

| Recurso | URL | Uso |
|---------|-----|-----|
| MITRE ATT&CK | attack.mitre.org | Referencia completa de tecnicas |
| Sigma Rules | github.com/SigmaHQ/sigma | Regras de deteccao prontas |
| LOLBAS | lolbas-project.github.io | Living-off-the-land binaries legitimos usados por atacantes |
| NIST IR Guide | nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf | Guia de IR |
| Atomic Red Team | github.com/redcanaryco/atomic-red-team | Testes de deteccao controlados |

## Integra com

- `@semgrep-rule-creator` para criar regras SAST baseadas em vulnerabilidades detectadas
- `@security-audit` para auditoria completa pos-incidente  
- `@threat-modeling-expert` para revisao arquitetural proativa
- `@pentest-checklist` para validar que as deteccoes funcionam (teste controlado)
