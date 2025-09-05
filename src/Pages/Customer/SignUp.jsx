import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import toast from 'react-hot-toast';

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUpNewUser, signInOrUpWithGoogle } = UserAuth();
  const navigate = useNavigate();
  //console.log("Email:", email, "Password:", password);

  // Password validation checks
  const passwordChecks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setShowPasswordValidation(newPassword.length > 0);
  };

  const handleGoogleSignUp = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    setError("");

    try {
      const result = await signInOrUpWithGoogle();
      if (result.success) {
        toast.success("Redirecting to Google...");
        // The redirect will happen automatically via Supabase
      } else {
        const errorMessage = result?.error?.message || result?.error || 'Google sign-in failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    console.log("handleSignUp called", email, password);
    e.preventDefault();

    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    setError("");

    // Enhanced password validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 6;

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

    if (!hasNumber) {
      setError('Password must contain at least one number');
      toast.error('Password must contain at least one number.');
      setLoading(false);
      return;
    }

    if (!hasSpecialChar) {
      setError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
      toast.error('Password must contain at least one special character.');
      setLoading(false);
      return;
    }

    try {
      const result = await signUpNewUser(email, password, firstName, lastName, username, phoneNumber);

      if (result.success) {
        toast.success('Account created successfully! Welcome to Bakery Bliss!');
        // Navigate based on user role
        if (result.userRole === "admin") {
          navigate("/adminpage");
          // Scroll to top after navigation
          setTimeout(() => window.scrollTo(0, 0), 100);
        } else {
          navigate("/");
          window.scrollTo(0, 0);
        }
      } else {
        const errorMessageSignUp = result?.error?.message || 'Sign-up failed. Please try again.';
        setError(errorMessageSignUp);
        toast.error(errorMessageSignUp);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8E6B4] via-[#E2D2A2] to-[#DFDAC7] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-[#AF524D] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#DFAD56] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#E2D2A2] rounded-full blur-3xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 animate-bounce">
        <div className="w-6 h-6 bg-[#DFAD56] rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-20 right-20 animate-pulse">
        <div className="w-4 h-4 bg-[#AF524D] rounded-full opacity-40"></div>
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
        <div className="w-8 h-8 bg-[#E2D2A2] rounded-full opacity-50"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              {/* Logo */}
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#AF524D] to-[#8B3A3A] rounded-lg relative">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-[#DFAD56]"></div>
                    <div className="absolute top-1 left-1 right-1 h-1 bg-[#E2D2A2] rounded-sm"></div>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-abhaya font-bold text-white mb-2">Join Our Family</h1>
              <p className="text-white/80 text-sm">Create your account and start your sweet journey</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#492220] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-[#492220]">
                      First Name <span className="text-[#AF524D]">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-[#492220]">
                      Last Name <span className="text-[#AF524D]">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#492220] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Account Information
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-[#492220]">
                      Email Address <span className="text-[#AF524D]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                      placeholder="Enter your email address"
                    />
                    <p className="text-xs text-[#492220]/60">
                      We'll use this for order confirmations or updates
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-[#492220]">
                      Username <span className="text-[#AF524D]">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                      placeholder="Choose a unique username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="block text-sm font-semibold text-[#492220]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    placeholder="e.g., 09987654321"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                  />
                  <p className="text-xs text-[#492220]/60">
                    Optional - for delivery updates or order notifications
                  </p>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#492220] flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#AF524D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </h3>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-[#492220]">
                    Password <span className="text-[#AF524D]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => setShowPasswordValidation(password.length > 0)}
                      onBlur={() => setShowPasswordValidation(false)}
                      className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50 pr-12"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#AF524D]/60 hover:text-[#AF524D] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Password Validation Popup */}
                    {showPasswordValidation && (
                      <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm border border-[#AF524D]/20 rounded-xl shadow-xl p-4 z-20 w-fit">
                        <div className="text-sm font-semibold text-[#492220] mb-3">Password Requirements:</div>
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
                  <p className="text-xs text-[#492220]/60">
                    Password must be at least 6 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white font-semibold py-3 px-4 rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#AF524D]/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#492220]/60">Or continue with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full bg-white text-[#492220] font-medium py-3 px-4 rounded-xl border border-[#AF524D]/20 hover:border-[#AF524D]/40 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{loading ? "Connecting..." : "Signup with Google"}</span>
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-[#492220]/70">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    className="font-semibold text-[#AF524D] hover:text-[#8B3A3A] transition-colors"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
