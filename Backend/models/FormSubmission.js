import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

// Schema for Logo / File Metadata
const fileMetadataSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Schema for Business Image associated with a specific Website Page
const businessImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, default: '' },
    pageName: { type: String, default: 'General', trim: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    caption: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 1. BUSINESS DETAILS SCHEMA
const businessDetailsSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    businessCategory: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: '' },
    emailAddress: { type: String, required: true, trim: true, lowercase: true },
    businessAddress: { type: String, trim: true, default: '' },
    registeredAddress: { type: String, trim: true, default: '' },
    gstStatus: {
      type: String,
      enum: ['registered', 'not_registered'],
      default: 'registered',
      trim: true,
    },
    gstNumber: { type: String, trim: true, uppercase: true, default: '' },
    panNumber: { type: String, trim: true, uppercase: true, default: '' },

    // Optional legacy/extended fields
    businessType: { type: String, trim: true, default: '' },
    existingWebsiteUrl: { type: String, trim: true, default: '' },
    tagline: { type: String, trim: true, default: '' },
    yearEstablished: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// Customer Details Schema (Mirrors businessDetails for 4-step frontend form)
const customerDetailsSchema = new mongoose.Schema(
  {
    ownerName: { type: String, trim: true, default: '' },
    fullName: { type: String, trim: true, default: '' },
    businessName: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    mobileNumber: { type: String, trim: true, default: '' },
    emailAddress: { type: String, trim: true, lowercase: true, default: '' },
    gstStatus: {
      type: String,
      enum: ['registered', 'not_registered'],
      default: 'registered',
    },
    gstNumber: { type: String, trim: true, uppercase: true, default: '' },
    panNumber: { type: String, trim: true, uppercase: true, default: '' },
    registeredAddress: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// 2. WEBSITE PAGES SCHEMA
// Standard pages: Home, About Us, Our Services, Gallery / Our Work, Contact Us
const websitePagesSchema = new mongoose.Schema(
  {
    selectedPages: [{ type: String, trim: true }],
    estimatedPageCount: { type: String, trim: true, default: '' },
    customPages: [{ type: String, trim: true }],
    eCommerceNeeded: { type: Boolean, default: false },
    blogNeeded: { type: Boolean, default: false },
  },
  { _id: false }
);

// 3. BUSINESS INFORMATION SCHEMA
const businessInformationSchema = new mongoose.Schema(
  {
    aboutBusiness: { type: String, trim: true, default: '' },
    servicesOrProducts: { type: mongoose.Schema.Types.Mixed, default: [] },
    businessDescription: { type: String, trim: true, default: '' },
    businessWorkingHours: { type: String, trim: true, default: '' },
    businessLocation: { type: String, trim: true, default: '' },

    // Field-level uploaded documents (PDF, DOC, DOCX)
    businessDescriptionFile: { type: fileMetadataSchema, default: null },
    aboutBusinessFile: { type: fileMetadataSchema, default: null },
    servicesDetailsFile: { type: fileMetadataSchema, default: null },
    workingHoursFile: { type: fileMetadataSchema, default: null },
    businessLocationFile: { type: fileMetadataSchema, default: null },
    documents: [fileMetadataSchema],

    // Optional legacy/extended fields
    targetAudience: { type: String, trim: true, default: '' },
    primaryGoal: { type: String, trim: true, default: '' },
    uniqueSellingPoints: { type: String, trim: true, default: '' },
    competitorUrls: [{ type: String, trim: true }],
    referenceWebsites: [{ type: String, trim: true }],
    contentReadiness: { type: String, default: 'Partially Ready' },
  },
  { _id: false }
);

// 4. WEBSITE DESIGN SCHEMA
const websiteDesignSchema = new mongoose.Schema(
  {
    tagline: { type: String, trim: true, default: '' },
    needLogoDesign: { type: Boolean, default: false },
    primaryColor: {
      type: String,
      trim: true,
      default: '#E50914',
    },
    secondaryColor: {
      type: String,
      trim: true,
      default: '#1F2937',
    },
    fontStyle: {
      type: String,
      default: 'Inter',
    },
    websiteTheme: {
      type: String,
      default: 'basic',
    },
    preferredColor: { type: String, trim: true, default: '' },
    preferredTheme: { type: String, trim: true, default: '' },
    logo: { type: fileMetadataSchema, default: null },
    businessImages: [businessImageSchema],

    // UI compatibility aliases
    hasLogo: { type: Boolean, default: false },
    logoUrl: { type: String, default: '' },
    brandGuidelinesUrl: { type: String, default: '' },
    inspirationNotes: { type: String, default: '' },
  },
  { _id: false }
);

// 5. CONTACT & SOCIAL MEDIA SCHEMA
const contactAndSocialSchema = new mongoose.Schema(
  {
    whatsappNumber: { type: String, trim: true, default: '' },
    contactMobile: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    businessAddress: { type: String, trim: true, default: '' },
    googleMapsLocation: { type: String, trim: true, default: '' },
    instagramLink: { type: String, trim: true, default: '' },
    facebookLink: { type: String, trim: true, default: '' },
    youtubeLink: { type: String, trim: true, default: '' },
    linkedinLink: { type: String, trim: true, default: '' },
    socialLinks: {
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
    },

    // Optional legacy/extended fields
    preferredCommunication: { type: String, default: 'WhatsApp' },
  },
  { _id: false }
);

// 6. BILLING & PACKAGE DETAILS SCHEMA
const billingDetailsSchema = new mongoose.Schema(
  {
    basePackagePrice: { type: Number, default: 4999 },
    logoDesignPrice: { type: Number, default: 0 },
    subtotalAmount: { type: Number, default: 4999 },
    gstRate: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 900 },
    totalAmount: { type: Number, default: 5899 },
    currency: { type: String, default: 'INR', trim: true },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Waived'],
      default: 'Pending',
    },
  },
  { _id: false }
);

