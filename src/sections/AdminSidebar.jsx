import { Link } from "react-router-dom"

const AdminSidebar = () => {
  const options = Array.from({ length: 14 }, (_, i) => `Admin Option ${i + 1}`);

  return (
    <aside className="w-52 bg-white border-4 border-[#AF524D] py-4 px-2 rounded-2xl">
      <ul className="space-y-2">
        {options.map((opt, i) => (
        <Link
          key={i}
          to={`/admin/option${i + 1}`}
          className="block text-sm text-black-700 hover:bg-[#DFBFA6] px-3 py-2 rounded border-1 border-black/50"
        >
          {opt}
        </Link>
        ))}
      </ul>
    </aside>
  )
}

export default AdminSidebar
