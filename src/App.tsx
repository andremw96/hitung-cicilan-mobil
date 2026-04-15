import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Calculator from "./pages/Calculator";
import SavedList from "./pages/SavedList";
import Compare from "./pages/Compare";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-maybank-dark to-maybank-blue text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-maybank-yellow flex items-center justify-center">
                <svg className="w-6 h-6 text-maybank-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Simulasi Kredit Mobil</h1>
                <p className="text-sm text-slate-300">Kalkulator cicilan &amp; down payment</p>
              </div>
            </div>
            <nav className="flex gap-1 bg-white/10 rounded-lg p-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                  }`
                }
              >
                Kalkulator
              </NavLink>
              <NavLink
                to="/saved"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                  }`
                }
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Tersimpan
              </NavLink>
              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
                  }`
                }
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Bandingkan
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-400">
          Simulasi ini hanya sebagai referensi. Nilai aktual dapat berbeda tergantung kebijakan leasing.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const basename =
    import.meta.env.BASE_URL.replace(/\/$/, '') === ''
      ? undefined
      : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <Layout>
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/saved" element={<SavedList />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
