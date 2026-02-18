#!/usr/bin/env python3
"""
KN3AUX-CODE Plugin Manager
Dynamic plugin loading and marketplace system
"""

import os
import json
import importlib
from pathlib import Path
from typing import Dict, List, Optional

class PluginManager:
    """Manages plugin discovery, loading, and lifecycle"""
    
    def __init__(self, plugins_dir: str = None):
        self.plugins_dir = Path(plugins_dir) if plugins_dir else Path(__file__).parent
        self.loaded_plugins = {}
        self.available_plugins = []
        
    def discover_plugins(self) -> List[Dict]:
        """Scan plugins directory for available plugins"""
        plugins = []
        
        for plugin_dir in self.plugins_dir.iterdir():
            if not plugin_dir.is_dir():
                continue
            if plugin_dir.name.startswith('_') or plugin_dir.name == '__pycache__':
                continue
                
            manifest_path = plugin_dir / 'manifest.json'
            if manifest_path.exists():
                try:
                    with open(manifest_path) as f:
                        manifest = json.load(f)
                    manifest['path'] = str(plugin_dir)
                    manifest['enabled'] = self._is_plugin_enabled(manifest['name'])
                    plugins.append(manifest)
                except Exception as e:
                    print(f"Error loading manifest for {plugin_dir.name}: {e}")
        
        self.available_plugins = plugins
        return plugins
    
    def load_plugin(self, plugin_name: str):
        """Dynamically load a plugin"""
        plugin_dir = self.plugins_dir / plugin_name
        
        if not plugin_dir.exists():
            raise FileNotFoundError(f"Plugin {plugin_name} not found")
        
        # Add plugin directory to Python path
        import sys
        if str(plugin_dir) not in sys.path:
            sys.path.insert(0, str(plugin_dir))
        
        # Import plugin module
        try:
            plugin_module = importlib.import_module('plugin')
            if hasattr(plugin_module, 'register'):
                blueprint = plugin_module.register()
                self.loaded_plugins[plugin_name] = {
                    'module': plugin_module,
                    'blueprint': blueprint,
                    'path': str(plugin_dir)
                }
                return blueprint
        except Exception as e:
            raise ImportError(f"Failed to load plugin {plugin_name}: {e}")
    
    def unload_plugin(self, plugin_name: str):
        """Unload a plugin"""
        if plugin_name in self.loaded_plugins:
            del self.loaded_plugins[plugin_name]
    
    def enable_plugin(self, plugin_name: str):
        """Enable a plugin"""
        config_path = self.plugins_dir.parent / 'plugins_config.json'
        config = {}
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
        config[plugin_name] = {'enabled': True}
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    def disable_plugin(self, plugin_name: str):
        """Disable a plugin"""
        config_path = self.plugins_dir.parent / 'plugins_config.json'
        config = {}
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
        config[plugin_name] = {'enabled': False}
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    def _is_plugin_enabled(self, plugin_name: str) -> bool:
        """Check if plugin is enabled"""
        config_path = self.plugins_dir.parent / 'plugins_config.json'
        if not config_path.exists():
            return True  # Enabled by default
        with open(config_path) as f:
            config = json.load(f)
        return config.get(plugin_name, {}).get('enabled', True)
    
    def install_plugin(self, plugin_url: str) -> bool:
        """Install plugin from URL (GitHub, etc.)"""
        import subprocess
        import tempfile
        
        try:
            # Download plugin
            with tempfile.TemporaryDirectory() as tmpdir:
                result = subprocess.run(
                    ['git', 'clone', '--depth', '1', plugin_url, tmpdir],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if result.returncode != 0:
                    return False
                
                # Copy to plugins directory
                plugin_dir = self.plugins_dir / Path(plugin_url).stem
                subprocess.run(
                    ['cp', '-r', f'{tmpdir}/.', str(plugin_dir)],
                    capture_output=True
                )
                
                return True
        except Exception as e:
            print(f"Plugin installation failed: {e}")
            return False
    
    def get_plugin_stats(self) -> Dict:
        """Get plugin statistics"""
        return {
            'total_available': len(self.available_plugins),
            'total_loaded': len(self.loaded_plugins),
            'plugins': [
                {
                    'name': p.get('name'),
                    'version': p.get('version'),
                    'enabled': p.get('enabled')
                }
                for p in self.available_plugins
            ]
        }


# Flask integration
def create_plugin_routes(app, plugin_manager: PluginManager):
    """Create Flask routes for plugin management"""
    from flask import jsonify, request
    
    @app.route('/api/plugins', methods=['GET'])
    def list_plugins():
        """List all available plugins"""
        plugins = plugin_manager.discover_plugins()
        return jsonify(plugins)
    
    @app.route('/api/plugins/stats', methods=['GET'])
    def plugin_stats():
        """Get plugin statistics"""
        return jsonify(plugin_manager.get_plugin_stats())
    
    @app.route('/api/plugins/<name>/enable', methods=['POST'])
    def enable_plugin(name):
        """Enable a plugin"""
        plugin_manager.enable_plugin(name)
        return jsonify({'status': 'ok', 'message': f'{name} enabled'})
    
    @app.route('/api/plugins/<name>/disable', methods=['POST'])
    def disable_plugin(name):
        """Disable a plugin"""
        plugin_manager.disable_plugin(name)
        return jsonify({'status': 'ok', 'message': f'{name} disabled'})
    
    @app.route('/api/plugins/install', methods=['POST'])
    def install_plugin():
        """Install plugin from URL"""
        data = request.get_json()
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL required'}), 400
        
        success = plugin_manager.install_plugin(url)
        if success:
            return jsonify({'status': 'ok', 'message': 'Plugin installed'})
        return jsonify({'error': 'Installation failed'}), 500


# Initialize plugin manager
plugin_manager = PluginManager()
