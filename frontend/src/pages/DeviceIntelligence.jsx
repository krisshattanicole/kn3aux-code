import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Cpu, Shield, Lock, Unlock, Wifi, 
  Battery, Signal, HardDrive, MemoryCard, 
  ChevronRight, ChevronDown, Download, Upload,
  Play, StopCircle, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Info, Terminal, Code2, Bug,
  Zap, Target, Layers, Settings, Tool,
  SmartphoneNfc, Radio, Usb, Cable,
  SmartphoneCharging, Tablet, Laptop, Monitor,
  Globe, Server, Database, Cloud, WifiOff
} from 'lucide-react';

// Device Intelligence Dashboard Component
export default function DeviceIntelligenceDashboard() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [features, setFeatures] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);

  // Detect device on mount
  useEffect(() => {
    detectDevice();
  }, []);

  const detectDevice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/device/detect');
      const data = await response.json();
      setDeviceInfo(data);
      
      // Fetch enhanced features
      const featuresRes = await fetch('/api/device/features');
      const featuresData = await featuresRes.json();
      setFeatures(featuresData);
    } catch (error) {
      console.error('Error detecting device:', error);
    }
    setLoading(false);
  };

  const getBrandIcon = (brand) => {
    const icons = {
      samsung: <Smartphone className="w-6 h-6" />,
      motorola: <Smartphone className="w-6 h-6" />,
      pixel: <Smartphone className="w-6 h-6" />,
      xiaomi: <Smartphone className="w-6 h-6" />,
      oneplus: <Smartphone className="w-6 h-6" />,
      huawei: <Smartphone className="w-6 h-6" />,
      lg: <Smartphone className="w-6 h-6" />,
      generic: <Smartphone className="w-6 h-6" />
    };
    return icons[brand] || icons.generic;
  };

  const getStatusColor = (status) => {
    if (status) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'tools', label: 'Recommended Tools', icon: <Tool className="w-4 h-4" /> },
    { id: 'carrier', label: 'Carrier Bypass', icon: <Radio className="w-4 h-4" /> },
    { id: 'frp', label: 'FRP Removal', icon: <Lock className="w-4 h-4" /> },
    { id: 'automation', label: 'Automation', icon: <Zap className="w-4 h-4" /> },
    { id: 'scripts', label: 'Scripts', icon: <Code2 className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-300">Detecting device...</p>
        </div>
      </div>
    );
  }

  if (!deviceInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Smartphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No device detected</p>
          <button
            onClick={detectDevice}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all"
          >
            Detect Device
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              {getBrandIcon(deviceInfo.brand)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{deviceInfo.model}</h1>
              <p className="text-slate-400">
                {deviceInfo.brand?.toUpperCase()} • Android {deviceInfo.android_version}
              </p>
            </div>
          </div>
          
          <button
            onClick={detectDevice}
            className="p-3 hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-slate-700/50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && <OverviewTab deviceInfo={deviceInfo} features={features} />}
        {activeTab === 'tools' && <ToolsTab features={features} onSelectTool={setSelectedTool} />}
        {activeTab === 'carrier' && <CarrierTab features={features} />}
        {activeTab === 'frp' && <FRPTab features={features} />}
        {activeTab === 'automation' && <AutomationTab features={features} />}
        {activeTab === 'scripts' && <ScriptsTab features={features} />}
      </div>

      {/* Tool Modal */}
      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ deviceInfo, features }) {
  const StatusBadge = ({ label, status }) => (
    <div className={`px-3 py-2 rounded-lg border ${getStatusColor(status)}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-sm font-bold">{status ? '✓ Yes' : '✗ No'}</div>
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-700/50">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium">{value || 'Unknown'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusBadge label="Rooted" status={deviceInfo.rooted} />
        <StatusBadge label="Bootloader Unlocked" status={deviceInfo.bootloader_unlocked} />
        <StatusBadge label="Carrier Locked" status={deviceInfo.carrier_locked} />
        <StatusBadge label="FRP Locked" status={deviceInfo.frp_locked} />
      </div>

      {/* Device Info */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-400" />
          Device Information
        </h3>
        <InfoRow label="Model" value={deviceInfo.model} />
        <InfoRow label="Brand" value={deviceInfo.brand} />
        <InfoRow label="Codename" value={deviceInfo.codename} />
        <InfoRow label="Android Version" value={deviceInfo.android_version} />
        <InfoRow label="Security Patch" value={deviceInfo.security_patch} />
        <InfoRow label="Bootloader" value={deviceInfo.bootloader} />
        <InfoRow label="Chipset" value={deviceInfo.chipset} />
        <InfoRow label="CPU ABI" value={deviceInfo.cpu_abi} />
        <InfoRow label="Hardware" value={deviceInfo.hardware} />
        <InfoRow label="Build ID" value={deviceInfo.build_id} />
      </div>

      {/* Recommended Actions */}
      {features?.recommended_tools && features.recommended_tools.length > 0 && (
        <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/30">
          <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended for Your Device
          </h3>
          <div className="space-y-2">
            {features.recommended_tools.slice(0, 3).map((tool, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tools Tab Component
function ToolsTab({ features, onSelectTool }) {
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Recommended Tools</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features?.recommended_tools?.map((tool, idx) => (
          <div
            key={idx}
            onClick={() => onSelectTool(tool)}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {tool.name}
              </h4>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(tool.priority)}`}>
                {tool.priority}
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-4">{tool.description}</p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span>Click for details</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {(!features?.recommended_tools || features.recommended_tools.length === 0) && (
        <div className="text-center py-12">
          <Tool className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No tools available for this device</p>
        </div>
      )}
    </div>
  );
}

