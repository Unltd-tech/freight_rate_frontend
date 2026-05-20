import { Routes, Route, Navigate } from "react-router-dom";

import PricingCalculator from "./components/PricingCalculator";
import PricingUpload from "./components/PricingUpload";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calculator" />} />

      <Route path="/calculator" element={<PricingCalculator />} />

      <Route path="/upload-pricing" element={<PricingUpload />} />
    </Routes>
  );
}

export default App;