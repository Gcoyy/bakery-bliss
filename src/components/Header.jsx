import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const { session, userRole } = UserAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={`flex items-center justify-between px-4 md:px-8 w-full h-[14vh] ${userRole === "admin" ? "bg-[#E2D2A2]" : "bg-[#AF524D]"}`}>
      <Link to="/#home">
        <div className="flex items-center space-x-2">
          {/* Cake Icon */}
          <div className="w-8 h-8 bg-white rounded-t-lg relative">
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#DFAD56]"></div>
            <div className="absolute bottom-1/3 left-0 right-0 h-1/3 bg-[#E2D2A2]"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-yellow-400">
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></div>
            </div>
          </div>
          {/* Logo Text */}
          <div className="text-white font-bold text-xl">
            <span className="text-[#F8E6B4]">Bakery</span>
            <span className="text-white">Bliss</span>
          </div>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:block">
        <ul className="flex space-x-8 font-semibold text-base">
          {[
            ...(userRole === "admin" ? [
              { to: "/adminpage", label: "Dashboard" },
              { to: "/temp", label: "Temp" },
            ] : [
              { to: "/", label: "Home" },
              { to: "/customization", label: "Cake Customization" },
              { to: "/cakecatalog", label: "Cake Catalog" },
              { to: "/aboutus", label: "About Us" },
              { to: "/contactus", label: "Contact Us" },
            ])
          ].map((item) => (
            <li key={item.to} className="relative group">
              <Link
                to={item.to}
                className={`transition-colors duration-300 ${location.pathname === item.to ? (userRole === "admin" ? "text-[#613C2A]" : "text-[#EBD187]") : "text-white"}`}
              >
                {item.label}
              </Link>
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
        </div>
      </button>

      {/* Mobile Navigation */}
      <div className={`absolute top-full left-0 w-full ${userRole === "admin" ? "bg-[#E2D2A2]" : "bg-[#AF524D]"} shadow-lg transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="px-4 py-4">
          <ul className="space-y-4 font-semibold text-base">
            {[
              ...(userRole === "admin" ? [
                { to: "/adminpage", label: "Dashboard" },
                { to: "/temp", label: "Temp" },
              ] : [
                { to: "/", label: "Home" },
                { to: "/customization", label: "Cake Customization" },
                { to: "/cakecatalog", label: "Cake Catalog" },
                { to: "/aboutus", label: "About Us" },
                { to: "/contactus", label: "Contact Us" },
              ])
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`block py-2 transition-colors duration-300 ${location.pathname === item.to ? (userRole === "admin" ? "text-[#613C2A]" : "text-[#EBD187]") : "text-white"}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Link to={userRole === "admin" ? "/admin/profile" : "/profile"} className="h-12 w-12">
          <img src="/Profile Icon.png" alt="Profile" className="w-full h-full" />
        </Link>
        {userRole !== "admin" && (
          <a href="../Pages/Cart" className="h-12 w-12">
            <img src="/Cart.png" alt="Cart" className="w-full h-full" />
          </a>
        )}
      </div>
    </header>
  )
}

export default Header;