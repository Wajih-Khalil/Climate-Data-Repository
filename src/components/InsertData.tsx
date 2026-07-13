import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, RefreshCcw } from 'lucide-react';

export default function InsertData({ user, onSuccess }: { user: any, onSuccess: () => void }) {
  const [stations, setStations] = useState([]);
  const [formData, setFormData] = useState({
    station_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    temperature_c: '',
    humidity_pct: '',
    precipitation_mm: '0',
    wind_speed_kmh: '',
    pressure_hpa: '1013'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/stations').then(res => res.json()).then(setStations);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.station_id) return toast.error('Please select a station');
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: user.role,
          station_id: parseInt(formData.station_id),
          temperature_c: parseFloat(formData.temperature_c),
          humidity_pct: parseFloat(formData.humidity_pct),
          precipitation_mm: parseFloat(formData.precipitation_mm),
          wind_speed_kmh: parseFloat(formData.wind_speed_kmh),
          pressure_hpa: parseFloat(formData.pressure_hpa)
        })
      });

      if (res.ok) {
        toast.success('Data committed to repository successfully');
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(`Database Error: ${err.error}`);
      }
    } catch (error) {
      toast.error('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-aqua-dark/20 shadow-none bg-white/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-aqua-deep">New Weather Observation</CardTitle>
          <p className="text-sm text-muted-foreground italic serif">Manual entry for station readings with PL/SQL trigger validation.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">STATION_ID</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, station_id: val })}>
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
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">READING_DATE</Label>
                <Input 
                  type="date" 
                  value={formData.reading_date}
                  className="bg-white border-aqua-dark/20"
                  onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">TEMP (°C)</Label>
                <Input 
                  type="number" step="0.1"
                  className="bg-white border-aqua-dark/20 font-mono"
                  placeholder="e.g. 32.5"
                  onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">HUMIDITY (%)</Label>
                <Input 
                  type="number" step="0.1"
                  className="bg-white border-aqua-dark/20 font-mono"
                  placeholder="e.g. 65"
                  onChange={(e) => setFormData({ ...formData, humidity_pct: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">RAIN (mm)</Label>
                <Input 
                  type="number" step="0.1"
                  className="bg-white border-aqua-dark/20 font-mono"
                  value={formData.precipitation_mm}
                  onChange={(e) => setFormData({ ...formData, precipitation_mm: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">WIND_SPEED (km/h)</Label>
                <Input 
                  type="number" step="0.1"
                  className="bg-white border-aqua-dark/20 font-mono"
                  placeholder="e.g. 15"
                  onChange={(e) => setFormData({ ...formData, wind_speed_kmh: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono opacity-60 text-aqua-deep">PRESSURE (hPa)</Label>
                <Input 
                  type="number" step="0.1"
                  className="bg-white border-aqua-dark/20 font-mono"
                  value={formData.pressure_hpa}
                  onChange={(e) => setFormData({ ...formData, pressure_hpa: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1 bg-aqua-deep text-white hover:bg-aqua-deep/90 shadow-md">
                {submitting ? <RefreshCcw className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                COMMIT_TO_DATABASE
              </Button>
              <Button type="reset" variant="outline" className="border-aqua-dark/20 text-aqua-deep" onClick={() => setFormData({
                ...formData,
                temperature_c: '',
                humidity_pct: '',
                precipitation_mm: '0',
                wind_speed_kmh: '',
                pressure_hpa: '1013'
              })}>
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
