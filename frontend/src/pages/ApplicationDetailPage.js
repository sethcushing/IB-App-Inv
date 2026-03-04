import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ArrowLeft, Building2, DollarSign, Users, Database, User, Mail,
  Edit2, Save, X, Send, ChevronRight, TrendingUp, TrendingDown, Info
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
        <p className="text-white/90 font-medium">{label}</p>
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
      case 'approved': return 'badge-lime';
      case 'deprecated': case 'retired': return 'badge-red';
      case 'under_review': case 'in_review': return 'badge-amber';
      default: return 'bg-white/10 text-white/50 border-white/10';
    }
  };

  const getDeploymentBadgeClass = (type) => {
    switch (type) {
      case 'Cloud': return 'badge-lime';
      case 'On-Prem': return 'badge-blue';
      case 'Hybrid': return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
      default: return 'bg-white/10 text-white/40 border-white/10';
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'badge-lime';
      case 'Sent': return 'badge-blue';
      case 'Awaiting Response': return 'badge-amber';
      default: return 'bg-white/10 text-white/50';
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
        <div className="text-white/50 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
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
          className="w-fit -ml-2 text-white/50 hover:text-white hover:bg-white/5"
          onClick={() => navigate('/inventory')}
          data-testid="back-to-inventory"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-lime-600 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20 flex-shrink-0">
              <Building2 className="w-7 h-7 text-zinc-900" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                  {app.title}
                </h1>
                <Badge className={`capitalize ${getStatusBadgeClass(app.status)}`}>
                  {app.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
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
                  className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  data-testid="save-edit"
                  className="bg-lime-500 hover:bg-lime-400 text-zinc-900 font-medium"
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
                  className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  onClick={openRequestModal} 
                  data-testid="request-info-btn"
                  className="bg-white/10 hover:bg-white/20 text-white"
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
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-trends">YoY Trends</TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-usage">Usage</TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-financials">Financials</TabsTrigger>
          <TabsTrigger value="ownership" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-ownership">Ownership</TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50" data-testid="tab-requests">Requests ({requests.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-white mb-4">General Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-white/50 text-xs">Description</Label>
                  {editing ? (
                    <Textarea 
                      value={editForm.short_description || ''} 
                      onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })} 
                      className="mt-1 bg-white/5 border-white/10 text-white" 
                    />
                  ) : (
                    <p className="text-white/80 mt-1 text-sm">{app.short_description || 'No description available'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Functional Category</Label>
                  {editing ? (
                    <Input 
                      value={editForm.functional_category || ''} 
                      onChange={(e) => setEditForm({ ...editForm, functional_category: e.target.value })} 
                      className="mt-1 bg-white/5 border-white/10 text-white" 
                    />
                  ) : (
                    <p className="text-white/80 mt-1">{app.functional_category || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Deployment Type</Label>
                  {editing ? (
                    <Select value={editForm.deployment_type || 'Unknown'} onValueChange={(v) => setEditForm({ ...editForm, deployment_type: v })}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="Cloud">Cloud</SelectItem>
                        <SelectItem value="On-Prem">On-Prem</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`mt-1 ${getDeploymentBadgeClass(app.deployment_type)}`}>
                      {app.deployment_type || 'Unknown'}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Cost Center</Label>
                  {editing ? (
                    <Input 
                      value={editForm.cost_center_primary || ''} 
                      onChange={(e) => setEditForm({ ...editForm, cost_center_primary: e.target.value })} 
                      className="mt-1 bg-white/5 border-white/10 text-white" 
                    />
                  ) : (
                    <p className="text-white/80 mt-1">{app.cost_center_primary || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-lime-500/10 border border-lime-500/20">
                  <p className="text-sm text-lime-400/70">Annual Spend</p>
                  <p className="text-xl font-heading font-bold text-white mt-1">{formatCurrency(app.contract_annual_spend)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/50">YTD Expense</p>
                  <p className="text-xl font-heading font-bold text-white mt-1">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/50">Engaged Users</p>
                  <p className="text-xl font-heading font-bold text-white mt-1">{app.engaged_users || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/50">Provisioned</p>
                  <p className="text-xl font-heading font-bold text-white mt-1">{app.provisioned_users || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* YoY Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="glass-card p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/10 to-transparent">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/70">
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
                  <p className="text-sm text-white/50">Spend YoY Change</p>
                  <p className="text-3xl font-heading font-bold text-white mt-1">
                    {yoyChange.spend > 0 ? '+' : ''}{yoyChange.spend}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(yoyChange.spend) > 0 ? 'bg-red-500/20' : 'bg-lime-500/20'}`}>
                  {parseFloat(yoyChange.spend) > 0 ? (
                    <TrendingUp className="w-6 h-6 text-red-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-lime-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-white/30 mt-2">vs. previous year</p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Users YoY Change</p>
                  <p className="text-3xl font-heading font-bold text-white mt-1">
                    {yoyChange.users > 0 ? '+' : ''}{yoyChange.users}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(yoyChange.users) > 0 ? 'bg-lime-500/20' : 'bg-amber-500/20'}`}>
                  {parseFloat(yoyChange.users) > 0 ? (
                    <TrendingUp className="w-6 h-6 text-lime-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-amber-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-white/30 mt-2">vs. previous year</p>
            </div>
          </div>

          {/* Spend Trend Chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-heading font-semibold text-white">Spend Trend (5 Year)</h3>
              <p className="text-xs text-white/40 mt-1">Annual contract spend over time</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Line 
                    type="monotone" 
                    dataKey="spend" 
                    stroke="#a3e635" 
                    strokeWidth={3}
                    dot={{ fill: '#a3e635', strokeWidth: 2, r: 5 }}
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
              <h3 className="text-lg font-heading font-semibold text-white">User Engagement Trend (5 Year)</h3>
              <p className="text-xs text-white/40 mt-1">Engaged users over time</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
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
            <h3 className="text-lg font-heading font-semibold text-white mb-2">Usage Metrics</h3>
            <p className="text-xs text-white/40 mb-6">User engagement and access statistics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Engaged Users', field: 'engaged_users', color: 'lime' },
                { label: 'Provisioned Users', field: 'provisioned_users', color: 'blue' },
                { label: 'SSO Access', field: 'users_with_sso_access', color: 'purple' },
                { label: 'SSO Logins', field: 'users_logging_in_via_sso', color: 'pink' },
              ].map(({ label, field, color }) => (
                <div key={field} className={`text-center p-4 rounded-xl bg-${color === 'lime' ? 'lime' : color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : 'pink'}-500/10 border border-${color === 'lime' ? 'lime' : color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : 'pink'}-500/20`}>
                  <Users className={`w-8 h-8 mx-auto mb-2 text-${color === 'lime' ? 'lime' : color === 'blue' ? 'blue' : color === 'purple' ? 'purple' : 'pink'}-400`} />
                  <p className="text-3xl font-heading font-bold text-white">
                    {editing ? (
                      <Input
                        type="number"
                        value={editForm[field] || 0}
                        onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                        className="text-center bg-white/5 border-white/10 text-white"
                      />
                    ) : (
                      app[field] || 0
                    )}
                  </p>
                  <p className="text-sm text-white/50 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-white mb-2">Financial Information</h3>
            <p className="text-xs text-white/40 mb-6">Spend and expense tracking</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-lime-500/10 border border-lime-500/20">
                <DollarSign className="w-8 h-8 text-lime-400 mb-2" />
                <p className="text-sm text-lime-400/70 mb-1">Contract Annual Spend</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.contract_annual_spend || 0} 
                    onChange={(e) => setEditForm({ ...editForm, contract_annual_spend: parseFloat(e.target.value) || 0 })} 
                    className="bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-white">{formatCurrency(app.contract_annual_spend)}</p>
                )}
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <DollarSign className="w-8 h-8 text-white/50 mb-2" />
                <p className="text-sm text-white/50 mb-1">Fiscal YTD Expense</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.fiscal_ytd_expense_total || 0} 
                    onChange={(e) => setEditForm({ ...editForm, fiscal_ytd_expense_total: parseFloat(e.target.value) || 0 })} 
                    className="bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-white">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                )}
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <DollarSign className="w-8 h-8 text-white/50 mb-2" />
                <p className="text-sm text-white/50 mb-1">Prev Fiscal Year</p>
                {editing ? (
                  <Input 
                    type="number" 
                    value={editForm.prev_fiscal_year_expense_total || 0} 
                    onChange={(e) => setEditForm({ ...editForm, prev_fiscal_year_expense_total: parseFloat(e.target.value) || 0 })} 
                    className="bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-2xl font-heading font-bold text-white">{formatCurrency(app.prev_fiscal_year_expense_total)}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Ownership Tab */}
        <TabsContent value="ownership">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-white mb-2">Ownership & Contacts</h3>
            <p className="text-xs text-white/40 mb-6">Application stakeholders and contact information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Product Owner', field: 'product_owner_name', icon: User },
                { label: 'Data Steward', field: 'data_steward_name', icon: Database },
                { label: 'IT Contact', field: 'it_contact', icon: User },
                { label: 'Security Contact', field: 'security_contact', icon: User },
                { label: 'Vendor Contact', field: 'vendor_contact', icon: User },
                { label: 'General Contact', field: 'general_contact', icon: User },
              ].map(({ label, field, icon: Icon }) => (
                <div key={field} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Icon className="w-5 h-5 text-white/30 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-white/40 text-xs">{label}</Label>
                    {editing ? (
                      <Input 
                        value={editForm[field] || ''} 
                        onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} 
                        className="mt-1 bg-white/5 border-white/10 text-white" 
                        placeholder={`Enter ${label.toLowerCase()}`} 
                      />
                    ) : (
                      <p className="text-white/80 text-sm mt-1">{app[field] || 'Not assigned'}</p>
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
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-heading font-semibold text-white">Information Requests</h3>
                <p className="text-xs text-white/40 mt-1">Track requests for this application</p>
              </div>
              <Button 
                size="sm" 
                onClick={openRequestModal} 
                data-testid="create-request-btn"
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>
            <div className="p-6">
              {requests.length === 0 ? (
                <p className="text-white/40 text-center py-8">No requests yet</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.request_id} 
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => navigate(`/requests?id=${req.request_id}`)}
                      data-testid={`request-item-${req.request_id}`}
                    >
                      <Mail className="w-5 h-5 text-white/30 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{req.request_type}</span>
                          <Badge className={`text-xs ${getRequestStatusColor(req.status)}`}>{req.status}</Badge>
                          <Badge className="text-xs bg-white/10 text-white/50 capitalize">{req.priority}</Badge>
                        </div>
                        <p className="text-sm text-white/50 mt-1 truncate">{req.message}</p>
                        <p className="text-xs text-white/30 mt-1">To: {req.to_role} {req.to_name && `(${req.to_name})`}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30" />
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
        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Request Information</DialogTitle>
            <DialogDescription className="text-white/50">
              Send a request to the appropriate stakeholder for {app.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Request Type</Label>
                <Select value={requestForm.request_type} onValueChange={(v) => setRequestForm({ ...requestForm, request_type: v })}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white" data-testid="request-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
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
                <Label className="text-white/70">Priority</Label>
                <Select value={requestForm.priority} onValueChange={(v) => setRequestForm({ ...requestForm, priority: v })}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white" data-testid="request-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white/70">To Role</Label>
              <Select value={requestForm.to_role} onValueChange={(v) => {
                const contactMap = { 'Product Owner': app?.product_owner_name, 'Data Steward': app?.data_steward_name, 'IT Contact': app?.it_contact, 'Security Contact': app?.security_contact };
                setRequestForm({ ...requestForm, to_role: v, to_name: contactMap[v] || '' });
              }}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white" data-testid="request-role-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
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
                <Label className="text-white/70">Contact Name</Label>
                <Input 
                  value={requestForm.to_name} 
                  onChange={(e) => setRequestForm({ ...requestForm, to_name: e.target.value })} 
                  placeholder="Name" 
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                  data-testid="request-contact-name" 
                />
              </div>
              <div>
                <Label className="text-white/70">Email (optional)</Label>
                <Input 
                  type="email" 
                  value={requestForm.to_email} 
                  onChange={(e) => setRequestForm({ ...requestForm, to_email: e.target.value })} 
                  placeholder="email@company.com" 
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                  data-testid="request-contact-email" 
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70">Message *</Label>
              <Textarea 
                value={requestForm.message} 
                onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })} 
                placeholder="Describe what information you need..." 
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                rows={4} 
                data-testid="request-message" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRequestModalOpen(false)}
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest} 
              data-testid="submit-request-btn"
              className="bg-lime-500 hover:bg-lime-400 text-zinc-900 font-medium"
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
