import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFileText, FiUser, FiLayers, FiDollarSign, FiPercent, FiEdit2, 
  FiTrash2, FiCopy, FiPlus, FiPrinter, FiDownload, FiShare2, 
  FiSave, FiRotateCcw, FiRotateCw, FiCpu, FiPlusCircle, FiArrowLeft,
  FiUpload, FiSearch, FiGlobe, FiSettings, FiBriefcase, FiGrid,
  FiLayout
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LiveInvoicePreview } from '../../components/InvoiceTemplates';
import InvoiceBuilderDashboard from '../../components/InvoiceBuilderDashboard';
import api from '../../services/api';

const DEFAULT_INVOICE = {
  invoiceNumber: 'PI-2026-001',
  invoiceDate: '2026-06-29',
  dueDate: '2026-07-29',
  
  // Company
  companyName: 'VASTORA TECH PVT. LTD.',
  companyGst: '09AALCV1860D1Z8',
  companyAddress: '202, JS Acade Above PNB Bank Sector-51 Noida',
  companyPhone: '+91 8595658592',
  companyEmail: 'info@vastoratech.in',
  logoUrl: '/logo.png',

  // Customer
  customerName: 'ILMIC HEALTH CARE PVT.LTD.',
  customerGst: '07AAGCI2794C1ZL',
  billingAddress: 'House No.324, Block-C, Inder Enclave, New Delhi-11008',

  // Items
  items: [
    { item: 'User Website & Admin Pannel Development', hsn: '998314', qty: 1, price: 30000, tax: 18 },
    { item: 'Hosting web app server', hsn: '998315', qty: 1, price: 8439, tax: 18 }
  ],

  // Calculations
  subtotal: 38439,
  cgst: 3459.51,
  sgst: 3459.51,
  total: 45358.02,
  advancePaid: 30000,
  pendingAmount: 15358.02,

  // Notes & Bank
  termsAndConditions: '1. 50% advance payment is required before project initiation.\n2. Project timelines are subject to timely client feedback.\n3. Source code will be handed over only after full payment.\n4. Post-launch support is provided for 30 days.',
  bankName: 'Vastora Tech Pvt Ltd.',
  accountNumber: '1508 1021 00000 749',
  ifscCode: 'PUNB0150810',
  currency: '₹'
};

