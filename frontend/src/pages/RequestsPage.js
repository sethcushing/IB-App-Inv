import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Inbox, Search, Filter, Mail, Clock, Send, CheckCircle, AlertCircle,
  ChevronRight, RefreshCw, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RequestsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });

  const [responseNotes, setResponseNotes] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const res = await axios.get(`${API}/requests?${queryParams}`);
      setRequests(res.data.requests);
      
      // Check for ID in URL params
      const idParam = searchParams.get('id');
      if (idParam) {
        const found = res.data.requests.find(r => r.request_id === idParam);
        if (found) {
          setSelectedRequest(found);
          setDetailOpen(true);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters, searchParams]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await axios.put(`${API}/requests/${requestId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchRequests();
      if (selectedRequest?.request_id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/requests/${requestId}/send`);
      toast.success('Request sent');
      fetchRequests();
      if (selectedRequest?.request_id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: 'Sent' });
      }
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    try {
      await axios.put(`${API}/requests/${selectedRequest.request_id}`, { 
        response_notes: responseNotes 
      });
      toast.success('Notes saved');
      fetchRequests();
      setSelectedRequest({ ...selectedRequest, response_notes: responseNotes });
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const openDetail = (request) => {
    setSelectedRequest(request);
    setResponseNotes(request.response_notes || '');
    setDetailOpen(true);
    setSearchParams({ id: request.request_id });
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
    setSearchParams({});
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-lime-600" />;
      case 'Sent': return <Send className="w-4 h-4 text-blue-600" />;
      case 'Awaiting Response': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Draft': return <Mail className="w-4 h-4 text-slate-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-lime-100 text-lime-700 border-lime-200';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Awaiting Response': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Closed': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group by status
  const groupedRequests = {
    'Draft': requests.filter(r => r.status === 'Draft'),
    'Sent': requests.filter(r => r.status === 'Sent'),
    'Awaiting Response': requests.filter(r => r.status === 'Awaiting Response'),
    'Completed': requests.filter(r => r.status === 'Completed'),
    'Closed': requests.filter(r => r.status === 'Closed'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900">
            Requests Center
          </h1>
          <p className="text-slate-500 mt-1">
            {requests.length} total requests
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} data-testid="refresh-requests">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-[180px]" data-testid="requests-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? '' : v })}>
              <SelectTrigger className="w-[150px]" data-testid="requests-priority-filter">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-request-filters">
              <Filter className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-500">Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Inbox className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No requests found</p>
            <p className="text-sm text-slate-400 mt-1">
              Create requests from application detail pages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRequests).map(([status, statusRequests]) => {
            if (statusRequests.length === 0 && filters.status && filters.status !== status) return null;
            if (statusRequests.length === 0) return null;
            
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(status)}
                  <h3 className="font-medium text-zinc-900">{status}</h3>
                  <Badge variant="outline" className="text-xs">{statusRequests.length}</Badge>
                </div>
                
                <div className="space-y-2">
                  {statusRequests.map((req) => (
                    <Card 
                      key={req.request_id}
                      className="border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openDetail(req)}
                      data-testid={`request-card-${req.request_id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-zinc-900">{req.request_type}</span>
                              <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(req.status)}`}>
                                {req.status}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getPriorityBadgeClass(req.priority)}`}>
                                {req.priority}
                              </Badge>
                            </div>
                            <p 
                              className="text-sm text-blue-600 hover:underline cursor-pointer mb-1"
                              onClick={(e) => { e.stopPropagation(); navigate(`/applications/${req.app_id}`); }}
                            >
                              {req.app_title}
                            </p>
                            <p className="text-sm text-slate-600 truncate">{req.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span>To: {req.to_role} {req.to_name && `(${req.to_name})`}</span>
                              <span>Created: {formatDate(req.created_at)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRequest.request_type}</SheetTitle>
                <SheetDescription>
                  Request for {selectedRequest.app_title}
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Status & Priority */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-slate-500 text-xs">Status</Label>
                    <Select 
                      value={selectedRequest.status} 
                      onValueChange={(v) => handleStatusChange(selectedRequest.request_id, v)}
                    >
                      <SelectTrigger className="mt-1" data-testid="detail-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-slate-500 text-xs">Priority</Label>
                    <Badge variant="outline" className={`mt-2 block w-fit ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                </div>

                {/* Recipient */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-slate-500 text-xs">Recipient</Label>
                  <p className="font-medium text-zinc-900 mt-1">{selectedRequest.to_role}</p>
                  {selectedRequest.to_name && (
                    <p className="text-sm text-slate-600">{selectedRequest.to_name}</p>
                  )}
                  {selectedRequest.to_email && (
                    <p className="text-sm text-slate-500">{selectedRequest.to_email}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <Label className="text-slate-500 text-xs">Message</Label>
                  <p className="mt-1 p-3 bg-white border border-slate-200 rounded-lg text-sm text-zinc-900 whitespace-pre-wrap">
                    {selectedRequest.message}
                  </p>
                </div>

                {/* Response Notes */}
                <div>
                  <Label className="text-slate-500 text-xs">Response Notes</Label>
                  <Textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Add notes about the response..."
                    className="mt-1"
                    rows={4}
                    data-testid="response-notes-textarea"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={handleSaveNotes}
                    data-testid="save-notes-btn"
                  >
                    Save Notes
                  </Button>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Created: {formatDate(selectedRequest.created_at)}</p>
                  <p>Updated: {formatDate(selectedRequest.updated_at)}</p>
                  {selectedRequest.sent_at && <p>Sent: {formatDate(selectedRequest.sent_at)}</p>}
                  <p>Created by: {selectedRequest.created_by}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {selectedRequest.status === 'Draft' && (
                    <Button 
                      onClick={() => handleSendRequest(selectedRequest.request_id)}
                      className="bg-zinc-900 hover:bg-zinc-800"
                      data-testid="send-request-btn"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Request
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/applications/${selectedRequest.app_id}`)}
                    data-testid="view-app-btn"
                  >
                    View Application
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RequestsPage;
