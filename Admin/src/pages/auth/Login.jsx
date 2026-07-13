import React from 'react';
import LoginForm from '../../features/auth/components/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
