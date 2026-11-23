import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import FormSubmission from '../models/FormSubmission.js';
import { submitForm, deleteFormSubmission } from '../controllers/formController.js';

describe('Forms Module (ApnaDigital Requirement Form Submissions)', () => {
  it('instantiates FormSubmission with valid data across all 6 sections and generates submissionId', () => {
    const doc = new FormSubmission({
      tenantId: new mongoose.Types.ObjectId(),
      businessDetails: {
        businessName: 'Vastora Retail',
        ownerName: 'Vansh Kesarwani',
        businessCategory: 'E-Commerce & Retail',
        mobileNumber: '9876543210',
        whatsappNumber: '9876543210',
        emailAddress: 'vansh@vastoratech.com',
        businessAddress: '202, JS Arcade, Sector-51, Noida, UP',
      },
      websitePages: {
        selectedPages: ['Home', 'About Us', 'Our Services', 'Gallery / Our Work', 'Contact Us'],
      },
      businessInfo: {
        aboutBusiness: 'Leading digital retail solutions provider in North India.',
        servicesOrProducts: 'Custom software, CRM solutions, and cloud integration.',
        businessDescription: 'Providing modern digital tools to empower local enterprises.',
        businessWorkingHours: 'Mon-Sat: 9:00 AM - 7:00 PM',
        businessLocation: 'Sector-51, Noida, Uttar Pradesh, India',
      },
      websiteDesign: {
        preferredColor: 'Royal Blue and Gold accent',
        preferredTheme: 'Modern Minimalist',
        logo: {
          url: '/uploads/forms/vastora-logo.png',
          originalName: 'vastora-logo.png',
          mimeType: 'image/png',
          size: 45200,
        },
        businessImages: [
          {
            url: '/uploads/forms/hero-office.jpg',
            originalName: 'office.jpg',
            pageName: 'Home',
            mimeType: 'image/jpeg',
            size: 128000,
          },
          {
            url: '/uploads/forms/services-showcase.jpg',
            originalName: 'services.jpg',
            pageName: 'Our Services',
            mimeType: 'image/jpeg',
            size: 194000,
          },
        ],
      },
      contactDetails: {
        whatsappNumber: '9876543210',
        googleMapsLocation: 'https://maps.google.com/?q=Noida+Sector+51',
        instagramLink: 'https://instagram.com/vastoratech',
        facebookLink: 'https://facebook.com/vastoratech',
        youtubeLink: 'https://youtube.com/@vastoratech',
        linkedinLink: 'https://linkedin.com/company/vastora-tech',
      },
      additionalRequirements: {
        contactForm: true,
        whatsappChatButton: true,
        googleMaps: true,
        callNowButton: true,
      },
      status: 'New',
      sourceWebsite: 'ApnaDigital',
    });

    const validationError = doc.validateSync();
    assert.strictEqual(validationError, undefined, 'FormSubmission document should validate cleanly');
    assert.ok(doc.submissionId.startsWith('SUB-'), 'Should auto-generate submissionId starting with SUB-');
    assert.strictEqual(doc.businessDetails.businessName, 'Vastora Retail');
    assert.strictEqual(doc.websitePages.selectedPages.length, 5);
    assert.strictEqual(doc.websiteDesign.businessImages.length, 2);
    assert.strictEqual(doc.websiteDesign.businessImages[1].pageName, 'Our Services');
    assert.strictEqual(doc.additionalRequirements.contactForm, true);
    assert.strictEqual(doc.additionalRequirements.whatsappChatButton, true);
    assert.strictEqual(doc.additionalRequirements.googleMaps, true);
    assert.strictEqual(doc.additionalRequirements.callNowButton, true);
    assert.strictEqual(doc.status, 'New');
  });

  it('fails validation when required fields in Business Details are missing', () => {
    const doc = new FormSubmission({
      tenantId: new mongoose.Types.ObjectId(),
      businessDetails: {
        // missing businessName, ownerName, businessCategory, mobileNumber, emailAddress
      },
    });

    const validationError = doc.validateSync();
    assert.ok(validationError, 'Validation error must be raised');
    assert.ok(validationError.errors['businessDetails.businessName'], 'businessName is required');
    assert.ok(validationError.errors['businessDetails.ownerName'], 'ownerName is required');
    assert.ok(validationError.errors['businessDetails.businessCategory'], 'businessCategory is required');
    assert.ok(validationError.errors['businessDetails.mobileNumber'], 'mobileNumber is required');
    assert.ok(validationError.errors['businessDetails.emailAddress'], 'emailAddress is required');
  });

  it('submitForm controller returns 400 with descriptive error array when required fields are missing', async () => {
    let statusCode = null;
    let responseBody = null;

    const mockReq = {
      body: {
        businessName: '', // empty
        ownerName: '',
        mobileNumber: '123', // invalid phone
        emailAddress: 'notanemail', // invalid email
      },
    };

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await submitForm(mockReq, mockRes);

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.success, false);
    assert.ok(Array.isArray(responseBody.errors));
    assert.ok(responseBody.errors.some((e) => e.field === 'businessName'));
    assert.ok(responseBody.errors.some((e) => e.field === 'mobileNumber'));
    assert.ok(responseBody.errors.some((e) => e.field === 'emailAddress'));
  });

  it('restricts invalid status values through schema enum constraint', () => {
    const doc = new FormSubmission({
      tenantId: new mongoose.Types.ObjectId(),
      businessDetails: {
        businessName: 'Test Shop',
        ownerName: 'Test Owner',
        businessCategory: 'Retail',
        mobileNumber: '9999999999',
        emailAddress: 'test@shop.com',
      },
      status: 'UnknownStatus',
    });

    const validationError = doc.validateSync();
    assert.ok(validationError, 'Validation error should be triggered for invalid status');
    assert.ok(validationError.errors.status, 'Status must adhere to allowed enum');
  });

  it('deleteFormSubmission controller handles non-existent record gracefully', async () => {
    let statusCode = null;
    let responseBody = null;

    const originalFindByIdAndDelete = FormSubmission.findByIdAndDelete;
    FormSubmission.findByIdAndDelete = async () => null;
    const originalFindOneAndDelete = FormSubmission.findOneAndDelete;
    FormSubmission.findOneAndDelete = async () => null;

    try {
      const mockReq = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };

      const mockRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        },
      };

      await deleteFormSubmission(mockReq, mockRes);

      assert.strictEqual(statusCode, 404);
      assert.strictEqual(responseBody.success, false);
      assert.strictEqual(responseBody.message, 'Form submission not found.');
    } finally {
      FormSubmission.findByIdAndDelete = originalFindByIdAndDelete;
      FormSubmission.findOneAndDelete = originalFindOneAndDelete;
    }
  });

  it('rejects invalid GSTIN format when gstStatus is registered', async () => {
    let statusCode = null;
    let responseBody = null;

    const mockReq = {
      body: {
        customerDetails: {
          fullName: 'Rajesh Kumar',
          companyName: 'Kumar Traders',
          mobileNumber: '9876543210',
          emailAddress: 'rajesh@kumartraders.in',
          gstStatus: 'registered',
          gstNumber: 'INVALID_GST_123',
          registeredAddress: '123 MG Road, Bengaluru',
        },
        businessCategory: 'Retail & Wholesale',
      },
    };

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await submitForm(mockReq, mockRes);

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.success, false);
    assert.ok(responseBody.errors.some((e) => e.field === 'gstNumber'));
  });

  it('rejects invalid PAN format when gstStatus is not_registered', async () => {
    let statusCode = null;
    let responseBody = null;

    const mockReq = {
      body: {
        customerDetails: {
          fullName: 'Pooja Sharma',
          companyName: 'Pooja Designs',
          mobileNumber: '9876543210',
          emailAddress: 'pooja@poojadesigns.com',
          gstStatus: 'not_registered',
          panNumber: '12345BADPAN',
          registeredAddress: 'Shop 4, Hauz Khas, New Delhi',
        },
        businessCategory: 'Design & Creative',
      },
    };

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await submitForm(mockReq, mockRes);

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.success, false);
    assert.ok(responseBody.errors.some((e) => e.field === 'panNumber'));
  });

  it('calculates package pricing dynamically with and without logo addon', async () => {
    // 1. Without logo addon (4999)
    const baseDoc = new FormSubmission({
      tenantId: new mongoose.Types.ObjectId(),
      businessDetails: {
        businessName: 'Apex Logistics',
        ownerName: 'Vansh Kesarwani',
        businessCategory: 'Logistics',
        mobileNumber: '9876543210',
        emailAddress: 'vansh@apex.com',
        registeredAddress: 'Sector 62, Noida',
      },
      websiteDesign: {
        needLogoDesign: false,
      },
    });
    await baseDoc.validate();
    assert.strictEqual(baseDoc.billingDetails.basePackagePrice, 4999);
    assert.strictEqual(baseDoc.billingDetails.logoDesignPrice, 0);
    assert.strictEqual(baseDoc.billingDetails.totalAmount, 4999);

    // 2. With logo addon (5998 = 4999 + 999)
    const addonDoc = new FormSubmission({
      tenantId: new mongoose.Types.ObjectId(),
      businessDetails: {
        businessName: 'Apex Logistics',
        ownerName: 'Vansh Kesarwani',
        businessCategory: 'Logistics',
        mobileNumber: '9876543210',
        emailAddress: 'vansh@apex.com',
        registeredAddress: 'Sector 62, Noida',
      },
      websiteDesign: {
        needLogoDesign: true,
      },
    });
    await addonDoc.validate();
    assert.strictEqual(addonDoc.billingDetails.basePackagePrice, 4999);
    assert.strictEqual(addonDoc.billingDetails.logoDesignPrice, 999);
    assert.strictEqual(addonDoc.billingDetails.totalAmount, 5998);
  });
});
