import React from 'react';
import SignupForm from '../../features/auth/components/SignupForm';

const Signup = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex justify-center">
        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;
