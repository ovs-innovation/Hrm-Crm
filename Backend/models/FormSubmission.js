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

    // Optional legacy/extended fields
    businessType: { type: String, trim: true, default: '' },
    existingWebsiteUrl: { type: String, trim: true, default: '' },
    tagline: { type: String, trim: true, default: '' },
    yearEstablished: { type: String, trim: true, default: '' },
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
    servicesOrProducts: { type: String, trim: true, default: '' },
    businessDescription: { type: String, trim: true, default: '' },
    businessWorkingHours: { type: String, trim: true, default: '' },
    businessLocation: { type: String, trim: true, default: '' },

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
    googleMapsLocation: { type: String, trim: true, default: '' },
    instagramLink: { type: String, trim: true, default: '' },
    facebookLink: { type: String, trim: true, default: '' },
    youtubeLink: { type: String, trim: true, default: '' },
    linkedinLink: { type: String, trim: true, default: '' },

    // Optional legacy/extended fields
    preferredCommunication: { type: String, default: 'WhatsApp' },
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
      enum: ['New', 'Viewed', 'Read', 'In Review', 'Contacted', 'Converted', 'Archived'],
      default: 'New',
      index: true,
    },
    internalNotes: {
      type: String,
      default: '',
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
