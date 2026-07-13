import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, Activity, Filter, ArrowUpDown, Search, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Alerts({ user }: { user: any }) {
  const [alerts, setAlerts] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    station: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'triggered_at',
    direction: 'desc'
  });

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      setStations(data);
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStations();
  }, []);

  const filteredAndSortedAlerts = useMemo(() => {
    let result = [...alerts];

    // Filtering
    if (filters.severity !== 'all') {
      result = result.filter(a => a.severity === filters.severity);
    }
    if (filters.status !== 'all') {
      const isResolved = filters.status === 'resolved';
      result = result.filter(a => a.is_resolved === (isResolved ? 1 : 0));
    }
    if (filters.station !== 'all') {
      result = result.filter(a => a.station_id.toString() === filters.station);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a => 
        a.alert_message.toLowerCase().includes(searchLower) || 
        a.station_name.toLowerCase().includes(searchLower) ||
        a.alert_type.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'severity') {
        const severityOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        aValue = severityOrder[a.severity] || 0;
        bValue = severityOrder[b.severity] || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [alerts, filters, sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const resolveAlert = async (id: number) => {
    if (user.role !== 'cdr_admin') return toast.error('Only Admins can resolve alerts');
    
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      if (res.ok) {
        toast.success('Alert marked as resolved');
        fetchAlerts();
      } else {
        toast.error('Failed to resolve alert');
      }
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <ShieldAlert className="text-warm-deep" size={16} />;
      case 'High': return <AlertTriangle className="text-warm-mid" size={16} />;
      case 'Medium': return <Info className="text-aqua-deep" size={16} />;
      default: return <Info className="text-context-gray" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-aqua-dark/20 shadow-none bg-white/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-aqua-deep">
                <ShieldAlert size={20} /> Active Monitoring Dashboard
              </CardTitle>
              <CardDescription className="text-xs italic">Real-time alerts triggered by automated PL/SQL business logic.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-aqua-deep opacity-50" />
                <Input 
                  placeholder="Search alerts..." 
                  className="pl-8 bg-white border-aqua-dark/20 h-9 text-xs"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-aqua-deep opacity-60 flex items-center gap-1">
                <Filter size={10} /> Severity_Filter
              </label>
              <Select value={filters.severity} onValueChange={(val) => setFilters({ ...filters, severity: val })}>
                <SelectTrigger className="h-8 text-xs bg-white border-aqua-dark/20">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-aqua-deep opacity-60 flex items-center gap-1">
                <Activity size={10} /> Status_Filter
              </label>
              <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
                <SelectTrigger className="h-8 text-xs bg-white border-aqua-dark/20">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="resolved">Resolved Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-aqua-deep opacity-60 flex items-center gap-1">
                <MapPin size={10} /> Station_Filter
              </label>
              <Select value={filters.station} onValueChange={(val) => setFilters({ ...filters, station: val })}>
                <SelectTrigger className="h-8 text-xs bg-white border-aqua-dark/20">
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
          </div>

          <div className="rounded-md border border-aqua-dark/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-aqua-light/50">
                <TableRow className="hover:bg-transparent border-aqua-dark/20">
                  <TableHead 
                    className="col-header text-aqua-deep cursor-pointer hover:bg-aqua-light/80 transition-colors"
                    onClick={() => requestSort('triggered_at')}
                  >
                    <div className="flex items-center gap-1">
                      Timestamp <ArrowUpDown size={12} className="opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="col-header text-aqua-deep">Station</TableHead>
                  <TableHead className="col-header text-aqua-deep">Type</TableHead>
                  <TableHead className="col-header text-aqua-deep">Message</TableHead>
                  <TableHead 
                    className="col-header text-aqua-deep cursor-pointer hover:bg-aqua-light/80 transition-colors"
                    onClick={() => requestSort('severity')}
                  >
                    <div className="flex items-center gap-1">
                      Severity <ArrowUpDown size={12} className="opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="col-header text-aqua-deep">Status</TableHead>
                  <TableHead className="col-header text-right text-aqua-deep">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 font-mono opacity-50">SCANNING_ALERTS_LOG...</TableCell>
                  </TableRow>
                ) : filteredAndSortedAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 font-mono opacity-50">NO_MATCHING_ALERTS_FOUND</TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAlerts.map((a: any) => (
                    <TableRow key={a.alert_id} className={`data-row border-aqua-dark/5 ${a.is_resolved ? 'opacity-50' : ''}`}>
                      <TableCell className="data-value text-xs">{new Date(a.triggered_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-aqua-deep">{a.station_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(a.severity)}
                          {a.alert_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs italic">{a.alert_message}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${a.severity === 'Critical' ? 'border-warm-deep text-warm-deep bg-warm-deep/5' : ''}
                          ${a.severity === 'High' ? 'border-warm-mid text-warm-mid bg-warm-mid/5' : ''}
                          ${a.severity === 'Medium' ? 'border-aqua-deep text-aqua-deep bg-aqua-deep/5' : ''}
                        `}>
                          {a.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.is_resolved ? (
                          <span className="text-nature-mid flex items-center gap-1 text-xs font-bold">
                            <CheckCircle2 size={12} /> RESOLVED
                          </span>
                        ) : (
                          <span className="text-warm-deep flex items-center gap-1 text-xs font-bold animate-pulse">
                            <Activity size={12} /> ACTIVE
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!a.is_resolved && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] font-mono border-aqua-dark/20 text-aqua-deep hover:bg-aqua-deep hover:text-white"
                            onClick={() => resolveAlert(a.alert_id)}
                          >
                            RESOLVE_ID_{a.alert_id}
                          </Button>
                        )}
                      </TableCell>
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
