import { Link } from "react-router-dom"

const AdminSidebar = () => {
  return (
    <aside className="w-52 bg-white border-4 border-[#AF524D] py-4 px-2 rounded-2xl max-h-fit">
      <ul className="space-y-2">
        {[
          { name: "Inventory", path: "inventory" },
          { name: "Cake Orders", path: "cake orders" },
          { name: "Cakes", path: "cakes" },
          { name: "Custom Cake Assets", path: "custom cake assets" }
        ].map((opt, i) => (
          <Link
            key={i}
            to={`/admin/${opt.path}`}
            className="block text-sm text-black-700 hover:bg-[#DFBFA6] px-3 py-2 rounded border border-black/50"
          >
            {opt.name}
          </Link>
        ))}
      </ul>
    </aside>
  )
}

export default AdminSidebar
