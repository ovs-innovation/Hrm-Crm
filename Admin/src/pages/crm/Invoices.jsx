import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiDollarSign, FiPercent, FiTrash2, FiPlus, FiPrinter, FiDownload, FiShare2,
  FiSave, FiRotateCcw, FiRotateCw, FiCpu, FiPlusCircle, FiArrowLeft, FiUpload,
  FiBriefcase, FiGrid, FiFileText, FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LiveInvoicePreview } from '../../components/InvoiceTemplates';
import InvoiceBuilderDashboard from '../../components/InvoiceBuilderDashboard';
import api from '../../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const COMPANY_DEFAULTS = {
  companyName: 'VASTORA TECH PVT. LTD.',
  companyGst: '09AALCV1860D1Z8',
  companyAddress: '202, JS Acade Above PNB Bank Sector-51 Noida',
  companyPhone: '+91 8595658592',
  companyEmail: 'info@vastoratech.in',
  logoUrl: '/logo.png',
  bankName: 'Vastora Tech Pvt Ltd.',
  accountNumber: '1508 1021 00000 749',
  ifscCode: 'PUNB0150810',
  currency: '₹',
};

const emptyProposalSections = () => ({
  executiveSummary: '',
  scope: '',
  timeline: '',
  callToAction: '',
});

const blankDocument = (docType = 'Invoice') => {
  const isProposal = docType === 'Proposal';
  return {
    _id: null,
    docType,
    status: 'Draft',
    invoiceNumber: isProposal ? 'PROP-DRAFT' : 'INV-DRAFT',
    invoiceDate: today(),
    dueDate: plusDays(30),
    ...COMPANY_DEFAULTS,
    customerName: '',
    customerGst: '',
    billingAddress: '',
    clientId: '',
    projectId: '',
    projectTitle: '',
    items: [{ item: '', hsn: isProposal ? '' : '998314', qty: 1, price: 0, tax: 18 }],
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
    advancePaid: 0,
    pendingAmount: 0,
    termsAndConditions: isProposal
      ? '1. This proposal is valid for 30 days.\n2. 50% advance required to begin work.\n3. Timelines depend on timely client feedback.\n4. Source code handed over after full payment.'
      : '1. 50% advance payment is required before project initiation.\n2. Project timelines are subject to timely client feedback.\n3. Source code will be handed over only after full payment.\n4. Post-launch support is provided for 30 days.',
    proposalSections: emptyProposalSections(),
    documentTitle: isProposal ? 'Project Proposal' : 'Tax Invoice',
    template: isProposal ? 'corporate' : 'gst',
  };
};

const recalculate = (data) => {
  let sub = 0;
  let taxTotal = 0;
  (data.items || []).forEach((item) => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const line = qty * price;
    sub += line;
    taxTotal += line * ((Number(item.tax) || 18) / 100);
  });
  const cgst = Math.round((taxTotal / 2) * 100) / 100;
  const sgst = Math.round((taxTotal - cgst) * 100) / 100;
  const total = Math.round((sub + taxTotal) * 100) / 100;
  const pending = Math.round((total - Number(data.advancePaid || 0)) * 100) / 100;
  return {
    ...data,
    subtotal: Math.round(sub * 100) / 100,
    cgst,
    sgst,
    total,
    pendingAmount: pending,
  };
};

