# ==============================================================================
# Docker Swarm Automated Deployment Script for CV Evaluator
# ==============================================================================

Write-Host "🐳 Checking Docker Swarm status..." -ForegroundColor Cyan
$swarmStatus = docker info --format '{{.Swarm.LocalNodeState}}' 2>$null

if ($swarmStatus -ne "active") {
    Write-Host "⚡ Initializing Docker Swarm..." -ForegroundColor Yellow
    docker swarm init
} else {
    Write-Host "✓ Docker Swarm is active." -ForegroundColor Green
}

Write-Host "`n🔨 Building production container images..." -ForegroundColor Cyan
docker compose build

Write-Host "`n🚀 Deploying stack 'cv-stack' to Docker Swarm..." -ForegroundColor Cyan
docker stack deploy -c docker-stack.yml cv-stack

Write-Host "`n⏳ Waiting for services to reach healthy state..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

Write-Host "`n📊 Current Stack Status:" -ForegroundColor Green
docker stack services cv-stack

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000"
Write-Host "🔧 Backend API Docs: http://localhost:8000/docs"
Write-Host "🛑 To remove stack: docker stack rm cv-stack"
