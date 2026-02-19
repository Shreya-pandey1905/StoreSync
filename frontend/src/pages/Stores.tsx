import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, RefreshCw } from "lucide-react";
import storeService from "../services/storeService.ts";

const Stores: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", location: "" });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await storeService.getStores();
      setStores(res.data || []);
    } catch {
      setError("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingStore) {
        await storeService.updateStore(editingStore._id, form);
        setSuccess("Store updated successfully");
      } else {
        await storeService.createStore(form);
        setSuccess("Store added successfully");
      }
      setShowModal(false);
      setForm({ name: "", location: "" });
      setEditingStore(null);
      fetchStores();
    } catch {
      setError("Failed to save store");
    }
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    try {
      await storeService.deleteStore(storeToDelete._id);
      setSuccess("Store deleted successfully");
      setShowDeleteModal(false);
      setStoreToDelete(null);
      fetchStores();
    } catch {
      setError("Failed to delete store");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              Store Network
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and monitor all your physical store locations</p>
          </div>
          <button
            onClick={() => {
              setEditingStore(null);
              setForm({ name: "", location: "" });
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Add New Store
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 font-medium">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 font-medium">
            <Plus className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Card Component for Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                    Store Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                    Location Address
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium lowercase">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        Fetching store data...
                      </div>
                    </td>
                  </tr>
                ) : stores.length > 0 ? (
                  stores.map((store) => (
                    <tr
                      key={store._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
                            {store.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {store.location}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingStore(store);
                            setForm({ name: store.name, location: store.location });
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                          title="Edit Store"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStoreToDelete(store);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete Store"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <Plus className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-bold text-lg">No stores available</p>
                        <p className="text-sm font-medium">Add your first store location to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {editingStore ? "Edit Location" : "New Location"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Flagship"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">Location Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, New York"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="order-2 sm:order-1 flex-1 px-6 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="order-1 sm:order-2 flex-1 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
              >
                {editingStore ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md z-[60]">
          <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Confirm Deletion</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">"{storeToDelete?.name}"</span>? This will permanently delete the store record.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-200 dark:shadow-none"
              >
                Yes, Delete Store
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStoreToDelete(null);
                }}
                className="w-full px-6 py-3 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              >
                No, Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
