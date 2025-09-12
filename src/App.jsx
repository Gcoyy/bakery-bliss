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
import BlockedDates from "./sections/BlockedDates";
import RecipeManagement from "./sections/RecipeManagement";
import AssetIngredientManagement from "./sections/AssetIngredientManagement";
import QRCodeUpload from "./sections/QRCodeUpload";
import ProtectedRoute from "./context/ProtectedRoute";
import AdminPage from "./Pages/Admin/AdminPage";
import AdminProfile from "./Pages/Admin/AdminProfile";
import useScrollToTop from "./hooks/useScrollToTop";

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

        {/* Root path - role-based redirect for logged-in users, Home for guests */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Dashboard route with role-based redirect for logged-in users */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Public routes */}
        <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
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
              <AdminPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<PageTransition><Inventory /></PageTransition>} />
          <Route path="inventory" element={<PageTransition><Inventory /></PageTransition>} />
          <Route path="cakes" element={<PageTransition><Cakes /></PageTransition>} />
          <Route path="cake orders" element={<PageTransition><CakeOrders /></PageTransition>} />
          <Route path="custom cake assets" element={<PageTransition><Assets /></PageTransition>} />
          <Route path="blocked dates" element={<PageTransition><BlockedDates /></PageTransition>} />
          <Route path="recipe management" element={<PageTransition><RecipeManagement /></PageTransition>} />
          <Route path="asset ingredient management" element={<PageTransition><AssetIngredientManagement /></PageTransition>} />
        </Route>

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PageTransition><AdminProfile /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* QR Code Upload route */}
        <Route
          path="/qrcodeupload"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PageTransition><QRCodeUpload /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* OAuth Redirect Handler */}
        <Route path="/redirect" element={<RoleBasedRedirect />} />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // Use the scroll to top hook
  useScrollToTop();

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