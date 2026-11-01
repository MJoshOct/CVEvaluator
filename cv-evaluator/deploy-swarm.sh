#!/usr/bin/env bash
set -e

# ─── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

# ─── 1. Swarm init ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}🐳 Checking Docker Swarm status...${NC}"
if [ "$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null)" != "active" ]; then
    echo -e "${YELLOW}⚡ Initializing Docker Swarm (single-node)...${NC}"
    docker swarm init
else
    echo -e "${GREEN}✓ Docker Swarm is already active.${NC}"
fi

# ─── 2. Remove old stack if running (prevents port conflicts) ──────────────────
if docker stack ls 2>/dev/null | grep -q "cv-stack"; then
    echo -e "${YELLOW}⚠️  Removing existing cv-stack to avoid port conflicts...${NC}"
    docker stack rm cv-stack
    echo -n "   Waiting for stack teardown"
    until ! docker stack ls 2>/dev/null | grep -q "cv-stack"; do
        echo -n "."; sleep 2
    done
    echo -e " ${GREEN}done${NC}"
    sleep 4   # extra grace period for port release
fi

# ─── 3. Build images ───────────────────────────────────────────────────────────
echo -e "\n${YELLOW}🔨 Building production container images...${NC}"
docker compose build --no-cache

# ─── 4. Deploy stack ──────────────────────────────────────────────────────────
echo -e "\n${YELLOW}🚀 Deploying stack 'cv-stack' to Docker Swarm...${NC}"
docker stack deploy -c docker-stack.yml cv-stack

# ─── 5. Wait for services to be ready ─────────────────────────────────────────
echo -e "\n${YELLOW}⏳ Waiting for all services to start (up to 90s)...${NC}"
TIMEOUT=90
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $TIMEOUT ]; do
    BACKEND_REPLICAS=$(docker service ls --filter name=cv-stack_backend --format '{{.Replicas}}' 2>/dev/null || echo "0/0")
    FRONTEND_REPLICAS=$(docker service ls --filter name=cv-stack_frontend --format '{{.Replicas}}' 2>/dev/null || echo "0/0")
    DB_REPLICAS=$(docker service ls --filter name=cv-stack_db --format '{{.Replicas}}' 2>/dev/null || echo "0/0")

    BACKEND_READY=$(echo "$BACKEND_REPLICAS" | awk -F'/' '{print ($1 == $2 && $1 != "0")}')
    FRONTEND_READY=$(echo "$FRONTEND_REPLICAS" | awk -F'/' '{print ($1 == $2 && $1 != "0")}')
    DB_READY=$(echo "$DB_REPLICAS" | awk -F'/' '{print ($1 == $2 && $1 != "0")}')

    echo -e "   db: ${DB_REPLICAS}  backend: ${BACKEND_REPLICAS}  frontend: ${FRONTEND_REPLICAS}"

    if [ "$BACKEND_READY" = "1" ] && [ "$FRONTEND_READY" = "1" ] && [ "$DB_READY" = "1" ]; then
        echo -e "\n${GREEN}✅ All services are running!${NC}"
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "\n${RED}⚠️  Timed out waiting. Check logs below:${NC}"
    docker service ls
    echo -e "\nRun: docker service ps cv-stack_backend  (to see why tasks failed)"
fi

# ─── 6. Summary ────────────────────────────────────────────────────────────────
echo -e "\n${YELLOW}📊 Final Stack Status:${NC}"
docker stack services cv-stack

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "  🌐 Frontend:         http://localhost:3000"
echo -e "  🔧 Backend API Docs: http://localhost:8000/docs"
echo -e "  ❤️  Health check:     http://localhost:8000/health"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  docker stack services cv-stack             # check replica counts"
echo -e "  docker service logs cv-stack_backend       # backend logs"
echo -e "  docker service logs cv-stack_frontend      # frontend logs"
echo -e "  docker stack rm cv-stack                   # tear down everything"
