import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronUp, ChevronDown, ChevronRight, RefreshCw, Plus, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
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
  if (!value) return '-';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const emptyAppForm = {
  title: '',
  vendor: '',
  status: 'under_review',
  functional_category: '',
  deployment_type: 'Unknown',
  short_description: '',
  capabilities: '',
  contract_annual_spend: '',
  fiscal_ytd_expense_total: '',
  engaged_users: '',
  provisioned_users: '',
  cost_center_primary: '',
  product_owner_name: '',
  data_steward_name: '',
  it_contact: '',
  notes: ''
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterOptions, setFilterOptions] = useState({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newAppForm, setNewAppForm] = useState(emptyAppForm);
  const [submitting, setSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    functional_category: searchParams.get('category') || '',
    deployment_type: searchParams.get('deployment_type') || '',
    cost_center: searchParams.get('cost_center') || '',
    vendor: searchParams.get('vendor') || ''
  });
  
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const limit = 25;

  const activeUrlFilter = searchParams.get('category') || searchParams.get('cost_center') || searchParams.get('deployment_type');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        skip: page * limit,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const [appsRes, filtersRes] = await Promise.all([
        axios.get(`${API}/applications?${queryParams}`),
        axios.get(`${API}/filters/options`)
      ]);

      setApplications(appsRes.data.applications);
      setTotal(appsRes.data.total);
      setFilterOptions(filtersRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      functional_category: searchParams.get('category') || '',
      deployment_type: searchParams.get('deployment_type') || '',
      cost_center: searchParams.get('cost_center') || '',
      vendor: searchParams.get('vendor') || ''
    };
    setFilters(newFilters);
  }, [searchParams]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
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
    setSearchParams({});
    setPage(0);
  };

  const handleAddApplication = async () => {
    if (!newAppForm.title.trim()) {
      toast.error('Application title is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newAppForm,
        contract_annual_spend: newAppForm.contract_annual_spend ? parseFloat(newAppForm.contract_annual_spend) : 0,
        fiscal_ytd_expense_total: newAppForm.fiscal_ytd_expense_total ? parseFloat(newAppForm.fiscal_ytd_expense_total) : 0,
        engaged_users: newAppForm.engaged_users ? parseInt(newAppForm.engaged_users) : 0,
        provisioned_users: newAppForm.provisioned_users ? parseInt(newAppForm.provisioned_users) : 0,
      };

      const res = await axios.post(`${API}/applications`, payload);
      toast.success('Application created successfully');
      setAddModalOpen(false);
      setNewAppForm(emptyAppForm);
      navigate(`/applications/${res.data.app_id}`);
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setNewAppForm(emptyAppForm);
    setAddModalOpen(true);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'badge-green';
      case 'deprecated': case 'retired': return 'badge-red';
      case 'under_review': case 'in_review': return 'badge-amber';
      default: return 'bg-[var(--glass-bg)] text-theme-muted border-[var(--glass-border)]';
    }
  };

  const getDeploymentBadgeClass = (type) => {
    switch (type) {
      case 'Cloud': return 'badge-green';
      case 'On-Prem': return 'badge-blue';
      case 'Hybrid': return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
      default: return 'bg-[var(--glass-bg)] text-theme-muted border-[var(--glass-border)]';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
            Application Inventory
          </h1>
          <p className="text-theme-muted mt-1">
            {total} applications {activeUrlFilter ? 'matching filter' : 'in portfolio'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApplications} 
            data-testid="refresh-inventory"
            className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)] hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={openAddModal} 
            data-testid="add-application-btn"
            className="bg-green-500 hover:bg-green-400 text-zinc-900 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Active Filter Banner */}
      {activeUrlFilter && (
        <div className="glass-card p-3 border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-green-400" />
            <span className="text-sm text-theme-secondary">
              Filtered by: <strong className="text-green-400">{activeUrlFilter}</strong>
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            className="text-theme-muted hover:text-theme-primary hover:bg-[var(--glass-highlight)]"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-faint" />
            <Input
              placeholder="Search apps or vendors..."
              className="pl-9 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint focus:border-green-500/50"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }}
              data-testid="inventory-search"
            />
          </div>
          
          <Select value={filters.functional_category} onValueChange={(v) => { setFilters({ ...filters, functional_category: v === 'all' ? '' : v }); setPage(0); }}>
            <SelectTrigger className="w-[180px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="inventory-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Categories</SelectItem>
              {filterOptions.categories?.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.deployment_type} onValueChange={(v) => { setFilters({ ...filters, deployment_type: v === 'all' ? '' : v }); setPage(0); }}>
            <SelectTrigger className="w-[150px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="inventory-deployment-filter">
              <SelectValue placeholder="Deployment" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Types</SelectItem>
              {filterOptions.deployment_types?.map(dt => (
                <SelectItem key={dt} value={dt}>{dt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v === 'all' ? '' : v }); setPage(0); }}>
            <SelectTrigger className="w-[140px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="inventory-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Status</SelectItem>
              {filterOptions.statuses?.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.vendor} onValueChange={(v) => { setFilters({ ...filters, vendor: v === 'all' ? '' : v }); setPage(0); }}>
            <SelectTrigger className="w-[150px] bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary" data-testid="inventory-vendor-filter">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
              <SelectItem value="all">All Vendors</SelectItem>
              {filterOptions.vendors?.slice(0, 20).map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            data-testid="clear-inventory-filters"
            className="text-theme-muted hover:text-theme-primary hover:bg-[var(--glass-highlight)]"
          >
            <Filter className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-theme-muted flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
              Loading applications...
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-theme-muted">No applications found</p>
            <p className="text-sm text-theme-faint mt-1">Try adjusting your filters or import data</p>
            <Button 
              size="sm" 
              onClick={openAddModal} 
              className="mt-4 bg-green-500 hover:bg-green-400 text-zinc-900 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="inventory-table">
              <thead>
                <tr className="table-header border-b-2 border-[var(--glass-border)]">
                  <th className="text-left p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('title')}>
                    Title <SortIcon field="title" />
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('functional_category')}>
                    Category <SortIcon field="functional_category" />
                  </th>
                  <th className="text-left p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('vendor')}>
                    Vendor <SortIcon field="vendor" />
                  </th>
                  <th className="text-center p-4">Deployment</th>
                  <th className="text-right p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('contract_annual_spend')}>
                    Annual Spend <SortIcon field="contract_annual_spend" />
                  </th>
                  <th className="text-right p-4 cursor-pointer hover:bg-[var(--glass-highlight)] transition-colors" onClick={() => handleSort('engaged_users')}>
                    Engaged <SortIcon field="engaged_users" />
                  </th>
                  <th className="text-left p-4">Owner</th>
                  <th className="text-center p-4"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr 
                    key={app.app_id}
                    className="table-row-bordered hover:bg-[var(--glass-highlight)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/applications/${app.app_id}`)}
                    data-testid={`app-row-${app.app_id}`}
                  >
                    <td className="p-4">
                      <p className="font-medium text-theme-primary max-w-[200px] truncate">{app.title}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={`capitalize text-xs ${getStatusBadgeClass(app.status)}`}>
                        {app.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="p-4 text-theme-secondary text-sm max-w-[150px] truncate">
                      {app.functional_category || '-'}
                    </td>
                    <td className="p-4 text-theme-secondary text-sm max-w-[120px] truncate">
                      {app.vendor || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={`text-xs ${getDeploymentBadgeClass(app.deployment_type)}`}>
                        {app.deployment_type || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-theme-secondary">
                      {formatCurrency(app.contract_annual_spend)}
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-theme-secondary">
                      {app.engaged_users || 0}
                    </td>
                    <td className="p-4 text-theme-secondary text-sm max-w-[120px] truncate">
                      {app.product_owner_name || '-'}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-theme-muted">
            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(Math.max(0, page - 1))} 
              disabled={page === 0} 
              data-testid="prev-page"
              className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)] disabled:opacity-30"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))} 
              disabled={page >= totalPages - 1} 
              data-testid="next-page"
              className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)] disabled:opacity-30"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Application</DialogTitle>
            <DialogDescription className="text-theme-muted">
              Enter the details for the new application. Required fields are marked with *.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="app-title" className="text-theme-secondary">Application Title *</Label>
                <Input 
                  id="app-title" 
                  value={newAppForm.title} 
                  onChange={(e) => setNewAppForm({ ...newAppForm, title: e.target.value })} 
                  placeholder="e.g., Salesforce CRM" 
                  className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                  data-testid="new-app-title" 
                />
              </div>
              <div>
                <Label htmlFor="app-vendor" className="text-theme-secondary">Vendor</Label>
                <Input 
                  id="app-vendor" 
                  value={newAppForm.vendor} 
                  onChange={(e) => setNewAppForm({ ...newAppForm, vendor: e.target.value })} 
                  placeholder="e.g., Salesforce" 
                  className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                  data-testid="new-app-vendor" 
                />
              </div>
              <div>
                <Label htmlFor="app-status" className="text-theme-secondary">Status</Label>
                <Select value={newAppForm.status} onValueChange={(v) => setNewAppForm({ ...newAppForm, status: v })}>
                  <SelectTrigger className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-white" data-testid="new-app-status"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="app-category" className="text-theme-secondary">Functional Category</Label>
                <Input 
                  id="app-category" 
                  value={newAppForm.functional_category} 
                  onChange={(e) => setNewAppForm({ ...newAppForm, functional_category: e.target.value })} 
                  placeholder="e.g., Sales Engagement" 
                  className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                  data-testid="new-app-category" 
                />
              </div>
              <div>
                <Label htmlFor="app-deployment" className="text-theme-secondary">Deployment Type</Label>
                <Select value={newAppForm.deployment_type} onValueChange={(v) => setNewAppForm({ ...newAppForm, deployment_type: v })}>
                  <SelectTrigger className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-white" data-testid="new-app-deployment"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[var(--sidebar-bg)] border-[var(--glass-border)]">
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="On-Prem">On-Prem</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="app-description" className="text-theme-secondary">Description</Label>
              <Textarea 
                id="app-description" 
                value={newAppForm.short_description} 
                onChange={(e) => setNewAppForm({ ...newAppForm, short_description: e.target.value })} 
                placeholder="Brief description..." 
                className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                rows={2} 
                data-testid="new-app-description" 
              />
            </div>

            <div className="border-t border-[var(--glass-border)] pt-4">
              <h4 className="text-sm font-medium text-theme-secondary mb-3">Financial Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app-spend" className="text-theme-secondary">Contract Annual Spend ($)</Label>
                  <Input 
                    id="app-spend" 
                    type="number" 
                    value={newAppForm.contract_annual_spend} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, contract_annual_spend: e.target.value })} 
                    placeholder="0" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-spend" 
                  />
                </div>
                <div>
                  <Label htmlFor="app-ytd" className="text-theme-secondary">Fiscal YTD Expense ($)</Label>
                  <Input 
                    id="app-ytd" 
                    type="number" 
                    value={newAppForm.fiscal_ytd_expense_total} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, fiscal_ytd_expense_total: e.target.value })} 
                    placeholder="0" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-ytd" 
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--glass-border)] pt-4">
              <h4 className="text-sm font-medium text-theme-secondary mb-3">Usage & Ownership</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app-engaged" className="text-theme-secondary">Engaged Users</Label>
                  <Input 
                    id="app-engaged" 
                    type="number" 
                    value={newAppForm.engaged_users} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, engaged_users: e.target.value })} 
                    placeholder="0" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-engaged" 
                  />
                </div>
                <div>
                  <Label htmlFor="app-cost-center" className="text-theme-secondary">Cost Center</Label>
                  <Input 
                    id="app-cost-center" 
                    value={newAppForm.cost_center_primary} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, cost_center_primary: e.target.value })} 
                    placeholder="e.g., 650-it executive" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-cost-center" 
                  />
                </div>
                <div>
                  <Label htmlFor="app-owner" className="text-theme-secondary">Product Owner</Label>
                  <Input 
                    id="app-owner" 
                    value={newAppForm.product_owner_name} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, product_owner_name: e.target.value })} 
                    placeholder="Owner name" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-owner" 
                  />
                </div>
                <div>
                  <Label htmlFor="app-it-contact" className="text-theme-secondary">IT Contact</Label>
                  <Input 
                    id="app-it-contact" 
                    value={newAppForm.it_contact} 
                    onChange={(e) => setNewAppForm({ ...newAppForm, it_contact: e.target.value })} 
                    placeholder="IT contact name" 
                    className="mt-1 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-primary placeholder:text-theme-faint" 
                    data-testid="new-app-it-contact" 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddModalOpen(false)} 
              disabled={submitting}
              className="bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary hover:bg-[var(--glass-bg)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddApplication} 
              disabled={submitting || !newAppForm.title.trim()} 
              data-testid="submit-new-app"
              className="bg-green-500 hover:bg-green-400 text-zinc-900 font-medium"
            >
              {submitting ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
