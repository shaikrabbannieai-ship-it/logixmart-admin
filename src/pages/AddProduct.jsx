import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AddProduct() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    image: '',
    rating: '4.5',
  });

  // Fetch categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });
    return () => unsub();
  }, []);

  // Update field
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validate
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Enter a valid price';
    if (form.quantity === '' || Number(form.quantity) < 0)
      newErrors.quantity = 'Enter a valid quantity';
    if (!form.category) newErrors.category = 'Select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ message: 'Please fix the errors below', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'products'), {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        category: form.category,
        image: form.image.trim(),
        rating: Number(form.rating) || 0,
        createdAt: serverTimestamp(),
      });

      setToast({ message: 'Product added successfully!', type: 'success' });
      setTimeout(() => navigate('/products'), 1200);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to add product', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-72">
        <Header setSidebarOpen={setSidebarOpen} title="Add Product" />

        <main className="p-4 sm:p-8 max-w-5xl animate-fade-in">
          {/* Back button */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Add New Product
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Fill in the details below to add a new product to LogixMart.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side — Main info (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Basic Information</h3>
                      <p className="text-xs text-gray-500">Product name, description, and image</p>
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g. Red Floral Dress"
                      className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 outline-none transition-all text-sm ${
                        errors.name
                          ? 'border-red-300 focus:border-red-500 focus:bg-white'
                          : 'border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1.5 font-medium ml-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Write a short description about this product..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => updateField('image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1.5 ml-1">
                      💡 Tip: Use <code className="px-1.5 py-0.5 bg-gray-100 rounded text-pink-600 font-mono">https://picsum.photos/seed/yourword/400/500</code> for testing
                    </p>

                    {/* Image Preview */}
                    {form.image && (
                      <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl animate-fade-in">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          <img
                            src={form.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Image Preview</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Live preview of your product image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Inventory Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Pricing & Inventory</h3>
                      <p className="text-xs text-gray-500">Price, quantity, and rating</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Price (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => updateField('price', e.target.value)}
                          placeholder="0"
                          min="0"
                          className={`w-full pl-9 pr-4 py-3 rounded-2xl bg-gray-50 border-2 outline-none transition-all text-sm ${
                            errors.price
                              ? 'border-red-300 focus:border-red-500 focus:bg-white'
                              : 'border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100'
                          }`}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium ml-1">{errors.price}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => updateField('quantity', e.target.value)}
                        placeholder="0"
                        min="0"
                        className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 outline-none transition-all text-sm ${
                          errors.quantity
                            ? 'border-red-300 focus:border-red-500 focus:bg-white'
                            : 'border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100'
                        }`}
                      />
                      {errors.quantity && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium ml-1">{errors.quantity}</p>
                      )}
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Rating
                      </label>
                      <input
                        type="number"
                        value={form.rating}
                        onChange={(e) => updateField('rating', e.target.value)}
                        placeholder="4.5"
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side — Category + Submit (1/3) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Category Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 sticky top-24">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Category *</h3>
                      <p className="text-xs text-gray-500">Select a category</p>
                    </div>
                  </div>

                  {categories.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 mb-3">No categories yet</p>
                      <Link
                        to="/categories"
                        className="text-xs font-semibold text-pink-600 hover:underline"
                      >
                        Create one first →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => updateField('category', cat.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center justify-between group ${
                            form.category === cat.id
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-[1.01]'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {form.category === cat.id ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-pink-400 transition-colors"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {errors.category && (
                    <p className="text-xs text-red-500 mt-3 font-medium ml-1">{errors.category}</p>
                  )}
                </div>

                {/* Submit Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h3 className="font-bold text-gray-900 mb-2">Ready to publish?</h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Review your product and click below to add it to LogixMart.
                  </p>

                  <button
                    type="submit"
                    disabled={saving}
                    className="relative w-full overflow-hidden bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-sm shadow-[0_10px_30px_rgba(233,30,99,0.3)] hover:shadow-[0_15px_40px_rgba(233,30,99,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                      </span>
                    )}
                  </button>

                  <Link
                    to="/products"
                    className="block text-center text-xs font-semibold text-gray-500 hover:text-pink-600 transition-colors mt-4"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>

          <div className="h-8"></div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-toast-in">
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-white border-emerald-200' : 'bg-white border-red-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{toast.message}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; opacity: 0; }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-toast-in { animation: toast-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}