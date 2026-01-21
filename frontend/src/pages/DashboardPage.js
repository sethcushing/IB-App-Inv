import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Building2, DollarSign, Users, Cloud, Server, HelpCircle, TrendingUp,
  AlertTriangle, Search, Filter, RefreshCw, ChevronRight, Activity, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const CHART_COLORS = ['#84CC16', '#18181B', '#64748B', '#E2E8F0', '#A3E635'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, getDashboardView, getAssignedCostCenters, isAdmin, isManager, isViewer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [spendByCategory, setSpendByCategory] = useState([]);
  const [appsByCategory, setAppsByCategory] = useState([]);
  const [spendByCostCenter, setSpendByCostCenter] = useState([]);
  const [usersByCategory, setUsersByCategory] = useState([]);
  const [highSpendLowEngagement, setHighSpendLowEngagement] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  
  const dashboardView = getDashboardView();
  const assignedCostCenters = getAssignedCostCenters();
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    functional_category: '',
    deployment_type: '',
    cost_center: '',
    vendor: ''
  });
  const [spendThreshold, setSpendThreshold] = useState([50000]);
  const [engagementThreshold, setEngagementThreshold] = useState([100]);

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    if (isAdmin()) return 'Executive Dashboard';
    if (isManager()) return 'IT Management Dashboard';
    return 'Usage Analytics Dashboard';
  };

  const getDashboardSubtitle = () => {
    if (isAdmin()) return 'Full portfolio overview and analytics';
    if (isManager()) {
      return assignedCostCenters.length > 0 
        ? `Managing: ${assignedCostCenters.slice(0, 2).join(', ')}${assignedCostCenters.length > 2 ? ` +${assignedCostCenters.length - 2} more` : ''}`
        : 'Multi-department management view';
    }
    return assignedCostCenters.length > 0 
      ? `Cost Center: ${assignedCostCenters[0]}`
      : 'Department usage metrics';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const [kpiRes, spendCatRes, appsCatRes, spendCCRes, usersCatRes, hsleRes, summaryRes, filtersRes] = await Promise.all([
        axios.get(`${API}/dashboard/kpis?${queryParams}`),
        axios.get(`${API}/dashboard/spend-by-category`),
        axios.get(`${API}/dashboard/apps-by-category`),
        axios.get(`${API}/dashboard/spend-by-cost-center`),
        axios.get(`${API}/dashboard/users-by-category`),
        axios.get(`${API}/dashboard/high-spend-low-engagement?spend_threshold=${spendThreshold[0]}&engagement_threshold=${engagementThreshold[0]}`),
        axios.get(`${API}/dashboard/executive-summary`),
        axios.get(`${API}/filters/options`)
      ]);

      setKpis(kpiRes.data);
      setSpendByCategory(spendCatRes.data);
      setAppsByCategory(appsCatRes.data);
      setSpendByCostCenter(spendCCRes.data);
      setUsersByCategory(usersCatRes.data);
      setHighSpendLowEngagement(hsleRes.data);
      setExecutiveSummary(summaryRes.data);
      setFilterOptions(filtersRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, spendThreshold, engagementThreshold, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const seedData = async () => {
    try {
      await axios.post(`${API}/seed`);
      toast.success('Sample data generated!');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to seed data');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      functional_category: '',
      deployment_type: '',
      cost_center: '',
      vendor: ''
    });
  };

  const deploymentData = kpis?.deployment_breakdown ? 
    Object.entries(kpis.deployment_breakdown)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value })) 
    : [];

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900">
              {getDashboardTitle()}
            </h1>
            <Badge variant="outline" className={`text-xs ${
              isAdmin() ? 'bg-lime-100 text-lime-700 border-lime-300' :
              isManager() ? 'bg-blue-100 text-blue-700 border-blue-300' :
              'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              {user?.role}
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">{getDashboardSubtitle()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {isAdmin() && (!kpis || kpis.total_apps === 0) && (
            <Button size="sm" onClick={seedData} className="bg-lime-500 hover:bg-lime-600 text-zinc-900" data-testid="seed-btn">
              Generate Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search apps or vendors..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                data-testid="search-filter"
              />
            </div>
            
            <Select value={filters.functional_category} onValueChange={(v) => setFilters({ ...filters, functional_category: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-[180px]" data-testid="category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.deployment_type} onValueChange={(v) => setFilters({ ...filters, deployment_type: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-[150px]" data-testid="deployment-filter">
                <SelectValue placeholder="Deployment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.deployment_types?.map(dt => (
                  <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-[140px]" data-testid="status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filterOptions.statuses?.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters">
              <Filter className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      {executiveSummary && (
        <Card className="border-l-4 border-l-lime-500 bg-lime-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-lime-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-700 leading-relaxed" data-testid="executive-summary">
                {executiveSummary.summary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Role-specific */}
      {isViewer() ? (
        /* Analyst View - Usage Focused KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="kpi-card" data-testid="kpi-total-apps">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Applications in Scope</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatNumber(kpis?.total_apps || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card-accent" data-testid="kpi-engaged-users">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Engaged Users</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatNumber(kpis?.total_engaged_users || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-lime-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card" data-testid="kpi-provisioned">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Provisioned Users</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatNumber(executiveSummary?.metrics?.total_provisioned || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card" data-testid="kpi-engagement-rate">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Engagement Rate</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {executiveSummary?.metrics?.total_provisioned > 0 
                    ? `${((kpis?.total_engaged_users || 0) / executiveSummary.metrics.total_provisioned * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Executive & Manager View - Financial KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="kpi-card" data-testid="kpi-total-apps">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Applications</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatNumber(kpis?.total_apps || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card-accent" data-testid="kpi-total-spend">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Contract Annual Spend</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatCurrency(kpis?.total_contract_spend || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-lime-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card" data-testid="kpi-ytd-expense">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Fiscal YTD Expense</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatCurrency(kpis?.total_ytd_expense || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>

          <Card className="kpi-card" data-testid="kpi-engaged-users">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Engaged Users</p>
                <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                  {formatNumber(kpis?.total_engaged_users || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Deployment Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cloud', value: kpis?.deployment_breakdown?.Cloud || 0, icon: Cloud, color: 'bg-lime-100 text-lime-700' },
          { label: 'On-Prem', value: kpis?.deployment_breakdown?.['On-Prem'] || 0, icon: Server, color: 'bg-zinc-100 text-zinc-700' },
          { label: 'Hybrid', value: kpis?.deployment_breakdown?.Hybrid || 0, icon: Building2, color: 'bg-blue-100 text-blue-700' },
          { label: 'Unknown', value: kpis?.deployment_breakdown?.Unknown || 0, icon: HelpCircle, color: 'bg-slate-100 text-slate-500' },
        ].map(item => (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-zinc-900">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Spend by Category</CardTitle>
            <CardDescription>Top 10 categories by annual spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total_spend" fill="#84CC16" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Pie Chart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Deployment Distribution</CardTitle>
            <CardDescription>Cloud vs On-Prem vs Hybrid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deploymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {deploymentData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Apps by Category */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Apps by Category</CardTitle>
            <CardDescription>Application count per category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appsByCategory} margin={{ left: 20, right: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }} 
                    interval={0}
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#18181B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spend by Cost Center */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Spend by Cost Center</CardTitle>
            <CardDescription>Top 10 cost centers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByCostCenter} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="cost_center" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="total_spend" fill="#64748B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Spend / Low Engagement Section */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                High Spend / Low Engagement
              </CardTitle>
              <CardDescription>Applications with high annual spend but low user engagement</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 whitespace-nowrap">Spend &gt;</span>
                <div className="w-32">
                  <Slider
                    value={spendThreshold}
                    onValueChange={setSpendThreshold}
                    min={10000}
                    max={500000}
                    step={10000}
                  />
                </div>
                <span className="text-zinc-900 font-medium">{formatCurrency(spendThreshold[0])}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 whitespace-nowrap">Users &lt;</span>
                <div className="w-32">
                  <Slider
                    value={engagementThreshold}
                    onValueChange={setEngagementThreshold}
                    min={10}
                    max={500}
                    step={10}
                  />
                </div>
                <span className="text-zinc-900 font-medium">{engagementThreshold[0]}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {highSpendLowEngagement.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No applications match the current thresholds</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-3">Application</th>
                    <th className="text-left p-3">Vendor</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Annual Spend</th>
                    <th className="text-right p-3">Engaged Users</th>
                    <th className="text-center p-3">Deployment</th>
                    <th className="text-center p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highSpendLowEngagement.map((app) => (
                    <tr 
                      key={app.app_id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/applications/${app.app_id}`)}
                      data-testid={`hsle-row-${app.app_id}`}
                    >
                      <td className="p-3">
                        <p className="font-medium text-zinc-900">{app.title}</p>
                      </td>
                      <td className="p-3 text-slate-600">{app.vendor || '-'}</td>
                      <td className="p-3 text-slate-600">{app.functional_category || '-'}</td>
                      <td className="p-3 text-right font-mono text-red-600 font-medium">
                        {formatCurrency(app.contract_annual_spend || 0)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-600">
                        {app.engaged_users || 0}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={app.deployment_type === 'Cloud' ? 'default' : 'secondary'} className="text-xs">
                          {app.deployment_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
