import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { session, signInUser } = UserAuth();
  const navigate = useNavigate();
  //onsole.log("Session inside Login:", session); //turn this on if you want to see if session is being set correctly

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInUser({ email, password });
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
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
            <input
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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

            <a href="#">
              <p className="cursor-pointer hover:underline hover:text-[#82171C] text-sm transition ease-in-out hover:font-semibold">Forgot password?</p>
            </a>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#82171C] text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full"
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
    </div>
  );
};

export default Login;
