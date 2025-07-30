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

  const { session, signInUser, resetPassword } = UserAuth();
  const navigate = useNavigate();
  //Console.log("Session inside Login:", session); //turn this on if you want to see if session is being set correctly

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInUser({ email, password });
      if (result.success) {
        toast.success("Login successful!");
        navigate("/redirect");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error(err);
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
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="bg-[url('/Background.png')] bg-cover bg-top h-screen w-full flex items-center justify-center">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-10 flex-col max-w-lg w-full h-[80vh] rounded-3xl">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-sm">Please enter your details below</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4 w-sm">
          <div>
            <label htmlFor="email">
              Email: <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">
              Password: <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full bg-white text-black rounded-md px-2 py-1 pr-10 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-top justify-between">
            <div className="flex items-center space-x-2">
              <input
                className="w-auto bg-white text-black rounded-3xl px-1 py-1/2 border border-black-300 focus:outline-none"
                type="checkbox"
                id="rememberMe"
              />
              <label className="cursor-pointer" htmlFor="rememberMe">
                Remember me
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="cursor-pointer hover:underline hover:text-[#82171C] text-sm transition ease-in-out hover:font-semibold"
            >
              Forgot password?
            </button>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#82171C] text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "LOGIN"}
            </button>

            <hr />

            <Link
              className="bg-[#DFAD56]/80 text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full text-center"
              to="/signup"
            >
              SIGN UP
            </Link>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md border-4 border-[#AF524D] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#381914]">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setResetMessage("");
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                  Email: <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="resetEmail"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-white text-black rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetMessage("");
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-[#AF524D] text-white rounded-lg hover:bg-[#8B3D3A] transition-colors disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
