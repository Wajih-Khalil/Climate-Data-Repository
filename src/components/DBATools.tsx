import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, Download, Upload, History, PieChart, Box, ShieldCheck, Trash2, Activity, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function DBATools({ user }: { user: any }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [fragmentation, setFragmentation] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [monthlyClimate, setMonthlyClimate] = useState([]);
  const [security, setSecurity] = useState<any>(null);
  const [indexes, setIndexes] = useState([]);
  const [pipelines, setPipelines] = useState<any>({ external: [], queues: [] });
  const [dataQuality, setDataQuality] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pkgResult, setPkgResult] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditRes, fragRes, summaryRes, monthlyRes, secRes, idxRes, extRes, qRes, dqRes] = await Promise.all([
        fetch(`/api/dba/audit?role=${user.role}`),
        fetch('/api/dba/fragmentation'),
        fetch('/api/dba/summary'),
        fetch('/api/dba/monthly-climate'),
        fetch('/api/dba/security'),
        fetch(`/api/dba/indexes?role=${user.role}`),
        fetch(`/api/dba/external-tables?role=${user.role}`),
        fetch(`/api/dba/queues?role=${user.role}`),
        fetch('/api/dba/data-quality')
      ]);
      setAuditLogs(await auditRes.json());
      setFragmentation(await fragRes.json());
      setSummaries(await summaryRes.json());
      setMonthlyClimate(await monthlyRes.json());
      setSecurity(await secRes.json());
      setIndexes(await idxRes.json());
      setPipelines({ 
        external: await extRes.json(), 
        queues: await qRes.json() 
      });
      setDataQuality(await dqRes.json());
    } catch (error) {
      toast.error('Failed to fetch DBA data');
    } finally {
      setLoading(false);
    }
  };

  const callPackage = async (stationId: number, year: number) => {
    try {
      const res = await fetch(`/api/package/avg-temp?station_id=${stationId}&year=${year}`);
      const data = await res.json();
      setPkgResult(data);
      toast.success('PL/SQL Package CDR_PKG.GET_AVG_TEMP called successfully');
    } catch (error) {
      toast.error('Package call failed');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/dba/export', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    }
  };

  const handleLoad = async () => {
    try {
      const res = await fetch('/api/dba/load', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Load failed');
    }
  };

  const handleImport = async () => {
    try {
      const res = await fetch('/api/dba/import', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    }
  };

  const handleDeallocate = async (tableName: string) => {
    try {
      const res = await fetch('/api/dba/deallocate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_name: tableName })
      });
      const data = await res.json();
      toast.success(data.message);
      fetchData();
    } catch (error) {
      toast.error('Deallocation failed');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-ink/5 border border-ink/10">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="auditory">Auditory (Logs)</TabsTrigger>
          <TabsTrigger value="storage">Storage & Allocation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced (OODB/MV)</TabsTrigger>
          <TabsTrigger value="security">Security & Pipelines</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-aqua-dark/20 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-aqua-deep">
                  <ShieldCheck size={18} /> Oracle Feature Status
                </CardTitle>
                <CardDescription>Active simulations of Advanced Oracle features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono opacity-60">VPD_POLICIES</span>
                  <Badge className="bg-nature-mid text-[10px]">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono opacity-60">ADVANCED_QUEUING</span>
                  <Badge className="bg-nature-mid text-[10px]">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono opacity-60">MATERIALIZED_VIEWS</span>
                  <Badge className="bg-nature-mid text-[10px]">COMMITTED</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono opacity-60">FGA_AUDITING</span>
                  <Badge className="bg-nature-mid text-[10px]">LOGGING</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono opacity-60">PL_SQL_PACKAGES</span>
                  <Badge className="bg-nature-mid text-[10px]">READY</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Download size={18} /> Import / Export
                </CardTitle>
                <CardDescription>Oracle Data Pump (expdp/impdp) simulation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-context-gray italic serif">
                  Centralized utility for moving data between Oracle instances.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleExport} className="flex-1 bg-ink text-white">
                    <Download size={16} className="mr-2" /> RUN_EXPDP
                  </Button>
                  <Button onClick={handleImport} variant="outline" className="flex-1 border-ink/10">
                    <Upload size={16} className="mr-2" /> RUN_IMPDP
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Box size={18} /> Extraction / Loader
                </CardTitle>
                <CardDescription>SQL*Loader (sqlldr) and External Tables.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-context-gray italic serif">
                  Bulk data loading from flat files into relational tables.
                </p>
                <Button onClick={handleLoad} className="w-full bg-nature-mid text-white hover:bg-nature-mid/90">
                  <Activity size={16} className="mr-2" /> INITIATE_SQLLDR
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auditory" className="mt-6">
          <Card className="border-ink/10 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck size={18} /> Auditory Log (FGA)
              </CardTitle>
              <CardDescription>Fine-Grained Auditing of DML and System actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-md border border-ink/10">
                <Table>
                  <TableHeader className="bg-ink/5 sticky top-0">
                    <TableRow className="hover:bg-transparent border-ink/10">
                      <TableHead className="col-header text-context-gray">Timestamp</TableHead>
                      <TableHead className="col-header text-context-gray">User</TableHead>
                      <TableHead className="col-header text-context-gray">Action</TableHead>
                      <TableHead className="col-header text-context-gray">Object</TableHead>
                      <TableHead className="col-header text-context-gray">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log: any) => (
                      <TableRow key={log.log_id} className="data-row border-ink/5">
                        <TableCell className="data-value text-[10px]">{log.changed_at}</TableCell>
                        <TableCell className="font-bold text-xs">{log.changed_by}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.table_name}</TableCell>
                        <TableCell className="text-xs italic text-context-gray truncate max-w-[200px]">
                          {log.new_values}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-ink/10 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PieChart size={18} /> Fragmentation & Allocation
                </CardTitle>
                <CardDescription>Space management and segment analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-ink/5">
                    <TableRow className="hover:bg-transparent border-ink/10">
                      <TableHead className="col-header text-context-gray">Table Name</TableHead>
                      <TableHead className="col-header text-context-gray">Allocated (KB)</TableHead>
                      <TableHead className="col-header text-context-gray text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fragmentation.map((f: any) => (
                      <TableRow key={f.table_name} className="data-row border-ink/5">
                        <TableCell className="font-bold">{f.table_name}</TableCell>
                        <TableCell className="data-value">{f.fragmented_size_kb}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleDeallocate(f.table_name)}
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] border-ink/10"
                          >
                            <Trash2 size={12} className="mr-1" /> DEALLOCATE
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity size={18} /> Advanced Indexing
                </CardTitle>
                <CardDescription>B-Tree, Bitmap, and Function-based indexes.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-ink/10">
                        <TableHead className="text-[10px] uppercase">Index Name</TableHead>
                        <TableHead className="text-[10px] uppercase">Type</TableHead>
                        <TableHead className="text-[10px] uppercase">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indexes.map((idx: any, i: number) => (
                        <TableRow key={i} className="border-ink/5">
                          <TableCell className="text-xs font-bold">{idx.name}</TableCell>
                          <TableCell className="text-[10px] font-mono">{idx.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] border-nature-mid text-nature-mid">{idx.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-ink/10 shadow-none bg-white/50 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck size={18} /> Roles & Security
                </CardTitle>
                <CardDescription>Oracle Role-Based Access Control.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase opacity-50">Defined_Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {security?.roles.map((role: string) => (
                      <Badge key={role} className="bg-aqua-deep text-white">{role}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase opacity-50">VPD_Policies</h4>
                  {security?.policies.map((p: any) => (
                    <div key={p.name} className="p-2 rounded bg-aqua-light/20 border border-aqua-dark/10">
                      <p className="text-xs font-bold text-aqua-deep">{p.name}</p>
                      <p className="text-[10px] opacity-60">Target: {p.target} | {p.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none bg-white/50 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Upload size={18} /> External Tables
                </CardTitle>
                <CardDescription>Oracle Loader (sqlldr) status.</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelines.external.map((ext: any) => (
                  <div key={ext.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{ext.name}</span>
                      <Badge className="bg-nature-mid">{ext.status}</Badge>
                    </div>
                    <p className="text-[10px] font-mono opacity-50">LOCATION: {ext.location}</p>
                    <p className="text-[10px] font-mono opacity-50">TYPE: {ext.type}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none bg-white/50 md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity size={18} /> Advanced Queuing
                </CardTitle>
                <CardDescription>Oracle AQ (sensor_data_q).</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelines.queues.map((q: any) => (
                  <div key={q.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{q.name}</span>
                      <Badge className="bg-aqua-deep">{q.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span>QUEUE_DEPTH</span>
                      <span className="font-bold">{q.depth}</span>
                    </div>
                    <div className="w-full bg-aqua-light/30 h-1 rounded-full overflow-hidden">
                      <div className="bg-aqua-deep h-full" style={{ width: `${(q.depth / 10) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-ink/10 shadow-none bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History size={18} /> Summary (Materialized Views)
                </CardTitle>
                <CardDescription>Precomputed annual and monthly summaries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-mono uppercase opacity-50 mb-2">MV_ANNUAL_SUMMARY</h4>
                  <ScrollArea className="h-[150px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-ink/10">
                          <TableHead className="text-[10px] uppercase">Station</TableHead>
                          <TableHead className="text-[10px] uppercase">Year</TableHead>
                          <TableHead className="text-[10px] uppercase">Avg Temp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summaries.map((s: any, i: number) => (
                          <TableRow key={i} className="border-ink/5">
                            <TableCell className="text-xs">ID_{s.station_id}</TableCell>
                            <TableCell className="data-value text-xs">{s.year}</TableCell>
                            <TableCell className="data-value text-xs font-bold">{s.avg_temp.toFixed(1)}°C</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono uppercase opacity-50 mb-2">MV_MONTHLY_CLIMATE</h4>
                  <ScrollArea className="h-[150px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-ink/10">
                          <TableHead className="text-[10px] uppercase">Station</TableHead>
                          <TableHead className="text-[10px] uppercase">Month</TableHead>
                          <TableHead className="text-[10px] uppercase">Avg Temp</TableHead>
                          <TableHead className="text-[10px] uppercase">Rain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyClimate.map((s: any, i: number) => (
                          <TableRow key={i} className="border-ink/5">
                            <TableCell className="text-xs">ID_{s.station_id}</TableCell>
                            <TableCell className="data-value text-xs">{s.month}</TableCell>
                            <TableCell className="data-value text-xs font-bold">{s.avg_temp.toFixed(1)}°C</TableCell>
                            <TableCell className="data-value text-xs">{s.total_rain.toFixed(1)}mm</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-ink/10 shadow-none bg-white/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Database size={18} /> OODB Features
                  </CardTitle>
                  <CardDescription>Object-Oriented Data Modeling.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-ink/5 rounded-md font-mono text-[10px] space-y-1">
                    <p className="text-context-gray">-- Oracle Object Type</p>
                    <p>CREATE TYPE location_typ AS OBJECT (</p>
                    <p className="pl-4">city VARCHAR2(50),</p>
                    <p className="pl-4">country VARCHAR2(50)</p>
                    <p>);</p>
                  </div>
                  <p className="text-xs text-context-gray italic serif">
                    Utilizing Oracle Object-Relational features for complex data structures.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-ink/10 shadow-none bg-white/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck size={18} /> PL/SQL Packages
                  </CardTitle>
                  <CardDescription>Simulated CDR_PKG calls.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => callPackage(1, 2024)} 
                      variant="outline" 
                      className="flex-1 text-xs border-aqua-dark/20"
                    >
                      CALL GET_AVG_TEMP(ID:1, 2024)
                    </Button>
                  </div>
                  {pkgResult && (
                    <div className="p-3 bg-aqua-deep/10 rounded-md border border-aqua-deep/20">
                      <p className="text-[10px] font-mono uppercase opacity-50">Package_Result</p>
                      <p className="text-sm font-bold text-aqua-deep">
                        AVG_TEMP: {pkgResult.avg_temp.toFixed(2)}°C
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="quality" className="mt-6 space-y-6">
          <Card className="border-ink/10 shadow-none bg-white/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-warm-deep">
                <ShieldAlert size={18} /> Data Integrity & Quality Dashboard
              </CardTitle>
              <CardDescription>Flagged anomalies and out-of-range sensor readings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-ink/5">
                  <TableRow className="hover:bg-transparent border-ink/10">
                    <TableHead className="col-header text-context-gray">Station</TableHead>
                    <TableHead className="col-header text-context-gray">Reading Date</TableHead>
                    <TableHead className="col-header text-context-gray">Value</TableHead>
                    <TableHead className="col-header text-context-gray">Anomaly Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataQuality.length > 0 ? dataQuality.map((dq: any, i: number) => (
                    <TableRow key={i} className="data-row border-ink/5">
                      <TableCell className="font-bold">{dq.station_name}</TableCell>
                      <TableCell className="data-value">{dq.reading_date}</TableCell>
                      <TableCell className="data-value text-warm-deep font-bold">
                        {dq.temperature_c > 55 || dq.temperature_c < -20 ? `${dq.temperature_c}°C` : 
                         dq.humidity_pct > 100 || dq.humidity_pct < 0 ? `${dq.humidity_pct}%` : 
                         `${dq.precipitation_mm}mm`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] border-warm-mid text-warm-mid uppercase">
                          {dq.temperature_c > 55 ? 'Extreme Heat' : 
                           dq.temperature_c < -20 ? 'Extreme Cold' : 
                           dq.humidity_pct > 100 || dq.humidity_pct < 0 ? 'Sensor Malfunction' : 
                           'Extreme Precipitation'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-nature-mid font-bold uppercase text-xs">
                        No data quality issues detected in current repository.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
