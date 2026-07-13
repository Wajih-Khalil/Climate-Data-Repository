import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Trash2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SearchData({ user }: { user: any }) {
  const [readings, setReadings] = useState([]);
  const [stations, setStations] = useState([]);
  const [filters, setFilters] = useState({
    station_id: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/stations').then(res => res.json()).then(setStations);
  }, []);

  useEffect(() => {
    handleSearch();
  }, [filters]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = '';
      if (filters.station_id && filters.station_id !== 'all') query += `station_id=${filters.station_id}&`;
      if (filters.start_date) query += `start_date=${filters.start_date}&`;
      if (filters.end_date) query += `end_date=${filters.end_date}&`;
      
      const res = await fetch(`/api/readings?${query}`);
      const data = await res.json();
      setReadings(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (user.role !== 'cdr_admin') return toast.error('Only Admins can delete data');
    
    if (window.confirm('Are you sure you want to delete this reading?')) {
      try {
        const res = await fetch(`/api/readings/${id}?role=${user.role}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Reading deleted');
          handleSearch();
        } else {
          toast.error('Failed to delete reading');
        }
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-aqua-dark/20 shadow-none bg-white/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-aqua-deep">
            <Filter size={18} /> Query Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-mono opacity-60 text-aqua-deep">STATION_SELECT</label>
              <Select onValueChange={(val) => setFilters({ ...filters, station_id: val })}>
                <SelectTrigger className="bg-white border-aqua-dark/20">
                  <SelectValue placeholder="All Stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stations.map((s: any) => (
                    <SelectItem key={s.station_id} value={s.station_id.toString()}>{s.station_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono opacity-60 text-aqua-deep">START_DATE</label>
              <Input 
                type="date" 
                className="bg-white border-aqua-dark/20"
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono opacity-60 text-aqua-deep">END_DATE</label>
              <Input 
                type="date" 
                className="bg-white border-aqua-dark/20"
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
            <Button onClick={handleSearch} className="bg-aqua-deep text-white hover:bg-aqua-deep/90 shadow-md">
              <Search size={16} className="mr-2" /> Execute Query
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-aqua-dark/20 shadow-none bg-white/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold text-aqua-deep">Query Results</CardTitle>
            <Badge variant="outline" className="bg-nature-light/30 text-nature-deep border-nature-mid/20 flex items-center gap-1 font-mono text-[10px]">
              <ShieldCheck size={10} /> VPD_POLICY: REGIONAL_ACCESS_ACTIVE
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="border-aqua-dark/20 text-aqua-deep hover:bg-aqua-deep hover:text-white">
            <Download size={14} className="mr-2" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-aqua-dark/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-aqua-light/50">
                <TableRow className="hover:bg-transparent border-aqua-dark/20">
                  <TableHead className="col-header text-aqua-deep">Date</TableHead>
                  <TableHead className="col-header text-aqua-deep">Station</TableHead>
                  <TableHead className="col-header text-aqua-deep">Temp (°C)</TableHead>
                  <TableHead className="col-header text-aqua-deep">Humidity (%)</TableHead>
                  <TableHead className="col-header text-aqua-deep">Rain (mm)</TableHead>
                  <TableHead className="col-header text-aqua-deep">Wind (km/h)</TableHead>
                  <TableHead className="col-header text-aqua-deep">Pressure (hPa)</TableHead>
                  {user.role === 'cdr_admin' && <TableHead className="col-header text-aqua-deep text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'cdr_admin' ? 8 : 7} className="text-center py-8 font-mono opacity-50">EXECUTING_SQL_QUERY...</TableCell>
                  </TableRow>
                ) : readings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === 'cdr_admin' ? 8 : 7} className="text-center py-8 font-mono opacity-50">NO_RECORDS_FOUND</TableCell>
                  </TableRow>
                ) : (
                  readings.map((r: any) => (
                    <TableRow key={r.reading_id} className="data-row border-aqua-dark/5">
                      <TableCell className="data-value">{r.reading_date}</TableCell>
                      <TableCell className="font-medium text-aqua-deep">{r.station_name}</TableCell>
                      <TableCell className="data-value">{r.temperature_c.toFixed(1)}</TableCell>
                      <TableCell className="data-value">{r.humidity_pct.toFixed(1)}</TableCell>
                      <TableCell className="data-value">{r.precipitation_mm.toFixed(1)}</TableCell>
                      <TableCell className="data-value">{r.wind_speed_kmh.toFixed(1)}</TableCell>
                      <TableCell className="data-value">{r.pressure_hpa.toFixed(0)}</TableCell>
                      {user.role === 'cdr_admin' && (
                        <TableCell className="text-right">
                          <button 
                            onClick={() => handleDelete(r.reading_id)}
                            className="p-1 text-warm-deep hover:bg-warm-mid/10 rounded transition-colors"
                            title="Delete Reading"
                          >
                            <Trash2 size={14} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
