import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Search, PlusCircle, Bell, BarChart3, Wind, Thermometer, Droplets, CloudRain, ShieldAlert, LogOut, BrainCircuit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Components
import Dashboard from './components/Dashboard';
import SearchData from './components/Search';
import InsertData from './components/InsertData';
import Alerts from './components/Alerts';
import Charts from './components/Charts';
import DBATools from './components/DBATools';
import Login from './components/Login';
import Forecast from './components/Forecast';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);

  if (!user) {
    return (
      <>
        <Login onLogin={setUser} />
        <Toaster position="top-right" />
      </>
    );
  }

  const handleLogout = () => {
    setUser(null);
    toast.info('Logged out successfully');
  };

  return (
    <div className="min-h-screen flex flex-col bg-aqua-light/30">
      <header className="border-b border-aqua-dark/20 bg-aqua-deep text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white text-aqua-deep rounded-lg shadow-inner">
                <Wind size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">CDR</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-mono">Climate Data Repository</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', roles: ['cdr_admin', 'cdr_analyst', 'cdr_readonly'] },
                { id: 'search', label: 'Search', roles: ['cdr_admin', 'cdr_analyst', 'cdr_readonly'] },
                { id: 'forecast', label: 'Forecast', roles: ['cdr_admin', 'cdr_analyst'] },
                { id: 'insert', label: 'Insert', roles: ['cdr_admin'] },
                { id: 'alerts', label: 'Alerts', roles: ['cdr_admin', 'cdr_analyst', 'cdr_readonly'] },
                { id: 'charts', label: 'Charts', roles: ['cdr_admin', 'cdr_analyst', 'cdr_readonly'] },
                { id: 'dba', label: 'DBA Tools', roles: ['cdr_admin'] }
              ].filter(item => item.roles.includes(user.role)).map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-white text-aqua-deep shadow-md scale-105' 
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-white/20">
                <div className="text-right">
                  <p className="text-xs font-bold leading-none">{user.full_name}</p>
                  <p className="text-[9px] font-mono opacity-70 uppercase">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono opacity-70 uppercase tracking-tighter">Live_Sync_Active</span>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h2>
          <p className="text-muted-foreground italic serif">
            {activeTab === 'dashboard' && "Overview of environmental monitoring network across Pakistan."}
            {activeTab === 'search' && "Query and filter historical weather observations."}
            {activeTab === 'forecast' && "AI-powered predictive modeling for future climate trends."}
            {activeTab === 'insert' && "Record new environmental and weather readings."}
            {activeTab === 'alerts' && "Real-time monitoring of threshold breaches."}
            {activeTab === 'charts' && "Visual analysis of climate trends and patterns."}
            {activeTab === 'dba' && "Advanced Oracle database administration and system management."}
          </p>
        </div>

        <div className="space-y-8">
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'search' && <SearchData user={user} />}
          {activeTab === 'forecast' && <Forecast />}
          {activeTab === 'insert' && <InsertData user={user} onSuccess={() => setActiveTab('dashboard')} />}
          {activeTab === 'alerts' && <Alerts user={user} />}
          {activeTab === 'charts' && <Charts />}
          {activeTab === 'dba' && <DBATools user={user} />}
        </div>
      </main>

      <footer className="border-t border-ink/10 py-6 bg-white/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-mono opacity-40">
            &copy; 2026 CLIMATE DATA REPOSITORY | ORACLE 21c COMPATIBLE SCHEMA | V1.0.4
          </p>
        </div>
      </footer>
      
      <Toaster position="top-right" />
    </div>
  );
}
