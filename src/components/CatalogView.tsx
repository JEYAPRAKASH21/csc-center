import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceItem, ServiceCategory } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Grid, 
  Tag, 
  Check, 
  X, 
  Sparkles,
  Layers,
  DollarSign,
  Edit
} from 'lucide-react';

interface CatalogViewProps {
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  showAddModalDirectly,
  onCloseAddModalDirectly,
}) => {
  const { services, addService, updateService, deleteService } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  // Form Field States
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ServiceCategory>('xerox');
  const [price, setPrice] = useState<number>(10);
  const [unit, setUnit] = useState<string>('per page');
  const [code, setCode] = useState<string>('');

  // Directly trigger add modal if requested from props
  useEffect(() => {
    if (showAddModalDirectly) {
      openAddModal();
    }
  }, [showAddModalDirectly]);

  const categories: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Services' },
    { id: 'xerox', label: 'Xerox & Copy' },
    { id: 'photos', label: 'Photos' },
    { id: 'esevai', label: 'E-Sevai Govt' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'lamination', label: 'Lamination' },
    { id: 'other', label: 'Other' },
  ];

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCat = selectedCategory === 'all' || srv.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        srv.name.toLowerCase().includes(q) || 
        srv.category.toLowerCase().includes(q) ||
        (srv.code && srv.code.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('xerox');
    setPrice(10);
    setUnit('per page');
    setCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ServiceItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setUnit(item.unit);
    setCode(item.code || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    if (onCloseAddModalDirectly) {
      onCloseAddModalDirectly();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    if (editingItem) {
      updateService(editingItem.id, {
        name: name.trim(),
        category,
        price,
        unit: unit.trim() || 'per unit',
        code: code.trim().toUpperCase() || undefined,
      });
    } else {
      addService({
        name: name.trim(),
        category,
        price,
        unit: unit.trim() || 'per unit',
        code: code.trim().toUpperCase() || `SRV-${Math.floor(100 + Math.random() * 900)}`,
        popular: true,
      });
    }

    closeModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from service catalog?`)) {
      deleteService(id);
    }
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-0.5">
      {/* HEADER BAR WITH ADD SERVICE BUTTON */}
      <div className="bg-[#121827] border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-400" /> Service Management Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add, update, or remove price rates for all E-Sevai, Xerox & Stationery items ({services.length} items total)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New Service Item</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#121827] border border-slate-800 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search service by name, category, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500/50 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none font-medium placeholder:text-slate-500"
          />
        </div>

        {/* Category Pills - Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-[#1b2336] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICES LIST: MOBILE CARDS (< md) vs DESKTOP TABLE (>= md) */}
      <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[350px]">
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center py-12 text-slate-500 p-4">
            <Search className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-400">No services found matching "{searchQuery}"</p>
            <button
              onClick={openAddModal}
              className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow"
            >
              + Create Service Now
            </button>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARDS VIEW (< md) */}
            <div className="md:hidden p-3 space-y-3">
              {filteredServices.map((srv) => (
                <div key={srv.id} className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-xl space-y-2 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="bg-[#151c2e] text-slate-400 border border-slate-700/80 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                        {srv.code || srv.category}
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1 leading-snug">{srv.name}</h4>
                    </div>

                    <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold font-mono text-xs px-2.5 py-1 rounded-lg shrink-0">
                      ₹{srv.price}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">{srv.unit}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(srv)}
                        className="px-2.5 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(srv.id, srv.name)}
                        className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0b0f19] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="p-4">SERVICE ITEM</th>
                    <th className="p-4">CODE</th>
                    <th className="p-4">CATEGORY</th>
                    <th className="p-4">PRICE</th>
                    <th className="p-4">UNIT</th>
                    <th className="p-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredServices.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-sans font-semibold text-slate-200">
                        <p className="font-bold text-white text-xs">{srv.name}</p>
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-mono">{srv.code || 'N/A'}</td>
                      <td className="p-4 capitalize font-sans">
                        <span className="bg-[#151c2e] text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {srv.category}
                        </span>
                      </td>
                      <td className="p-4 text-amber-400 font-bold text-sm">₹{srv.price}</td>
                      <td className="p-4 text-slate-400 font-sans">{srv.unit}</td>
                      <td className="p-4 text-right space-x-2 font-sans">
                        <button
                          onClick={() => openEditModal(srv)}
                          className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id, srv.name)}
                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-[#0d1322]">
              <h3 className="font-bold text-white text-sm sm:text-base">
                {editingItem ? 'Edit Service Item' : 'Add New Service Item'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Service Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Size Photos (32 Pcs)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-white text-xs rounded-xl p-2.5 sm:p-3 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-2.5 sm:p-3 outline-none capitalize font-semibold"
                  >
                    <option value="xerox">Xerox & Copy</option>
                    <option value="photos">Photos</option>
                    <option value="esevai">E-Sevai Govt</option>
                    <option value="stationery">Stationery</option>
                    <option value="lamination">Lamination</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 font-mono text-white text-xs rounded-xl p-2.5 sm:p-3 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unit Description</label>
                  <input
                    type="text"
                    placeholder="per page, per app, per sheet"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-2.5 sm:p-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="XRX-SS, ESV-PAN"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 uppercase font-mono text-white text-xs rounded-xl p-2.5 sm:p-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20"
                >
                  {editingItem ? 'Update Service' : 'Save & Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
