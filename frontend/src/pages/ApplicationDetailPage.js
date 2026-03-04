import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Building2, DollarSign, Users, Database, User, Mail,
  Edit2, Save, X, Send, ChevronRight, TrendingUp, TrendingDown, Info,
  Sparkles, AlertTriangle, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
import { useTheme } from '../context/ThemeContext';

// Theme-aware chart colors
const getChartColors = (theme) => ({
  grid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  tick: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)',
});
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatCurrencyShort = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const generateYoYData = (app) => {
  const currentSpend = app?.contract_annual_spend || 0;
  const prevSpend = app?.prev_fiscal_year_expense_total || currentSpend * 0.9;
  const currentUsers = app?.engaged_users || 0;
  
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const baseSpend = prevSpend * 0.7 || 10000;
  const baseUsers = Math.floor(currentUsers * 0.5) || 10;
  
  return years.map((year, index) => {
    const growthFactor = 1 + (index * 0.15) + (Math.random() * 0.1 - 0.05);
    const userGrowth = 1 + (index * 0.2) + (Math.random() * 0.15 - 0.075);
    
    return {
      year,
      spend: Math.round(baseSpend * growthFactor),
      users: Math.round(baseUsers * userGrowth),
    };
  });
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-theme-primary font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ApplicationDetailPage = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [requests, setRequests] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [yoyData, setYoyData] = useState([]);
  
  // AI Capability Scanner state
  const [scanningCapabilities, setScanningCapabilities] = useState(false);
  const [capabilityScanResult, setCapabilityScanResult] = useState(null);
  
  const [requestForm, setRequestForm] = useState({
    request_type: 'Owner Info',
    to_role: 'Product Owner',
    to_name: '',
    to_email: '',
    message: '',
    priority: 'Medium'
  });

  useEffect(() => {
    fetchApplication();
    fetchRequests();
  }, [appId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/applications/${appId}`);
      setApp(res.data);
      setEditForm(res.data);
      setYoyData(generateYoYData(res.data));
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load application');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/requests?app_id=${appId}`);
      setRequests(res.data.requests);
    } catch (error) {
      console.error('Fetch requests error:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/applications/${appId}`, editForm);
      setApp(editForm);
      setEditing(false);
      toast.success('Application updated');
    } catch (error) {
      toast.error('Failed to update application');
    }
  };

  const handleScanCapabilities = async () => {
    setScanningCapabilities(true);
    setCapabilityScanResult(null);
    
    try {
      const res = await axios.post(`${API}/ai/scan-capabilities`, { app_id: appId });
      setCapabilityScanResult(res.data);
      if (res.data.overlapping_apps?.length > 0) {
        toast.success(`Found ${res.data.overlapping_apps.length} potentially overlapping apps`);
      } else {
        toast.info('No significant overlaps detected');
      }
    } catch (error) {
      console.error('Capability scan error:', error);
      toast.error(error.response?.data?.detail || 'Failed to scan capabilities');
    } finally {
      setScanningCapabilities(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      await axios.post(`${API}/requests`, {
        app_id: appId,
        ...requestForm
      });
      toast.success('Request created');
      setRequestModalOpen(false);
      setRequestForm({
        request_type: 'Owner Info',
        to_role: 'Product Owner',
        to_name: '',
        to_email: '',
        message: '',
        priority: 'Medium'
      });
      fetchRequests();
    } catch (error) {
      toast.error('Failed to create request');
    }
  };

  const openRequestModal = () => {
    const contactMap = {
      'Product Owner': app?.product_owner_name,
      'Data Steward': app?.data_steward_name,
      'IT Contact': app?.it_contact,
      'Security Contact': app?.security_contact
    };
    setRequestForm({
      ...requestForm,
      to_name: contactMap[requestForm.to_role] || ''
    });
    setRequestModalOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'badge-green';
      case 'deprecated': case 'retired': return 'badge-red';
      case 'under_review': case 'in_review': return 'badge-amber';
      default: return 'bg-[var(--glass-highlight)] text-theme-muted border-[var(--glass-border)]';
    }
  };

  const getDeploymentBadgeClass = (type) => {
    switch (type) {
      case 'Cloud': return 'badge-green';
      case 'On-Prem': return 'badge-blue';
      case 'Hybrid': return 'bg-purple-500/15 border-purple-500/30 text-purple-500';
      default: return 'bg-[var(--glass-highlight)] text-theme-faint border-[var(--glass-border)]';
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'badge-green';
      case 'Sent': return 'badge-blue';
      case 'Awaiting Response': return 'badge-amber';
      default: return 'bg-[var(--glass-highlight)] text-theme-muted';
    }
  };

  const calculateYoYChange = () => {
    if (yoyData.length < 2) return { spend: 0, users: 0 };
    const current = yoyData[yoyData.length - 1];
    const previous = yoyData[yoyData.length - 2];
    return {
      spend: previous.spend > 0 ? ((current.spend - previous.spend) / previous.spend * 100).toFixed(1) : 0,
      users: previous.users > 0 ? ((current.users - previous.users) / previous.users * 100).toFixed(1) : 0
    };
  };

  const yoyChange = calculateYoYChange();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-theme-muted flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          Loading application...
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-fit -ml-2 text-theme-muted hover:text-theme-primary hover:bg-[var(--glass-highlight)]"
          onClick={() => navigate('/inventory')}
          data-testid="back-to-inventory"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-theme-primary">
                  {app.title}
                </h1>
                <Badge className={`capitalize ${getStatusBadgeClass(app.status)}`}>
                  {app.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-theme-muted">
                <span>{app.vendor || 'Unknown Vendor'}</span>
                <span>•</span>
                <Badge className={getDeploymentBadgeClass(app.deployment_type)}>
                  {app.deployment_type || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setEditing(false); setEditForm(app); }} 
                  data-testid="cancel-edit"
                  className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  data-testid="save-edit"
                  className="bg-green-600 hover:bg-green-500 text-white font-medium"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(true)} 
                  data-testid="edit-app"
                  className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)]"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  onClick={openRequestModal} 
                  data-testid="request-info-btn"
                  className="bg-[var(--glass-bg)] hover:bg-[var(--glass-highlight)] text-theme-primary border border-[var(--glass-border)]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Info
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[var(--glass-highlight)] border border-[var(--glass-border)] p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-trends">YoY Trends</TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-usage">Usage</TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-financials">Financials</TabsTrigger>
          <TabsTrigger value="ownership" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-ownership">Ownership</TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-[var(--glass-bg)] data-[state=active]:text-theme-primary text-theme-muted" data-testid="tab-requests">Requests ({requests.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4">General Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-theme-muted text-xs">Description</Label>
                  {editing ? (
                    <Textarea 
                      value={editForm.short_description || ''} 
                      onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })} 
                      className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" 
                    />
                  ) : (
                    <p className="text-theme-secondary mt-1 text-sm">{app.short_description || 'No description available'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-theme-muted text-xs">Capabilities</Label>
                  {editing ? (
                    <Textarea 
                      value={editForm.capabilities || ''} 
                      onChange={(e) => setEditForm({ ...editForm, capabilities: e.target.value })} 
                      className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" 
                    />
                  ) : (
                    <p className="text-theme-secondary mt-1 text-sm">{app.capabilities || 'No capabilities listed'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-theme-muted text-xs">Functional Category</Label>
                  {editing ? (
                    <Input 
                      value={editForm.functional_category || ''} 
                      onChange={(e) => setEditForm({ ...editForm, functional_category: e.target.value })} 
                      className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" 
                    />
                  ) : (
                    <p className="text-theme-secondary mt-1">{app.functional_category || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-theme-muted text-xs">Cost Center</Label>
                  {editing ? (
                    <Input 
                      value={editForm.cost_center_primary || ''} 
                      onChange={(e) => setEditForm({ ...editForm, cost_center_primary: e.target.value })} 
                      className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" 
                    />
                  ) : (
                    <p className="text-theme-secondary mt-1">{app.cost_center_primary || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-500/70">Annual Spend</p>
                  <p className="text-xl font-heading font-bold text-theme-primary mt-1">{formatCurrency(app.contract_annual_spend)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                  <p className="text-sm text-theme-muted">YTD Expense</p>
                  <p className="text-xl font-heading font-bold text-theme-primary mt-1">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                  <p className="text-sm text-theme-muted">Engaged Users</p>
                  <p className="text-xl font-heading font-bold text-theme-primary mt-1">{app.engaged_users || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                  <p className="text-sm text-theme-muted">Provisioned</p>
                  <p className="text-xl font-heading font-bold text-theme-primary mt-1">{app.provisioned_users || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Capability Scanner */}
          <div className="ai-analysis-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-theme-primary">AI Capability Scanner</h3>
                  <p className="text-xs text-theme-muted">Find applications with overlapping capabilities</p>
                </div>
              </div>
              <Button
                onClick={handleScanCapabilities}
                disabled={scanningCapabilities}
                data-testid="scan-capabilities-btn"
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
              >
                {scanningCapabilities ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Scan for Overlaps
                  </>
                )}
              </Button>
            </div>

            {capabilityScanResult && (
              <div className="mt-4 space-y-4">
                {/* Analysis Summary */}
                <div className="p-3 rounded-lg bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                  <p className="text-sm text-theme-secondary">
                    <strong className="text-purple-400">AI Analysis:</strong> {capabilityScanResult.analysis_summary}
                  </p>
                </div>

                {/* Overlapping Apps */}
                {capabilityScanResult.overlapping_apps?.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-theme-primary flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      {capabilityScanResult.overlapping_apps.length} Potentially Overlapping Applications
                    </p>
                    <div className="space-y-2">
                      {capabilityScanResult.overlapping_apps.map((overlap, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-[var(--glass-highlight)] border border-[var(--glass-border)] hover:border-purple-500/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/applications/${overlap.app_id}`)}
                          data-testid={`overlap-app-${idx}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-theme-primary">{overlap.title}</span>
                                <Badge className={`text-xs ${
                                  overlap.overlap_score >= 70 ? 'badge-red' :
                                  overlap.overlap_score >= 50 ? 'badge-amber' :
                                  'badge-blue'
                                }`}>
                                  {overlap.overlap_score}% match
                                </Badge>
                              </div>
                              {overlap.vendor && (
                                <p className="text-xs text-theme-muted mt-1">{overlap.vendor}</p>
                              )}
                              <p className="text-sm text-theme-secondary mt-2">{overlap.similarity_reason}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-theme-faint flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-theme-muted text-center py-4">
                    No significant capability overlaps detected with other applications.
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* YoY Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="glass-card p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/10 to-transparent">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-theme-secondary">
                Year-over-year trend data shown below is generated for demonstration purposes. 
                Actual historical data would come from your data source.
              </p>
            </div>
          </div>

          {/* YoY Change Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-muted">Spend YoY Change</p>
                  <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                    {yoyChange.spend > 0 ? '+' : ''}{yoyChange.spend}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(yoyChange.spend) > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  {parseFloat(yoyChange.spend) > 0 ? (
                    <TrendingUp className="w-6 h-6 text-red-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-green-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-theme-faint mt-2">vs. previous year</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-muted">Users YoY Change</p>
                  <p className="text-3xl font-heading font-bold text-theme-primary mt-1">
                    {yoyChange.users > 0 ? '+' : ''}{yoyChange.users}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(yoyChange.users) > 0 ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                  {parseFloat(yoyChange.users) > 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-amber-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-theme-faint mt-2">vs. previous year</p>
            </div>
          </div>

          {/* Spend Trend Chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-heading font-semibold text-theme-primary">Spend Trend (5 Year)</h3>
              <p className="text-xs text-theme-muted mt-1">Annual contract spend over time</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Line 
                    type="monotone" 
                    dataKey="spend" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Annual Spend"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Users Trend Chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-heading font-semibold text-theme-primary">User Engagement Trend (5 Year)</h3>
              <p className="text-xs text-theme-muted mt-1">Engaged users over time</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#60a5fa" 
                    strokeWidth={3}
                    dot={{ fill: '#60a5fa', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Engaged Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-theme-primary mb-2">Usage Metrics</h3>
            <p className="text-xs text-theme-muted mb-6">User engagement and access statistics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Engaged Users', field: 'engaged_users', color: 'green' },
                { label: 'Provisioned Users', field: 'provisioned_users', color: 'blue' },
                { label: 'SSO Access', field: 'users_with_sso_access', color: 'purple' },
                { label: 'SSO Logins', field: 'users_logging_in_via_sso', color: 'pink' },
              ].map(({ label, field, color }) => (
                <div key={field} className={`text-center p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
                  <Users className={`w-8 h-8 mx-auto mb-2 text-${color}-400`} />
                  <p className="text-3xl font-heading font-bold text-theme-primary">
                    {editing ? (
                      <Input
                        type="number"
                        value={editForm[field] || 0}
                        onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                        className="text-center bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary"
                      />
                    ) : (
                      app[field] || 0
                    )}
                  </p>
                  <p className="text-sm text-theme-muted mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-theme-primary mb-2">Financial Information</h3>
            <p className="text-xs text-theme-muted mb-6">Spend and expense tracking</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-sm text-green-400/70 mb-1">Contract Annual Spend</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.contract_annual_spend || 0} 
                    onChange={(e) => setEditForm({ ...editForm, contract_annual_spend: parseFloat(e.target.value) || 0 })} 
                    className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-theme-primary">{formatCurrency(app.contract_annual_spend)}</p>
                )}
              </div>
              <div className="p-6 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                <DollarSign className="w-8 h-8 text-theme-muted mb-2" />
                <p className="text-sm text-theme-muted mb-1">Fiscal YTD Expense</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.fiscal_ytd_expense_total || 0} 
                    onChange={(e) => setEditForm({ ...editForm, fiscal_ytd_expense_total: parseFloat(e.target.value) || 0 })} 
                    className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-theme-primary">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                )}
              </div>
              <div className="p-6 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                <DollarSign className="w-8 h-8 text-theme-muted mb-2" />
                <p className="text-sm text-theme-muted mb-1">Prev Fiscal Year</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.prev_fiscal_year_expense_total || 0} 
                    onChange={(e) => setEditForm({ ...editForm, prev_fiscal_year_expense_total: parseFloat(e.target.value) || 0 })} 
                    className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-theme-primary">{formatCurrency(app.prev_fiscal_year_expense_total)}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Ownership Tab */}
        <TabsContent value="ownership">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-theme-primary mb-2">Ownership & Contacts</h3>
            <p className="text-xs text-theme-muted mb-6">Application stakeholders and contact information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Product Owner', field: 'product_owner_name', icon: User },
                { label: 'Data Steward', field: 'data_steward_name', icon: Database },
                { label: 'IT Contact', field: 'it_contact', icon: User },
                { label: 'Security Contact', field: 'security_contact', icon: User },
                { label: 'Vendor Contact', field: 'vendor_contact', icon: User },
                { label: 'General Contact', field: 'general_contact', icon: User },
              ].map(({ label, field, icon: Icon }) => (
                <div key={field} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]">
                  <Icon className="w-5 h-5 text-theme-faint mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-theme-faint text-xs">{label}</Label>
                    {editing ? (
                      <Input 
                        value={editForm[field] || ''} 
                        onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} 
                        className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" 
                        placeholder={`Enter ${label.toLowerCase()}`} 
                      />
                    ) : (
                      <p className="text-theme-secondary text-sm mt-1">{app[field] || 'Not assigned'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-heading font-semibold text-theme-primary">Information Requests</h3>
                <p className="text-xs text-theme-muted mt-1">Track requests for this application</p>
              </div>
              <Button 
                size="sm" 
                onClick={openRequestModal} 
                data-testid="create-request-btn"
                className="bg-[var(--glass-bg)] hover:bg-[var(--glass-highlight)] text-theme-primary border border-[var(--glass-border)]"
              >
                <Mail className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
            <div className="p-6">
              {requests.length === 0 ? (
                <p className="text-theme-faint text-center py-8">No requests yet</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.request_id} 
                      className="flex items-start gap-4 p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] cursor-pointer transition-colors"
                      onClick={() => navigate(`/requests?id=${req.request_id}`)}
                      data-testid={`request-item-${req.request_id}`}
                    >
                      <Mail className="w-5 h-5 text-theme-faint mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-theme-primary">{req.request_type}</span>
                          <Badge className={`text-xs ${getRequestStatusColor(req.status)}`}>{req.status}</Badge>
                          <Badge className="text-xs bg-[var(--glass-highlight)] text-theme-muted capitalize">{req.priority}</Badge>
                        </div>
                        <p className="text-sm text-theme-muted mt-1 truncate">{req.message}</p>
                        <p className="text-xs text-theme-faint mt-1">To: {req.to_role} {req.to_name && `(${req.to_name})`}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-theme-faint" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
          <DialogHeader>
            <DialogTitle className="text-theme-primary">Request Information</DialogTitle>
            <DialogDescription className="text-theme-muted">
              Send a request to the appropriate stakeholder for {app.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-theme-secondary">Request Type</Label>
                <Select value={requestForm.request_type} onValueChange={(v) => setRequestForm({ ...requestForm, request_type: v })}>
                  <SelectTrigger className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" data-testid="request-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
                    <SelectItem value="Owner Info">Owner Info</SelectItem>
                    <SelectItem value="Data Sources">Data Sources</SelectItem>
                    <SelectItem value="Usage Validation">Usage Validation</SelectItem>
                    <SelectItem value="Cost Validation">Cost Validation</SelectItem>
                    <SelectItem value="Security Review">Security Review</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-theme-secondary">Priority</Label>
                <Select value={requestForm.priority} onValueChange={(v) => setRequestForm({ ...requestForm, priority: v })}>
                  <SelectTrigger className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" data-testid="request-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-theme-secondary">To Role</Label>
              <Select value={requestForm.to_role} onValueChange={(v) => {
                const contactMap = { 'Product Owner': app?.product_owner_name, 'Data Steward': app?.data_steward_name, 'IT Contact': app?.it_contact, 'Security Contact': app?.security_contact };
                setRequestForm({ ...requestForm, to_role: v, to_name: contactMap[v] || '' });
              }}>
                <SelectTrigger className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary" data-testid="request-role-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
                  <SelectItem value="Product Owner">Product Owner</SelectItem>
                  <SelectItem value="Data Steward">Data Steward</SelectItem>
                  <SelectItem value="IT Contact">IT Contact</SelectItem>
                  <SelectItem value="Security Contact">Security Contact</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-theme-secondary">Contact Name</Label>
                <Input 
                  value={requestForm.to_name} 
                  onChange={(e) => setRequestForm({ ...requestForm, to_name: e.target.value })} 
                  placeholder="Name" 
                  className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                  data-testid="request-contact-name" 
                />
              </div>
              <div>
                <Label className="text-theme-secondary">Email (optional)</Label>
                <Input 
                  type="email" 
                  value={requestForm.to_email} 
                  onChange={(e) => setRequestForm({ ...requestForm, to_email: e.target.value })} 
                  placeholder="email@company.com" 
                  className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                  data-testid="request-contact-email" 
                />
              </div>
            </div>

            <div>
              <Label className="text-theme-secondary">Message *</Label>
              <Textarea 
                value={requestForm.message} 
                onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })} 
                placeholder="Describe what information you need..." 
                className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                rows={4} 
                data-testid="request-message" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRequestModalOpen(false)}
              className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest} 
              data-testid="submit-request-btn"
              className="bg-green-600 hover:bg-green-500 text-white font-medium"
            >
              <Send className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationDetailPage;
