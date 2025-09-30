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
        <div className="max-w-7xl mx-auto pt-8 pb-3 py-12">
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
                      <span className="text-[#F8E6B4]"> de Café</span>
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
                  <span className="text-[#E2D2A2] text-sm">dejesus.connie@gmail.com</span>
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
                  <Link to="/cakecatalog" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
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
                  <Link to="/contactus" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
                    <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/cakecustomization" className="text-[#E2D2A2] hover:text-[#AF524D] transition-colors duration-200 flex items-center group">
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
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="url(#instagram-gradient)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E4405F" />
                        <stop offset="100%" stopColor="#F77737" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
          <div className="border-t border-[#AF524D]/20 mt-8 pt-3">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-[#E2D2A2]/50 text-sm">
                © 2025 Connie de Café. All rights reserved.
              </p>
              <p className="text-[#E2D2A2]/50 text-sm">
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
