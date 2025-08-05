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

  const { session, signUpNewUser } = UserAuth();
  const navigate = useNavigate();
  console.log(session);
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

  const handleSignUp = async (e) => {
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
        } else {
          navigate("/");
          window.scrollTo(0, 0);
        }
      } else {
        setError(result.error.message);
        toast.error(result.error.message);
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
    <div className="bg-[url('/Background.png')] bg-cover bg-top min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-6 md:gap-10 flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-auto py-8 md:py-12 px-6 md:px-10 rounded-3xl md:rounded-[2rem] shadow-2xl">
        <div className="text-center mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Register Now!</h1>
          <p className="text-sm md:text-base text-gray-600">Please enter your details below</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col space-y-8 w-full">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                  type="text"
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                  type="text"
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Account Information</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-gray-600">
                  We'll use this to send you order confirmations and updates
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                  type="text"
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a unique username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                type="tel"
                id="phoneNumber"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Optional - for delivery updates and order notifications
              </p>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Security</h3>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-4">
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 pr-12 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:border-transparent transition-all duration-200"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => setShowPasswordValidation(password.length > 0)}
                  onBlur={() => setShowPasswordValidation(false)}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <p className="text-xs text-gray-600">
                Password must be at least 6 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#AF524D] text-white font-semibold py-4 px-6 rounded-xl cursor-pointer transition-all duration-300 hover:bg-[#8B3D3A] focus:outline-none focus:ring-2 focus:ring-[#AF524D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
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
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
