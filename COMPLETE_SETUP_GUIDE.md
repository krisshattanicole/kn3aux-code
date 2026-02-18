# Universal Code Studio - Complete Setup Guide

## 🚀 Full-Stack Mobile Development Environment

Universal Code Studio is a complete IDE for building Android apps with Expo, React Native, and APK manipulation tools. It features:

- ✨ **Monaco Editor** - Professional code editing
- 💾 **Persistent Storage** - localStorage-based file system
- 📦 **APK Tools** - Decompile, patch, rebuild, sign APKs
- 🤖 **AI Assistant** - Code help and guidance  
- 📟 **Integrated Terminal** - Simulated Termux environment
- 🔌 **WebSocket Backend** - Real Python/APK execution

---

## Architecture

```
┌─────────────────────────────────────┐
│   Frontend (HTML/JS/Monaco)         │
│   - File management (localStorage)  │
│   - Code editing                    │
│   - Terminal UI                     │
│   - AI chat interface               │
└──────────────┬──────────────────────┘
               │ WebSocket
               │
┌──────────────▼──────────────────────┐
│   Backend (Node.js + WebSocket)     │
│   - APK building (apktool)          │
│   - Python script execution         │
│   - File system operations          │
│   - AI request handling             │
└─────────────────────────────────────┘
```

---

## Quick Start (3 Options)

### Option 1: Standalone (No Backend)
Just open `universal-code-studio-complete.html` in your browser. Everything runs client-side with simulated commands.

**Perfect for:** Learning, offline work, quick prototyping

### Option 2: With Backend (Local)
```bash
# Install dependencies
npm install

# Start backend server
npm start

# Open frontend
open universal-code-studio-complete.html
```

**Perfect for:** Real APK building, Python execution, full features

### Option 3: Termux (Android)
```bash
# Install Termux from F-Droid
# Setup Node.js
pkg install nodejs-lts

# Clone/copy files
cd ~/storage/shared/universal-code-studio
npm install

# Start server
npm start

# Open in browser
termux-open-url http://localhost:8080
```

**Perfect for:** Mobile development on-the-go, Android device

---

## Detailed Setup

### 1. Frontend Setup

The frontend is a single HTML file with no dependencies:

```bash
# Just open it!
open universal-code-studio-complete.html

# Or serve with Python
python3 -m http.server 8000
# Then visit: http://localhost:8000/universal-code-studio-complete.html
```

**Features available without backend:**
- ✅ Code editing with Monaco
- ✅ File management (localStorage)
- ✅ Multi-tab editing
- ✅ Syntax highlighting
- ✅ Simulated terminal
- ✅ AI chat (simulated responses)

---

### 2. Backend Setup

#### Install Node.js

**On Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**On macOS:**
```bash
brew install node
```

**On Termux (Android):**
```bash
pkg install nodejs-lts
```

#### Install Dependencies

```bash
npm install
```

This installs:
- `ws` - WebSocket server
- `express` - HTTP server

#### Start Backend

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server will run on `http://localhost:8080`

---

### 3. APK Tools Setup (Termux)

To actually build APKs, you need these tools:

```bash
# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install -y \
    nodejs-lts \
    python \
    openjdk-17 \
    git \
    wget \
    curl

# Install apktool
wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool
wget https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.9.1.jar
chmod +x apktool
mv apktool apktool_2.9.1.jar $PREFIX/bin/

# Verify installation
apktool --version

# Setup Android debug keystore (for signing)
mkdir -p ~/.android
keytool -genkey -v -keystore ~/.android/debug.keystore \
    -storepass android -alias androiddebugkey \
    -keypass android -keyalg RSA -keysize 2048 -validity 10000

# Install zipalign (optional, for optimization)
# This comes with Android SDK, or you can skip it
```

---

## Usage Guide

### Creating a New Project

1. **Click "New Project"** - Deploys Expo app skeleton
2. **Edit files** - Modify `expo-app/App.js` 
3. **Save** - Auto-saves to localStorage
4. **Run** - Use terminal or backend commands

