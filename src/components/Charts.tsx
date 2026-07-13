import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, CloudRain, Wind, History, Database, Layers, Activity, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Charts() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [chartData, setChartData] = useState([]);
  const [movingAvgData, setMovingAvgData] = useState([]);
  const [pressureData, setPressureData] = useState([]);
  const [humidityStats, setHumidityStats] = useState([]);
  const [rainIntensity, setRainIntensity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('standard'); // standard, materialized_rain, simple_humidity

  useEffect(() => {
    fetch('/api/stations').then(res => res.json()).then(data => {
      setStations(data);
      if (data.length > 0) setSelectedStation(data[0].station_id.toString());
    });
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchChartData();
    }
  }, [selectedStation, activeView]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      if (activeView === 'standard') {
        const [trendsRes, avgRes, pressureRes] = await Promise.all([
          fetch(`/api/charts/trends?station_id=${selectedStation}`),
          fetch(`/api/analytics/moving-average?station_id=${selectedStation}`),
          fetch(`/api/analytics/pressure-trends?station_id=${selectedStation}`)
        ]);
        setChartData(await trendsRes.json());
        setMovingAvgData(await avgRes.json());
        setPressureData(await pressureRes.json());
      } else if (activeView === 'materialized_rain') {
        const res = await fetch('/api/analytics/rain-intensity');
        setRainIntensity(await res.json());
      } else if (activeView === 'simple_humidity') {
        const res = await fetch('/api/analytics/humidity-stats');
        setHumidityStats(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-aqua-deep flex items-center gap-2">
            <BarChart3 size={24} /> ADVANCED_ANALYTICS_ENGINE
          </h3>
          <p className="text-sm text-context-gray italic serif">Multi-dimensional analysis of climate repositories using Oracle-style views.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeView === 'standard' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveView('standard')}
            className={activeView === 'standard' ? 'bg-aqua-deep' : 'border-aqua-dark/20 text-aqua-deep'}
          >
            <Activity size={14} className="mr-2" /> Standard_View
          </Button>
          <Button 
            variant={activeView === 'materialized_rain' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveView('materialized_rain')}
            className={activeView === 'materialized_rain' ? 'bg-nature-mid' : 'border-nature-mid/20 text-nature-mid'}
          >
            <Layers size={14} className="mr-2" /> Materialized_Rain_View
          </Button>
          <Button 
            variant={activeView === 'simple_humidity' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveView('simple_humidity')}
            className={activeView === 'simple_humidity' ? 'bg-warm-deep' : 'border-warm-deep/20 text-warm-deep'}
          >
            <Database size={14} className="mr-2" /> Simple_Humidity_View
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="bg-white border-aqua-dark/20">
              <SelectValue placeholder="Select Station" />
            </SelectTrigger>
            <SelectContent>
              {stations.map((s: any) => (
                <SelectItem key={s.station_id} value={s.station_id.toString()}>{s.station_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeView === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Trend */}
          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-xs font-mono opacity-60 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp size={14} /> Temperature_Trend_Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} stroke="#757575" />
                  <YAxis fontSize={10} stroke="#757575" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Line name="Temperature (°C)" type="monotone" dataKey="temp" stroke="#E74C3C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Moving Average */}
          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-xs font-mono opacity-60 flex items-center gap-2 uppercase tracking-widest">
                <History size={14} /> 7-Day_Moving_Average
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movingAvgData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                  <XAxis dataKey="reading_date" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} stroke="#757575" />
                  <YAxis fontSize={10} stroke="#757575" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Line name="Moving Avg" type="monotone" dataKey="moving_avg" stroke="#056DB6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line name="Raw Temp" type="monotone" dataKey="temperature_c" stroke="#E74C3C" strokeWidth={1} opacity={0.3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Precipitation */}
          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-xs font-mono opacity-60 flex items-center gap-2 uppercase tracking-widest">
                <CloudRain size={14} /> Precipitation_Volume (mm)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} stroke="#757575" />
                  <YAxis fontSize={10} stroke="#757575" />
                  <Tooltip cursor={{ fill: '#60C97720' }} contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar name="Rainfall" dataKey="rain" fill="#60C977" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pressure */}
          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-xs font-mono opacity-60 flex items-center gap-2 uppercase tracking-widest">
                <Wind size={14} /> Barometric_Pressure (hPa)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pressureData}>
                  <defs>
                    <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#056DB6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#056DB6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} stroke="#757575" />
                  <YAxis domain={['auto', 'auto']} fontSize={10} stroke="#757575" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Area name="Pressure" type="monotone" dataKey="pressure" stroke="#056DB6" fillOpacity={1} fill="url(#colorPressure)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'materialized_rain' && (
        <Card className="border-aqua-dark/20 shadow-none bg-white/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-aqua-deep flex items-center gap-2">
              <Layers size={18} /> MV_RAIN_INTENSITY_DISTRIBUTION
            </CardTitle>
            <CardDescription>Materialized view aggregating rain frequency by intensity categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainIntensity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                <XAxis type="number" fontSize={10} stroke="#757575" />
                <YAxis dataKey="station_name" type="category" fontSize={10} width={120} stroke="#757575" />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar name="Light Rain (0-10mm)" dataKey="light_rain" stackId="a" fill="#60C977" />
                <Bar name="Moderate Rain (10-50mm)" dataKey="moderate_rain" stackId="a" fill="#F1C40F" />
                <Bar name="Heavy Rain (>50mm)" dataKey="heavy_rain" stackId="a" fill="#E74C3C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {activeView === 'simple_humidity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-aqua-deep flex items-center gap-2">
                <Database size={18} /> VW_HUMIDITY_AGGREGATES
              </CardTitle>
              <CardDescription>Simple view calculating humidity statistics per station.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={humidityStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757520" />
                  <XAxis dataKey="station_name" fontSize={10} stroke="#757575" />
                  <YAxis fontSize={10} stroke="#757575" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar name="Avg Humidity (%)" dataKey="avg_humidity" fill="#8A2BE2" />
                  <Bar name="Max Humidity (%)" dataKey="max_humidity" fill="#E74C3C" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-aqua-dark/20 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-aqua-deep flex items-center gap-2">
                <Thermometer size={18} /> Humidity_Distribution_Pie
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={humidityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ station_name, avg_humidity }) => `${station_name}: ${avg_humidity.toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="avg_humidity"
                  >
                    {humidityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
