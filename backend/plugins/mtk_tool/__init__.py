#!/usr/bin/env python3
"""
KN3AUX-CODE MTK Tool Integration
MediaTek device unlock, flash, and exploit toolkit
"""

from flask import Blueprint, jsonify, request, Response
import subprocess
import json
import os
import threading
from queue import Queue
from datetime import datetime

bp = Blueprint('mtk_tool', __name__, url_prefix='/api/mtk')

# MTK tool path
MTK_PATH = os.path.join(
    os.path.dirname(__file__),
    'mtk-unlock-tool-version-2.0'
)
MTK_CMD = ['python3', os.path.join(MTK_PATH, 'mtk')]

class MTKExecutor:
    """Execute MTK commands with live output streaming"""
    
    def __init__(self):
        self.output_queue = Queue()
        self.process = None
        self.log_file = os.path.expanduser('~/.kn3aux-core/logs/mtk_operations.log')
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def _log(self, message: str):
        """Log operation to file"""
        timestamp = datetime.now().isoformat()
        with open(self.log_file, 'a') as f:
            f.write(f"[{timestamp}] {message}\n")
    
    def execute(self, command: list, timeout: int = 300):
        """Execute MTK command and stream output"""
        self._log(f"Executing: {' '.join(command)}")
        
        def run():
            try:
                self.process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    cwd=MTK_PATH
                )
                
                for line in iter(self.process.stdout.readline, ''):
                    if line.strip():
                        self.output_queue.put(line)
                        self._log(f"OUTPUT: {line.strip()}")
                
                self.process.wait()
                self._log(f"Completed with returncode: {self.process.returncode}")
                self.output_queue.put(None)
            except Exception as e:
                error_msg = f"Error: {str(e)}"
                self.output_queue.put(error_msg)
                self._log(f"ERROR: {error_msg}")
                self.output_queue.put(None)
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        return thread
    
    def get_output(self):
        """Get next line of output"""
        try:
            return self.output_queue.get(timeout=1)
        except:
            return None

executor = MTKExecutor()

# Routes

@bp.route('/status', methods=['GET'])
def get_status():
    """Get MTK tool status"""
    try:
        if os.path.exists(MTK_PATH):
            return jsonify({
                'installed': True,
                'path': MTK_PATH,
                'version': '1.6.0',
                'available': True
            })
        else:
            return jsonify({
                'installed': False,
                'message': 'MTK tool not found. Please install.',
                'available': False
            })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/detect', methods=['POST'])
