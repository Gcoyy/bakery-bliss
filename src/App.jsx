import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransition";
import SignUp from "./Pages/Customer/SignUp";
import Home from "./Pages/Customer/Home";
import Login from "./Pages/Login";
import ResetPassword from "./Pages/ResetPassword";
import AboutUs from "./Pages/Customer/AboutUs";
import ContactUs from "./Pages/Customer/ContactUs";
import ScrollToHashElement from "./components/ScrollToHashElement";
import Profile from "./Pages/Customer/Profile";
import CakeCatalog from "./Pages/Customer/CakeCatalog";
import RoleBasedRedirect from "./context/RoleBasedRedirect";
import Cart from "./Pages/Customer/Cart";
import CakeCustomization from "./Pages/Customer/CakeCustomization";

import Inventory from "./sections/Inventory";
import Cakes from "./sections/Cakes";
import CakeOrders from "./sections/CakeOrders";
import Assets from "./sections/Assets";
import ProtectedRoute from "./context/ProtectedRoute";
import AdminPage from "./Pages/Admin/AdminPage";
import AdminProfile from "./Pages/Admin/AdminProfile";
import AdminOrders from "./Pages/Admin/AdminOrders";

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/redirect" element={<PageTransition><RoleBasedRedirect /></PageTransition>} />
        <Route path="/aboutus" element={<PageTransition><AboutUs /></PageTransition>} />
        <Route path="/contactus" element={<PageTransition><ContactUs /></PageTransition>} />
        <Route path="/cakecatalog" element={<PageTransition><CakeCatalog /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/cakecustomization" element={<PageTransition><CakeCustomization /></PageTransition>} />

        {/* Customer-only route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <PageTransition><Profile /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/adminpage"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PageTransition><AdminPage /></PageTransition>
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
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PageTransition><AdminOrders /></PageTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PageTransition><AdminProfile /></PageTransition>
            </ProtectedRoute>
          }
        />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <AppRoutes />
      <ScrollToHashElement />
      <Footer />
    </>
  );
}

export default App;