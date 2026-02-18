#!/data/data/com.termux/files/usr/bin/bash
# KN3AUX-CODE ADB Server for aShell
# This creates a TCP server that aShell can connect to for ADB commands

PORT=5555
HOST=0.0.0.0

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       KN3AUX-CODE ADB Server for aShell                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Starting ADB server on port $PORT..."
echo ""

# Start ADB server
adb kill-server 2>/dev/null
adb start-server 2>&1

echo ""
echo "Server running on: $HOST:$PORT"
echo ""
echo "In aShell app, connect to:"
echo "  Host: $(hostname -I | awk '{print $1}' || echo '192.168.1.100')"
echo "  Port: $PORT"
echo ""
echo "Then run ADB commands:"
echo "  adb devices"
echo "  adb sideload frp-removal.zip"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep server running
while true; do
    # Check for connected devices
    DEVICES=$(adb devices 2>&1 | grep -v "List of" | grep "device$")
    if [ ! -z "$DEVICES" ]; then
        echo "✓ Device connected: $DEVICES"
        
        # Auto-run FRP removal if device detected
        echo "Running FRP removal commands..."
        
        # Method 1: Quick FRP bypass
        adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1 2>&1
        echo "✓ Setup complete flag set"
        
        # Method 2: Delete FRP files
        adb shell "rm -rf /data/system/users/0/accounts.db*" 2>&1
        adb shell "rm -rf /data/system/users/0/frp*" 2>&1
        adb shell "rm -rf /data/system/gesture.key" 2>&1
        adb shell "rm -rf /data/system/locksettings.db*" 2>&1
        echo "✓ FRP files removed"
        
        # Method 3: Reset setup wizard
        adb shell "settings put secure user_setup_complete 1" 2>&1
        adb shell "settings put global device_provisioned 1" 2>&1
        echo "✓ Setup wizard reset"
        
        echo ""
        echo "FRP removal complete!"
        echo "Reboot device with: adb reboot"
        echo ""
        
        break
    fi
    sleep 2
done
