import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentForm from './components/StudentForm';
import AdminDashboard from './components/AdminDashboard';
import CollectionForm from './components/CollectionForm';
import QuickLaundryForm from './components/QuickLaundryForm';
import ProfileForm from './components/ProfileForm';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-bold">🏠 Laundromat</h1>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/" 
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Drop-Off
                </Link>
                <Link 
                  to="/quick" 
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ⚡ Quick
                </Link>
                <Link 
                  to="/profile" 
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  👤 Profile
                </Link>
                <Link 
                  to="/collection" 
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Collection
                </Link>
                <Link 
                  to="/admin" 
                  className="px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Admin
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-blue-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 transition-colors"
                >
                  🏠 Drop-Off
                </Link>
                <Link 
                  to="/quick" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 transition-colors"
                >
                  ⚡ Quick Submit
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 transition-colors"
                >
                  👤 Profile
                </Link>
                <Link 
                  to="/collection" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 transition-colors"
                >
                  📦 Collection
                </Link>
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium hover:bg-blue-800 transition-colors"
                >
                  🔧 Admin Dashboard
                </Link>
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<StudentForm />} />
            <Route path="/quick" element={<QuickLaundryForm />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/collection" element={<CollectionForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

