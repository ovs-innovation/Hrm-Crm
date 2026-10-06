import React, { useEffect, useState } from 'react';
import {
  FiChevronDown,
  FiX,
  FiFileText,
  FiBookOpen,
  FiClock,
  FiUsers,
  FiZap,
  FiCreditCard,
  FiCpu,
  FiTrendingUp,
  FiMessageSquare,
  FiFolder,
  FiColumns,
  FiWatch,
} from 'react-icons/fi';
import LoginForm from '../../features/auth/components/LoginForm';
import VastoraLogo from '../../components/VastoraLogo';

const APPS = [
  { name: 'Invoicing', Icon: FiFileText },
  { name: 'Knowledge', Icon: FiBookOpen },
  { name: 'Attendance', Icon: FiClock },
  { name: 'CRM', Icon: FiUsers },
  { name: 'Automation', Icon: FiZap },
  { name: 'Payroll', Icon: FiCreditCard },
  { name: 'AI', Icon: FiCpu },
  { name: 'Sales', Icon: FiTrendingUp },
  { name: 'Chat', Icon: FiMessageSquare },
  { name: 'Documents', Icon: FiFolder },
  { name: 'Projects', Icon: FiColumns },
  { name: 'Timesheets', Icon: FiWatch },
];

const MENU = [
  { title: 'Sales', items: ['CRM', 'Sales', 'Invoicing', 'Campaigns'] },
  { title: 'Human Resources', items: ['Employees', 'Payroll', 'Leave', 'Attendance'] },
  { title: 'Services', items: ['Projects', 'Timesheets', 'Helpdesk', 'Chat'] },
  { title: 'Productivity', items: ['Knowledge', 'Documents', 'AI', 'Automation'] },
];

