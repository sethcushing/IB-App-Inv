import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const LoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'viewer' 
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerForm.email, registerForm.password, registerForm.name, registerForm.role);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { name: 'Executive', email: 'exec@demo.com', role: 'admin' },
    { name: 'IT Manager', email: 'it@demo.com', role: 'manager' },
    { name: 'Analyst', email: 'analyst@demo.com', role: 'viewer' },
  ];

  const quickLogin = async (account) => {
    setLoading(true);
    try {
      // Try to login first, if fails, register
      try {
        await login(account.email, 'demo123');
      } catch {
        await register(account.email, 'demo123', account.name, account.role);
      }
      toast.success(`Welcome, ${account.name}!`);
      navigate('/');
    } catch (error) {
      toast.error('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="text-white font-heading font-bold text-xl">Systems Inventory</span>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-4xl font-heading font-bold text-white leading-tight">
            Executive Dashboard<br />
            <span className="text-lime-400">for IT Portfolio</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Centralized visibility into your application portfolio, spend analytics, and ownership tracking.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="px-4 py-2 bg-white/10 rounded-lg">
              <p className="text-2xl font-heading font-bold text-white">100+</p>
              <p className="text-xs text-slate-400">Applications</p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-lg">
              <p className="text-2xl font-heading font-bold text-lime-400">$12M+</p>
              <p className="text-xs text-slate-400">Annual Spend</p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-lg">
              <p className="text-2xl font-heading font-bold text-white">5K+</p>
              <p className="text-xs text-slate-400">Users Tracked</p>
            </div>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm">© 2024 Systems Inventory Dashboard</p>
      </div>

      {/* Right side - auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-lime-500" />
            </div>
            <span className="text-zinc-900 font-heading font-bold text-xl">Systems Inventory</span>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-heading">Welcome</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        data-testid="login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                          data-testid="login-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-zinc-900 hover:bg-zinc-800"
                      disabled={loading}
                      data-testid="login-submit"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                        data-testid="register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@company.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                        data-testid="register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        minLength={6}
                        data-testid="register-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">Role</Label>
                      <Select 
                        value={registerForm.role} 
                        onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}
                      >
                        <SelectTrigger data-testid="register-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin (Executive)</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="viewer">Viewer (Analyst)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-zinc-900 hover:bg-zinc-800"
                      disabled={loading}
                      data-testid="register-submit"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Quick demo access */}
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-500">Quick demo access</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => quickLogin(account)}
                  disabled={loading}
                  data-testid={`demo-${account.role}`}
                >
                  {account.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
