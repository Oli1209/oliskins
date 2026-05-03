import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Start } from "./pages/Start";
import { Skrzynki } from "./pages/Skrzynki";
import { Ekwipunek } from "./pages/Ekwipunek";
import { Clicker } from "./pages/Clicker";
import { DarmoweSkrzynki } from "./pages/DarmoweSkrzynki";
import { Minigierki } from "./pages/Minigierki";
import { Coinflip } from "./pages/Coinflip";
import { X20 } from "./pages/X20";
import { Dice } from "./pages/Dice";
import { Mines } from "./pages/Mines";
import { Crash } from "./pages/Crash";
import { Bitwy } from "./pages/Bitwy";
import { BattleRoom } from "./pages/BattleRoom";
import { EdytorSkrzynek } from "./pages/EdytorSkrzynek";
import { CaseDetailsRoute } from "./components/CaseDetailsModal";
import { FreeCaseRoute } from "./components/FreeCaseModal";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <h1 className="text-6xl font-black text-zinc-100 mb-4">404</h1>
      <p className="text-zinc-400 mb-8 text-xl">Nie znaleziono takiej strony w mrocznym świecie neonów.</p>
      <a href="/" className="neon-button">Wróć na start</a>
    </div>
  );
}

function App() {
  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster position="bottom-right" richColors />
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/skrzynki" element={<Skrzynki />}>
              <Route path=":caseId" element={<CaseDetailsRoute />} />
            </Route>
            <Route path="/darmowe-skrzynki" element={<DarmoweSkrzynki />}>
              <Route path=":caseId" element={<FreeCaseRoute />} />
            </Route>
            <Route path="/ekwipunek" element={<Ekwipunek />} />
            <Route path="/clicker" element={<Clicker />} />
            <Route path="/minigierki" element={<Minigierki />}>
              <Route path="coinflip" element={<Coinflip />} />
              <Route path="x20" element={<X20 />} />
              <Route path="dice" element={<Dice />} />
              <Route path="mines" element={<Mines />} />
              <Route path="crash" element={<Crash />} />
            </Route>
            <Route path="/bitwy" element={<Bitwy />} />
            <Route path="/bitwy/:id" element={<BattleRoom />} />
            <Route path="/edytor-skrzynek" element={<EdytorSkrzynek />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
