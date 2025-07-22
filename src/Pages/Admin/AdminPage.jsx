import AdminSidebar from "../../sections/AdminSidebar"
import { Outlet } from "react-router-dom"

const AdminPage = () => {
  return (
    <section className="flex gap-4 p-4 bg-[#F8E6B4]">
        <AdminSidebar />
        <Outlet />
    </section>
  )
}

export default AdminPage
