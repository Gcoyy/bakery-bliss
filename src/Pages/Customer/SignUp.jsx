import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import toast from 'react-hot-toast';

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      const result = await signUpNewUser(email, password, firstName, lastName, username);

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
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-6 md:gap-10 flex-col w-full max-w-sm sm:max-w-md md:max-w-lg h-auto py-6 md:py-10 px-4 md:px-8 rounded-2xl md:rounded-3xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">Register Now!</h1>
          <p className="text-xs md:text-sm mt-1">Please enter your details below</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col space-y-3 md:space-y-4 w-full">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="w-full sm:w-1/2">
              <label htmlFor="firstName" className="text-sm md:text-base">First Name: <span className="text-red-500">*</span></label>
              <input
                className="bg-white text-black rounded-md px-2 py-1 md:py-2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full text-sm md:text-base"
                type="text"
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-1/2">
              <label htmlFor="lastName" className="text-sm md:text-base">Last Name: <span className="text-red-500">*</span></label>
              <input
                className="bg-white text-black rounded-md px-2 py-1 md:py-2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full text-sm md:text-base"
                type="text"
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm md:text-base">Email: <span className="text-red-500">*</span></label>
            <input
              className="w-full bg-white text-black rounded-md px-2 py-1 md:py-2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] text-sm md:text-base"
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-700 mt-1 md:mt-2">
              Email must be active
            </p>
          </div>

          <div>
            <label htmlFor="username" className="text-sm md:text-base">Username: <span className="text-red-500">*</span></label>
            <input
              className="w-full bg-white text-black rounded-md px-2 py-1 md:py-2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] text-sm md:text-base"
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="text-sm md:text-base">Password: <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                className="w-full bg-white text-black rounded-md px-2 py-1 md:py-2 pr-10 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] text-sm md:text-base"
                type={showPassword ? "text" : "password"}
                id="password"
                required
                minLength={6}
                value={password}
                onChange={handlePasswordChange}
                onFocus={() => setShowPasswordValidation(password.length > 0)}
                onBlur={() => setShowPasswordValidation(false)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Validation Popup */}
            {showPasswordValidation && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 w-full sm:min-w-64 sm:w-auto">
                <div className="text-xs md:text-sm font-medium text-gray-700 mb-2">Password Requirements:</div>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${passwordChecks.length ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    At least 6 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordChecks.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${passwordChecks.uppercase ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    One capital letter (A-Z)
                  </div>
                  <div className={`flex items-center text-xs ${passwordChecks.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${passwordChecks.lowercase ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    One lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center text-xs ${passwordChecks.number ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${passwordChecks.number ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    One number (0-9)
                  </div>
                  <div className={`flex items-center text-xs ${passwordChecks.special ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${passwordChecks.special ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    One special character (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-700 mt-1 md:mt-2">
              Password must be 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#DFAD56]/80 text-white font-bold px-4 md:px-6 py-2 md:py-3 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base mt-2 md:mt-4"
          >
            {loading ? "Signing up..." : "SIGN UP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
