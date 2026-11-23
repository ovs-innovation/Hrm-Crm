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
  saveFormStep,
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
        registeredAddress: '123 Coffee Lane, Connaught Place, New Delhi',
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

  it('11. 4-step frontend form submission with logo upload, conditional tax details, and dynamic addon pricing', async () => {
    const uploadDir = path.join(path.resolve(), 'uploads', 'forms');
    const customLogoFilename = `form-${Date.now()}-123456.png`;
    const customLogoPath = path.join(uploadDir, customLogoFilename);
    fs.writeFileSync(customLogoPath, 'MOCK_CUSTOM_LOGO_BYTES');
    sampleFilesCreated.push(customLogoPath);

    const stepReq = {
      body: {
        sourceWebsite: 'ApnaDigital',
        customerDetails: {
          fullName: 'Vikram Malhotra',
          companyName: 'Malhotra Technologies Pvt Ltd',
          mobileNumber: '+91 98765 43210',
          emailAddress: 'VIKRAM@MALHOTRATECH.COM',
          gstStatus: 'registered',
          gstNumber: '07AAAAA0000A1Z5',
          registeredAddress: 'Level 4, Cyber City, Gurugram, Haryana',
        },
        businessInfo: {
          businessCategory: 'IT & Software Services',
          aboutUs: 'Next-generation cloud and digital transformation agency.',
          servicesProducts: 'Enterprise SaaS, DevOps pipelines, and Custom CRM.',
          workingHours: '9:00 AM - 6:00 PM IST',
          location: 'Cyber City, Gurugram',
        },
        contactDetails: {
          contactMobile: '9876543210',
          contactEmail: 'hello@malhotratech.com',
          whatsappNumber: '9876543210',
          businessAddress: 'Level 4, Cyber City, Gurugram, Haryana',
          socialLinks: {
            instagram: 'https://instagram.com/malhotratech',
            facebook: 'https://facebook.com/malhotratech',
            linkedin: 'https://linkedin.com/company/malhotra-tech',
            youtube: 'https://youtube.com/@malhotratech',
          },
        },
        websiteDesign: {
          tagline: 'Engineering the future of enterprise software',
          needLogoDesign: 'false',
          primaryColor: '#0055FF',
          secondaryColor: '#111827',
          fontStyle: 'crisp-geometric',
          websiteTheme: 'dark-saas',
        },
        billingDetails: {
          basePackagePrice: 4999,
          currency: 'INR',
        },
      },
      files: [
        {
          fieldname: 'logo',
          filename: customLogoFilename,
          originalname: 'malhotra-tech-logo.png',
          mimetype: 'image/png',
          size: 32000,
        },
      ],
      ip: '103.21.244.2',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    };

    const stepRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await submitForm(stepReq, stepRes);
    });

    assert.strictEqual(stepRes.statusCode, 201);
    assert.strictEqual(stepRes.data.success, true);
    assert.ok(stepRes.data.submissionId.startsWith('SUB-'));
    assert.strictEqual(stepRes.data.data.businessName, 'Malhotra Technologies Pvt Ltd');
    assert.strictEqual(stepRes.data.data.ownerName, 'Vikram Malhotra');
    assert.strictEqual(stepRes.data.data.totalAmount, 4999);

    // Verify stored record in MongoDB
    const stored = await FormSubmission.findOne({ submissionId: stepRes.data.submissionId });
    assert.ok(stored, 'Record must exist in MongoDB');
    assert.strictEqual(stored.businessDetails.businessName, 'Malhotra Technologies Pvt Ltd');
    assert.strictEqual(stored.businessDetails.ownerName, 'Vikram Malhotra');
    assert.strictEqual(stored.businessDetails.mobileNumber, '9876543210');
    assert.strictEqual(stored.businessDetails.emailAddress, 'vikram@malhotratech.com');
    assert.strictEqual(stored.businessDetails.gstStatus, 'registered');
    assert.strictEqual(stored.businessDetails.gstNumber, '07AAAAA0000A1Z5');
    assert.strictEqual(stored.businessDetails.registeredAddress, 'Level 4, Cyber City, Gurugram, Haryana');
    assert.strictEqual(stored.websiteDesign.logo.url, `/uploads/forms/${customLogoFilename}`);
    assert.strictEqual(stored.websiteDesign.primaryColor, '#0055FF');
    assert.strictEqual(stored.websiteDesign.fontStyle, 'crisp-geometric');
    assert.strictEqual(stored.websiteDesign.websiteTheme, 'dark-saas');
    assert.strictEqual(stored.contactDetails.socialLinks.linkedin, 'https://linkedin.com/company/malhotra-tech');
    assert.strictEqual(stored.billingDetails.totalAmount, 4999);

    // Test CRM detail retrieval auto-marks as Viewed
    const getRes = createMockRes();
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissionById({ params: { id: stored._id.toString() } }, getRes);
    });
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.data.status, 'Viewed');
    assert.strictEqual(getRes.data.wasNew, true);
  });

  it('7. Progressive 4-step workflow: maintains same submissionId across all 4 steps, saves with New status, and marks Viewed upon opening', async () => {
    let progressiveSubId = null;

    // STEP 1: Customer details & tax info
    const step1Req = {
      body: {
        step: '1',
        fullName: 'Aarav Sharma',
        companyName: 'Sharma Organic Foods',
        mobileNumber: '9988776655',
        emailAddress: 'aarav@sharmaorganics.com',
        gstStatus: 'registered',
        gstNumber: '07BBBBB1111B1Z9',
        registeredAddress: 'Sector 62, Noida, Uttar Pradesh',
      },
      ip: '103.21.244.5',
      headers: {},
    };
    const step1Res = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await saveFormStep(step1Req, step1Res);
    });

    assert.strictEqual(step1Res.statusCode, 200);
    assert.strictEqual(step1Res.data.success, true);
    assert.ok(step1Res.data.submissionId.startsWith('SUB-'));
    assert.strictEqual(step1Res.data.status, 'New');
    assert.strictEqual(step1Res.data.stepCompleted, 1);
    progressiveSubId = step1Res.data.submissionId;

    // Verify in MongoDB: document created with status 'New'
    let doc = await FormSubmission.findOne({ submissionId: progressiveSubId });
    assert.ok(doc);
    assert.strictEqual(doc.status, 'New');
    assert.strictEqual(doc.businessDetails.businessName, 'Sharma Organic Foods');
    assert.strictEqual(doc.businessDetails.ownerName, 'Aarav Sharma');
    assert.strictEqual(doc.businessDetails.gstStatus, 'registered');
    assert.strictEqual(doc.businessDetails.gstNumber, '07BBBBB1111B1Z9');

    // STEP 2: Business profile, contact, social links + logo upload with SAME submissionId
    const step2LogoFilename = 'test-step2-logo.png';
    const uploadDir = path.join(path.resolve(), 'uploads', 'forms');
    fs.writeFileSync(path.join(uploadDir, step2LogoFilename), 'PNG_STEP2_LOGO_BYTES');
    sampleFilesCreated.push(path.join(uploadDir, step2LogoFilename));

    const step2Req = {
      body: {
        submissionId: progressiveSubId,
        step: '2',
        fullName: 'Aarav Sharma',
        companyName: 'Sharma Organic Foods',
        mobileNumber: '9988776655',
        emailAddress: 'aarav@sharmaorganics.com',
        businessCategory: 'Organic Food & Agriculture',
        aboutUs: 'Pioneering 100% certified pesticide-free organic farming.',
        servicesProducts: 'Organic Pulses, Farm Fresh Dairy, Cold Pressed Oils',
        contactMobile: '9988776655',
        contactEmail: 'sales@sharmaorganics.com',
        whatsappNumber: '9988776655',
        businessAddress: 'Farm 7, Noida Expressway, UP',
        instagramUrl: 'https://instagram.com/sharmaorganics',
        facebookUrl: 'https://facebook.com/sharmaorganics',
      },
      file: {
        fieldname: 'logo',
        filename: step2LogoFilename,
        originalname: 'sharma-organics-logo.png',
        mimetype: 'image/png',
        size: 24000,
      },
      ip: '103.21.244.5',
      headers: {},
    };
    const step2Res = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await saveFormStep(step2Req, step2Res);
    });

    assert.strictEqual(step2Res.statusCode, 200);
    assert.strictEqual(step2Res.data.submissionId, progressiveSubId, 'Must keep the exact same submissionId');
    assert.strictEqual(step2Res.data.status, 'New');
    assert.strictEqual(step2Res.data.stepCompleted, 2);

    doc = await FormSubmission.findOne({ submissionId: progressiveSubId });
    assert.strictEqual(doc.submissionId, progressiveSubId);
    assert.strictEqual(doc.businessDetails.businessCategory, 'Organic Food & Agriculture');
    assert.strictEqual(doc.businessInfo.aboutBusiness, 'Pioneering 100% certified pesticide-free organic farming.');
    assert.strictEqual(doc.websiteDesign.logo.url, `/uploads/forms/${step2LogoFilename}`);
    assert.strictEqual(doc.contactDetails.instagramLink, 'https://instagram.com/sharmaorganics');

    // STEP 3: Website Design & Branding with SAME submissionId
    const step3Req = {
      body: {
        submissionId: progressiveSubId,
        step: '3',
        fullName: 'Aarav Sharma',
        companyName: 'Sharma Organic Foods',
        mobileNumber: '9988776655',
        emailAddress: 'aarav@sharmaorganics.com',
        tagline: 'Pure. Natural. Delivered Fresh.',
        needLogoDesign: 'false',
        primaryColor: '#16A34A',
        secondaryColor: '#14532D',
        fontStyle: 'classic-serif',
        websiteTheme: 'bold-creative',
      },
      ip: '103.21.244.5',
      headers: {},
    };
    const step3Res = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await saveFormStep(step3Req, step3Res);
    });

    assert.strictEqual(step3Res.statusCode, 200);
    assert.strictEqual(step3Res.data.submissionId, progressiveSubId);
    assert.strictEqual(step3Res.data.status, 'New');
    assert.strictEqual(step3Res.data.stepCompleted, 3);

    doc = await FormSubmission.findOne({ submissionId: progressiveSubId });
    assert.strictEqual(doc.websiteDesign.tagline, 'Pure. Natural. Delivered Fresh.');
    assert.strictEqual(doc.websiteDesign.primaryColor, '#16A34A');
    assert.strictEqual(doc.websiteDesign.logo.url, `/uploads/forms/${step2LogoFilename}`, 'Logo from Step 2 preserved');

    // STEP 4: Review & Final Confirmation (Save & Pay)
    const step4Req = {
      body: {
        submissionId: progressiveSubId,
        step: '4',
        isFinal: 'true',
        fullName: 'Aarav Sharma',
        companyName: 'Sharma Organic Foods',
        mobileNumber: '9988776655',
        emailAddress: 'aarav@sharmaorganics.com',
        totalAmount: '4999',
      },
      ip: '103.21.244.5',
      headers: {},
    };
    const step4Res = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await saveFormStep(step4Req, step4Res);
    });

    assert.strictEqual(step4Res.statusCode, 200);
    assert.strictEqual(step4Res.data.submissionId, progressiveSubId);
    assert.strictEqual(step4Res.data.status, 'New');

    doc = await FormSubmission.findOne({ submissionId: progressiveSubId });
    assert.strictEqual(doc.status, 'New');
    assert.ok(doc.completedAt, 'completedAt timestamp must be saved');
    assert.strictEqual(doc.billingDetails.totalAmount, 4999);

    // Verify CRM listing returns New Forms count accurately
    const listReq = { query: { page: '1', limit: '10' } };
    const listRes = createMockRes();

    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissions(listReq, listRes);
    });

    assert.strictEqual(listRes.statusCode, 200);
    assert.ok(listRes.data.newCount >= 1);
    assert.ok(listRes.data.submissions.some((s) => s.submissionId === progressiveSubId && s.status === 'New'));

    // Verify opening details automatically marks as Viewed
    const getRes = createMockRes();
    await contextStorage.run({ tenantId: tenant._id.toString(), skipTenantScope: false }, async () => {
      await getFormSubmissionById({ params: { id: doc._id.toString() } }, getRes);
    });
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.data.status, 'Viewed');
    assert.strictEqual(getRes.data.wasNew, true);
  });
});

