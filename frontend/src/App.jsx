import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Answer from './pages/Answer';
import Result from './pages/Result';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History, { SessionDetail } from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/answer" element={<Answer />} />
        <Route path="/result" element={<Result />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<SessionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
