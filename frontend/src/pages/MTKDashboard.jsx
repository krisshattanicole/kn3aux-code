import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Smartphone, Lock, Unlock, Download, Upload, 
  Terminal, Shield, Key, RefreshCw, AlertTriangle,
  Cpu, Save, Power, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';

const MTKDashboard = () => {
  const [deviceDetected, setDeviceDetected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [gptTable, setGptTable] = useState(null);
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    checkDevice();
  }, []);

  const checkDevice = async () => {
    try {
      const res = await axios.post('/api/mtk/detect');
      setDeviceDetected(res.data.detected);
      setDeviceInfo(res.data);
      
      if (res.data.detected) {
        addLog(`✓ Device detected: ${res.data.devices?.[0] || 'MTK Device'}`);
      }
    } catch (err) {
      console.error('Device detection failed', err);
      addLog('✗ Device detection failed');
    }
  };

  const addLog = (message) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message
    }]);
  };

  const runCommand = async (endpoint, data = {}) => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/mtk/${endpoint}`, data);
      addLog(`✓ ${res.data.message}`);
      
      if (res.data.stream_id) {
        streamOutput(res.data.stream_id);
      }
      
      if (res.data.gpt_table) {
        setGptTable(res.data.gpt_table);
      }
      
      return res.data;
    } catch (err) {
      addLog(`✗ Error: ${err.response?.data?.error || err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const streamOutput = (streamId) => {
    const eventSource = new EventSource(`/api/mtk/stream/${streamId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.complete) {
        eventSource.close();
        addLog('--- Operation Complete ---');
      } else {
        addLog(data.output);
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      addLog('--- Stream Ended ---');
    };
  };

  const handleUnlock = async () => {
    if (!confirm('⚠️ WARNING: This will ERASE ALL DATA and unlock bootloader. Continue?')) return;
    
    try {
      await runCommand('unlock-bootloader', {
        partitions: ['metadata', 'userdata', 'md_udc']
      });
      addLog('🎉 Bootloader unlocked!');
    } catch (err) {
      // Error already logged
    }
  };

  const handleLock = async () => {
    if (!confirm('⚠️ WARNING: Locking bootloader with custom ROM may brick device. Continue?')) return;
    
    try {
      await runCommand('unlock-bootloader', { lock: true });
      addLog('🔒 Bootloader locked');
    } catch (err) {
      // Error already logged
    }
  };

  const handleDumpAll = async () => {
    try {
      await runCommand('dump-all', {
        output_dir: '~/kn3aux_backups/mtk_dump'
      });
    } catch (err) {
      // Error already logged
    }
  };

  const handleRoot = async () => {
    try {
      const res = await runCommand('root-magisk');
      if (res.instructions) {
        addLog('Follow Magisk patching steps:');
        res.instructions.forEach(step => addLog(`  ${step}`));
      }
    } catch (err) {
      // Error already logged
    }
  };

  const handlePrintGPT = async () => {
    try {
      await runCommand('print-gpt');
      setActiveTab('gpt');
    } catch (err) {
      // Error already logged
    }
  };

  const handleBypassSLA = async () => {
    try {
      await runCommand('bypass-sla');
      addLog('SLA/DA bypassed - ready for operations');
    } catch (err) {
      // Error already logged
    }
  };

  const handleCrashDA = async () => {
    try {
      await runCommand('crash-da');
      addLog('DA crash sent - reconnect to BROM');
    } catch (err) {
      // Error already logged
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Smartphone className="w-8 h-8 mr-3 text-accent" />
            MTK Unlock Tool
          </h1>
          <p className="text-gray-400 mt-1">MediaTek Device Flash & Exploit Suite</p>
        </div>
        <button
          onClick={checkDevice}
          disabled={loading}
          className="px-4 py-2 bg-primary rounded hover:opacity-90 flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Device Status */}
      <div className="bg-secondary p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Device Status</h2>
        
        {deviceDetected ? (
          <div className="bg-green-900/30 border border-green-500 p-4 rounded">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-400">MTK Device Detected</p>
                {deviceInfo && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-300">{deviceInfo.devices?.[0]}</p>
                    <p className="text-gray-400">Mode: {deviceInfo.mode}</p>
                    {deviceInfo.count > 1 && (
                      <p className="text-yellow-400">Multiple devices detected ({deviceInfo.count})</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/30 border border-red-500 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-400">No Device Detected</p>
                <p className="text-sm text-gray-300 mt-2">
                  To boot to BROM mode:
                </p>
                <ol className="text-sm text-gray-400 mt-1 space-y-1">
                  <li>1. Power off device completely</li>
                  <li>2. Hold Vol+ (or Vol-) + Power button</li>
                  <li>3. Connect USB cable to PC</li>
                  <li>4. Release buttons when detected</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <QuickActionCard
          icon={<Unlock className="w-8 h-8" />}
          title="Unlock Bootloader"
          description="Remove FRP and unlock BL (erases data)"
          onClick={handleUnlock}
          loading={loading}
          color="from-red-500 to-orange-500"
          disabled={!deviceDetected}
        />

        <QuickActionCard
          icon={<Download className="w-8 h-8" />}
          title="Dump All Partitions"
          description="Full backup to directory"
          onClick={handleDumpAll}
          loading={loading}
          color="from-blue-500 to-cyan-500"
          disabled={!deviceDetected}
        />

        <QuickActionCard
          icon={<Key className="w-8 h-8" />}
          title="Root with Magisk"
          description="Automated Magisk workflow"
          onClick={handleRoot}
          loading={loading}
          color="from-green-500 to-teal-500"
          disabled={!deviceDetected}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700 mb-6">
        {[
          { id: 'overview', label: 'Operations', icon: <Terminal className="w-4 h-4" /> },
          { id: 'gpt', label: 'GPT Table', icon: <Cpu className="w-4 h-4" /> },
          { id: 'logs', label: 'Logs', icon: <Save className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Advanced Operations */}
          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Advanced Operations</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionButton
                icon={<Shield />}
                label="Bypass SLA/DA"
                onClick={handleBypassSLA}
                disabled={!deviceDetected || loading}
              />
              <ActionButton
                icon={<Terminal />}
                label="Print GPT"
                onClick={handlePrintGPT}
                disabled={!deviceDetected || loading}
              />
              <ActionButton
                icon={<RefreshCw />}
                label="Crash DA → BROM"
                onClick={handleCrashDA}
                disabled={!deviceDetected || loading}
              />
              <ActionButton
                icon={<Lock />}
                label="Lock Bootloader"
                onClick={handleLock}
                disabled={!deviceDetected || loading}
                variant="danger"
              />
            </div>
          </div>

          {/* Workflow Guide */}
          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Common Workflows</h2>
            
            <div className="space-y-4">
              <WorkflowCard
                title="Remove FRP Lock"
                steps={[
                  'Click "Unlock Bootloader"',
                  'Wait for partitions to erase',
                  'Device will reboot automatically',
                  'FRP will be removed'
                ]}
                warning="This will erase all user data"
              />

              <WorkflowCard
                title="Root with Magisk"
                steps={[
                  'Click "Root with Magisk"',
                  'Push boot.img to device via ADB',
                  'Install Magisk APK and patch boot.img',
                  'Pull patched image and flash it'
                ]}
                warning="Requires unlocked bootloader"
              />

              <WorkflowCard
                title="Full Backup"
                steps={[
                  'Click "Dump All Partitions"',
                  'Wait for dump to complete (10-30 min)',
                  'Find backups in ~/kn3aux_backups/mtk_dump/',
                  'Verify backup integrity'
                ]}
                warning="Requires sufficient storage space"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gpt' && (
        <div className="bg-secondary p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">GPT Partition Table</h2>
            <button
              onClick={handlePrintGPT}
              disabled={loading}
              className="px-4 py-2 bg-primary rounded hover:opacity-90 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {gptTable ? (
            <pre className="bg-black p-4 rounded font-mono text-sm overflow-auto max-h-96">
              {gptTable}
            </pre>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <Cpu className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Click "Print GPT" to read partition table</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Operation Logs</h2>
          
          <div className="bg-black p-4 rounded font-mono text-sm h-96 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run an operation to see output.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-gray-800">
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
      )}
    </div>
  );
};

const QuickActionCard = ({ icon, title, description, onClick, loading, color, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`p-6 rounded-lg bg-gradient-to-br ${color} text-white 
                hover:shadow-lg transform hover:-translate-y-1 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-sm opacity-90">{description}</p>
  </button>
);

const ActionButton = ({ icon, label, onClick, disabled, variant = 'default' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded transition-all flex flex-col items-center ${
      variant === 'danger'
        ? 'bg-red-900/30 hover:bg-red-900/50 border border-red-500'
        : 'bg-gray-800 hover:bg-gray-700'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    <div className={`mb-2 ${variant === 'danger' ? 'text-red-400' : 'text-accent'}`}>
      {icon}
    </div>
    <span className="text-sm">{label}</span>
  </button>
);

const WorkflowCard = ({ title, steps, warning }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <div className="flex items-start mb-3">
      <ChevronRight className="w-5 h-5 text-accent mr-2 mt-0.5" />
      <h3 className="font-semibold">{title}</h3>
    </div>
    <ol className="space-y-1 text-sm text-gray-300 ml-7">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
    {warning && (
      <div className="mt-3 flex items-center text-xs text-yellow-400">
        <AlertTriangle className="w-4 h-4 mr-1" />
        {warning}
      </div>
    )}
  </div>
);

export default MTKDashboard;
