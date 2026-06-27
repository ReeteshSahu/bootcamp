import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Truck, 
  ShieldAlert, 
  BrainCircuit, 
  Activity, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  User,
  ShieldAlert as AeroShieldIcon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: { name: string; email: string; role: string } | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, user, onLogout }) => {
  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'public'] },
    { id: 'map', label: 'Interactive Map', icon: Map, roles: ['admin', 'manager', 'public'] },
    { id: 'fleet', label: 'Fleet Monitoring', icon: Truck, roles: ['admin', 'manager', 'public'] },
    { id: 'aeroshield', label: 'AeroShield Hardware', icon: AeroShieldIcon, roles: ['admin', 'manager'] },
    { id: 'predictions', label: 'AI Predictions', icon: BrainCircuit, roles: ['admin', 'manager'] },
    { id: 'health', label: 'Health Impact', icon: Activity, roles: ['admin', 'manager', 'public'] },
    { id: 'reports', label: 'Analytics & Reports', icon: FileSpreadsheet, roles: ['admin', 'manager'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const roleLabels: Record<string, string> = {
    admin: 'System Admin',
    manager: 'Fleet Manager',
    public: 'Public Citizen'
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between border-r dark:border-industrial-border border-industrial-lightBorder dark:bg-industrial-bgLight bg-industrial-lightCard transition-all duration-300 z-10">
      <div className="flex flex-col">
        {/* Title/Logo */}
        <div className="p-6 flex items-center gap-3 border-b dark:border-industrial-border border-industrial-lightBorder">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-xl tracking-wider">A</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none tracking-wide text-primary">AeroShield</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Dust Mitigation</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="mt-6 px-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'dark:text-slate-400 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t dark:border-industrial-border border-industrial-lightBorder">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
            <User size={18} />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-xs truncate leading-none dark:text-slate-100 text-slate-900">{user.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user.email}</p>
            <span className={`inline-block px-1.5 py-0.5 mt-1 text-[8px] font-extrabold uppercase rounded ${
              user.role === 'admin' 
                ? 'bg-danger/10 text-danger' 
                : user.role === 'manager' 
                  ? 'bg-accent/10 text-accent' 
                  : 'bg-secondary/10 text-secondary'
            }`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold tracking-wide transition-all"
        >
          <LogOut size={14} />
          <span>LOG OUT</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
