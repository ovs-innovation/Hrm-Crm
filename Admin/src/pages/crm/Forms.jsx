import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiArrowLeft,
  FiEye,
  FiRefreshCw,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiCheckCircle,
  FiGlobe,
  FiFileText,
  FiTag,
  FiClock,
  FiMapPin,
  FiExternalLink,
  FiMaximize2,
  FiCheck,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import { getFileUrl } from '../../services/api';
import { useAppSocket } from '../../context/SocketContext';
import {
  getFormSubmissions,
  getFormSubmissionById,
  updateFormStatus,
  deleteFormSubmission,
} from '../../services/formService';

const Forms = () => {
  // Listing state
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state: 'all' | 'new'
  const [filterTab, setFilterTab] = useState('all');
  const [totalAllCount, setTotalAllCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  // Detail view state
  const [selectedId, setSelectedId] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Ref to track and prevent duplicate auto-view update requests
  const inFlightViewUpdates = useRef(new Set());

  // Socket for live updates
  const { socket } = useAppSocket();

  // Fetch submissions list
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (filterTab === 'new') {
        params.status = 'New';
      }
      const res = await getFormSubmissions(params);
      setSubmissions(res.submissions || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
      setTotalAllCount(res.totalAll !== undefined ? res.totalAll : (res.total || 0));
      setNewCount(res.newCount !== undefined ? res.newCount : 0);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [page, filterTab]);

  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSubmissions();
    }
  }, [fetchSubmissions, selectedId]);

  // Real-time synchronization for new form submissions
  useEffect(() => {
    if (!socket) return;

    const handleNewSubmission = (newDoc) => {
      if (!newDoc) return;

      // Dynamically update counters
      setTotalAllCount((prev) => prev + 1);
      if (newDoc.status === 'New') {
        setNewCount((prev) => prev + 1);
      }

      // Prepend or update submissions table without duplicates
      setSubmissions((prevList) => {
        const idMatches = (item) =>
          (newDoc._id && item._id === newDoc._id) ||
          (newDoc.submissionId && item.submissionId === newDoc.submissionId);

        const exists = prevList.some(idMatches);
        if (exists) {
          return prevList.map((item) => (idMatches(item) ? { ...item, ...newDoc } : item));
        }

        // Only show if current tab matches (all or new)
        if (filterTab === 'new' && newDoc.status !== 'New') {
          return prevList;
        }

        return [newDoc, ...prevList].slice(0, 15);
      });
    };

    socket.on('new_form_submission', handleNewSubmission);
    socket.on('new_form', handleNewSubmission);

    return () => {
      socket.off('new_form_submission', handleNewSubmission);
      socket.off('new_form', handleNewSubmission);
    };
  }, [socket, filterTab]);

  const handleTabChange = (tab) => {
    if (filterTab === tab) return;
    setFilterTab(tab);
    setPage(1);
  };

  // Open single submission details & automatically mark New form as Viewed
  const handleOpenDetails = async (id) => {
    if (loadingDetail && selectedId === id) return;

    // Check if clicked item is currently 'New' in local listing state
    const localItem = submissions.find((s) => s._id === id || s.submissionId === id);
    const isLocallyNew = localItem ? localItem.status === 'New' : false;

    setSelectedId(id);
    setLoadingDetail(true);

    try {
      const data = await getFormSubmissionById(id);

      // Determine if submission was New
      const wasNew = isLocallyNew || data.status === 'New' || data.wasNew === true;

      if (wasNew) {
        // 1. Immediately mark as Viewed in detail view state
        data.status = 'Viewed';
        setSelectedForm(data);

        // 2. Remove the New badge from listing table dynamically
        setSubmissions((prevList) =>
          prevList.map((item) =>
            item._id === id || item.submissionId === id ? { ...item, status: 'Viewed' } : item
          )
        );

        // 3. Update New Forms counter dynamically without refreshing page (e.g. 1 -> 0)
        setNewCount((prev) => Math.max(0, prev - 1));

        // 4. Update status to Viewed in MongoDB (idempotent, prevents duplicate API calls)
        if (!inFlightViewUpdates.current.has(id)) {
          inFlightViewUpdates.current.add(id);
          try {
            await updateFormStatus(id, 'Viewed', data.internalNotes);
          } catch (apiErr) {
            console.error('Error auto-updating status to Viewed:', apiErr);
          }
        }
      } else {
        setSelectedForm(data);
      }
    } catch (err) {
      console.error('Error fetching submission details:', err);
      toast.error('Failed to load submission details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedId(null);
    setSelectedForm(null);
    fetchSubmissions();
  };

  // Delete modal handlers
  const handleOpenDeleteModal = (submission, e) => {
    if (e) e.stopPropagation();
    setSubmissionToDelete(submission);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!submissionToDelete) return;
    setDeleting(true);
    try {
      await deleteFormSubmission(submissionToDelete._id);
      toast.success('Submission permanently deleted.');
      setDeleteModalOpen(false);
      setSubmissionToDelete(null);

      if (selectedId === submissionToDelete._id) {
        setSelectedId(null);
        setSelectedForm(null);
      }

      fetchSubmissions();
    } catch (err) {
      console.error('Error deleting submission:', err);
      toast.error(err.response?.data?.message || 'Failed to delete submission.');
    } finally {
      setDeleting(false);
    }
  };

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  // Delete Confirmation Modal
  const renderDeleteModal = () => {
    if (!deleteModalOpen || !submissionToDelete) return null;

    const targetName =
      submissionToDelete.businessDetails?.businessName ||
      submissionToDelete.submissionId ||
      'this submission';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-xs"
        onClick={() => !deleting && setDeleteModalOpen(false)}
      >
        <div
          className="relative w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-danger">
              <FiTrash2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Delete Submission?</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Are you sure you want to delete the submission for <strong className="font-semibold text-ink">{targetName}</strong>? All submitted details and uploaded files will be permanently deleted. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteModalOpen(false)}
              className="btn-outline h-9 sm:h-8 px-3 text-xs font-medium cursor-pointer w-full sm:w-auto text-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded bg-danger px-3 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <FiRefreshCw className="h-3 w-3 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete Submission'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: DETAILS PAGE (When a Business Name is clicked)
  // ───────────────────────────────────────────────────────────────────────────
  if (selectedId) {
    if (loadingDetail) {
      return (
        <PageShell
          title="Forms"
          description="Customer website requirement submissions received from ApnaDigital."
        >
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiRefreshCw className="h-5 w-5 animate-spin text-brand mb-2.5" />
            <p className="text-xs text-muted">Loading submission details…</p>
          </div>
        </PageShell>
      );
    }

    if (!selectedForm) {
      return (
        <PageShell
          title="Forms"
          description="Customer website requirement submissions received from ApnaDigital."
        >
          <div className="rounded-lg border border-line bg-surface p-8 text-center">
            <p className="text-xs text-muted">Submission record could not be found.</p>
            <button
              type="button"
              onClick={handleBackToList}
              className="mt-3 inline-flex items-center gap-1.5 rounded border border-line bg-soft px-3 py-1.5 text-xs font-medium text-ink hover:bg-line transition-colors cursor-pointer"
            >
              <FiArrowLeft className="h-3.5 w-3.5" /> Back to Forms
            </button>
          </div>
        </PageShell>
      );
    }

    const {
      submissionId,
      submissionDate,
      createdAt,
      customerDetails = {},
      businessDetails = {},
      businessInfo = {},
      websiteDesign = {},
      contactDetails = {},
      additionalRequirements = {},
      billingDetails = {},
    } = selectedForm;

    const companyName =
      businessDetails.businessName ||
      customerDetails.companyName ||
      customerDetails.businessName ||
      selectedForm.businessName ||
      '';
    const fullName =
      businessDetails.ownerName ||
      customerDetails.fullName ||
      customerDetails.ownerName ||
      selectedForm.ownerName ||
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

    return (
      <PageShell
        title="Forms"
        description="Customer website requirement submissions received from ApnaDigital."
        actions={
          <button
            type="button"
            onClick={handleBackToList}
            className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium cursor-pointer"
          >
            <FiArrowLeft className="h-3.5 w-3.5" /> Back to Forms
          </button>
        }
      >
        <div className="space-y-4">
          {/* Top Banner / Submission Summary Header */}
          <div className="rounded-lg border border-line bg-surface p-3.5 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-ink break-words">
                    {businessDetails.businessName || 'Untitled Business'}
                  </h2>
                  {submissionId && (
                    <span className="rounded bg-soft px-2 py-0.5 font-mono text-[11px] text-muted border border-line break-all">
                      {submissionId}
                    </span>
                  )}
                  {selectedForm.status === 'New' && (
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 border border-blue-200 shrink-0">
                      New
                    </span>
                  )}
                  {selectedForm.status === 'Viewed' && (
                    <span className="rounded bg-soft px-2 py-0.5 text-[11px] font-medium text-muted border border-line shrink-0">
                      Viewed
                    </span>
                  )}
                  {selectedForm.clientId && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                      <FiCheckCircle className="h-3 w-3 text-emerald-600" /> Linked to CRM Lead
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Submitted: <span className="text-ink">{formatDateTime(submissionDate || createdAt)}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-line">
                <button
                  type="button"
                  onClick={() => handleOpenDeleteModal(selectedForm)}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-line bg-surface px-3 text-xs font-medium text-danger hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer w-full sm:w-auto"
                  title="Delete this submission"
                >
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Step 1: Customer Details */}
          <section className="rounded-lg border border-line bg-surface p-3.5 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiBriefcase className="h-4 w-4 text-brand shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
                Step 1: Customer Details
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 text-xs">
              <div className="min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Company Name</span>
                <p className="font-medium text-ink break-words">
                  {companyName || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
              <div className="min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Full Name</span>
                <p className="font-medium text-ink break-words">
                  {fullName || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
              <div className="min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Mobile Number</span>
                {mobileNum ? (
                  <a
                    href={`tel:${mobileNum}`}
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1 font-mono break-all"
                  >
                    <FiPhone className="h-3 w-3 shrink-0" /> {mobileNum}
                  </a>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Email Address</span>
                {emailAddr ? (
                  <a
                    href={`mailto:${emailAddr}`}
                    className="font-medium text-ink hover:text-brand hover:underline break-all block"
                  >
                    {emailAddr}
                  </a>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">GST Registration Status</span>
                <span className="capitalize font-medium text-ink">
                  {gstStatus === 'registered' ? 'Registered' : gstStatus === 'not_registered' ? 'Not Registered' : (gstStatus || 'Not Specified')}
                </span>
              </div>
              {gstNumber ? (
                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">GST Number</span>
                  <span className="font-mono font-medium text-ink break-all">{gstNumber}</span>
                </div>
              ) : panNumber ? (
                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">PAN Number</span>
                  <span className="font-mono font-medium text-ink break-all">{panNumber}</span>
                </div>
              ) : null}
              {registeredAddress && (
                <div className="sm:col-span-2 lg:col-span-3 min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Company Registered Address</span>
                  <p className="font-medium text-ink flex items-start gap-1.5 break-words">
                    <FiMapPin className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                    <span className="break-words">{registeredAddress}</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Step 2: Business Details */}
          <section className="rounded-lg border border-line bg-surface p-3.5 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiGlobe className="h-4 w-4 text-brand shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
                Step 2: Business Details
              </h3>
            </div>

            {/* Sub-section 1: Business Overview */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Business Overview
              </span>

              <div className="text-xs min-w-0">
                <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Business Category</span>
                <p className="font-medium text-ink">
                  {businessDetails.businessCategory ? (
                    <span className="rounded bg-soft px-2 py-0.5 text-[11px] text-muted border border-line inline-block max-w-full truncate">
                      {businessDetails.businessCategory}
                    </span>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </p>
              </div>

              {/* About Your Business & Services / Products Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 text-xs pt-1">
                <div className="min-w-0">
                  <span className="text-muted block mb-1 text-[11px] sm:text-xs">About Your Business</span>
                  <div className="rounded border border-line bg-soft/50 p-2.5 text-ink whitespace-pre-line leading-relaxed break-words">
                    {aboutBusiness || <span className="text-muted italic">Not Provided</span>}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-muted block mb-1 text-[11px] sm:text-xs">Services / Products Details</span>
                  <div className="rounded border border-line bg-soft/50 p-2.5 text-ink whitespace-pre-line leading-relaxed break-words">
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
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-600 border border-red-500/20"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return val || <span className="text-muted italic">Not Provided</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-section 2: Contact Details */}
            <div className="space-y-3 pt-3 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Contact Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 text-xs">
                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Contact Phone</span>
                  {contactPhone ? (
                    <a
                      href={`tel:${contactPhone}`}
                      className="font-mono font-medium text-brand hover:underline inline-flex items-center gap-1 break-all"
                    >
                      <FiPhone className="h-3 w-3 shrink-0" />
                      {contactPhone}
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Contact Email</span>
                  {contactEmail ? (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="font-medium text-ink hover:text-brand hover:underline break-all block"
                    >
                      {contactEmail}
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">WhatsApp Number</span>
                  {waNum ? (
                    <span className="font-mono text-ink font-medium break-all">{waNum}</span>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                {businessInfo.businessWorkingHours && (
                  <div className="min-w-0">
                    <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Working Hours</span>
                    <p className="font-medium text-ink flex items-center gap-1.5 break-words">
                      <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span>{businessInfo.businessWorkingHours}</span>
                    </p>
                  </div>
                )}

                {contactDetails.googleMapsLocation && (
                  <div className="min-w-0">
                    <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Google Maps Link</span>
                    <a
                      href={
                        contactDetails.googleMapsLocation.startsWith('http')
                          ? contactDetails.googleMapsLocation
                          : `https://maps.google.com/?q=${encodeURIComponent(contactDetails.googleMapsLocation)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand hover:underline inline-flex items-center gap-1 max-w-full truncate min-w-0"
                    >
                      <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{contactDetails.googleMapsLocation}</span>
                      <FiExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}

                <div className="sm:col-span-2 lg:col-span-3 min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Business Address</span>
                  {businessAddress ? (
                    <p className="font-medium text-ink flex items-start gap-1.5 break-words">
                      <FiMapPin className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <span className="break-words">{businessAddress}</span>
                    </p>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
              </div>

              {/* Social Media Profiles */}
              <div className="pt-2 border-t border-line">
                <span className="text-xs text-muted block mb-2">Social Media Profiles:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Instagram */}
                  <div className="flex items-center justify-between gap-2 rounded border border-line bg-soft/40 px-3 py-2 min-w-0">
                    <span className="text-muted shrink-0 text-xs">Instagram:</span>
                    {instagramLink ? (
                      <a
                        href={instagramLink.startsWith('http') ? instagramLink : `https://${instagramLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate min-w-0 justify-end"
                      >
                        <span className="truncate">{instagramLink}</span>
                        <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic text-xs">Not Provided</span>
                    )}
                  </div>

                  {/* Facebook */}
                  <div className="flex items-center justify-between gap-2 rounded border border-line bg-soft/40 px-3 py-2 min-w-0">
                    <span className="text-muted shrink-0 text-xs">Facebook:</span>
                    {facebookLink ? (
                      <a
                        href={facebookLink.startsWith('http') ? facebookLink : `https://${facebookLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate min-w-0 justify-end"
                      >
                        <span className="truncate">{facebookLink}</span>
                        <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic text-xs">Not Provided</span>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center justify-between gap-2 rounded border border-line bg-soft/40 px-3 py-2 min-w-0">
                    <span className="text-muted shrink-0 text-xs">LinkedIn:</span>
                    {linkedinLink ? (
                      <a
                        href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate min-w-0 justify-end"
                      >
                        <span className="truncate">{linkedinLink}</span>
                        <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic text-xs">Not Provided</span>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="flex items-center justify-between gap-2 rounded border border-line bg-soft/40 px-3 py-2 min-w-0">
                    <span className="text-muted shrink-0 text-xs">YouTube:</span>
                    {youtubeLink ? (
                      <a
                        href={youtubeLink.startsWith('http') ? youtubeLink : `https://${youtubeLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate min-w-0 justify-end"
                      >
                        <span className="truncate">{youtubeLink}</span>
                        <FiExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted italic text-xs">Not Provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Website Design */}
          <section className="rounded-lg border border-line bg-surface p-3.5 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiTag className="h-4 w-4 text-brand shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
                Step 3: Website Design
              </h3>
            </div>

            {/* Sub-section 1: Colors & Typography */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Colors & Typography
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 text-xs">
                <div className="min-w-0">
                  <span className="text-muted block mb-1 text-[11px] sm:text-xs">Primary Color</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-4 w-4 rounded-full border border-line shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="font-medium text-ink font-mono truncate">
                      {primaryColor}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-muted block mb-1 text-[11px] sm:text-xs">Secondary Color</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-4 w-4 rounded-full border border-line shrink-0"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="font-medium text-ink font-mono truncate">
                      {secondaryColor}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-muted block mb-1 text-[11px] sm:text-xs">Font Style</span>
                  <span className="rounded bg-soft border border-line px-2 py-0.5 text-[11px] font-medium text-ink inline-block max-w-full truncate">
                    {fontStyle}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section 2: Logo & Branding */}
            <div className="space-y-3 pt-3 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Logo & Branding
              </span>

              {/* Brand Tagline */}
              {designTagline ? (
                <div className="text-xs min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Brand Tagline</span>
                  <p className="font-medium text-ink italic break-words">"{designTagline}"</p>
                </div>
              ) : null}

              {/* Company Logo & Logo Design Addon */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted block">Company Logo:</span>
                  {hasLogoDesignAddon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-xlight border border-brand/20 px-2.5 py-0.5 text-[11px] font-medium text-brand shrink-0">
                      <FiCheckCircle className="h-3 w-3 shrink-0" /> Design Logo for ₹999 (+₹999)
                    </span>
                  )}
                </div>

                {logoObj?.url ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                    <div
                      className="group relative h-20 w-32 shrink-0 rounded border border-line bg-surface p-1.5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand transition-colors"
                      onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                      title="Click to preview logo"
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
                      <span className="hidden text-[11px] text-muted">Preview unavailable</span>
                      <div className="absolute inset-0 bg-navy/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FiMaximize2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{logoObj.originalName || 'Logo file'}</p>
                      {logoObj.size ? (
                        <p className="text-[11px] text-muted">{(logoObj.size / 1024).toFixed(1)} KB</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                          className="rounded border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-soft cursor-pointer transition-colors"
                        >
                          Preview
                        </button>
                        <a
                          href={getFileUrl(logoObj.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-brand/20 bg-brand-xlight px-2.5 py-1 text-[11px] font-medium text-brand hover:bg-brand-xlight/80 transition-colors"
                        >
                          Open Stored File
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
            </div>

            {/* Additional requirements if any */}
            {(additionalRequirements.contactForm || additionalRequirements.whatsappChatButton || additionalRequirements.googleMaps || additionalRequirements.callNowButton || additionalRequirements.specialInstructions) && (
              <div className="pt-2 border-t border-line space-y-2">
                <span className="text-xs text-muted block">Selected Features:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {additionalRequirements.contactForm && (
                    <div className="rounded border border-line bg-soft/40 p-2 text-ink flex items-center gap-1.5 font-medium min-w-0">
                      <FiCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Contact Form</span>
                    </div>
                  )}
                  {additionalRequirements.whatsappChatButton && (
                    <div className="rounded border border-line bg-soft/40 p-2 text-ink flex items-center gap-1.5 font-medium min-w-0">
                      <FiCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">WhatsApp Chat</span>
                    </div>
                  )}
                  {additionalRequirements.googleMaps && (
                    <div className="rounded border border-line bg-soft/40 p-2 text-ink flex items-center gap-1.5 font-medium min-w-0">
                      <FiCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Google Maps</span>
                    </div>
                  )}
                  {additionalRequirements.callNowButton && (
                    <div className="rounded border border-line bg-soft/40 p-2 text-ink flex items-center gap-1.5 font-medium min-w-0">
                      <FiCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Call Now Button</span>
                    </div>
                  )}
                </div>
                {additionalRequirements.specialInstructions && (
                  <div className="pt-1">
                    <span className="text-xs text-muted block mb-1">Special Instructions:</span>
                    <p className="rounded border border-line bg-soft/40 p-2.5 text-xs text-ink whitespace-pre-line leading-relaxed break-words">
                      {additionalRequirements.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 4: Review & Save */}
          <section className="rounded-lg border border-line bg-surface p-3.5 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiTag className="h-4 w-4 text-brand shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted truncate">
                Step 4: Review & Save
              </h3>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Price Summary
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5 text-xs">
                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Complete Business Website</span>
                  <p className="font-semibold text-ink text-sm sm:text-base">
                    ₹{basePackagePrice.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-muted block truncate">Base Website Package</span>
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Logo Design Addon</span>
                  <p className="font-semibold text-ink text-sm sm:text-base">
                    {hasLogoDesignAddon ? `+₹${logoDesignPrice.toLocaleString('en-IN')}` : '₹0'}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-muted block truncate">
                    {hasLogoDesignAddon ? 'Design Logo (+₹999)' : 'Not Selected'}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Goods & Services Tax (GST 18%)</span>
                  <p className="font-semibold text-ink text-sm sm:text-base">
                    +₹{gstAmount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-muted block truncate">
                    {gstStatus === 'registered' && gstNumber ? 'ITC Eligible' : '18% Standard GST'}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Total Payable Amount</span>
                  <p className="text-sm sm:text-base font-bold text-brand">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] sm:text-[11px] font-mono text-muted block">{billingDetails.currency || 'INR'}</span>
                </div>

                <div className="min-w-0">
                  <span className="text-muted block mb-0.5 text-[11px] sm:text-xs">Payment Status</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="truncate">{paymentStatus}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Lightbox Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-navy/80 p-3 sm:p-4 backdrop-blur-xs"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-h-[92vh] max-w-[95vw] sm:max-w-[90vw] overflow-hidden rounded-lg bg-surface p-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-line">
                <span className="text-xs font-medium text-muted truncate">Image Preview</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-brand/20 bg-brand-xlight px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand-xlight/80"
                  >
                    <FiExternalLink className="h-3 w-3" /> Open File
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="rounded p-1 text-muted hover:text-ink cursor-pointer"
                    title="Close preview"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-[78vh] max-w-full rounded object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {renderDeleteModal()}
      </PageShell>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: FORMS LISTING PAGE (Clean, modern, properly aligned table)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Forms"
      description="Customer website requirement submissions received from ApnaDigital."
      actions={
        <button
          type="button"
          onClick={fetchSubmissions}
          disabled={loading}
          className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium cursor-pointer"
          title="Refresh submissions"
        >
          <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      <div className="space-y-4">
        {/* Compact Summary Metric Cards / Filter Tabs */}
        <div className="grid grid-cols-2 gap-2.5 sm:max-w-xs">
          {/* Card 1: Total Forms */}
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${filterTab === 'all'
                ? 'border-brand bg-brand-xlight/50 ring-1 ring-brand/20'
                : 'border-line bg-surface hover:bg-soft'
              }`}
          >
            <div>
              <p className="text-[11px] font-medium text-muted">Total Forms</p>
              <p className="text-base font-semibold text-ink leading-tight mt-0.5">
                {loading && totalAllCount === 0 ? '…' : totalAllCount}
              </p>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${filterTab === 'all' ? 'bg-brand text-white' : 'bg-soft text-muted'
                }`}
            >
              All
            </span>
          </button>

          {/* Card 2: New Forms */}
          <button
            type="button"
            onClick={() => handleTabChange('new')}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${filterTab === 'new'
                ? 'border-brand bg-brand-xlight/50 ring-1 ring-brand/20'
                : 'border-line bg-surface hover:bg-soft'
              }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium text-muted">New Forms</p>
                {newCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </div>
              <p className="text-base font-semibold text-ink leading-tight mt-0.5">
                {loading && newCount === 0 ? '…' : newCount}
              </p>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${filterTab === 'new' ? 'bg-brand text-white' : 'bg-soft text-muted'
                }`}
            >
              New
            </span>
          </button>
        </div>

        {/* Mobile Submissions Card List (Screens < md) */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="rounded-lg border border-line bg-surface p-8 text-center text-muted">
              <div className="inline-flex items-center gap-2 text-xs">
                <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-brand" />
                <span>Loading submissions…</span>
              </div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface p-6 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center">
                <FiFileText className="h-7 w-7 text-muted/50 mb-2" />
                <p className="text-[13px] font-medium text-ink">
                  {filterTab === 'new' ? 'No new forms' : 'No form submissions yet'}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {filterTab === 'new'
                    ? 'All received submissions have been reviewed.'
                    : 'Website requirements submitted from ApnaDigital will appear here.'}
                </p>
                {filterTab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('all')}
                    className="mt-3 rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft transition-colors cursor-pointer"
                  >
                    View all forms ({totalAllCount})
                  </button>
                )}
              </div>
            </div>
          ) : (
            submissions.map((item) => {
              const bDetails = item.businessDetails || {};
              const cDetails = item.customerDetails || {};
              const bName = bDetails.businessName || cDetails.companyName || cDetails.businessName || item.businessName || 'Untitled Business';
              const owner = bDetails.ownerName || cDetails.fullName || cDetails.ownerName || item.ownerName || '—';
              const mobile = bDetails.mobileNumber || cDetails.mobileNumber || item.mobileNumber || '';
              const email = bDetails.emailAddress || cDetails.emailAddress || item.emailAddress || '';
              const category = bDetails.businessCategory || item.businessCategory || '';
              const dateStr = item.submissionDate || item.createdAt;

              return (
                <div
                  key={item._id}
                  className="rounded-lg border border-line bg-surface p-3.5 space-y-2.5 transition-colors hover:border-brand/40 shadow-xs cursor-pointer"
                  onClick={() => handleOpenDetails(item._id)}
                >
                  {/* Card Header: Business Name, New Badge, Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-ink text-sm break-words">
                          {bName}
                        </span>
                        {item.status === 'New' && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-200 shrink-0">
                            New
                          </span>
                        )}
                      </div>
                      {item.submissionId && (
                        <span className="text-[11px] font-mono text-muted block mt-0.5">
                          {item.submissionId}
                        </span>
                      )}
                    </div>
                    {category ? (
                      <span className="rounded bg-soft border border-line px-2 py-0.5 text-[10px] font-medium text-muted shrink-0 max-w-[130px] truncate">
                        {category}
                      </span>
                    ) : null}
                  </div>

                  {/* Owner and Date */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-line/60">
                    <div className="min-w-0">
                      <span className="text-muted block text-[11px]">Full Name</span>
                      <span className="font-medium text-ink truncate block">{owner}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-muted block text-[11px]">Submission Date</span>
                      <span className="text-muted text-[11px] block">{formatDate(dateStr)}</span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  {(mobile || email) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1 border-t border-line/60">
                      {mobile && (
                        <div className="flex items-center gap-1.5 text-muted min-w-0">
                          <FiPhone className="h-3 w-3 shrink-0 text-brand" />
                          <a
                            href={`tel:${mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-ink hover:text-brand hover:underline truncate"
                          >
                            {mobile}
                          </a>
                        </div>
                      )}
                      {email && (
                        <div className="flex items-center gap-1.5 text-muted min-w-0">
                          <FiMail className="h-3 w-3 shrink-0 text-brand" />
                          <a
                            href={`mailto:${email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-ink hover:text-brand hover:underline truncate"
                            title={email}
                          >
                            {email}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t border-line"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item._id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded border border-line bg-soft px-3 py-1.5 text-xs font-medium text-ink hover:bg-line transition-colors cursor-pointer flex-1"
                    >
                      <FiEye className="h-3.5 w-3.5 text-brand" /> View Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDeleteModal(item, e)}
                      className="inline-flex items-center justify-center rounded border border-line bg-surface p-2 text-muted hover:bg-red-50 hover:text-danger hover:border-red-200 transition-colors cursor-pointer shrink-0"
                      title="Delete submission"
                      aria-label="Delete submission"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Submissions Table (Screens >= md) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-[12px] font-medium text-muted">
                <th className="px-4 py-2.5 whitespace-nowrap">Company Name</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Full Name</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Mobile Number</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Email Address</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Business Category</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Submission Date</th>
                <th className="px-4 py-2.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-brand" />
                      <span>Loading submissions…</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <FiFileText className="h-7 w-7 text-muted/50 mb-2" />
                      <p className="text-[13px] font-medium text-ink">
                        {filterTab === 'new' ? 'No new forms' : 'No form submissions yet'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {filterTab === 'new'
                          ? 'All received submissions have been reviewed.'
                          : 'Website requirements submitted from ApnaDigital will appear here.'}
                      </p>
                      {filterTab !== 'all' && (
                        <button
                          type="button"
                          onClick={() => handleTabChange('all')}
                          className="mt-3 rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-soft transition-colors cursor-pointer"
                        >
                          View all forms ({totalAllCount})
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((item) => {
                  const bDetails = item.businessDetails || {};
                  const cDetails = item.customerDetails || {};
                  const bName = bDetails.businessName || cDetails.companyName || cDetails.businessName || item.businessName || 'Untitled Business';
                  const owner = bDetails.ownerName || cDetails.fullName || cDetails.ownerName || item.ownerName || '—';
                  const mobile = bDetails.mobileNumber || cDetails.mobileNumber || item.mobileNumber || '—';
                  const email = bDetails.emailAddress || cDetails.emailAddress || item.emailAddress || '—';
                  const category = bDetails.businessCategory || item.businessCategory || '—';
                  const dateStr = item.submissionDate || item.createdAt;

                  return (
                    <tr
                      key={item._id}
                      className="transition-colors hover:bg-soft/60 cursor-pointer"
                      onClick={() => handleOpenDetails(item._id)}
                    >
                      {/* 1. Business Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item._id)}
                            className="text-left font-medium text-ink hover:text-brand transition-colors cursor-pointer"
                          >
                            {bName}
                          </button>
                          {item.status === 'New' && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-200">
                              New
                            </span>
                          )}
                        </div>
                        {item.submissionId && (
                          <div className="text-[11px] font-mono text-muted">
                            {item.submissionId}
                          </div>
                        )}
                      </td>

                      {/* 2. Owner Name */}
                      <td className="px-4 py-3 whitespace-nowrap text-ink">
                        {owner}
                      </td>

                      {/* 3. Mobile Number */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted">
                        {mobile !== '—' ? (
                          <span className="text-ink">{mobile}</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 4. Email */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {email !== '—' ? (
                          <span className="block max-w-[170px] truncate text-ink" title={email}>
                            {email}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 5. Category */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {category !== '—' ? (
                          <span className="rounded bg-soft border border-line px-2 py-0.5 text-[11px] font-medium text-muted">
                            {category}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* 6. Submission Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {formatDate(dateStr)}
                      </td>

                      {/* 7. Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item._id)}
                            className="rounded p-1.5 text-muted hover:bg-soft hover:text-brand transition-colors cursor-pointer"
                            title="View details"
                            aria-label="View details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteModal(item, e)}
                            className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-danger transition-colors cursor-pointer"
                            title="Delete submission"
                            aria-label="Delete submission"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination (Shared for Mobile & Desktop) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 sm:px-4 sm:py-2.5 text-xs text-muted">
            <div className="text-center sm:text-left">
              Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalCount)} of {totalCount} forms
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-line bg-surface px-2.5 py-1 font-medium text-ink hover:bg-soft disabled:opacity-40 cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-ink">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-line bg-surface px-2.5 py-1 font-medium text-ink hover:bg-soft disabled:opacity-40 cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </PageShell>
  );
};

export default Forms;