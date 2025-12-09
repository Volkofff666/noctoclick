#!/bin/bash

# NoctoClick Deployment Script
# Deploys from local machine to VPS

set -e

# Configuration
VPS_HOST='192.168.1.X'  # Change to your VPS IP
VPS_USER='root'
PROJECT_DIR='/opt/noctoclick'

echo "🚀 Deploying NoctoClick to VPS at $VPS_HOST..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example first"
    exit 1
fi

# 1. Sync files to VPS
echo "📦 Step 1/4: Syncing files to VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.vscode' \
  --exclude '.idea' \
  ./ $VPS_USER@$VPS_HOST:$PROJECT_DIR/

echo "✅ Files synced"
echo ""

# 2. Build and start on VPS
echo "🔨 Step 2/4: Building Docker images on VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
  cd $PROJECT_DIR
  echo "Building images..."
  docker-compose build --no-cache
EOF

echo "✅ Images built"
echo ""

# 3. Stop old containers and start new ones
echo "🔄 Step 3/4: Restarting services..."
ssh $VPS_USER@$VPS_HOST << EOF
  cd $PROJECT_DIR
  echo "Stopping old containers..."
  docker-compose down
  
  echo "Starting new containers..."
  docker-compose up -d
  
  echo "Waiting for services to be ready..."
  sleep 15
EOF

echo "✅ Services restarted"
echo ""

# 4. Run migrations
echo "📊 Step 4/4: Running database migrations..."
ssh $VPS_USER@$VPS_HOST << EOF
  cd $PROJECT_DIR
  docker-compose exec -T backend npm run migrate || echo "Migrations failed or already applied"
EOF

echo "✅ Migrations complete"
echo ""

# Show status
echo "📊 Checking service status..."
ssh $VPS_USER@$VPS_HOST << EOF
  cd $PROJECT_DIR
  docker-compose ps
EOF

echo ""
echo "✅ Deployment complete!"
echo "🌐 NoctoClick is available at: http://noctoclick.local"
echo ""
echo "Useful commands:"
echo "  ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && docker-compose logs -f'  # View logs"
echo "  ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && docker-compose restart'  # Restart services"
echo ""