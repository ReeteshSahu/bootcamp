import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Droplet, 
  RotateCw, 
  Cpu, 
  Gauge, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Wind
} from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  driver_name: string;
  load_type: string;
  load_weight: number;
  cover_status: string;
  water_tank_level: number;
  battery_level: number;
  status: string;
  speed: number;
  dust_emission?: number;
  fan_speed?: number;
  electrostatic_status?: string;
  mist_pressure?: number;
}

interface AeroShieldDetailProps {
  vehicles: Vehicle[];
  token: string | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
}

const AeroShieldDetail: React.FC<AeroShieldDetailProps> = ({ vehicles, token, selectedId, setSelectedId }) => {
  const activeTrucks = vehicles.filter(v => v.status === 'Active');
  const [purging, setPurging] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Default to first active vehicle when loaded
  useEffect(() => {
    if (activeTrucks.length > 0 && !selectedId) {
      setSelectedId(activeTrucks[0].id);
    }
  }, [activeTrucks, selectedId, setSelectedId]);

  const currentTruck = vehicles.find(v => v.id === selectedId) || activeTrucks[0];

  const handlePurgeGrid = async () => {
    if (!currentTruck) return;
    setPurging(true);
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] Initiated Electrostatic Grid high-voltage purge on ${currentTruck.id}`, ...prev]);
    
    // Call mock endpoint or simulate audit logging
    setTimeout(() => {
      setPurging(false);
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] High-voltage purge completed. Grid particulates cleared.`, ...prev]);
    }, 2000);
  };

  const handleFlushNozzles = async () => {
    if (!currentTruck) return;
    setFlushing(true);
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] Triggered high-pressure mist nozzle backflush on ${currentTruck.id}`, ...prev]);
    
    setTimeout(() => {
      setFlushing(false);
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] Backflush cycle completed. Nozzle pressures normalized.`, ...prev]);
    }, 2500);
  };

  if (!currentTruck) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400 font-semibold text-xs">
        No active trucks en-route to monitor. Activate trucks on Fleet page.
      </div>
    );
  }

  // Calculate hardware derived values
  const hasPower = currentTruck.battery_level > 10 && currentTruck.status === 'Active';
  const fanRpm = hasPower && currentTruck.speed > 0 ? (currentTruck.fan_speed || 2100) : 0;
  const electroStatus = hasPower && currentTruck.speed > 0 ? (currentTruck.electrostatic_status || 'Active') : 'Offline';
  const gridVoltage = electroStatus === 'Active' ? '4.8 kV' : '0.0 kV';
  const nozzlePressure = hasPower && currentTruck.speed > 0 ? (currentTruck.mist_pressure || 5.2) : 0.0;
  const airflowCfm = fanRpm > 0 ? Math.round(fanRpm * 0.18) : 0;
  const powerUsageW = fanRpm > 0 ? Math.round(45 + (fanRpm / 150) + (electroStatus === 'Active' ? 35 : 0)) : 5;
  const dustCollectedKg = fanRpm > 0 ? +(currentTruck.load_weight * 0.04).toFixed(2) : 0.00;

  return (
    <div className="space-y-6">
      
      {/* 1. VEHICLE SELECTOR HMI BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-industrial-bgLight p-4 rounded-xl border dark:border-industrial-border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sliders size={18} />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-400">Selected Hardware Node</h4>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-transparent dark:text-slate-100 text-slate-800 font-extrabold text-sm focus:outline-none cursor-pointer"
            >
              {activeTrucks.map(v => (
                <option key={v.id} value={v.id} className="bg-white dark:bg-industrial-bgLight">{v.id} - {v.plate_number} ({v.driver_name})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
          <div>
            <span>SYSTEM HEALTH: </span>
            <span className={currentTruck.water_tank_level > 20 ? 'text-secondary' : 'text-danger'}>
              {currentTruck.water_tank_level > 20 ? 'NOMINAL' : 'DEGRADED'}
            </span>
          </div>
          <div>
            <span>COMMUNICATIONS: </span>
            <span className="text-secondary">ONLINE (RTT 48ms)</span>
          </div>
        </div>
      </div>

      {/* 2. INDUSTRIAL HMI DIAGNOSTIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gauge 1: Fan Speed & Airflow */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Intake Fan Speed</span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{fanRpm} <span className="text-xs font-normal text-slate-400">RPM</span></h4>
            </div>
            <div className={`p-2.5 rounded-xl bg-primary/10 text-primary ${fanRpm > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: fanRpm > 0 ? `${Math.max(0.5, 3 - fanRpm / 1000)}s` : '0s' }}>
              <RotateCw size={18} />
            </div>
          </div>
          <div className="border-t dark:border-slate-800 border-slate-100 pt-3 flex justify-between text-xs font-semibold text-slate-400">
            <span>Air Intake: {airflowCfm} CFM</span>
            <span className={fanRpm > 0 ? 'text-secondary' : 'text-slate-500'}>
              {fanRpm > 0 ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>

        {/* Gauge 2: Electrostatic Grid */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Electrostatic Charge</span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{gridVoltage}</h4>
            </div>
            <div className={`p-2.5 rounded-xl ${electroStatus === 'Active' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
              <Zap size={18} />
            </div>
          </div>
          <div className="border-t dark:border-slate-800 border-slate-100 pt-3 flex justify-between text-xs font-semibold text-slate-400">
            <span>Status: {electroStatus}</span>
            <span className={electroStatus === 'Active' ? 'text-amber-500 animate-pulse' : 'text-slate-500'}>
              {electroStatus === 'Active' ? 'HIGH VOLTAGE' : 'DISCHARGED'}
            </span>
          </div>
        </div>

        {/* Gauge 3: Mist Nozzle Pressure */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nozzle Pressure</span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{nozzlePressure.toFixed(1)} <span className="text-xs font-normal text-slate-400">bar</span></h4>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
              <Gauge size={18} />
            </div>
          </div>
          <div className="border-t dark:border-slate-800 border-slate-100 pt-3 flex justify-between text-xs font-semibold text-slate-400">
            <span>Pump Load: {nozzlePressure > 0 ? '65%' : '0%'}</span>
            <span className={nozzlePressure > 0 ? 'text-secondary' : 'text-slate-500'}>
              {nozzlePressure > 0 ? 'SPRAYING' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Gauge 4: Auxiliary power & collection */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Power & Capture</span>
              <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{powerUsageW} <span className="text-xs font-normal text-slate-400">W</span></h4>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Cpu size={18} />
            </div>
          </div>
          <div className="border-t dark:border-slate-800 border-slate-100 pt-3 flex justify-between text-xs font-semibold text-slate-400">
            <span>Dust Caught: {dustCollectedKg} kg</span>
            <span className="text-slate-400">PWA Link Active</span>
          </div>
        </div>

      </div>

      {/* 3. DETAILS GRID: HMI WATER TANK AND ACTIONS OVERRIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HMI Water Tank Visualizer */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col justify-between lg:col-span-1">
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Water Tank Hydro-Level
            </h5>
            
            {/* Visual Tank Graphic */}
            <div className="relative w-full h-44 border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-850 rounded-xl overflow-hidden shadow-inner flex items-end">
              <div 
                className="w-full bg-gradient-to-t from-primary to-primary-light transition-all duration-500 relative"
                style={{ height: `${currentTruck.water_tank_level}%` }}
              >
                {/* Water bubble animation effect */}
                <div className="absolute top-1 left-0 right-0 h-2 bg-white/20 blur-sm animate-pulse"></div>
              </div>

              {/* Visual overlay markers */}
              <div className="absolute inset-y-0 right-3 flex flex-col justify-between text-[8px] font-bold text-slate-400 py-2 pointer-events-none">
                <span>100% (FULL)</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span className={currentTruck.water_tank_level <= 20 ? 'text-red-500 animate-pulse font-extrabold' : ''}>0% (EMPTY)</span>
              </div>

              {/* Giant label overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800/20 dark:text-white/20 select-none">
                  {currentTruck.water_tank_level}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Estimated duration remaining:</span>
            <span className="dark:text-slate-200 text-slate-700">
              {currentTruck.water_tank_level > 0 ? `${Math.round(currentTruck.water_tank_level * 0.4)} mins` : 'Depleted'}
            </span>
          </div>
        </div>

        {/* Actions override and Diagnostic feed */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              AeroShield Hardware Control Overrides
            </h5>

            <div className="grid grid-cols-2 gap-4">
              {/* Purge Grid Override */}
              <button
                onClick={handlePurgeGrid}
                disabled={purging || !hasPower}
                className="flex items-center justify-center gap-2 p-4 border dark:border-slate-800 border-slate-200 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs disabled:opacity-50 transition"
              >
                {purging ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span>PURGING GRID...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} className="text-amber-500" />
                    <span>PURGE ELECTROSTATIC GRID</span>
                  </>
                )}
              </button>

              {/* Flush Nozzles Override */}
              <button
                onClick={handleFlushNozzles}
                disabled={flushing || !hasPower || currentTruck.water_tank_level === 0}
                className="flex items-center justify-center gap-2 p-4 border dark:border-slate-800 border-slate-200 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs disabled:opacity-50 transition"
              >
                {flushing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
                    <span>FLUSHING NOZZLES...</span>
                  </>
                ) : (
                  <>
                    <Droplet size={16} className="text-primary" />
                    <span>FLUSH MIST NOZZLES</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Log Console */}
          <div className="mt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Diagnostic Command Log</span>
            <div className="w-full h-28 bg-slate-900/90 rounded-lg p-3 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-1 select-text">
              {actionLog.length === 0 ? (
                <span className="text-slate-500 italic">No overrides triggered in this session. Console listener active.</span>
              ) : (
                actionLog.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AeroShieldDetail;
