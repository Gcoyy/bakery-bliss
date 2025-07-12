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
        <p>Phone:</p>
        <p>Email:</p>
        <p>Location:</p>
        <p className="mt-4">Social Media:</p>
        <div className="flex gap-3 mt-2">
          <a href="https://www.facebook.com/connies.cakemall" target="_blank" rel="noopener noreferrer">
            <img src="/fb_icon.png" alt="Facebook" className="w-6 h-6" />
          </a>
          <a href="https://www.instagram.com/conniescakemall?igsh=MXNiNjUwdjVlNW5uaA==" target="_blank" rel="noopener noreferrer">
            <img src="/ig_icon.png" alt="Instagram" className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* 3. Left Link Section */}
      <div className="w-full sm:w-auto mb-6 sm:mb-0">
        <ul className="space-y-1">
          <li>Product Care</li>
          <li>Contact Us</li>
        </ul>
      </div>

      {/* 4. Right Link Section */}
      <div className="w-full sm:w-auto">
        <ul className="space-y-1">
          <li>Terms and conditions</li>
          <li>Privacy Notice</li>
          <li>
            <Link to="/aboutus">
              Location
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default Footer;
