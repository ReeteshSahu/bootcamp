import React from 'react';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  AlertCircle, 
  Users, 
  HelpCircle,
  Eye,
  Activity as LungsIcon
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  current_aqi: number;
  pm25: number;
  pm10: number;
}

interface HealthImpactProps {
  stations: Station[];
}

const HealthImpact: React.FC<HealthImpactProps> = ({ stations }) => {
  // Calculate average particulate readings
  const avgPm25 = stations.reduce((acc, s) => acc + s.pm25, 0) / (stations.length || 1);
  const avgPm10 = stations.reduce((acc, s) => acc + s.pm10, 0) / (stations.length || 1);

  // Derive risk states
  const getRiskStatus = (pm: number, threshold1: number, threshold2: number) => {
    if (pm > threshold2) return { label: 'CRITICAL RISK', color: 'text-danger bg-danger/10 border-danger/20' };
    if (pm > threshold1) return { label: 'MODERATE RISK', color: 'text-accent bg-accent/10 border-accent/20' };
    return { label: 'LOW RISK', color: 'text-secondary bg-secondary/10 border-secondary/20' };
  };

  const asthmaRisk = getRiskStatus(avgPm25, 45, 90);
  const copdRisk = getRiskStatus(avgPm10, 100, 200);

  // Hospital admissions mock data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Respiratory Admissions (Urla/Siltara)',
        data: [142, 128, 160, 195, 230, 215],
        borderColor: '#EF4444', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'PM10 Concentration Average (µg/m³)',
        data: [150, 140, 185, 210, 260, 240],
        borderColor: '#F59E0B', // Orange
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(156, 163, 175)',
          font: { family: 'Inter', size: 10, weight: 'bold' as const }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(156, 163, 175, 0.05)' },
        ticks: { color: 'rgb(156, 163, 175)', font: { size: 9 } }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: 'rgb(156, 163, 175)', font: { size: 9 } }
      },
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.05)' },
        ticks: { color: 'rgb(156, 163, 175)', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEALTH RISK KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Asthma Exposure Risk */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Asthma Trigger Exposure</span>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
                PM2.5: {avgPm25.toFixed(1)} <span className="text-xs font-normal text-slate-400">µg/m³</span>
              </h4>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <Heart size={20} />
            </div>
          </div>
          
          <div className={`mt-6 p-2 rounded border text-center text-xs font-bold ${asthmaRisk.color}`}>
            {asthmaRisk.label}
          </div>
        </div>

        {/* COPD Trigger Exposure */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">COPD/Respiratory Risk</span>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
                PM10: {avgPm10.toFixed(1)} <span className="text-xs font-normal text-slate-400">µg/m³</span>
              </h4>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <LungsIcon size={20} />
            </div>
          </div>

          <div className={`mt-6 p-2 rounded border text-center text-xs font-bold ${copdRisk.color}`}>
            {copdRisk.label}
          </div>
        </div>

        {/* Population Exposure scale */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Corridor Exposure Demographics</span>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
                ~185,000 <span className="text-xs font-normal text-slate-400">Residents</span>
              </h4>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-6 p-2 rounded border dark:border-slate-800 border-slate-200 text-center text-xs font-extrabold text-slate-400 bg-slate-50 dark:bg-slate-800/20">
            HIGH EXPOSURE ALONG ROUTE
          </div>
        </div>

      </div>

      {/* 2. ADMISSIONS CORRELATION CHART */}
      <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col">
        <div className="mb-4">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Respiratory Disease & Hospital Impact Chart
          </h4>
          <p className="text-[10px] text-slate-400">Correlating regional PM10 averages with clinic hospital admissions</p>
        </div>

        <div className="h-[250px] relative">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* 3. HEALTH WARNINGS & RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Medical Advisories */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col">
          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <span>Health & Safety Recommendations</span>
          </h5>

          <div className="space-y-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="flex gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="text-red-500 font-extrabold">⚠️</span>
              <div>
                <strong>Urla & Siltara Zones:</strong> High particulate levels detected. Sensitive groups (asthma sufferers, children, elderly) should wear N95 filtration masks when outdoors.
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <span className="text-amber-500 font-extrabold">⚠️</span>
              <div>
                <strong>Peak Transit Hours (17:00 - 20:00):</strong> Minimize strenuous outdoor activities near NH-53 routes due to high dust loads from incoming cargo trucks.
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <span className="text-blue-500 font-extrabold">💡</span>
              <div>
                <strong>Residential Ventilation:</strong> Close windows facing heavy transit paths. Use HEPA indoor air cleaners where applicable.
              </div>
            </div>
          </div>
        </div>

        {/* Localized Risk Exposure Map Indices */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col">
          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span>Localized Exposure Zone Hazard Index</span>
          </h5>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-2.5 border-b dark:border-slate-800 border-slate-105">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">Siltara Industrial Zone</span>
              <span className="text-[10px] font-extrabold text-danger px-2.5 py-0.5 rounded bg-red-550/10">CRITICAL RISK</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b dark:border-slate-800 border-slate-105">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">Urla Industrial Area</span>
              <span className="text-[10px] font-extrabold text-danger px-2.5 py-0.5 rounded bg-red-550/10">CRITICAL RISK</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b dark:border-slate-800 border-slate-105">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">Bhilai Steel Plant Area</span>
              <span className="text-[10px] font-extrabold text-accent px-2.5 py-0.5 rounded bg-amber-500/10">MODERATE RISK</span>
            </div>
            <div className="flex justify-between items-center p-2.5 border-b dark:border-slate-800 border-slate-105">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">Durg Station Area</span>
              <span className="text-[10px] font-extrabold text-accent px-2.5 py-0.5 rounded bg-amber-500/10">MODERATE RISK</span>
            </div>
            <div className="flex justify-between items-center p-2.5">
              <span className="text-xs font-bold dark:text-slate-200 text-slate-800">Raipur City Center</span>
              <span className="text-[10px] font-extrabold text-secondary px-2.5 py-0.5 rounded bg-emerald-500/10">LOW RISK</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default HealthImpact;
