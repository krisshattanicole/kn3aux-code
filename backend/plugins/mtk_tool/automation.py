#!/usr/bin/env python3
"""
MTK Tool Automation
Pre-configured workflows for common operations
"""

import subprocess
import json
import os
import time
from typing import List, Dict, Callable

MTK_PATH = os.path.join(os.path.dirname(__file__), 'mtk-unlock-tool-version-2.0')
MTK_CMD = ['python3', os.path.join(MTK_PATH, 'mtk')]

class MTKAutomation:
    """Automated MTK workflows"""
    
    def __init__(self, callback: Callable = None):
        self.callback = callback  # For progress updates
        self.log_file = os.path.expanduser('~/.kn3aux-core/logs/mtk_automation.log')
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def _log(self, message: str):
        """Log message"""
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        with open(self.log_file, 'a') as f:
            f.write(f"[{timestamp}] {message}\n")
        
        if self.callback:
            self.callback(message)
    
    def _run(self, command: List[str], timeout: int = 60) -> Dict:
        """Run MTK command"""
        self._log(f"Running: {' '.join(command)}")
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=MTK_PATH
            )
            
            success = result.returncode == 0
            
            self._log(f"Success: {success}")
            if result.stdout:
                self._log(f"Output: {result.stdout[:200]}")
            
            return {
                'success': success,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            self._log("Command timed out")
            return {'success': False, 'error': 'Timeout'}
        except Exception as e:
            self._log(f"Error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def unlock_bootloader(self, erase_partitions: List[str] = None) -> Dict:
        """Complete bootloader unlock workflow"""
        if erase_partitions is None:
            erase_partitions = ['metadata', 'userdata']
        
        self._log("Starting bootloader unlock workflow")
        results = []
        
        # Step 1: Erase partitions
        for partition in erase_partitions:
            self._log(f"Erasing {partition}...")
            result = self._run(MTK_CMD + ['e', partition])
            results.append({
                'operation': f'erase_{partition}',
                'success': result['success']
            })
            if not result['success']:
                self._log(f"Failed to erase {partition}")
                return {
                    'success': False,
                    'step': f'erase_{partition}',
                    'results': results,
                    'message': f'Failed to erase {partition}'
                }
            time.sleep(1)
        
        # Step 2: Unlock SECCFG
        self._log("Unlocking SECCFG...")
        result = self._run(MTK_CMD + ['da', 'seccfg', 'unlock'])
        results.append({
            'operation': 'unlock_seccfg',
            'success': result['success']
        })
        
        # Step 3: Reboot
        self._log("Rebooting device...")
        self._run(MTK_CMD + ['reset'])
        
        success = all(r['success'] for r in results)
        
        return {
            'success': success,
            'results': results,
            'message': 'Bootloader unlocked successfully' if success else 'Unlock failed',
            'next_steps': [
                'Device will reboot',
                'FRP will be removed',
                'You can now flash custom recovery/ROM'
            ] if success else []
        }
    
    def lock_bootloader(self) -> Dict:
        """Lock bootloader (re-lock)"""
        self._log("Starting bootloader lock workflow")
        
        # Lock SECCFG
        result = self._run(MTK_CMD + ['da', 'seccfg', 'lock'])
        
        if result['success']:
            self._run(MTK_CMD + ['reset'])
            return {
                'success': True,
                'message': 'Bootloader locked successfully',
                'warning': 'Make sure you have stock firmware before locking!'
            }
        else:
            return {
                'success': False,
                'message': 'Failed to lock bootloader'
            }
    
    def full_backup(self, output_dir: str = None) -> Dict:
        """Full partition backup"""
        if output_dir is None:
            output_dir = os.path.expanduser('~/kn3aux_backups/mtk_dump')
        
        os.makedirs(output_dir, exist_ok=True)
        
        self._log(f"Starting full backup to {output_dir}")
        
        result = self._run(
            MTK_CMD + ['rl', output_dir],
            timeout=3600  # 1 hour timeout
        )
        
        if result['success']:
            return {
                'success': True,
                'backup_path': output_dir,
                'message': f'Backup completed to {output_dir}',
                'next_steps': [
                    'Verify backup integrity',
                    'Consider encrypting sensitive partitions',
                    'Store backup in safe location'
                ]
            }
        else:
            return {
                'success': False,
                'message': 'Backup failed',
                'error': result.get('stderr', 'Unknown error')
            }
    
    def magisk_root(self) -> Dict:
        """Complete Magisk root workflow"""
        self._log("Starting Magisk root workflow")
        
        # Step 1: Dump boot and vbmeta
        self._log("Dumping boot and vbmeta...")
        result = self._run(MTK_CMD + ['r', 'boot,vbmeta', 'boot.img,vbmeta.img'])
        
        if not result['success']:
            return {
                'success': False,
                'step': 'dump_boot',
                'message': 'Failed to dump boot images'
            }
        
        # Check if files exist
        boot_exists = os.path.exists(os.path.join(MTK_PATH, 'boot.img'))
        
        if not boot_exists:
            return {
                'success': False,
                'step': 'verify_dump',
                'message': 'boot.img not found after dump'
            }
        
        return {
            'success': True,
            'step': 'dump_complete',
            'message': 'Boot images dumped successfully',
            'instructions': [
                '1. Push boot.img to device:',
                '   adb push boot.img /sdcard/Download',
                '',
                '2. Install Magisk APK on device',
                '',
                '3. Open Magisk → Install → Select and Patch a File',
                '   Select boot.img from /sdcard/Download',
                '',
                '4. Pull patched image:',
                '   adb pull /sdcard/Download/magisk_patched.img',
                '',
                '5. Flash patched boot:',
                '   python mtk w boot magisk_patched.img',
                '',
                '6. Reboot:',
                '   python mtk reset'
            ]
        }
    
    def bypass_sla(self) -> Dict:
        """Bypass SLA/DA protection"""
        self._log("Starting SLA bypass")
        
        result = self._run(MTK_CMD + ['payload'])
        
        if result['success']:
            return {
                'success': True,
                'message': 'SLA bypassed successfully',
                'note': 'Bypass is temporary - device will reset on reboot'
            }
        else:
            return {
                'success': False,
                'message': 'SLA bypass failed',
                'alternatives': [
                    'Try different button combination',
                    'Try crash method: python mtk crash',
                    'Check if device needs test points'
                ]
            }
    
    def read_partition(self, partition: str, output_file: str) -> Dict:
        """Read single partition"""
        self._log(f"Reading {partition} to {output_file}")
        
        result = self._run(MTK_CMD + ['r', partition, output_file])
        
        return {
            'success': result['success'],
            'partition': partition,
            'output_file': output_file,
            'message': f'{partition} {"read successfully" if result["success"] else "read failed"}'
        }
    
    def write_partition(self, partition: str, input_file: str) -> Dict:
        """Write single partition"""
        self._log(f"Writing {input_file} to {partition}")
        
        # Verify file exists
        if not os.path.exists(input_file):
            return {
                'success': False,
                'message': f'Input file not found: {input_file}'
            }
        
        result = self._run(MTK_CMD + ['w', partition, input_file])
        
        return {
            'success': result['success'],
            'partition': partition,
            'input_file': input_file,
            'message': f'{partition} {"written successfully" if result["success"] else "write failed"}'
        }
    
    def erase_partition(self, partition: str) -> Dict:
        """Erase partition"""
        self._log(f"Erasing {partition}")
        
        result = self._run(MTK_CMD + ['e', partition])
        
        return {
            'success': result['success'],
            'partition': partition,
            'message': f'{partition} {"erased successfully" if result["success"] else "erase failed"}'
        }
    
    def print_gpt(self) -> Dict:
        """Print GPT partition table"""
        self._log("Reading GPT")
        
        result = self._run(MTK_CMD + ['printgpt'])
        
        return {
            'success': result['success'],
            'gpt_table': result['stdout'],
            'partitions': self._parse_gpt(result['stdout']) if result['success'] else []
        }
    
    def _parse_gpt(self, gpt_output: str) -> List[Dict]:
        """Parse GPT output"""
        partitions = []
        
        if not gpt_output:
            return partitions
        
        # Simple parser - adjust based on actual output format
        for line in gpt_output.split('\n'):
            if ':' in line and 'part' in line.lower():
                parts = line.split(':')
                if len(parts) >= 2:
                    partitions.append({
                        'name': parts[0].strip(),
                        'info': parts[1].strip()
                    })
        
        return partitions
    
    def generate_rpmb_keys(self) -> Dict:
        """Generate RPMB keys"""
        self._log("Generating RPMB keys")
        
        result = self._run(MTK_CMD + ['da', 'generatekeys'])
        
        return {
            'success': result['success'],
            'keys': result['stdout'],
            'message': 'RPMB keys generated' if result['success'] else 'Failed to generate keys'
        }
    
    def crash_da(self) -> Dict:
        """Crash DA to enter BROM"""
        self._log("Crashing DA to enter BROM")
        
        result = self._run(MTK_CMD + ['crash'])
        
        return {
            'success': True,
            'message': 'DA crash command sent',
            'next_steps': [
                'Device should reboot to BROM mode',
                'Reconnect USB if needed',
                'Run desired BROM operation'
            ]
        }
    
    def read_preloader(self, output_file: str = 'preloader.bin') -> Dict:
        """Read preloader"""
        self._log("Reading preloader")
        
        result = self._run(
            MTK_CMD + ['dumppreloader', f'--filename={output_file}']
        )
        
        return {
            'success': result['success'],
            'output_file': output_file,
            'message': 'Preloader dumped' if result['success'] else 'Failed to dump preloader'
        }
    
    def read_brom(self, output_file: str = 'brom.bin', method: str = 'kamakiri') -> Dict:
        """Read BROM"""
        self._log(f"Reading BROM using {method} method")
        
        result = self._run(
            MTK_CMD + ['dumpbrom', f'--ptype={method}', f'--filename={output_file}']
        )
        
        return {
            'success': result['success'],
            'output_file': output_file,
            'method': method,
            'message': 'BROM dumped' if result['success'] else 'Failed to dump BROM'
        }


# Convenience functions
def quick_unlock() -> Dict:
    """Quick bootloader unlock"""
    auto = MTKAutomation()
    return auto.unlock_bootloader()

def quick_backup(output_dir: str = None) -> Dict:
    """Quick full backup"""
    auto = MTKAutomation()
    return auto.full_backup(output_dir)

def quick_root() -> Dict:
    """Quick Magisk root setup"""
    auto = MTKAutomation()
    return auto.magisk_root()

if __name__ == '__main__':
    # Test automation
    def print_progress(msg):
        print(f"[PROGRESS] {msg}")
    
    auto = MTKAutomation(callback=print_progress)
    
    print("MTK Automation Test")
    print("=" * 40)
    
    # Test device detection
    from .device_detector import detect_mtk_device
    device = detect_mtk_device()
    
    if device['detected']:
        print(f"Device detected: {device['usb_id']}")
        print(f"Chipset: {device['chipset']}")
    else:
        print("No device detected - some operations may fail")
    
    print("\nAvailable workflows:")
    print("  1. Unlock Bootloader")
    print("  2. Full Backup")
    print("  3. Magisk Root Setup")
    print("  4. Read GPT")
    print("  5. Bypass SLA")
    print("\nRun via API for actual operations")
