import { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [notFound, setNotFound] = useState(false);

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
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    });
    return () => unsub();
  }, []);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.name || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            quantity: data.quantity?.toString() || '',
            category: data.category || '',
            image: data.image || '',
            rating: data.rating?.toString() || '4.5',
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  // Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ message: 'Please fix the errors below', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'products', id), {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        category: form.category,
        image: form.image.trim(),
        rating: Number(form.rating) || 0,
        updatedAt: serverTimestamp(),
      });

      setToast({ message: 'Product updated successfully!', type: 'success' });
      setTimeout(() => navigate('/products'), 1200);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update product', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', id));
      setToast({ message: 'Product deleted successfully!', type: 'success' });
      setTimeout(() => navigate('/products'), 1200);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete product', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="lg:ml-72">
          <Header setSidebarOpen={setSidebarOpen} title="Edit Product" />
          <main className="p-8 max-w-5xl">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-64"></div>
              <div className="h-96 bg-white rounded-3xl border border-gray-100"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="lg:ml-72">
          <Header setSidebarOpen={setSidebarOpen} title="Edit Product" />
          <main className="p-8 max-w-5xl">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
              <p className="text-gray-500 mt-2 text-sm">
                This product may have been deleted or doesn't exist.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Products
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-72">
        <Header setSidebarOpen={setSidebarOpen} title="Edit Product" />

        <main className="p-4 sm:p-8 max-w-5xl animate-fade-in">
          {/* Back */}
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Edit Product
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Update details or remove this product from LogixMart.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-2xl font-semibold text-sm hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Product
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left — main info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Basic Information</h3>
                      <p className="text-xs text-gray-500">Edit name, description, and image</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Product name"
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
                      rows={4}
                      placeholder="Product description..."
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

                    {/* Preview */}
                    {form.image && (
                      <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          <img
                            src={form.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Current Image</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Live preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Pricing & Inventory</h3>
                      <p className="text-xs text-gray-500">Update price, quantity, rating</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => updateField('quantity', e.target.value)}
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

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Rating
                      </label>
                      <input
                        type="number"
                        value={form.rating}
                        onChange={(e) => updateField('rating', e.target.value)}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — category + actions */}
              <div className="lg:col-span-1 space-y-6">
                {/* Category */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Category *</h3>
                      <p className="text-xs text-gray-500">Change category</p>
                    </div>
                  </div>

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

                  {errors.category && (
                    <p className="text-xs text-red-500 mt-3 font-medium ml-1">{errors.category}</p>
                  )}
                </div>

                {/* Save */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h3 className="font-bold text-gray-900 mb-2">Save changes?</h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Your updates will be reflected instantly across the app.
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
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-modal-bg">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-modal-card">
            <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Delete Product?
            </h3>
            <p className="text-gray-500 text-sm text-center mt-2">
              "{form.name}" will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-red-500 text-white rounded-2xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-toast-in">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success' ? 'bg-white border-emerald-200' : 'bg-white border-red-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
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

        @keyframes modal-bg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-modal-bg { animation: modal-bg 0.2s ease-out; }

        @keyframes modal-card {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-card { animation: modal-card 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-toast-in { animation: toast-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}