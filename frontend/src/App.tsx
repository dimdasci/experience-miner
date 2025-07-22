import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserMenu } from './components/auth/UserMenu';
import InterviewView from './components/interview/InterviewView';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <ProtectedRoute>
          <div className="border-b bg-background">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
              <h1 className="text-lg font-semibold">Experience Miner</h1>
              <UserMenu />
            </div>
          </div>
          <div className="bg-gray-50 min-h-[calc(100vh-60px)]">
            <InterviewView />
          </div>
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;