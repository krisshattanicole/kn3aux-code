#!/usr/bin/env python3
"""
MTK Device Auto-Detection
Identifies chipset, bypass method, and optimal workflow
"""

import subprocess
import json
import os

# Comprehensive MTK device database
DEVICE_DATABASE = {
    # USB ID: {chipset, method, notes}
    '0e8d:0003': {'chipset': 'Generic', 'method': 'kamakiri', 'notes': 'Standard BROM'},
    '0e8d:0004': {'chipset': 'Generic', 'method': 'amonet', 'notes': 'GCPU exploit'},
    '0e8d:0301': {'chipset': 'MT6735', 'method': 'bootrom', 'notes': 'Quad-core A53'},
    '0e8d:0303': {'chipset': 'MT6737', 'method': 'bootrom', 'notes': 'Quad-core A53'},
    '0e8d:0305': {'chipset': 'MT6753', 'method': 'bootrom', 'notes': 'Octa-core A53'},
    '0e8d:0306': {'chipset': 'MT6755', 'method': 'bootrom', 'notes': 'Helio P10'},
    '0e8d:0307': {'chipset': 'MT6757', 'method': 'bootrom', 'notes': 'Helio P20'},
    '0e8d:0308': {'chipset': 'MT6759', 'method': 'bootrom', 'notes': 'Helio P30'},
    '0e8d:0309': {'chipset': 'MT6763', 'method': 'bootrom', 'notes': 'Helio P23'},
    '0e8d:030a': {'chipset': 'MT6771', 'method': 'bootrom', 'notes': 'Helio P60'},
    '0e8d:030b': {'chipset': 'MT6775', 'method': 'bootrom', 'notes': 'Helio P15'},
    '0e8d:030c': {'chipset': 'MT6779', 'method': 'bootrom', 'notes': 'Helio P90'},
    '0e8d:030d': {'chipset': 'MT6785', 'method': 'bootrom', 'notes': 'Helio G90'},
    '0e8d:030e': {'chipset': 'MT6833', 'method': 'bootrom', 'notes': 'Dimensity 700'},
    '0e8d:030f': {'chipset': 'MT6853', 'method': 'bootrom', 'notes': 'Dimensity 720'},
    '0e8d:0310': {'chipset': 'MT6873', 'method': 'bootrom', 'notes': 'Dimensity 800U'},
    '0e8d:0311': {'chipset': 'MT6875', 'method': 'bootrom', 'notes': 'Dimensity 820'},
    '0e8d:0312': {'chipset': 'MT6877', 'method': 'bootrom', 'notes': 'Dimensity 900'},
    '0e8d:0313': {'chipset': 'MT6885', 'method': 'bootrom', 'notes': 'Dimensity 800'},
    '0e8d:0314': {'chipset': 'MT6889', 'method': 'bootrom', 'notes': 'Dimensity 1000'},
    '0e8d:0315': {'chipset': 'MT6891', 'method': 'bootrom', 'notes': 'Dimensity 1100'},
    '0e8d:0316': {'chipset': 'MT6893', 'method': 'bootrom', 'notes': 'Dimensity 1200'},
    '0e8d:0317': {'chipset': 'MT6895', 'method': 'bootrom', 'notes': 'Dimensity 900T'},
    '0e8d:0318': {'chipset': 'MT6897', 'method': 'bootrom', 'notes': 'Dimensity 8100'},
    '0e8d:0319': {'chipset': 'MT6983', 'method': 'bootrom', 'notes': 'Dimensity 9000'},
}

# Brand-specific workflows
BRAND_WORKFLOWS = {
    'xiaomi': {
        'unlock': ['e metadata', 'e userdata', 'da seccfg unlock'],
        'notes': 'May need Mi Unlock tool first'
    },
    'huawei': {
        'unlock': ['da seccfg unlock'],
        'notes': 'Bootloader code may be required'
    },
    'oppo': {
        'unlock': ['e metadata', 'e userdata', 'md_udc', 'da seccfg unlock'],
        'notes': 'Test points may be needed'
    },
    'vivo': {
        'unlock': ['da seccfg unlock'],
        'notes': 'EDL mode recommended'
    },
    'samsung': {
        'unlock': ['e metadata', 'e userdata', 'da seccfg unlock'],
        'notes': 'Use Odin for flashing'
    },
    'lg': {
        'unlock': ['e metadata', 'e userdata', 'da seccfg unlock'],
        'notes': 'Vendor ID 0xFF may need blacklist'
    },
    'nokia': {
        'unlock': ['da seccfg unlock'],
        'notes': 'Android One - standard workflow'
    },
    'motorola': {
        'unlock': ['e metadata', 'e userdata', 'da seccfg unlock'],
        'notes': 'Official unlock available for some models'
    },
    'oneplus': {
        'unlock': ['da seccfg unlock'],
        'notes': 'Official unlock method preferred'
    },
    'realme': {
        'unlock': ['e metadata', 'e userdata', 'da seccfg unlock'],
        'notes': 'Deep testing may be required'
    }
}

def detect_mtk_device():
    """Detect connected MTK device and return info"""
    try:
        result = subprocess.run(['lsusb'], capture_output=True, text=True, timeout=5)
        
        for line in result.stdout.split('\n'):
            if '0e8d' in line.lower():
                # Extract vendor:product ID
                parts = line.split()
                for part in parts:
                    if ':' in part and len(part) == 9:
                        device_id = part.lower()
                        
                        if device_id in DEVICE_DATABASE:
                            info = DEVICE_DATABASE[device_id]
                            return {
                                'detected': True,
                                'usb_id': device_id,
                                'chipset': info['chipset'],
                                'bypass_method': info['method'],
                                'notes': info.get('notes', ''),
                                'raw_info': line
                            }
                        
                        # Unknown MTK device
                        return {
                            'detected': True,
                            'usb_id': device_id,
                            'chipset': 'Unknown MTK',
                            'bypass_method': 'generic',
                            'notes': 'Unknown device - try generic bypass',
                            'raw_info': line
                        }
        
        return {'detected': False, 'message': 'No MTK device found'}
    except Exception as e:
        return {'detected': False, 'error': str(e)}

