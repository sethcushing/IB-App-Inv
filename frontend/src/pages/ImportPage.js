import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle,
  Trash2, RefreshCw, FileText, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ImportPage = () => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [templateHeaders, setTemplateHeaders] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension && !validTypes.includes(file.type)) {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const res = await axios.post(`${API}/import/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setImportResult(res.data);
      toast.success(`Imported ${res.data.imported_count} applications`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Import failed');
      setImportResult({
        error: true,
        message: error.response?.data?.detail || 'Import failed'
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleClearData = async () => {
    try {
      const res = await axios.delete(`${API}/import/clear`);
      toast.success(res.data.message);
      setClearDialogOpen(false);
      setImportResult(null);
      setSelectedFile(null);
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  const fetchTemplate = async () => {
    try {
      const res = await axios.get(`${API}/import/template`);
      setTemplateHeaders(res.data.headers);
      
      // Generate and download CSV
      const csvContent = res.data.headers.join(',') + '\n';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'systems_inventory_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-zinc-900">
          Import Data
        </h1>
        <p className="text-slate-500 mt-1">
          Upload an Excel or CSV file to import application data
        </p>
      </div>

      {/* Upload Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File
          </CardTitle>
          <CardDescription>
            Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${selectedFile ? 'border-lime-500 bg-lime-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
            `}
            onClick={() => fileInputRef.current?.click()}
            data-testid="file-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-center gap-4">
                <FileSpreadsheet className="w-12 h-12 text-lime-600" />
                <div className="text-left">
                  <p className="font-medium text-zinc-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImportResult(null); }}
                  data-testid="clear-file-btn"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-slate-400">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-slate-500 text-center">
                Uploading and processing... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-zinc-900 hover:bg-zinc-800"
              data-testid="upload-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Importing...' : 'Import Data'}
            </Button>
            <Button variant="outline" onClick={fetchTemplate} data-testid="download-template-btn">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setClearDialogOpen(true)}
              data-testid="clear-data-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card className={`border-2 ${importResult.error ? 'border-red-200 bg-red-50' : 'border-lime-200 bg-lime-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {importResult.error ? (
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-lime-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-medium ${importResult.error ? 'text-red-900' : 'text-lime-900'}`}>
                  {importResult.error ? 'Import Failed' : 'Import Successful'}
                </h3>
                <p className={`text-sm mt-1 ${importResult.error ? 'text-red-700' : 'text-lime-700'}`}>
                  {importResult.message}
                </p>
                
                {!importResult.error && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white rounded-lg border border-lime-200">
                      <p className="text-slate-500">Imported</p>
                      <p className="text-2xl font-heading font-bold text-lime-600">
                        {importResult.imported_count}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-lime-200">
                      <p className="text-slate-500">Total Rows</p>
                      <p className="text-2xl font-heading font-bold text-zinc-900">
                        {importResult.total_rows}
                      </p>
                    </div>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      Warnings ({importResult.errors.length}):
                    </p>
                    <ul className="text-sm text-amber-600 space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Mapping Info */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Expected Columns
          </CardTitle>
          <CardDescription>
            The import will auto-detect and map these columns from your file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {[
              'Title *',
              'App_status',
              'Functional_category',
              'Capabilities',
              'Short_description',
              'Data_sources',
              'Vendor',
              'App_labels',
              'App_notes',
              'Users_with_SSO_access',
              'Users_logging_in_via_SSO',
              'Provisioned_users',
              'Engaged_users',
              'Contract_annual_spend',
              'Fiscal_YTD_expense_Total',
              'Prev_fiscal_year_expense_Total',
              'cost_center',
              'IT_Product_Manager',
              'IT_contact',
              'Security_contact',
              'Legal_contact',
              'Procurement_contact',
              'Vendor_contact',
              'Contact'
            ].map((col) => (
              <div 
                key={col} 
                className={`px-2 py-1 rounded ${col.includes('*') ? 'bg-lime-100 text-lime-700' : 'bg-slate-100 text-slate-600'}`}
              >
                {col}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            * Required field. Currency values will be automatically parsed (supports $, commas).
            Deployment type will be inferred from vendor name if not provided.
          </p>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all applications and requests from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-clear-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-clear-btn"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImportPage;
