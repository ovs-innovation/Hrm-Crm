import fs from 'fs';
import path from 'path';
import FormSubmission from '../models/FormSubmission.js';
import Tenant from '../models/Tenant.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';

// Helper to normalize array of strings
const normalizeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((s) => String(s || '').trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    // If it's a JSON array string
    if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s || '').trim()).filter(Boolean);
        }
      } catch {
        // Fall back to comma split
      }
    }
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper to parse boolean values safely
const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
  }
  if (typeof val === 'number') return val === 1;
  return false;
};

// Validation helpers
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * @desc    Public Form Submission Ingestion API (for ApnaDigital Website)
 * @route   POST /api/forms/submit
 * @access  Public (Rate-limited)
 */
export const submitForm = async (req, res) => {
  try {
    const body = req.body || {};

    // Auto-parse JSON stringified sections from multipart/form-data
    const jsonSections = [
      'businessDetails',
      'websitePages',
      'businessInfo',
      'websiteDesign',
      'contactDetails',
      'additionalRequirements',
    ];
    jsonSections.forEach((sec) => {
      if (typeof body[sec] === 'string') {
        try {
          body[sec] = JSON.parse(body[sec]);
        } catch {
          // keep as string
        }
      }
    });

    const validationErrors = [];

    // ─── 1. EXTRACT & VALIDATE BUSINESS DETAILS ──────────────────────────────
    const businessName = String(
      body.businessDetails?.businessName ||
      body.businessName ||
      body.companyName ||
      ''
    ).trim();

    const ownerName = String(
      body.businessDetails?.ownerName ||
      body.ownerName ||
      body.fullName ||
      body.name ||
      ''
    ).trim();

    const businessCategory = String(
      body.businessDetails?.businessCategory ||
      body.businessCategory ||
      body.category ||
      body.industry ||
      ''
    ).trim();

    const mobileNumber = String(
      body.businessDetails?.mobileNumber ||
      body.mobileNumber ||
      body.phone ||
      body.contactDetails?.phone ||
      body.contactDetails?.mobileNumber ||
      ''
    ).trim();

    const emailAddress = String(
      body.businessDetails?.emailAddress ||
      body.emailAddress ||
      body.email ||
      body.contactDetails?.email ||
      body.contactDetails?.emailAddress ||
      ''
    ).toLowerCase().trim();

    const whatsappNumber = String(
      body.businessDetails?.whatsappNumber ||
      body.whatsappNumber ||
      body.contactDetails?.whatsappNumber ||
      body.whatsapp ||
      mobileNumber
    ).trim();

    const businessAddress = String(
      body.businessDetails?.businessAddress ||
      body.businessAddress ||
      body.address ||
      body.contactDetails?.address ||
      ''
    ).trim();

    // Required field validation
    if (!businessName) {
      validationErrors.push({ field: 'businessName', message: 'Business Name is required.' });
    }
    if (!ownerName) {
      validationErrors.push({ field: 'ownerName', message: 'Owner Name is required.' });
    }
    if (!businessCategory) {
      validationErrors.push({ field: 'businessCategory', message: 'Business Category is required.' });
    }
    if (!mobileNumber) {
      validationErrors.push({ field: 'mobileNumber', message: 'Mobile Number is required.' });
    } else if (!isValidPhone(mobileNumber)) {
      validationErrors.push({ field: 'mobileNumber', message: 'Please provide a valid 10 to 15 digit mobile number.' });
    }
    if (!emailAddress) {
      validationErrors.push({ field: 'emailAddress', message: 'Email Address is required.' });
    } else if (!isValidEmail(emailAddress)) {
      validationErrors.push({ field: 'emailAddress', message: 'Please provide a valid email address.' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted fields.',
        errors: validationErrors,
      });
    }

    const businessDetails = {
      businessName,
      ownerName,
      businessCategory,
      mobileNumber,
      whatsappNumber: whatsappNumber || mobileNumber,
      emailAddress,
      businessAddress,
      businessType: String(body.businessDetails?.businessType || body.businessType || '').trim(),
      existingWebsiteUrl: String(body.businessDetails?.existingWebsiteUrl || body.existingWebsiteUrl || body.websiteUrl || '').trim(),
      tagline: String(body.businessDetails?.tagline || body.tagline || '').trim(),
      yearEstablished: String(body.businessDetails?.yearEstablished || body.yearEstablished || '').trim(),
    };

    // ─── 2. EXTRACT WEBSITE PAGES ────────────────────────────────────────────
    const selectedPages = normalizeArray(
      body.websitePages?.selectedPages || body.selectedPages || body.pages
    );

    const websitePages = {
      selectedPages: selectedPages.length > 0
        ? selectedPages
        : ['Home', 'About Us', 'Our Services', 'Gallery / Our Work', 'Contact Us'],
      estimatedPageCount: String(body.websitePages?.estimatedPageCount || body.estimatedPageCount || '').trim(),
      customPages: normalizeArray(body.websitePages?.customPages || body.customPages),
      eCommerceNeeded: parseBoolean(body.websitePages?.eCommerceNeeded ?? body.eCommerceNeeded),
      blogNeeded: parseBoolean(body.websitePages?.blogNeeded ?? body.blogNeeded),
    };

    // ─── 3. EXTRACT BUSINESS INFORMATION ─────────────────────────────────────
    const businessInfo = {
      aboutBusiness: String(body.businessInfo?.aboutBusiness || body.aboutBusiness || body.about || '').trim(),
      servicesOrProducts: String(
        body.businessInfo?.servicesOrProducts ||
        body.servicesOrProducts ||
        body.businessInfo?.servicesDetails ||
        body.servicesDetails ||
        body.services ||
        body.products ||
        ''
      ).trim(),
      businessDescription: String(
        body.businessInfo?.businessDescription ||
        body.businessDescription ||
        body.description ||
        ''
      ).trim(),
      businessWorkingHours: String(
        body.businessInfo?.businessWorkingHours ||
        body.businessWorkingHours ||
        body.businessInfo?.workingHours ||
        body.workingHours ||
        ''
      ).trim(),
      businessLocation: String(
        body.businessInfo?.businessLocation ||
        body.businessLocation ||
        body.location ||
        ''
      ).trim(),

      // Optional/Extended fields
      targetAudience: String(body.businessInfo?.targetAudience || body.targetAudience || '').trim(),
      primaryGoal: String(body.businessInfo?.primaryGoal || body.primaryGoal || '').trim(),
      uniqueSellingPoints: String(body.businessInfo?.uniqueSellingPoints || body.uniqueSellingPoints || body.usp || '').trim(),
      competitorUrls: normalizeArray(body.businessInfo?.competitorUrls || body.competitorUrls || body.competitors),
      referenceWebsites: normalizeArray(body.businessInfo?.referenceWebsites || body.referenceWebsites),
      contentReadiness: String(body.businessInfo?.contentReadiness || body.contentReadiness || 'Partially Ready').trim(),
    };

    // ─── 4. EXTRACT WEBSITE DESIGN & MEDIA ───────────────────────────────────
    let logoData = null;
    const bodyLogo = body.websiteDesign?.logo || body.logo;

    if (bodyLogo && typeof bodyLogo === 'object' && bodyLogo.url) {
      logoData = {
        url: bodyLogo.url,
        originalName: bodyLogo.originalName || 'logo',
        mimeType: bodyLogo.mimeType || 'image/png',
        size: Number(bodyLogo.size || 0),
        uploadedAt: bodyLogo.uploadedAt || new Date(),
      };
    } else if (typeof bodyLogo === 'string' && bodyLogo.trim()) {
      logoData = {
        url: bodyLogo.trim(),
        originalName: 'logo',
        mimeType: 'image/png',
        size: 0,
        uploadedAt: new Date(),
      };
    }

    // Process multipart logo upload if provided
    if (req.files && Array.isArray(req.files)) {
      const logoFile = req.files.find(
        (f) => f.fieldname === 'logo' || f.fieldname === 'logoFile' || f.fieldname === 'businessLogo'
      );
      if (logoFile) {
        logoData = {
          url: `/uploads/forms/${logoFile.filename}`,
          originalName: logoFile.originalname,
          mimeType: logoFile.mimetype,
          size: logoFile.size,
          uploadedAt: new Date(),
        };
      }
    }

    // Process business images
    let businessImages = [];
    const rawImages = body.websiteDesign?.businessImages || body.businessImages;
    if (Array.isArray(rawImages)) {
      businessImages = rawImages.map((img) => ({
        url: img.url,
        originalName: img.originalName || img.name || 'image',
        pageName: img.pageName || 'General',
        mimeType: img.mimeType || 'image/jpeg',
        size: Number(img.size || 0),
        caption: img.caption || '',
        uploadedAt: img.uploadedAt || new Date(),
      }));
    } else if (typeof rawImages === 'string') {
      try {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed)) {
          businessImages = parsed.map((img) => ({
            url: img.url,
            originalName: img.originalName || 'image',
            pageName: img.pageName || 'General',
            mimeType: img.mimeType || 'image/jpeg',
            size: Number(img.size || 0),
            caption: img.caption || '',
            uploadedAt: new Date(),
          }));
        }
      } catch {
        // Ignored
      }
    }

    // Process multipart business images
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f) => {
        if (f.fieldname.startsWith('businessImages') || f.fieldname.startsWith('image_') || f.fieldname === 'images') {
          let pageName = 'General';
          if (f.fieldname.startsWith('image_')) {
            pageName = f.fieldname.replace('image_', '').replace(/_/g, ' ');
          }
          businessImages.push({
            url: `/uploads/forms/${f.filename}`,
            originalName: f.originalname,
            pageName,
            mimeType: f.mimetype,
            size: f.size,
            caption: '',
            uploadedAt: new Date(),
          });
        }
      });
    }

    const preferredColor = String(
      body.websiteDesign?.preferredColor ||
      body.preferredColor ||
      body.websiteDesign?.colorPreferences ||
      body.colorPreferences ||
      ''
    ).trim();

    const preferredTheme = String(
      body.websiteDesign?.preferredTheme ||
      body.preferredTheme ||
      body.websiteDesign?.designStyle ||
      body.designStyle ||
      ''
    ).trim();

    const websiteDesign = {
      preferredColor,
      preferredTheme,
      logo: logoData,
      businessImages,
      hasLogo: Boolean(logoData?.url),
      logoUrl: logoData?.url || '',
      brandGuidelinesUrl: String(body.websiteDesign?.brandGuidelinesUrl || body.brandGuidelinesUrl || '').trim(),
      inspirationNotes: String(body.websiteDesign?.inspirationNotes || body.inspirationNotes || '').trim(),
    };

    // ─── 5. EXTRACT CONTACT & SOCIAL MEDIA ───────────────────────────────────
    const contactAndSocial = {
      whatsappNumber: String(
        body.contactDetails?.whatsappNumber ||
        body.whatsappNumber ||
        body.businessDetails?.whatsappNumber ||
        whatsappNumber ||
        mobileNumber
      ).trim(),
      googleMapsLocation: String(
        body.contactDetails?.googleMapsLocation ||
        body.googleMapsLocation ||
        body.contactDetails?.googleMapsUrl ||
        body.googleMapsUrl ||
        body.mapsLocation ||
        ''
      ).trim(),
      instagramLink: String(
        body.contactDetails?.instagramLink ||
        body.instagramLink ||
        body.contactDetails?.instagramUrl ||
        body.instagramUrl ||
        body.instagram ||
        body.contactDetails?.socialLinks?.instagram ||
        ''
      ).trim(),
      facebookLink: String(
        body.contactDetails?.facebookLink ||
        body.facebookLink ||
        body.contactDetails?.facebookUrl ||
        body.facebookUrl ||
        body.facebook ||
        body.contactDetails?.socialLinks?.facebook ||
        ''
      ).trim(),
      youtubeLink: String(
        body.contactDetails?.youtubeLink ||
        body.youtubeLink ||
        body.contactDetails?.youtubeUrl ||
        body.youtubeUrl ||
        body.youtube ||
        body.contactDetails?.socialLinks?.youtube ||
        ''
      ).trim(),
      linkedinLink: String(
        body.contactDetails?.linkedinLink ||
        body.linkedinLink ||
        body.contactDetails?.linkedinUrl ||
        body.linkedinUrl ||
        body.linkedin ||
        body.contactDetails?.socialLinks?.linkedin ||
        ''
      ).trim(),
      preferredCommunication: String(
        body.contactDetails?.preferredCommunication ||
        body.preferredCommunication ||
        'WhatsApp'
      ).trim(),
    };

    // ─── 6. EXTRACT ADDITIONAL REQUIREMENTS ──────────────────────────────────
    let attachedFiles = body.additionalRequirements?.attachedFiles || body.attachedFiles || [];
    if (typeof attachedFiles === 'string') {
      try {
        attachedFiles = JSON.parse(attachedFiles);
      } catch {
        attachedFiles = [];
      }
    }
    if (req.files && Array.isArray(req.files)) {
      req.files
        .filter((f) => f.fieldname === 'attachedFiles' || f.fieldname === 'files')
        .forEach((f) => {
          attachedFiles.push({
            fileName: f.originalname,
            fileUrl: `/uploads/forms/${f.filename}`,
            fileType: f.mimetype,
            fileSize: f.size,
            uploadedAt: new Date(),
          });
        });
    }

    const additionalRequirements = {
      contactForm: parseBoolean(body.additionalRequirements?.contactForm ?? body.contactForm),
      whatsappChatButton: parseBoolean(body.additionalRequirements?.whatsappChatButton ?? body.whatsappChatButton),
      googleMaps: parseBoolean(body.additionalRequirements?.googleMaps ?? body.googleMaps),
      callNowButton: parseBoolean(body.additionalRequirements?.callNowButton ?? body.callNowButton),

      // Optional/Extended fields
      featuresNeeded: normalizeArray(body.additionalRequirements?.featuresNeeded || body.featuresNeeded || body.features),
      domainStatus: String(body.additionalRequirements?.domainStatus || body.domainStatus || '').trim(),
      hostingStatus: String(body.additionalRequirements?.hostingStatus || body.hostingStatus || '').trim(),
      targetLaunchDate: String(body.additionalRequirements?.targetLaunchDate || body.targetLaunchDate || '').trim(),
      budgetRange: String(body.additionalRequirements?.budgetRange || body.budgetRange || '').trim(),
      specialInstructions: String(
        body.additionalRequirements?.specialInstructions ||
        body.additionalRequirements?.additionalNotes ||
        body.specialInstructions ||
        body.notes ||
        ''
      ).trim(),
      attachedFiles: Array.isArray(attachedFiles) ? attachedFiles : [],
    };

    // ─── 7. RESOLVE TENANT ───────────────────────────────────────────────────
    let tenantId = req.tenantId;
    if (!tenantId) {
      const defaultTenant =
        (await withoutTenantScope(() => Tenant.findOne({ subdomain: 'default' }))) ||
        (await withoutTenantScope(() => Tenant.findOne({ subdomain: 'novatech-demo' }))) ||
        (await withoutTenantScope(() => Tenant.findOne({})));
      if (defaultTenant) {
        tenantId = defaultTenant._id;
      }
    }

    // ─── 8. GENERATE UNIQUE SUBMISSION ID ─────────────────────────────────────
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const submissionId = `SUB-${dateStr}-${rand}`;

    // ─── 9. SAVE SUBMISSION RECORD ───────────────────────────────────────────
    const submission = await withoutTenantScope(() =>
      FormSubmission.create({
        submissionId,
        submissionDate: now,
        sourceWebsite: body.sourceWebsite || 'ApnaDigital',
        status: 'New',
        businessDetails,
        websitePages,
        businessInfo,
        websiteDesign,
        contactDetails: contactAndSocial,
        additionalRequirements,
        tenantId,
        ipAddress: req.ip || req.headers?.['x-forwarded-for'] || '',
        userAgent: req.headers?.['user-agent'] || '',
      })
    );

    return res.status(201).json({
      success: true,
      message: 'Website requirement form received successfully.',
      submissionId: submission.submissionId,
      data: {
        _id: submission._id,
        submissionId: submission.submissionId,
        businessName: submission.businessDetails.businessName,
        ownerName: submission.businessDetails.ownerName,
        emailAddress: submission.businessDetails.emailAddress,
        mobileNumber: submission.businessDetails.mobileNumber,
        status: submission.status,
        submissionDate: submission.submissionDate,
      },
    });
  } catch (error) {
    console.error('[Forms] Error in submitForm:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your submission. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Public File / Media Upload API for ApnaDigital Website
 * @route   POST /api/forms/upload
 * @access  Public (Rate-limited)
 */
export const uploadFormFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a valid file.',
      });
    }

    const fileUrl = `/uploads/forms/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('[Forms] Error in uploadFormFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get All Form Submissions (Search, Filter, Pagination)
 * @route   GET /api/forms
 * @access  Private (CRM Staff / Admin)
 */
export const getFormSubmissions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Status
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    // Filter by Business Category
    if (req.query.category && req.query.category !== 'All') {
      query['businessDetails.businessCategory'] = req.query.category;
    }

    // Filter by Submission Date (presets or custom date range)
    if (req.query.datePreset && req.query.datePreset !== 'all') {
      const now = new Date();
      if (req.query.datePreset === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        query.submissionDate = { $gte: start };
      } else if (req.query.datePreset === 'yesterday') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        query.submissionDate = { $gte: start, $lte: end };
      } else if (req.query.datePreset === 'last_7_days') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.submissionDate = { $gte: start };
      } else if (req.query.datePreset === 'last_30_days') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.submissionDate = { $gte: start };
      } else if (req.query.datePreset === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        query.submissionDate = { $gte: start };
      }
    } else if (req.query.startDate || req.query.endDate) {
      query.submissionDate = {};
      if (req.query.startDate) {
        query.submissionDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.submissionDate.$lte = end;
      }
    }

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
      query.$or = [
        { submissionId: searchRegex },
        { 'businessDetails.businessName': searchRegex },
        { 'businessDetails.ownerName': searchRegex },
        { 'businessDetails.businessCategory': searchRegex },
        { 'businessDetails.mobileNumber': searchRegex },
        { 'businessDetails.emailAddress': searchRegex },
        { 'businessDetails.businessAddress': searchRegex },
      ];
    }

    const [submissions, total, totalAll, newCount, statusAgg, categories] = await withoutTenantScope(() =>
      Promise.all([
        FormSubmission.find(query)
          .sort({ submissionDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FormSubmission.countDocuments(query),
        FormSubmission.countDocuments({}),
        FormSubmission.countDocuments({ status: 'New' }),
        FormSubmission.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        FormSubmission.distinct('businessDetails.businessCategory'),
      ])
    );

    const statusCounts = {
      New: newCount,
      Viewed: 0,
      'In Review': 0,
      Contacted: 0,
      Converted: 0,
      Archived: 0,
    };
    if (Array.isArray(statusAgg)) {
      statusAgg.forEach((item) => {
        if (item._id && statusCounts[item._id] !== undefined) {
          statusCounts[item._id] = item.count;
        }
      });
    }

    return res.status(200).json({
      success: true,
      submissions,
      total,
      totalAll,
      newCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      statusCounts,
      categories: (categories || []).filter(Boolean),
    });
  } catch (error) {
    console.error('[Forms] Error in getFormSubmissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve form submissions.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Single Form Submission Details by ID or submissionId
 * @route   GET /api/forms/:id
 * @access  Private (CRM Staff / Admin)
 */
export const getFormSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    let submission = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      submission = await withoutTenantScope(() => FormSubmission.findById(id).lean());
    }
    if (!submission) {
      submission = await withoutTenantScope(() => FormSubmission.findOne({ submissionId: id }).lean());
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found.',
      });
    }

    // Automatically mark as Viewed in MongoDB if status is currently New
    let wasNew = false;
    if (submission.status === 'New') {
      wasNew = true;
      await withoutTenantScope(() =>
        FormSubmission.updateOne({ _id: submission._id }, { $set: { status: 'Viewed' } })
      );
      submission.status = 'Viewed';
    }

    return res.status(200).json({
      ...submission,
      wasNew,
    });
  } catch (error) {
    console.error('[Forms] Error in getFormSubmissionById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve form details.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update Form Submission Status & Internal Notes
 * @route   PUT /api/forms/:id/status
 * @access  Private (CRM Staff / Admin)
 */
export const updateFormSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const allowedStatuses = ['New', 'Viewed', 'Read', 'In Review', 'Contacted', 'Converted', 'Archived'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const updateFields = {};
    if (status) {
      // Normalize 'Read' to 'Viewed' for consistent storage
      updateFields.status = status === 'Read' ? 'Viewed' : status;
    }
    if (typeof internalNotes === 'string') updateFields.internalNotes = internalNotes;

    let submission = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      submission = await withoutTenantScope(() =>
        FormSubmission.findByIdAndUpdate(
          id,
          { $set: updateFields },
          { returnDocument: 'after' }
        )
      );
    }
    if (!submission) {
      submission = await withoutTenantScope(() =>
        FormSubmission.findOneAndUpdate(
          { submissionId: id },
          { $set: updateFields },
          { returnDocument: 'after' }
        )
      );
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: submission,
    });
  } catch (error) {
    console.error('[Forms] Error in updateFormSubmissionStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update form status.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete Form Submission
 * @route   DELETE /api/forms/:id
 * @access  Private (CRM Admin Only)
 */
export const deleteFormSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    let submission = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      submission = await withoutTenantScope(() => FormSubmission.findByIdAndDelete(id));
    }
    if (!submission) {
      submission = await withoutTenantScope(() => FormSubmission.findOneAndDelete({ submissionId: id }));
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found.',
      });
    }

    // Clean up uploaded files from disk if stored locally in /uploads/forms
    try {
      const filesToDelete = [];
      if (submission.websiteDesign?.logo?.url) {
        filesToDelete.push(submission.websiteDesign.logo.url);
      }
      if (Array.isArray(submission.websiteDesign?.businessImages)) {
        submission.websiteDesign.businessImages.forEach((img) => {
          if (img?.url) filesToDelete.push(img.url);
        });
      }

      filesToDelete.forEach((fileUrl) => {
        if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/forms/')) {
          const filePath = path.join(path.resolve(), fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    } catch (cleanupErr) {
      console.warn('[Forms] Warning cleaning up deleted form files:', cleanupErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Form submission deleted successfully.',
    });
  } catch (error) {
    console.error('[Forms] Error in deleteFormSubmission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete form submission.',
      error: error.message,
    });
  }
};
