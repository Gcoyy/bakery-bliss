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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const navigate = useNavigate();

  // Password validation checks
  const passwordChecks = {
    length: newPassword.length >= 6,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  };

  const handlePasswordChange = (e) => {
    const newPasswordValue = e.target.value;
    setNewPassword(newPasswordValue);
    setShowPasswordValidation(newPasswordValue.length > 0);
  };

  useEffect(() => {
    // Check if we have a valid session (user clicked reset link)
    const checkSession = async () => {
      try {
        // Check for URL hash/fragment that Supabase sends
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);

        console.log('ResetPassword: Checking session and URL params');
        console.log('Hash:', hash);
        console.log('Search params:', searchParams.toString());
        console.log('Full URL:', window.location.href);

        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session found:', !!session);

        // Check if this is a password recovery session
        const isPasswordRecovery = session?.user?.recovery ||
          hash?.includes('type=recovery') ||
          searchParams.get('type') === 'recovery' ||
          hash?.includes('access_token') ||
          searchParams.has('access_token');

        if (session && isPasswordRecovery) {
          console.log('Valid password recovery session found, user can reset password');
          setIsValidToken(true);
        } else if (session && !isPasswordRecovery) {
          // If there's a session but it's not a password recovery session,
          // redirect to appropriate page based on role
          console.log('Regular session found, redirecting away from reset page');
          const { data: customer } = await supabase
            .from("CUSTOMER")
            .select("cus_id")
            .eq("auth_user_id", session.user.id)
            .single();

          const { data: admin } = await supabase
            .from("ADMIN")
            .select("admin_id")
            .eq("admin_uid", session.user.id)
            .single();

          if (admin) {
            navigate('/adminpage');
          } else if (customer) {
            navigate('/');
          } else {
            navigate('/login');
          }
          return;
        } else if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
          // Handle the case where Supabase sends tokens in URL hash
          console.log('Tokens found in URL hash, attempting to get session');

          // Try to recover the session from the URL
          try {
            const { data, error } = await supabase.auth.getSession();
            if (data.session) {
              console.log('Session created from URL tokens');
              setIsValidToken(true);
            } else {
              console.error('Failed to create session from tokens:', error);

              // Try manual recovery by parsing the hash
              console.log('Attempting manual session recovery...');
              try {
                // Parse the hash to extract tokens
                const hashParams = new URLSearchParams(hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken) {
                  console.log('Found access token, attempting to set session');
                  // Try to set the session manually
                  const { data: manualData, error: manualError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                  });

                  if (manualData.session) {
                    console.log('Manual session recovery successful');
                    setIsValidToken(true);
                  } else {
                    console.error('Manual session recovery failed:', manualError);
                    setError('Failed to validate reset link. Please try again.');
                    toast.error('Invalid reset link. Please try again.');
                  }
                } else {
                  setError('Failed to validate reset link. Please try again.');
                  toast.error('Invalid reset link. Please try again.');
                }
              } catch (manualRecoveryError) {
                console.error('Manual recovery error:', manualRecoveryError);
                setError('Failed to validate reset link. Please try again.');
                toast.error('Invalid reset link. Please try again.');
              }
            }
          } catch (recoveryError) {
            console.error('Error recovering session:', recoveryError);
            setError('Failed to validate reset link. Please try again.');
            toast.error('Invalid reset link. Please try again.');
          }
        } else if (searchParams.has('access_token') || searchParams.has('refresh_token')) {
          // Handle case where tokens are in search params instead of hash
          console.log('Tokens found in search params, attempting to get session');
          const { data, error } = await supabase.auth.getSession();
          if (data.session) {
            console.log('Session created from search params');
            setIsValidToken(true);
          } else {
            console.error('Failed to create session from search params:', error);

            // Try manual recovery from search params
            console.log('Attempting manual session recovery from search params...');
            try {
              const accessToken = searchParams.get('access_token');
              const refreshToken = searchParams.get('refresh_token');

              if (accessToken) {
                console.log('Found access token in search params, attempting to set session');
                const { data: manualData, error: manualError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });

                if (manualData.session) {
                  console.log('Manual session recovery from search params successful');
                  setIsValidToken(true);
                } else {
                  console.error('Manual session recovery from search params failed:', manualError);
                  setError('Failed to validate reset link. Please try again.');
                  toast.error('Invalid reset link. Please try again.');
                }
              } else {
                setError('Failed to validate reset link. Please try again.');
                toast.error('Invalid reset link. Please try again.');
              }
            } catch (manualRecoveryError) {
              console.error('Manual recovery from search params error:', manualRecoveryError);
              setError('Failed to validate reset link. Please try again.');
              toast.error('Invalid reset link. Please try again.');
            }
          }
        } else {
          console.log('No valid session or tokens found');
          setError('This reset link is invalid or has expired. Please request a new password reset from the login page.');
          toast.error('Invalid reset link. Please try again.');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setError('An error occurred while validating the reset link. Please try again.');
        toast.error('Error validating reset link. Please try again.');
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session);
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session?.user?.recovery)) {
        if (session) {
          console.log('Password recovery session established from auth state change');
          setIsValidToken(true);
          setError('');
        }
      } else if (event === 'SIGNED_IN' && session && !session?.user?.recovery) {
        // Regular sign in, not password recovery - redirect away
        console.log('Regular sign in detected, redirecting away from reset page');
        const redirectUser = async () => {
          const { data: customer } = await supabase
            .from("CUSTOMER")
            .select("cus_id")
            .eq("auth_user_id", session.user.id)
            .single();

          const { data: admin } = await supabase
            .from("ADMIN")
            .select("admin_id")
            .eq("admin_uid", session.user.id)
            .single();

          if (admin) {
            navigate('/adminpage');
          } else if (customer) {
            navigate('/');
          } else {
            navigate('/login');
          }
        };
        redirectUser();
      }
    });

    // Cleanup subscription
    return () => subscription?.unsubscribe();
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
      setLoading(false);
      return;
    }

    if (!hasUpperCase) {
      setError('Password must contain at least one capital letter');
      setLoading(false);
      return;
    }

    if (!hasLowerCase) {
      setError('Password must contain at least one lowercase letter');
      setLoading(false);
      return;
    }

    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
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
          // Scroll to top after navigation
          setTimeout(() => window.scrollTo(0, 0), 100);
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
    // Scroll to top after navigation
    setTimeout(() => window.scrollTo(0, 0), 100);
  };

  if (!isValidToken) {
    return (
      <div className="bg-[url('/Background.png')] bg-cover bg-center min-h-screen w-full flex items-center justify-center p-4">
        <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#A8A599_100%)] flex items-center justify-center gap-6 md:gap-10 flex-col w-full max-w-sm sm:max-w-md md:max-w-lg h-auto py-6 md:py-10 px-4 md:px-8 rounded-2xl md:rounded-3xl shadow-2xl border-2 border-[#AF524D]">
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 md:w-20 md:h-20 text-[#AF524D] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-jost text-[#492220] mb-4">Invalid Reset Link</h1>
            <p className="text-sm md:text-base text-[#492220]/80 mb-8 leading-relaxed">{error}</p>
            <button
              onClick={handleBackToLogin}
              className="bg-[#AF524D] hover:bg-[#8B3F3A] text-white font-bold px-6 py-3 md:px-8 md:py-4 rounded-lg cursor-pointer transition ease-in-out delay-100 duration-300 tracking-wide w-full text-sm md:text-base shadow-lg hover:shadow-xl"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[url('/Background.png')] bg-cover bg-center min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#A8A599_100%)] flex items-center justify-center gap-6 md:gap-10 flex-col w-full max-w-sm sm:max-w-md md:max-w-lg h-auto py-6 md:py-10 px-4 md:px-8 rounded-2xl md:rounded-3xl shadow-2xl border-2 border-[#AF524D]">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 md:w-20 md:h-20 text-[#AF524D] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-jost text-[#492220] mb-2">Reset Your Password</h1>
          <p className="text-xs md:text-sm text-[#492220]/80">Enter your new password below</p>
        </div>

        {/* Status and Error Messages */}
        {status && (
          <div className="w-full p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {status}
          </div>
        )}

        {error && (
          <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="flex flex-col space-y-3 md:space-y-4 w-full">
          <div>
            <label htmlFor="newPassword" className="text-sm md:text-base text-[#492220] font-medium">
              New Password: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                required
                minLength={6}
                value={newPassword}
                onChange={handlePasswordChange}
                onFocus={() => setShowPasswordValidation(newPassword.length > 0)}
                onBlur={() => setShowPasswordValidation(false)}
                className="w-full bg-white/90 text-[#492220] rounded-lg px-3 py-2 md:py-3 pr-12 border-2 border-[#AF524D]/30 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] text-sm md:text-base shadow-sm"
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>

              {/* Password Validation Popup */}
              {showPasswordValidation && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-20 w-fit">
                  <div className="text-sm font-medium text-gray-800 mb-3">Password Requirements:</div>
                  <div className="space-y-2">
                    <div className={`flex items-center text-sm ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-3 ${passwordChecks.length ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      At least 6 characters
                    </div>
                    <div className={`flex items-center text-sm ${passwordChecks.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-3 ${passwordChecks.uppercase ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      One capital letter (A-Z)
                    </div>
                    <div className={`flex items-center text-sm ${passwordChecks.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-3 ${passwordChecks.lowercase ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      One lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center text-sm ${passwordChecks.number ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-3 ${passwordChecks.number ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      One number (0-9)
                    </div>
                    <div className={`flex items-center text-sm ${passwordChecks.special ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-3 ${passwordChecks.special ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      One special character (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm md:text-base text-[#492220] font-medium">
              Confirm Password: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/90 text-[#492220] rounded-lg px-3 py-2 md:py-3 pr-12 border-2 border-[#AF524D]/30 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-[#AF524D] text-sm md:text-base shadow-sm"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#AF524D] hover:bg-[#8B3F3A] text-white font-bold px-6 py-3 md:px-8 md:py-4 rounded-lg cursor-pointer transition ease-in-out delay-100 duration-300 tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              className="bg-[#6B7280] hover:bg-[#4B5563] text-white font-bold px-6 py-3 md:px-8 md:py-4 rounded-lg cursor-pointer transition ease-in-out delay-100 duration-300 tracking-wide w-full text-sm md:text-base shadow-lg hover:shadow-xl"
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
