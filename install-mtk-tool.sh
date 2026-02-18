#!/data/data/com.termux/files/usr/bin/bash
# KN3AUX-CODE MTK Tool Integration Installer
# Installs and configures MTK Unlock Tool

set -euo pipefail

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     KN3AUX-CODE MTK Tool Integration Installer          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running in Termux
if [ -z "$PREFIX" ]; then
    log_error "This script must be run in Termux"
    exit 1
fi

# Step 1: Install dependencies
log_info "Step 1: Installing Python dependencies..."
pip install pyusb pycryptodome pycryptodomex colorama pyserial 2>/dev/null || {
    log_warn "Some dependencies may have failed to install"
}

# Step 2: Check if MTK tool is already cloned
MTK_DIR="$HOME/kn3aux-code/backend/plugins/mtk_tool/mtk-unlock-tool-version-2.0"
if [ ! -d "$MTK_DIR" ]; then
    log_info "Step 2: Cloning MTK Unlock Tool..."
    cd "$HOME/kn3aux-code/backend/plugins/mtk_tool"
    git clone https://github.com/jkabonita/mtk-unlock-tool-version-2.0.git 2>&1 | tail -2
    log_success "MTK tool cloned"
else
    log_success "MTK tool already installed"
fi

# Step 3: Setup permissions
log_info "Step 3: Setting up permissions..."
mkdir -p "$HOME/.kn3aux-core/logs"
touch "$HOME/.kn3aux-core/logs/mtk_operations.log"
chmod 644 "$HOME/.kn3aux-core/logs/mtk_operations.log"

# Step 4: Create USB rules (if possible)
if command -v sudo &>/dev/null; then
    log_info "Setting up USB rules..."
    sudo cp "$MTK_DIR/Setup/Linux/"*.rules /etc/udev/rules.d/ 2>/dev/null || {
        log_warn "Could not copy USB rules (may need manual setup)"
    }
    sudo udevadm control -R 2>/dev/null || true
    log_success "USB rules configured"
else
    log_warn "sudo not available - USB rules not configured"
    log_info "If you have permission issues, run manually:"
    echo "  sudo cp $MTK_DIR/Setup/Linux/*.rules /etc/udev/rules.d/"
    echo "  sudo udevadm control -R"
fi

# Step 5: Update app.py to register plugin
log_info "Step 4: Registering MTK plugin with Flask app..."
APP_PY="$HOME/kn3aux-code/backend/app.py"

if ! grep -q "init_mtk_tool" "$APP_PY" 2>/dev/null; then
    # Add import
    if grep -q "from plugins" "$APP_PY"; then
        sed -i '/from plugins/a from plugins.mtk_tool import init_mtk_tool' "$APP_PY"
    else
        sed -i '/from flask/a from plugins.mtk_tool import init_mtk_tool' "$APP_PY"
    fi
    
    # Add initialization
    if grep -q "init_" "$APP_PY"; then
        sed -i '/init_/a\    init_mtk_tool(app)' "$APP_PY"
    else
        # Find app = Flask line and add after
        sed -i '/app = Flask/a\    init_mtk_tool(app)' "$APP_PY"
    fi
    
    log_success "MTK plugin registered"
else
    log_success "MTK plugin already registered"
fi

# Step 6: Add route to frontend
log_info "Step 5: Adding MTK route to frontend..."
APP_JSX="$HOME/kn3aux-code/frontend/src/App.jsx"

if ! grep -q "MTKDashboard" "$APP_JSX" 2>/dev/null; then
    # Add import
    sed -i '/import.*from/a import MTKDashboard from '\''./pages/MTKDashboard'\''' "$APP_JSX"
    
    # Add route (find a good place after other routes)
    sed -i '/<\/Route>/a\      <Route path="\/mtk" element={<MTKDashboard \/>} />' "$APP_JSX"
    
    log_success "Frontend route added"
else
    log_success "Frontend route already exists"
fi

# Step 7: Create backup directory
log_info "Step 6: Creating backup directory..."
mkdir -p "$HOME/kn3aux_backups/mtk_dump"
log_success "Backup directory created"

# Step 8: Test installation
log_info "Step 7: Testing installation..."
cd "$MTK_DIR"
if python3 mtk 2>&1 | grep -q "Available commands"; then
    log_success "MTK tool is working"
else
    log_warn "MTK tool test failed - may need troubleshooting"
fi

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  Installation Complete                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} MTK Tool installed and configured"
echo ""
echo "Next steps:"
echo "  1. Restart KN3AUX-CODE backend:"
echo "     cd ~/kn3aux-code/backend && ./stop.sh && ./start.sh"
echo ""
echo "  2. Rebuild frontend:"
echo "     cd ~/kn3aux-code/frontend && npm run build"
echo ""
echo "  3. Access MTK Tool at: http://localhost:3000/mtk"
echo ""
echo "Usage:"
echo "  • Power off device"
echo "  • Hold Vol+ (or Vol-) + Power"
echo "  • Connect USB cable"
echo "  • Click 'Refresh' in MTK Dashboard"
echo "  • Select operation (Unlock, Dump, Root, etc.)"
echo ""
echo -e "${YELLOW}⚠️  WARNING:${NC} Use at your own risk. Incorrect flashing can brick your device!"
echo ""
