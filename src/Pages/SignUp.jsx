

const SignUp = () => {
  return (
    <div className="bg-[url('/Background.png')] bg-cover bg-top h-screen w-full flex items-center justify-center">
      <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] flex items-center justify-center gap-10 flex-col max-w-lg w-full h-auto py-10 rounded-3xl">
        <div>
          <h1 className="text-3xl font-bold">Register Now!</h1>
          <p className="text-sm">Please enter your details below</p>
        </div>

        <div className="flex flex-col space-y-4 w-sm py-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label htmlFor="firstName">
                First Name: <span className="text-red-500">*</span>
              </label>
              <input 
              className="bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full"
              type="text" 
              id="firstName" 
              required
              />
            </div>

            <div className="w-1/2">
              <label htmlFor="lastName">
                Last Name: <span className="text-red-500">*</span>
              </label>
              <input 
              className="bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D] w-full"
              type="text" 
              id="lastName" 
              required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email">
              Email: <span className="text-red-500">*</span>
            </label>
            <input 
            className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            type="email" 
            id="email" 
            required
            />
          </div>

          <div>
            <label htmlFor="username">
              Username: <span className="text-red-500">*</span>
            </label>
            <input 
            className="w-full bg-white text-black rounded-md px-2 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
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
            className="w-full bg-white text-black rounded-md px-1 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            type="password" 
            id="password" 
            required
            />
          </div>

          {/* <div>
            <label htmlFor="confirmPassword">
              Confirm Password: <span className="text-red-500">*</span>
            </label>
            <input 
            className="w-full bg-white text-black rounded-md px-1 py-1 border border-black-300 focus:outline-none focus:ring-2 focus:ring-[#AF524D]"
            type="password" 
            id="confirmPassword" 
            required
            />
          </div> */}
        </div>

        <div className="flex items-center justify-center w-sm">
            <button className="bg-[#623C2B] text-white font-bold px-6 py-2 rounded-md cursor-pointer transition ease-in-out delay-100 hover:bg-[#FFECB5] duration-300 tracking-wide w-full">SIGN UP</button>
        </div>
      </div>
    </div>
  )
}

export default SignUp;
