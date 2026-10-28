import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useMeta } from "./api/hooks";
import { AccuracyPage } from "./pages/AccuracyPage";
import { DecisionPage } from "./pages/DecisionPage";
import { ControlBar, Header, Sidebar } from "./components/layout";
import { useControls } from "./components/useControls";
import { ErrorState, LoadingState } from "./components/ui";
import "./App.css";

function RootRedirect() {
  const location = useLocation();
  return <Navigate replace to={`/decision${location.search}`} />;
}

function App() {
  const meta = useMeta();
  const controls = useControls(meta.data);
  const [dark, setDark] = useState(
    () => localStorage.getItem("wind-theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("wind-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="app-shell">
      <Header dark={dark} onTheme={() => setDark((value) => !value)} />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <ControlBar meta={meta.data} controls={controls} />
          {meta.isLoading ? (
            <LoadingState />
          ) : meta.error ? (
            <ErrorState message={meta.error.message} />
          ) : (
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/decision" element={<DecisionPage {...controls} />} />
              <Route
                path="/accuracy"
                element={<AccuracyPage cutoff={controls.cutoff} />}
              />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}

export { DecisionChart } from "./components/charts";
export { DecisionTable, MetricTable } from "./components/tables";
export { Kpi } from "./components/ui";
export default App;
