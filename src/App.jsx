import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import Home from "./Pages/Customer/Home"
import AboutUs from "./Pages/Customer/AboutUs"
import ContactUs from "./Pages/Customer/ContactUs"
import ScrollToHashElement from "./components/ScrollToHashElement"


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
      </Routes>
      <ScrollToHashElement />
      <Footer />
    </>
  )
}

export default App;
