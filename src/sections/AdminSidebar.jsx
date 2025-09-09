import { Link, useLocation } from "react-router-dom"

const AdminSidebar = () => {
  const location = useLocation();

  // Get the current path segment after /adminpage/
  const pathSegments = location.pathname.split('/');
  const adminIndex = pathSegments.indexOf('adminpage');
  const currentPath = adminIndex !== -1 && pathSegments[adminIndex + 1] ? pathSegments[adminIndex + 1] : 'inventory';


  return (
    <aside className="w-52 bg-white border-4 border-[#AF524D] py-4 px-2 rounded-2xl max-h-fit">
      <ul className="space-y-2">
        {[
          { name: "Inventory", path: "inventory" },
          { name: "Cake Orders", path: "cake orders" },
          { name: "Cakes", path: "cakes" },
          { name: "Custom Cake Assets", path: "custom cake assets" },
          { name: "Blocked Dates", path: "blocked dates" },
          { name: "Recipe Management", path: "recipe management" },
          { name: "Asset Ingredient Management", path: "asset ingredient management" },
        ].map((opt, i) => {
          // Check if this option is active - handle URL encoding
          const decodedCurrentPath = decodeURIComponent(currentPath);
          const isActive = decodedCurrentPath === opt.path;


          return (
            <Link
              key={i}
              to={`/adminpage/${opt.path}`}
              className={`block text-sm px-3 py-2 rounded border transition-all duration-200 ${isActive
                ? 'bg-[#AF524D] text-white border-[#AF524D] shadow-md transform scale-105'
                : 'text-gray-700 hover:bg-[#DFBFA6] border-gray-300 hover:border-[#AF524D] hover:text-[#AF524D]'
                }`}
            >
              {opt.name}
            </Link>
          );
        })}
      </ul>
    </aside>
  )
}

export default AdminSidebar
