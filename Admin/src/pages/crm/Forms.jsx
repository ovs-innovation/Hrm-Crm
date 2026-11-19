import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiArrowLeft,
  FiEye,
  FiRefreshCw,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiLayers,
  FiImage,
  FiCheckCircle,
  FiGlobe,
  FiShare2,
  FiFileText,
  FiTag,
  FiClock,
  FiMapPin,
  FiExternalLink,
  FiMaximize2,
  FiCheck,
  FiX,
  FiTrash2,
  FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell';
import { getFileUrl } from '../../services/api';
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
      setNewCount(res.newCount !== undefined ? res.newCount : (res.statusCounts?.New || 0));
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [page, filterTab]);

  useEffect(() => {
    if (!selectedId) {
      fetchSubmissions();
    }
  }, [fetchSubmissions, selectedId]);

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
              <h3 className="text-sm font-semibold text-ink">Delete Submission</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Permanently delete submission for <strong className="font-semibold text-ink">{targetName}</strong>?
                This will remove the data from MongoDB and delete all associated files. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteModalOpen(false)}
              className="btn-outline h-8 px-3 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-danger px-3 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? (
                <>
                  <FiRefreshCw className="h-3 w-3 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete Permanently'
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
      businessDetails = {},
      websitePages = {},
      businessInfo = {},
      websiteDesign = {},
      contactDetails = {},
      additionalRequirements = {},
    } = selectedForm;

    const mobileNum = businessDetails.mobileNumber || contactDetails.phone || '';
    const waNum = businessDetails.whatsappNumber || contactDetails.whatsappNumber || mobileNum;
    const emailAddr = businessDetails.emailAddress || contactDetails.email || '';

    const selectedPagesList = Array.isArray(websitePages.selectedPages) ? websitePages.selectedPages : [];

    // Group business images by page name
    const rawBusinessImages = Array.isArray(websiteDesign.businessImages) ? websiteDesign.businessImages : [];
    const groupedImages = {};
    rawBusinessImages.forEach((img) => {
      const pName = (img.pageName || 'General').trim();
      if (!groupedImages[pName]) groupedImages[pName] = [];
      groupedImages[pName].push(img);
    });

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
      (websiteDesign.logoUrl ? { url: websiteDesign.logoUrl, originalName: 'logo' } : null);

    const isColorValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(websiteDesign.preferredColor || '');

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
          <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">
                    {businessDetails.businessName || 'Untitled Business'}
                  </h2>
                  {submissionId && (
                    <span className="rounded bg-soft px-2 py-0.5 font-mono text-[11px] text-muted border border-line">
                      {submissionId}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Submitted: <span className="text-ink">{formatDateTime(submissionDate || createdAt)}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDeleteModal(selectedForm)}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-line bg-surface px-2.5 text-xs font-medium text-danger hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                  title="Delete this submission"
                >
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* 1. Business Details */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiBriefcase className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                1. Business Details
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <span className="text-muted block mb-0.5">Business Name</span>
                <p className="font-medium text-ink">
                  {businessDetails.businessName || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
              <div>
                <span className="text-muted block mb-0.5">Owner Name</span>
                <p className="font-medium text-ink">
                  {businessDetails.ownerName || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
              <div>
                <span className="text-muted block mb-0.5">Business Category</span>
                <p className="font-medium text-ink">
                  {businessDetails.businessCategory ? (
                    <span className="rounded bg-soft px-2 py-0.5 text-[11px] text-muted border border-line">
                      {businessDetails.businessCategory}
                    </span>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted block mb-0.5">Mobile Number</span>
                {mobileNum ? (
                  <a
                    href={`tel:${mobileNum}`}
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <FiPhone className="h-3 w-3" /> {mobileNum}
                  </a>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div>
                <span className="text-muted block mb-0.5">WhatsApp Number</span>
                {waNum ? (
                  <span className="font-mono text-ink font-medium">{waNum}</span>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div>
                <span className="text-muted block mb-0.5">Email Address</span>
                {emailAddr ? (
                  <span className="font-medium text-ink">{emailAddr}</span>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-muted block mb-0.5">Business Address</span>
                {businessDetails.businessAddress ? (
                  <p className="font-medium text-ink flex items-start gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                    <span>{businessDetails.businessAddress}</span>
                  </p>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
            </div>
          </section>

          {/* 2. Website Pages */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiLayers className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                2. Website Pages
              </h3>
            </div>
            <div>
              <span className="text-xs text-muted block mb-2">Selected Pages:</span>
              {selectedPagesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPagesList.map((pageName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-xlight px-3 py-1 text-xs font-medium text-brand"
                    >
                      <FiCheckCircle className="h-3 w-3 text-brand" /> {pageName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">Not Provided</p>
              )}
            </div>
          </section>

          {/* 3. Business Information */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiGlobe className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                3. Business Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-muted block mb-1">About Business</span>
                <div className="rounded border border-line bg-soft/50 p-2.5 text-ink whitespace-pre-line leading-relaxed">
                  {businessInfo.aboutBusiness || <span className="text-muted italic">Not Provided</span>}
                </div>
              </div>
              <div>
                <span className="text-muted block mb-1">Services or Products</span>
                <div className="rounded border border-line bg-soft/50 p-2.5 text-ink whitespace-pre-line leading-relaxed">
                  {businessInfo.servicesOrProducts || <span className="text-muted italic">Not Provided</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted block mb-1">Business Description</span>
                <div className="rounded border border-line bg-soft/50 p-2.5 text-ink whitespace-pre-line leading-relaxed">
                  {businessInfo.businessDescription || <span className="text-muted italic">Not Provided</span>}
                </div>
              </div>
              <div>
                <span className="text-muted block mb-1">Working Hours</span>
                <p className="font-medium text-ink flex items-center gap-1.5">
                  <FiClock className="h-3.5 w-3.5 text-muted shrink-0" />
                  {businessInfo.businessWorkingHours || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
              <div>
                <span className="text-muted block mb-1">Business Location</span>
                <p className="font-medium text-ink flex items-center gap-1.5">
                  <FiMapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                  {businessInfo.businessLocation || <span className="text-muted italic">Not Provided</span>}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Website Design & Media */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiTag className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                4. Website Design & Media
              </h3>
            </div>

            {/* Colors & Themes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-muted block mb-1">Preferred Color</span>
                <div className="flex items-center gap-2">
                  {isColorValidHex && (
                    <span
                      className="h-4 w-4 rounded-full border border-line shrink-0"
                      style={{ backgroundColor: websiteDesign.preferredColor }}
                    />
                  )}
                  <span className="font-medium text-ink">
                    {websiteDesign.preferredColor || <span className="text-muted italic">Not Provided</span>}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted block mb-1">Preferred Theme</span>
                <span className="font-medium text-ink">
                  {websiteDesign.preferredTheme || <span className="text-muted italic">Not Provided</span>}
                </span>
              </div>
            </div>

            {/* Logo */}
            <div className="pt-2 border-t border-line">
              <span className="text-xs text-muted block mb-2">Uploaded Logo:</span>
              {logoObj?.url ? (
                <div className="flex flex-wrap items-center gap-3.5">
                  <div
                    className="group relative h-20 w-32 rounded border border-line bg-surface p-1.5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand transition-colors"
                    onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                    title="Click to preview logo"
                  >
                    <img
                      src={getFileUrl(logoObj.url)}
                      alt="Logo"
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
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-ink">{logoObj.originalName || 'Logo file'}</p>
                    {logoObj.size ? (
                      <p className="text-[11px] text-muted">{(logoObj.size / 1024).toFixed(1)} KB</p>
                    ) : null}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(getFileUrl(logoObj.url))}
                        className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-soft cursor-pointer"
                      >
                        Preview
                      </button>
                      <a
                        href={getFileUrl(logoObj.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-brand/20 bg-brand-xlight px-2 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-xlight/80"
                      >
                        Open Stored File
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic">Not Provided</p>
              )}
            </div>

            {/* Business Images */}
            <div className="pt-2 border-t border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  Business Images ({Object.values(groupedImages).reduce((acc, arr) => acc + arr.length, 0)} total)
                </span>
              </div>

              {Object.keys(groupedImages).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedImages).map(([pName, imgs]) => (
                    <div key={pName} className="rounded border border-line bg-soft/30 p-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        <span>{pName} Page</span>
                        <span className="text-muted text-[11px]">({imgs.length})</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {imgs.map((img, iIdx) => {
                          const resolvedUrl = getFileUrl(img.url);
                          return (
                            <div
                              key={iIdx}
                              className="group relative rounded border border-line bg-surface p-1.5 hover:border-brand transition-colors"
                            >
                              <div
                                className="relative aspect-video w-full overflow-hidden rounded bg-black/5 flex items-center justify-center cursor-pointer"
                                onClick={() => setPreviewImage(resolvedUrl)}
                                title="Click to enlarge preview"
                              >
                                <img
                                  src={resolvedUrl}
                                  alt={img.originalName || `${pName} image`}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden flex-col items-center justify-center text-[10px] text-muted p-1 text-center">
                                  <FiImage className="h-4 w-4 mb-0.5" /> Image
                                </div>
                                <div className="absolute inset-0 bg-navy/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <FiMaximize2 className="h-4 w-4 text-white" />
                                </div>
                              </div>

                              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                <span
                                  className="truncate max-w-[85px] text-muted"
                                  title={img.caption || img.originalName}
                                >
                                  {img.caption || img.originalName || `Image ${iIdx + 1}`}
                                </span>
                                <a
                                  href={resolvedUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted hover:text-brand"
                                  title="Open file in new tab"
                                >
                                  <FiExternalLink className="h-3 w-3" />
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

          {/* 5. Contact & Social Media */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiPhone className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                5. Contact & Social Media
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-muted block mb-1">WhatsApp Number</span>
                {waNum ? (
                  <span className="font-medium text-ink font-mono">{waNum}</span>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
              <div>
                <span className="text-muted block mb-1">Google Maps Link</span>
                {contactDetails.googleMapsLocation ? (
                  <a
                    href={
                      contactDetails.googleMapsLocation.startsWith('http')
                        ? contactDetails.googleMapsLocation
                        : `https://maps.google.com/?q=${encodeURIComponent(contactDetails.googleMapsLocation)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1 truncate max-w-[260px]"
                  >
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{contactDetails.googleMapsLocation}</span>
                    <FiExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-muted italic">Not Provided</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-line">
              <span className="text-xs text-muted block mb-2">Social Channels:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Instagram */}
                <div className="flex items-center justify-between rounded border border-line bg-soft/40 px-3 py-2">
                  <span className="text-muted">Instagram:</span>
                  {contactDetails.instagramLink ? (
                    <a
                      href={contactDetails.instagramLink.startsWith('http') ? contactDetails.instagramLink : `https://${contactDetails.instagramLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                    >
                      <span className="truncate">{contactDetails.instagramLink}</span>
                      <FiExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between rounded border border-line bg-soft/40 px-3 py-2">
                  <span className="text-muted">Facebook:</span>
                  {contactDetails.facebookLink ? (
                    <a
                      href={contactDetails.facebookLink.startsWith('http') ? contactDetails.facebookLink : `https://${contactDetails.facebookLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                    >
                      <span className="truncate">{contactDetails.facebookLink}</span>
                      <FiExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                {/* YouTube */}
                <div className="flex items-center justify-between rounded border border-line bg-soft/40 px-3 py-2">
                  <span className="text-muted">YouTube:</span>
                  {contactDetails.youtubeLink ? (
                    <a
                      href={contactDetails.youtubeLink.startsWith('http') ? contactDetails.youtubeLink : `https://${contactDetails.youtubeLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                    >
                      <span className="truncate">{contactDetails.youtubeLink}</span>
                      <FiExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex items-center justify-between rounded border border-line bg-soft/40 px-3 py-2">
                  <span className="text-muted">LinkedIn:</span>
                  {contactDetails.linkedinLink ? (
                    <a
                      href={contactDetails.linkedinLink.startsWith('http') ? contactDetails.linkedinLink : `https://${contactDetails.linkedinLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand font-medium hover:underline inline-flex items-center gap-1 truncate max-w-[180px]"
                    >
                      <span className="truncate">{contactDetails.linkedinLink}</span>
                      <FiExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted italic">Not Provided</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Additional Requirements */}
          <section className="rounded-lg border border-line bg-surface p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <FiFileText className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                6. Additional Requirements
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded border border-line bg-soft/40 p-2.5">
                <span className="text-muted block text-[11px] mb-1">Contact Form</span>
                <span className={`inline-flex items-center gap-1 font-medium ${
                  additionalRequirements.contactForm ? 'text-emerald-600' : 'text-muted'
                }`}>
                  {additionalRequirements.contactForm ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      <FiX className="h-3.5 w-3.5 text-muted/60" /> Not Selected
                    </>
                  )}
                </span>
              </div>

              <div className="rounded border border-line bg-soft/40 p-2.5">
                <span className="text-muted block text-[11px] mb-1">WhatsApp Chat</span>
                <span className={`inline-flex items-center gap-1 font-medium ${
                  additionalRequirements.whatsappChatButton ? 'text-emerald-600' : 'text-muted'
                }`}>
                  {additionalRequirements.whatsappChatButton ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      <FiX className="h-3.5 w-3.5 text-muted/60" /> Not Selected
                    </>
                  )}
                </span>
              </div>

              <div className="rounded border border-line bg-soft/40 p-2.5">
                <span className="text-muted block text-[11px] mb-1">Google Maps</span>
                <span className={`inline-flex items-center gap-1 font-medium ${
                  additionalRequirements.googleMaps ? 'text-emerald-600' : 'text-muted'
                }`}>
                  {additionalRequirements.googleMaps ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      <FiX className="h-3.5 w-3.5 text-muted/60" /> Not Selected
                    </>
                  )}
                </span>
              </div>

              <div className="rounded border border-line bg-soft/40 p-2.5">
                <span className="text-muted block text-[11px] mb-1">Call Now Button</span>
                <span className={`inline-flex items-center gap-1 font-medium ${
                  additionalRequirements.callNowButton ? 'text-emerald-600' : 'text-muted'
                }`}>
                  {additionalRequirements.callNowButton ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      <FiX className="h-3.5 w-3.5 text-muted/60" /> Not Selected
                    </>
                  )}
                </span>
              </div>
            </div>

            {additionalRequirements.specialInstructions && (
              <div className="pt-2">
                <span className="text-xs text-muted block mb-1">Special Instructions:</span>
                <p className="rounded border border-line bg-soft/40 p-2.5 text-xs text-ink whitespace-pre-line leading-relaxed">
                  {additionalRequirements.specialInstructions}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Lightbox Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-navy/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-surface p-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                <span className="text-xs font-medium text-muted">Image Preview</span>
                <div className="flex items-center gap-2">
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
                className="max-h-[80vh] max-w-full rounded object-contain mx-auto"
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
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${
              filterTab === 'all'
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
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                filterTab === 'all' ? 'bg-brand text-white' : 'bg-soft text-muted'
              }`}
            >
              All
            </span>
          </button>

          {/* Card 2: New Forms */}
          <button
            type="button"
            onClick={() => handleTabChange('new')}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${
              filterTab === 'new'
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
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                filterTab === 'new' ? 'bg-brand text-white' : 'bg-soft text-muted'
              }`}
            >
              New
            </span>
          </button>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-soft text-[12px] font-medium text-muted">
                <th className="px-4 py-2.5 whitespace-nowrap">Business Name</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Owner Name</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Mobile Number</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Category</th>
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
                      {filterTab === 'new' && (
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
                  const bName = bDetails.businessName || 'Untitled Business';
                  const owner = bDetails.ownerName || '—';
                  const mobile = bDetails.mobileNumber || '—';
                  const email = bDetails.emailAddress || '—';
                  const category = bDetails.businessCategory || '—';
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
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
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

                      {/* 4. Email (Truncated neatly to prevent layout breakage) */}
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

                      {/* 7. Actions (Clean compact icon buttons) */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-muted">
              <div>
                Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalCount)} of {totalCount} forms
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-line bg-surface px-2.5 py-1 font-medium text-ink hover:bg-soft disabled:opacity-40 cursor-pointer"
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
                  className="rounded border border-line bg-surface px-2.5 py-1 font-medium text-ink hover:bg-soft disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </PageShell>
  );
};

export default Forms;