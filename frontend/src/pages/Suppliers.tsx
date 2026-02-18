import React, { useEffect, useMemo, useState } from 'react';
import { supplierService, type Supplier } from '../services/supplierService.ts';
import { Plus, Pencil, Trash2, Loader2, X, MoreVertical, Search, Store } from 'lucide-react';
import axiosInstance from '../api/axiosInstance.ts';
import { useDarkMode } from '../context/DarkModeContext.tsx';

type FormState = Omit<Supplier, '_id' | 'createdAt' | 'updatedAt'>;

const emptyForm: FormState = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
};

const Suppliers: React.FC = () => {
    const { darkMode } = useDarkMode();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [query, setQuery] = useState<string>('');
    const [sortAsc, setSortAsc] = useState<boolean>(true);
    const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

    const resetFeedback = () => {
        setError('');
        setSuccess('');
    };

    const load = async () => {
        try {
            setLoading(true);
            const data = await supplierService.list();
            setSuppliers(data);
        } catch (e: any) {
            setError(e?.message || 'Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = suppliers;
        if (q) {
            list = list.filter(s =>
                [s.name, s.contactPerson, s.phone, s.email || '', s.address]
                    .some(v => (v || '').toLowerCase().includes(q))
            );
        }
        const sorted = [...list].sort((a, b) => {
            const an = (a.name || '').toLowerCase();
            const bn = (b.name || '').toLowerCase();
            if (an < bn) return sortAsc ? -1 : 1;
            if (an > bn) return sortAsc ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [suppliers, query, sortAsc]);

    const openCreate = () => {
        resetFeedback();
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (s: Supplier) => {
        resetFeedback();
        setEditing(s);
        setForm({
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email || '',
            address: s.address,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        try {
            setLoading(true);
            if (!form.name.trim() || !form.contactPerson.trim() || !form.phone.trim() || !form.address.trim()) {
                setError('Please fill all required fields.');
                setLoading(false);
                return;
            }
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                setError('Please enter a valid email address.');
                setLoading(false);
                return;
            }
            if (editing?._id) {
                await supplierService.update(editing._id, form);
                setSuccess('Supplier updated');
            } else {
                await supplierService.create(form as Supplier);
                setSuccess('Supplier created');
            }
            await load();
            closeModal();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to save supplier');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (s: Supplier) => {
        resetFeedback();
        if (!s._id) return;
        try {
            setLoading(true);
            await supplierService.remove(s._id);
            setSuccess('Supplier deleted');
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to delete supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header - Sticky and Compact */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                                <Store className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage supplier relationships</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    className="w-48 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                    placeholder="Search suppliers..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 font-medium"
                            >
                                <Plus size={16} /> Add Supplier
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {error && (
                    <div className={`mb-3 text-sm rounded px-3 py-2 border ${darkMode ? 'text-red-300 bg-red-900/30 border-red-800' : 'text-red-700 bg-red-100 border-red-200'}`}>{error}</div>
                )}
                {success && (
                    <div className={`mb-3 text-sm rounded px-3 py-2 border ${darkMode ? 'text-green-300 bg-green-900/30 border-green-800' : 'text-green-700 bg-green-100 border-green-200'}`}>{success}</div>
                )}

                <div className={`overflow-hidden rounded border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                        <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                            <tr>
                                <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                                <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contact Person</th>
                                <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</th>
                                <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                                <th className={`px-4 py-2 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</th>
                                <th className={`px-4 py-2 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={darkMode ? 'divide-y divide-gray-800' : 'divide-y'}>
                            {loading && suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={`px-4 py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading...</span>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={`px-4 py-10 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {query ? 'No suppliers match your search' : 'No suppliers found'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s, idx) => (
                                    <tr key={s._id} className={`${darkMode ? (idx % 2 === 0 ? 'bg-gray-950 hover:bg-gray-900' : 'bg-gray-900 hover:bg-gray-800') : (idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100')}`}>
                                        <td className={`px-4 py-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{s.name}</td>
                                        <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.contactPerson}</td>
                                        <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.phone}</td>
                                        <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.email || '-'}</td>
                                        <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.address}</td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center space-x-2">
                                                {/* Edit button */}
                                                <button
                                                    className={`p-2 rounded transition ${darkMode
                                                        ? 'text-gray-200 hover:bg-gray-800'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                    onClick={() => openEdit(s)}
                                                    title="Edit"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    className={`p-2 rounded transition ${darkMode
                                                        ? 'text-red-400 hover:bg-gray-800'
                                                        : 'text-red-600 hover:bg-gray-100'
                                                        }`}
                                                    onClick={() => setDeleteTarget(s)}
                                                    title="Delete"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className={`w-full max-w-lg rounded shadow-lg ${darkMode ? 'bg-gray-950 border border-gray-800' : 'bg-white'}`}>
                            <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
                                <button onClick={closeModal} className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                                    <input name="name" value={form.name} onChange={handleChange} className={`mt-1 w-full border rounded px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300'}`} required />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contact Person</label>
                                    <input name="contactPerson" value={form.contactPerson} onChange={handleChange} className={`mt-1 w-full border rounded px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300'}`} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
                                        <input name="phone" value={form.phone} onChange={handleChange} className={`mt-1 w-full border rounded px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300'}`} required />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                                        <input name="email" type="email" value={form.email} onChange={handleChange} className={`mt-1 w-full border rounded px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300'}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                                    <textarea name="address" value={form.address} onChange={handleChange} className={`mt-1 w-full border rounded px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300'}`} required />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button type="button" onClick={closeModal} className={`px-4 py-2 rounded border ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
                                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                                        {editing ? 'Save Changes' : 'Create Supplier'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className={`w-full max-w-md rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-950 border border-gray-800' : 'bg-white'}`}>
                            <div className={`flex justify-between items-center p-6 mb-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <h2 className="text-2xl font-bold">Confirm Deletion</h2>
                                <button onClick={() => setDeleteTarget(null)} className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><X size={24} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    Are you sure you want to delete supplier "{deleteTarget.name}"? This action cannot be undone.
                                </p>
                            </div>
                            <div className={`flex items-center justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-gray-800 text-gray-300 hover:bg-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => { if (deleteTarget) { await handleDelete(deleteTarget); setDeleteTarget(null); } }}
                                    className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Suppliers;
