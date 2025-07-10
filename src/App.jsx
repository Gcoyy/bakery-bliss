import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import SignUp from "./Pages/SignUp"
// import Login from "./Pages/Login"

function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* <Route path="/bakery-bliss" element={<SignUp />} /> */}
        <Route path="/bakery-bliss" element={<Login />} />
      </Routes>
    </>
  )
}

export default App;
