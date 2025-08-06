import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditsProvider } from './contexts/CreditsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import ResponsiveLayout from './components/layout/responsive/ResponsiveLayout';
import AppViewport from './components/layout/AppViewport';
import GuideScreen from './components/screens/GuideScreen';
import InterviewsScreen from './components/screens/InterviewsScreen';
import ExperienceScreen from './components/screens/ExperienceScreen';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CreditsProvider>
            <AppViewport>
              <ProtectedRoute>
                <ResponsiveLayout>
                  <Routes>
                    <Route path="/" element={<GuideScreen />} />
                    <Route path="/guide" element={<GuideScreen />} />
                    <Route path="/guide/:step" element={<GuideScreen />} />
                    <Route path="/guide/:step/:id" element={<GuideScreen />} />
                    <Route path="/interviews/:id/review" element={<InterviewsScreen />} />
                    <Route path="/interviews" element={<InterviewsScreen />} />
                    <Route path="/experience" element={<ExperienceScreen />} />
                  </Routes>
                </ResponsiveLayout>
              </ProtectedRoute>
            </AppViewport>
          </CreditsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;