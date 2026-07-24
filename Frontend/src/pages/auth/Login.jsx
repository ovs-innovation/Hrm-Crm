import React from 'react';
import LoginForm from './LoginForm';
import VastoraLogo from '../../components/VastoraLogo';

const Login = () => (
  <div className="flex min-h-screen bg-surface">
    <aside className="hidden w-[380px] shrink-0 flex-col justify-between border-r border-line bg-soft p-10 lg:flex">
      <VastoraLogo className="h-10 w-auto max-w-[200px] object-contain" />
      <div>
        <p className="text-lg font-medium leading-snug text-ink">Your workspace for attendance, tasks, and leave.</p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">Check in, submit daily reports, and stay connected with your team.</p>
      </div>
      <p className="text-xs text-muted">© {new Date().getFullYear()} Vastora Tech</p>
    </aside>
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <LoginForm />
    </div>
  </div>
);

export default Login;
