import { Link } from "react-router-dom";


const Header = () => {
  return (
    <header className="flex items-center justify-between px-8 bg-[#AF524D] w-full h-[14vh]">
      <a className="logo" href="../Pages/Home">
        <img src="#" alt="Logo" />
      </a>

      <nav className="desktop">
        <ul className="flex space-x-8 text-white font-semibold text-base">
          <li>
            <Link to="/" className="hover:underline">Home</Link>
          </li>
          <li>
            <Link to="/customization" className="hover:underline">Cake Customization</Link>
          </li>
          <li>
            <Link to="/catalog" className="hover:underline">Cake Catalog</Link>
          </li>
          <li>
            <Link to="/aboutus" className="hover:underline">About Us</Link>
          </li>
          <li>
            <Link to="/contactus" className="hover:underline">Contact Us</Link>
          </li>
        </ul>
      </nav>

      <div className="flex items-center space-x-4">
        <a href="../Pages/Profile" className="h-10 w-10">
          <img src="/Profile Icon.png" alt="Profile" className="w-full h-full" />
        </a>
        <a href="../Pages/Cart" className="h-10 w-10">
          <img src="/Cart.png" alt="Cart" className="w-full h-full" />
        </a>
      </div>
    </header>
  )
}

export default Header;
