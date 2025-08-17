import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@shared/contexts/AuthContext';
import { CreditsProvider } from '@shared/contexts/CreditsContext';
import { ThemeProvider } from '@shared/contexts/ThemeContext';
import { ProtectedRoute } from '@features/auth/ProtectedRoute';
import ResponsiveLayout from '@shared/components/layout/responsive/ResponsiveLayout';
import AppViewport from '@shared/components/layout/AppViewport';
import GuideScreen from '@features/guide/views/GuideScreen';
import InterviewsScreen from '@features/interview/views/InterviewsScreen';
import ExperienceScreen from '@features/experience/views/ExperienceScreen';

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