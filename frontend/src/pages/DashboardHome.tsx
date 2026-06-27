import React, { useState } from 'react';
import { 
  Wind, 
  Thermometer, 
  Droplets, 
  Truck, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  current_aqi: number;
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
  wind_speed: number;
}

interface Alert {
  id: number;
  vehicle_id: string | null;
  type: string;
  message: string;
  severity: string;
  resolved: number;
  timestamp: string;
}

interface DashboardHomeProps {
  stats: {
    avg_aqi: number;
    avg_pm25: number;
    avg_pm10: number;
    active_trucks: number;
    total_trucks: number;
    unresolved_alerts: number;
    avg_speed: number;
    avg_water: number;
    avg_battery: number;
    aeroshield_efficiency: number;
  } | null;
  stations: Station[];
  vehicles: Vehicle[];
  alerts: Alert[];
  onTabChange: (tab: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ stats, stations, vehicles, alerts, onTabChange }) => {
  const [trendRange, setTrendRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate Today's Pollution Score (weighted score out of 100)
  // Clean: < 100, Moderate: 100-200, Dangerous: > 200
  const pollutionScore = Math.min(100, Math.round((stats.avg_aqi / 350) * 100));

  // Average weather calculations
  const avgTemp = Math.round(stations.reduce((acc, s) => acc + s.temp, 0) / (stations.length || 1));
  const avgHumidity = Math.round(stations.reduce((acc, s) => acc + s.humidity, 0) / (stations.length || 1));
  const avgWind = Math.round(stations.reduce((acc, s) => acc + s.wind_speed, 0) / (stations.length || 1));

  // Average dust emissions
  const runningTrucks = vehicles.filter(v => v.status === 'Active' && v.speed > 0);
  const avgEmission = runningTrucks.length > 0
    ? (runningTrucks.reduce((acc, v) => acc + (v.dust_emission || 0), 0) / runningTrucks.length).toFixed(1)
    : '0.0';

  // 1. Chart Data: AQI Trend
  const getTrendData = () => {
    switch (trendRange) {
      case 'weekly':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          aqi: [210, 245, 280, 220, 195, 260, stats.avg_aqi],
          pm25: [85, 98, 110, 89, 78, 102, stats.avg_pm25]
        };
      case 'monthly':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          aqi: [250, 230, 215, stats.avg_aqi],
          pm25: [102, 92, 85, stats.avg_pm25]
        };
      default: // daily
        return {
          labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
          aqi: [180, 160, 230, 290, 265, 240, stats.avg_aqi],
          pm25: [72, 65, 92, 116, 108, 96, stats.avg_pm25]
        };
    }
  };

  const trendData = getTrendData();

  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'AQI Index',
        data: trendData.aqi,
        borderColor: '#3B82F6', // Blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#3B82F6',
      },
      {
        label: 'PM2.5 (µg/m³)',
        data: trendData.pm25,
        borderColor: '#10B981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#10B981',
      }
    ]
  };

  // 2. Chart Data: Vehicle Count & Emissions
  const barChartData = {
    labels: ['Urla', 'Siltara', 'Bhilai', 'Raipur Center', 'Durg'],
    datasets: [
      {
        label: 'Active Vehicles En-Route',
        data: [2, 1, 2, 1, 1],
        backgroundColor: 'rgba(245, 158, 11, 0.7)', // Orange
        borderRadius: 4,
      },
      {
        label: 'Dust Emitted Index (mg/m³)',
        data: [42, 68, 28, 12, 18],
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
        borderRadius: 4,
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
      x: {
        grid: { color: 'rgba(156, 163, 175, 0.05)' },
        ticks: { color: 'rgb(156, 163, 175)', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(156, 163, 175, 0.05)' },
        ticks: { color: 'rgb(156, 163, 175)', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP CARDS STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: AQI Status */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex items-center justify-between glass-card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Average AQI</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.avg_aqi}</h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                stats.avg_aqi > 250 ? 'bg-danger' : stats.avg_aqi > 150 ? 'bg-accent' : 'bg-secondary'
              }`}></span>
              <span className="text-xs font-semibold dark:text-slate-300 text-slate-600">
                {stats.avg_aqi > 250 ? 'Severe Air Risk' : stats.avg_aqi > 150 ? 'Poor Quality' : 'Moderate'}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <Activity size={22} />
          </div>
        </div>

        {/* Card 2: PM2.5 & PM10 */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex items-center justify-between glass-card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Particulate Matters</span>
            <div className="flex gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">PM2.5</span>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.avg_pm25} <span className="text-[10px] font-normal text-slate-500">µg/m³</span></h4>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="text-[9px] font-bold text-slate-400 block">PM10</span>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.avg_pm10} <span className="text-[10px] font-normal text-slate-500">µg/m³</span></h4>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2.5 flex items-center gap-1">
              <TrendingDown size={12} className="text-secondary" />
              <span>Reduced 18% via AeroShield active</span>
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/10 text-secondary">
            <Wind size={22} />
          </div>
        </div>

        {/* Card 3: Active Fleet */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex items-center justify-between glass-card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Active Fleet</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.active_trucks} <span className="text-xs font-normal text-slate-500">/ {stats.total_trucks} Trucks</span>
            </h3>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Avg Dust: {avgEmission} mg/m³</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-accent/10 text-accent">
            <Truck size={22} />
          </div>
        </div>

        {/* Card 4: AeroShield Efficiency */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-5 flex items-center justify-between glass-card-hover">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">AeroShield Efficiency</span>
            <h3 className="text-3xl font-black text-secondary">{stats.aeroshield_efficiency}%</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2.5">
              Electrostatic Collector + Water Mist
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-secondary/10 text-secondary">
            <ShieldCheck size={22} />
          </div>
        </div>

      </div>

      {/* 2. LIVE METRICS CHIP GROUP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-3 bg-white dark:bg-industrial-bgLight border border-slate-200 dark:border-industrial-border rounded-xl flex items-center gap-3">
          <div className="text-primary"><Thermometer size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Temperature</span>
            <span className="text-xs font-bold dark:text-slate-100 text-slate-800">{avgTemp}°C</span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-industrial-bgLight border border-slate-200 dark:border-industrial-border rounded-xl flex items-center gap-3">
          <div className="text-secondary"><Droplets size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Humidity</span>
            <span className="text-xs font-bold dark:text-slate-100 text-slate-800">{avgHumidity}%</span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-industrial-bgLight border border-slate-200 dark:border-industrial-border rounded-xl flex items-center gap-3">
          <div className="text-accent"><Wind size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Wind Speed</span>
            <span className="text-xs font-bold dark:text-slate-100 text-slate-800">{avgWind} km/h</span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-industrial-bgLight border border-slate-200 dark:border-industrial-border rounded-xl flex items-center gap-3">
          <div className="text-danger"><AlertTriangle size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Alerts</span>
            <span className="text-xs font-bold text-danger">{stats.unresolved_alerts} Warnings</span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-industrial-bgLight border border-slate-200 dark:border-industrial-border rounded-xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="text-primary"><Activity size={18} /></div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Pollution score</span>
            <span className="text-xs font-bold dark:text-slate-100 text-slate-800">{pollutionScore} / 100</span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Air Quality Trends */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Pollution Index Trends
              </h4>
              <p className="text-[10px] text-slate-400">AQI and PM2.5 levels registered along NH-53</p>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
              <button
                onClick={() => setTrendRange('daily')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  trendRange === 'daily' ? 'bg-primary text-white' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                DAILY
              </button>
              <button
                onClick={() => setTrendRange('weekly')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  trendRange === 'weekly' ? 'bg-primary text-white' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                WEEKLY
              </button>
              <button
                onClick={() => setTrendRange('monthly')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
                  trendRange === 'monthly' ? 'bg-primary text-white' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                MONTHLY
              </button>
            </div>
          </div>

          <div className="h-[250px] relative">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Vehicle & Dust levels per Station */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
              Corridor Traffic & Dust Load
            </h4>
            <p className="text-[10px] text-slate-400 mb-6">Traffic congestion vs dust concentration by area</p>
          </div>
          
          <div className="h-[200px] relative">
            <Bar data={barChartData} options={chartOptions} />
          </div>
          
          <div className="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30 text-[10px] dark:text-slate-400 text-slate-500 font-semibold flex items-start gap-2 border dark:border-slate-800 border-slate-100">
            <span className="text-secondary">💡</span>
            <span>Urla and Siltara show higher dust loads relative to traffic volume due to high mineral density cargo types.</span>
          </div>
        </div>

      </div>

      {/* 4. DETAILS ROW (STATIONS & RECENT ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Station Listing */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
              AQI Monitoring Stations
            </h4>
            <button 
              onClick={() => onTabChange('map')}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>VIEW MAP</span>
              <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {stations.map((st) => (
              <div key={st.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between border dark:border-slate-800/50 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs dark:text-slate-100 text-slate-800">{st.name}</h5>
                    <span className="text-[9px] text-slate-400">Temp: {st.temp}°C | Wind: {st.wind_speed}km/h</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block leading-none font-bold">AQI</span>
                    <span className={`text-sm font-extrabold ${
                      st.current_aqi > 250 ? 'text-danger' : st.current_aqi > 150 ? 'text-accent' : 'text-secondary'
                    }`}>{st.current_aqi}</span>
                  </div>
                  <div className="text-right w-16">
                    <span className="text-[9px] text-slate-400 block leading-none font-bold">PM10</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{st.pm10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Active Warnings Feed
            </h4>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {alerts.filter(a => a.resolved === 0).length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 font-semibold">
                No active threats detected on the network.
              </div>
            ) : (
              alerts.filter(a => a.resolved === 0).map((alert) => (
                <div key={alert.id} className="p-3 bg-red-500/5 dark:bg-red-500/[0.03] border border-red-500/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 text-red-500 rounded-lg mt-0.5">
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {alert.message}
                      </p>
                      <span className="text-[8px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock size={10} />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardHome;
