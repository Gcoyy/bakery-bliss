import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";


const Header = () => {
  const location = useLocation();
  const { session } = UserAuth();
  const [role, setRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (session?.user?.id) {
        const { data: admin, error: adminError } = await supabase
          .from("ADMIN")
          .select("admin_uid")
          .eq("admin_uid", session.user.id)
          .single();

        if (admin && !adminError) {
          setRole("admin");
          return;
        }

        const { data: customer, error: customerError } = await supabase
          .from("CUSTOMER")
          .select("auth_user_id")
          .eq("auth_user_id", session.user.id)
          .single();

        if (customer && !customerError) {
          setRole("customer");
        }
      }
    };

    fetchRole();
  }, [session]);


  return (
    <header className={`flex items-center justify-between px-4 md:px-8 w-full h-[14vh] ${role === "admin" ? "bg-[#E2D2A2]" : "bg-[#AF524D]"
      }`}>
      <Link to="/#home">
        <img src="#" alt="Logo" />
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:block">
        <ul className="flex space-x-8 font-semibold text-base">
          {[
            ...(role !== "admin" ? [
              { to: "/", label: "Home" },
              { to: "/customization", label: "Cake Customization" },
              { to: "/cakecatalog", label: "Cake Catalog" },
              { to: "/aboutus", label: "About Us" },
              { to: "/contactus", label: "Contact Us" },
            ] : [
              { to: "/adminpage", label: "Dashboard" },
              { to: "/temp", label: "Temp" },
            ])
          ].map((item) => (
            <li key={item.to} className="relative group">
              <Link
                to={item.to}
                className={`transition-colors duration-300 ${location.pathname === item.to ? "text-[#613C2A]" : "text-white"
                  }`}
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
      <div className={`absolute top-full left-0 w-full ${role === "admin" ? "bg-[#E2D2A2]" : "bg-[#AF524D]"} shadow-lg transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <nav className="px-4 py-4">
          <ul className="space-y-4 font-semibold text-base">
            {[
              ...(role !== "admin" ? [
                { to: "/", label: "Home" },
                { to: "/customization", label: "Cake Customization" },
                { to: "/cakecatalog", label: "Cake Catalog" },
                { to: "/aboutus", label: "About Us" },
                { to: "/contactus", label: "Contact Us" },
              ] : [
                { to: "/adminpage", label: "Dashboard" },
                { to: "/temp", label: "Temp" },
              ])
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`block py-2 transition-colors duration-300 ${location.pathname === item.to ? "text-[#613C2A]" : "text-white"}`}
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
        <Link to={role === "admin" ? "/admin/profile" : "/profile"} className="h-12 w-12">
          <img src="/Profile Icon.png" alt="Profile" className="w-full h-full" />
        </Link>
        {role !== "admin" && (
          <a href="../Pages/Cart" className="h-12 w-12">
            <img src="/Cart.png" alt="Cart" className="w-full h-full" />
          </a>
        )}
      </div>
    </header>
  )
}

export default Header;