### Building an APK

#### Method 1: Use Built-in Tools

1. Click **"APK Tools"** - Deploys Python scripts
2. Place your APK in workspace: `cp your-app.apk workspace/`
3. Click **"Build APK"** - Runs full build pipeline
4. Download from `workspace/dist/`

#### Method 2: Manual Terminal

```bash
# In the terminal panel:
python tools/apk_builder.py your-app.apk

# Or with backend:
# Files in workspace/ are accessible
```

### Using AI Assistant

1. Click **🤖 AI Assistant**
2. Ask questions about:
   - Code debugging
   - Expo/React Native
   - APK manipulation
   - Python scripting
3. AI provides context-aware help

### Keyboard Shortcuts

- `Ctrl+S` - Save all files
- `Ctrl+B` - New file
- `Ctrl+Enter` - Send AI message (in AI panel)

---

## Backend API Reference

### WebSocket Messages

#### Client → Server

```json
{
  "action": "BUILD_APK",
  "payload": {
    "apk": "app.apk"
  },
  "timestamp": 1234567890
}
```

**Available Actions:**

| Action | Payload | Description |
|--------|---------|-------------|
| `DEPLOY_PROJECT_SKELETON` | `{}` | Create Expo app template |
| `DEPLOY_APK_TOOLS` | `{}` | Deploy Python APK scripts |
| `BUILD_APK` | `{ apk: string }` | Build/sign APK |
| `RUN_PYTHON` | `{ script: string, args: [] }` | Execute Python script |
| `AI_REQUEST` | `{ message: string, context: {} }` | AI assistance |
| `SAVE_FILE` | `{ path: string, content: string }` | Save file to workspace |
| `DELETE_FILE` | `{ path: string }` | Delete file |

#### Server → Client

```json
{
  "type": "LOG",
  "payload": {
    "message": "Build started...",
    "level": "info"
  },
  "timestamp": 1234567890
}
```

**Message Types:**

| Type | Payload | Description |
|------|---------|-------------|
| `LOG` | `{ message, level }` | Terminal output |
| `FILE` | `{ path, content }` | File created/updated |
| `BUILD_OUTPUT` | `{ message, artifact }` | Build complete |
| `ERROR` | `{ message }` | Error occurred |
| `AI_RESPONSE` | `{ message }` | AI reply |

### REST API (Optional)

```bash
# Health check
GET /api/health

# List files
GET /api/files

# Trigger build
POST /api/build
Content-Type: application/json
{
  "apk": "app.apk"
}
```

---

## APK Building Workflow

### Complete Build Pipeline

```bash
# 1. Place APK in workspace
cp ~/Downloads/app.apk workspace/

# 2. Decompile
apktool d workspace/app.apk -o workspace/apk_work

# 3. Modify (example: change package name)
# Edit workspace/apk_work/AndroidManifest.xml

# 4. Recompile
apktool b workspace/apk_work -o workspace/dist/app_modified.apk

# 5. Sign
jarsigner -keystore ~/.android/debug.keystore \
    -storepass android \
    workspace/dist/app_modified.apk \
    androiddebugkey

# 6. Optimize (optional)
zipalign -f 4 \
    workspace/dist/app_modified.apk \
    workspace/dist/app_final.apk

# 7. Install
adb install workspace/dist/app_final.apk
```

### Automated with Backend

Just click **"Build APK"** - the backend handles all steps!

---

## Project Structure

```
universal-code-studio/
├── universal-code-studio-complete.html  # Frontend (single file)
├── backend-server.js                     # Backend server
├── package.json                          # Node dependencies
├── workspace/                            # Working directory
│   ├── expo-app/                         # Expo projects
│   ├── tools/                            # Python scripts
│   ├── apk_work/                         # Decompiled APKs
│   └── dist/                             # Built artifacts
└── README.md                             # This file
```

