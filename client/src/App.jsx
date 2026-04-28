import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./web-pages/Login";
import SignUp from "./web-pages/SignUp";
import ProtectedRoute from "./routes/ProtectedRoute";
import EditorLayout from "./app-components/editor-layout/EditorLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<Login />} />

        {/* Sign Up page */}
        <Route path="/signup" element={<SignUp />} />

        {/* Editor page */}
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <EditorLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
