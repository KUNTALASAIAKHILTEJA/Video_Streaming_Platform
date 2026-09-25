import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes/AppRoutes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ShowProvider } from "./contexts/ShowContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShowProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ShowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;