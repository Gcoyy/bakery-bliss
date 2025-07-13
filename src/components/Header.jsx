import { Link, useLocation } from "react-router-dom";


const Header = () => {
  const location = useLocation();

  return (
    <header className="flex items-center justify-between px-8 bg-[#AF524D] w-full h-[14vh]">
      <a className="logo" href="../Pages/Home">
        <img src="#" alt="Logo" />
      </a>

      <nav className="desktop">
        <ul className="flex space-x-8 font-semibold text-base">
          {[
            { to: "/", label: "Home" },
            { to: "/customization", label: "Cake Customization" },
            { to: "/catalog", label: "Cake Catalog" },
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
        <Link to="/profile" className="h-12 w-12">
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
