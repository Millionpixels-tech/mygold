import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SingleItem from "./pages/SingleItem";
import AddItem from "./pages/AddItem";
import Profile from "./pages/Profile";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import Contact from "./pages/Contact";
import QA from "./pages/Qa";
import ForgotPassword from "./components/Auth/ForgotPassword";
import HowItWorks from "./pages/HowItWorks";
import ShopWizard from "./pages/ShopWizard";
import SingleShop from "./pages/SingleShop";
import ShopsList from "./pages/ShopsList";
import Forum from "./pages/Forum";
import Hotjar from '@hotjar/browser';

function App() {
  // Initialize Hotjar with your site ID and version
  const siteId = 6418809;
  const hotjarVersion = 6;

  Hotjar.init(siteId, hotjarVersion);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item/:slugAndId" element={<SingleItem />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/qa" element={<QA />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/how-it-works" element={<HowItWorks/>} />
        <Route path="/shop/:slugAndId" element={<SingleShop/>} />


        <Route path="/gold-shops-in-sri-lanka" element={<ShopsList/>} />
        <Route path="/forum" element={<Forum />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop-manager" element={<ShopWizard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
