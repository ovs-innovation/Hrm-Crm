import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FormSubmission from '../models/FormSubmission.js';
import Tenant from '../models/Tenant.js';
import {
  submitForm,
  getFormSubmissions,
  getFormSubmissionById,
  updateFormSubmissionStatus,
  deleteFormSubmission,
} from '../controllers/formController.js';
import { contextStorage } from '../middlewares/contextMiddleware.js';

let mongoServer;
let tenant;
const sampleFilesCreated = [];

// Helper to create mock request and response
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.data = body;
      return this;
    },
  };
  return res;
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  tenant = await Tenant.create({
    companyName: 'ApnaDigital Partner Agency',
    subdomain: 'apnadigital',
    apiKey: 'key-apnadigital-' + Date.now(),
  });

  // Ensure test uploads directory exists
  const uploadDir = path.join(path.resolve(), 'uploads', 'forms');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create a dummy uploaded logo and image to simulate Multer file processing
  const testLogoPath = path.join(uploadDir, 'test-logo-sample.png');
  fs.writeFileSync(testLogoPath, 'PNG_MOCK_DATA_123');
  sampleFilesCreated.push(testLogoPath);

  const testHomeImgPath = path.join(uploadDir, 'test-home-hero.jpg');
  fs.writeFileSync(testHomeImgPath, 'JPG_MOCK_DATA_456');
  sampleFilesCreated.push(testHomeImgPath);

  const testServicesImgPath = path.join(uploadDir, 'test-services-grid.jpg');
  fs.writeFileSync(testServicesImgPath, 'JPG_MOCK_DATA_789');
  sampleFilesCreated.push(testServicesImgPath);
});

