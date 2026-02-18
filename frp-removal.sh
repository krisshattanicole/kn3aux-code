#!/data/data/com.termux/files/usr/bin/bash
# KN3AUX-CODE FRP Removal Script
# Quick FRP bypass for recovery mode devices

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          KN3AUX-CODE FRP REMOVAL TOOL                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check ADB connection
echo "[1/4] Checking device connection..."
adb devices | grep -q "device$"
if [ $? -ne 0 ]; then
    echo "❌ No device detected!"
    echo ""
    echo "Make sure:"
    echo "  1. Device is in recovery mode"
    echo "  2. 'Apply from ADB' is selected"
    echo "  3. USB cable is connected"
    exit 1
fi
echo "✓ Device detected"

# Method 1: Quick FRP bypass
echo ""
echo "[2/4] Attempting FRP bypass..."
adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1 2>&1
echo "✓ Setup complete flag set"

# Method 2: Delete FRP files
echo ""
echo "[3/4] Removing FRP files..."
adb shell "rm -rf /data/system/users/0/accounts.db*" 2>&1
adb shell "rm -rf /data/system/users/0/frp*" 2>&1
adb shell "rm -rf /data/system/gesture.key" 2>&1
adb shell "rm -rf /data/system/locksettings.db*" 2>&1
echo "✓ FRP files removed"

# Method 3: Reset setup wizard
echo ""
echo "[4/4] Resetting setup wizard..."
adb shell "settings put secure user_setup_complete 1" 2>&1
adb shell "settings put global device_provisioned 1" 2>&1
adb shell "settings put secure provisioning_complete 1" 2>&1
echo "✓ Setup wizard reset"

# Reboot
echo ""
echo "FRP removal complete! Rebooting device..."
adb reboot

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  FRP REMOVAL COMPLETE                    ║"
echo "║                                                          ║"
echo "║  Device will reboot without FRP lock                     ║"
echo "║  If FRP persists, try again or use custom recovery       ║"
echo "╚══════════════════════════════════════════════════════════╝"
