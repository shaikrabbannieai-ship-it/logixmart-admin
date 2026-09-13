import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ═══ Loading State ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="inline-block relative mb-6">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_10px_40px_rgba(233,30,99,0.4)] animate-float">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>

          {/* Brand */}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            LogixMart
          </h1>
          <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-1">
            Admin Panel
          </p>

          {/* Spinner */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.15s' }}
            ></div>
            <div
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.3s' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-4 font-medium">
            Verifying access...
          </p>
        </div>

        {/* Animations */}
        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 50px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .animate-float { animation: float 3s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  // ═══ Not Authenticated ═══
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ═══ Authenticated ═══
  return children;
}