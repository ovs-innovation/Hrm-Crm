/**
 * One-off: seed all Antigravity / ovs-innovation repos as Project documents.
 * Usage: node scripts/seedAntigravityProjects.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Tenant from '../models/Tenant.js';
import { withoutTenantScope } from '../plugins/tenantScope.plugin.js';
import { contextStorage } from '../middlewares/contextMiddleware.js';

const PROJECTS = [
  { name: 'Test-Platform (Edvedum)', domain: 'EdTech / Online Exam Engine', technologies: 'React, Node.js, Express, Python PDFKit', statusRaw: 'Active', repo: 'ovs-innovation/test-platform' },
  { name: 'Manchanda Fabrics', domain: 'Luxury Ethnic E-Commerce', technologies: 'MERN Stack, Cloudinary CDN, Gmail SMTP', statusRaw: 'Active', repo: 'ovs-innovation/manchanda-fabrics', client: 'Manchanda Fabrics' },
  { name: 'FxTrade Financial Portal', domain: 'Forex & Financial Advisory', technologies: 'React 18, Vite, TailwindCSS, Swiper.js', statusRaw: 'Production', repo: 'ovs-innovation/FxTrade', client: 'FxTrade' },
  { name: 'Ilmic Healthcare', domain: 'Medical & Healthcare Store', technologies: 'MERN Stack, Redux Toolkit, Order System', statusRaw: 'Active', repo: 'ovs-innovation/ilmic-healthcare', client: 'Ilmic Healthcare' },
  { name: 'Farmcy Kart (kure-pharma)', domain: 'Online Pharmacy & Telemedicine', technologies: 'React, Node.js, MongoDB, REST API', statusRaw: 'Active', repo: 'ovs-innovation/kure-pharma', client: 'Farmcy Kart' },
  { name: 'Farmcy Kart 1 (farmcy_kart1)', domain: 'Pharmacy Storefront & Cart', technologies: 'React, Node.js, MongoDB, Cart Engine', statusRaw: 'Active', repo: 'ovs-innovation/farmcy_kart1', client: 'Farmcy Kart' },
  { name: 'FarmacyKart Mobile App', domain: 'Mobile Healthcare App (Android)', technologies: 'React Native, Expo, Android Gradle', statusRaw: 'Active', repo: 'ovs-innovation/farmacykart_application', client: 'Farmcy Kart' },
  { name: 'Vastora Tech Agency', domain: 'IT Solutions & Corporate Agency', technologies: 'React, TailwindCSS, Framer Motion, Blog', statusRaw: 'Active', repo: 'ovs-innovation/vastoraTech', client: 'Vastora Tech' },
  { name: 'Swaraj CRM (Vastora CRM)', domain: 'Dealer & Area Manager CRM', technologies: 'Node.js, React, Concurrently, MySQL', statusRaw: 'Active', repo: 'ovs-innovation/swaraj-crm', client: 'Swaraj' },
  { name: 'VoltOMatic Marketplace', domain: 'Industrial Automation & Electrical', technologies: 'React, Node.js API, RFQ Quotations, CMS', statusRaw: 'Active', repo: 'ovs-innovation/VoltoMatic', client: 'VoltOMatic' },
  { name: 'Rasa Store', domain: 'Multi-Category Lifestyle Retail', technologies: 'MERN Stack, Mobile Responsive Catalog', statusRaw: 'Active', repo: 'ovs-innovation/rasa-store', client: 'Rasa Store' },
  { name: '3Pahia (Three-Wheeler)', domain: 'Commercial EV & Auto Rickshaw', technologies: 'MERN Stack, Dealer Admin, EMI Calculator', statusRaw: 'Active', repo: 'ovs-innovation/Three_Wheeler' },
  { name: 'Car Junction (Four-Wheeler)', domain: 'Passenger Car Marketplace', technologies: 'MERN Stack, Vehicle Comparison Matrix', statusRaw: 'Active', repo: 'ovs-innovation/Four_Wheeler', client: 'Car Junction' },
  { name: '2Pahia (Two-Wheeler)', domain: 'Motorcycle & Scooter Portal', technologies: 'MERN Stack, Dealer Listing System', statusRaw: 'Active', repo: 'ovs-innovation/Two_Wheeler' },
  { name: 'Ultra Tractor', domain: 'Agricultural Machinery & Tractors', technologies: 'MERN Stack, Specs Comparison Sheet', statusRaw: 'Active', repo: 'ovs-innovation/Ultra_Tractor', client: 'Ultra Tractor' },
  { name: 'On Road Tractor', domain: 'Tractor & Machinery Marketplace', technologies: 'MERN Stack, Implements Catalog, MongoDB', statusRaw: 'Active', repo: 'ovs-innovation/On_Road_Tractor', client: 'On Road Tractor' },
  { name: 'HRM CRM Suite', domain: 'Enterprise HR & Team Tracking', technologies: 'Node.js, Express, MySQL, VPS Migration', statusRaw: 'Active', repo: 'ovs-innovation/Hrm-Crm', client: 'Vastora Tech' },
  { name: 'Asian Hawks (Northline)', domain: 'Overseas Recruitment & Manpower', technologies: 'MERN Stack, Dynamic Vacancies, CVs', statusRaw: 'Active', repo: 'ovs-innovation/Asian-hawks', client: 'Asian Hawks / Northline' },
  { name: 'AnyTime Service', domain: 'On-Demand Home Services Portal', technologies: 'React, TailwindCSS, Express API, Motion', statusRaw: 'Active', repo: 'ovs-innovation/AnyTime_Service', client: 'AnyTime Service' },
  { name: 'ElecMoon Project', domain: 'Consumer Smart Electronics Store', technologies: 'MERN Stack, Product Catalog & Cart', statusRaw: 'Active', repo: 'ovs-innovation/Elecmoon_project', client: 'ElecMoon' },
  { name: 'Elecmoon Core', domain: 'Electronics Components & Parts', technologies: 'JavaScript, Express API, Inventory DB', statusRaw: 'Active', repo: 'ovs-innovation/Elecmoon', client: 'ElecMoon' },
  { name: 'Bags-Ecommerce', domain: 'Travel Gear & Fashion Bags', technologies: 'MERN Stack, Multi-Variant Catalog, Cart', statusRaw: 'Active', repo: 'ovs-innovation/Bags-Ecommerce' },
  { name: 'Amba Shakti TMT', domain: 'Industrial Steel Analytics', technologies: 'React 18, Vite, Recharts, Framer Motion', statusRaw: 'Active', repo: 'ovs-innovation/tmt', client: 'Amba Shakti' },
  { name: 'Invest Talk Monorepo', domain: 'Fintech Media & Community', technologies: 'Turborepo, React, Node.js, Husky', statusRaw: 'Active', repo: 'ovs-innovation/invest-talk', client: 'Invest Talk' },
  { name: 'SmartAlpha SaaS (HTML)', domain: 'Business Analytics Web App', technologies: 'HTML5, CSS3, Modern JavaScript Assets', statusRaw: 'Active', repo: 'ovs-innovation/smartalpha', client: 'SmartAlpha' },
  { name: 'Smart-Alpha TS', domain: 'TypeScript Analytics Architecture', technologies: 'TypeScript, React, Modular State Engine', statusRaw: 'Active', repo: 'ovs-innovation/smart-alpha', client: 'SmartAlpha' },
  { name: 'Kalki-Brand', domain: 'Brand Portfolio & Merchandise', technologies: 'React, TailwindCSS, Brand Asset Portal', statusRaw: 'Active', repo: 'ovs-innovation/Kalki-Brand', client: 'Kalki' },
  { name: 'Kalki-Mart', domain: 'Omnichannel Superstore & Grocery', technologies: 'React, Node.js, Product Catalog, Checkout', statusRaw: 'Active', repo: 'ovs-innovation/Kalki-Mart', client: 'Kalki' },
  { name: 'KalkiMart 1', domain: 'Grocery Cart & Microservices', technologies: 'JavaScript, Express REST APIs, MongoDB', statusRaw: 'Active', repo: 'ovs-innovation/kalkimart1', client: 'Kalki' },
  { name: 'KalkiBazar', domain: 'Multi-Vendor Marketplace Portal', technologies: 'Full-Stack Web App, Vendor Onboarding', statusRaw: 'Active', repo: 'ovs-innovation/KalkiBazar', client: 'Kalki' },
  { name: 'Edunyte', domain: 'EdTech Learning Management (LMS)', technologies: 'TypeScript, React, Node.js, Course Portal', statusRaw: 'Active', repo: 'ovs-innovation/edunyte', client: 'Edunyte' },
  { name: 'GDP Academy', domain: 'Educational Coaching Platform', technologies: 'TypeScript, React, Student Portal, LMS', statusRaw: 'Active', repo: 'ovs-innovation/Gdp_academy', client: 'GDP Academy' },
  { name: 'Education Landing Page', domain: 'EdTech Admissions Showcase', technologies: 'HTML5, CSS3, JavaScript, Lead Capture', statusRaw: 'Active', repo: 'ovs-innovation/education_landingpage' },
  { name: 'Medical Landing Page', domain: 'Healthcare Clinical Services', technologies: 'HTML5, Responsive UI, Appointment Form', statusRaw: 'Active', repo: 'ovs-innovation/Medical_landingpage' },
  { name: 'HealthCare Portal', domain: 'Medical Clinic & Health Services', technologies: 'HTML5, CSS, Health Consultation UI', statusRaw: 'Active', repo: 'ovs-innovation/HealthCare' },
  { name: 'SEO Landing Page', domain: 'Digital Marketing Agency Page', technologies: 'CSS, Modern Responsive Layout, CTA', statusRaw: 'Active', repo: 'ovs-innovation/seo_landingpage' },
  { name: 'FundGyan', domain: 'Financial Literacy & Wealth Guide', technologies: 'HTML5, Modern CSS, Investment Advice UI', statusRaw: 'Active', repo: 'ovs-innovation/fundgyan', client: 'FundGyan' },
  { name: 'Real Gold Buyer', domain: 'Precious Metals Valuation & Cash', technologies: 'HTML5, Responsive UI, Gold Rate Calculator', statusRaw: 'Active', repo: 'ovs-innovation/realgoldbuyer', client: 'Real Gold Buyer' },
  { name: 'LA-Beauté', domain: 'Luxury Cosmetics & Skincare', technologies: 'HTML5, Modern Styling, Beauty Showcase', statusRaw: 'Active', repo: 'ovs-innovation/LA-beaute', client: 'LA-Beauté' },
  { name: 'TM Project', domain: 'Task & Workflow Management', technologies: 'JavaScript, Node.js, Pipeline Controller', statusRaw: 'Active', repo: 'ovs-innovation/TM' },
  { name: 'Vistaprint', domain: 'Custom Printing & Merchandise Portal', technologies: 'React, Canvas Image Editor, Print Orders', statusRaw: 'Active', repo: 'ovs-innovation/Vistaprint', client: 'Vistaprint' },
  { name: 'TossMart', domain: 'Digital Hyperlocal Retail Store', technologies: 'React, Express API, Quick Delivery Engine', statusRaw: 'Active', repo: 'ovs-innovation/tossmart', client: 'TossMart' },
  { name: 'Printing System', domain: 'Commercial Print & Production Ops', technologies: 'Node.js, Express, Job Queue & Invoicing', statusRaw: 'Active', repo: 'ovs-innovation/printing' },
  { name: 'QBMIndia', domain: 'Corporate B2B Infrastructure Portal', technologies: 'React, Vite, Corporate Solutions Portal', statusRaw: 'Active', repo: 'ovs-innovation/QBMIndia', client: 'QBM India' },
  { name: 'Shivratech', domain: 'Software Services & Tech Consulting', technologies: 'React, Modern UI, Lead Inquiry Pipeline', statusRaw: 'Active', repo: 'ovs-innovation/Shivratech', client: 'Shivratech' },
];

const mapStatus = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (s === 'production' || s === 'active') return 'Active';
  if (s === 'completed' || s === 'done') return 'Completed';
  if (s === 'on hold' || s === 'paused') return 'On Hold';
  return 'Planning';
};

const mapProjectType = (domain) => {
  const d = String(domain || '').toLowerCase();
  if (d.includes('landing')) return 'Landing Page';
  if (d.includes('mobile') || d.includes('android')) return 'Mobile App';
  if (d.includes('e-commerce') || d.includes('ecommerce') || d.includes('store') || d.includes('marketplace') || d.includes('retail') || d.includes('grocery')) return 'E-Commerce';
  if (d.includes('crm') || d.includes('hrm') || d.includes('saas') || d.includes('analytics') || d.includes('lms') || d.includes('portal')) return 'SaaS / Platform';
  return 'New Development';
};

async function resolveTenantId() {
  return withoutTenantScope(async () => {
    const tenants = await Tenant.find({}).select('companyName subdomain isActive').lean();
    console.log('Tenants found:', tenants.map((t) => ({ id: String(t._id), name: t.companyName, subdomain: t.subdomain })));

    const preferred =
      tenants.find((t) => /vastora/i.test(t.companyName || '') || /vastora/i.test(t.subdomain || '')) ||
      tenants.find((t) => t.isActive !== false) ||
      tenants[0];

    if (!preferred) throw new Error('No tenant found in database. Create a tenant / signup first.');
    return preferred._id;
  });
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const tenantId = await resolveTenantId();
  console.log('Using tenantId:', String(tenantId));

  let created = 0;
  let updated = 0;
  let failed = 0;

  await contextStorage.run({ tenantId: String(tenantId), skipTenantScope: false }, async () => {
    for (const row of PROJECTS) {
      const name = row.name.slice(0, 120);
      const description = [
        row.domain,
        `GitHub: https://github.com/${row.repo}`,
        'Source: Antigravity All Projects Report (ovs-innovation, Nov 2026)',
      ].join('\n').slice(0, 2000);

      const payload = {
        name,
        description,
        client: row.client || '',
        technologies: row.technologies || '',
        projectType: mapProjectType(row.domain),
        priority: 'Medium',
        budget: 0,
        status: mapStatus(row.statusRaw),
        team: [],
        createdBy: 'Antigravity seed',
        tenantId,
      };

      try {
        const existing = await Project.findOne({ tenantId, name });
        if (existing) {
          Object.assign(existing, payload);
          await existing.save();
          updated += 1;
          console.log('UPDATED', name);
        } else {
          await Project.create(payload);
          created += 1;
          console.log('CREATED', name);
        }
      } catch (err) {
        failed += 1;
        console.error('FAIL', name, err.message);
      }
    }
  });

  const total = await withoutTenantScope(() => Project.countDocuments({ tenantId }));
  console.log('\nDone.');
  console.log({ created, updated, failed, totalForTenant: total, expected: PROJECTS.length });
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
