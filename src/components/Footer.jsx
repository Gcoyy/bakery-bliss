import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#381914] via-[#492220] to-[#2D1B1B] relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-16 h-16 bg-[#AF524D]/10 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-12 h-12 bg-[#DFAD56]/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-[#E2D2A2]/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-1/3 w-10 h-10 bg-[#F8E6B4]/10 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 1. Logo Section */}
            <div className="lg:col-span-1">
              <Link to="/#home" className="group">
                <div className="flex items-center space-x-3 mb-6">
                  {/* Modern Cake Icon - Similar to Header */}
                  <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl relative shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#DFAD56] to-[#E2D2A2] rounded-b-2xl"></div>
                    <div className="absolute bottom-1/3 left-0 right-0 h-1/3 bg-gradient-to-t from-[#E2D2A2] to-[#F8E6B4]"></div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-t from-yellow-400 to-orange-400 rounded-full">
                      <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  {/* Logo Text */}
                  <div className="text-white">
                    <h2 className="text-2xl font-bold font-abhaya">
                      <span className="text-[#AF524D]">Connie</span>
                      <span className="text-[#F8E6B4]"> de Cafe</span>
                    </h2>
                    <p className="text-[#E2D2A2] text-sm">Sweet Dreams Made Real</p>
                  </div>
                </div>
                <p className="text-[#E2D2A2] text-sm leading-relaxed">
                  Creating delicious memories with every bite. From custom cakes to daily treats, we bring joy to your special moments.
                </p>
              </Link>
            </div>

            {/* 2. Contact Info */}
            <div>
              <h3 className="text-[#F8E6B4] font-semibold text-lg mb-4 font-abhaya">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#AF524D]/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-[#E2D2A2] text-sm">+63 917 629 2377</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#DFAD56]/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#DFAD56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-[#E2D2A2] text-sm">conniedecafe@gmail.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#E2D2A2]/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#E2D2A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-[#E2D2A2] text-sm">Dumaguete City, Philippines</span>
                </div>
              </div>
            </div>

            {/* 3. Quick Links */}
            <div>
              <h3 className="text-[#F8E6B4] font-semibold text-lg mb-4 font-abhaya">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/cakes" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
                    <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Our Cakes
                  </Link>
                </li>
                <li>
                  <Link to="/aboutus" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
                    <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
                    <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/customize" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
                    <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Customize Cake
                  </Link>
                </li>
              </ul>
            </div>

            {/* 4. Social Media & Legal */}
            <div>
              <h3 className="text-[#F8E6B4] font-semibold text-lg mb-4 font-abhaya">Follow Us</h3>
              <div className="flex space-x-4 mb-6">
                <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#3b5998]/20 hover:bg-[#3b5998]/30 rounded-xl flex items-center justify-center transition-all duration-200 group">
                  <svg className="w-5 h-5 text-[#3b5998] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-[#E4405F]/20 to-[#F77737]/20 hover:from-[#E4405F]/30 hover:to-[#F77737]/30 rounded-xl flex items-center justify-center transition-all duration-200 group">
                  <svg className="w-6 h-6 text-[#E4405F] group-hover:scale-110 transition-transform" viewBox="0 0 102 102" id="instagram">
                    <defs>
                      <radialGradient id="a" cx="6.601" cy="99.766" r="129.502" gradientUnits="userSpaceOnUse">
                        <stop offset=".09" stop-color="#fa8f21"></stop>
                        <stop offset=".78" stop-color="#d82d7e"></stop>
                      </radialGradient>
                      <radialGradient id="b" cx="70.652" cy="96.49" r="113.963" gradientUnits="userSpaceOnUse">
                        <stop offset=".64" stop-color="#8c3aaa" stop-opacity="0"></stop>
                        <stop offset="1" stop-color="#8c3aaa"></stop>
                      </radialGradient>
                    </defs>
                    <path fill="url(#a)" d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"></path>
                    <path fill="url(#b)" d="M25.865,101.639A34.341,34.341,0,0,1,14.312,99.5a19.329,19.329,0,0,1-7.154-4.653A19.181,19.181,0,0,1,2.5,87.694,34.341,34.341,0,0,1,.364,76.142C.061,69.584,0,67.617,0,51s.067-18.577.361-25.14A34.534,34.534,0,0,1,2.5,14.312,19.4,19.4,0,0,1,7.154,7.154,19.206,19.206,0,0,1,14.309,2.5,34.341,34.341,0,0,1,25.862.361C32.422.061,34.392,0,51,0s18.577.067,25.14.361A34.534,34.534,0,0,1,87.691,2.5a19.254,19.254,0,0,1,7.154,4.653A19.267,19.267,0,0,1,99.5,14.309a34.341,34.341,0,0,1,2.14,11.553c.3,6.563.361,8.528.361,25.14s-.061,18.577-.361,25.14A34.5,34.5,0,0,1,99.5,87.694,20.6,20.6,0,0,1,87.691,99.5a34.342,34.342,0,0,1-11.553,2.14c-6.557.3-8.528.361-25.14.361s-18.577-.058-25.134-.361"></path>
                    <path fill="#fff" d="M461.114,477.413a12.631,12.631,0,1,1,12.629,12.632,12.631,12.631,0,0,1-12.629-12.632m-6.829,0a19.458,19.458,0,1,0,19.458-19.458,19.457,19.457,0,0,0-19.458,19.458m35.139-20.229a4.547,4.547,0,1,0,4.549-4.545h0a4.549,4.549,0,0,0-4.547,4.545m-30.99,51.074a20.943,20.943,0,0,1-7.037-1.3,12.547,12.547,0,0,1-7.193-7.19,20.923,20.923,0,0,1-1.3-7.037c-.184-3.994-.22-5.194-.22-15.313s.04-11.316.22-15.314a21.082,21.082,0,0,1,1.3-7.037,12.54,12.54,0,0,1,7.193-7.193,20.924,20.924,0,0,1,7.037-1.3c3.994-.184,5.194-.22,15.309-.22s11.316.039,15.314.221a21.082,21.082,0,0,1,7.037,1.3,12.541,12.541,0,0,1,7.193,7.193,20.926,20.926,0,0,1,1.3,7.037c.184,4,.22,5.194.22,15.314s-.037,11.316-.22,15.314a21.023,21.023,0,0,1-1.3,7.037,12.547,12.547,0,0,1-7.193,7.19,20.925,20.925,0,0,1-7.037,1.3c-3.994.184-5.194.22-15.314.22s-11.316-.037-15.309-.22m-.314-68.509a27.786,27.786,0,0,0-9.2,1.76,19.373,19.373,0,0,0-11.083,11.083,27.794,27.794,0,0,0-1.76,9.2c-.187,4.04-.229,5.332-.229,15.623s.043,11.582.229,15.623a27.793,27.793,0,0,0,1.76,9.2,19.374,19.374,0,0,0,11.083,11.083,27.813,27.813,0,0,0,9.2,1.76c4.042.184,5.332.229,15.623.229s11.582-.043,15.623-.229a27.8,27.8,0,0,0,9.2-1.76,19.374,19.374,0,0,0,11.083-11.083,27.716,27.716,0,0,0,1.76-9.2c.184-4.043.226-5.332.226-15.623s-.043-11.582-.226-15.623a27.786,27.786,0,0,0-1.76-9.2,19.379,19.379,0,0,0-11.08-11.083,27.748,27.748,0,0,0-9.2-1.76c-4.041-.185-5.332-.229-15.621-.229s-11.583.043-15.626.229" transform="translate(-422.637 -426.196)"></path>
                  </svg>
                </a>
              </div>

              <div className="space-y-2">
                <h4 className="text-[#F8E6B4] font-medium text-sm mb-2">Legal</h4>
                <div className="space-y-1">
                  <Link to="/terms" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 text-sm">
                    Terms & Conditions
                  </Link>
                  <br />
                  <Link to="/privacy" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 text-sm">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom border */}
          <div className="border-t border-[#AF524D]/20 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-[#E2D2A2] text-sm">
                © 2025 Connie de Café. All rights reserved.
              </p>
              <p className="text-[#E2D2A2] text-sm">
                Made by <span className="text-[#AF524D] font-semibold">CCS students</span> in Silliman University
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
