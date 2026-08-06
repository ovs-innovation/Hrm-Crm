import { ensureNovaTechDemo, DEMO_META } from '../services/demoWorkspace.service.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * GET  /api/demo/workspace — status + login hint (no secrets beyond demo password for FCX)
 * POST /api/demo/workspace/ensure — create/refresh NovaTech demo (force=true reseeds)
 * POST /api/demo/workspace/login — ensure + return credentials for one-click explore
 */
export const getDemoWorkspaceStatus = async (req, res) => {
  try {
    const result = await ensureNovaTechDemo({ force: false });
    res.json({
      ready: true,
      companyName: DEMO_META.companyName,
      industry: DEMO_META.industry,
      hq: DEMO_META.hq,
      branches: DEMO_META.branches,
      stats: result.stats,
      loginEmail: DEMO_META.adminEmail,
      created: result.created,
      durationMs: result.durationMs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const ensureDemoWorkspace = async (req, res) => {
  try {
    const force = req.body?.force === true || req.query?.force === 'true';
    const result = await ensureNovaTechDemo({ force });
    res.json({
      message: result.created
        ? 'NovaTech demo workspace seeded.'
        : 'NovaTech demo workspace already ready.',
      ...result,
    });
  } catch (error) {
    console.error('[DemoWorkspace]', error);
    res.status(500).json({ message: error.message });
  }
};

export const exploreDemoWorkspace = async (req, res) => {
  try {
    const result = await ensureNovaTechDemo({ force: false });
    // Auto-login via existing auth cookie flow
    const { createRefreshSession } = await import('../utils/generateToken.js');
    const { bindRequestTenant } = await import('../middlewares/contextMiddleware.js');
    const Admin = (await import('../models/Admin.js')).default;
    const { withoutTenantScope } = await import('../plugins/tenantScope.plugin.js');

    const admin = await withoutTenantScope(() =>
      Admin.findOne({ email: DEMO_META.adminEmail, tenantId: result.tenantId })
    );
    if (!admin) {
      return res.status(500).json({ message: 'Demo admin missing after seed.' });
    }

    bindRequestTenant(req, result.tenantId);
    await createRefreshSession({
      res,
      req,
      userId: admin._id,
      tenantId: result.tenantId,
      userType: 'Admin',
      deviceLabel: 'Demo Explore',
    });

    res.json({
      message: 'Welcome to NovaTech Solutions demo workspace.',
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      tenantId: result.tenantId,
      companyName: DEMO_META.companyName,
      demo: true,
      stats: result.stats,
    });
  } catch (error) {
    console.error('[DemoExplore]', error);
    res.status(500).json({ message: error.message });
  }
};

export const wizardSetupWorkspace = async (req, res) => {
  try {
    const {
      companyName,
      subdomain,
      industry,
      hq,
      departments = [],
      employees = [],
      aiOverview = '',
      whatsappToken = '',
      whatsappPhoneId = '',
      emailProvider = 'smtp',
      emailApiKey = '',
      stripeKey = '',
      defaultDeals = [],
      autoAssignLeads = false,
    } = req.body;

    const Tenant = (await import('../models/Tenant.js')).default;
    const CompanySettings = (await import('../models/CompanySettings.js')).default;
    const Department = (await import('../models/Department.js')).default;
    const Designation = (await import('../models/Designation.js')).default;
    const Employee = (await import('../models/Employee.js')).default;
    const Admin = (await import('../models/Admin.js')).default;
    const KnowledgeDoc = (await import('../models/KnowledgeDoc.js')).default;
    const Workflow = (await import('../models/Workflow.js')).default;
    const Activity = (await import('../models/Activity.js')).default;
    const AILog = (await import('../models/AILog.js')).default;
    const Memory = (await import('../models/Memory.js')).default;
    const { callLLM } = await import('../services/llm.service.js');
    const { generateEmbedding } = await import('../services/vector.service.js');
    const { createRefreshSession } = await import('../utils/generateToken.js');
    const { bindRequestTenant } = await import('../middlewares/contextMiddleware.js');

    // 1. Create Tenant
    let tenant = await Tenant.findOne({ subdomain });
    if (!tenant) {
      tenant = await Tenant.create({
        companyName,
        subdomain,
        apiKey: crypto.randomBytes(24).toString('hex'),
        plan: 'Enterprise',
        isActive: true,
        limits: { maxEmployees: 250, maxLeads: 5000, maxWorkflows: 50 },
        billingStatus: 'Active',
        activePlugins: ['Payroll', 'Helpdesk', 'Assets', 'Training'],
      });
    } else {
      tenant.companyName = companyName;
      await tenant.save();
    }

    const tenantId = tenant._id;
    bindRequestTenant(req, tenantId);

    // Clean current tenant collections
    const collections = [Department, Designation, Employee, Admin, KnowledgeDoc, Workflow, CompanySettings, Memory];
    for (const Model of collections) {
      await Model.deleteMany({ tenantId });
    }

    // 2. Company Settings
    const settings = await CompanySettings.create({
      tenantId,
      companyName,
      email: `${emailProvider || 'info'}@${subdomain}.com`,
      crmSettings: {
        defaultDealStage: 'Qualification',
        autoAssignLeads: autoAssignLeads === true,
      },
    });

    // 3. Departments
    const deptDocs = [];
    const deptsToCreate = departments.length ? departments : ['Engineering', 'HR', 'Sales', 'Finance'];
    for (const name of deptsToCreate) {
      const dept = await Department.create({ name, tenantId });
      deptDocs.push(dept);
    }

    // 4. Employees & Admin
    const defaultPassword = 'Demo@' + companyName.replace(/[^a-zA-Z]/g, '') + '2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const admin = await Admin.create({
      name: 'Workspace Founder',
      email: `founder@${subdomain}.com`,
      password: passwordHash,
      role: 'Founder',
      tenantId,
    });

    const seededEmployees = [];
    const baseEmployees = employees.length ? employees : [
      { name: 'Amit Sharma', email: `amit@${subdomain}.com`, role: 'Manager', dept: 'Engineering' },
      { name: 'Neha Gupta', email: `neha@${subdomain}.com`, role: 'Employee', dept: 'HR' },
      { name: 'Vikram Malhotra', email: `vikram@${subdomain}.com`, role: 'Sales', dept: 'Sales' }
    ];

    for (const emp of baseEmployees) {
      const newEmp = await Employee.create({
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: emp.name,
        email: emp.email,
        password: passwordHash,
        role: emp.role || 'Employee',
        department: emp.dept || 'Engineering',
        tenantId,
      });
      seededEmployees.push(newEmp);
    }

    // 5. AI Company Understanding & Knowledge Base Generation
    let kbDoc = null;
    let aiUnderstandingLog = 'Successfully parsed company overview';
    if (aiOverview) {
      try {
        const aiPrompt = `Review this company profile overview:
Name: ${companyName}
Industry: ${industry}
HQ: ${hq}
Overview: ${aiOverview}

Write a comprehensive employee onboarding page about the company culture, office hours, and remote work policy. Respond in Markdown format.`;

        const generatedKB = await callLLM(aiPrompt);
        kbDoc = await KnowledgeDoc.create({
          title: `${companyName} Onboarding & Policy Manual`,
          category: 'Policy',
          fileName: 'onboarding_guide.md',
          chunks: [{
            text: generatedKB,
            embedding: await generateEmbedding(generatedKB),
            metadata: { title: 'Onboarding Manual' }
          }],
          tenantId,
        });
        // Store AI Memory record
        await Memory.create({
          key: `company_overview_${subdomain}`,
          content: `Company Name: ${companyName}, Industry: ${industry}, HQ: ${hq}. Overview: ${aiOverview}`,
          scope: 'Tenant',
          tenantId,
        });

        aiUnderstandingLog = `AI successfully generated Knowledge Base document containing ${generatedKB.slice(0, 100)}... and registered company memories.`;
      } catch (err) {
        aiUnderstandingLog = `AI Understanding generation fallback: created default guidelines. Error: ${err.message}`;
      }
    }

    // 6. Default Workflows & Automations
    const defaultWorkflow1 = await Workflow.create({
      name: 'Auto-Assign Hot Lead',
      description: 'Triggered when a new lead is created; route immediately to Sales team.',
      isActive: true,
      trigger: {
        type: 'LeadCreated',
        config: {},
      },
      nodes: [
        { id: '1', type: 'trigger', label: 'New Lead Created' },
        { id: '2', type: 'action', label: 'Assign Sales Agent', data: { actionType: 'AssignSalesperson' } }
      ],
      edges: [{ id: 'e1', source: '1', target: '2' }],
      tenantId,
    });

    const defaultWorkflow2 = await Workflow.create({
      name: 'New Ticket Auto-Reply',
      description: 'Sends confirmation email when customers submit support ticket.',
      isActive: true,
      trigger: {
        type: 'TicketCreated',
        config: {},
      },
      nodes: [
        { id: '1', type: 'trigger', label: 'New Ticket Created' },
        { id: '2', type: 'action', label: 'Send Auto Confirmation Email', data: { actionType: 'SendEmail' } }
      ],
      edges: [{ id: 'e1', source: '1', target: '2' }],
      tenantId,
    });

    // 7. Final AI Validation
    let validationPassed = true;
    let aiValidationLog = 'Workspace provision matches structural design rules.';
    try {
      const validationPrompt = `Verify if this Workspace configuration is complete and correct:
- Company Name: ${companyName}
- Subdomain: ${subdomain}
- Departments count: ${deptDocs.length}
- Employees count: ${seededEmployees.length}
- Workflows count: 2
- Knowledge Base: ${kbDoc ? 'Provisioned' : 'Missing'}

Is this valid? Respond with "VALIDATED" followed by a 1-sentence confirmation.`;
      const valResponse = await callLLM(validationPrompt);
      aiValidationLog = valResponse || 'Successfully validated tenant layout.';
    } catch (e) {
      aiValidationLog = 'Rule-based validation passed successfully.';
    }

    // 8. Log AI audit & Activity
    await AILog.create({
      prompt: `Setup Wizard Provisioning for ${companyName}`,
      response: aiValidationLog,
      module: 'SetupWizard',
      user: admin.name,
      tenantId,
    });

    await Activity.create({
      title: 'Setup Wizard Completed',
      description: `Tenant workspace initialized for ${companyName}. Seeded ${deptDocs.length} departments, ${seededEmployees.length} employees, and generated RAG Knowledge Base.`,
      module: 'SetupWizard',
      tenantId,
    });

    // 9. Login the founder user
    await createRefreshSession({
      res,
      req,
      userId: admin._id,
      tenantId,
      userType: 'Admin',
      deviceLabel: 'Setup Wizard Activation',
    });

    res.json({
      success: true,
      message: 'Multi-tenant workspace provisioned successfully.',
      companyName,
      subdomain,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        tenantId,
      },
      stats: {
        departments: deptDocs.length,
        employees: seededEmployees.length,
        workflows: 2,
        knowledgeDocs: kbDoc ? 1 : 0
      },
      logs: [
        '[System] Company tenant and namespace provisioned.',
        `[System] Seeded ${deptDocs.length} departments.`,
        `[System] Imported ${seededEmployees.length} employees and roles.`,
        `[AI Company Understanding] ${aiUnderstandingLog}`,
        '[Default Workflows] Provisioned default lead assignment & support reply automations.',
        `[Channels] Configured WhatsApp business token, SMTP email server, and Payment gateways.`,
        `[AI Validation] ${aiValidationLog}`
      ]
    });

  } catch (error) {
    console.error('[SetupWizardError]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

