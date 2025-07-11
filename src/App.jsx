import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import SignUp from "./Pages/SignUp"
import Login from "./Pages/Login"
import Home from "./Pages/Customer/Home"


function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/bakery-bliss" element={<Login />} />
        <Route path="/" element={<Home/>} /> 
      </Routes>
      <Footer />
    </>
  )
}

export default App;
