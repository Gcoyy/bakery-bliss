import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import SignUp from "./Pages/Customer/SignUp"
import Login from "./Pages/Login"
import Home from "./Pages/Customer/Home"
import AboutUs from "./Pages/Customer/AboutUs"
import ContactUs from "./Pages/Customer/ContactUs"
import ScrollToHashElement from "./components/ScrollToHashElement"
import Profile from "./Pages/Customer/Profile"
import CakeCatalog from "./Pages/Customer/CakeCatalog"

import AdminPage from "./Pages/Admin/AdminPage"
import Inventory from "./sections/Inventory"
import Cakes from "./sections/Cakes"
import CakeOrders from "./sections/CakeOrders"

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home/>} /> 
        <Route path="/aboutus" element={<AboutUs/>} />
        <Route path="contactus" element={<ContactUs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cakecatalog" element={<CakeCatalog />} />

        <Route path="/admin" element={<AdminPage />}>
          <Route path="option1" element={<Inventory/>} />
          <Route path="cakes" element={<Cakes />} />
          <Route path="cake orders" element={<CakeOrders />} />
        </Route>
      </Routes>
      <ScrollToHashElement />
      <Footer />
    </>
  )
}

export default App;
