import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, MapPin, TrendingUp, Wind } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({ 
    totalReadings: 0, 
    activeAlerts: 0, 
    activeStations: 0,
    latestReading: '',
    earliestReading: '',
    avgTemp: 0
  });
  const [stations, setStations] = useState([]);
  const [extremes, setExtremes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, stationsRes, extremesRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/stations'),
          fetch('/api/analytics/extremes')
        ]);

        if (!statsRes.ok || !stationsRes.ok || !extremesRes.ok) {
          throw new Error('One or more fetches failed');
        }

        const [statsData, stationsData, extremesData] = await Promise.all([
          statsRes.json(),
          stationsRes.json(),
          extremesRes.json()
        ]);

        setStats(statsData);
        setStations(stationsData);
        setExtremes(extremesData);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        toast.error('Failed to load dashboard data. Please check if server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      <span className="ml-4 font-mono text-sm">INITIALIZING_CDR_CORE...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-aqua-deep uppercase tracking-widest">Network_Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-aqua-deep">{stats.totalReadings.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] text-nature-mid mt-2 font-bold">
              <Activity size={10} /> LIVE_DATA_STREAMING
            </div>
          </CardContent>
        </Card>

        {/* Stat 2 */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50 border-l-4 border-l-warm-deep md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-warm-deep uppercase tracking-widest">Active_Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-warm-deep">{stats.activeAlerts}</div>
            <div className="flex items-center gap-1 text-[10px] text-warm-mid mt-2 font-bold">
              <AlertTriangle size={10} /> IMMEDIATE_ACTION_REQUIRED
            </div>
          </CardContent>
        </Card>

        {/* Extremes Table (Bento Large) */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50 md:col-span-2 md:row-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-aqua-deep">
              <TrendingUp size={16} /> Regional Extremes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-aqua-dark/20">
                  <TableHead className="text-[10px] uppercase text-aqua-deep">Station</TableHead>
                  <TableHead className="text-[10px] uppercase text-aqua-deep">Current Temp</TableHead>
                  <TableHead className="text-[10px] uppercase text-aqua-deep">Max Temp</TableHead>
                  <TableHead className="text-[10px] uppercase text-aqua-deep">Total Rain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extremes.map((e: any, i: number) => (
                  <TableRow key={i} className="border-aqua-dark/10">
                    <TableCell className="text-xs font-bold text-aqua-deep">{e.station_name}</TableCell>
                    <TableCell className="data-value text-xs font-bold text-nature-deep">{(e.current_temp || 0).toFixed(1)}°C</TableCell>
                    <TableCell className="data-value text-xs text-warm-deep">{e.max_temp.toFixed(1)}°C</TableCell>
                    <TableCell className="data-value text-xs text-cold-deep">{e.total_precip.toFixed(1)}mm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stat 3 */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-aqua-deep uppercase tracking-widest">Active_Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-aqua-deep">{stats.activeStations}</div>
            <div className="flex items-center gap-1 text-[10px] text-context-gray mt-2 font-bold uppercase">
              <MapPin size={10} /> Pakistan_Network
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="border-aqua-dark/20 shadow-none bg-aqua-deep text-white md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-white/70 uppercase tracking-widest">Repository_Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono opacity-60 uppercase block">Latest_Reading</span>
              <span className="text-xs font-bold">{stats.latestReading ? new Date(stats.latestReading).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono opacity-60 uppercase block">Avg_Temperature</span>
              <span className="text-xs font-bold">{stats.avgTemp.toFixed(1)}°C</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono opacity-60 uppercase block">Coverage_Range</span>
              <span className="text-[10px] font-bold">
                {stats.earliestReading ? new Date(stats.earliestReading).toLocaleDateString() : '...'} to {stats.latestReading ? new Date(stats.latestReading).toLocaleDateString() : '...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station Overview (Large) */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-aqua-deep">Monitoring Network</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-aqua-dark/20 bg-aqua-light/50">
                  <TableHead className="col-header text-aqua-deep">Station</TableHead>
                  <TableHead className="col-header text-aqua-deep">Location</TableHead>
                  <TableHead className="col-header text-aqua-deep">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.map((station: any) => (
                  <TableRow key={station.station_id} className="data-row border-aqua-dark/10">
                    <TableCell className="font-bold text-sm text-aqua-deep">
                      {station.station_name}
                      <p className="text-[10px] font-mono opacity-50">ID_{station.station_id.toString().padStart(3, '0')}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {station.city}, {station.country}
                      <p className="text-[10px] font-mono text-context-gray">
                        {station.latitude.toFixed(2)}°N, {station.longitude.toFixed(2)}°E
                      </p>
                      {station.loc_obj && (
                        <p className="text-[9px] font-mono text-aqua-deep opacity-60 mt-1">
                          OBJ_TYPE: {station.loc_obj}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={station.is_active ? "default" : "secondary"} className={station.is_active ? "bg-nature-mid" : "bg-accessible-neutral"}>
                        {station.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Live Feed (Small) */}
        <Card className="border-aqua-dark/20 shadow-none bg-white/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-aqua-deep">
              <Wind size={18} className="animate-spin-slow" /> Live Feed
            </CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase text-aqua-deep/60">Real-time Ingestion Log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-2 rounded-md bg-nature-mid/5 border border-nature-mid/10">
                <div className="mt-1 w-2 h-2 bg-nature-mid rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-aqua-deep">New Reading Ingested</p>
                  <p className="text-[10px] text-context-gray">Station: Karachi Central | Temp: 32.4°C</p>
                  <p className="text-[10px] font-mono opacity-40 mt-1">JUST_NOW</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-md bg-warm-mid/5 border border-warm-mid/10">
                <div className="mt-1 w-2 h-2 bg-warm-mid rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-warm-deep">Threshold Warning</p>
                  <p className="text-[10px] text-context-gray">Station: Lahore North | Temp: 41.2°C</p>
                  <p className="text-[10px] font-mono opacity-40 mt-1">2_MIN_AGO</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-md bg-aqua-deep/5 border border-aqua-deep/10">
                <div className="mt-1 w-2 h-2 bg-aqua-deep rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-aqua-deep">System Heartbeat</p>
                  <p className="text-[10px] text-context-gray">All 5 stations reporting active.</p>
                  <p className="text-[10px] font-mono opacity-40 mt-1">5_MIN_AGO</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
