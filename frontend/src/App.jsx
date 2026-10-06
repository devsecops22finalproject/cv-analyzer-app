import { Route, Routes, BrowserRouter } from "react-router-dom";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import JobDetailPage from "./pages/JobDetailPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import { Layout } from "./components/ui.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