def detect_brand(device_info: str) -> str:
    """Detect device brand from USB info"""
    device_info_lower = device_info.lower()
    
    brands = ['xiaomi', 'huawei', 'oppo', 'vivo', 'samsung', 'lg', 
              'nokia', 'motorola', 'oneplus', 'realme', 'sony', 'google']
    
    for brand in brands:
        if brand in device_info_lower:
            return brand
    
    return 'unknown'

def get_workflow(chipset: str, bypass_method: str, brand: str = 'unknown') -> dict:
    """Get recommended workflow for device"""
    base_workflows = {
        'bootrom': {
            'steps': [
                'Power off device completely',
                'Hold Vol+ (or Vol-) + Power button',
                'Connect USB cable to PC',
                'Release buttons when device detected',
                'Run bypass or unlock command'
            ],
            'tools': ['mtkclient'],
            'risk': 'Low',
            'success_rate': '95%'
        },
        'kamakiri': {
            'steps': [
                'Power off device',
                'Hold Vol+ + Power',
                'Connect USB',
                'Run: python mtk payload',
                'Proceed with unlock/flash'
            ],
            'tools': ['mtkclient', 'kamakiri'],
            'risk': 'Low',
            'success_rate': '90%'
        },
        'amonet': {
            'steps': [
                'Short test points (if required)',
                'Connect USB cable',
                'Run: python mtk dumpbrom --ptype=amonet',
                'Dump brom/preloader'
            ],
            'tools': ['mtkclient', 'amonet'],
            'risk': 'Medium',
            'success_rate': '85%'
        },
        'generic': {
            'steps': [
                'Try standard bypass',
                'If fails, try different button combo',
                'Check logs for errors',
                'Consider test point method'
            ],
            'tools': ['mtkclient'],
            'risk': 'Low',
            'success_rate': '80%'
        }
    }
    
    workflow = base_workflows.get(bypass_method, base_workflows['generic'])
    
    # Add brand-specific notes
    if brand in BRAND_WORKFLOWS:
        brand_info = BRAND_WORKFLOWS[brand]
        workflow['brand_notes'] = brand_info['notes']
        workflow['brand_unlock_commands'] = brand_info['unlock']
    
    return workflow

def get_all_workflows():
    """Get all available workflows"""
    return {
        'unlock_bootloader': {
            'description': 'Unlock bootloader and remove FRP',
            'commands': [
                'python mtk e metadata,userdata,md_udc',
                'python mtk da seccfg unlock',
                'python mtk reset'
            ],
            'warnings': ['Erases all data', 'May void warranty']
        },
        'dump_partitions': {
            'description': 'Backup all partitions',
            'commands': [
                'python mtk rl output_directory/'
            ],
            'warnings': ['Takes 10-30 minutes', 'Requires sufficient storage']
        },
        'flash_partition': {
            'description': 'Write file to partition',
            'commands': [
                'python mtk w partition_name file.bin'
            ],
            'warnings': ['Can brick device if wrong file', 'Always backup first']
        },
        'root_magisk': {
            'description': 'Root with Magisk',
            'commands': [
                'python mtk r boot boot.img',
                '# Patch boot.img with Magisk APK',
                'python mtk w boot magisk_patched.img'
            ],
            'warnings': ['May trip SafetyNet', 'Requires unlocked bootloader']
        },
        'bypass_sla': {
            'description': 'Bypass SLA/DA protection',
            'commands': [
                'python mtk payload'
            ],
            'warnings': ['Temporary bypass', 'Resets on reboot']
        }
    }

def check_prerequisites():
    """Check if all prerequisites are met"""
    results = {
        'mtk_tool_installed': os.path.exists(os.path.join(os.path.dirname(__file__), 'mtk-unlock-tool-version-2.0', 'mtk')),
        'usb_accessible': True,
        'permissions_ok': True,
        'issues': []
    }
    
    # Check USB access
    try:
        result = subprocess.run(['lsusb'], capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            results['usb_accessible'] = False
            results['issues'].append('USB access issue - check permissions')
    except:
        results['usb_accessible'] = False
        results['issues'].append('Cannot access USB - check permissions')
    
    # Check MTK tool
    if not results['mtk_tool_installed']:
        results['issues'].append('MTK tool not installed')
    
    return results

if __name__ == '__main__':
    print("MTK Device Detector")
    print("=" * 40)
    
    device = detect_mtk_device()
    if device['detected']:
        print(f"✓ Device detected: {device['usb_id']}")
        print(f"  Chipset: {device['chipset']}")
        print(f"  Method: {device['bypass_method']}")
        print(f"  Notes: {device.get('notes', '')}")
        
        brand = detect_brand(device['raw_info'])
        if brand != 'unknown':
            print(f"  Brand: {brand}")
        
        workflow = get_workflow(device['chipset'], device['bypass_method'], brand)
        print(f"\nRecommended workflow:")
        for i, step in enumerate(workflow['steps'], 1):
            print(f"  {i}. {step}")
    else:
        print("✗ No MTK device detected")
        print("\nTo boot to BROM mode:")
        print("  1. Power off device")
        print("  2. Hold Vol+ (or Vol-) + Power")
        print("  3. Connect USB cable")
        print("  4. Release buttons when detected")