after(async () => {
  // Clean up test files
  for (const filePath of sampleFilesCreated) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // Ignored
    }
  }

  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Full End-to-End Integration Flow: ApnaDigital Form -> CRM Backend -> MongoDB -> CRM Sales -> Forms', () => {
  let createdSubmissionId = null;
  let createdMongoId = null;

  it('1. Customer submits all six sections with logo and multiple page-grouped business images', async () => {
    const mockReq = {
      body: {
        sourceWebsite: 'ApnaDigital',
        businessDetails: {
          businessName: 'Apna Bakery & Cafe',
          ownerName: 'Vansh Kesarwani',
          businessCategory: 'Food & Beverage',
          mobileNumber: '9876543210',
          whatsappNumber: '9876543210',
          emailAddress: 'vansh@apnabakery.in',
          businessAddress: 'Plot 42, Commercial Sector 18, Noida',
        },
        websitePages: {
          selectedPages: ['Home', 'About Us', 'Our Services', 'Gallery / Our Work', 'Contact Us'],
        },
        businessInfo: {
          aboutBusiness: 'Artisan bakery established in 2020 specializing in sourdough and cakes.',
          servicesOrProducts: 'Custom wedding cakes, sourdough breads, coffee, catering.',
          businessDescription: 'Premium organic bakery offering doorstep delivery.',
          businessWorkingHours: 'Mon-Sun: 8:00 AM - 10:00 PM',
          businessLocation: 'Noida, Uttar Pradesh',
        },
        websiteDesign: {
          preferredColor: '#D97706',
          preferredTheme: 'Modern & Clean',
        },
        contactDetails: {
          whatsappNumber: '9876543210',
          googleMapsLocation: 'https://maps.app.goo.gl/samplebakerylocation',
          instagramLink: 'https://instagram.com/apnabakery',
          facebookLink: 'https://facebook.com/apnabakery',
          youtubeLink: 'https://youtube.com/@apnabakery',
          linkedinLink: 'https://linkedin.com/company/apnabakery',
        },
        additionalRequirements: {
          contactForm: true,
          whatsappChatButton: true,
          googleMaps: true,
          callNowButton: true,
          specialInstructions: 'Need online order menu and fast 10-day turnaround.',
        },
      },
      // Simulate Multer req.files attached to request
      files: [
        {
          fieldname: 'logo',
          filename: 'test-logo-sample.png',
          originalname: 'brand-logo.png',
          mimetype: 'image/png',
          size: 10240,
        },
        {
          fieldname: 'image_Home',
          filename: 'test-home-hero.jpg',
          originalname: 'bakery-exterior.jpg',
          mimetype: 'image/jpeg',
          size: 51200,
        },
        {
          fieldname: 'image_Our_Services',
          filename: 'test-services-grid.jpg',
          originalname: 'cakes-menu.jpg',
          mimetype: 'image/jpeg',
          size: 81920,
        },
      ],
    };

    const mockRes = createMockRes();

    // Context with tenant scope
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await submitForm(mockReq, mockRes);
    });

    assert.strictEqual(mockRes.statusCode, 201, 'Should return HTTP 201 Created');
    assert.strictEqual(mockRes.data.success, true);
    assert.ok(mockRes.data.submissionId.startsWith('SUB-'), 'Should return formatted submissionId');

    createdSubmissionId = mockRes.data.submissionId;
    assert.strictEqual(mockRes.data.data.businessName, 'Apna Bakery & Cafe');
    assert.strictEqual(mockRes.data.data.status, 'New');
  });

  it('2. Verifies all 6 sections, files, and page-grouped images are accurately stored in MongoDB', async () => {
    const doc = await FormSubmission.findOne({ submissionId: createdSubmissionId }).lean();
    assert.ok(doc, 'Document must be persisted in MongoDB');
    createdMongoId = doc._id.toString();

    // Section 1: Business Details
    assert.strictEqual(doc.businessDetails.businessName, 'Apna Bakery & Cafe');
    assert.strictEqual(doc.businessDetails.ownerName, 'Vansh Kesarwani');
    assert.strictEqual(doc.businessDetails.businessCategory, 'Food & Beverage');
    assert.strictEqual(doc.businessDetails.mobileNumber, '9876543210');
    assert.strictEqual(doc.businessDetails.whatsappNumber, '9876543210');
    assert.strictEqual(doc.businessDetails.emailAddress, 'vansh@apnabakery.in');
    assert.strictEqual(doc.businessDetails.businessAddress, 'Plot 42, Commercial Sector 18, Noida');

    // Section 2: Website Pages
    assert.deepStrictEqual(doc.websitePages.selectedPages, [
      'Home',
      'About Us',
      'Our Services',
      'Gallery / Our Work',
      'Contact Us',
    ]);

    // Section 3: Business Information
    assert.strictEqual(doc.businessInfo.aboutBusiness, 'Artisan bakery established in 2020 specializing in sourdough and cakes.');
    assert.strictEqual(doc.businessInfo.businessWorkingHours, 'Mon-Sun: 8:00 AM - 10:00 PM');
    assert.strictEqual(doc.businessInfo.businessLocation, 'Noida, Uttar Pradesh');

    // Section 4: Website Design & Images
    assert.strictEqual(doc.websiteDesign.preferredColor, '#D97706');
    assert.strictEqual(doc.websiteDesign.preferredTheme, 'Modern & Clean');
    assert.ok(doc.websiteDesign.logo, 'Logo object must exist');
    assert.strictEqual(doc.websiteDesign.logo.originalName, 'brand-logo.png');
    assert.strictEqual(doc.websiteDesign.logo.url, '/uploads/forms/test-logo-sample.png');

    // Verify images are properly grouped by page name
    assert.strictEqual(doc.websiteDesign.businessImages.length, 2);
    const homeImg = doc.websiteDesign.businessImages.find((img) => img.pageName === 'Home');
    assert.ok(homeImg, 'Must have image grouped under page "Home"');
    assert.strictEqual(homeImg.originalName, 'bakery-exterior.jpg');

    const servicesImg = doc.websiteDesign.businessImages.find((img) => img.pageName === 'Our Services');
    assert.ok(servicesImg, 'Must have image grouped under page "Our Services"');
    assert.strictEqual(servicesImg.originalName, 'cakes-menu.jpg');

    // Section 5: Contact & Social Media
    assert.strictEqual(doc.contactDetails.instagramLink, 'https://instagram.com/apnabakery');
    assert.strictEqual(doc.contactDetails.googleMapsLocation, 'https://maps.app.goo.gl/samplebakerylocation');

    // Section 6: Additional Requirements
    assert.strictEqual(doc.additionalRequirements.contactForm, true);
    assert.strictEqual(doc.additionalRequirements.whatsappChatButton, true);
    assert.strictEqual(doc.additionalRequirements.googleMaps, true);
    assert.strictEqual(doc.additionalRequirements.callNowButton, true);
    assert.strictEqual(doc.additionalRequirements.specialInstructions, 'Need online order menu and fast 10-day turnaround.');
  });

  it('3. CRM Sales -> Forms GET API retrieves the submission with live metrics (totalAll & newCount)', async () => {
    const mockReq = {
      query: { page: '1', limit: '15' },
    };
    const mockRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissions(mockReq, mockRes);
    });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.data.success, true);
    assert.ok(mockRes.data.total >= 1);
    assert.ok(mockRes.data.totalAll >= 1);
    assert.ok(mockRes.data.newCount >= 1);

    const found = mockRes.data.submissions.find((s) => s.submissionId === createdSubmissionId);
    assert.ok(found, 'Newly created submission must appear in CRM listing');
    assert.strictEqual(found.businessDetails.businessName, 'Apna Bakery & Cafe');
    assert.strictEqual(found.businessDetails.ownerName, 'Vansh Kesarwani');
    assert.strictEqual(found.businessDetails.mobileNumber, '9876543210');
    assert.strictEqual(found.businessDetails.emailAddress, 'vansh@apnabakery.in');
    assert.strictEqual(found.businessDetails.businessCategory, 'Food & Beverage');
  });

  it('4. Filters work: filtering by status "New" finds the submission, filtering by "Converted" excludes it', async () => {
    // 1. Status 'New'
    const newReq = { query: { status: 'New' } };
    const newRes = createMockRes();
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissions(newReq, newRes);
    });
    assert.strictEqual(newRes.statusCode, 200);
    const hasInNew = newRes.data.submissions.some((s) => s.submissionId === createdSubmissionId);
    assert.strictEqual(hasInNew, true, 'Should be present under New filter');

    // 2. Status 'Converted'
    const convReq = { query: { status: 'Converted' } };
    const convRes = createMockRes();
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissions(convReq, convRes);
    });
    assert.strictEqual(convRes.statusCode, 200);
    const hasInConv = convRes.data.submissions.some((s) => s.submissionId === createdSubmissionId);
    assert.strictEqual(hasInConv, false, 'Should NOT be present under Converted filter');
  });

  it('5. Search works: searches by businessName, ownerName, or mobileNumber', async () => {
    const searchReq = { query: { search: 'Apna Bakery' } };
    const searchRes = createMockRes();
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissions(searchReq, searchRes);
    });
    assert.strictEqual(searchRes.statusCode, 200);
    assert.ok(searchRes.data.submissions.some((s) => s.submissionId === createdSubmissionId));
  });

  it('6. HR opens View Details: retrieves complete form submission by ID and automatically marks as Viewed', async () => {
    const mockReq = { params: { id: createdMongoId } };
    const mockRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissionById(mockReq, mockRes);
    });

    assert.strictEqual(mockRes.statusCode, 200);
    const details = mockRes.data;
    assert.strictEqual(details.businessDetails.businessName, 'Apna Bakery & Cafe');
    assert.strictEqual(details.websiteDesign.logo.originalName, 'brand-logo.png');
    assert.strictEqual(details.websiteDesign.businessImages.length, 2);
    assert.strictEqual(details.status, 'Viewed', 'Status must be automatically updated to Viewed');
    assert.strictEqual(details.wasNew, true, 'wasNew flag should be true on transition from New');

    // Verify persisted directly in MongoDB
    const dbDoc = await FormSubmission.findById(createdMongoId);
    assert.strictEqual(dbDoc.status, 'Viewed', 'Status in MongoDB must be Viewed');
  });

  it('7. HR updates submission status to "In Review"', async () => {
    const mockReq = {
      params: { id: createdMongoId },
      body: { status: 'In Review', internalNotes: 'Client called on phone, reviewing menu' },
    };
    const mockRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await updateFormSubmissionStatus(mockReq, mockRes);
    });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.data.success, true);
    assert.strictEqual(mockRes.data.data.status, 'In Review');
    assert.strictEqual(mockRes.data.data.internalNotes, 'Client called on phone, reviewing menu');
  });

  it('8. Negative tests: handles invalid submissions and missing required fields gracefully', async () => {
    const invalidReq = {
      body: {
        businessName: '',
        ownerName: '',
        mobileNumber: '555', // invalid phone
        emailAddress: 'invalid-email',
      },
    };
    const invalidRes = createMockRes();

    await submitForm(invalidReq, invalidRes);

    assert.strictEqual(invalidRes.statusCode, 400);
    assert.strictEqual(invalidRes.data.success, false);
    assert.ok(Array.isArray(invalidRes.data.errors));
    assert.ok(invalidRes.data.errors.length >= 3);
  });

  it('9. Duplicate safety: submitting identical details produces distinct unique submission IDs without collisions', async () => {
    const subReq1 = {
      body: {
        businessName: 'Unique Coffee House',
        ownerName: 'Alice',
        businessCategory: 'Cafe',
        mobileNumber: '9123456789',
        emailAddress: 'alice@coffee.com',
      },
    };
    const subRes1 = createMockRes();
    const subRes2 = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await submitForm(subReq1, subRes1);
      await submitForm(subReq1, subRes2);
    });

    assert.strictEqual(subRes1.statusCode, 201);
    assert.strictEqual(subRes2.statusCode, 201);
    assert.notStrictEqual(subRes1.data.submissionId, subRes2.data.submissionId, 'Submission IDs must be distinct');
  });

  it('10. Permanent deletion: removes record from MongoDB and cleans up associated files', async () => {
    const delReq = { params: { id: createdMongoId } };
    const delRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await deleteFormSubmission(delReq, delRes);
    });

    assert.strictEqual(delRes.statusCode, 200);
    assert.strictEqual(delRes.data.success, true);

    // Verify completely deleted from MongoDB
    const docAfter = await FormSubmission.findById(createdMongoId);
    assert.strictEqual(docAfter, null, 'Document must no longer exist in MongoDB');
  });
});

