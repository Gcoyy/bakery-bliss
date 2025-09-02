import AdminSidebar from "../../sections/AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <section className="flex flex-col md:flex-row gap-4 p-4 bg-[#F8E6B4] min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </section>
  );
};

export default AdminLayout;
