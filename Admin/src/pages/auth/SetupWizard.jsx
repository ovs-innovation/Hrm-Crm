import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiFileText,
  FiUploadCloud,
  FiBriefcase,
  FiLayers,
  FiSettings,
  FiArrowRight,
  FiZap,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiFolder
} from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SetupWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form details - Company Profile
  const [companyName, setCompanyName] = useState('NovaTech Solutions Pvt. Ltd.');
  const [subdomain, setSubdomain] = useState('novatech-demo');
  const [industry, setIndustry] = useState('IT Services & SaaS');
  const [hq, setHq] = useState('Bengaluru');
  const [aiOverview, setAiOverview] = useState(
    'NovaTech Solutions provides high-performance enterprise SaaS software development, IT support consultancies, and digital transformation services for global retail clients.'
  );

  // Departments & Employees
  const [departments, setDepartments] = useState('Engineering, HR, Sales, Finance, Operations');
  const [employeeText, setEmployeeText] = useState(
    'Amit Sharma, amit@novatech-demo.com, Manager, Engineering\nNeha Gupta, neha@novatech-demo.com, Employee, HR\nVikram Malhotra, vikram@novatech-demo.com, Sales, Sales'
  );
  const [empFile, setEmpFile] = useState(null);

  // Channel Setup
  const [whatsappToken, setWhatsappToken] = useState('EAAWZCx8ZB9k...DEFAULT_TOKEN');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('109283746152');
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [emailApiKey, setEmailApiKey] = useState('SG.email-service-default-api-key');
  const [stripeKey, setStripeKey] = useState('sk_test_51...default_stripe_key');
  const [autoAssignLeads, setAutoAssignLeads] = useState(true);

  // Logs
  const [validationLogs, setValidationLogs] = useState([]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!companyName || !subdomain) {
        toast.error('Company Name and Subdomain Namespace are required');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      handleLaunchWorkspace();
    }
  };

  const handleLaunchWorkspace = async () => {
    setLoading(true);
    setValidationLogs(['[System] Initializing workspace build sequence...']);
    const toastId = toast.loading('AI is provisioning your multi-tenant workspace & seeding models...');

    // Convert string inputs to arrays
    const parsedDepts = departments.split(',').map((d) => d.trim()).filter(Boolean);
    const parsedEmployees = employeeText
      .split('\n')
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          return {
            name: parts[0],
            email: parts[1],
            role: parts[2] || 'Employee',
            dept: parts[3] || 'Engineering',
          };
        }
        return null;
      })
      .filter(Boolean);

    try {
      const { data } = await api.post('/demo/workspace/wizard-setup', {
        companyName,
        subdomain,
        industry,
        hq,
        departments: parsedDepts,
        employees: parsedEmployees,
        aiOverview,
        whatsappToken,
        whatsappPhoneId,
        emailProvider,
        emailApiKey,
        stripeKey,
        autoAssignLeads,
      });

      if (data.success) {
        setValidationLogs(data.logs || []);
        toast.success('Workspace configured and successfully activated!', { id: toastId });
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        toast.error(data.message || 'Setup wizard failed.', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to provision workspace', { id: toastId });
      setValidationLogs((prev) => [...prev, `[Error] Workspace build failed: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft/20 flex flex-col justify-between text-ink text-[13px] font-medium">
      
      {/* Header Bar */}
      <div className="bg-surface border-b border-line px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-brand/10 text-brand">
            <FiZap className="h-5 w-5" />
          </div>
          <span className="font-black text-ink text-sm tracking-tight">Vastora Business OS Setup Wizard</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-brand' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-surface border border-line rounded-3xl p-8 w-full max-w-xl space-y-6 shadow-md">
          
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <FiBriefcase className="text-brand" /> 1. Company Profile & AI Understanding
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                Define your multi-tenant workspace namespace and supply background for RAG Knowledge base generation.
              </p>
              
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="app-input h-9 w-full text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Subdomain Namespace</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      className="app-input h-9 flex-1 text-[12px] rounded-r-none border-r-0"
                    />
                    <span className="bg-soft border border-line rounded-r px-3 flex items-center text-muted font-bold text-[11px]">
                      .vastoratech.com
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">Industry Vertical</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="app-input h-9 w-full text-[12px] cursor-pointer"
                    >
                      <option>IT Services & SaaS</option>
                      <option>Healthcare & Pharma</option>
                      <option>Retail & E-commerce</option>
                      <option>Finance & Fintech</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">HQ Location</label>
                    <input
                      type="text"
                      value={hq}
                      onChange={(e) => setHq(e.target.value)}
                      className="app-input h-9 w-full text-[12px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">AI Company Overview (Knowledge Base Source)</label>
                  <textarea
                    value={aiOverview}
                    onChange={(e) => setAiOverview(e.target.value)}
                    rows={3}
                    placeholder="Enter what your company does, policy details, etc."
                    className="app-input w-full p-2.5 text-[12px] h-20"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <FiLayers className="text-brand" /> 2. Departments & Employee Import
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                Define corporate departments and upload employee rosters to pre-populate roles and permissions.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Departments (Comma-separated)</label>
                  <input
                    type="text"
                    value={departments}
                    onChange={(e) => setDepartments(e.target.value)}
                    className="app-input h-9 w-full text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted mb-1">Employee Roster (Format: Name, Email, Role, Department)</label>
                  <textarea
                    value={employeeText}
                    onChange={(e) => setEmployeeText(e.target.value)}
                    rows={4}
                    className="app-input w-full p-2.5 text-[12px] font-mono h-24"
                  />
                </div>

                <div className="border border-dashed border-line hover:border-brand rounded-2xl p-4 flex justify-between items-center bg-soft/10 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-brand h-6 w-6" />
                    <div>
                      <p className="font-bold text-ink text-[12px]">Spreadsheet Upload (Optional)</p>
                      <p className="text-[10px] text-muted">{empFile ? empFile.name : 'Excel or CSV spreadsheet'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEmpFile({ name: 'NovaTech_Staff.xlsx' })} className="btn-outline h-7 px-3 text-[11px] font-bold">
                    {empFile ? 'Uploaded' : 'Browse'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <FiSettings className="text-brand" /> 3. Channels & Integrations Provisioning
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                Connect external pipelines. The system will seed default CRM stages and enable omnichannel flow.
              </p>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">WhatsApp Phone ID</label>
                    <input
                      type="text"
                      value={whatsappPhoneId}
                      onChange={(e) => setWhatsappPhoneId(e.target.value)}
                      className="app-input h-9 w-full text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">WhatsApp Token</label>
                    <input
                      type="password"
                      value={whatsappToken}
                      onChange={(e) => setWhatsappToken(e.target.value)}
                      className="app-input h-9 w-full text-[12px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">Email Provider Service</label>
                    <select
                      value={emailProvider}
                      onChange={(e) => setEmailProvider(e.target.value)}
                      className="app-input h-9 w-full text-[12px] cursor-pointer"
                    >
                      <option value="smtp">SMTP Relay</option>
                      <option value="sendgrid">SendGrid API</option>
                      <option value="mailgun">Mailgun API</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">Email API Key</label>
                    <input
                      type="password"
                      value={emailApiKey}
                      onChange={(e) => setEmailApiKey(e.target.value)}
                      className="app-input h-9 w-full text-[12px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted mb-1">Stripe Secret Key</label>
                    <input
                      type="password"
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      className="app-input h-9 w-full text-[12px]"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoAssignLeads}
                        onChange={(e) => setAutoAssignLeads(e.target.checked)}
                        className="rounded border-line text-brand focus:ring-brand h-4 w-4"
                      />
                      <span className="text-[12px] text-ink font-semibold">CRM Auto Lead Assignment</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <FiZap className="text-brand animate-bounce" /> 4. AI Verification & Launching OS
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                Building tenant namespace, compiling models, generating RAG knowledge docs, and validating structures.
              </p>

              <div className="border border-line rounded-2xl p-4 bg-navy/5 text-ink space-y-2 max-h-[220px] overflow-y-auto font-mono text-[11px]">
                {validationLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="text-brand font-bold">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Control Button */}
          <div className="flex justify-between items-center pt-4 border-t border-line">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-outline h-9 px-4 font-bold text-[12px]"
              >
                Back
              </button>
            )}
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="btn-primary h-9 px-4 font-bold text-[12px] inline-flex items-center gap-1.5"
                >
                  Continue <FiArrowRight />
                </button>
              ) : step === 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="btn-primary h-9 px-5 font-bold text-[12px] inline-flex items-center gap-1.5"
                >
                  <FiCheckCircle /> Configure & Launch OS
                </button>
              ) : (
                <div className="text-xs text-muted italic">Launching workspace...</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className="border-t border-line py-4 text-center text-[10px] text-muted bg-surface">
        &copy; 2026 Vastora Tech Inc. All rights reserved.
      </div>

    </div>
  );
};

export default SetupWizard;