/** API record → builder state */
const fromApi = (inv) => {
  const docType = inv.type === 'Invoice' ? 'Invoice' : 'Proposal';
  return recalculate({
    _id: inv._id,
    docType,
    status: inv.status || 'Draft',
    invoiceNumber: inv.number || '',
    invoiceDate: inv.invoiceDate || (inv.createdAt ? String(inv.createdAt).slice(0, 10) : today()),
    dueDate: inv.dueDate ? String(inv.dueDate).slice(0, 10) : plusDays(30),
    companyName: inv.companyName || COMPANY_DEFAULTS.companyName,
    companyGst: inv.companyGst || COMPANY_DEFAULTS.companyGst,
    companyAddress: inv.companyAddress || COMPANY_DEFAULTS.companyAddress,
    companyPhone: inv.companyPhone || COMPANY_DEFAULTS.companyPhone,
    companyEmail: inv.companyEmail || COMPANY_DEFAULTS.companyEmail,
    logoUrl: inv.logoUrl || COMPANY_DEFAULTS.logoUrl,
    signatureUrl: inv.signatureUrl || '',
    stampUrl: inv.stampUrl || '',
    customerName: inv.clientName || '',
    customerGst: inv.customerGst || '',
    billingAddress: inv.billingAddress || '',
    clientId: inv.client || '',
    projectId: inv.project || '',
    projectTitle: inv.projectTitle || '',
    items: (inv.items || []).map((i) => ({
      item: i.description || '',
      hsn: i.hsn || '',
      qty: i.quantity ?? 1,
      price: i.rate ?? 0,
      tax: i.tax ?? inv.taxRate ?? 18,
    })),
    advancePaid: inv.advancePaid || 0,
    termsAndConditions: inv.termsAndConditions || inv.notes || '',
    bankName: inv.bankName || COMPANY_DEFAULTS.bankName,
    accountNumber: inv.accountNumber || COMPANY_DEFAULTS.accountNumber,
    ifscCode: inv.ifscCode || COMPANY_DEFAULTS.ifscCode,
    currency: inv.currency || '₹',
    proposalSections: {
      ...emptyProposalSections(),
      ...(inv.proposalSections || {}),
    },
    documentTitle: docType === 'Proposal' ? 'Project Proposal' : 'Tax Invoice',
    template: inv.template || (docType === 'Invoice' ? 'gst' : 'corporate'),
    cgst: inv.cgst,
    sgst: inv.sgst,
    subtotal: inv.subtotal,
    total: inv.total,
    pendingAmount: inv.pendingAmount,
  });
};

/** Builder state → API payload */
const toApiPayload = (data, template) => ({
  type: data.docType === 'Invoice' ? 'Invoice' : 'Proposal',
  status: data.status || 'Draft',
  number: data.invoiceNumber?.includes('DRAFT') ? undefined : data.invoiceNumber || undefined,
  clientName: data.customerName,
  client: data.clientId || undefined,
  project: data.projectId || undefined,
  projectTitle: data.projectTitle || undefined,
  invoiceDate: data.invoiceDate,
  dueDate: data.dueDate || undefined,
  companyName: data.companyName,
  companyGst: data.companyGst,
  companyAddress: data.companyAddress,
  companyPhone: data.companyPhone,
  companyEmail: data.companyEmail,
  logoUrl: data.logoUrl,
  signatureUrl: data.signatureUrl,
  stampUrl: data.stampUrl,
  customerGst: data.customerGst,
  billingAddress: data.billingAddress,
  items: (data.items || []).map((i) => ({
    description: i.item || i.description || 'Item',
    hsn: i.hsn || '',
    quantity: Number(i.qty) || 0,
    rate: Number(i.price) || 0,
    tax: Number(i.tax) || 18,
  })),
  advancePaid: Number(data.advancePaid) || 0,
  template: template || data.template || 'corporate',
  currency: data.currency || '₹',
  termsAndConditions: data.termsAndConditions,
  notes: data.termsAndConditions,
  bankName: data.bankName,
  accountNumber: data.accountNumber,
  ifscCode: data.ifscCode,
  proposalSections: data.proposalSections || emptyProposalSections(),
});

const TEMPLATES = [
  { id: 'corporate', title: 'Corporate Classic', desc: 'Blue letterhead — good for proposals.', label: 'Proposal', thumb: 'bg-[#1E51A4]' },
  { id: 'minimal', title: 'Minimal Modern', desc: 'Black & white, clean product quotes.', thumb: 'bg-neutral-900' },
  { id: 'executive', title: 'Executive Premium', desc: 'Dark gold — enterprise retainers.', thumb: 'bg-[#92400E]' },
  { id: 'gst', title: 'GST Business', desc: 'HSN, CGST/SGST tax invoice grid.', label: 'GST', thumb: 'bg-teal-800' },
  { id: 'creative', title: 'Creative Agency', desc: 'Simple two-column studio layout.', thumb: 'bg-slate-700' },
];

