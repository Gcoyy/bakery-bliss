import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import SignUp from "./Pages/Customer/SignUp";
import Home from "./Pages/Customer/Home";
import Login from "./Pages/Login";
import AboutUs from "./Pages/Customer/AboutUs";
import ContactUs from "./Pages/Customer/ContactUs";
import ScrollToHashElement from "./components/ScrollToHashElement";
import Profile from "./Pages/Customer/Profile";
import CakeCatalog from "./Pages/Customer/CakeCatalog";
import RoleBasedRedirect from "./context/RoleBasedRedirect";

import Inventory from "./sections/Inventory";
import Cakes from "./sections/Cakes";
import CakeOrders from "./sections/CakeOrders";
import Assets from "./sections/Assets";
import ProtectedRoute from "./context/ProtectedRoute";
import AdminPage from "./Pages/Admin/AdminPage";
import AdminProfile from "./Pages/Admin/AdminProfile";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/redirect" element={<RoleBasedRedirect />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/cakecatalog" element={<CakeCatalog />} />

        {/* Customer-only route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/adminpage"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Inventory />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="cakes" element={<Cakes />} />
          <Route path="cake orders" element={<CakeOrders />} />
          <Route path="custom cake assets" element={<Assets />} />
        </Route>

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

      </Routes>
      <ScrollToHashElement />
      <Footer />
    </>
  );
}

export default App;