// 6. ADDITIONAL REQUIREMENTS SCHEMA
const additionalRequirementsSchema = new mongoose.Schema(
  {
    contactForm: { type: Boolean, default: false },
    whatsappChatButton: { type: Boolean, default: false },
    googleMaps: { type: Boolean, default: false },
    callNowButton: { type: Boolean, default: false },

    // Optional legacy/extended fields
    featuresNeeded: [{ type: String, trim: true }],
    domainStatus: { type: String, default: '' },
    hostingStatus: { type: String, default: '' },
    targetLaunchDate: { type: String, default: '' },
    budgetRange: { type: String, default: '' },
    specialInstructions: { type: String, default: '' },
    attachedFiles: [
      {
        fileName: { type: String, default: '' },
        fileUrl: { type: String, required: true },
        fileType: { type: String, default: 'file' },
        fileSize: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

// MAIN FORM SUBMISSION SCHEMA
const formSubmissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      default: () => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `SUB-${dateStr}-${rand}`;
      },
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sourceWebsite: {
      type: String,
      default: 'ApnaDigital',
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'New',
        'Viewed',
        'Read',
        'In Review',
        'Contacted',
        'Converted',
        'Archived',
        'In Progress',
        'Completed',
      ],
      default: 'New',
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    stepCompleted: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    internalNotes: {
      type: String,
      default: '',
    },

    // Linked CRM Client (Lead) Record
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },

    // Customer Details (Mirrored with businessDetails for 4-step frontend form)
    customerDetails: {
      type: customerDetailsSchema,
      default: () => ({}),
    },

    // 1. Business Details
    businessDetails: {
      type: businessDetailsSchema,
      required: true,
      default: () => ({}),
    },

    // 2. Website Pages
    websitePages: {
      type: websitePagesSchema,
      default: () => ({}),
    },

    // 3. Business Information
    businessInfo: {
      type: businessInformationSchema,
      default: () => ({}),
    },

    // 4. Website Design
    websiteDesign: {
      type: websiteDesignSchema,
      default: () => ({}),
    },

    // 5. Contact & Social Media
    contactDetails: {
      type: contactAndSocialSchema,
      default: () => ({}),
    },

    // 6. Additional Requirements
    additionalRequirements: {
      type: additionalRequirementsSchema,
      default: () => ({}),
    },

    // 7. Billing & Package Metadata
    billingDetails: {
      type: billingDetailsSchema,
      default: () => ({}),
    },

    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Auto-generate submissionId and submissionDate before validation
formSubmissionSchema.pre('validate', function () {
  if (!this.submissionId) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.submissionId = `SUB-${dateStr}-${rand}`;
  }
  if (!this.submissionDate) {
    this.submissionDate = this.createdAt || new Date();
  }

  // Address sync between businessDetails, customerDetails, and contactDetails
  if (this.businessDetails) {
    if (!this.businessDetails.registeredAddress && this.businessDetails.businessAddress) {
      this.businessDetails.registeredAddress = this.businessDetails.businessAddress;
    } else if (!this.businessDetails.businessAddress && this.businessDetails.registeredAddress) {
      this.businessDetails.businessAddress = this.businessDetails.registeredAddress;
    }

    if (!this.customerDetails) {
      this.customerDetails = {};
    }
    this.customerDetails.ownerName = this.customerDetails.ownerName || this.businessDetails.ownerName || '';
    this.customerDetails.fullName = this.customerDetails.fullName || this.businessDetails.ownerName || '';
    this.customerDetails.businessName = this.customerDetails.businessName || this.businessDetails.businessName || '';
    this.customerDetails.companyName = this.customerDetails.companyName || this.businessDetails.businessName || '';
    this.customerDetails.mobileNumber = this.customerDetails.mobileNumber || this.businessDetails.mobileNumber || '';
    this.customerDetails.emailAddress = this.customerDetails.emailAddress || this.businessDetails.emailAddress || '';
    this.customerDetails.gstStatus = this.customerDetails.gstStatus || this.businessDetails.gstStatus || 'registered';
    this.customerDetails.gstNumber = this.customerDetails.gstNumber || this.businessDetails.gstNumber || '';
    this.customerDetails.panNumber = this.customerDetails.panNumber || this.businessDetails.panNumber || '';
    this.customerDetails.registeredAddress = this.customerDetails.registeredAddress || this.businessDetails.registeredAddress || '';
  }

  // Sync logoUrl and hasLogo inside websiteDesign
  if (this.websiteDesign) {
    if (this.websiteDesign.logo?.url) {
      this.websiteDesign.logoUrl = this.websiteDesign.logo.url;
      this.websiteDesign.hasLogo = true;
    } else if (this.websiteDesign.logoUrl && !this.websiteDesign.logo) {
      this.websiteDesign.logo = {
        url: this.websiteDesign.logoUrl,
        originalName: 'logo',
        mimeType: 'image/png',
      };
      this.websiteDesign.hasLogo = true;
    }

    if (!this.websiteDesign.preferredColor && this.websiteDesign.primaryColor) {
      this.websiteDesign.preferredColor = this.websiteDesign.primaryColor;
    } else if (!this.websiteDesign.primaryColor && this.websiteDesign.preferredColor) {
      this.websiteDesign.primaryColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(this.websiteDesign.preferredColor)
        ? this.websiteDesign.preferredColor
        : '#E50914';
    }

    if (!this.websiteDesign.preferredTheme && this.websiteDesign.websiteTheme) {
      this.websiteDesign.preferredTheme = this.websiteDesign.websiteTheme;
    }
  }

  // Sync contactDetails and socialLinks
  if (this.contactDetails) {
    if (!this.contactDetails.socialLinks) {
      this.contactDetails.socialLinks = {};
    }
    const sl = this.contactDetails.socialLinks;
    if (this.contactDetails.instagramLink && !sl.instagram) sl.instagram = this.contactDetails.instagramLink;
    if (sl.instagram && !this.contactDetails.instagramLink) this.contactDetails.instagramLink = sl.instagram;

    if (this.contactDetails.facebookLink && !sl.facebook) sl.facebook = this.contactDetails.facebookLink;
    if (sl.facebook && !this.contactDetails.facebookLink) this.contactDetails.facebookLink = sl.facebook;

    if (this.contactDetails.linkedinLink && !sl.linkedin) sl.linkedin = this.contactDetails.linkedinLink;
    if (sl.linkedin && !this.contactDetails.linkedinLink) this.contactDetails.linkedinLink = sl.linkedin;

    if (this.contactDetails.youtubeLink && !sl.youtube) sl.youtube = this.contactDetails.youtubeLink;
    if (sl.youtube && !this.contactDetails.youtubeLink) this.contactDetails.youtubeLink = sl.youtube;

    if (!this.contactDetails.businessAddress && this.businessDetails?.businessAddress) {
      this.contactDetails.businessAddress = this.businessDetails.businessAddress;
    }
  }

  // Sync whatsappNumber in businessDetails / contactDetails if one is set
  if (this.businessDetails && this.contactDetails) {
    if (!this.contactDetails.whatsappNumber && this.businessDetails.whatsappNumber) {
      this.contactDetails.whatsappNumber = this.businessDetails.whatsappNumber;
    } else if (!this.businessDetails.whatsappNumber && this.contactDetails.whatsappNumber) {
      this.businessDetails.whatsappNumber = this.contactDetails.whatsappNumber;
    } else if (!this.businessDetails.whatsappNumber && this.businessDetails.mobileNumber) {
      this.businessDetails.whatsappNumber = this.businessDetails.mobileNumber;
      this.contactDetails.whatsappNumber = this.businessDetails.mobileNumber;
    }
  }

  // Calculate & sync billingDetails
  if (!this.billingDetails) {
    this.billingDetails = {};
  }
  const isLogoAddon = Boolean(this.websiteDesign?.needLogoDesign);
  if (!this.billingDetails.basePackagePrice) {
    this.billingDetails.basePackagePrice = 4999;
  }
  if (isLogoAddon) {
    if (!this.billingDetails.logoDesignPrice || this.billingDetails.logoDesignPrice === 0) {
      this.billingDetails.logoDesignPrice = 999;
    }
  } else {
    this.billingDetails.logoDesignPrice = 0;
  }
  this.billingDetails.subtotalAmount =
    (this.billingDetails.basePackagePrice || 4999) + (this.billingDetails.logoDesignPrice || 0);
  this.billingDetails.totalAmount = this.billingDetails.subtotalAmount;
  if (!this.billingDetails.currency) {
    this.billingDetails.currency = 'INR';
  }
  if (!this.billingDetails.paymentStatus) {
    this.billingDetails.paymentStatus = 'Pending';
  }
});

// Apply tenant scoping
tenantScoped(formSubmissionSchema);

// Compound indexes for CRM filtering, sorting, and text searching
formSubmissionSchema.index({ status: 1, submissionDate: -1 });
formSubmissionSchema.index({
  submissionId: 'text',
  'businessDetails.businessName': 'text',
  'businessDetails.ownerName': 'text',
  'businessDetails.emailAddress': 'text',
  'businessDetails.mobileNumber': 'text',
  'businessDetails.businessCategory': 'text',
});

const FormSubmission = mongoose.models.FormSubmission || mongoose.model('FormSubmission', formSubmissionSchema);

export default FormSubmission;
