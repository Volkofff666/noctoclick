#!/bin/bash

# VPS Initialization Script for NoctoClick
# Run once on a fresh Ubuntu VPS

set -e

echo "🔧 Initializing VPS for NoctoClick..."
echo ""

# Update system
echo "📦 Step 1/5: Updating system packages..."
apt update && apt upgrade -y
echo "✅ System updated"
echo ""

# Install Docker
echo "🐋 Step 2/5: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi
echo ""

# Install Docker Compose
echo "🐋 Step 3/5: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi
echo ""

# Enable Docker autostart
echo "⚙️  Step 4/5: Configuring Docker autostart..."
systemctl enable docker
systemctl start docker
echo "✅ Docker service configured"
echo ""

# Create project directory
echo "📁 Step 5/5: Creating project directory..."
mkdir -p /opt/noctoclick
echo "✅ Project directory created at /opt/noctoclick"
echo ""

# Configure firewall (optional)
read -p "Configure UFW firewall? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔥 Configuring firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw --force enable
    echo "✅ Firewall configured"
fi
echo ""

# Show Docker info
echo "📊 Docker version:"
docker --version
docker-compose --version
echo ""

echo "✅ VPS initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Copy your project files to this VPS"
echo "  2. Run: cd /opt/noctoclick && ./deploy.sh"
echo "  3. Add to /etc/hosts on your local machine:"
echo "     <VPS_IP> noctoclick.local"
echo ""
echo "Or use the deploy.sh script from your local machine."
echo ""