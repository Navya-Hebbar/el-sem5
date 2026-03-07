export default function Sidebar({ open, setOpen, setActivePage }) {
  
  // Logic to change page AND close sidebar at the same time
  const handleNavigation = (page) => {
    setActivePage(page); // Tell App.jsx to change the component
    setOpen(false);      // Close the sidebar
  };

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* 1. DARK OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* 2. SIDEBAR PANEL */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black/90 backdrop-blur-xl border-r border-cyan-500/20 transform transition-transform duration-300 z-50
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 flex justify-between items-center">
          <div className="text-cyan-400 font-bold tracking-wider">
            SYSTEM MENU
          </div>
          
          <button 
            onClick={closeSidebar}
            className="p-1 text-cyan-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4 text-sm">
          {[
            "Dashboard", 
            "Live",
            //"Traffic Analysis", 
            //"Attack Reports", 
            //"Model Performance", 
            //"ML Features",
            "Export Logs", 
            //"Settings", 
            //"About System"
          ].map(item => (
            <button
              key={item}
              // UPDATE: Use handleNavigation instead of just closeSidebar
              onClick={() => handleNavigation(item)} 
              className="text-left px-4 py-2 rounded-lg text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition"
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}