import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronUp, ChevronDown, ChevronRight, RefreshCw, Download
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (!value) return '-';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterOptions, setFilterOptions] = useState({});
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    functional_category: '',
    deployment_type: '',
    cost_center: '',
    vendor: ''
  });
  
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const limit = 25;

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
    setPage(0);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
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
      case 'Cloud': return 'bg-lime-100 text-lime-700 border-lime-200';
      case 'On-Prem': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'Hybrid': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900">
            Application Inventory
          </h1>
          <p className="text-slate-500 mt-1">
            {total} applications in portfolio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApplications} data-testid="refresh-inventory">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }}
                data-testid="inventory-search"
              />
            </div>
            
            <Select value={filters.functional_category} onValueChange={(v) => { setFilters({ ...filters, functional_category: v === 'all' ? '' : v }); setPage(0); }}>
              <SelectTrigger className="w-[180px]" data-testid="inventory-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.deployment_type} onValueChange={(v) => { setFilters({ ...filters, deployment_type: v === 'all' ? '' : v }); setPage(0); }}>
              <SelectTrigger className="w-[150px]" data-testid="inventory-deployment-filter">
                <SelectValue placeholder="Deployment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.deployment_types?.map(dt => (
                  <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v === 'all' ? '' : v }); setPage(0); }}>
              <SelectTrigger className="w-[140px]" data-testid="inventory-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filterOptions.statuses?.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.vendor} onValueChange={(v) => { setFilters({ ...filters, vendor: v === 'all' ? '' : v }); setPage(0); }}>
              <SelectTrigger className="w-[150px]" data-testid="inventory-vendor-filter">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {filterOptions.vendors?.slice(0, 20).map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-inventory-filters">
              <Filter className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-slate-500">Loading applications...</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-slate-500">No applications found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or import data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="inventory-table">
                <thead>
                  <tr className="table-header border-b border-slate-200">
                    <th 
                      className="text-left p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      Title <SortIcon field="title" />
                    </th>
                    <th 
                      className="text-left p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon field="status" />
                    </th>
                    <th 
                      className="text-left p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('functional_category')}
                    >
                      Category <SortIcon field="functional_category" />
                    </th>
                    <th 
                      className="text-left p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('vendor')}
                    >
                      Vendor <SortIcon field="vendor" />
                    </th>
                    <th className="text-center p-4">Deployment</th>
                    <th 
                      className="text-right p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('contract_annual_spend')}
                    >
                      Annual Spend <SortIcon field="contract_annual_spend" />
                    </th>
                    <th 
                      className="text-right p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('fiscal_ytd_expense_total')}
                    >
                      YTD Expense <SortIcon field="fiscal_ytd_expense_total" />
                    </th>
                    <th 
                      className="text-right p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort('engaged_users')}
                    >
                      Engaged <SortIcon field="engaged_users" />
                    </th>
                    <th className="text-left p-4">Owner</th>
                    <th className="text-center p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr 
                      key={app.app_id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/applications/${app.app_id}`)}
                      data-testid={`app-row-${app.app_id}`}
                    >
                      <td className="p-4">
                        <p className="font-medium text-zinc-900 max-w-[200px] truncate">{app.title}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(app.status)} className="capitalize text-xs">
                          {app.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-600 text-sm max-w-[150px] truncate">
                        {app.functional_category || '-'}
                      </td>
                      <td className="p-4 text-slate-600 text-sm max-w-[120px] truncate">
                        {app.vendor || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className={`text-xs ${getDeploymentBadgeClass(app.deployment_type)}`}>
                          {app.deployment_type || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        {formatCurrency(app.contract_annual_spend)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-600">
                        {formatCurrency(app.fiscal_ytd_expense_total)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm">
                        {app.engaged_users || 0}
                      </td>
                      <td className="p-4 text-slate-600 text-sm max-w-[120px] truncate">
                        {app.product_owner_name || '-'}
                      </td>
                      <td className="p-4 text-center">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              data-testid="prev-page"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              data-testid="next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
