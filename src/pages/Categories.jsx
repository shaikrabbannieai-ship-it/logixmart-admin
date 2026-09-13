import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const emptyForm = {
  name: '',
  image: '',
  order: '',
};

export default function Categories() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch products count
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Product count per category
  const getProductCount = (catId) => {
    return products.filter((p) => p.category === catId).length;
  };

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Open modal for add
  const handleAddNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      image: cat.image || '',
      order: cat.order?.toString() || '',
    });
    setErrors({});
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

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
    if (!form.name.trim()) newErrors.name = 'Category name is required';
    if (!form.order || Number(form.order) <= 0)
      newErrors.order = 'Enter a valid order number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        image: form.image.trim(),
        order: Number(form.order),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), payload);
        showToast('Category updated successfully!', 'success');
      } else {
        await addDoc(collection(db, 'categories'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showToast('Category added successfully!', 'success');
      }

      closeModal();
    } catch (err) {
      console.error(err);
      showToast(
        editingId ? 'Failed to update category' : 'Failed to add category',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'categories', deleteId));
      showToast('Category deleted successfully!', 'success');
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="lg:ml-72">
        <Header setSidebarOpen={setSidebarOpen} title="Categories" />

        <main className="p-4 sm:p-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Manage Categories
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'} • Organize your store
              </p>
            </div>

            <button
              onClick={handleAddNew}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">No categories yet</h3>
              <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
                Create your first category to organize products in LogixMart.
              </p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create First Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-pink-400/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Order Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-gray-700 shadow-sm">
                        #{cat.order || '-'}
                      </span>
                    </div>

                    {/* Product Count */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-sm">
                        {getProductCount(cat.id)} {getProductCount(cat.id) === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base tracking-tight truncate">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Display order: <span className="font-semibold text-gray-700">{cat.order || '-'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-8"></div>
        </main>
      </div>

      {/* ═══ Add / Edit Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-modal-bg">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-modal-card max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingId ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingId ? 'Update category details' : 'Create a new category'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Dresses"
                  autoFocus
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

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => updateField('image', e.target.value)}
                  placeholder="https://picsum.photos/seed/name/300/300"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                />

                {form.image && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Preview</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Live image preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Display Order *
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => updateField('order', e.target.value)}
                  placeholder="1, 2, 3..."
                  min="1"
                  className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 outline-none transition-all text-sm ${
                    errors.order
                      ? 'border-red-300 focus:border-red-500 focus:bg-white'
                      : 'border-gray-200 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100'
                  }`}
                />
                {errors.order && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium ml-1">{errors.order}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5 ml-1">
                  Smaller number shows first in the app
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="relative flex-1 overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : editingId ? (
                    'Update Category'
                  ) : (
                    'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-modal-bg">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-modal-card">
            <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Delete Category?
            </h3>
            <p className="text-gray-500 text-sm text-center mt-2">
              This action cannot be undone. Products in this category will remain but appear as uncategorized.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setDeleteId(null)}
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
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast ═══ */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-toast-in">
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toast.type === 'success'
                ? 'bg-white border-emerald-200'
                : 'bg-white border-red-200'
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
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

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