import React from 'react';
import { FiCalendar, FiCheckSquare, FiClock } from 'react-icons/fi';
import LoginForm from './LoginForm';
import VastoraLogo from '../../components/VastoraLogo';

const POINTS = [
  { icon: FiClock, title: 'Attendance', text: 'Check in and out from one place.' },
  { icon: FiCalendar, title: 'Leave', text: 'Request time off and track approvals.' },
  { icon: FiCheckSquare, title: 'Work', text: 'Tasks, reports, and team updates.' },
];

const Login = () => (
  <div className="flex min-h-screen bg-canvas">
    <aside className="relative hidden w-[44%] max-w-[480px] shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-white px-10 py-10 lg:flex">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-brand-xlight/70" />
      <div className="relative">
        <VastoraLogo />
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Employee portal</p>
        <h1 className="mt-2 max-w-sm text-[26px] font-semibold leading-tight tracking-tight text-ink">
          Sign in to your workday
        </h1>
        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
          Attendance, leave, tasks, and team communication — in one secure workspace.
        </p>
      </div>
      <ul className="relative space-y-4">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-xlight text-brand">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{title}</p>
              <p className="text-[12px] leading-relaxed text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="relative text-[12px] text-muted">© {new Date().getFullYear()} Vastora Tech</p>
    </aside>

    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-[400px] rounded-xl border border-line bg-white px-6 py-8 sm:px-8">
        <LoginForm />
      </div>
    </div>
  </div>
);

export default Login;
