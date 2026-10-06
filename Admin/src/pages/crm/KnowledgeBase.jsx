import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiTrash2, FiSearch, FiBook, FiCheckCircle, FiFileText, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import PageShell from '../../components/PageShell';
import Card from '../../components/Card';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('HR Policy');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Search/Test variables
  const [testQuery, setTestQuery] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/documents');
      setDocuments(data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-fill title from filename without extension
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(baseName);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('title', title);
    formData.append('category', category);

    setUploading(true);
    try {
      await api.post('/ai/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded and indexed successfully!');
      setTitle('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload and index document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      await api.delete(`/ai/documents/${id}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleSearchTest = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/ai/kb/query', { question: testQuery });
      setTestResult(data);
    } catch (err) {
      toast.error('Failed to query knowledge base');
    } finally {
      setTestLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell title="AI Knowledge Base (RAG)" description="Upload documents, guidelines, policies, and handbook files to feed the AI Brain.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <Card className="p-5 border border-line bg-surface shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-1.5">
              <FiUploadCloud className="text-brand h-4 w-4" /> Upload Document
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="app-label mb-1.5 block">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Employee Handbook 2026"
                  className="app-input"
                  required
                />
              </div>

              <div>
                <label className="app-label mb-1.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="app-input"
                >
                  <option value="HR Policy">HR Policy</option>
                  <option value="Finance & Tax">Finance & Tax</option>
                  <option value="Standard Operating Procedure (SOP)">SOP / Guidelines</option>
                  <option value="Client Agreement">Client Agreement</option>
                  <option value="General Info">General Info</option>
                </select>
              </div>

              <div>
                <label className="app-label mb-1.5 block">Select File (PDF, DOCX, TXT, CSV)</label>
                <div className="border-2 border-dashed border-line rounded-lg p-6 hover:border-brand transition-all flex flex-col items-center justify-center bg-soft/30 cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FiUploadCloud className="h-8 w-8 text-muted mb-2" />
                  {selectedFile ? (
                    <span className="text-xs font-medium text-brand text-center break-all">{selectedFile.name}</span>
                  ) : (
                    <span className="text-xs text-muted text-center">Click or Drag files here (Max 10MB)</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-2 h-10 mt-2"
              >
                {uploading ? (
                  <>
                    <FiRefreshCw className="animate-spin h-4 w-4" />
                    Uploading & Indexing...
                  </>
                ) : (
                  <>
                    <FiUploadCloud className="h-4 w-4" />
                    Process & Index File
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Document List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border border-line bg-surface shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <FiBook className="text-brand h-4 w-4" /> Index Status
              </h3>
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="app-input pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted gap-2">
                <FiRefreshCw className="animate-spin h-6 w-6 text-brand" />
                <span>Scanning knowledge base...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 border border-dashed border-line rounded text-center text-muted text-xs">
                No indexed documents found. Upload a PDF, DOCX, TXT, or CSV file to build your knowledge base.
              </div>
            ) : (
              <div className="overflow-x-auto border border-line rounded">
                <table className="min-w-full divide-y divide-line text-left text-xs">
                  <thead className="bg-soft text-ink font-medium">
                    <tr>
                      <th className="px-4 py-2.5">Title</th>
                      <th className="px-4 py-2.5">File Name</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface text-ink">
                    {filteredDocs.map((doc) => (
                      <tr key={doc._id} className="hover:bg-soft/40 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{doc.title}</td>
                        <td className="px-4 py-2.5 text-muted max-w-[150px] truncate">{doc.fileName}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-brand-xlight text-brand px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 text-success font-semibold">
                            <FiCheckCircle className="h-3.5 w-3.5" /> Indexed
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(doc._id)}
                            className="text-danger hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete index mapping"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Search / Test Box */}
          <Card className="p-5 border border-line bg-surface shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-1.5">
              <FiSearch className="text-brand h-4 w-4" /> Semantic Query Tester
            </h3>
            <form onSubmit={handleSearchTest} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a policy question to test RAG (e.g. What is leave policy?)"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                className="app-input h-10"
              />
              <button
                type="submit"
                disabled={testLoading}
                className="btn-primary flex items-center justify-center gap-2 h-10 px-6 shrink-0"
              >
                {testLoading ? <FiRefreshCw className="animate-spin h-4 w-4" /> : 'Ask AI'}
              </button>
            </form>

            {testResult && (
              <div className="mt-4 border border-line rounded-lg p-4 bg-soft/20 text-ink">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">AI Response</h4>
                <p className="text-[13px] leading-relaxed mb-4">{testResult.answer}</p>
                
                {testResult.sources && testResult.sources.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">Sources Cited</h5>
                    <div className="space-y-1">
                      {testResult.sources.map((src, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs text-muted">
                          <FiFileText className="h-3.5 w-3.5 text-brand" />
                          <span className="font-medium text-ink">{src.title}</span>
                          {src.pageNumber && <span>(Page {src.pageNumber})</span>}
                          {src.score && (
                            <span className="text-[10px] bg-line px-1 rounded font-mono">
                              Similarity: {(src.score * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default KnowledgeBase;
