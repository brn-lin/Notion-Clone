import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./web-pages/Login";
import SignUp from "./web-pages/SignUp";
import ProtectedRoute from "./routes/ProtectedRoute";

import AppLayout from "./app-components/app-layout/AppLayout";
import CenterEditor from "./app-components/center-editor/CenterEditor";
import TrashBin from "./app-components/trash/Trash";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<Login />} />

        {/* Sign Up page */}
        <Route path="/signup" element={<SignUp />} />

        {/* App (shared layout) */}
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default editor page */}
          <Route index element={<CenterEditor />} />

          {/* Trash page */}
          <Route path="trash" element={<TrashBin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
