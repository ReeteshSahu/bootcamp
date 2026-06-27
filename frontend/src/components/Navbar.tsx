import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, Check, ShieldAlert } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface Alert {
  id: number;
  vehicle_id: string | null;
  type: string;
  message: string;
  severity: string;
  resolved: number;
  timestamp: string;
}

interface NavbarProps {
  currentTab: string;
  user: { name: string; email: string; role: string } | null;
  alerts: Alert[];
  onResolveAlert: (id: number) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentTab, user, alerts, onResolveAlert }) => {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAlerts = alerts.filter(a => a.resolved === 0);
  const canResolve = user && (user.role === 'admin' || user.role === 'manager');

  const tabTitles: Record<string, string> = {
    dashboard: 'System Overview Dashboard',
    map: 'Raipur-Bhilai Interactive Heatmap Map',
    fleet: 'Fleet Ingestion & Status Monitoring',
    aeroshield: 'AeroShield Hardware Telemetry',
    predictions: 'AI Predictive Forecasting Analytics',
    health: 'Corridor Public Health Risk Assessment',
    reports: 'Compliance Reporting & Auditing Center',
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'danger': return 'bg-danger/10 text-danger border-danger/30';
      case 'warning': return 'bg-accent/10 text-accent border-accent/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-64 border-b dark:border-industrial-border border-industrial-lightBorder dark:bg-industrial-bgLight bg-industrial-lightCard transition-all duration-300 flex items-center justify-between px-8 z-10">
      {/* Title */}
      <div>
        <h2 className="font-bold text-lg tracking-wide text-slate-800 dark:text-slate-100">
          {tabTitles[currentTab] || 'Overview'}
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
          Raipur–Durg–Bhilai Industrial Transport Corridor (NH-53)
        </p>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
          >
            <Bell size={18} />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-lg shadow-xl border dark:border-industrial-border border-industrial-lightBorder bg-white dark:bg-industrial-bgLight z-20">
              <div className="p-4 border-b dark:border-industrial-border border-industrial-lightBorder flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Active Notifications</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {activeAlerts.length} Warnings
                </span>
              </div>

              <div className="divide-y dark:divide-industrial-border divide-industrial-lightBorder">
                {activeAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    All systems operating normally. No active alerts.
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 flex flex-col gap-2">
                      <div className="flex gap-2.5 items-start">
                        <div className="mt-0.5 text-red-500">
                          <ShieldAlert size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                            {alert.message}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      {canResolve && (
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="self-end flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded hover:bg-secondary/20 transition-all"
                        >
                          <Check size={10} />
                          <span>RESOLVE</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
