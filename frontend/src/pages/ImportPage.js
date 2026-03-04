import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle,
  Trash2, FileText, X
} from 'lucide-react';
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

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get(`${API}/import/template`);
      
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
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
          Import Data
        </h1>
        <p className="text-white/50 mt-1">
          Upload an Excel or CSV file to import application data
        </p>
      </div>

      {/* Upload Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-lime-400" />
            <h3 className="text-lg font-heading font-semibold text-white">Upload File</h3>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${selectedFile 
                ? 'border-lime-500/50 bg-lime-500/5' 
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
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
                <FileSpreadsheet className="w-12 h-12 text-lime-400" />
                <div className="text-left">
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-sm text-white/50">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImportResult(null); }}
                  className="text-white/50 hover:text-white hover:bg-white/10"
                  data-testid="clear-file-btn"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-white/30">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2 bg-white/10 [&>div]:bg-lime-500" />
              <p className="text-sm text-white/50 text-center">
                Uploading and processing... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-lime-500 hover:bg-lime-400 text-zinc-900 font-medium disabled:opacity-30"
              data-testid="upload-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Importing...' : 'Import Data'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate} 
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              data-testid="download-template-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button 
              variant="outline" 
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              onClick={() => setClearDialogOpen(true)}
              data-testid="clear-data-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`glass-card p-6 border-l-4 ${importResult.error ? 'border-l-red-500 bg-red-500/5' : 'border-l-lime-500 bg-lime-500/5'}`}>
          <div className="flex items-start gap-4">
            {importResult.error ? (
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-6 h-6 text-lime-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-medium ${importResult.error ? 'text-red-400' : 'text-lime-400'}`}>
                {importResult.error ? 'Import Failed' : 'Import Successful'}
              </h3>
              <p className={`text-sm mt-1 ${importResult.error ? 'text-red-400/70' : 'text-lime-400/70'}`}>
                {importResult.message}
              </p>
              
              {!importResult.error && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-white/5 border border-lime-500/20">
                    <p className="text-white/50">Imported</p>
                    <p className="text-2xl font-heading font-bold text-lime-400">
                      {importResult.imported_count}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50">Total Rows</p>
                    <p className="text-2xl font-heading font-bold text-white">
                      {importResult.total_rows}
                    </p>
                  </div>
                </div>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-amber-400 mb-2">
                    Warnings ({importResult.errors.length}):
                  </p>
                  <ul className="text-sm text-amber-400/70 space-y-1">
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
        </div>
      )}

      {/* Column Mapping Info */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white/50" />
            <h3 className="text-lg font-heading font-semibold text-white">Expected Columns</h3>
          </div>
          <p className="text-xs text-white/40 mt-1">
            The import will auto-detect and map these columns from your file
          </p>
        </div>
        <div className="p-6">
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
                className={`px-2 py-1 rounded-lg text-xs ${
                  col.includes('*') 
                    ? 'bg-lime-500/15 text-lime-400 border border-lime-500/20' 
                    : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                {col}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-4">
            * Required field. Currency values will be automatically parsed (supports $, commas).
            Deployment type will be inferred from vendor name if not provided.
          </p>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will permanently delete all applications and requests from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              data-testid="cancel-clear-btn"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-red-500 hover:bg-red-400 text-white"
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
