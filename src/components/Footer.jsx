import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-[#381914] h-fit p-8 flex justify-between flex-wrap text-[#F8E6B4]">
      {/* 1. Logo Section */}
      <div className="w-full sm:w-auto mb-6 sm:mb-0">
        {/* <div className="w-40 h-24 bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 font-semibold">LOGO</span>
        </div> */}
        <Link to="/#home">
          <img src="#" alt="Logo" />
        </Link>
      </div>

      {/* 2. Contact Info + Socials */}
      <div className="w-full sm:w-auto mb-6 sm:mb-0">
        <h3 className="font-semibold mb-2">Contact Us</h3>
        <p>📞 +63 912 345 6789</p>
        <p>✉️ conniescakemall@gmail.com</p>
        <p>📍 Dumaguete City, Philippines</p>
        <p className="mt-4 font-semibold">Follow Us:</p>
        <div className="flex gap-3 mt-2">
          <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src="/fb_icon.png" alt="Facebook" className="w-6 h-6" />
          </a>
          <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src="/ig_icon.png" alt="Instagram" className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* 3. Quick Links */}
      <div className="w-full sm:w-auto mb-6 sm:mb-0">
        <h3 className="font-semibold mb-2">Quick Links</h3>
        <ul className="space-y-1">
          <li>
            <Link to="/cakes" className="hover:text-[#AF524D] transition-colors">
              Our Cakes
            </Link>
          </li>
          <li>
            <Link to="/aboutus" className="hover:text-[#AF524D] transition-colors">
              About Us
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-[#AF524D] transition-colors">
              Contact
            </Link>
          </li>
        </ul>
      </div>

      {/* 4. Legal Links */}
      <div className="w-full sm:w-auto">
        <h3 className="font-semibold mb-2">Legal</h3>
        <ul className="space-y-1">
          <li>
            <Link to="/terms" className="hover:text-[#AF524D] transition-colors">
              Terms & Conditions
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="hover:text-[#AF524D] transition-colors">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link to="/aboutus" className="hover:text-[#AF524D] transition-colors">
              Location
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default Footer;
