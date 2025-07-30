import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session (user clicked reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidToken(true);
        setStatus('Please enter your new password');
      } else {
        setError('This reset link is invalid or has expired. Please request a new password reset from the login page.');
        toast.error('Invalid reset link. Please try again.');
      }
    };

    checkSession();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasMinLength = newPassword.length >= 6;

    if (!hasMinLength) {
      setError('Password must be at least 6 characters long');
      toast.error('Password too short. Please use at least 6 characters.');
      setLoading(false);
      return;
    }

    if (!hasUpperCase) {
      setError('Password must contain at least one capital letter');
      toast.error('Password must contain at least one capital letter.');
      setLoading(false);
      return;
    }

    if (!hasLowerCase) {
      setError('Password must contain at least one lowercase letter');
      toast.error('Password must contain at least one lowercase letter.');
      setLoading(false);
      return;
    }

    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
      toast.error('Password must contain at least one special character.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const errorMessage = error.message.includes('JWT')
          ? 'This reset link has expired. Please request a new password reset.'
          : error.message;
        setError(errorMessage);
        toast.error('Failed to update password. Please try again.');
      } else {
        setStatus('Password updated successfully! Redirecting to login...');
        toast.success('Password updated successfully!');
        // Clear the form
        setNewPassword('');
        setConfirmPassword('');

        // Sign out the user to clear the temporary session
        await supabase.auth.signOut();

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!isValidToken) {
    return (
      <div className="bg-[url('/Background.png')] bg-cover bg-center h-screen w-full flex items-center justify-center p-4">
        <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center flex-col max-w-md w-full rounded-3xl shadow-2xl p-8">
          <div className="text-center w-full">
            <div className="mb-6">
              <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#381914] mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">{error}</p>
            <button
              onClick={handleBackToLogin}
              className="bg-[#82171C] text-white font-bold px-8 py-3 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[url('/Background.png')] bg-cover bg-center h-screen w-full flex items-center justify-center p-4">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center flex-col max-w-md w-full rounded-3xl shadow-2xl p-8">
        <div className="text-center w-full mb-6">
          <div className="mb-4">
            <svg className="w-16 h-16 text-[#AF524D] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#381914] mb-2">Reset Your Password</h1>
          <p className="text-sm text-gray-600">Enter your new password below</p>
        </div>

        <form onSubmit={handlePasswordReset} className="flex flex-col space-y-5 w-full">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password: <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="newPassword"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white text-black rounded-md px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-colors"
              placeholder="Enter new password"
            />
            <p className="text-xs text-gray-300 mt-2">
              New password must be 6 characters
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password: <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white text-black rounded-md px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-colors"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#82171C] text-white font-bold px-6 py-3 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="bg-gray-500 text-white font-bold px-6 py-3 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-gray-600 duration-300 tracking-wide w-full"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