export default function Invoices() {
  const [view, setView] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [listFilter, setListFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [openSidebarTab, setOpenSidebarTab] = useState('Company');
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [orientation] = useState('portrait');
  const [activeTemplate, setActiveTemplate] = useState('gst');
  const [invoiceData, setInvoiceData] = useState(() => blankDocument('Invoice'));
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [createDocType, setCreateDocType] = useState('Invoice');
  const [modalSelectedTemplate, setModalSelectedTemplate] = useState('gst');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const loadInvoices = useCallback(async () => {
    try {
      const res = await api.get('/invoices');
      const rows = Array.isArray(res.data) ? res.data : [];
      setInvoices(rows.map((inv) => {
        const mapped = fromApi(inv);
        return {
          ...mapped,
          docType: mapped.docType,
        };
      }));
    } catch {
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    Promise.all([
      api.get('/clients').catch(() => ({ data: [] })),
      api.get('/projects').catch(() => ({ data: [] })),
    ]).then(([c, p]) => {
      setClients(Array.isArray(c.data) ? c.data : []);
      setProjects(Array.isArray(p.data) ? p.data : []);
    });
  }, [loadInvoices]);

  const updateState = (newValOrFn) => {
    setInvoiceData((prev) => {
      const next = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      const calculated = recalculate(next);
      setHistory((h) => {
        const sliced = h.slice(0, historyIndex + 1);
        sliced.push(calculated);
        setHistoryIndex(sliced.length - 1);
        return sliced;
      });
      return calculated;
    });
  };

  const resetHistory = (doc) => {
    const calc = recalculate(doc);
    setInvoiceData(calc);
    setHistory([calc]);
    setHistoryIndex(0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setInvoiceData(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setInvoiceData(history[historyIndex + 1]);
    }
  };

  const handleFileUpload = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateState((prev) => ({ ...prev, [key]: reader.result }));
      toast.success('Uploaded');
    };
    reader.readAsDataURL(file);
  };

  const downloadPdf = async () => {
    const sheet = document.getElementById('a4-invoice-sheet');
    if (!sheet) return;
    toast.loading('Generating PDF…', { id: 'pdf-dl' });
    const originalTransform = sheet.style.transform;
    sheet.style.transform = 'none';
    try {
      const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, allowTaint: true, logging: false });
      sheet.style.transform = originalTransform;
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(img, 'PNG', 0, 0, 210, 297);
      pdf.save(`${invoiceData.docType === 'Proposal' ? 'proposal' : 'invoice'}-${invoiceData.invoiceNumber}.pdf`);
      toast.success('PDF saved', { id: 'pdf-dl' });
    } catch {
      sheet.style.transform = originalTransform;
      toast.error('Failed to generate PDF', { id: 'pdf-dl' });
    }
  };

  const handleAddItemRow = () => {
    updateState((prev) => ({
      ...prev,
      items: [...prev.items, { item: '', hsn: '', qty: 1, price: 0, tax: 18 }],
    }));
  };

  const handleRemoveItemRow = (idx) => {
    updateState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const openCreate = (docType) => {
    setCreateDocType(docType);
    const defaults = blankDocument(docType);
    setModalSelectedTemplate(defaults.template);
    setShowTemplateModal(true);
  };

  const startBuilder = () => {
    const doc = blankDocument(createDocType);
    doc.template = modalSelectedTemplate;
    doc.documentTitle = createDocType === 'Proposal' ? 'Project Proposal' : 'Tax Invoice';
    resetHistory(doc);
    setActiveTemplate(modalSelectedTemplate);
    setOpenSidebarTab(createDocType === 'Proposal' ? 'Proposal' : 'Company');
    setShowTemplateModal(false);
    setView('builder');
  };

  const openExisting = async (inv) => {
    try {
      if (inv._id) {
        const { data } = await api.get(`/invoices/${inv._id}`);
        const mapped = fromApi(data);
        resetHistory(mapped);
        setActiveTemplate(mapped.template || 'corporate');
      } else {
        resetHistory(inv);
        setActiveTemplate(inv.template || 'corporate');
      }
      setOpenSidebarTab(inv.docType === 'Proposal' ? 'Proposal' : 'Company');
      setView('builder');
    } catch {
      toast.error('Could not open document');
    }
  };

  const handleSave = async () => {
    if (!invoiceData.customerName?.trim()) {
      toast.error('Client name is required');
      setOpenSidebarTab('Customer');
      return;
    }
    const validItems = (invoiceData.items || []).filter((i) => (i.item || '').trim());
    if (validItems.length === 0) {
      toast.error('Add at least one line item');
      setOpenSidebarTab('Items');
      return;
    }
    setSaving(true);
    try {
      const payload = toApiPayload({ ...invoiceData, items: validItems }, activeTemplate);
      let saved;
      if (invoiceData._id) {
        const { data } = await api.put(`/invoices/${invoiceData._id}`, payload);
        saved = data;
      } else {
        const { data } = await api.post('/invoices', payload);
        saved = data;
      }
      const mapped = fromApi(saved);
      resetHistory(mapped);
      setActiveTemplate(mapped.template || activeTemplate);
      toast.success(invoiceData.docType === 'Proposal' ? 'Proposal saved' : 'Invoice saved');
      await loadInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!invoiceData._id) {
      toast.error('Save the proposal first');
      return;
    }
    if (invoiceData.docType === 'Invoice') return;
    try {
      const { data } = await api.post(`/invoices/${invoiceData._id}/convert`);
      const mapped = fromApi(data);
      resetHistory(mapped);
      setActiveTemplate('gst');
      toast.success(`Converted to invoice ${mapped.invoiceNumber}`);
      await loadInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Convert failed');
    }
  };

  const handleAiProposal = async () => {
    setIsAiLoading(true);
    try {
      const { data } = await api.post('/ai/proposal-generator', {
        clientData: {
          name: invoiceData.customerName,
          gst: invoiceData.customerGst,
          address: invoiceData.billingAddress,
        },
        dealData: {
          title: invoiceData.projectTitle || 'Project engagement',
          project: invoiceData.projectTitle,
        },
        productDetails: {
          items: invoiceData.items,
          company: invoiceData.companyName,
        },
      });
      const text = typeof data.proposal === 'string' ? data.proposal : JSON.stringify(data.proposal || data, null, 2);
      const sections = { ...emptyProposalSections() };
      if (typeof data.proposal === 'object' && data.proposal) {
        sections.executiveSummary = data.proposal.executiveSummary || data.proposal.summary || text.slice(0, 800);
        sections.scope = data.proposal.scope || data.proposal.scopeOfWork || '';
        sections.timeline = data.proposal.timeline || '';
        sections.callToAction = data.proposal.callToAction || data.proposal.nextSteps || '';
      } else {
        sections.executiveSummary = text.slice(0, 1200);
      }
      updateState((prev) => ({
        ...prev,
        proposalSections: sections,
        termsAndConditions: prev.termsAndConditions || sections.callToAction,
      }));
      setOpenSidebarTab('Proposal');
      toast.success('AI draft filled — review and edit');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI proposal failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyClient = (clientId) => {
    const c = clients.find((x) => x._id === clientId);
    if (!c) {
      updateState((prev) => ({ ...prev, clientId: '' }));
      return;
    }
    updateState((prev) => ({
      ...prev,
      clientId: c._id,
      customerName: c.name || c.companyName || prev.customerName,
      customerGst: c.gstin || c.gst || c.taxId || prev.customerGst,
      billingAddress: c.address || c.billingAddress || prev.billingAddress,
    }));
  };

  const applyProject = (projectId) => {
    const p = projects.find((x) => x._id === projectId);
    if (!p) {
      updateState((prev) => ({ ...prev, projectId: '', projectTitle: '' }));
      return;
    }
    updateState((prev) => ({
      ...prev,
      projectId: p._id,
      projectTitle: p.title || p.name || '',
      customerName: prev.customerName || p.clientName || (typeof p.client === 'object' ? p.client?.name : '') || '',
    }));
  };

  const paidInvoices = invoices.filter((i) => i.status === 'Paid' && i.docType === 'Invoice');
  const cgstCollected = paidInvoices.reduce((s, i) => s + Number(i.cgst || 0), 0);
  const sgstCollected = paidInvoices.reduce((s, i) => s + Number(i.sgst || 0), 0);

  const sidebarTabs = [
    ...(invoiceData.docType === 'Proposal' ? [{ id: 'Proposal', label: 'Proposal copy', icon: FiFileText }] : []),
    { id: 'Company', label: 'Company Info', icon: FiBriefcase },
    { id: 'Customer', label: 'Customer Details', icon: FiUser },
    { id: 'Items', label: 'Products & Lines', icon: FiGrid },
    { id: 'Taxes', label: 'Summary & Taxes', icon: FiPercent },
    { id: 'Payments', label: 'Bank & Notes', icon: FiDollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-800 antialiased">
      {view === 'dashboard' ? (
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <InvoiceBuilderDashboard
            invoices={invoices}
            filter={listFilter}
            onFilterChange={setListFilter}
            onNewDocument={openCreate}
            onSelectInvoice={openExisting}
            cgstCollected={cgstCollected}
            sgstCollected={sgstCollected}
          />

          {showTemplateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {createDocType === 'Proposal' ? 'New project proposal' : 'New GST invoice'}
                  </h2>
                  <p className="text-xs text-slate-400">Pick a layout, then fill company, client, and line items.</p>
                </div>
                <div className="grid max-h-[360px] grid-cols-2 gap-4 overflow-y-auto pr-1">
                  {TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setModalSelectedTemplate(tpl.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        modalSelectedTemplate === tpl.id
                          ? 'border-blue-600 bg-brand/10 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{tpl.title}</span>
                        {tpl.label && (
                          <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand">{tpl.label}</span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{tpl.desc}</p>
                      <div className={`mt-3 h-16 w-full overflow-hidden rounded-lg border border-slate-100 ${tpl.id === 'executive' ? 'bg-[#FBF8F1]' : 'bg-white'}`}>
                        <div className={`h-2 w-full ${tpl.thumb}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setShowTemplateModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="button" onClick={startBuilder} className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand/90">
                    Continue
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-screen flex-col overflow-hidden print:h-auto print:overflow-visible">
          <div className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-xs backdrop-blur-md print:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setView('dashboard'); loadInvoices(); }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <FiArrowLeft className="h-4 w-4" /> Dashboard
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-900">#{invoiceData.invoiceNumber}</span>
              <span className="rounded bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                {invoiceData.docType === 'Proposal' ? 'Proposal' : 'GST Invoice'}
              </span>
              <select
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="corporate">Corporate Classic</option>
                <option value="minimal">Minimal Modern</option>
                <option value="executive">Executive Premium</option>
                <option value="gst">GST Business</option>
                <option value="creative">Creative Agency</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" title="Undo">
                <FiRotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" title="Redo">
                <FiRotateCw className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-200" />
              {invoiceData.docType === 'Proposal' && (
                <button
                  type="button"
                  onClick={handleAiProposal}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiCpu className="h-3.5 w-3.5" /> {isAiLoading ? 'Drafting…' : 'AI draft'}
                </button>
              )}
              {invoiceData.docType === 'Proposal' && invoiceData._id && (
                <button
                  type="button"
                  onClick={handleConvert}
                  className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" /> To GST invoice
                </button>
              )}
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand/90 disabled:opacity-60">
                <FiSave className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={downloadPdf} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <FiDownload className="h-3.5 w-3.5" /> PDF
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <FiPrinter className="h-3.5 w-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareLink(`${window.location.origin}/crm/invoices?id=${invoiceData._id || invoiceData.invoiceNumber}`);
                  setShowShareModal(true);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FiShare2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
            <div className="flex h-full w-[18%] shrink-0 select-none flex-col space-y-2 overflow-y-auto border-r border-slate-200 bg-white p-4 print:hidden">
              <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Properties</span>
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOpenSidebarTab(tab.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                    openSidebarTab === tab.id ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex h-full w-[37%] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-6 print:hidden">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-900">Editor: {openSidebarTab}</h3>
              </div>

              <div className="flex-1 space-y-4 text-xs">
                <AnimatePresence mode="wait">
                  {openSidebarTab === 'Proposal' && (
                    <motion.div key="Proposal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <p className="text-[11px] text-slate-500">These sections print in terms / notes. Use AI draft to fill, then edit.</p>
                      {[
                        ['executiveSummary', 'Executive summary'],
                        ['scope', 'Scope of work'],
                        ['timeline', 'Timeline'],
                        ['callToAction', 'Next steps / CTA'],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                          <textarea
                            rows={3}
                            value={invoiceData.proposalSections?.[key] || ''}
                            onChange={(e) => updateState((prev) => ({
                              ...prev,
                              proposalSections: { ...prev.proposalSections, [key]: e.target.value },
                            }))}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAiProposal}
                        disabled={isAiLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 font-semibold text-slate-600 hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        <FiCpu className="h-4 w-4" /> {isAiLoading ? 'Generating…' : 'Generate with AI'}
                      </button>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Company' && (
                    <motion.div key="Company" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="mb-2 cursor-pointer rounded-lg border border-dashed border-slate-200 p-2 text-center hover:bg-slate-50">
                        <label className="block cursor-pointer text-[10px] font-bold text-slate-500">
                          <FiUpload className="mx-auto mb-1 h-4 w-4 text-slate-400" /> Upload Company Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Name</label>
                        <input type="text" value={invoiceData.companyName} onChange={(e) => updateState({ ...invoiceData, companyName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:outline-none focus:ring-1 focus:ring-brand/30" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GSTIN</label>
                        <input type="text" value={invoiceData.companyGst} onChange={(e) => updateState({ ...invoiceData, companyGst: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Address</label>
                        <textarea rows="2" value={invoiceData.companyAddress} onChange={(e) => updateState({ ...invoiceData, companyAddress: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                          <input type="text" value={invoiceData.companyPhone} onChange={(e) => updateState({ ...invoiceData, companyPhone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                          <input type="email" value={invoiceData.companyEmail} onChange={(e) => updateState({ ...invoiceData, companyEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doc date</label>
                          <input type="date" value={invoiceData.invoiceDate} onChange={(e) => updateState({ ...invoiceData, invoiceDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due / valid until</label>
                          <input type="date" value={invoiceData.dueDate} onChange={(e) => updateState({ ...invoiceData, dueDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Customer' && (
                    <motion.div key="Customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      {clients.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link CRM client</label>
                          <select value={invoiceData.clientId || ''} onChange={(e) => applyClient(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2">
                            <option value="">— Manual entry —</option>
                            {clients.map((c) => (
                              <option key={c._id} value={c._id}>{c.name || c.companyName}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {projects.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link project (optional)</label>
                          <select value={invoiceData.projectId || ''} onChange={(e) => applyProject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2">
                            <option value="">— None —</option>
                            {projects.map((p) => (
                              <option key={p._id} value={p._id}>{p.title || p.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client Name</label>
                        <input type="text" value={invoiceData.customerName} onChange={(e) => updateState({ ...invoiceData, customerName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GSTIN</label>
                        <input type="text" value={invoiceData.customerGst} onChange={(e) => updateState({ ...invoiceData, customerGst: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billing Address</label>
                        <textarea rows="2" value={invoiceData.billingAddress} onChange={(e) => updateState({ ...invoiceData, billingAddress: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Items' && (
                    <motion.div key="Items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="space-y-3">
                        {invoiceData.items.map((item, idx) => (
                          <div key={idx} className="relative space-y-2 rounded-xl border border-slate-200 bg-slate-50/20 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">Row #{idx + 1}</span>
                              <button type="button" onClick={() => handleRemoveItemRow(idx)} className="rounded p-1 text-slate-400 hover:text-rose-600">
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Description…"
                              value={item.item}
                              onChange={(e) => {
                                const next = [...invoiceData.items];
                                next[idx] = { ...next[idx], item: e.target.value };
                                updateState({ ...invoiceData, items: next });
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold"
                            />
                            <div className="grid grid-cols-4 gap-1.5">
                              <input type="text" placeholder="HSN/SAC" value={item.hsn} onChange={(e) => { const next = [...invoiceData.items]; next[idx] = { ...next[idx], hsn: e.target.value }; updateState({ ...invoiceData, items: next }); }} className="rounded-lg border border-slate-200 bg-white p-1.5" />
                              <input type="number" placeholder="Qty" value={item.qty || ''} onChange={(e) => { const next = [...invoiceData.items]; next[idx] = { ...next[idx], qty: Number(e.target.value) }; updateState({ ...invoiceData, items: next }); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-right" />
                              <input type="number" placeholder="Rate" value={item.price || ''} onChange={(e) => { const next = [...invoiceData.items]; next[idx] = { ...next[idx], price: Number(e.target.value) }; updateState({ ...invoiceData, items: next }); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-right" />
                              <input type="number" placeholder="Tax%" value={item.tax || ''} onChange={(e) => { const next = [...invoiceData.items]; next[idx] = { ...next[idx], tax: Number(e.target.value) }; updateState({ ...invoiceData, items: next }); }} className="rounded-lg border border-slate-200 bg-white p-1.5 text-right" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={handleAddItemRow} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-2.5 font-semibold text-slate-500 hover:border-blue-600 hover:text-brand">
                        <FiPlusCircle className="h-4 w-4" /> Add Row
                      </button>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Taxes' && (
                    <motion.div key="Taxes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Advance / received</label>
                        <input type="number" value={invoiceData.advancePaid || ''} onChange={(e) => updateState({ ...invoiceData, advancePaid: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-right" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400">Subtotal</span>
                          <span className="mt-1 block text-sm font-bold text-slate-900">₹{(invoiceData.subtotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400">CGST + SGST</span>
                          <span className="mt-1 block text-sm font-bold text-slate-900">₹{((invoiceData.cgst || 0) + (invoiceData.sgst || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400">Grand Total</span>
                          <span className="mt-1 block text-sm font-bold text-slate-900">₹{(invoiceData.total || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400">Balance</span>
                          <span className="mt-1 block text-sm font-bold text-rose-600">₹{(invoiceData.pendingAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Payments' && (
                    <motion.div key="Payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</label>
                        <textarea rows="4" value={invoiceData.termsAndConditions} onChange={(e) => updateState({ ...invoiceData, termsAndConditions: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      {invoiceData.docType === 'Proposal' && (invoiceData.proposalSections?.executiveSummary || invoiceData.proposalSections?.scope) && (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-brand"
                          onClick={() => {
                            const s = invoiceData.proposalSections || {};
                            const merged = [s.executiveSummary && `Summary:\n${s.executiveSummary}`, s.scope && `Scope:\n${s.scope}`, s.timeline && `Timeline:\n${s.timeline}`, s.callToAction && `Next steps:\n${s.callToAction}`].filter(Boolean).join('\n\n');
                            updateState({ ...invoiceData, termsAndConditions: merged });
                            toast.success('Proposal sections copied into terms');
                          }}
                        >
                          Copy proposal sections into terms
                        </button>
                      )}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Name</label>
                        <input type="text" value={invoiceData.bankName} onChange={(e) => updateState({ ...invoiceData, bankName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account No</label>
                        <input type="text" value={invoiceData.accountNumber} onChange={(e) => updateState({ ...invoiceData, accountNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IFSC Code</label>
                        <input type="text" value={invoiceData.ifscCode} onChange={(e) => updateState({ ...invoiceData, ifscCode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex h-full w-[45%] shrink-0 flex-col overflow-hidden bg-[#F1F5F9] print:h-auto print:w-full print:overflow-visible print:bg-white">
              <div className="flex h-12 shrink-0 select-none items-center justify-between border-b border-slate-200 bg-white px-4 print:hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview</span>
                <select value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none">
                  <option value={0.5}>Zoom 50%</option>
                  <option value={0.75}>Zoom 75%</option>
                  <option value={0.85}>Zoom 85%</option>
                  <option value={1}>Zoom 100%</option>
                </select>
              </div>
              <div className="flex flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-6">
                <LiveInvoicePreview
                  data={{
                    ...invoiceData,
                    documentTitle: invoiceData.docType === 'Proposal' ? 'Project Proposal' : (activeTemplate === 'gst' ? 'Tax Invoice' : invoiceData.documentTitle),
                  }}
                  activeTemplate={activeTemplate}
                  zoom={zoomLevel}
                  orientation={orientation}
                />
              </div>
            </div>
          </div>

          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Share link</h3>
                  <button type="button" onClick={() => setShowShareModal(false)} className="text-lg font-bold text-slate-400 hover:text-slate-600">×</button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  onClick={(e) => {
                    e.target.select();
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Copied');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center font-mono text-xs text-slate-600"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
