import paramiko
import sys
import time

HOST = "76.13.170.155"
USER = "root"
PASS = "@Gestaosobrerodas2026"

def run(ssh, cmd, timeout=120):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out)
    if err: print("[STDERR]", err)
    return out, err

print("Conectando na VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print("✅ Conectado!")

# 1. Localizar projeto
out, _ = run(ssh, "find /root /opt /home -name 'docker-compose.yml' 2>/dev/null | grep -i 'carreta\\|sistema\\|SISTEMA' | head -5")
project_dir = ""
for line in out.strip().split('\n'):
    if line.strip():
        project_dir = line.strip().rsplit('/', 1)[0]
        break

if not project_dir:
    # Tentar caminhos comuns
    out2, _ = run(ssh, "ls /root/")
    print("Conteudo /root/:", out2)
    for name in ["SISTEMA-CARRETA-V2", "sistema-carreta", "sistema-carretas"]:
        o, _ = run(ssh, f"test -d /root/{name} && echo FOUND || echo NOT")
        if "FOUND" in o:
            project_dir = f"/root/{name}"
            break

print(f"\n📁 Projeto em: {project_dir}")

# 2. Verificar containers ativos
run(ssh, "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")

# 3. Backup do banco
print("\n📦 Fazendo backup do banco de dados...")
out, _ = run(ssh, "docker ps --format '{{.Names}}' | grep -i postgres")
postgres_container = out.strip().split('\n')[0]
print(f"Container Postgres: {postgres_container}")

backup_file = f"/root/backup_carretas_{time.strftime('%Y%m%d_%H%M%S')}.sql"
run(ssh, f"docker exec {postgres_container} pg_dump -U postgres sistema_carretas > {backup_file} && echo 'BACKUP OK' || echo 'BACKUP ERRO'")
run(ssh, f"ls -lh {backup_file}")

# 4. Git pull
print("\n📥 Baixando código novo...")
run(ssh, f"cd {project_dir} && git log --oneline -3")
run(ssh, f"cd {project_dir} && git pull origin main 2>&1")
run(ssh, f"cd {project_dir} && git log --oneline -3")

# 5. Rebuild backend e frontend
print("\n🔨 Reconstruindo containers (SEM derrubar volumes)...")
run(ssh, f"cd {project_dir} && docker compose build --no-cache backend frontend 2>&1", timeout=300)
run(ssh, f"cd {project_dir} && docker compose up -d --no-deps backend frontend 2>&1")

# 6. Aguardar e verificar
print("\n⏳ Aguardando 8 segundos...")
time.sleep(8)
run(ssh, f"cd {project_dir} && docker compose ps")
run(ssh, f"cd {project_dir} && docker compose logs backend --tail=40 2>&1")

print("\n✅ DEPLOY FINALIZADO!")
ssh.close()
