import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const { session, signInUser, signInOrUpWithGoogle, resetPassword } = UserAuth();
  const navigate = useNavigate();
  //Console.log("Session inside Login:", session); //turn this on if you want to see if session is being set correctly

  const handleGoogleSignIn = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    setError("");

    try {
      const result = await signInOrUpWithGoogle();
      if (result.success) {
        toast.success("Redirecting to Google...");
        // The redirect will happen automatically via Supabase
        // Don't set loading to false here as the page will redirect
      } else {
        const errorMessage = result?.error?.message || result?.error || 'Google sign-in failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = "An unexpected error occurred during Google sign-in. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    setError("");

    try {
      const result = await signInUser({ email, password });
      if (result.success) {
        toast.success("Login successful!");

        // ✅ Redirect based on role
        if (result.role === "admin") {
          navigate("/adminpage");
        } else if (result.role === "customer") {
          navigate("/");
        } else {
          navigate("/"); // fallback in case role is missing
        }

        // Scroll to top after navigation
        setTimeout(() => window.scrollTo(0, 0), 100);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    setError("");

    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setResetMessage(result.message);
        toast.success(result.message);
        setResetEmail("");
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage("");
        }, 3000);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setResetLoading(false);
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

      <div className="w-full max-w-md relative z-10">
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
              <h1 className="text-3xl font-abhaya font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/80 text-sm">Sign in to your account</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-[#492220]">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-[#AF524D]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-[#492220]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50 pr-12"
                    placeholder="Enter your password"
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
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#AF524D] bg-white border-[#AF524D]/30 rounded focus:ring-[#AF524D]/20"
                  />
                  <span className="text-sm text-[#492220]">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-[#AF524D] hover:text-[#8B3A3A] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
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

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-[#492220] font-medium py-3 px-4 rounded-xl border border-[#AF524D]/20 hover:border-[#AF524D]/40 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{loading ? "Connecting..." : "Login with Google"}</span>
              </button>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-[#492220]/70">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-semibold text-[#AF524D] hover:text-[#8B3A3A] transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] p-6 text-center relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-abhaya font-bold text-white">Reset Password</h3>
                <p className="text-white/80 text-sm mt-1">Enter your email to receive reset instructions</p>
              </div>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setResetMessage("");
                  setError("");
                }}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold cursor-pointer transition-colors duration-200 hover:scale-110 transform"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="resetEmail" className="block text-sm font-semibold text-[#492220]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-[#AF524D]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#AF524D]/30 focus:border-[#AF524D] transition-all duration-200 text-[#492220] placeholder-[#492220]/50"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setResetMessage("");
                      setError("");
                    }}
                    className="flex-1 px-4 py-3 text-[#492220] border border-[#AF524D]/30 rounded-xl hover:bg-[#AF524D]/10 hover:border-[#AF524D]/50 transition-all duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#AF524D] to-[#8B3A3A] text-white rounded-xl hover:from-[#8B3A3A] hover:to-[#AF524D] transition-all duration-300 disabled:opacity-50 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {resetLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
