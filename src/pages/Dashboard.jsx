import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Live products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setStats((prev) => ({ ...prev, products: snap.size }));
      const recent = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .slice(0, 5);
      setRecentProducts(recent);
      setLoading(false);
    });

    // Live categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setStats((prev) => ({ ...prev, categories: snap.size }));
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const statCards = [
    {
      label: 'Total Products',
      value: stats.products,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradient: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/30',
    },
    {
      label: 'Categories',
      value: stats.categories,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      gradient: 'from-purple-500 to-indigo-500',
      shadow: 'shadow-purple-500/30',
    },
    {
      label: 'Orders',
      value: stats.orders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30',
    },
    {
      label: 'Users',
      value: stats.users,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-72">
        <Header setSidebarOpen={setSidebarOpen} title="Dashboard" />

        <main className="p-4 sm:p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 p-8 sm:p-10 shadow-2xl shadow-pink-500/30 animate-fade-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome to LogixMart Admin 🎉
              </h2>
              <p className="text-white/80 mt-2 text-sm sm:text-base max-w-2xl">
                Manage your products, categories, and orders from one beautiful dashboard.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <a
                  href="/products/add"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-pink-600 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Product
                </a>
                <a
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-semibold text-sm hover:bg-white/20 transition-all duration-300"
                >
                  View Products
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statCards.map((stat, index) => (
              <div
                key={stat.label}
                className="group bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <svg
                    className="w-5 h-5 text-emerald-500 opacity-70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-gray-200 rounded-lg animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  Recent Products
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Latest products added to your store
                </p>
              </div>
              <a
                href="/products"
                className="text-sm font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 group"
              >
                View All
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : recentProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No products yet</p>
                <a
                  href="/products/add"
                  className="inline-flex items-center gap-2 mt-4 text-pink-600 font-semibold text-sm hover:underline"
                >
                  Add your first product
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-6 sm:px-8 py-4 flex items-center gap-4 hover:bg-gray-50/70 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {product.category || 'Uncategorized'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">
                        ₹{product.price || 0}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">
                        {product.quantity || 0} in stock
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-8"></div>
        </main>
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}