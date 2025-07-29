import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";


const Header = () => {
  const location = useLocation();
  const { session } = UserAuth();
  const [role, setRole] = useState(null);

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
    <header className="flex items-center justify-between px-8 bg-[#AF524D] w-full h-[14vh]">
      <Link to="/#home">
          <img src="#" alt="Logo" />
        </Link>

      <nav className="desktop">
        <ul className="flex space-x-8 font-semibold text-base">
          {[
            { to: role === "admin" ? "/adminpage": "/",
               label: "Home" },
            { to: "/customization", label: "Cake Customization" },
            { to: "/cakecatalog", label: "Cake Catalog" },
            { to: "/aboutus", label: "About Us" },
            { to: "/contactus", label: "Contact Us" },
          ].map((item) => (
            <li key={item.to} className="relative group">
              <Link
                to={item.to}
                className={`transition-colors duration-300 ${
                  location.pathname === item.to ? "text-[#EBD187]" : "text-white"
                }`}
              >
                {item.label}
              </Link>
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </li>
          ))}
        </ul>
      </nav>


      <div className="flex items-center space-x-4">
        <Link to={role === "admin" ? "/admin/profile" : "/profile"} className="h-12 w-12">
          <img src="/Profile Icon.png" alt="Profile" className="w-full h-full" />
        </Link>
        <a href="../Pages/Cart" className="h-12 w-12">
          <img src="/Cart.png" alt="Cart" className="w-full h-full" />
        </a>
      </div>
    </header>
  )
}

export default Header;