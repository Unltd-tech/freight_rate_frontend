import { Routes, Route } from "react-router-dom";

import PricingCalculator from "./components/PricingCalculator";
import PricingUpload from "./components/PricingUpload";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PricingCalculator />} />

      <Route path="/calculator" element={<PricingCalculator />} />

      <Route path="/upload-pricing" element={<PricingUpload />} />
    </Routes>
  );
}

export default App;
