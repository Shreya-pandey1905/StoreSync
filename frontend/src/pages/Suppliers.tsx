import React, { useEffect, useMemo, useState } from 'react';
import { supplierService, type Supplier } from '../services/supplierService.ts';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    X,
    Search,
    Store,
    Mail,
    Phone,
    MapPin,
    User as UserIcon,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    MoreHorizontal
} from 'lucide-react';

type FormState = Omit<Supplier, '_id' | 'createdAt' | 'updatedAt'>;

const emptyForm: FormState = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
};

const Suppliers: React.FC = () => {
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
            setError(e?.message || 'Failed to synchronise source nodes');
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
                setSuccess('New supplier added successfully');
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
            setSuccess('Supplier removed successfully');
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to remove supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 mb-8 overflow-hidden relative group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Store className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Suppliers
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Manage your supplier relationships and contact information
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 w-full lg:w-72 transition-all font-medium text-sm placeholder-slate-400"
                                    placeholder="Search suppliers..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm font-semibold text-sm active:scale-95"
                            >
                                <Plus size={18} /> Add Supplier
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4 mb-10">
                    {error && (
                        <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-3xl flex items-center gap-4 font-bold uppercase tracking-widest text-xs animate-pulse">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center gap-4 font-bold uppercase tracking-widest text-xs">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            {success}
                        </div>
                    )}
                </div>

                {/* Grid of Suppliers (Premium Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading && suppliers.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center">
                            <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">Syncing Suppliers...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">No Suppliers Found</h3>
                            <p className="text-slate-400 text-xs font-medium mt-1">Try adjusting your search filters</p>
                        </div>
                    ) : (
                        filtered.map((s) => (
                            <div key={s._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight uppercase leading-none mb-1.5">{s.name}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Supplier</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            onClick={() => openEdit(s)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            onClick={() => setDeleteTarget(s)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Contact Person</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{s.contactPerson}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Phone</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{s.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Email</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight truncate">{s.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Address</p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight line-clamp-2">{s.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {editing ? 'Edit Supplier' : 'Add Supplier'}
                                </h2>
                                <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier Name *</label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                            placeholder="Enter supplier name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                                        <input
                                            name="contactPerson"
                                            value={form.contactPerson}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                            placeholder="Contact person's name"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                            <input
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                                placeholder="Phone number"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                                placeholder="Email address"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
                                        <textarea
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                                            placeholder="Physical address"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : editing ? 'Update Supplier' : 'Add Supplier'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Custom Confirmation Modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10 overflow-hidden">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                                    <Trash2 size={28} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Supplier?</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
                                    Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-white">{deleteTarget.name}</span>? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex p-4 gap-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => { if (deleteTarget) { await handleDelete(deleteTarget); setDeleteTarget(null); } }}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Delete Supplier'}
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