export default function Invoices() {
  const [view, setView] = useState('dashboard');
  const [invoices, setInvoices] = useState([
    { invoiceNumber: 'PI-2026-001', customerName: 'ILMIC HEALTH CARE PVT.LTD.', invoiceDate: '2026-06-29', total: 45358.02, status: 'Pending' },
    { invoiceNumber: 'PI-2026-002', customerName: 'Acme Software Corp', invoiceDate: '2026-07-02', total: 120000, status: 'Paid' },
    { invoiceNumber: 'PI-2026-003', customerName: 'Globex Holdings', invoiceDate: '2026-07-15', total: 85000, status: 'Overdue' }
  ]);
  const [openSidebarTab, setOpenSidebarTab] = useState('Company');
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [orientation, setOrientation] = useState('portrait');
  
  const [activeTemplate, setActiveTemplate] = useState('corporate');
  const [invoiceData, setInvoiceData] = useState(DEFAULT_INVOICE);
  const [history, setHistory] = useState([DEFAULT_INVOICE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Template Modal Selector
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [modalSelectedTemplate, setModalSelectedTemplate] = useState('corporate');

  // AI Prompts
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [excelPasteText, setExcelPasteText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map(inv => ({
          ...DEFAULT_INVOICE,
          _id: inv._id,
          invoiceNumber: inv.number || 'PI-2026-001',
          customerName: inv.clientName || 'Client Name',
          total: inv.total || 0,
          status: inv.status || 'Draft'
        }));
        setInvoices(mapped);
      }
    } catch (e) {
      console.log('Unable to connect to registry services', e);
    }
  };

  const updateState = (newValOrFn) => {
    setInvoiceData(prev => {
      const next = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      const calculated = recalculate(next);
      
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(calculated);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      return calculated;
    });
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
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateState(prev => ({ ...prev, [key]: reader.result }));
        toast.success('Asset uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const downloadPdf = async () => {
    const sheet = document.getElementById('a4-invoice-sheet');
    if (!sheet) return;
    toast.loading('Generating vector PDF...', { id: 'pdf-dl' });

    // Temporarily reset transform to avoid html2canvas scale coordinate bugs
    const originalTransform = sheet.style.transform;
    sheet.style.transform = 'none';

    try {
      const canvas = await html2canvas(sheet, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      // Restore transform
      sheet.style.transform = originalTransform;

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(img, 'PNG', 0, 0, 210, 297);
      pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
      toast.dismiss('pdf-dl');
      toast.success('PDF successfully saved!');
    } catch (err) {
      sheet.style.transform = originalTransform;
      toast.dismiss('pdf-dl');
      toast.error('Failed to generate PDF');
    }
  };

  const recalculate = (data) => {
    let sub = 0;
    data.items.forEach(item => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      sub += qty * price;
    });

    const taxAmt = sub * 0.09;
    const finalTotal = sub + (taxAmt * 2);
    const pending = finalTotal - Number(data.advancePaid || 0);

    return {
      ...data,
      subtotal: sub,
      cgst: taxAmt,
      sgst: taxAmt,
      total: finalTotal,
      pendingAmount: pending
    };
  };

  const handleAddItemRow = () => {
    updateState(prev => ({
      ...prev,
      items: [...prev.items, { item: '', hsn: '', qty: 1, price: 0, tax: 18 }]
    }));
  };

  const handleRemoveItemRow = (idx) => {
    updateState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans antialiased text-slate-800">
      {view === 'dashboard' ? (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
          <InvoiceBuilderDashboard 
            invoices={invoices} 
            onNewInvoice={() => {
              setInvoiceData(DEFAULT_INVOICE);
              setShowTemplateModal(true);
            }} 
            onSelectInvoice={(inv) => {
              setInvoiceData(inv);
              setView('builder');
            }} 
          />

          {/* Choose Invoice Template Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Choose Invoice Template</h2>
                  <p className="text-xs text-slate-400">Select one of our 5 premium, brand-focused layouts to build your document.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
                  {[
                    { id: 'corporate', title: 'Corporate Classic', desc: 'Blue GST table, company letterhead. IT / SaaS default.', label: 'Default', thumb: 'bg-[#1E51A4]' },
                    { id: 'minimal', title: 'Minimal Modern', desc: 'Black & white, no grid. Startup / product invoices.', thumb: 'bg-neutral-900' },
                    { id: 'executive', title: 'Executive Premium', desc: 'Dark gold letterhead, cream paper. Enterprise retainers.', thumb: 'bg-[#92400E]' },
                    { id: 'gst', title: 'GST Business', desc: 'Teal tax invoice boxes, HSN, CGST/SGST. Indian GST.', thumb: 'bg-teal-800' },
                    { id: 'creative', title: 'Creative Agency', desc: 'Clean two-column header, simple line items.', thumb: 'bg-slate-700' }
                  ].map((tpl) => (
                    <div 
                      key={tpl.id}
                      onClick={() => setModalSelectedTemplate(tpl.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        modalSelectedTemplate === tpl.id 
                          ? 'border-blue-600 bg-blue-50/10 ring-1 ring-blue-600' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{tpl.title}</span>
                        {tpl.label && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {tpl.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{tpl.desc}</p>
                      <div className={`mt-3 h-16 w-full overflow-hidden rounded-lg border border-slate-100 ${tpl.id === 'executive' ? 'bg-[#FBF8F1]' : 'bg-white'}`}>
                        <div className={`h-2 w-full ${tpl.thumb}`} />
                        <div className="px-2 py-1.5 space-y-1">
                          <div className="h-1 w-1/2 rounded bg-slate-200" />
                          <div className="h-1 w-full rounded bg-slate-100" />
                          <div className="h-1 w-3/4 rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => setShowTemplateModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTemplate(modalSelectedTemplate);
                      setShowTemplateModal(false);
                      setView('builder');
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
          {/* Top Glassmorphic Toolbar */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 shadow-xs z-30 shrink-0 print:hidden">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <FiArrowLeft className="h-4 w-4" /> Dashboard
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                #{invoiceData.invoiceNumber}
              </span>
              <div className="h-4 w-[1px] bg-slate-200" />
              <select 
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="corporate">Corporate Classic</option>
                <option value="minimal">Minimal Modern</option>
                <option value="executive">Executive Premium</option>
                <option value="gst">GST Business</option>
                <option value="creative">Creative Agency</option>
              </select>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-2">
              <button onClick={handleUndo} disabled={historyIndex <= 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" title="Undo">
                <FiRotateCcw className="h-4 w-4" />
              </button>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" title="Redo">
                <FiRotateCw className="h-4 w-4" />
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <button onClick={downloadPdf} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <FiDownload className="h-3.5 w-3.5" /> PDF
              </button>
              <button onClick={triggerPrint} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <FiPrinter className="h-3.5 w-3.5" /> Print
              </button>
              <button onClick={() => {
                setShareLink(`${window.location.origin}/invoice/${invoiceData.invoiceNumber}`);
                setShowShareModal(true);
              }} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
                <FiShare2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>

          {/* 3-Column Studio Workspace */}
          <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
            
            {/* COLUMN 1: Left Sidebar (18% width) */}
            <div className="w-[18%] border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto p-4 space-y-2 shrink-0 print:hidden select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">Properties</span>
              {[
                { id: 'Company', label: 'Company Info', icon: FiBriefcase },
                { id: 'Customer', label: 'Customer Details', icon: FiUser },
                { id: 'Items', label: 'Products & Lines', icon: FiGrid },
                { id: 'Taxes', label: 'Summary & Taxes', icon: FiPercent },
                { id: 'Payments', label: 'Bank & Notes', icon: FiDollarSign }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOpenSidebarTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    openSidebarTab === tab.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* COLUMN 2: Center Editor Form (37% width) */}
            <div className="w-[37%] border-r border-slate-200 bg-white flex flex-col h-full overflow-y-auto p-6 shrink-0 print:hidden">
              <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Editor: {openSidebarTab}</h3>
              </div>

              <div className="flex-1 space-y-4 text-xs">
                <AnimatePresence mode="wait">
                  
                  {openSidebarTab === 'Company' && (
                    <motion.div key="Company" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center hover:bg-slate-50 cursor-pointer mb-2">
                        <label className="text-[10px] font-bold text-slate-500 block cursor-pointer">
                          <FiUpload className="mx-auto h-4 w-4 mb-1 text-slate-400" /> Upload Company Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                        </label>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Name</label>
                        <input 
                          type="text" 
                          value={invoiceData.companyName}
                          onChange={(e) => updateState({ ...invoiceData, companyName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GSTIN</label>
                        <input 
                          type="text" 
                          value={invoiceData.companyGst}
                          onChange={(e) => updateState({ ...invoiceData, companyGst: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:ring-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Address</label>
                        <textarea 
                          rows="2"
                          value={invoiceData.companyAddress}
                          onChange={(e) => updateState({ ...invoiceData, companyAddress: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2 focus:ring-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                          <input 
                            type="text" 
                            value={invoiceData.companyPhone}
                            onChange={(e) => updateState({ ...invoiceData, companyPhone: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                          <input 
                            type="email" 
                            value={invoiceData.companyEmail}
                            onChange={(e) => updateState({ ...invoiceData, companyEmail: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Customer' && (
                    <motion.div key="Customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client Name</label>
                        <input 
                          type="text" 
                          value={invoiceData.customerName}
                          onChange={(e) => updateState({ ...invoiceData, customerName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GSTIN</label>
                        <input 
                          type="text" 
                          value={invoiceData.customerGst}
                          onChange={(e) => updateState({ ...invoiceData, customerGst: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billing Address</label>
                        <textarea 
                          rows="2"
                          value={invoiceData.billingAddress}
                          onChange={(e) => updateState({ ...invoiceData, billingAddress: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Items' && (
                    <motion.div key="Items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="space-y-3">
                        {invoiceData.items.map((item, idx) => (
                          <div 
                            key={idx}
                            className="border border-slate-200 rounded-xl p-3 bg-slate-50/20 space-y-2 relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-400 text-[10px]">Row #{idx + 1}</span>
                              <button 
                                onClick={() => handleRemoveItemRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <input 
                              type="text"
                              placeholder="Description..."
                              value={item.item}
                              onChange={(e) => {
                                const next = [...invoiceData.items];
                                next[idx].item = e.target.value;
                                updateState({ ...invoiceData, items: next });
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold"
                            />

                            <div className="grid grid-cols-4 gap-1.5">
                              <input 
                                type="text" 
                                placeholder="HSN/SAC"
                                value={item.hsn}
                                onChange={(e) => {
                                  const next = [...invoiceData.items];
                                  next[idx].hsn = e.target.value;
                                  updateState({ ...invoiceData, items: next });
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-1.5"
                              />
                              <input 
                                type="number" 
                                placeholder="Qty"
                                value={item.qty || ''}
                                onChange={(e) => {
                                  const next = [...invoiceData.items];
                                  next[idx].qty = Number(e.target.value);
                                  updateState({ ...invoiceData, items: next });
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-right"
                              />
                              <input 
                                type="number" 
                                placeholder="Rate"
                                value={item.price || ''}
                                onChange={(e) => {
                                  const next = [...invoiceData.items];
                                  next[idx].price = Number(e.target.value);
                                  updateState({ ...invoiceData, items: next });
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-right"
                              />
                              <input 
                                type="number" 
                                placeholder="Tax%"
                                value={item.tax || ''}
                                onChange={(e) => {
                                  const next = [...invoiceData.items];
                                  next[idx].tax = Number(e.target.value);
                                  updateState({ ...invoiceData, items: next });
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-right"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleAddItemRow}
                        className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-2.5 font-semibold text-slate-500 hover:border-blue-600 hover:text-blue-600"
                      >
                        <FiPlusCircle className="h-4 w-4" /> Add Row
                      </button>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Taxes' && (
                    <motion.div key="Taxes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received Total</label>
                        <input 
                          type="number" 
                          value={invoiceData.advancePaid || ''}
                          onChange={(e) => updateState({ ...invoiceData, advancePaid: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-right"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total</span>
                          <span className="font-bold text-slate-900 text-sm mt-1 block">₹{invoiceData.total.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pending Total</span>
                          <span className="font-bold text-rose-600 text-sm mt-1 block">₹{invoiceData.pendingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {openSidebarTab === 'Payments' && (
                    <motion.div key="Payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center hover:bg-slate-50 cursor-pointer">
                          <label className="text-[10px] font-bold text-slate-500 block cursor-pointer">
                            <FiUpload className="mx-auto h-4 w-4 mb-1 text-slate-400" /> Signature
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signatureUrl')} />
                          </label>
                        </div>
                        <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center hover:bg-slate-50 cursor-pointer">
                          <label className="text-[10px] font-bold text-slate-500 block cursor-pointer">
                            <FiUpload className="mx-auto h-4 w-4 mb-1 text-slate-400" /> Stamp Logo
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'stampUrl')} />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</label>
                        <textarea 
                          rows="4"
                          value={invoiceData.termsAndConditions}
                          onChange={(e) => updateState({ ...invoiceData, termsAndConditions: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Name</label>
                        <input 
                          type="text" 
                          value={invoiceData.bankName}
                          onChange={(e) => updateState({ ...invoiceData, bankName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account No</label>
                        <input 
                          type="text" 
                          value={invoiceData.accountNumber}
                          onChange={(e) => updateState({ ...invoiceData, accountNumber: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IFSC Code</label>
                        <input 
                          type="text" 
                          value={invoiceData.ifscCode}
                          onChange={(e) => updateState({ ...invoiceData, ifscCode: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                        />
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

            {/* COLUMN 3: Right Live A4 Preview (45% width) */}
            <div className="w-[45%] bg-[#F1F5F9] flex flex-col h-full overflow-hidden shrink-0 print:bg-white print:w-full print:h-auto print:overflow-visible">
              
              {/* Zoom Controller bar */}
              <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 shrink-0 select-none print:hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview Scale</span>
                <select 
                  value={zoomLevel} 
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white focus:outline-none"
                >
                  <option value={0.5}>Zoom 50%</option>
                  <option value={0.75}>Zoom 75%</option>
                  <option value={0.85}>Zoom 85%</option>
                  <option value={1}>Zoom 100%</option>
                </select>
              </div>

              {/* Scrollable container that isolates the scaled A4 paper sheet */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col items-center">
                <LiveInvoicePreview 
                  data={invoiceData} 
                  activeTemplate={activeTemplate}
                  zoom={zoomLevel} 
                  orientation={orientation} 
                />
              </div>

            </div>

          </div>

          {/* Share Modal */}
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-950">Invoice Access URL</h3>
                  <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareLink)}`} 
                    alt="Access QR" 
                    className="h-36 w-36 border border-slate-100 rounded-xl p-2" 
                  />
                  <div className="w-full text-center space-y-2">
                    <span className="text-xs text-slate-400 block font-semibold">Copy Share Link</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={shareLink} 
                      onClick={(e) => {
                        e.target.select();
                        navigator.clipboard.writeText(shareLink);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-center cursor-pointer bg-slate-50 font-mono text-slate-600" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
