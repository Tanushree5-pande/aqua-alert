import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminAuth from "./pages/home/AdminAuth";
import AdminHome from "./pages/home/AdminHome";
import FilterPage from "./pages/home/FilterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminAuth />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/filter/:id" element={<FilterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;