import React, { useEffect, useMemo, useState } from 'react';
import { supplierService, type Supplier } from '../services/supplierService.ts';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Search,
    Store,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
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
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

    const resetFeedback = () => { setError(''); setSuccess(''); };

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

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (error || success) {
            const t = setTimeout(() => { setError(''); setSuccess(''); }, 4000);
            return () => clearTimeout(t);
        }
    }, [error, success]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = suppliers;
        if (q) {
            list = list.filter(s => [s.name, s.contactPerson, s.phone, s.email || '', s.address].some(v => (v || '').toLowerCase().includes(q)));
        }
        return [...list].sort((a, b) => {
            const an = (a.name || '').toLowerCase();
            const bn = (b.name || '').toLowerCase();
            if (an < bn) return sortAsc ? -1 : 1;
            if (an > bn) return sortAsc ? 1 : -1;
            return 0;
        });
    }, [suppliers, query, sortAsc]);

    const openCreate = () => { resetFeedback(); setEditing(null); setForm(emptyForm); setModalOpen(true); };
    const openEdit = (s: Supplier) => { resetFeedback(); setEditing(s); setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email || '', address: s.address }); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

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
                setError('Please fill in all required fields.');
                setLoading(false);
                return;
            }
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                setError('Invalid email format.');
                setLoading(false);
                return;
            }
            if (editing?._id) {
                await supplierService.update(editing._id, form);
                setSuccess('Supplier updated successfully');
            } else {
                await supplierService.create(form as Supplier);
                setSuccess('Supplier added successfully');
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
            setSuccess('Supplier removed');
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to remove supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm">
                <div className="page-container py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Suppliers</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Manage supplier relationships and contact information</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={load} disabled={loading}
                                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold text-sm shadow-sm active:scale-95">
                                <Plus size={16} /> Add Supplier
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container space-y-4 sm:space-y-6">

                {/* Feedback */}
                {error && (
                    <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                )}
                {success && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
                    </div>
                )}

                {/* Search bar */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all placeholder-slate-400"
                                placeholder="Search suppliers..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
                            {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                    {loading && suppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading suppliers...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <Store className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {query ? 'No suppliers match your search' : 'No suppliers added yet'}
                            </p>
                            {!query && (
                                <button onClick={openCreate} className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                    Add your first supplier
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                        <th className="px-5 py-3 text-left">
                                            <button
                                                onClick={() => setSortAsc(p => !p)}
                                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-blue-600 transition-colors"
                                            >
                                                Supplier {sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Person</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Address</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {filtered.map((s) => (
                                        <tr key={s._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-lg flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm flex-shrink-0">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{s.contactPerson}</td>
                                            <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{s.phone}</td>
                                            <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{s.email || '—'}</td>
                                            <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{s.address}</td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(s)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(s)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                {editing ? 'Edit Supplier' : 'Add Supplier'}
                            </h2>
                            <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier Name *</label>
                                <input name="name" value={form.name} onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="Enter supplier name" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                                <input name="contactPerson" value={form.contactPerson} onChange={handleChange}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="Contact person's name" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                    <input name="phone" value={form.phone} onChange={handleChange}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Phone number" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input name="email" type="email" value={form.email} onChange={handleChange}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Email address" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                                    placeholder="Physical address" required />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={closeModal}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50">
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                    {editing ? 'Update' : 'Add Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 bg-black/50 backdrop-blur-sm pt-8 pb-8">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                <Trash2 size={22} />
                            </div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">Delete Supplier?</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Remove <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget.name}</span>? This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-slate-700">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={async () => { if (deleteTarget) { await handleDelete(deleteTarget); setDeleteTarget(null); } }}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                disabled={loading}>
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
