.PHONY: build up down restart logs clean deploy dev migrate seed

# Build all images
build:
	@echo "🔨 Building Docker images..."
	docker-compose build

# Start production
up:
	@echo "🚀 Starting NoctoClick (production)..."
	docker-compose up -d
	@echo "✅ NoctoClick is running at http://noctoclick.local"

# Start development mode with hot reload
dev:
	@echo "🔧 Starting NoctoClick (development)..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop all services
down:
	@echo "🛑 Stopping NoctoClick..."
	docker-compose down

# Restart all services
restart:
	@echo "🔄 Restarting NoctoClick..."
	docker-compose restart

# Show logs from all services
logs:
	docker-compose logs -f

# Show logs from specific service
logs-api:
	docker-compose logs -f backend

logs-dashboard:
	docker-compose logs -f dashboard

logs-nginx:
	docker-compose logs -f nginx

logs-db:
	docker-compose logs -f postgres

# Run database migrations
migrate:
	@echo "📊 Running database migrations..."
	docker-compose exec backend npm run migrate

# Seed test data
seed:
	@echo "🌱 Seeding test data..."
	docker-compose exec backend npm run seed

# Check status
status:
	@echo "📊 Service status:"
	docker-compose ps

# Clean volumes (WARNING: deletes all data!)
clean:
	@echo "⚠️  Cleaning all volumes (data will be lost)..."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Cleaned"; \
	fi

# Deploy to VPS
deploy:
	@echo "🚀 Deploying to VPS..."
	./deploy.sh

# Setup (first time)
setup:
	@echo "⚙️  Setting up NoctoClick..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file. Please edit it with your settings."; \
		echo "⚠️  Don't forget to change passwords and secrets!"; \
	else \
		echo "✅ .env already exists"; \
	fi
	@echo "🔨 Building images..."
	@make build
	@echo "🚀 Starting services..."
	@make up
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "📊 Running migrations..."
	@make migrate
	@echo "🌱 Seeding test data..."
	@make seed
	@echo "✅ Setup complete! Visit http://noctoclick.local"

# Help
help:
	@echo "NoctoClick - Makefile commands:"
	@echo ""
	@echo "  make setup       - First time setup (creates .env, builds, starts, migrates)"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start production mode"
	@echo "  make dev         - Start development mode (hot reload)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show all logs"
	@echo "  make logs-api    - Show API logs only"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed test data"
	@echo "  make status      - Show service status"
	@echo "  make clean       - Clean all volumes (deletes data!)"
	@echo "  make deploy      - Deploy to VPS"
	@echo ""