import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Building2, DollarSign, Users, Cloud, Server, HelpCircle, TrendingUp,
  AlertTriangle, Search, Filter, RefreshCw, ChevronRight, Layers
} from 'lucide-react';
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
import { useTheme } from '../context/ThemeContext';

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

const CHART_COLORS = ['#22c55e', '#60a5fa', '#fbbf24', '#818cf8', '#14b8a6'];

// Theme-aware chart colors
const getChartColors = (theme) => ({
  grid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  tick: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)',
  labelLine: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
});

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-theme-primary font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [spendByCategory, setSpendByCategory] = useState([]);
  const [appsByCategory, setAppsByCategory] = useState([]);
  const [spendByCostCenter, setSpendByCostCenter] = useState([]);
  const [highSpendLowEngagement, setHighSpendLowEngagement] = useState([]);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    functional_category: '',
    cost_center: '',
    vendor: ''
  });
  const [spendThreshold, setSpendThreshold] = useState([50000]);
  const [engagementThreshold, setEngagementThreshold] = useState([100]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const [kpiRes, spendCatRes, appsCatRes, spendCCRes, hsleRes, summaryRes, filtersRes] = await Promise.all([
        axios.get(`${API}/dashboard/kpis?${queryParams}`),
        axios.get(`${API}/dashboard/spend-by-category`),
        axios.get(`${API}/dashboard/apps-by-category`),
        axios.get(`${API}/dashboard/spend-by-cost-center`),
        axios.get(`${API}/dashboard/high-spend-low-engagement?spend_threshold=${spendThreshold[0]}&engagement_threshold=${engagementThreshold[0]}`),
        axios.get(`${API}/dashboard/executive-summary`),
        axios.get(`${API}/filters/options`)
      ]);

      setKpis(kpiRes.data);
      setSpendByCategory(spendCatRes.data);
      setAppsByCategory(appsCatRes.data);
      setSpendByCostCenter(spendCCRes.data);
      setHighSpendLowEngagement(hsleRes.data);
      setExecutiveSummary(summaryRes.data);
      setFilterOptions(filtersRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters, spendThreshold, engagementThreshold]);

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
      cost_center: '',
      vendor: ''
    });
  };

  const handleCategoryClick = (category) => {
    navigate(`/inventory?category=${encodeURIComponent(category)}`);
  };

  const handleCostCenterClick = (costCenter) => {
    navigate(`/inventory?cost_center=${encodeURIComponent(costCenter)}`);
  };

  const handleDeploymentClick = (deploymentType) => {
    navigate(`/inventory?deployment_type=${encodeURIComponent(deploymentType)}`);
  };

  const handleBarClick = (data, chartType) => {
    if (chartType === 'category') {
      handleCategoryClick(data.category);
    } else if (chartType === 'costCenter') {
      handleCostCenterClick(data.cost_center);
    }
  };

  const deploymentData = kpis?.deployment_breakdown ? 
    Object.entries(kpis.deployment_breakdown)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value })) 
    : [];

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-muted flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-theme-primary">
            Executive Dashboard
          </h1>
          <p className="text-theme-muted mt-1">Systems inventory overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData} 
            data-testid="refresh-btn"
            className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)] hover:text-theme-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {(!kpis || kpis.total_apps === 0) && (
            <Button 
              size="sm" 
              onClick={seedData} 
              data-testid="seed-btn"
              className="bg-green-500 hover:bg-green-400 text-zinc-900 font-medium"
            >
              Generate Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-faint" />
            <Input
              placeholder="Search apps or vendors..."
              className="pl-9 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint focus:border-green-500/50"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-filter"
            />
          </div>
          
          <Select value={filters.functional_category} onValueChange={(v) => setFilters({ ...filters, functional_category: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[180px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Categories</SelectItem>
              {filterOptions.categories?.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[140px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Status</SelectItem>
              {filterOptions.statuses?.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            data-testid="clear-filters"
            className="text-theme-muted hover:text-theme-primary hover:bg-[var(--glass-highlight)]"
          >
            <Filter className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      {executiveSummary && (
        <div className="glass-card p-4 border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-theme-secondary leading-relaxed" data-testid="executive-summary">
              {executiveSummary.summary}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card" data-testid="kpi-total-apps">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-theme-muted">Total Applications</p>
              <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                {formatNumber(kpis?.total_apps || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--glass-highlight)] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-theme-muted" />
            </div>
          </div>
        </div>

        <div className="kpi-card-accent" data-testid="kpi-total-spend">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-green-400/70">Contract Annual Spend</p>
              <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                {formatCurrency(kpis?.total_contract_spend || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="kpi-card" data-testid="kpi-ytd-expense">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-theme-muted">Fiscal YTD Expense</p>
              <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                {formatCurrency(kpis?.total_ytd_expense || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--glass-highlight)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-theme-muted" />
            </div>
          </div>
        </div>

        <div className="kpi-card" data-testid="kpi-engaged-users">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-theme-muted">Engaged Users</p>
              <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                {formatNumber(kpis?.total_engaged_users || 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--glass-highlight)] flex items-center justify-center">
              <Users className="w-5 h-5 text-theme-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Breakdown - Clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cloud', value: kpis?.deployment_breakdown?.Cloud || 0, icon: Cloud, color: 'lime' },
          { label: 'On-Prem', value: kpis?.deployment_breakdown?.['On-Prem'] || 0, icon: Server, color: 'blue' },
          { label: 'Hybrid', value: kpis?.deployment_breakdown?.Hybrid || 0, icon: Layers, color: 'purple' },
          { label: 'Unknown', value: kpis?.deployment_breakdown?.Unknown || 0, icon: HelpCircle, color: 'gray' },
        ].map(item => (
          <div 
            key={item.label} 
            className="glass-card-hover p-4 cursor-pointer"
            onClick={() => handleDeploymentClick(item.label)}
            data-testid={`deployment-${item.label.toLowerCase()}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.color === 'lime' ? 'bg-green-500/20 text-green-400' :
                item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                item.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                'bg-[var(--glass-highlight)] text-theme-muted'
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-theme-primary">{item.value}</p>
                <p className="text-xs text-theme-muted">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category - Clickable */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-heading font-semibold text-theme-primary">Spend by Category</h3>
            <p className="text-xs text-theme-muted mt-1">Click a bar to view applications</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: chartColors.tick }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: chartColors.tick }} width={100} />
                <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                <Bar 
                  dataKey="total_spend" 
                  fill="#22c55e" 
                  radius={[0, 6, 6, 0]} 
                  cursor="pointer"
                  onClick={(data) => handleBarClick(data, 'category')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deployment Pie Chart - Clickable */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-heading font-semibold text-theme-primary">Deployment Distribution</h3>
            <p className="text-xs text-theme-muted mt-1">Click a segment to filter</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deploymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: chartColors.labelLine }}
                  cursor="pointer"
                  onClick={(data) => handleDeploymentClick(data.name)}
                >
                  {deploymentData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Apps by Category - Clickable */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-heading font-semibold text-theme-primary">Apps by Category</h3>
            <p className="text-xs text-theme-muted mt-1">Click a bar to view applications</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appsByCategory} margin={{ left: 20, right: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, angle: -45, textAnchor: 'end', fill: chartColors.tick }} 
                  interval={0}
                  height={80}
                />
                <YAxis tick={{ fontSize: 11, fill: chartColors.tick }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#60a5fa" 
                  radius={[6, 6, 0, 0]} 
                  cursor="pointer"
                  onClick={(data) => handleBarClick(data, 'category')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Cost Center - Clickable */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-heading font-semibold text-theme-primary">Spend by Cost Center</h3>
            <p className="text-xs text-theme-muted mt-1">Click a bar to view applications</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByCostCenter} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: chartColors.tick }} />
                <YAxis dataKey="cost_center" type="category" tick={{ fontSize: 11, fill: chartColors.tick }} width={100} />
                <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                <Bar 
                  dataKey="total_spend" 
                  fill="#14b8a6" 
                  radius={[0, 6, 6, 0]} 
                  cursor="pointer"
                  onClick={(data) => handleBarClick(data, 'costCenter')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High Spend / Low Engagement Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--glass-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-heading font-semibold text-theme-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                High Spend / Low Engagement
              </h3>
              <p className="text-xs text-theme-muted mt-1">Applications needing review</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-theme-muted whitespace-nowrap">Spend &gt;</span>
                <div className="w-32">
                  <Slider
                    value={spendThreshold}
                    onValueChange={setSpendThreshold}
                    min={10000}
                    max={500000}
                    step={10000}
                    className="[&_[role=slider]]:bg-green-400"
                  />
                </div>
                <span className="text-green-400 font-medium">{formatCurrency(spendThreshold[0])}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-theme-muted whitespace-nowrap">Users &lt;</span>
                <div className="w-32">
                  <Slider
                    value={engagementThreshold}
                    onValueChange={setEngagementThreshold}
                    min={10}
                    max={500}
                    step={10}
                    className="[&_[role=slider]]:bg-green-400"
                  />
                </div>
                <span className="text-green-400 font-medium">{engagementThreshold[0]}</span>
              </div>
            </div>
          </div>
        </div>
        
        {highSpendLowEngagement.length === 0 ? (
          <p className="text-theme-muted text-center py-8">No applications match the current thresholds</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header border-b-2 border-[var(--glass-border)]">
                  <th className="text-left p-4">Application</th>
                  <th className="text-left p-4">Vendor</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-right p-4">Annual Spend</th>
                  <th className="text-right p-4">Engaged Users</th>
                  <th className="text-center p-4">Deployment</th>
                  <th className="text-center p-4"></th>
                </tr>
              </thead>
              <tbody>
                {highSpendLowEngagement.map((app) => (
                  <tr 
                    key={app.app_id} 
                    className="table-row-bordered hover:bg-[var(--glass-highlight)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/applications/${app.app_id}`)}
                    data-testid={`hsle-row-${app.app_id}`}
                  >
                    <td className="p-4">
                      <p className="font-medium text-theme-primary">{app.title}</p>
                    </td>
                    <td className="p-4 text-theme-secondary">{app.vendor || '-'}</td>
                    <td className="p-4 text-theme-secondary">{app.functional_category || '-'}</td>
                    <td className="p-4 text-right font-mono text-red-400 font-medium">
                      {formatCurrency(app.contract_annual_spend || 0)}
                    </td>
                    <td className="p-4 text-right font-mono text-amber-400">
                      {app.engaged_users || 0}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={`text-xs ${
                        app.deployment_type === 'Cloud' ? 'badge-green' : 
                        app.deployment_type === 'On-Prem' ? 'badge-blue' : 
                        'bg-[var(--glass-bg)] text-theme-muted'
                      }`}>
                        {app.deployment_type}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <ChevronRight className="w-4 h-4 text-theme-faint inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
