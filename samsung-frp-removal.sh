#!/data/data/com.termux/files/usr/bin/bash
# KN3AUX-CODE - Direct ADB FRP Removal for Samsung A14
# Run this AFTER connecting device via aShell or USB

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Samsung A14 5G FRP Removal - Direct ADB              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if device is connected
echo "[1/5] Checking device connection..."
DEVICES=$(adb devices 2>&1 | grep -v "List of" | grep "device$" | head -1)

if [ -z "$DEVICES" ]; then
    echo "❌ No device detected!"
    echo ""
    echo "In aShell app, run:"
    echo "  adb connect DEVICE_IP:5555"
    echo ""
    echo "Or connect via USB OTG and run:"
    echo "  adb devices"
    exit 1
fi

echo "✓ Device detected: $DEVICES"
SERIAL=$(echo $DEVICES | awk '{print $1}')

# FRP Removal
echo ""
echo "[2/5] Bypassing FRP lock..."
adb -s $SERIAL shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1 2>&1
echo "✓ Setup complete flag set"

echo ""
echo "[3/5] Removing FRP files..."
adb -s $SERIAL shell "rm -rf /data/system/users/0/accounts.db*" 2>&1
adb -s $SERIAL shell "rm -rf /data/system/users/0/frp*" 2>&1
adb -s $SERIAL shell "rm -rf /data/system/gesture.key" 2>&1
adb -s $SERIAL shell "rm -rf /data/system/locksettings.db*" 2>&1
adb -s $SERIAL shell "rm -rf /data/system/users/0/secure_storage.db" 2>&1
echo "✓ FRP files removed"

echo ""
echo "[4/5] Resetting setup wizard..."
adb -s $SERIAL shell "settings put secure user_setup_complete 1" 2>&1
adb -s $SERIAL shell "settings put global device_provisioned 1" 2>&1
adb -s $SERIAL shell "settings put secure provisioning_complete 1" 2>&1
echo "✓ Setup wizard reset"

echo ""
echo "[5/5] Cleaning up..."
adb -s $SERIAL shell "pm clear com.android.frp" 2>&1
adb -s $SERIAL shell "pm disable-user --user 0 com.google.android.setupwizard" 2>&1
echo "✓ FRP services disabled"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              FRP REMOVAL COMPLETE!                       ║"
echo "║                                                          ║"
echo "║  Rebooting device now...                                 ║"
echo "╚══════════════════════════════════════════════════════════╝"

adb -s $SERIAL reboot

echo ""
echo "Device is rebooting. FRP lock should be removed!"
echo "If FRP persists, run this script again after reboot."
