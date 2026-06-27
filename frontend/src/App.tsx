import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ThemeProvider } from './components/ThemeContext';
import LoginRegister from './pages/LoginRegister';
import DashboardHome from './pages/DashboardHome';
import MapComponent from './components/MapComponent';
import FleetMonitoring from './pages/FleetMonitoring';
import AeroShieldDetail from './pages/AeroShieldDetail';
import AIPrediction from './pages/AIPrediction';
import HealthImpact from './pages/HealthImpact';
import Reports from './pages/Reports';
import { ShieldAlert, X } from 'lucide-react';

interface User {
  name: string;
  email: string;
  role: string;
}

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
  last_service_date: string;
  dust_emission?: number;
  fan_speed?: number;
  electrostatic_status?: string;
  mist_pressure?: number;
  lat?: number;
  lng?: number;
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

interface Toast {
  id: string;
  message: string;
  severity: string;
}

const AppContent: React.FC = () => {
  // Session States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aeroshield-token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aeroshield-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Core App states
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize Auth Success
  const handleLoginSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('aeroshield-token', newToken);
    localStorage.setItem('aeroshield-user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('aeroshield-token');
    localStorage.removeItem('aeroshield-user');
    setToken(null);
    setUser(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Fetch initial system states from REST endpoints
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dashboard');
      const data = await res.json();
      if (res.ok) {
        setDashboardStats(data.summary);
        setStations(data.stations);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/vehicles');
      const data = await res.json();
      if (res.ok) {
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts');
      const data = await res.json();
      if (res.ok) {
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchVehicles();
      fetchAlerts();

      // Setup WebSocket real-time telemetry connection
      const socket = new WebSocket('ws://localhost:5000');
      wsRef.current = socket;

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'TELEMETRY_UPDATE') {
          // Destructure incoming frames
          const { vehicles: liveVehicles, stations: liveStations } = message.data;
          
          // Merge coordinates and states with local arrays
          setVehicles(prev => prev.map(v => {
            const match = liveVehicles.find((lv: any) => lv.id === v.id);
            return match ? { ...v, ...match } : v;
          }));
          setStations(liveStations);

          // Update general dashboard kpis
          setDashboardStats((prev: any) => {
            if (!prev) return prev;
            const activeCount = liveVehicles.filter((lv: any) => lv.status === 'Active').length;
            const runningCount = liveVehicles.filter((lv: any) => lv.status === 'Active' && lv.speed > 0).length;
            const avgSpeed = runningCount > 0 ? liveVehicles.reduce((acc: number, lv: any) => acc + lv.speed, 0) / runningCount : 0;
            const avgWater = runningCount > 0 ? liveVehicles.reduce((acc: number, lv: any) => acc + lv.water_tank_level, 0) / runningCount : 0;
            const avgBattery = runningCount > 0 ? liveVehicles.reduce((acc: number, lv: any) => acc + lv.battery_level, 0) / runningCount : 0;

            const stationsAvgAqi = liveStations.reduce((acc: number, ls: any) => acc + ls.current_aqi, 0) / liveStations.length;
            const stationsAvgPm25 = liveStations.reduce((acc: number, ls: any) => acc + ls.pm25, 0) / liveStations.length;
            const stationsAvgPm10 = liveStations.reduce((acc: number, ls: any) => acc + ls.pm10, 0) / liveStations.length;

            return {
              ...prev,
              avg_aqi: Math.round(stationsAvgAqi),
              avg_pm25: Math.round(stationsAvgPm25),
              avg_pm10: Math.round(stationsAvgPm10),
              active_trucks: activeCount,
              avg_speed: Math.round(avgSpeed),
              avg_water: Math.round(avgWater),
              avg_battery: Math.round(avgBattery)
            };
          });
        }

        if (message.type === 'NEW_ALERT') {
          const alert = message.data;
          // Prepend new alert
          setAlerts(prev => [alert, ...prev]);
          // Increment alerts badge counter
          setDashboardStats((prev: any) => prev ? { ...prev, unresolved_alerts: prev.unresolved_alerts + 1 } : prev);
          
          // Trigger slide-in screen toast notification
          const toastId = Math.random().toString(36).substr(2, 9);
          setToasts(prev => [...prev, { id: toastId, message: alert.message, severity: alert.severity }]);

          // Auto-fade toast after 5 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 5000);
        }
      };

      socket.onerror = (err) => console.error('WebSocket telemetry error:', err);
      socket.onclose = () => console.log('WebSocket telemetry connection closed.');

      return () => {
        socket.close();
      };
    }
  }, [token]);

  // Handler: Resolve alert (Manager/Admin only)
  const handleResolveAlert = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/alerts/resolve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: 1 } : a));
        setDashboardStats((prev: any) => prev ? { ...prev, unresolved_alerts: Math.max(0, prev.unresolved_alerts - 1) } : prev);
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Handler: Add or Update Vehicle (Admin only)
  const handleAddOrUpdateVehicle = async (payload: Vehicle) => {
    if (!token) return false;
    try {
      const res = await fetch('http://localhost:5000/api/vehicle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchVehicles();
        return true;
      }
    } catch (err) {
      console.error('Error saving vehicle:', err);
    }
    return false;
  };

  // Handler: Delete Vehicle (Admin only)
  const handleDeleteVehicle = async (id: string) => {
    if (!token) return false;
    try {
      const res = await fetch('http://localhost:5000/api/vehicle', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchVehicles();
        return true;
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
    return false;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!token) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  // Tab router resolver
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardHome 
            stats={dashboardStats} 
            stations={stations} 
            vehicles={vehicles} 
            alerts={alerts}
            onTabChange={setCurrentTab}
          />
        );
      case 'map':
        return (
          <MapComponent 
            vehicles={vehicles} 
            stations={stations} 
            onSelectVehicle={(id) => {
              setSelectedVehicleId(id);
              if (user?.role === 'public') {
                setCurrentTab('map');
              } else {
                setCurrentTab('aeroshield');
              }
            }}
          />
        );
      case 'fleet':
        return (
          <FleetMonitoring 
            user={user} 
            vehicles={vehicles} 
            onAddOrUpdateVehicle={handleAddOrUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onSelectVehicle={(id) => {
              setSelectedVehicleId(id);
              if (user?.role === 'public') {
                setCurrentTab('map');
              } else {
                setCurrentTab('aeroshield');
              }
            }}
          />
        );
      case 'aeroshield':
        return (
          <AeroShieldDetail 
            vehicles={vehicles} 
            token={token} 
            selectedId={selectedVehicleId} 
            setSelectedId={setSelectedVehicleId} 
          />
        );
      case 'predictions':
        return <AIPrediction user={user} token={token} />;
      case 'health':
        return <HealthImpact stations={stations} />;
      case 'reports':
        return <Reports vehicles={vehicles} />;
      default:
        return <DashboardHome stats={dashboardStats} stations={stations} vehicles={vehicles} alerts={alerts} onTabChange={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen pl-64 pt-16 flex flex-col">
      {/* Sidebar & Top Navbar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} onLogout={handleLogout} />
      <Navbar currentTab={currentTab} user={user} alerts={alerts} onResolveAlert={handleResolveAlert} />

      {/* Main Content Body */}
      <main className="flex-1 p-8 overflow-y-auto">
        {renderTabContent()}
      </main>

      {/* Real-time Toast Notifications stack */}
      <div className="fixed bottom-6 right-6 space-y-3 z-[9999] max-w-sm w-full">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`p-4 rounded-xl border shadow-2xl glass flex items-start gap-3 transition-all duration-300 transform translate-x-0 ${
              toast.severity === 'danger' 
                ? 'border-red-500/30 text-red-500 bg-red-950/20' 
                : 'border-amber-500/30 text-amber-500 bg-amber-950/20'
            }`}
          >
            <ShieldAlert size={18} className="mt-0.5 animate-pulse" />
            <div className="flex-1">
              <span className="text-[10px] font-black tracking-widest uppercase block mb-0.5">TELEMETRY WARNING</span>
              <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-100">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded hover:bg-white/10 dark:text-slate-400 text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
