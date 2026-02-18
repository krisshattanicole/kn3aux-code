# Samsung A14 FRP Removal - Using aShell

## Method 1: aShell Wireless ADB (RECOMMENDED)

### Step 1: Enable Wireless ADB on Samsung

**On the Samsung device in recovery:**
1. In recovery menu, look for **"Advanced"** or **"ADB"**
2. Select **"ADB over network"** or **"Wireless ADB"**
3. Note the IP address shown (e.g., `192.168.1.100:5555`)

**If no wireless option in recovery:**
1. Boot phone normally (don't stay in recovery)
2. On setup screen, tap **"Emergency call"**
3. Dial `*#0*#` to open test menu
4. If it opens, you can access settings
5. Go to Settings → About Phone → Software Info
6. Tap "Build Number" 7 times to enable Developer Options
7. Go back → Developer Options → Enable **"Wireless debugging"**

### Step 2: Connect from aShell

**Open aShell app on your phone:**

```bash
# Connect to Samsung device
adb connect 192.168.1.100:5555

# Verify connection
adb devices

# Should show: 192.168.1.100:5555    device
```

### Step 3: Run FRP Removal

**In aShell, after connecting:**

```bash
# Quick FRP bypass
adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1

# Remove FRP files
adb shell rm /data/system/users/0/accounts.db*
adb shell rm /data/system/users/0/frp*
adb shell rm /data/system/gesture.key
adb shell rm /data/system/locksettings.db*

# Disable setup wizard
adb shell pm disable-user --user 0 com.google.android.setupwizard

# Reboot
adb reboot
```

**OR run the automated script:**

```bash
cd /sdcard/Download/kn3aux-code
./samsung-frp-removal.sh
```

---

## Method 2: aShell + USB OTG (If Supported)

**Requirements:**
- USB OTG cable
- Samsung device connected via USB

**In aShell app:**

```bash
# Enable ADB over USB (may need root)
setprop service.adb.tcp.port 0
stop adbd
start adbd

# Check devices
adb devices

# If detected, run FRP removal
./samsung-frp-removal.sh
```

---

## Method 3: Create Local ADB Server

**Run this in Termux:**

```bash
# Start ADB server
adb kill-server
adb start-server

# ADB is now listening on port 5037
# In aShell, you can connect to localhost
```

**Then in aShell app:**

```bash
adb connect 127.0.0.1:5037
adb devices
./samsung-frp-removal.sh
```

---

## Quick Commands Reference

```bash
# Check connection
adb devices

# FRP bypass (one-liner)
adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1

# Full FRP removal
adb shell "rm -rf /data/system/users/0/accounts.db* /data/system/users/0/frp* /data/system/gesture.key /data/system/locksettings.db*"

# Disable Google setup
adb shell pm disable-user --user 0 com.google.android.setupwizard

# Reboot
adb reboot
```

---

## Troubleshooting

### "No devices detected"
- Make sure wireless ADB is enabled on Samsung
- Check IP address is correct
- Both devices must be on same WiFi network
- Try: `adb connect IP:5555 --pair`

### "Connection refused"
- Samsung may not have wireless ADB in recovery
- Try booting normally and using emergency dialer method
- Or use PC with Odin

### "Permission denied"
- Device may need unlocked bootloader
- Try custom recovery (TWRP)
- Or use professional tools (SamFw, Octoplus)

---

## Files Created

- `/sdcard/Download/kn3aux-code/samsung-frp-removal.sh` - Automated script
- `/sdcard/Download/SAMSUNG-A14-FRP-UNLOCK-GUIDE.txt` - Full guide
- GitHub: https://github.com/krisshattanicole/kn3aux-code

---

**Created by KN3AUX-CODE v5.0**
