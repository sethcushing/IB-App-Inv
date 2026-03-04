import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ArrowLeft, Building2, DollarSign, Users, Database, User, Mail,
  Edit2, Save, X, Send, ChevronRight, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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

// Generate mock YoY data based on current values
const generateYoYData = (app) => {
  const currentSpend = app?.contract_annual_spend || 0;
  const prevSpend = app?.prev_fiscal_year_expense_total || currentSpend * 0.9;
  const currentUsers = app?.engaged_users || 0;
  
  // Generate 5 years of trend data with some variance
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const baseSpend = prevSpend * 0.7;
  const baseUsers = Math.floor(currentUsers * 0.5);
  
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

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'default';
      case 'deprecated': return 'destructive';
      case 'under_review': return 'secondary';
      default: return 'outline';
    }
  };

  const getDeploymentBadgeClass = (type) => {
    switch (type) {
      case 'Cloud': return 'bg-lime-100 text-lime-700';
      case 'On-Prem': return 'bg-zinc-100 text-zinc-700';
      case 'Hybrid': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-lime-100 text-lime-700';
      case 'Sent': return 'bg-blue-100 text-blue-700';
      case 'Awaiting Response': return 'bg-amber-100 text-amber-700';
      case 'Draft': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // Calculate YoY changes
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
        <div className="animate-pulse text-slate-500">Loading application...</div>
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
          className="w-fit -ml-2"
          onClick={() => navigate('/inventory')}
          data-testid="back-to-inventory"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-lime-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900">
                  {app.title}
                </h1>
                <Badge variant={getStatusBadgeVariant(app.status)} className="capitalize">
                  {app.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                <span>{app.vendor || 'Unknown Vendor'}</span>
                <span>•</span>
                <Badge variant="outline" className={getDeploymentBadgeClass(app.deployment_type)}>
                  {app.deployment_type || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditForm(app); }} data-testid="cancel-edit">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-lime-500 hover:bg-lime-600 text-zinc-900" data-testid="save-edit">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="edit-app">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" onClick={openRequestModal} className="bg-zinc-900 hover:bg-zinc-800" data-testid="request-info-btn">
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
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">YoY Trends</TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">Usage</TabsTrigger>
          <TabsTrigger value="financials" data-testid="tab-financials">Financials</TabsTrigger>
          <TabsTrigger value="ownership" data-testid="tab-ownership">Ownership</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">Requests ({requests.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-500">Description</Label>
                  {editing ? (
                    <Textarea value={editForm.short_description || ''} onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="text-zinc-900 mt-1">{app.short_description || 'No description available'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-500">Functional Category</Label>
                  {editing ? (
                    <Input value={editForm.functional_category || ''} onChange={(e) => setEditForm({ ...editForm, functional_category: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="text-zinc-900 mt-1">{app.functional_category || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-500">Deployment Type</Label>
                  {editing ? (
                    <Select value={editForm.deployment_type || 'Unknown'} onValueChange={(v) => setEditForm({ ...editForm, deployment_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cloud">Cloud</SelectItem>
                        <SelectItem value="On-Prem">On-Prem</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={`mt-1 ${getDeploymentBadgeClass(app.deployment_type)}`}>
                      {app.deployment_type || 'Unknown'}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-slate-500">Cost Center</Label>
                  {editing ? (
                    <Input value={editForm.cost_center_primary || ''} onChange={(e) => setEditForm({ ...editForm, cost_center_primary: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="text-zinc-900 mt-1">{app.cost_center_primary || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-lime-50 rounded-lg">
                    <p className="text-sm text-slate-500">Annual Spend</p>
                    <p className="text-xl font-heading font-bold text-zinc-900">{formatCurrency(app.contract_annual_spend)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">YTD Expense</p>
                    <p className="text-xl font-heading font-bold text-zinc-900">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Engaged Users</p>
                    <p className="text-xl font-heading font-bold text-zinc-900">{app.engaged_users || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Provisioned</p>
                    <p className="text-xl font-heading font-bold text-zinc-900">{app.provisioned_users || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* YoY Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="border-l-4 border-l-lime-500">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">
                <strong>Note:</strong> Year-over-year trend data shown below is generated for demonstration purposes. 
                Actual historical data would come from your data source.
              </p>
            </CardContent>
          </Card>

          {/* YoY Change Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Spend YoY Change</p>
                    <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                      {yoyChange.spend > 0 ? '+' : ''}{yoyChange.spend}%
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${parseFloat(yoyChange.spend) > 0 ? 'bg-red-100' : 'bg-lime-100'}`}>
                    {parseFloat(yoyChange.spend) > 0 ? (
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-lime-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">vs. previous year</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Users YoY Change</p>
                    <p className="text-3xl font-heading font-bold text-zinc-900 mt-1">
                      {yoyChange.users > 0 ? '+' : ''}{yoyChange.users}%
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${parseFloat(yoyChange.users) > 0 ? 'bg-lime-100' : 'bg-amber-100'}`}>
                    {parseFloat(yoyChange.users) > 0 ? (
                      <TrendingUp className="w-6 h-6 text-lime-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">vs. previous year</p>
              </CardContent>
            </Card>
          </div>

          {/* Spend Trend Chart */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Spend Trend (5 Year)</CardTitle>
              <CardDescription>Annual contract spend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Line 
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#84CC16" 
                      strokeWidth={3}
                      dot={{ fill: '#84CC16', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Annual Spend"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Users Trend Chart */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-heading">User Engagement Trend (5 Year)</CardTitle>
              <CardDescription>Engaged users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#18181B" 
                      strokeWidth={3}
                      dot={{ fill: '#18181B', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Engaged Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Combined Chart */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Spend vs Users Comparison</CardTitle>
              <CardDescription>Cost efficiency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyData} margin={{ left: 20, right: 60, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value, name) => name === 'Annual Spend' ? formatCurrency(value) : value} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="spend" 
                      stroke="#84CC16" 
                      strokeWidth={2}
                      dot={{ fill: '#84CC16', r: 4 }}
                      name="Annual Spend"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="users" 
                      stroke="#64748B" 
                      strokeWidth={2}
                      dot={{ fill: '#64748B', r: 4 }}
                      name="Engaged Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Metrics</CardTitle>
              <CardDescription>User engagement and access statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Engaged Users', field: 'engaged_users', color: 'lime' },
                  { label: 'Provisioned Users', field: 'provisioned_users', color: 'slate' },
                  { label: 'SSO Access', field: 'users_with_sso_access', color: 'slate' },
                  { label: 'SSO Logins', field: 'users_logging_in_via_sso', color: 'slate' },
                ].map(({ label, field, color }) => (
                  <div key={field} className={`text-center p-4 bg-${color}-50 rounded-lg`}>
                    <Users className={`w-8 h-8 text-${color}-600 mx-auto mb-2`} />
                    <p className="text-3xl font-heading font-bold text-zinc-900">
                      {editing ? (
                        <Input
                          type="number"
                          value={editForm[field] || 0}
                          onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                          className="text-center"
                        />
                      ) : (
                        app[field] || 0
                      )}
                    </p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
              <CardDescription>Spend and expense tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-lime-50 border border-lime-200 rounded-lg">
                  <DollarSign className="w-8 h-8 text-lime-600 mb-2" />
                  <p className="text-sm text-slate-500 mb-1">Contract Annual Spend</p>
                  {editing ? (
                    <Input type="number" value={editForm.contract_annual_spend || 0} onChange={(e) => setEditForm({ ...editForm, contract_annual_spend: parseFloat(e.target.value) || 0 })} />
                  ) : (
                    <p className="text-2xl font-heading font-bold text-zinc-900">{formatCurrency(app.contract_annual_spend)}</p>
                  )}
                </div>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <DollarSign className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 mb-1">Fiscal YTD Expense</p>
                  {editing ? (
                    <Input type="number" value={editForm.fiscal_ytd_expense_total || 0} onChange={(e) => setEditForm({ ...editForm, fiscal_ytd_expense_total: parseFloat(e.target.value) || 0 })} />
                  ) : (
                    <p className="text-2xl font-heading font-bold text-zinc-900">{formatCurrency(app.fiscal_ytd_expense_total)}</p>
                  )}
                </div>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <DollarSign className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 mb-1">Prev Fiscal Year</p>
                  {editing ? (
                    <Input type="number" value={editForm.prev_fiscal_year_expense_total || 0} onChange={(e) => setEditForm({ ...editForm, prev_fiscal_year_expense_total: parseFloat(e.target.value) || 0 })} />
                  ) : (
                    <p className="text-2xl font-heading font-bold text-zinc-900">{formatCurrency(app.prev_fiscal_year_expense_total)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ownership Tab */}
        <TabsContent value="ownership">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ownership & Contacts</CardTitle>
              <CardDescription>Application stakeholders and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Product Owner', field: 'product_owner_name', icon: User },
                  { label: 'Data Steward', field: 'data_steward_name', icon: Database },
                  { label: 'IT Contact', field: 'it_contact', icon: User },
                  { label: 'Security Contact', field: 'security_contact', icon: User },
                  { label: 'Vendor Contact', field: 'vendor_contact', icon: User },
                  { label: 'General Contact', field: 'general_contact', icon: User },
                ].map(({ label, field, icon: Icon }) => (
                  <div key={field} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <Icon className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <Label className="text-slate-500 text-xs">{label}</Label>
                      {editing ? (
                        <Input value={editForm[field] || ''} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} className="mt-1" placeholder={`Enter ${label.toLowerCase()}`} />
                      ) : (
                        <p className="text-zinc-900 text-sm mt-1">{app[field] || 'Not assigned'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Information Requests</CardTitle>
                <CardDescription>Track requests for this application</CardDescription>
              </div>
              <Button size="sm" onClick={openRequestModal} data-testid="create-request-btn">
                <Mail className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No requests yet</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div 
                      key={req.request_id} 
                      className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/requests?id=${req.request_id}`)}
                      data-testid={`request-item-${req.request_id}`}
                    >
                      <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-900">{req.request_type}</span>
                          <Badge className={`text-xs ${getRequestStatusColor(req.status)}`}>{req.status}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{req.priority}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 truncate">{req.message}</p>
                        <p className="text-xs text-slate-400 mt-1">To: {req.to_role} {req.to_name && `(${req.to_name})`}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Information</DialogTitle>
            <DialogDescription>Send a request to the appropriate stakeholder for {app.title}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Request Type</Label>
                <Select value={requestForm.request_type} onValueChange={(v) => setRequestForm({ ...requestForm, request_type: v })}>
                  <SelectTrigger className="mt-1" data-testid="request-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
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
                <Label>Priority</Label>
                <Select value={requestForm.priority} onValueChange={(v) => setRequestForm({ ...requestForm, priority: v })}>
                  <SelectTrigger className="mt-1" data-testid="request-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>To Role</Label>
              <Select value={requestForm.to_role} onValueChange={(v) => {
                const contactMap = { 'Product Owner': app?.product_owner_name, 'Data Steward': app?.data_steward_name, 'IT Contact': app?.it_contact, 'Security Contact': app?.security_contact };
                setRequestForm({ ...requestForm, to_role: v, to_name: contactMap[v] || '' });
              }}>
                <SelectTrigger className="mt-1" data-testid="request-role-select"><SelectValue /></SelectTrigger>
                <SelectContent>
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
                <Label>Contact Name</Label>
                <Input value={requestForm.to_name} onChange={(e) => setRequestForm({ ...requestForm, to_name: e.target.value })} placeholder="Name" className="mt-1" data-testid="request-contact-name" />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" value={requestForm.to_email} onChange={(e) => setRequestForm({ ...requestForm, to_email: e.target.value })} placeholder="email@company.com" className="mt-1" data-testid="request-contact-email" />
              </div>
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea value={requestForm.message} onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })} placeholder="Describe what information you need..." className="mt-1" rows={4} data-testid="request-message" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest} className="bg-zinc-900 hover:bg-zinc-800" data-testid="submit-request-btn">
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
