import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
        toast.success(`Welcome back, ${user.full_name}`);
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-4">
      <Card className="w-full max-w-md border-aqua-dark/20 bg-white/95 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-aqua-deep text-white">
              <Database size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-aqua-deep">CDR_AUTH_GATEWAY</CardTitle>
          <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
            Climate Data Repository | Secure Access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="admin, analyst, or USER" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-aqua-deep hover:bg-aqua-dark text-white font-bold"
              disabled={loading}
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS_SYSTEM'}
            </Button>
          </form>
          <div className="mt-6 p-3 rounded bg-aqua-light/20 border border-aqua-dark/10 flex items-center gap-3">
            <ShieldCheck size={16} className="text-aqua-deep" />
            <p className="text-[10px] text-aqua-dark font-medium uppercase">
              RBAC_ENABLED: Roles determine data modification privileges.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
