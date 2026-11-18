# ==============================================================================
# Docker Swarm Automated Deployment Script for CV Evaluator
# ==============================================================================

Write-Host "[INFO] Checking Docker Swarm status..." -ForegroundColor Cyan
$swarmStatus = docker info --format '{{.Swarm.LocalNodeState}}' 2>$null

if ($swarmStatus -ne "active") {
    Write-Host "[INIT] Initializing Docker Swarm..." -ForegroundColor Yellow
    docker swarm init
} else {
    Write-Host "[OK] Docker Swarm is active." -ForegroundColor Green
}

Write-Host "`n[BUILD] Building production container images..." -ForegroundColor Cyan
docker compose build

Write-Host "`n[DEPLOY] Deploying stack 'cv-stack' to Docker Swarm..." -ForegroundColor Cyan
docker stack deploy -c docker-stack.yml cv-stack

Write-Host "`n[WAIT] Waiting for services to reach healthy state..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

Write-Host "`n[STATUS] Current Stack Status:" -ForegroundColor Green
docker stack services cv-stack

Write-Host "`n[SUCCESS] Deployment complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend API Docs: http://localhost:8000/docs"
Write-Host "To remove stack: docker stack rm cv-stack"
