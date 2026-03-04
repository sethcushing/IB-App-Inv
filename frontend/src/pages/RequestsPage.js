import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Inbox, Filter, Mail, Clock, Send, CheckCircle, AlertCircle,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
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
      case 'Completed': return <CheckCircle className="w-4 h-4 text-lime-400" />;
      case 'Sent': return <Send className="w-4 h-4 text-blue-400" />;
      case 'Awaiting Response': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'Draft': return <Mail className="w-4 h-4 text-white/40" />;
      default: return <AlertCircle className="w-4 h-4 text-white/40" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge-lime';
      case 'Sent': return 'badge-blue';
      case 'Awaiting Response': return 'badge-amber';
      case 'Draft': return 'bg-white/10 text-white/50 border-white/10';
      case 'Closed': return 'bg-white/10 text-white/40 border-white/10';
      default: return 'bg-white/10 text-white/50 border-white/10';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge-red';
      case 'Medium': return 'badge-amber';
      case 'Low': return 'bg-white/10 text-white/50 border-white/10';
      default: return 'bg-white/10 text-white/50 border-white/10';
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
            Requests Center
          </h1>
          <p className="text-white/50 mt-1">
            {requests.length} total requests
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRequests} 
          data-testid="refresh-requests"
          className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white/70" data-testid="requests-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white/70" data-testid="requests-priority-filter">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters} 
            data-testid="clear-request-filters"
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            <Filter className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white/50 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
            Loading requests...
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center">
          <Inbox className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50 text-lg">No requests found</p>
          <p className="text-sm text-white/30 mt-1">
            Create requests from application detail pages
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRequests).map(([status, statusRequests]) => {
            if (statusRequests.length === 0 && filters.status && filters.status !== status) return null;
            if (statusRequests.length === 0) return null;
            
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(status)}
                  <h3 className="font-medium text-white">{status}</h3>
                  <Badge className="text-xs bg-white/10 text-white/50">{statusRequests.length}</Badge>
                </div>
                
                <div className="space-y-2">
                  {statusRequests.map((req) => (
                    <div 
                      key={req.request_id}
                      className="glass-card-hover p-4 cursor-pointer"
                      onClick={() => openDetail(req)}
                      data-testid={`request-card-${req.request_id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-white">{req.request_type}</span>
                            <Badge className={`text-xs ${getStatusBadgeClass(req.status)}`}>
                              {req.status}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityBadgeClass(req.priority)}`}>
                              {req.priority}
                            </Badge>
                          </div>
                          <p 
                            className="text-sm text-lime-400 hover:underline cursor-pointer mb-1"
                            onClick={(e) => { e.stopPropagation(); navigate(`/applications/${req.app_id}`); }}
                          >
                            {req.app_title}
                          </p>
                          <p className="text-sm text-white/50 truncate">{req.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                            <span>To: {req.to_role} {req.to_name && `(${req.to_name})`}</span>
                            <span>Created: {formatDate(req.created_at)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-zinc-900 border-white/10">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selectedRequest.request_type}</SheetTitle>
                <SheetDescription className="text-white/50">
                  Request for {selectedRequest.app_title}
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Status & Priority */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-white/40 text-xs">Status</Label>
                    <Select 
                      value={selectedRequest.status} 
                      onValueChange={(v) => handleStatusChange(selectedRequest.request_id, v)}
                    >
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white" data-testid="detail-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Awaiting Response">Awaiting Response</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-white/40 text-xs">Priority</Label>
                    <Badge className={`mt-2 block w-fit ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                </div>

                {/* Recipient */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Label className="text-white/40 text-xs">Recipient</Label>
                  <p className="font-medium text-white mt-1">{selectedRequest.to_role}</p>
                  {selectedRequest.to_name && (
                    <p className="text-sm text-white/60">{selectedRequest.to_name}</p>
                  )}
                  {selectedRequest.to_email && (
                    <p className="text-sm text-white/40">{selectedRequest.to_email}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <Label className="text-white/40 text-xs">Message</Label>
                  <p className="mt-1 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 whitespace-pre-wrap">
                    {selectedRequest.message}
                  </p>
                </div>

                {/* Response Notes */}
                <div>
                  <Label className="text-white/40 text-xs">Response Notes</Label>
                  <Textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Add notes about the response..."
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    rows={4}
                    data-testid="response-notes-textarea"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    onClick={handleSaveNotes}
                    data-testid="save-notes-btn"
                  >
                    Save Notes
                  </Button>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-white/30 space-y-1">
                  <p>Created: {formatDate(selectedRequest.created_at)}</p>
                  <p>Updated: {formatDate(selectedRequest.updated_at)}</p>
                  {selectedRequest.sent_at && <p>Sent: {formatDate(selectedRequest.sent_at)}</p>}
                  <p>Created by: {selectedRequest.created_by}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {selectedRequest.status === 'Draft' && (
                    <Button 
                      onClick={() => handleSendRequest(selectedRequest.request_id)}
                      className="bg-lime-500 hover:bg-lime-400 text-zinc-900 font-medium"
                      data-testid="send-request-btn"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Request
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/applications/${selectedRequest.app_id}`)}
                    className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
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
