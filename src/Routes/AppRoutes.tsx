import { Routes, Route } from "react-router-dom";

import AppLayout from "../Layouts/AppLayout/AppLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import EpisodeGrid from "../pages/EpisodeGrid/EpisodeGrid";
import Player from "../pages/Player/Player";
import Series from "../pages/Series/Series";
import AuditLog from "../pages/AuditLog/AuditLog";
import Login from "../pages/Login/Login";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/series" element={<Series />} />
        <Route path="/show/:showId" element={<EpisodeGrid />} />
        <Route path="/player/:showId/:seasonId/:episodeId" element={<Player />} />
        <Route path="/auditlog" element={<ProtectedRoute requireAdmin><AuditLog /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