// Carrier Bypass Tab
function CarrierTab({ features }) {
  const [selectedCarrier, setSelectedCarrier] = useState('att');

  const carriers = [
    { id: 'att', name: 'AT&T', icon: <Signal className="w-4 h-4" /> },
    { id: 'tmobile', name: 'T-Mobile', icon: <Signal className="w-4 h-4" /> },
    { id: 'verizon', name: 'Verizon', icon: <Signal className="w-4 h-4" /> },
    { id: 'sprint', name: 'Sprint', icon: <Signal className="w-4 h-4" /> },
    { id: 'generic', name: 'Generic', icon: <Signal className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Carrier Bypass Scripts</h3>
        
        {/* Carrier Selection */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {carriers.map(carrier => (
            <button
              key={carrier.id}
              onClick={() => setSelectedCarrier(carrier.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedCarrier === carrier.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {carrier.icon}
              <span className="font-medium">{carrier.name}</span>
            </button>
          ))}
        </div>

        {/* Scripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features?.carrier_bypass_scripts?.map((script, idx) => (
            <div
              key={script.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-white">{script.name}</h4>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs font-medium">
                  {script.category}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{script.description}</p>
              <div className="bg-slate-900 rounded-lg p-3 mb-4">
                <code className="text-emerald-400 text-xs font-mono">
                  {script.command}
                </code>
              </div>
              <div className="flex flex-wrap gap-2">
                {script.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FRP Removal Tab
function FRPTab({ features }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">FRP Removal Methods</h3>
        
        {features?.frp_methods && (
          <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/30 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-emerald-300">
                Recommended: {features.frp_methods.method}
              </h4>
            </div>
            <div className="space-y-2">
              {features.frp_methods.steps?.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-emerald-400 text-sm font-medium">
              Success Rate: {features.frp_methods.success_rate}
            </div>
          </div>
        )}

        {/* FRP Scripts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features?.frp_scripts?.map((script, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
            >
              <h4 className="text-lg font-bold text-white mb-2">{script.name}</h4>
              <p className="text-slate-400 text-sm mb-4">{script.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {script.requirements?.map((req, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium"
                  >
                    {req}
                  </span>
                ))}
              </div>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium">
                Run Script
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Automation Tab
function AutomationTab({ features }) {
  const [selectedSequence, setSelectedSequence] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Rubber Ducky Automation
        </h3>
        <p className="text-slate-400 mb-6">
          Automated sequences for devices with broken screens
        </p>

        {/* Automation Sequences */}
        <div className="space-y-4">
          {features?.automation_sequence?.map((step, idx) => (
            <div
              key={idx}
              className={`bg-slate-800/50 rounded-xl p-5 border ${
                step.manual ? 'border-yellow-500/30' : 'border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step.manual ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {step.step}
                  </div>
                  <h4 className="text-lg font-bold text-white">{step.action}</h4>
                </div>
                {step.manual ? (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium">
                    Manual Required
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-medium">
                    Automated
                  </span>
                )}
              </div>
              
              {step.ducky_script && (
                <div className="bg-slate-900 rounded-lg p-4 mt-4">
                  <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">
                    {step.ducky_script}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Start Automation Button */}
        <div className="mt-8 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white rounded-xl transition-all font-bold text-lg shadow-lg shadow-emerald-900/20 flex items-center gap-3 mx-auto">
            <Play className="w-5 h-5" />
            Start Full Automation Sequence
          </button>
          <p className="text-slate-400 text-sm mt-4">
            ⚠️ Ensure device is connected via USB before starting
          </p>
        </div>
      </div>
    </div>
  );
}

// Scripts Tab
function ScriptsTab({ features }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Device-Specific Scripts</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features?.specific_scripts?.map((script, idx) => (
          <div
            key={idx}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">{script}</h4>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium">
                Run
              </button>
              <button className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!features?.specific_scripts || features.specific_scripts.length === 0) && (
        <div className="text-center py-12">
          <Code2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No scripts available for this device</p>
        </div>
      )}
    </div>
  );
}

// Tool Modal Component
function ToolModal({ tool, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{tool.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-300 mb-6">{tool.description}</p>
          
          {tool.requirements && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {tool.requirements.map((req, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {tool.success_rate && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Success Rate</h4>
              <div className="text-2xl font-bold text-emerald-400">{tool.success_rate}</div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-bold">
            Run Tool
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
