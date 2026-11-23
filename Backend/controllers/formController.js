import fs from 'fs';
import path from 'path';
import FormSubmission from '../models/FormSubmission.js';
import Tenant from '../models/Tenant.js';
import Client from '../models/Client.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';
import { io } from '../socket/socket.js';

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
      'customerDetails',
      'businessDetails',
      'websitePages',
      'businessInfo',
      'websiteDesign',
      'contactDetails',
      'additionalRequirements',
      'billingDetails',
      'socialLinks',
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

    // ─── 1. EXTRACT & SANITIZE CUSTOMER & TAX DETAILS ────────────────────────
    const businessName = String(
      body.companyName ||
      body.customerDetails?.companyName ||
      body.customerDetails?.businessName ||
      body.businessDetails?.businessName ||
      body.businessName ||
      ''
    ).trim();

    const ownerName = String(
      body.fullName ||
      body.customerDetails?.fullName ||
      body.customerDetails?.ownerName ||
      body.businessDetails?.ownerName ||
      body.ownerName ||
      body.name ||
      ''
    ).trim();

    const businessCategory = String(
      body.businessCategory ||
      body.customerDetails?.businessCategory ||
      body.businessDetails?.businessCategory ||
      body.category ||
      body.industry ||
      body.businessInfo?.businessCategory ||
      ''
    ).trim();

    const rawMobile = String(
      body.customerDetails?.mobileNumber ||
      body.businessDetails?.mobileNumber ||
      body.mobileNumber ||
      body.phone ||
      body.contactDetails?.phone ||
      body.contactDetails?.mobileNumber ||
      ''
    ).trim();
    let mobileNumber = rawMobile.replace(/\D/g, '');
    if (mobileNumber.length === 12 && mobileNumber.startsWith('91')) {
      mobileNumber = mobileNumber.slice(2);
    } else if (mobileNumber.length === 11 && mobileNumber.startsWith('0')) {
      mobileNumber = mobileNumber.slice(1);
    }

    const emailAddress = String(
      body.customerDetails?.emailAddress ||
      body.customerDetails?.email ||
      body.businessDetails?.emailAddress ||
      body.emailAddress ||
      body.email ||
      body.contactDetails?.email ||
      body.contactDetails?.emailAddress ||
      ''
    ).toLowerCase().trim();

    const registeredAddress = String(
      body.customerDetails?.registeredAddress ||
      body.businessDetails?.registeredAddress ||
      body.registeredAddress ||
      body.businessDetails?.businessAddress ||
      body.businessAddress ||
      body.address ||
      body.contactDetails?.address ||
      ''
    ).trim();

    const businessAddress = String(
      body.businessDetails?.businessAddress ||
      body.businessAddress ||
      body.address ||
      body.contactDetails?.address ||
      body.contactDetails?.businessAddress ||
      registeredAddress
    ).trim();

    const rawGstStatus = String(
      body.customerDetails?.gstStatus ||
      body.businessDetails?.gstStatus ||
      body.gstStatus ||
      ''
    ).trim().toLowerCase();
    const gstStatus = ['registered', 'not_registered'].includes(rawGstStatus)
      ? rawGstStatus
      : (body.panNumber || body.customerDetails?.panNumber || body.businessDetails?.panNumber ? 'not_registered' : 'registered');

    const gstNumber = String(
      body.customerDetails?.gstNumber ||
      body.businessDetails?.gstNumber ||
      body.gstNumber ||
      ''
    ).trim().toUpperCase();

    const panNumber = String(
      body.customerDetails?.panNumber ||
      body.businessDetails?.panNumber ||
      body.panNumber ||
      ''
    ).trim().toUpperCase();

    // ─── 2. COMPREHENSIVE VALIDATION ─────────────────────────────────────────
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
    } else if (mobileNumber.length < 10 || mobileNumber.length > 15) {
      validationErrors.push({ field: 'mobileNumber', message: 'Please provide a valid 10 to 15 digit mobile number.' });
    }
    if (!emailAddress) {
      validationErrors.push({ field: 'emailAddress', message: 'Email Address is required.' });
    } else if (!isValidEmail(emailAddress)) {
      validationErrors.push({ field: 'emailAddress', message: 'Please provide a valid email address.' });
    }
    if (!registeredAddress) {
      validationErrors.push({ field: 'registeredAddress', message: 'Registered Address is required.' });
    }

    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (gstStatus === 'registered') {
      if (gstNumber) {
        if (!GSTIN_REGEX.test(gstNumber)) {
          validationErrors.push({ field: 'gstNumber', message: 'Please provide a valid 15-character GSTIN (e.g. 07AAAAA0000A1Z5).' });
        }
      } else if (rawGstStatus === 'registered') {
        validationErrors.push({ field: 'gstNumber', message: 'GSTIN is required for registered businesses.' });
      }
    } else if (gstStatus === 'not_registered') {
      if (panNumber) {
        if (!PAN_REGEX.test(panNumber)) {
          validationErrors.push({ field: 'panNumber', message: 'Please provide a valid 10-character PAN number (e.g. ABCDE1234F).' });
        }
      } else if (rawGstStatus === 'not_registered') {
        validationErrors.push({ field: 'panNumber', message: 'PAN number is required when not registered for GST.' });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted fields.',
        errors: validationErrors,
      });
    }

    const rawWa = String(
      body.whatsappNumber ||
      body.whatsapp ||
      body.customerDetails?.whatsappNumber ||
      body.businessDetails?.whatsappNumber ||
      body.contactDetails?.whatsappNumber ||
      mobileNumber
    ).trim();
    let whatsappNumber = rawWa.replace(/\D/g, '') || mobileNumber;
    if (whatsappNumber.length === 12 && whatsappNumber.startsWith('91')) {
      whatsappNumber = whatsappNumber.slice(2);
    } else if (whatsappNumber.length === 11 && whatsappNumber.startsWith('0')) {
      whatsappNumber = whatsappNumber.slice(1);
    }

    const businessDetails = {
      businessName,
      ownerName,
      businessCategory,
      mobileNumber,
      whatsappNumber,
      emailAddress,
      businessAddress: businessAddress || registeredAddress,
      registeredAddress,
      gstStatus,
      gstNumber,
      panNumber,
      businessType: String(body.businessDetails?.businessType || body.businessType || '').trim(),
      existingWebsiteUrl: String(body.businessDetails?.existingWebsiteUrl || body.existingWebsiteUrl || body.websiteUrl || '').trim(),
      tagline: String(body.businessDetails?.tagline || body.tagline || body.websiteDesign?.tagline || '').trim(),
      yearEstablished: String(body.businessDetails?.yearEstablished || body.yearEstablished || '').trim(),
    };

    const customerDetails = {
      fullName: ownerName,
      ownerName,
      companyName: businessName,
      businessName,
      mobileNumber,
      emailAddress,
      gstStatus,
      gstNumber,
      panNumber,
      registeredAddress,
    };

    // ─── 3. EXTRACT WEBSITE PAGES ────────────────────────────────────────────
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

    // ─── 4. EXTRACT BUSINESS INFORMATION ─────────────────────────────────────
    let rawServices =
      body.servicesOrProducts ||
      body.servicesProducts ||
      body.businessInfo?.servicesOrProducts ||
      body.businessInfo?.servicesProducts ||
      body.businessInfo?.servicesDetails ||
      body.servicesDetails ||
      body.services ||
      body.products ||
      '';
    if (typeof rawServices === 'string' && rawServices.trim().startsWith('[') && rawServices.trim().endsWith(']')) {
      try {
        rawServices = JSON.parse(rawServices);
      } catch {
        // keep as string
      }
    }
    const servicesOrProducts = Array.isArray(rawServices)
      ? rawServices.map((s) => String(s || '').trim()).filter(Boolean)
      : String(rawServices || '').trim();

    const businessInfo = {
      aboutBusiness: String(
        body.aboutUs ||
        body.businessInfo?.aboutUs ||
        body.businessInfo?.aboutBusiness ||
        body.aboutBusiness ||
        body.about ||
        ''
      ).trim(),
      servicesOrProducts,
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
        businessAddress ||
        registeredAddress ||
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

    // Process businessInfo document uploads (PDF, DOC, DOCX)
    const businessInfoFieldMap = {
      doc_businessDescription: 'businessDescriptionFile',
      doc_aboutBusiness: 'aboutBusinessFile',
      doc_servicesDetails: 'servicesDetailsFile',
      doc_workingHours: 'workingHoursFile',
      doc_businessLocation: 'businessLocationFile',
    };

    const businessInfoDocs = [];
    const allFiles = req.files
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      : req.file ? [req.file] : [];

    allFiles.forEach((f) => {
      const targetProp = businessInfoFieldMap[f.fieldname];
      if (targetProp) {
        const fileMeta = {
          url: `/uploads/forms/${f.filename}`,
          originalName: f.originalname,
          mimeType: f.mimetype,
          size: f.size,
          uploadedAt: new Date(),
        };
        businessInfo[targetProp] = fileMeta;
        businessInfoDocs.push(fileMeta);

        const textProp = targetProp.replace('File', '');
        if (!businessInfo[textProp] && textProp !== 'servicesDetails') {
          businessInfo[textProp] = `[Document: ${f.originalname}]`;
        } else if (!businessInfo.servicesOrProducts && targetProp === 'servicesDetailsFile') {
          businessInfo.servicesOrProducts = `[Document: ${f.originalname}]`;
        }
      }
    });
    businessInfo.documents = businessInfoDocs;

    // ─── 5. EXTRACT WEBSITE DESIGN & BRANDING ────────────────────────────────
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
    const logoFile = allFiles.find(
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
    allFiles.forEach((f) => {
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

    const tagline = String(
      body.websiteDesign?.tagline ||
      body.tagline ||
      body.businessDetails?.tagline ||
      ''
    ).trim();

    const needLogoDesign = parseBoolean(
      body.needLogoDesign ??
      body.websiteDesign?.needLogoDesign ??
      body.billingDetails?.needLogoDesign
    );

    const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const rawPrimaryColor = String(
      body.websiteDesign?.primaryColor ||
      body.primaryColor ||
      body.websiteDesign?.preferredColor ||
      body.preferredColor ||
      ''
    ).trim();
    const primaryColor = HEX_COLOR_REGEX.test(rawPrimaryColor) ? rawPrimaryColor : '#E50914';

    const rawSecondaryColor = String(
      body.websiteDesign?.secondaryColor ||
      body.secondaryColor ||
      ''
    ).trim();
    const secondaryColor = HEX_COLOR_REGEX.test(rawSecondaryColor) ? rawSecondaryColor : '#1F2937';

    const rawFontStyle = String(
      body.websiteDesign?.fontStyle ||
      body.fontStyle ||
      'Inter'
    ).trim();
    const fontStyle = rawFontStyle || 'Inter';

    const rawWebsiteTheme = String(
      body.websiteDesign?.websiteTheme ||
      body.websiteTheme ||
      body.websiteDesign?.preferredTheme ||
      body.preferredTheme ||
      'basic'
    ).trim();
    const websiteTheme = ['basic', 'dark-saas', 'luxury-editorial'].includes(rawWebsiteTheme)
      ? rawWebsiteTheme
      : 'basic';

    const preferredColor = String(
      body.websiteDesign?.preferredColor ||
      body.preferredColor ||
      primaryColor
    ).trim();

    const preferredTheme = String(
      body.websiteDesign?.preferredTheme ||
      body.preferredTheme ||
      websiteTheme
    ).trim();

    const websiteDesign = {
      tagline,
      needLogoDesign,
      primaryColor,
      secondaryColor,
      fontStyle,
      websiteTheme,
      preferredColor,
      preferredTheme,
      logo: logoData,
      businessImages,
      hasLogo: Boolean(logoData?.url),
      logoUrl: logoData?.url || '',
      brandGuidelinesUrl: String(body.websiteDesign?.brandGuidelinesUrl || body.brandGuidelinesUrl || '').trim(),
      inspirationNotes: String(body.websiteDesign?.inspirationNotes || body.inspirationNotes || '').trim(),
    };

    // ─── 6. EXTRACT CONTACT & SOCIAL MEDIA ───────────────────────────────────
    let contactMobile = String(
      body.contactDetails?.contactMobile ||
      body.contactMobile ||
      body.contactDetails?.phone ||
      mobileNumber
    ).trim().replace(/\D/g, '') || mobileNumber;
    if (contactMobile.length === 12 && contactMobile.startsWith('91')) {
      contactMobile = contactMobile.slice(2);
    } else if (contactMobile.length === 11 && contactMobile.startsWith('0')) {
      contactMobile = contactMobile.slice(1);
    }

    const contactEmail = String(
      body.contactDetails?.contactEmail ||
      body.contactEmail ||
      body.contactDetails?.email ||
      emailAddress
    ).trim().toLowerCase() || emailAddress;

    const socialInstagram = String(
      body.instagramUrl ||
      body.contactDetails?.instagramUrl ||
      body.contactDetails?.socialLinks?.instagram ||
      body.socialLinks?.instagramUrl ||
      body.socialLinks?.instagram ||
      body.contactDetails?.instagramLink ||
      body.instagramLink ||
      body.instagram ||
      ''
    ).trim();

    const socialFacebook = String(
      body.facebookUrl ||
      body.contactDetails?.facebookUrl ||
      body.contactDetails?.socialLinks?.facebook ||
      body.socialLinks?.facebookUrl ||
      body.socialLinks?.facebook ||
      body.contactDetails?.facebookLink ||
      body.facebookLink ||
      body.facebook ||
      ''
    ).trim();

    const socialLinkedin = String(
      body.linkedinUrl ||
      body.contactDetails?.linkedinUrl ||
      body.contactDetails?.socialLinks?.linkedin ||
      body.socialLinks?.linkedinUrl ||
      body.socialLinks?.linkedin ||
      body.contactDetails?.linkedinLink ||
      body.linkedinLink ||
      body.linkedin ||
      ''
    ).trim();

    const socialYoutube = String(
      body.youtubeUrl ||
      body.contactDetails?.youtubeUrl ||
      body.contactDetails?.socialLinks?.youtube ||
      body.socialLinks?.youtubeUrl ||
      body.socialLinks?.youtube ||
      body.contactDetails?.youtubeLink ||
      body.youtubeLink ||
      body.youtube ||
      ''
    ).trim();

    const contactAndSocial = {
      whatsappNumber,
      contactMobile,
      contactEmail,
      businessAddress: businessAddress || registeredAddress,
      googleMapsLocation: String(
        body.contactDetails?.googleMapsLocation ||
        body.googleMapsLocation ||
        body.contactDetails?.googleMapsUrl ||
        body.googleMapsUrl ||
        body.mapsLocation ||
        ''
      ).trim(),
      instagramLink: socialInstagram,
      facebookLink: socialFacebook,
      youtubeLink: socialYoutube,
      linkedinLink: socialLinkedin,
      socialLinks: {
        instagram: socialInstagram,
        facebook: socialFacebook,
        linkedin: socialLinkedin,
        youtube: socialYoutube,
      },
      preferredCommunication: String(
        body.contactDetails?.preferredCommunication ||
        body.preferredCommunication ||
        'WhatsApp'
      ).trim(),
    };

    // ─── 7. EXTRACT ADDITIONAL REQUIREMENTS ──────────────────────────────────
    let attachedFiles = body.additionalRequirements?.attachedFiles || body.attachedFiles || [];
    if (typeof attachedFiles === 'string') {
      try {
        attachedFiles = JSON.parse(attachedFiles);
      } catch {
        attachedFiles = [];
      }
    }
    allFiles
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

    if (businessInfoDocs && businessInfoDocs.length > 0) {
      businessInfoDocs.forEach((doc) => {
        attachedFiles.push({
          fileName: doc.originalName,
          fileUrl: doc.url,
          fileType: doc.mimeType,
          fileSize: doc.size,
          uploadedAt: doc.uploadedAt,
        });
      });
    }

    const additionalRequirements = {
      contactForm: parseBoolean(body.additionalRequirements?.contactForm ?? body.contactForm),
      whatsappChatButton: parseBoolean(body.additionalRequirements?.whatsappChatButton ?? body.whatsappChatButton),
      googleMaps: parseBoolean(body.additionalRequirements?.googleMaps ?? body.googleMaps),
      callNowButton: parseBoolean(body.additionalRequirements?.callNowButton ?? body.callNowButton),
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

    // ─── 8. PACKAGE & PRICING METADATA ───────────────────────────────────────
    const basePackagePrice = Number(body.billingDetails?.basePackagePrice || 4999);
    const logoDesignPrice = needLogoDesign ? Number(body.billingDetails?.logoDesignPrice || 999) : 0;
    const subtotalAmount = Number(body.subtotalAmount || (basePackagePrice + logoDesignPrice));
    const gstRate = 18;
    const gstAmount = Number(body.gstAmount || Math.round(subtotalAmount * 0.18));
    const computedTotal = subtotalAmount + gstAmount;
    const totalAmount = (body.totalAmount !== undefined && body.totalAmount !== null && body.totalAmount !== '')
      ? Number(body.totalAmount)
      : (body.billingDetails?.totalAmount !== undefined ? Number(body.billingDetails.totalAmount) : computedTotal);
    const currency = String(body.currency || body.billingDetails?.currency || 'INR').trim();
    const rawPaymentStatus = String(body.paymentStatus || body.billingDetails?.paymentStatus || 'Pending').trim();
    const paymentStatus = ['Pending', 'Paid', 'Waived'].includes(rawPaymentStatus)
      ? rawPaymentStatus
      : 'Pending';

    const billingDetails = {
      basePackagePrice,
      logoDesignPrice,
      subtotalAmount,
      gstRate,
      gstAmount,
      totalAmount,
      currency,
      paymentStatus,
    };

    // ─── 9. RESOLVE TENANT ───────────────────────────────────────────────────
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

    // ─── 10. GENERATE UNIQUE SUBMISSION ID ───────────────────────────────────
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const submissionId = `SUB-${dateStr}-${rand}`;

    // ─── 10b. LINK OR CREATE CRM CUSTOMER (LEAD) RECORD ──────────────────────
    let clientId = null;
    try {
      if (emailAddress && tenantId) {
        let existingClient = await withoutTenantScope(() =>
          Client.findOne({ tenantId, email: emailAddress })
        );
        if (!existingClient) {
          existingClient = await withoutTenantScope(() =>
            Client.create({
              name: ownerName,
              company: businessName,
              email: emailAddress,
              phone: mobileNumber,
              status: 'Lead',
              notes: `Website requirement form submitted via ApnaDigital (Ref: ${submissionId})`,
              tenantId,
            })
          );
        }
        if (existingClient) {
          clientId = existingClient._id;
        }
      }
    } catch (clientErr) {
      console.warn('[Forms] Note: CRM Customer lead linking skipped:', clientErr?.message);
    }

    // ─── 11. SAVE SUBMISSION RECORD IN MONGODB ───────────────────────────────
    let submission = null;
    const incomingSubId = String(body.submissionId || '').trim();
    if (incomingSubId) {
      submission = await withoutTenantScope(() =>
        FormSubmission.findOne({ submissionId: incomingSubId })
      );
    }

    if (submission) {
      submission.submissionDate = now;
      submission.sourceWebsite = body.sourceWebsite || 'ApnaDigital';
      submission.status = submission?.status === 'Viewed' ? 'Viewed' : (body.status || 'New');
      submission.isCompleted = true;
      submission.completedAt = now;
      submission.currentStep = 4;
      submission.stepCompleted = 4;
      submission.customerDetails = customerDetails;
      submission.businessDetails = businessDetails;
      submission.websitePages = websitePages;
      submission.businessInfo = businessInfo;
      submission.websiteDesign = websiteDesign;
      submission.contactDetails = contactAndSocial;
      submission.additionalRequirements = additionalRequirements;
      submission.billingDetails = billingDetails;
      if (clientId) submission.clientId = clientId;
      submission.ipAddress = req.ip || req.headers?.['x-forwarded-for'] || '';
      submission.userAgent = req.headers?.['user-agent'] || '';
      await withoutTenantScope(() => submission.save());
    } else {
      submission = await withoutTenantScope(() =>
        FormSubmission.create({
          submissionId,
          submissionDate: now,
          sourceWebsite: body.sourceWebsite || 'ApnaDigital',
          status: 'New',
          isCompleted: true,
          completedAt: now,
          currentStep: 4,
          stepCompleted: 4,
          customerDetails,
          businessDetails,
          websitePages,
          businessInfo,
          websiteDesign,
          contactDetails: contactAndSocial,
          additionalRequirements,
          billingDetails,
          tenantId,
          clientId,
          ipAddress: req.ip || req.headers?.['x-forwarded-for'] || '',
          userAgent: req.headers?.['user-agent'] || '',
        })
      );
    }

    // ─── 12. EMIT REAL-TIME CRM NOTIFICATION ─────────────────────────────────
    try {
      if (io) {
        const socketPayload = {
          _id: submission._id,
          submissionId: submission.submissionId,
          businessName: submission.businessDetails.businessName,
          ownerName: submission.businessDetails.ownerName,
          emailAddress: submission.businessDetails.emailAddress,
          mobileNumber: submission.businessDetails.mobileNumber,
          businessCategory: submission.businessDetails.businessCategory,
          totalAmount: submission.billingDetails?.totalAmount || totalAmount,
          status: submission.status,
          submissionDate: submission.submissionDate,
          createdAt: submission.createdAt,
        };
        io.emit('new_form_submission', socketPayload);
        io.emit('new_form', socketPayload);
      }
    } catch (socketErr) {
      console.warn('[Forms] Socket notification warning:', socketErr?.message);
    }

    // ─── 13. RETURN STANDARD 201 RESPONSE ────────────────────────────────────
    return res.status(201).json({
      success: true,
      submissionId: submission.submissionId,
      message: 'Requirement saved successfully',
      data: {
        _id: submission._id,
        submissionId: submission.submissionId,
        businessName: submission.businessDetails.businessName,
        ownerName: submission.businessDetails.ownerName,
        emailAddress: submission.businessDetails.emailAddress,
        mobileNumber: submission.businessDetails.mobileNumber,
        totalAmount: submission.billingDetails?.totalAmount || totalAmount,
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
 * @desc    Save Individual Form Step (1, 2, 3, or 4) & Maintain Single submissionId
 * @route   POST /api/forms/step
 * @access  Public (Rate-limited)
 */
export const saveFormStep = async (req, res) => {
  try {
    const body = req.body || {};
    const step = Math.min(4, Math.max(1, parseInt(body.step, 10) || 1));
    const isFinal = parseBoolean(body.isFinal || step === 4);
    let submissionId = String(body.submissionId || '').trim();

    // 1. Resolve Tenant
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

    // 2. Locate existing submission if submissionId is passed
    let submission = null;
    if (submissionId) {
      submission = await withoutTenantScope(() =>
        FormSubmission.findOne({ submissionId })
      );
    }

    // Helper for files
    const allFiles = Array.isArray(req.files)
      ? req.files
      : req.file
      ? [req.file]
      : [];
    const logoFile = allFiles.find(
      (f) => f.fieldname === 'logo' || f.fieldname === 'logoFile'
    );

    // 3. STEP-BY-STEP EXTRACTION & VALIDATION
    // -------------------------------------------------------------
    // Step 1: Customer Details
    // -------------------------------------------------------------
    const fullName = String(body.fullName || body.ownerName || submission?.businessDetails?.ownerName || '').trim();
    const companyName = String(body.companyName || body.businessName || submission?.businessDetails?.businessName || '').trim();
    const rawMobile = String(body.mobileNumber || body.phone || submission?.businessDetails?.mobileNumber || '').trim();
    let mobileNumber = rawMobile.replace(/\D/g, '');
    if (mobileNumber.length === 12 && mobileNumber.startsWith('91')) {
      mobileNumber = mobileNumber.slice(2);
    } else if (mobileNumber.length === 11 && mobileNumber.startsWith('0')) {
      mobileNumber = mobileNumber.slice(1);
    }

    const emailAddress = String(body.emailAddress || body.email || submission?.businessDetails?.emailAddress || '').toLowerCase().trim();
    const gstStatus = String(body.gstStatus || submission?.businessDetails?.gstStatus || 'registered').trim();
    const gstNumber = String(body.gstNumber || submission?.businessDetails?.gstNumber || '').toUpperCase().trim();
    const panNumber = String(body.panNumber || submission?.businessDetails?.panNumber || '').toUpperCase().trim();
    const registeredAddress = String(body.registeredAddress || body.address || submission?.businessDetails?.registeredAddress || '').trim();

    if (step === 1 || isFinal) {
      const validationErrors = [];
      if (!fullName) validationErrors.push({ field: 'fullName', message: 'Full name / Owner name is required.' });
      if (!companyName) validationErrors.push({ field: 'companyName', message: 'Company name is required.' });
      if (!mobileNumber || mobileNumber.length !== 10) {
        validationErrors.push({ field: 'mobileNumber', message: 'A valid 10-digit mobile number is required.' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailAddress || !emailRegex.test(emailAddress)) {
        validationErrors.push({ field: 'emailAddress', message: 'A valid email address is required.' });
      }
      if (!registeredAddress) {
        validationErrors.push({ field: 'registeredAddress', message: 'Registered company address is required.' });
      }
      if (gstStatus === 'registered') {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstNumber || !gstRegex.test(gstNumber)) {
          validationErrors.push({ field: 'gstNumber', message: 'Valid 15-character GSTIN is required when registered.' });
        }
      } else if (gstStatus === 'not_registered') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panNumber || !panRegex.test(panNumber)) {
          validationErrors.push({ field: 'panNumber', message: 'Valid 10-character PAN number is required.' });
        }
      }

      if (validationErrors.length > 0 && step === 1) {
        return res.status(400).json({
          success: false,
          message: 'Step 1 validation failed. Please check required fields.',
          errors: validationErrors,
        });
      }
    }

    // -------------------------------------------------------------
    // Step 2: Business Profile, Contact & Branding
    // -------------------------------------------------------------
    const businessCategory = String(body.businessCategory || submission?.businessDetails?.businessCategory || '').trim();
    const aboutUs = String(body.aboutUs || body.aboutBusiness || submission?.businessInfo?.aboutBusiness || '').trim();
    let rawServices =
      body.servicesOrProducts ||
      body.servicesProducts ||
      submission?.businessInfo?.servicesOrProducts ||
      '';
    if (typeof rawServices === 'string' && rawServices.trim().startsWith('[') && rawServices.trim().endsWith(']')) {
      try {
        rawServices = JSON.parse(rawServices);
      } catch {
        // keep as string
      }
    }
    const servicesProducts = Array.isArray(rawServices)
      ? rawServices.map((s) => String(s || '').trim()).filter(Boolean)
      : String(rawServices || '').trim();
    const contactMobile = String(body.contactMobile || body.mobileNumber || submission?.contactDetails?.contactMobile || mobileNumber).trim();
    const contactEmail = String(body.contactEmail || body.emailAddress || submission?.contactDetails?.contactEmail || emailAddress).trim().toLowerCase();
    const businessAddress = String(body.businessAddress || body.registeredAddress || submission?.businessDetails?.businessAddress || registeredAddress).trim();
    const rawWa = String(body.whatsappNumber || body.whatsapp || submission?.contactDetails?.whatsappNumber || mobileNumber).trim();
    let whatsappNumber = rawWa.replace(/\D/g, '') || mobileNumber;
    if (whatsappNumber.length === 12 && whatsappNumber.startsWith('91')) {
      whatsappNumber = whatsappNumber.slice(2);
    } else if (whatsappNumber.length === 11 && whatsappNumber.startsWith('0')) {
      whatsappNumber = whatsappNumber.slice(1);
    }

    const instagramUrl = String(body.instagramUrl || submission?.contactDetails?.socialLinks?.instagram || '').trim();
    const facebookUrl = String(body.facebookUrl || submission?.contactDetails?.socialLinks?.facebook || '').trim();
    const linkedinUrl = String(body.linkedinUrl || submission?.contactDetails?.socialLinks?.linkedin || '').trim();
    const youtubeUrl = String(body.youtubeUrl || submission?.contactDetails?.socialLinks?.youtube || '').trim();

    // Step 3: Logo & Branding Fields (with fallback to businessDetails for legacy compatibility)
    const tagline = String(
      body.tagline ||
      body.websiteDesign?.tagline ||
      submission?.websiteDesign?.tagline ||
      body.businessDetails?.tagline ||
      submission?.businessDetails?.tagline ||
      ''
    ).trim();

    const needLogoDesign = body.needLogoDesign !== undefined
      ? parseBoolean(body.needLogoDesign)
      : (body.websiteDesign?.needLogoDesign !== undefined
          ? parseBoolean(body.websiteDesign?.needLogoDesign)
          : (submission?.websiteDesign?.needLogoDesign ?? submission?.businessDetails?.needLogoDesign ?? false));

    if (step === 2 || isFinal) {
      const step2Errors = [];
      if (!businessCategory && step === 2) step2Errors.push({ field: 'businessCategory', message: 'Please select a business category.' });
      if (!aboutUs && step === 2) step2Errors.push({ field: 'aboutUs', message: 'Please enter a business description.' });
      const hasServices = Array.isArray(servicesProducts) ? servicesProducts.length > 0 : Boolean(servicesProducts);
      if (!hasServices && step === 2) step2Errors.push({ field: 'servicesProducts', message: 'Please list your main services or products.' });
      if (step === 2 && (!contactMobile || contactMobile.replace(/\D/g, '').length !== 10)) {
        step2Errors.push({ field: 'contactMobile', message: 'Valid 10-digit contact mobile is required.' });
      }
      if (step === 2 && !contactEmail) step2Errors.push({ field: 'contactEmail', message: 'Contact email is required.' });
      if (step === 2 && !businessAddress) step2Errors.push({ field: 'businessAddress', message: 'Business operating address is required.' });
      if (step === 2 && (!whatsappNumber || whatsappNumber.replace(/\D/g, '').length !== 10)) {
        step2Errors.push({ field: 'whatsappNumber', message: 'Valid 10-digit WhatsApp number is required.' });
      }

      if (step2Errors.length > 0 && step === 2) {
        return res.status(400).json({
          success: false,
          message: 'Step 2 validation failed. Please check required fields.',
          errors: step2Errors,
        });
      }
    }

    // -------------------------------------------------------------
    // Step 3: Design, Colors & Theme
    // -------------------------------------------------------------
    const primaryColor = String(body.primaryColor || submission?.websiteDesign?.primaryColor || '#E50914').trim();
    const secondaryColor = String(body.secondaryColor || submission?.websiteDesign?.secondaryColor || '#1F2937').trim();
    const rawFontStyle = String(body.fontStyle || submission?.websiteDesign?.fontStyle || 'Inter').trim();
    const fontStyle = rawFontStyle || 'Inter';
    const websiteTheme = String(body.websiteTheme || submission?.websiteDesign?.websiteTheme || 'Standard').trim();

    if (step === 3 || isFinal) {
      const step3Errors = [];
      const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
      if (step === 3 && !hexRegex.test(primaryColor)) step3Errors.push({ field: 'primaryColor', message: 'Valid primary color hex code is required.' });
      if (step === 3 && !hexRegex.test(secondaryColor)) step3Errors.push({ field: 'secondaryColor', message: 'Valid secondary color hex code is required.' });
      if (step === 3 && !fontStyle) step3Errors.push({ field: 'fontStyle', message: 'Please select a font style.' });

      if (step3Errors.length > 0 && step === 3) {
        return res.status(400).json({
          success: false,
          message: 'Step 3 validation failed. Please check required fields.',
          errors: step3Errors,
        });
      }
    }

    // -------------------------------------------------------------
    // Step 4 / Billing: Pricing metadata (Includes 18% GST)
    // -------------------------------------------------------------
    const basePackagePrice = 4999;
    const logoDesignPrice = needLogoDesign ? 999 : 0;
    const subtotalAmount = Number(body.subtotalAmount || (basePackagePrice + logoDesignPrice));
    const gstRate = 18;
    const gstAmount = Number(body.gstAmount || Math.round(subtotalAmount * 0.18));
    const computedTotal = subtotalAmount + gstAmount;
    const totalAmount = (body.totalAmount !== undefined && body.totalAmount !== null && body.totalAmount !== '')
      ? Number(body.totalAmount)
      : computedTotal;

    // Process logo file if uploaded in this request
    let logoData = submission?.websiteDesign?.logo || null;
    if (logoFile) {
      logoData = {
        url: `/uploads/forms/${logoFile.filename}`,
        originalName: logoFile.originalname,
        mimeType: logoFile.mimetype,
        size: logoFile.size,
        uploadedAt: new Date(),
      };
    } else if (needLogoDesign) {
      logoData = null;
    }

    // Link CRM Customer / Client
    let clientId = submission?.clientId || null;
    try {
      if (emailAddress && tenantId && !clientId) {
        let existingClient = await withoutTenantScope(() =>
          Client.findOne({ tenantId, email: emailAddress })
        );
        if (!existingClient) {
          existingClient = await withoutTenantScope(() =>
            Client.create({
              name: fullName,
              company: companyName,
              email: emailAddress,
              phone: mobileNumber,
              status: 'Lead',
              notes: `Website requirement form in progress (Ref: ${submissionId || 'Pending'})`,
              tenantId,
            })
          );
        }
        if (existingClient) {
          clientId = existingClient._id;
        }
      }
    } catch (clientErr) {
      console.warn('[Forms] CRM lead sync skipped:', clientErr?.message);
    }

    // Generate submissionId if this is the first save
    if (!submissionId) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      submissionId = `SUB-${dateStr}-${rand}`;
    }

    // Determine status & progress: newly submitted forms always have status 'New' (or preserve 'Viewed' if already opened)
    const isCompletedNow = isFinal || step === 4;
    const status = submission?.status === 'Viewed' ? 'Viewed' : (body.status || 'New');
    const nextCurrentStep = isCompletedNow ? 4 : Math.min(4, step + 1);
    const stepCompleted = Math.max(submission?.stepCompleted || 0, step);

    // Assemble updated subdocuments
    const updatedCustomerDetails = {
      fullName,
      ownerName: fullName,
      companyName,
      businessName: companyName,
      mobileNumber,
      emailAddress,
      gstStatus,
      gstNumber,
      panNumber,
      registeredAddress,
    };

    const updatedBusinessDetails = {
      businessName: companyName,
      ownerName: fullName,
      businessCategory: businessCategory || (submission?.businessDetails?.businessCategory || 'Pending Step 2'),
      mobileNumber,
      whatsappNumber,
      emailAddress,
      businessAddress: businessAddress || registeredAddress,
      registeredAddress,
      gstStatus,
      gstNumber,
      panNumber,
      tagline,
    };

    const updatedBusinessInfo = {
      ...(submission?.businessInfo || {}),
      aboutBusiness: aboutUs || submission?.businessInfo?.aboutBusiness || '',
      servicesOrProducts: servicesProducts || submission?.businessInfo?.servicesOrProducts || '',
      businessLocation: businessAddress || registeredAddress,
    };

    const updatedWebsiteDesign = {
      ...(submission?.websiteDesign || {}),
      tagline,
      needLogoDesign,
      primaryColor,
      secondaryColor,
      fontStyle,
      websiteTheme,
      preferredColor: primaryColor,
      preferredTheme: websiteTheme,
      logo: logoData,
      hasLogo: Boolean(logoData?.url),
      logoUrl: logoData?.url || '',
    };

    const updatedContactDetails = {
      whatsappNumber,
      contactMobile,
      contactEmail,
      businessAddress: businessAddress || registeredAddress,
      instagramLink: instagramUrl,
      facebookLink: facebookUrl,
      linkedinLink: linkedinUrl,
      youtubeLink: youtubeUrl,
      socialLinks: {
        instagram: instagramUrl,
        facebook: facebookUrl,
        linkedin: linkedinUrl,
        youtube: youtubeUrl,
      },
    };

    const updatedBillingDetails = {
      basePackagePrice,
      logoDesignPrice,
      subtotalAmount,
      gstRate,
      gstAmount,
      totalAmount,
      currency: 'INR',
      paymentStatus: 'Pending',
    };

    if (submission) {
      // Update existing document in MongoDB
      submission.customerDetails = updatedCustomerDetails;
      submission.businessDetails = updatedBusinessDetails;
      submission.businessInfo = updatedBusinessInfo;
      submission.websiteDesign = updatedWebsiteDesign;
      submission.contactDetails = updatedContactDetails;
      submission.billingDetails = updatedBillingDetails;
      submission.currentStep = nextCurrentStep;
      submission.stepCompleted = stepCompleted;
      submission.status = status;
      submission.isCompleted = isCompletedNow;
      if (isCompletedNow) {
        submission.completedAt = new Date();
        submission.submissionDate = new Date();
      }
      if (clientId) {
        submission.clientId = clientId;
      }

      await withoutTenantScope(() => submission.save());
    } else {
      // Create new document with In Progress status
      submission = await withoutTenantScope(() =>
        FormSubmission.create({
          submissionId,
          submissionDate: new Date(),
          sourceWebsite: 'ApnaDigital',
          status,
          currentStep: nextCurrentStep,
          stepCompleted,
          isCompleted: isCompletedNow,
          completedAt: isCompletedNow ? new Date() : null,
          customerDetails: updatedCustomerDetails,
          businessDetails: updatedBusinessDetails,
          websitePages: {
            selectedPages: ['Home', 'About Us', 'Our Services', 'Gallery / Our Work', 'Contact Us'],
          },
          businessInfo: updatedBusinessInfo,
          websiteDesign: updatedWebsiteDesign,
          contactDetails: updatedContactDetails,
          billingDetails: updatedBillingDetails,
          tenantId,
          clientId,
          ipAddress: req.ip || req.headers?.['x-forwarded-for'] || '',
          userAgent: req.headers?.['user-agent'] || '',
        })
      );
    }

    // Real-time notification if completed or new step
    try {
      if (io) {
        const socketPayload = {
          _id: submission._id,
          submissionId: submission.submissionId,
          businessName: submission.businessDetails.businessName,
          ownerName: submission.businessDetails.ownerName,
          emailAddress: submission.businessDetails.emailAddress,
          mobileNumber: submission.businessDetails.mobileNumber,
          businessCategory: submission.businessDetails.businessCategory,
          totalAmount: submission.billingDetails?.totalAmount || totalAmount,
          status: submission.status,
          currentStep: submission.currentStep,
          stepCompleted: submission.stepCompleted,
          isCompleted: submission.isCompleted,
          submissionDate: submission.submissionDate,
          updatedAt: submission.updatedAt,
        };
        io.emit('new_form_submission', socketPayload);
        io.emit('new_form', socketPayload);
        io.emit('form_step_saved', socketPayload);
      }
    } catch (socketErr) {
      console.warn('[Forms] Socket emit warning:', socketErr?.message);
    }

    return res.status(200).json({
      success: true,
      submissionId: submission.submissionId,
      stepSaved: step,
      currentStep: submission.currentStep,
      stepCompleted: submission.stepCompleted,
      status: submission.status,
      isCompleted: submission.isCompleted,
      message: isCompletedNow
        ? 'Requirement saved successfully'
        : `Step ${step} saved successfully`,
      data: {
        submissionId: submission.submissionId,
        businessName: submission.businessDetails.businessName,
        ownerName: submission.businessDetails.ownerName,
        status: submission.status,
        currentStep: submission.currentStep,
        stepCompleted: submission.stepCompleted,
        isCompleted: submission.isCompleted,
        totalAmount: submission.billingDetails?.totalAmount || totalAmount,
        logo: submission.websiteDesign?.logo || null,
      },
    });
  } catch (error) {
    console.error('[Forms] Error in saveFormStep:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save form step. Please check connection and try again.',
      error: error.message,
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

    // Filter by Status: 'New' returns unviewed forms
    if (req.query.status && req.query.status !== 'All') {
      const s = String(req.query.status).trim();
      if (s.toLowerCase() === 'new') {
        query.status = 'New';
      } else {
        query.status = s;
      }
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

    const [submissions, total, totalAll, newCount, categories] = await withoutTenantScope(() =>
      Promise.all([
        FormSubmission.find(query)
          .populate('clientId', 'name company email phone status')
          .sort({ submissionDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FormSubmission.countDocuments(query),
        FormSubmission.countDocuments({}),
        FormSubmission.countDocuments({ status: 'New' }),
        FormSubmission.distinct('businessDetails.businessCategory'),
      ])
    );

    return res.status(200).json({
      success: true,
      submissions,
      total,
      totalAll,
      newCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
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
      submission = await withoutTenantScope(() =>
        FormSubmission.findById(id).populate('clientId', 'name company email phone status').lean()
      );
    }
    if (!submission) {
      submission = await withoutTenantScope(() =>
        FormSubmission.findOne({ submissionId: id }).populate('clientId', 'name company email phone status').lean()
      );
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