---

## Troubleshooting

### Frontend Issues

**Problem:** Files not persisting
```javascript
// Check localStorage
console.log(localStorage.getItem('ucs_files_v1'));

// Clear if corrupted
localStorage.clear();
location.reload();
```

**Problem:** Monaco editor not loading
```javascript
// Check console for errors
// Verify CDN is accessible
// Try offline Monaco: download and serve locally
```

### Backend Issues

**Problem:** Can't connect to WebSocket
```bash
# Check if server is running
curl http://localhost:8080/api/health

# Check firewall
sudo ufw allow 8080

# Check logs
tail -f backend.log
```

**Problem:** APK build fails
```bash
# Verify apktool installed
apktool --version

# Check Java
java -version

# Verify workspace permissions
chmod -R 755 workspace/
```

### Termux Issues

**Problem:** Permission denied errors
```bash
# Grant storage access
termux-setup-storage

# Check permissions
ls -la ~/storage/shared/
```

**Problem:** Out of memory
```bash
# Free up space
pkg clean

# Check available space
df -h
```

---

## Advanced Configuration

### Custom Backend Port

Edit `backend-server.js`:
```javascript
const PORT = 3000; // Change from 8080
```

Edit `universal-code-studio-complete.html`:
```javascript
const WS_URL = "ws://localhost:3000";
```

### Enable HTTPS (Production)

```javascript
const https = require('https');
const fs = require('fs');

const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);
```

### Connect to Remote Backend

```javascript
// In frontend HTML
const WS_URL = "wss://your-server.com:8080";
```

### Add AI Integration (OpenAI)

```javascript
// In backend-server.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async AI_REQUEST(ws, payload) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: payload.message }]
  });
  
  sendMessage(ws, 'AI_RESPONSE', {
    message: response.choices[0].message.content
  });
}
```

---

## Security Considerations

### For Production

1. **Authentication**: Add auth tokens to WebSocket
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize file paths
4. **Sandboxing**: Run builds in containers
5. **HTTPS**: Use TLS for production

```javascript
// Example: Basic auth
wss.on('connection', (ws, req) => {
  const token = req.headers['authorization'];
  if (token !== process.env.AUTH_TOKEN) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  // ... rest of handler
});
```

---

## Performance Tips

1. **Large Projects**: Use backend instead of localStorage
2. **Multiple Files**: Backend file system is faster
3. **Heavy Builds**: Use Docker containers
4. **Remote Access**: Deploy backend on VPS

---

## Deployment

### Deploy Backend to VPS

```bash
# 1. Copy files
scp -r . user@your-server.com:~/ucs/

# 2. SSH into server
ssh user@your-server.com

# 3. Install dependencies
cd ~/ucs
npm install

# 4. Run with PM2 (keeps it running)
npm install -g pm2
pm2 start backend-server.js --name ucs-backend
pm2 save
pm2 startup

# 5. Setup Nginx reverse proxy (optional)
sudo nano /etc/nginx/sites-available/ucs

# Add:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/ucs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Contributing

Contributions welcome! Areas to improve:

- [ ] Add more APK patching features
- [ ] Integrate real AI APIs (OpenAI, Anthropic)
- [ ] Add Git integration
- [ ] Support for more languages
- [ ] Plugin system
- [ ] Cloud sync

---

## License

MIT License - Use freely!

---

## Support

- **Issues**: GitHub issues
- **Discussions**: GitHub discussions
- **Documentation**: This README

---

## Credits

Built with:
- Monaco Editor (Microsoft)
- WebSocket (ws library)
- Express.js
- apktool (iBotPeaches)

---

## Changelog

### v1.0.0 (2025-02-15)
- ✨ Initial release
- ✅ Monaco editor integration
- ✅ localStorage file system
- ✅ WebSocket backend
- ✅ APK build pipeline
- ✅ AI assistant (simulated)
- ✅ Termux support

---

Happy coding! 🚀
