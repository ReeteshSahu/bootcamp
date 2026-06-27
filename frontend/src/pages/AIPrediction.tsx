import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  RefreshCw, 
  Activity, 
  TrendingUp, 
  AlertOctagon, 
  Calendar,
  Sparkles,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Prediction {
  id: number;
  target: string;
  type: string;
  predicted_value: string;
  confidence: number;
  timestamp: string;
}

interface AIPredictionProps {
  user: { name: string; role: string } | null;
  token: string | null;
}

const AIPrediction: React.FC<AIPredictionProps> = ({ user, token }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchPredictions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/predictions');
      const data = await response.json();
      if (response.ok) {
        setPredictions(data);
        if (data.length > 0) {
          setLastUpdated(new Date(data[0].timestamp).toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRecalculate = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/prediction', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPredictions(data.predictions);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Error running AI predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case 'AQI_CORRIDOR_TOMORROW': return "Corridor AQI Forecast (Tomorrow)";
      case 'FAILURE_RISK_AS_TRK_104': return "Critical Fleet Servicing Requirement";
      case 'TRAFFIC_CONGESTION_NH53_PM': return "Corridor Congestion Prediction";
      case 'DUST_HOTSPOT_EXPANSION_URLA': return "Dust Hotspot Expansion Model";
      case 'HEALTH_RISK_INDEX_TOMORROW': return "Public Respiratory Risk Level";
      default: return target.replace(/_/g, ' ');
    }
  };

  const getPredictiveStyle = (type: string) => {
    switch (type) {
      case 'AQI': return 'from-blue-500 to-indigo-600 text-white';
      case 'MAINTENANCE': return 'from-rose-500 to-red-650 text-white';
      case 'TRAFFIC': return 'from-amber-500 to-orange-650 text-white';
      case 'HOTSPOT': return 'from-purple-500 to-indigo-650 text-white';
      default: return 'from-emerald-500 to-teal-650 text-white';
    }
  };

  const canRunAI = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <div className="space-y-6">
      
      {/* 1. MODEL RE-EVALUATION HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-industrial-bgLight p-5 rounded-xl border dark:border-industrial-border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">AI Deep Learning Forecasts</h4>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
              <Clock size={11} />
              Last Model Sync: {lastUpdated || 'Never'}
            </span>
          </div>
        </div>

        {canRunAI && (
          <button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg text-xs font-bold shadow-md shadow-primary/10 hover:brightness-105 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'RE-CALCULATING MODELS...' : 'RUN AI PREDICTION'}</span>
          </button>
        )}
      </div>

      {/* 2. LIVE AI PREDICTIONS FORECAST CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map((p) => {
          const style = getPredictiveStyle(p.type);
          
          return (
            <div 
              key={p.id} 
              className="rounded-2xl bg-white dark:bg-industrial-bgLight border dark:border-industrial-border border-slate-200 overflow-hidden flex flex-col justify-between shadow-lg glass-card-hover"
            >
              {/* Card Top color band */}
              <div className={`p-4 bg-gradient-to-r ${style} flex justify-between items-center`}>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  {p.type} Prediction
                </span>
                <span className="text-[10px] font-bold">Confidence: {p.confidence}%</span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide">
                    {getTargetLabel(p.target)}
                  </h5>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-wide leading-tight">
                    {p.predicted_value}
                  </p>
                </div>

                {/* Progress bar represent confidence */}
                <div className="mt-6 pt-4 border-t dark:border-slate-850 border-slate-105">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                    <span>MODEL CONFIDENCE INDEX</span>
                    <span>{p.confidence}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-secondary rounded-full" 
                      style={{ width: `${p.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. DIAGNOSTIC INSIGHTS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Predicted Failure Risks */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertOctagon size={16} className="text-red-500" />
            <span>AI Fleet Risk Mitigation Logs</span>
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">VEHICLE AS-TRK-104</span>
                <span className="text-xs font-bold dark:text-slate-100 text-slate-850">Water Pump Servicing Required</span>
              </div>
              <span className="px-2 py-0.5 bg-danger/10 text-danger rounded text-[9px] font-bold">92% Probable Failure</span>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">VEHICLE AS-TRK-102</span>
                <span className="text-xs font-bold dark:text-slate-100 text-slate-850">Water Mist System Maintenance Due</span>
              </div>
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold">78% Probable Failure</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border dark:border-slate-800 border-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">VEHICLE AS-TRK-106</span>
                <span className="text-xs font-bold dark:text-slate-100 text-slate-850">Electrostatic Collector Servicing</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold">34% Probable Failure</span>
            </div>
          </div>
        </div>

        {/* Next Service Schedules predicted by ML */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span>ML Planned Preventative Servicing Calendar</span>
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center justify-between border dark:border-slate-800 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg text-xs font-extrabold">29 JUN</div>
                <div>
                  <h5 className="font-bold text-xs dark:text-slate-100 text-slate-800">AS-TRK-104 battery swap</h5>
                  <span className="text-[9px] text-slate-400">Predicted capacity degraded below 15%</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Urgent</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center justify-between border dark:border-slate-800 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-extrabold">05 JUL</div>
                <div>
                  <h5 className="font-bold text-xs dark:text-slate-100 text-slate-800">AS-TRK-102 general servicing</h5>
                  <span className="text-[9px] text-slate-400">Regular 30-day wear-and-tear schedule</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Routine</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center justify-between border dark:border-slate-800 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-extrabold">12 JUL</div>
                <div>
                  <h5 className="font-bold text-xs dark:text-slate-100 text-slate-800">AS-TRK-101 electrostatic wash</h5>
                  <span className="text-[9px] text-slate-400">Particulate capture loading exceeding 80%</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Routine</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AIPrediction;
