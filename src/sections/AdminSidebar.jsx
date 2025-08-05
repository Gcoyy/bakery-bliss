import { Link, useLocation } from "react-router-dom"

const AdminSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();

  return (
    <aside className="w-52 bg-white border-4 border-[#AF524D] py-4 px-2 rounded-2xl max-h-fit">
      <ul className="space-y-2">
        {[
          { name: "Inventory", path: "inventory" },
          { name: "Cake Orders", path: "cake orders" },
          { name: "Cakes", path: "cakes" },
          { name: "Custom Cake Assets", path: "custom cake assets" },
          { name: "Order Management", path: "/admin/orders", isExternal: true },
        ].map((opt, i) => {
          const isActive = opt.isExternal ? location.pathname === opt.path : currentPath === opt.path;
          return (
            <Link
              key={i}
              to={opt.isExternal ? opt.path : `/adminpage/${opt.path}`}
              className={`block text-sm px-3 py-2 rounded border transition-colors ${isActive
                ? 'bg-[#AF524D] text-white border-[#AF524D]'
                : 'text-black-700 hover:bg-[#DFBFA6] border-black/50'
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
