import { useState, useEffect } from "react"; // Added useEffect for debugging
import Dashboard from "./pages/Dashboard";
import ModelPerformance from "./pages/ModelPerformance";
import AboutSystem from "./pages/AboutSystem";
import AttackReport from "./pages/AttackReport"; // 1. IMPORT
import MLFeatures from "./pages/MLFeatures"; // Import ML Features page
import Footer from "./components/Footer";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import NetworkLogs from "./pages/NetworkLogs";
import Live from "./pages/Live";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");

  // 2. DEBUGGING: This will show you exactly what text is coming from the Sidebar
  useEffect(() => {
    console.log("Current Active Page:", activePage);
  }, [activePage]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col font-mono">
      <Sidebar 
        open={menuOpen} 
        setOpen={setMenuOpen} 
        setActivePage={setActivePage} 
      />
      
      <Header toggleMenu={() => setMenuOpen(!menuOpen)}/>

      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="overflow-auto" style={{ minHeight: 0 }}>
          {/* 3. UPDATED SWITCH LOGIC */}
          {activePage === "Dashboard" ? (
            <Dashboard />
          ) : activePage === "Model Performance" ? (
            <ModelPerformance />
          ) : activePage === "ML Features" ? (
            <MLFeatures />
          ) : activePage === "About System" ? (
            <AboutSystem />
          ) : activePage === "Live" ? (
            <Live />
          ) : activePage === "Attack Reports" ? ( // ENSURE THIS MATCHES SIDEBAR STRING
            <AttackReport />
          ) : (
            <div className="p-20 text-center text-gray-500 uppercase tracking-widest">
              {activePage} :: INITIALIZING...
            </div>
          )}
        </div>
        <div className="flex-shrink-0 border-t-4 border-cyan-500/30" style={{ resize: 'vertical', overflow: 'auto', minHeight: '200px', maxHeight: '40vh', height: '280px' }}>
          <NetworkLogs/>
        </div>
      </main>

      <Footer/>
    </div>
  );
}