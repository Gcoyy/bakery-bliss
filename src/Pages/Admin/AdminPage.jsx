import AdminSidebar from "../../sections/AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <section className="flex gap-4 p-4 bg-[#F8E6B4] min-h-screen">
      <AdminSidebar />
      <Outlet />
    </section>
  );
};

export default AdminLayout;
