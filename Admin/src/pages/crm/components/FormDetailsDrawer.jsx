import React, { useState } from 'react';
import {
  FiX,
  FiExternalLink,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiCalendar,
  FiBriefcase,
  FiLayers,
  FiImage,
  FiCheckCircle,
  FiGlobe,
  FiDownload,
  FiEye,
  FiShare2,
  FiFileText,
  FiTag,
  FiClock,
  FiMapPin,
  FiCheck,
  FiMaximize2,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';
import { getFileUrl } from '../../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['New', 'In Review', 'Contacted', 'Converted', 'Archived'];

const STATUS_COLORS = {
  New: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  'In Review': 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Contacted: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  Converted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const FormDetailsDrawer = ({ form, isOpen, onClose, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [currentStatus, setCurrentStatus] = useState(form?.status || 'New');
  const [internalNotes, setInternalNotes] = useState(form?.internalNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  if (!isOpen || !form) return null;

  const {
    submissionId,
    submissionDate,
    createdAt,
    sourceWebsite,
    businessDetails = {},
    websitePages = {},
    businessInfo = {},
    websiteDesign = {},
    contactDetails = {},
    additionalRequirements = {},
  } = form;

  const handleStatusSelect = async (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    if (onStatusChange) {
      await onStatusChange(form._id, newStatus, internalNotes);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      if (onStatusChange) {
        await onStatusChange(form._id, currentStatus, internalNotes);
      }
      toast.success('Internal notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatPhoneForWa = (rawPhone) => {
    if (!rawPhone) return '';
    const clean = String(rawPhone).replace(/[^0-9]/g, '');
    return clean.length === 10 ? `91${clean}` : clean;
  };

  const mobileNum = businessDetails.mobileNumber || contactDetails.phone || '';
  const waNum = businessDetails.whatsappNumber || contactDetails.whatsappNumber || mobileNum;
  const emailAddr = businessDetails.emailAddress || contactDetails.email || '';

  const waNumberClean = formatPhoneForWa(waNum);
  const waUrl = waNumberClean
    ? `https://wa.me/${waNumberClean}?text=Hi%20${encodeURIComponent(businessDetails.ownerName || 'there')},%20thank%20you%20for%20submitting%20your%20website%20requirements%20to%20ApnaDigital.`
    : null;

  const selectedPagesList = Array.isArray(websitePages.selectedPages) ? websitePages.selectedPages : [];

  // Group business images by page name
  const rawBusinessImages = Array.isArray(websiteDesign.businessImages) ? websiteDesign.businessImages : [];
  const groupedImages = {};
  rawBusinessImages.forEach((img) => {
    const pName = (img.pageName || 'General').trim();
    if (!groupedImages[pName]) groupedImages[pName] = [];
    groupedImages[pName].push(img);
  });

  // Also support legacy pageImages if present
  if (Array.isArray(websitePages.pageImages)) {
    websitePages.pageImages.forEach((group) => {
      if (group.pageName && Array.isArray(group.images)) {
        if (!groupedImages[group.pageName]) groupedImages[group.pageName] = [];
        group.images.forEach((img) => groupedImages[group.pageName].push(img));
      }
    });
  }

  const logoObj = websiteDesign.logo || (websiteDesign.logoUrl ? { url: websiteDesign.logoUrl, originalName: 'logo' } : null);

  const displayDate = submissionDate || createdAt;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not Provided';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="relative flex h-full w-full max-w-4xl flex-col bg-surface shadow-2xl border-l border-line animate-in slide-in-from-right duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-soft/40">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand/10 border border-brand/20 px-2 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                {sourceWebsite || 'ApnaDigital'}
              </span>
              {submissionId && (
                <span className="rounded bg-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-ink border border-line">
                  {submissionId}
                </span>
              )}
              <span className="text-xs text-muted flex items-center gap-1">
                <FiCalendar className="h-3 w-3" />
                Submitted on: <span className="font-medium text-ink">{formattedDate}</span>
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-ink truncate">
              {businessDetails.businessName || 'Untitled Submission'}
            </h2>
            <p className="text-xs text-muted">
              Owner: <span className="font-medium text-ink">{businessDetails.ownerName || 'Not Provided'}</span> • Category: <span className="font-medium text-ink">{businessDetails.businessCategory || 'Not Provided'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="form-status-select" className="text-xs text-muted font-medium">Status:</label>
              <select
                id="form-status-select"
                value={currentStatus}
                onChange={handleStatusSelect}
                aria-label="Update submission status"
                className={`h-8 rounded-full border px-3 text-xs font-semibold focus:outline-none cursor-pointer ${STATUS_COLORS[currentStatus] || 'bg-soft text-ink'}`}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st} className="bg-surface text-ink">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick WhatsApp */}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                title="Open WhatsApp chat"
              >
                <FiMessageSquare className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}

            {/* Quick Email */}
            {emailAddr && (
              <a
                href={`mailto:${emailAddr}?subject=ApnaDigital Website Requirements - ${encodeURIComponent(businessDetails.businessName || 'Website Proposal')}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-soft transition-colors"
                title="Send Email"
              >
                <FiMail className="h-3.5 w-3.5" /> Email
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink transition-colors"
              title="Close drawer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-line bg-surface px-6 text-xs font-medium no-scrollbar">
          {[
            { id: 'all', label: 'All 6 Sections' },
            { id: 'sec-1', label: '1. Business Details' },
            { id: 'sec-2', label: '2. Website Pages' },
            { id: 'sec-3', label: '3. Business Information' },
            { id: 'sec-4', label: '4. Website Design' },
            { id: 'sec-5', label: '5. Contact & Social' },
            { id: 'sec-6', label: '6. Additional Requirements' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand font-bold text-brand'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ──────────────── 1. Business Details ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-1') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiBriefcase className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  1. Business Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1 font-medium">Business Name</span>
                  <p className="font-semibold text-ink text-sm">
                    {businessDetails.businessName || <span className="text-muted italic">Not Provided</span>}
                  </p>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">Owner Name</span>
                  <p className="font-semibold text-ink text-sm">
                    {businessDetails.ownerName || <span className="text-muted italic">Not Provided</span>}
                  </p>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">Business Category</span>
                  {businessDetails.businessCategory ? (
                    <span className="inline-block rounded-md bg-soft px-2.5 py-1 font-medium text-ink border border-line">
                      {businessDetails.businessCategory}
                    </span>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">Mobile Number</span>
                  {mobileNum ? (
                    <a
                      href={`tel:${mobileNum}`}
                      className="font-semibold text-brand hover:underline inline-flex items-center gap-1.5 font-mono text-sm"
                    >
                      <FiPhone className="h-3 w-3" /> {mobileNum}
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">WhatsApp Number</span>
                  {waNum ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink font-semibold text-sm">{waNum}</span>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/20 inline-flex items-center gap-1"
                        >
                          <FiMessageSquare className="h-3 w-3" /> Chat
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">Email Address</span>
                  {emailAddr ? (
                    <a
                      href={`mailto:${emailAddr}`}
                      className="font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
                    >
                      <FiMail className="h-3 w-3" /> {emailAddr}
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <span className="text-muted block mb-1 font-medium">Business Address</span>
                  {businessDetails.businessAddress ? (
                    <p className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line flex items-center gap-2">
                      <FiMapPin className="h-4 w-4 text-brand shrink-0" />
                      {businessDetails.businessAddress}
                    </p>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ──────────────── 2. Website Pages ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-2') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiLayers className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  2. Website Pages
                </h3>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted block mb-2.5">Selected Website Pages:</span>
                {selectedPagesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedPagesList.map((pageName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand shadow-2xs"
                      >
                        <FiCheckCircle className="h-3.5 w-3.5 text-brand" /> {pageName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Not Provided</p>
                )}
              </div>
            </section>
          )}

          {/* ──────────────── 3. Business Information ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-3') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiGlobe className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  3. Business Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1 font-semibold">About Business</span>
                  <div className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line whitespace-pre-line min-h-[50px]">
                    {businessInfo.aboutBusiness || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-semibold">Services or Products</span>
                  <div className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line whitespace-pre-line min-h-[50px]">
                    {businessInfo.servicesOrProducts || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted block mb-1 font-semibold">Business Description</span>
                  <div className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line whitespace-pre-line min-h-[50px]">
                    {businessInfo.businessDescription || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-semibold">Business Working Hours</span>
                  <div className="font-medium text-ink bg-soft/40 p-2.5 rounded-lg border border-line flex items-center gap-2">
                    <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                    {businessInfo.businessWorkingHours || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-semibold">Business Location</span>
                  <div className="font-medium text-ink bg-soft/40 p-2.5 rounded-lg border border-line flex items-center gap-2">
                    <FiMapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                    {businessInfo.businessLocation || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ──────────────── 4. Website Design ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-4') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiTag className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  4. Website Design & Media
                </h3>
              </div>

              {/* Preferred Color & Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1 font-semibold">Preferred Color</span>
                  <p className="font-semibold text-ink bg-soft/40 p-2.5 rounded-lg border border-line">
                    {websiteDesign.preferredColor || <span className="text-muted italic font-normal">Not Provided</span>}
                  </p>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-semibold">Preferred Theme</span>
                  <p className="font-semibold text-ink bg-soft/40 p-2.5 rounded-lg border border-line">
                    {websiteDesign.preferredTheme || <span className="text-muted italic font-normal">Not Provided</span>}
                  </p>
                </div>
              </div>

              {/* Uploaded Logo */}
              <div className="rounded-xl border border-line bg-soft/30 p-4">
                <span className="text-xs font-semibold text-muted block mb-2.5">Uploaded Logo:</span>
                {logoObj?.url ? (
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Clickable Image Preview */}
                    <div
                      className="group relative h-24 w-40 rounded-lg border border-line bg-surface p-2 flex items-center justify-center overflow-hidden shadow-2xs cursor-pointer hover:border-brand transition-colors"
                      onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                      title="Click to enlarge logo preview"
                    >
                      <img
                        src={getFileUrl(logoObj.url)}
                        alt="Business Logo"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <span className="hidden text-xs text-muted">Preview unavailable</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FiMaximize2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    {/* Metadata & Open Stored File Link */}
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold text-ink">{logoObj.originalName || 'Business Logo'}</p>
                      {logoObj.size ? (
                        <p className="text-[11px] text-muted">{(logoObj.size / 1024).toFixed(1)} KB • {logoObj.mimeType || 'image'}</p>
                      ) : null}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                          className="inline-flex items-center gap-1 rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft"
                        >
                          <FiEye className="h-3 w-3" /> Preview
                        </button>
                        <a
                          href={getFileUrl(logoObj.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/20"
                        >
                          <FiExternalLink className="h-3 w-3" /> Open Stored File
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Not Provided</p>
                )}
              </div>

              {/* Business Images Grouped by Page Name */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <FiImage className="h-3.5 w-3.5 text-brand" /> Business Images (Grouped by Associated Page)
                  </h4>
                  <span className="text-[11px] text-muted">
                    {Object.values(groupedImages).reduce((acc, arr) => acc + arr.length, 0)} images total
                  </span>
                </div>

                {Object.keys(groupedImages).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedImages).map(([pName, imgs]) => (
                      <div key={pName} className="rounded-xl border border-line bg-soft/20 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-line pb-2">
                          <span className="text-xs font-bold text-ink flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand"></span>
                            {pName} Page ({imgs.length} image{imgs.length !== 1 ? 's' : ''})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {imgs.map((img, iIdx) => {
                            const resolvedUrl = getFileUrl(img.url);
                            return (
                              <div
                                key={iIdx}
                                className="group relative rounded-lg border border-line bg-surface p-2 shadow-2xs hover:border-brand transition-all"
                              >
                                {/* Thumbnail Preview with Click-to-Enlarge */}
                                <div
                                  className="relative aspect-video w-full overflow-hidden rounded bg-black/5 flex items-center justify-center cursor-pointer"
                                  onClick={() => setPreviewImage(resolvedUrl)}
                                  title="Click to enlarge image preview"
                                >
                                  <img
                                    src={resolvedUrl}
                                    alt={img.originalName || `${pName} preview`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="hidden flex-col items-center justify-center text-[10px] text-muted p-2 text-center">
                                    <FiImage className="h-5 w-5 mb-1" /> Image file
                                  </div>
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <FiMaximize2 className="h-5 w-5 text-white" />
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <span
                                    className="text-[11px] font-medium text-ink truncate max-w-[110px]"
                                    title={img.caption || img.originalName}
                                  >
                                    {img.caption || img.originalName || `Image ${iIdx + 1}`}
                                  </span>
                                  {/* Open Stored File Link */}
                                  <a
                                    href={resolvedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted hover:text-brand p-1"
                                    title="Open stored image file in new tab"
                                  >
                                    <FiExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Not Provided</p>
                )}
              </div>
            </section>
          )}

          {/* ──────────────── 5. Contact & Social Media ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-5') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiPhone className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  5. Contact & Social Media
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1 font-semibold">WhatsApp Number</span>
                  {waNum ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-ink font-semibold text-sm">{waNum}</span>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/20 inline-flex items-center gap-1"
                        >
                          <FiMessageSquare className="h-3 w-3" /> Chat on WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                <div>
                  <span className="text-muted block mb-1 font-semibold">Google Maps Location</span>
                  {contactDetails.googleMapsLocation ? (
                    <a
                      href={
                        contactDetails.googleMapsLocation.startsWith('http')
                          ? contactDetails.googleMapsLocation
                          : `https://maps.google.com/?q=${encodeURIComponent(contactDetails.googleMapsLocation)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                    >
                      <FiMapPin className="h-3.5 w-3.5" /> {contactDetails.googleMapsLocation} <FiExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-2 border-t border-line">
                <span className="text-xs font-semibold text-muted block mb-2.5">Social Media Channels:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Instagram */}
                  <div className="flex items-center justify-between rounded-lg border border-line bg-soft/30 p-2.5">
                    <span className="font-medium text-ink flex items-center gap-1.5">
                      <FiShare2 className="h-3.5 w-3.5 text-brand" /> Instagram:
                    </span>
                    {contactDetails.instagramLink ? (
                      <a
                        href={contactDetails.instagramLink.startsWith('http') ? contactDetails.instagramLink : `https://${contactDetails.instagramLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {contactDetails.instagramLink} <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>

                  {/* Facebook */}
                  <div className="flex items-center justify-between rounded-lg border border-line bg-soft/30 p-2.5">
                    <span className="font-medium text-ink flex items-center gap-1.5">
                      <FiShare2 className="h-3.5 w-3.5 text-brand" /> Facebook:
                    </span>
                    {contactDetails.facebookLink ? (
                      <a
                        href={contactDetails.facebookLink.startsWith('http') ? contactDetails.facebookLink : `https://${contactDetails.facebookLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {contactDetails.facebookLink} <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="flex items-center justify-between rounded-lg border border-line bg-soft/30 p-2.5">
                    <span className="font-medium text-ink flex items-center gap-1.5">
                      <FiShare2 className="h-3.5 w-3.5 text-brand" /> YouTube:
                    </span>
                    {contactDetails.youtubeLink ? (
                      <a
                        href={contactDetails.youtubeLink.startsWith('http') ? contactDetails.youtubeLink : `https://${contactDetails.youtubeLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {contactDetails.youtubeLink} <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center justify-between rounded-lg border border-line bg-soft/30 p-2.5">
                    <span className="font-medium text-ink flex items-center gap-1.5">
                      <FiShare2 className="h-3.5 w-3.5 text-brand" /> LinkedIn:
                    </span>
                    {contactDetails.linkedinLink ? (
                      <a
                        href={contactDetails.linkedinLink.startsWith('http') ? contactDetails.linkedinLink : `https://${contactDetails.linkedinLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {contactDetails.linkedinLink} <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ──────────────── 6. Additional Requirements ──────────────── */}
          {(activeTab === 'all' || activeTab === 'sec-6') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiFileText className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  6. Additional Requirements
                </h3>
              </div>

              {/* 4 Feature Toggles: Selected or Not Selected */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Contact Form */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    additionalRequirements.contactForm
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-line bg-soft/50 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink text-[12px]">Contact Form</span>
                    {additionalRequirements.contactForm ? (
                      <FiCheckSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FiSquare className="h-4 w-4 text-muted/60" />
                    )}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      additionalRequirements.contactForm
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    {additionalRequirements.contactForm ? 'Selected' : 'Not Selected'}
                  </span>
                </div>

                {/* WhatsApp Chat Button */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    additionalRequirements.whatsappChatButton
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-line bg-soft/50 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink text-[12px]">WhatsApp Chat</span>
                    {additionalRequirements.whatsappChatButton ? (
                      <FiCheckSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FiSquare className="h-4 w-4 text-muted/60" />
                    )}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      additionalRequirements.whatsappChatButton
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    {additionalRequirements.whatsappChatButton ? 'Selected' : 'Not Selected'}
                  </span>
                </div>

                {/* Google Maps */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    additionalRequirements.googleMaps
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-line bg-soft/50 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink text-[12px]">Google Maps</span>
                    {additionalRequirements.googleMaps ? (
                      <FiCheckSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FiSquare className="h-4 w-4 text-muted/60" />
                    )}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      additionalRequirements.googleMaps
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    {additionalRequirements.googleMaps ? 'Selected' : 'Not Selected'}
                  </span>
                </div>

                {/* Call Now Button */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    additionalRequirements.callNowButton
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-line bg-soft/50 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-ink text-[12px]">Call Now Button</span>
                    {additionalRequirements.callNowButton ? (
                      <FiCheckSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FiSquare className="h-4 w-4 text-muted/60" />
                    )}
                  </div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                      additionalRequirements.callNowButton
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    {additionalRequirements.callNowButton ? 'Selected' : 'Not Selected'}
                  </span>
                </div>
              </div>

              {/* Special Instructions if provided */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-muted block mb-1">Special Instructions:</span>
                <p className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line text-xs whitespace-pre-line">
                  {additionalRequirements.specialInstructions || <span className="text-muted italic font-normal">Not Provided</span>}
                </p>
              </div>
            </section>
          )}

          {/* ──────────────── Internal CRM Notes ──────────────── */}
          <section className="rounded-xl border border-line bg-surface p-5 space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Internal Team Notes
            </h3>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes about client conversation, proposal stage, or quotes..."
              className="w-full rounded-lg border border-line bg-soft/40 p-2.5 text-xs text-ink focus:border-brand focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="btn-primary inline-flex h-8 items-center gap-1.5 px-4 text-xs font-semibold"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-surface p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
              <span className="text-xs font-medium text-muted">Image Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-1 rounded bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/20"
                >
                  <FiExternalLink className="h-3 w-3" /> Open Stored File
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="rounded-full bg-soft p-1.5 text-muted hover:text-ink"
                  title="Close preview"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={previewImage}
              alt="Enlarged Preview"
              className="max-h-[80vh] max-w-full rounded-lg object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormDetailsDrawer;
