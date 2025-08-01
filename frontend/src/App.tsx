import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import GuidePage from './components/pages/GuidePage';
import InterviewsPage from './components/pages/InterviewsPage';
import ExperiencePage from './components/pages/ExperiencePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CreditsProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<GuidePage />} />
                  <Route path="/guide" element={<GuidePage />} />
                  <Route path="/guide/:step" element={<GuidePage />} />
                  <Route path="/guide/:step/:id" element={<GuidePage />} />
                  <Route path="/interviews" element={<InterviewsPage />} />
                  <Route path="/experience" element={<ExperiencePage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          </div>
        </CreditsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;