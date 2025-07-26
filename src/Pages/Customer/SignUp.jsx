import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { session, signUpNewUser } = UserAuth();
  const navigate = useNavigate();
  console.log(session);
  //console.log("Email:", email, "Password:", password);


  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUpNewUser(email, password, firstName, lastName, username);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error.message);
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
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-10 flex-col max-w-lg w-full h-auto py-10 rounded-3xl">
        <div>
          <h1 className="text-3xl font-bold">Register Now!</h1>
          <p className="text-sm">Please enter your details below</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col space-y-4 w-sm py-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="firstName">First Name: <span className="text-red-500">*</span></label>
              <input
                className="bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full"
                type="text"
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="w-1/2">
              <label htmlFor="lastName">Last Name: <span className="text-red-500">*</span></label>
              <input
                className="bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full"
                type="text"
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email">Email: <span className="text-red-500">*</span></label>
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
            <label htmlFor="username">Username: <span className="text-red-500">*</span></label>
            <input
              className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
              type="text"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">Password: <span className="text-red-500">*</span></label>
            <input
              className="w-full bg-white text-black rounded-md px-1 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#DFAD56]/80 text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] hover:text-gray-800 duration-300 tracking-wide w-full"
          >
            {loading ? "Signing up..." : "SIGN UP"}
          </button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default SignUp;
