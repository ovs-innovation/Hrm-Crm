import { useState } from 'react';
import {
  FiX,
  FiExternalLink,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiCalendar,
  FiBriefcase,
  FiImage,
  FiCheckCircle,
  FiGlobe,
  FiEye,
  FiShare2,
  FiTag,
  FiClock,
  FiMapPin,
  FiMaximize2,
  FiCheckSquare,
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
    customerDetails = {},
    businessDetails = {},
    websitePages = {},
    businessInfo = {},
    websiteDesign = {},
    contactDetails = {},
    additionalRequirements = {},
    billingDetails = {},
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

  const companyName =
    businessDetails.businessName ||
    customerDetails.companyName ||
    customerDetails.businessName ||
    form.businessName ||
    '';
  const fullName =
    businessDetails.ownerName ||
    customerDetails.fullName ||
    customerDetails.ownerName ||
    form.ownerName ||
    '';
  const mobileNum =
    businessDetails.mobileNumber ||
    customerDetails.mobileNumber ||
    contactDetails.contactMobile ||
    contactDetails.phone ||
    '';
  const emailAddr =
    businessDetails.emailAddress ||
    customerDetails.emailAddress ||
    contactDetails.contactEmail ||
    contactDetails.email ||
    '';
  const contactPhone =
    contactDetails.contactMobile ||
    contactDetails.phone ||
    businessDetails.mobileNumber ||
    customerDetails.mobileNumber ||
    '';
  const contactEmail =
    contactDetails.contactEmail ||
    contactDetails.email ||
    businessDetails.emailAddress ||
    customerDetails.emailAddress ||
    '';
  const waNum =
    businessDetails.whatsappNumber ||
    contactDetails.whatsappNumber ||
    mobileNum ||
    '';
  const gstStatus =
    businessDetails.gstStatus ||
    customerDetails.gstStatus ||
    '';
  const gstNumber =
    businessDetails.gstNumber ||
    customerDetails.gstNumber ||
    '';
  const panNumber =
    businessDetails.panNumber ||
    customerDetails.panNumber ||
    '';
  const registeredAddress =
    businessDetails.registeredAddress ||
    customerDetails.registeredAddress ||
    '';
  const businessAddress =
    businessDetails.businessAddress ||
    contactDetails.businessAddress ||
    registeredAddress ||
    '';
  const aboutBusiness =
    businessInfo.aboutBusiness ||
    businessDetails.aboutBusiness ||
    '';
  const servicesOrProducts =
    businessInfo.servicesOrProducts ||
    businessDetails.servicesOrProducts ||
    '';

  const instagramLink =
    contactDetails.instagramLink ||
    contactDetails.instagramUrl ||
    '';
  const facebookLink =
    contactDetails.facebookLink ||
    contactDetails.facebookUrl ||
    '';
  const linkedinLink =
    contactDetails.linkedinLink ||
    contactDetails.linkedinUrl ||
    '';
  const youtubeLink =
    contactDetails.youtubeLink ||
    contactDetails.youtubeUrl ||
    '';

  const primaryColor =
    websiteDesign.primaryColor ||
    websiteDesign.preferredColor ||
    '#E50914';
  const secondaryColor =
    websiteDesign.secondaryColor ||
    '#1F2937';
  const fontStyle =
    websiteDesign.fontStyle ||
    'Modern Sans';

  const waNumberClean = formatPhoneForWa(waNum);
  const waUrl = waNumberClean
    ? `https://wa.me/${waNumberClean}?text=Hi%20${encodeURIComponent(fullName || 'there')},%20thank%20you%20for%20submitting%20your%20website%20requirements%20to%20ApnaDigital.`
    : null;

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

  const logoObj =
    websiteDesign.logo ||
    (websiteDesign.logoUrl ? { url: websiteDesign.logoUrl, originalName: 'logo' } : null) ||
    businessDetails.logo ||
    (businessDetails.logoUrl ? { url: businessDetails.logoUrl, originalName: 'logo' } : null);
  const designTagline = websiteDesign.tagline || businessDetails.tagline || '';
  const hasLogoDesignAddon = Boolean(
    websiteDesign.needLogoDesign ??
    businessDetails.needLogoDesign ??
    billingDetails.needLogoDesign
  );

  const basePackagePrice = Number(billingDetails.basePackagePrice || 4999);
  const logoDesignPrice = hasLogoDesignAddon ? Number(billingDetails.logoDesignPrice || 999) : 0;
  const subtotalAmount = Number(billingDetails.subtotalAmount || (basePackagePrice + logoDesignPrice));
  const gstAmount = Number(billingDetails.gstAmount || Math.round(subtotalAmount * 0.18));
  const totalAmount = Number(billingDetails.totalAmount || (subtotalAmount + gstAmount));
  const paymentStatus = billingDetails.paymentStatus || 'Pending';

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
              {companyName || 'Untitled Submission'}
            </h2>
            <p className="text-xs text-muted">
              Full Name: <span className="font-medium text-ink">{fullName || 'Not Provided'}</span> • Business Category: <span className="font-medium text-ink">{businessDetails.businessCategory || 'Not Provided'}</span>
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
                href={`mailto:${emailAddr}?subject=ApnaDigital Website Requirements - ${encodeURIComponent(companyName || 'Website Proposal')}`}
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
            { id: 'all', label: 'All 4 Steps' },
            { id: 'step-1', label: 'Step 1: Customer Details' },
            { id: 'step-2', label: 'Step 2: Business Details' },
            { id: 'step-3', label: 'Step 3: Website Design' },
            { id: 'step-4', label: 'Step 4: Review & Save' },
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

          {/* ──────────────── Step 1: Customer Details ──────────────── */}
          {(activeTab === 'all' || activeTab === 'step-1') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiBriefcase className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Step 1: Customer Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1 font-medium">Company Name</span>
                  <p className="font-semibold text-ink text-sm">
                    {companyName || <span className="text-muted italic">Not Provided</span>}
                  </p>
                </div>
                <div>
                  <span className="text-muted block mb-1 font-medium">Full Name</span>
                  <p className="font-semibold text-ink text-sm">
                    {fullName || <span className="text-muted italic">Not Provided</span>}
                  </p>
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
                <div>
                  <span className="text-muted block mb-1 font-medium">GST Registration Status</span>
                  <span className="capitalize font-semibold text-ink">
                    {gstStatus === 'registered' ? 'Registered' : gstStatus === 'not_registered' ? 'Not Registered' : (gstStatus || 'Not Specified')}
                  </span>
                </div>
                {gstNumber ? (
                  <div>
                    <span className="text-muted block mb-1 font-medium">GST Number</span>
                    <span className="font-mono font-semibold text-ink text-sm">{gstNumber}</span>
                  </div>
                ) : panNumber ? (
                  <div>
                    <span className="text-muted block mb-1 font-medium">PAN Number</span>
                    <span className="font-mono font-semibold text-ink text-sm">{panNumber}</span>
                  </div>
                ) : null}
                {registeredAddress && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-muted block mb-1 font-medium">Company Registered Address</span>
                    <p className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line flex items-center gap-2">
                      <FiMapPin className="h-4 w-4 text-brand shrink-0" />
                      {registeredAddress}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ──────────────── Step 2: Business Details ──────────────── */}
          {(activeTab === 'all' || activeTab === 'step-2') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiGlobe className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Step 2: Business Details
                </h3>
              </div>

              {/* Sub-section 1: Business Overview */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Business Overview
                </span>

                <div className="text-xs">
                  <span className="text-muted block mb-1 font-medium">Business Category</span>
                  {businessDetails.businessCategory ? (
                    <span className="inline-block rounded-md bg-soft px-2.5 py-1 font-medium text-ink border border-line">
                      {businessDetails.businessCategory}
                    </span>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-muted block mb-1 font-semibold">About Your Business</span>
                    <div className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line whitespace-pre-line min-h-[50px]">
                      {aboutBusiness || <span className="text-muted italic font-normal">Not Provided</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-semibold">Services / Products Details</span>
                    <div className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line whitespace-pre-line min-h-[50px]">
                      {(() => {
                        const val = servicesOrProducts;
                        let list = null;
                        if (Array.isArray(val)) list = val;
                        else if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
                          try { list = JSON.parse(val); } catch { /* ignore invalid JSON */ }
                        }
                        if (Array.isArray(list) && list.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {list.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return val || <span className="text-muted italic font-normal">Not Provided</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-section 2: Contact Details */}
              <div className="space-y-3 pt-3 border-t border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Contact Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted block mb-1 font-medium">Contact Phone</span>
                    {contactPhone ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="font-semibold text-brand hover:underline inline-flex items-center gap-1.5 font-mono text-sm"
                      >
                        <FiPhone className="h-3 w-3" /> {contactPhone}
                      </a>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-medium">Contact Email</span>
                    {contactEmail ? (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="font-semibold text-brand hover:underline inline-flex items-center gap-1.5"
                      >
                        <FiMail className="h-3 w-3" /> {contactEmail}
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
                  {businessInfo.businessWorkingHours && (
                    <div>
                      <span className="text-muted block mb-1 font-semibold">Working Hours</span>
                      <div className="font-medium text-ink bg-soft/40 p-2.5 rounded-lg border border-line flex items-center gap-2">
                        <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                        {businessInfo.businessWorkingHours}
                      </div>
                    </div>
                  )}
                  {contactDetails.googleMapsLocation && (
                    <div>
                      <span className="text-muted block mb-1 font-semibold">Google Maps Location</span>
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
                    </div>
                  )}
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-muted block mb-1 font-medium">Business Address</span>
                    {businessAddress ? (
                      <p className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line flex items-center gap-2">
                        <FiMapPin className="h-4 w-4 text-brand shrink-0" />
                        {businessAddress}
                      </p>
                    ) : (
                      <span className="text-muted italic">Not Provided</span>
                    )}
                  </div>
                </div>

                {/* Social Media Profiles */}
                <div className="pt-2 border-t border-line">
                  <span className="text-xs font-semibold text-muted block mb-2.5">Social Media Profiles:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Instagram */}
                    <div className="flex items-center justify-between rounded-lg border border-line bg-soft/30 p-2.5">
                      <span className="font-medium text-ink flex items-center gap-1.5">
                        <FiShare2 className="h-3.5 w-3.5 text-brand" /> Instagram:
                      </span>
                      {instagramLink ? (
                        <a
                          href={instagramLink.startsWith('http') ? instagramLink : `https://${instagramLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {instagramLink} <FiExternalLink className="h-3 w-3 shrink-0" />
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
                      {facebookLink ? (
                        <a
                          href={facebookLink.startsWith('http') ? facebookLink : `https://${facebookLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {facebookLink} <FiExternalLink className="h-3 w-3 shrink-0" />
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
                      {youtubeLink ? (
                        <a
                          href={youtubeLink.startsWith('http') ? youtubeLink : `https://${youtubeLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {youtubeLink} <FiExternalLink className="h-3 w-3 shrink-0" />
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
                      {linkedinLink ? (
                        <a
                          href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {linkedinLink} <FiExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted italic">Not Provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ──────────────── Step 3: Website Design ──────────────── */}
          {(activeTab === 'all' || activeTab === 'step-3') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiTag className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Step 3: Website Design
                </h3>
              </div>

              {/* Sub-section 1: Colors & Typography */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Colors & Typography
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted block mb-1 font-semibold">Primary Color</span>
                    <div className="flex items-center gap-2 font-semibold text-ink bg-soft/40 p-2.5 rounded-lg border border-line">
                      <span
                        className="h-4 w-4 rounded-full border border-line shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="font-mono">{primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-semibold">Secondary Color</span>
                    <div className="flex items-center gap-2 font-semibold text-ink bg-soft/40 p-2.5 rounded-lg border border-line">
                      <span
                        className="h-4 w-4 rounded-full border border-line shrink-0"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span className="font-mono">{secondaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted block mb-1 font-semibold">Font Style</span>
                    <p className="font-semibold text-ink bg-soft/40 p-2.5 rounded-lg border border-line">
                      {fontStyle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-section 2: Logo & Branding */}
              <div className="space-y-3 pt-3 border-t border-line">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Logo & Branding
                </span>

                {/* Brand Tagline */}
                {designTagline ? (
                  <div className="text-xs">
                    <span className="text-muted block mb-1 font-semibold">Brand Tagline</span>
                    <p className="font-medium text-ink italic bg-soft/40 p-2.5 rounded-lg border border-line">
                      "{designTagline}"
                    </p>
                  </div>
                ) : null}

                {/* Uploaded Logo & Logo Design Addon */}
                <div className="rounded-xl border border-line bg-soft/30 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted block">Company Logo:</span>
                    {hasLogoDesignAddon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                        <FiCheckCircle className="h-3 w-3" /> Design Logo for ₹999 (+₹999)
                      </span>
                    )}
                  </div>

                  {logoObj?.url ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div
                        className="group relative h-24 w-40 rounded-lg border border-line bg-surface p-2 flex items-center justify-center overflow-hidden shadow-2xs cursor-pointer hover:border-brand transition-colors"
                        onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                        title="Click to enlarge logo preview"
                      >
                        <img
                          src={getFileUrl(logoObj.url)}
                          alt="Company Logo"
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
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold text-ink">{logoObj.originalName || 'Company Logo'}</p>
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
                    <p className="text-xs text-muted italic">
                      {hasLogoDesignAddon ? 'No logo file uploaded — Client selected Design Logo for ₹999 addon.' : 'No logo file uploaded.'}
                    </p>
                  )}
                </div>

                {/* Legacy Business Images if present */}
                {Object.keys(groupedImages).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                        <FiImage className="h-3.5 w-3.5 text-brand" /> Business Images (Grouped by Associated Page)
                      </h4>
                      <span className="text-[11px] text-muted">
                        {Object.values(groupedImages).reduce((acc, arr) => acc + arr.length, 0)} images total
                      </span>
                    </div>

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
                  </div>
                )}

                {/* Legacy Additional Requirements if present */}
                {(additionalRequirements.contactForm || additionalRequirements.whatsappChatButton || additionalRequirements.googleMaps || additionalRequirements.callNowButton || additionalRequirements.specialInstructions) && (
                  <div className="pt-2 border-t border-line space-y-3">
                    <span className="text-xs font-semibold text-muted block">Selected Features:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {additionalRequirements.contactForm && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1.5">
                          <FiCheckSquare className="h-4 w-4" /> Contact Form
                        </div>
                      )}
                      {additionalRequirements.whatsappChatButton && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1.5">
                          <FiCheckSquare className="h-4 w-4" /> WhatsApp Chat
                        </div>
                      )}
                      {additionalRequirements.googleMaps && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1.5">
                          <FiCheckSquare className="h-4 w-4" /> Google Maps
                        </div>
                      )}
                      {additionalRequirements.callNowButton && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1.5">
                          <FiCheckSquare className="h-4 w-4" /> Call Now Button
                        </div>
                      )}
                    </div>
                    {additionalRequirements.specialInstructions && (
                      <div className="pt-1">
                        <span className="text-xs font-semibold text-muted block mb-1">Special Instructions:</span>
                        <p className="font-medium text-ink bg-soft/40 p-3 rounded-lg border border-line text-xs whitespace-pre-line">
                          {additionalRequirements.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ──────────────── Step 4: Review & Save ──────────────── */}
          {(activeTab === 'all' || activeTab === 'step-4') && (
            <section className="rounded-xl border border-line bg-surface p-5 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <FiTag className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Step 4: Review & Save
                </h3>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Price Summary
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <span className="text-muted block mb-1 font-medium">Complete Business Website</span>
                    <p className="font-semibold text-ink text-base">
                      ₹{basePackagePrice.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[11px] text-muted">Base Website Package</span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1 font-medium">Logo Design Addon</span>
                    <p className="font-semibold text-ink text-base">
                      {hasLogoDesignAddon ? `+₹${logoDesignPrice.toLocaleString('en-IN')}` : '₹0'}
                    </p>
                    <span className="text-[11px] text-muted">
                      {hasLogoDesignAddon ? 'Design Logo (+₹999)' : 'Not Selected'}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1 font-medium">Goods & Services Tax (GST 18%)</span>
                    <p className="font-semibold text-ink text-base">
                      +₹{gstAmount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[11px] text-muted">
                      {gstStatus === 'registered' && gstNumber ? 'ITC Eligible' : '18% Standard GST'}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1 font-medium">Total Payable Amount</span>
                    <p className="font-bold text-brand text-base">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[11px] font-mono text-muted">{billingDetails.currency || 'INR'}</span>
                  </div>

                  <div>
                    <span className="text-muted block mb-1 font-medium">Payment Status</span>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{paymentStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>
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
