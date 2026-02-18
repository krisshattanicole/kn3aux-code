# 🚀 TERMUX ULTIMATE - QUICK START GUIDE

## ⚡ Installation (30 Seconds)

```bash
# Download
curl -O https://raw.githubusercontent.com/[repo]/termux_ultimate_installer.sh

# Make executable
chmod +x termux_ultimate_installer.sh

# Install everything
./termux_ultimate_installer.sh --full
```

**Done!** Everything installs automatically in ~5 minutes.

## 🎯 First Steps

### 1. Configure Gemini API
```bash
# Get free API key from: https://makersuite.google.com/app/apikey

# Configure
source ~/.bashrc
gemini config
# Paste your API key
```

### 2. Start Using

```bash
# Launch menu
ultimate

# Or use directly:
gemini chat           # AI chat
gemini code "todo app"  # Generate code
devlab                # Start dev server
csb                   # APK editor
```

## 💡 What's Included

- **Gemini AI**: Chat, code generation, image analysis
- **DevLab OS**: Full dev environment with web UI
- **CSB Enhanced**: APK decompiler/recompiler
- **Multi-AI**: Compare Gemini, Claude, GPT-4

## 📚 Quick Commands

### Gemini AI
```bash
gemini chat                    # Interactive chat
gemini code "REST API Flask"   # Generate code
gemini config                  # Setup API key
```

### DevLab Server
```bash
devlab                         # Start server
# Access: http://localhost:3000
```

### APK Tools
```bash
csb                           # Launch menu
# 1. Decompile APK
# 2. Recompile APK
# 3. List projects
```

### Multi-AI
```bash
cd ~/ultimate_dev/ai
python multi_ai.py "Explain quantum physics" gemini
python multi_ai.py "Write a poem" claude
```

## 🛠️ Installation Options

```bash
# Install everything (recommended)
./termux_ultimate_installer.sh --full

# Install selectively
./termux_ultimate_installer.sh --gemini
./termux_ultimate_installer.sh --devlab
./termux_ultimate_installer.sh --csb

# Combine options
./termux_ultimate_installer.sh --gemini --devlab

# Skip confirmations
./termux_ultimate_installer.sh --full -y

# Verbose mode
./termux_ultimate_installer.sh --full -v
```

## 📁 Workspace

```
~/ultimate_dev/
├── gemini/       # Gemini AI interface
├── devlab/       # DevLab OS server
├── csb/          # APK tools
├── ai/           # Multi-AI interface
├── tools/        # Utilities
└── logs/         # Installation logs
```

## 🎨 Example Workflows

### Build an App with AI
```bash
gemini code "Flutter weather app with API"
# Copy generated code
# Edit in DevLab
devlab
```

### Mod an APK
```bash
csb
# Choose: 1. Decompile APK
# Enter APK path
# Edit files
# Choose: 2. Recompile
```

### Research with Multiple AIs
```bash
cd ~/ultimate_dev/ai
python multi_ai.py "Future of AI" gemini
python multi_ai.py "Future of AI" claude
# Compare responses
```

## 🔑 API Keys

### Required
- **Gemini**: https://makersuite.google.com/app/apikey (FREE)

### Optional
- **Claude**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/

Configure in: `~/.multi_ai_config.json`

## 🐛 Troubleshooting

### Installation fails
```bash
# Check logs
cat ~/ultimate_dev/logs/*.log

# Retry specific component
./termux_ultimate_installer.sh --gemini
```

### Gemini not working
```bash
# Reconfigure
gemini config

# Test connection
gemini chat
> Hello
```

### Server won't start
```bash
# Kill existing process
pkill -f node

# Restart
devlab
```

## 📈 Performance Tips

1. **Close other apps** during installation
2. **Use Wi-Fi** not mobile data
3. **Keep Termux active** (don't minimize)
4. **Free up 500MB** storage before installing

## 🎓 Learning Path

**Day 1**: Install + Configure
```bash
./termux_ultimate_installer.sh --full
gemini config
gemini chat
```

**Day 2**: Explore Gemini
```bash
gemini chat
gemini code "simple calculator"
```

**Day 3**: Try DevLab
```bash
devlab
# Build a web app
```

**Day 4**: APK Modding
```bash
csb
# Decompile an APK
# Explore structure
```

**Day 5**: Multi-AI
```bash
# Compare different AI responses
# Find which works best for you
```

## 💡 Pro Tips

- **Alias**: Add to `~/.bashrc` for quick access
- **Background**: Run servers in background with `&`
- **Port forward**: Access from PC via SSH tunnel
- **Backup**: Save `~/ultimate_dev` regularly

## 🤝 Get Help

- **Logs**: `~/ultimate_dev/logs/`
- **Config**: `~/.gemini_config.json`
- **Reset**: `rm -rf ~/ultimate_dev` and reinstall

## 🎉 You're All Set!

```bash
source ~/.bashrc
ultimate
```

**Welcome to the Ultimate Termux Development Environment!** 🚀