const Login = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    if (!showLogin) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowLogin(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [showLogin]);

  useEffect(() => {
    if (!appsOpen) return undefined;
    const close = () => setAppsOpen(false);
    const t = window.setTimeout(() => window.addEventListener('click', close), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('click', close);
    };
  }, [appsOpen]);

  const openLogin = () => {
    setAppsOpen(false);
    setShowLogin(true);
  };

  const price = yearly ? '₹799' : '₹999';

  return (
    <div className="odoo-home min-h-screen">
      <header className="relative z-40 bg-white">
        <div className="relative mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6">
          <VastoraLogo variant="header" />
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[16px] font-medium text-[#212529] lg:flex">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setAppsOpen((v) => !v);
                }}
                aria-expanded={appsOpen}
              >
                Apps
                <FiChevronDown className={`h-4 w-4 ${appsOpen ? 'rotate-180' : ''}`} />
              </button>
              {appsOpen && (
                <div
                  className="absolute left-1/2 top-[calc(100%+18px)] z-50 w-[720px] -translate-x-1/2 rounded-2xl border border-[#E9ECEF] bg-white p-8 shadow-[0_20px_50px_rgba(33,37,41,.12)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-4 gap-8">
                    {MENU.map((col) => (
                      <div key={col.title}>
                        <p className="mb-3 text-[12px] font-semibold text-[#6C757D]">{col.title}</p>
                        <ul className="space-y-2.5 text-[15px]">
                          {col.items.map((item) => (
                            <li key={item}>
                              <button type="button" className="hover:text-[#2E6DB4]" onClick={openLogin}>{item}</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })}>Product</button>
            <button type="button" onClick={() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' })}>Community</button>
            <button type="button" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button>
            <button type="button" onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })}>Help</button>
          </nav>
          <div className="flex items-center gap-5">
            <button type="button" onClick={openLogin} className="hidden text-[16px] font-medium text-[#212529] sm:block">
              Sign in
            </button>
            <button
              type="button"
              onClick={openLogin}
              className="odoo-cta h-9 rounded-md px-3.5 text-[14px] font-semibold text-white"
            >
              Try it free
            </button>
          </div>
        </div>
      </header>

      <section className="relative px-6 pb-6 pt-14 text-center sm:pt-16">
        <div className="mx-auto max-w-[900px]">
          <h1 className="odoo-script text-[42px] font-bold leading-[1.12] text-[#171717] sm:text-[60px]">
            CRM and HR on{' '}
            <span className="odoo-mark">one platform.</span>
          </h1>
          <p className="odoo-script mt-3 text-[30px] font-semibold leading-[1.2] text-[#171717] sm:text-[42px]">
            Leads, payroll, and invoices —{' '}
            <span className="odoo-underline">together.</span>
          </p>
          <p className="odoo-scribble mt-5 text-[22px] leading-snug text-[#4b5563] sm:text-[24px]">
            <strong className="text-[26px] text-[#374151] sm:text-[28px]">{price}</strong>
            {' / month · every app'}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openLogin}
            className="odoo-cta inline-flex h-10 items-center rounded-md px-5 text-[15px] font-semibold text-white"
          >
            Start free
          </button>
          <button
            type="button"
            onClick={openLogin}
            className="inline-flex h-10 items-center rounded-md border border-[#DEE2E6] bg-white px-5 text-[15px] font-medium text-[#212529] hover:bg-[#F8F9FA]"
          >
            Open workspace
          </button>
        </div>
      </section>

      <div className="odoo-bowl px-6 pb-20 pt-6">
        <div className="relative z-[1] mx-auto flex max-w-[720px] justify-center">
          <button
            type="button"
            onClick={openLogin}
            className="-mt-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-[13px] text-[#334155] shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
          >
            <span className="text-[14px]" aria-hidden>🇮🇳</span>
            <span>Vastora workspace walkthrough · Delhi · Oct 8, 2026</span>
            <span className="font-semibold text-[#2E6DB4]">Register</span>
            <FiChevronDown className="h-3.5 w-3.5 -rotate-90 text-[#94A3B8]" />
          </button>
        </div>

        <div className="relative z-[1] mx-auto mt-12 grid max-w-[920px] grid-cols-3 gap-x-3 gap-y-10 sm:grid-cols-6 sm:gap-x-8 sm:gap-y-12">
          {APPS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={openLogin}
              className="group flex flex-col items-center gap-3"
            >
              <span className="odoo-tile flex items-center justify-center">
                <Icon size={26} strokeWidth={1.65} />
              </span>
              <span className="text-[12px] font-medium tracking-wide text-white/95 group-hover:text-white sm:text-[13px]">
                {name}
              </span>
            </button>
          ))}
        </div>

        <p className="relative z-[1] mx-auto mt-14 max-w-[540px] text-center text-[15px] leading-relaxed text-white/85">
          Open a lead, mark attendance, or send an invoice — same workspace, same records.
        </p>
      </div>

      <section id="why" className="mx-auto max-w-[1080px] px-6 pb-24">
        <h2 className="odoo-script text-center text-[48px] font-bold text-[#1a1a1a] sm:text-[56px]">
          Same records, less switching
        </h2>
        <div className="mt-16 grid gap-16 md:grid-cols-2">
          <div>
            <h3 className="text-[28px] font-bold text-[#212529]">Optimized for productivity</h3>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#495057]">
              True speed, less data entry, native AI, and a fast UI. Open employees, raise invoices, and close deals without leaving the page.
            </p>
          </div>
          <div>
            <h3 className="text-[28px] font-bold text-[#212529]">Native AI across HR and CRM</h3>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#495057]">
              Automate follow-ups, search company knowledge, and screen resumes. The assistant already knows which Vastora screen you are on.
            </p>
          </div>
        </div>
      </section>

      <section id="community" className="bg-[#F8F9FA] py-24">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <h2 className="odoo-script text-[44px] font-bold leading-tight text-[#1a1a1a] sm:text-[52px]">
              Enterprise software
              <br />
              done right.
            </h2>
            <div className="mt-10 space-y-8">
              <div>
                <h3 className="text-[20px] font-bold text-[#212529]">Fair pricing</h3>
                <p className="mt-2 text-[16px] leading-[1.7] text-[#495057]">
                  One price per company for every Vastora app — HR, CRM, invoicing, projects, and chat. No usage surprises.
                </p>
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#212529]">No vendor lock-in</h3>
                <p className="mt-2 text-[16px] leading-[1.7] text-[#495057]">
                  Your company data stays in your tenant. Export it. Your processes stay yours.
                </p>
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#212529]">A unique value proposition</h3>
                <p className="mt-2 text-[16px] leading-[1.7] text-[#495057]">
                  Payroll, pipeline, and invoices share the same records — not five subscriptions.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-[280px] overflow-hidden rounded-[36px] border-[10px] border-[#212529] bg-[#212529]">
              <img src="/iphone_preview.png" alt="Vastora mobile" className="block h-auto w-full" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-24">
        <h2 className="odoo-script text-center text-[48px] font-bold text-[#1a1a1a]">Pricing</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[18px] text-[#495057]">
          All Vastora apps included. Switch yearly and save 20%.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full bg-[#F1F3F5] p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold ${!yearly ? 'bg-white text-[#212529]' : 'text-[#6C757D]'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold ${yearly ? 'bg-white text-[#212529]' : 'text-[#6C757D]'}`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="mx-auto mt-14 grid max-w-[1080px] gap-6 md:grid-cols-3">
          {[
            { name: 'Starter', price: yearly ? '₹799' : '₹999', lines: ['Up to 20 users', 'All apps', 'Community support'] },
            { name: 'Standard', price: yearly ? '₹1,599' : '₹1,999', lines: ['Up to 100 users', 'AI + automation', 'Priority support'], featured: true },
            { name: 'Custom', price: "Let's talk", lines: ['Unlimited users', 'SSO & onboarding', 'Dedicated success'] },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-xl bg-white p-8 ${plan.featured ? 'border-2 border-[#2E6DB4]' : 'border border-[#E9ECEF]'}`}>
              <p className="text-[16px] font-semibold text-[#212529]">{plan.name}</p>
              <p className="mt-5 text-[40px] font-extrabold tracking-tight text-[#212529]">
                {plan.price}
                {plan.price.startsWith('₹') && <span className="text-[16px] font-medium text-[#6C757D]"> / month</span>}
              </p>
              <ul className="mt-6 space-y-2 text-[15px] text-[#495057]">
                {plan.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <button
                type="button"
                onClick={openLogin}
                className={`mt-8 h-11 w-full rounded-lg text-[15px] font-semibold ${
                  plan.featured ? 'odoo-cta text-white' : 'bg-[#F1F3F5] text-[#212529]'
                }`}
              >
                Start now
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#2E6DB4] px-6 py-16 text-center text-white">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5">
          <img src="/logo.png" alt="" className="h-full w-full object-contain" />
        </div>
        <h2 className="odoo-script text-[44px] font-bold">Start with one platform</h2>
        <button
          type="button"
          onClick={openLogin}
          className="mt-8 inline-flex h-12 items-center rounded-md bg-white px-7 text-[15px] font-semibold text-[#2E6DB4]"
        >
          Sign in
        </button>
        <p className="mt-3 text-[13px] text-white/80">No credit card required</p>
      </section>

      <footer id="help" className="border-t border-[#E9ECEF] bg-white py-14">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 sm:grid-cols-4">
          <div>
            <VastoraLogo variant="header" />
            <p className="mt-4 text-[13px] leading-relaxed text-[#6C757D]">
              All your business on one platform.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#212529]">Community</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#6C757D]">
              <li>Documentation</li>
              <li>Forum</li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#212529]">Services</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#6C757D]">
              <li>Implementation</li>
              <li>Support</li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#212529]">About us</p>
            <p className="mt-3 text-[13px] text-[#6C757D]">© {new Date().getFullYear()} Vastora Tech</p>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#212529]/50 px-4" onClick={() => setShowLogin(false)} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-dialog-title"
            className="relative w-full max-w-[420px] rounded-2xl bg-white p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setShowLogin(false)} className="absolute right-4 top-4 text-[#6C757D] hover:text-[#212529]" aria-label="Close">
              <FiX className="h-5 w-5" />
            </button>
            <p id="login-dialog-title" className="sr-only">Sign in</p>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