def detect_device():
    """Detect connected MTK device"""
    try:
        result = subprocess.run(
            ['lsusb'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        mtk_devices = []
        for line in result.stdout.split('\n'):
            if '0e8d' in line.lower():
                mtk_devices.append(line.strip())
        
        if mtk_devices:
            return jsonify({
                'detected': True,
                'devices': mtk_devices,
                'count': len(mtk_devices),
                'mode': 'BROM/Preloader',
                'message': f'Detected {len(mtk_devices)} MTK device(s)'
            })
        
        return jsonify({
            'detected': False,
            'message': 'No MTK device detected. Boot to BROM mode (Vol+/- + Power + USB)'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/unlock-bootloader', methods=['POST'])
def unlock_bootloader():
    """Unlock bootloader"""
    try:
        data = request.json or {}
        partitions = data.get('partitions', ['metadata', 'userdata'])
        lock = data.get('lock', False)
        
        results = []
        
        # Erase partitions
        for part in partitions:
            cmd = MTK_CMD + ['e', part]
            result = subprocess.run(cmd, cwd=MTK_PATH, capture_output=True, text=True)
            results.append({
                'partition': part,
                'success': result.returncode == 0,
                'output': result.stdout
            })
        
        # Unlock/Lock SECCFG
        action = 'lock' if lock else 'unlock'
        cmd = MTK_CMD + ['da', 'seccfg', action]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=MTK_PATH)
        
        seccfg_success = result.returncode == 0 or 'successfully' in result.stdout.lower()
        
        all_success = all(r['success'] for r in results) and seccfg_success
        
        executor._log(f"Bootloader {'locked' if lock else 'unlocked'} - Success: {all_success}")
        
        return jsonify({
            'success': all_success,
            'message': f'Bootloader {"locked" if lock else "unlocked"} successfully',
            'operations': results,
            'seccfg': {
                'action': action,
                'success': seccfg_success,
                'output': result.stdout
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/read-partition', methods=['POST'])
def read_partition():
    """Read partition to file"""
    try:
        data = request.json
        partition = data.get('partition')
        output_file = data.get('output')
        
        if not partition or not output_file:
            return jsonify({'error': 'Partition and output required'}), 400
        
        cmd = MTK_CMD + ['r', partition, output_file]
        executor.execute(cmd)
        
        return jsonify({
            'success': True,
            'message': f'Reading {partition} to {output_file}',
            'stream_id': 'read_partition'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/write-partition', methods=['POST'])
def write_partition():
    """Write file to partition"""
    try:
        data = request.json
        partition = data.get('partition')
        input_file = data.get('input')
        
        if not partition or not input_file:
            return jsonify({'error': 'Partition and input file required'}), 400
        
        cmd = MTK_CMD + ['w', partition, input_file]
        executor.execute(cmd)
        
        return jsonify({
            'success': True,
            'message': f'Writing {input_file} to {partition}',
            'stream_id': 'write_partition'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/dump-all', methods=['POST'])
def dump_all():
    """Dump all partitions to directory"""
    try:
        data = request.json or {}
        output_dir = data.get('output_dir', os.path.expanduser('~/kn3aux_backups/mtk_dump'))
        
        os.makedirs(output_dir, exist_ok=True)
        
        cmd = MTK_CMD + ['rl', output_dir]
        executor.execute(cmd, timeout=3600)
        
        return jsonify({
            'success': True,
            'message': f'Dumping all partitions to {output_dir}',
            'stream_id': 'dump_all',
            'estimated_time': '10-30 minutes depending on flash size'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/root-magisk', methods=['POST'])
def root_with_magisk():
    """Magisk root workflow"""
    try:
        # Step 1: Dump boot and vbmeta
        cmd = MTK_CMD + ['r', 'boot,vbmeta', 'boot.img,vbmeta.img']
        result = subprocess.run(cmd, cwd=MTK_PATH, capture_output=True, text=True)
        
        success = result.returncode == 0 or os.path.exists('boot.img')
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Boot images dumped. Next: Patch with Magisk APK',
                'steps': [
                    '1. Push boot.img to device: adb push boot.img /sdcard/Download',
                    '2. Install Magisk APK on device',
                    '3. Open Magisk → Install → Select and Patch a File → boot.img',
                    '4. Pull patched image: adb pull /sdcard/Download/magisk_patched.img',
                    '5. Flash patched: python mtk w boot magisk_patched.img',
                    '6. Reboot: python mtk reset'
                ]
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to dump boot images',
                'output': result.stdout
            })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/stream/<stream_id>')
def stream_output(stream_id):
    """Stream live output from MTK operations"""
    def generate():
        while True:
            output = executor.get_output()
            if output is None:
                yield f"data: {json.dumps({'complete': True})}\n\n"
                break
            yield f"data: {json.dumps({'output': output})}\n\n"
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

@bp.route('/print-gpt', methods=['POST'])
def print_gpt():
    """Print GPT partition table"""
    try:
        cmd = MTK_CMD + ['printgpt']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=MTK_PATH)
        
        return jsonify({
            'success': True,
            'gpt_table': result.stdout,
            'error': result.stderr
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/bypass-sla', methods=['POST'])
def bypass_sla():
    """Bypass SLA/DA protection"""
    try:
        cmd = MTK_CMD + ['payload']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=MTK_PATH)
        
        return jsonify({
            'success': result.returncode == 0,
            'message': 'SLA/DA bypass attempted',
            'output': result.stdout
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/crash-da', methods=['POST'])
def crash_da():
    """Crash DA to enter BROM mode"""
    try:
        cmd = MTK_CMD + ['crash']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=MTK_PATH)
        
        return jsonify({
            'success': True,
            'message': 'DA crash command sent. Device should reboot to BROM.',
            'output': result.stdout
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/read-preloader', methods=['POST'])
def read_preloader():
    """Read preloader for analysis"""
    try:
        data = request.json or {}
        output_file = data.get('output', 'preloader.bin')
        
        cmd = MTK_CMD + ['dumppreloader', f'--filename={output_file}']
        executor.execute(cmd)
        
        return jsonify({
            'success': True,
            'message': 'Dumping preloader',
            'stream_id': 'read_preloader'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/read-brom', methods=['POST'])
def read_brom():
    """Read BROM for analysis"""
    try:
        data = request.json or {}
        output_file = data.get('output', 'brom.bin')
        ptype = data.get('ptype', 'kamakiri')
        
        cmd = MTK_CMD + ['dumpbrom', f'--ptype={ptype}', f'--filename={output_file}']
        executor.execute(cmd)
        
        return jsonify({
            'success': True,
            'message': f'Dumping BROM using {ptype} method',
            'stream_id': 'read_brom'
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/generate-keys', methods=['POST'])
def generate_keys():
    """Generate and display RPMB keys"""
    try:
        cmd = MTK_CMD + ['da', 'generatekeys']
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=MTK_PATH)
        
        return jsonify({
            'success': result.returncode == 0,
            'keys': result.stdout
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/logs', methods=['GET'])
def get_logs():
    """Get MTK operation logs"""
    try:
        limit = int(request.args.get('limit', 100))
        
        if not os.path.exists(executor.log_file):
            return jsonify([])
        
        logs = []
        with open(executor.log_file, 'r') as f:
            for line in f.readlines()[-limit:]:
                logs.append(line.strip())
        
        return jsonify(logs)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

# Initialize plugin
def init_mtk_tool(app):
    """Register MTK tool plugin with Flask app"""
    app.register_blueprint(bp)
