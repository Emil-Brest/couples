# Inicia el entorno de desarrollo completo
param(
    [switch]$Reset  # usa -Reset para recrear los contenedores
)

$ErrorActionPreference = "Stop"

Write-Host "Iniciando Docker..." -ForegroundColor Cyan

if ($Reset) {
    docker compose down
    docker compose up -d --force-recreate
} else {
    docker compose up -d
}

Write-Host "Esperando que PostgreSQL este listo..." -ForegroundColor Cyan
$timeout = 30
$elapsed = 0
do {
    Start-Sleep -Seconds 2
    $elapsed += 2
    $health = docker inspect --format='{{.State.Health.Status}}' couple_postgres 2>$null
} while ($health -ne "healthy" -and $elapsed -lt $timeout)

if ($health -ne "healthy") {
    Write-Host "Error: PostgreSQL no inicio en $timeout segundos" -ForegroundColor Red
    exit 1
}

Write-Host "Base de datos lista." -ForegroundColor Green

# Corre las migraciones pendientes
Write-Host "Verificando migraciones..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://couple:couple_dev@localhost:5432/couple_db"
pnpm --filter @couple/db db:migrate --skip-generate 2>$null

# Muestra la IP local para acceder desde el celu
$wifiIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -match "^192\.168\." -and $_.InterfaceAlias -notmatch "WSL|Hyper|vEthernet"
} | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Iniciando app..." -ForegroundColor Cyan
if ($wifiIP) {
    Write-Host "Acceso desde celu: http://${wifiIP}:3000" -ForegroundColor Yellow
}
Write-Host ""

pnpm --filter web dev
