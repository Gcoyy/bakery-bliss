
const Login = () => {
  return (
    <div className="bg-[url('/Background.png')] bg-cover bg-top h-screen w-full flex items-center justify-center">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-10 flex-col max-w-lg w-full h-[80vh] rounded-3xl">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-sm">Please enter your details below</p>
        </div>

        <div className="flex flex-col space-y-4 w-sm">
          <div>
            <label htmlFor="username">
              Username: <span className="text-red-500">*</span>
            </label>
            <input 
            className="w-full bg-white text-black rounded-3xl px-2 py-1/2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            type="text" 
            id="username" 
            required
            />
          </div>

          <div>
            <label htmlFor="password">
              Password: <span className="text-red-500">*</span>
            </label>
            <input 
            className="w-full bg-white text-black rounded-3xl px-1 py-1/2 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            type="password" 
            id="password" 
            required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 justify-center">
              <input 
              className="w-auto bg-white text-black rounded-3xl px-1 py-1/2 border border-black-300 focus:outline-none"
              type="checkbox" 
              id="rememberMe" 
              required
              />
              <label htmlFor="rememberMe">
                Remember me
              </label>
            </div>

            <a href="#">
              <p className="cursor-pointer hover:underline hover:text-blue-400 text-sm transition ease-in-out delay-50">Forgot password?</p>
            </a>
          </div>

          <div className="flex items-center justify-center">
            <button className="bg-[#623C2B] text-white font-bold px-4 py-2 rounded-3xl cursor-pointer transition ease-in-out delay-150 hover:bg-[#FFECB5] duration-300 tracking-wide">SUBMIT</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login;
