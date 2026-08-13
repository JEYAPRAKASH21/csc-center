import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceItem, ServiceCategory } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Grid
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!showAddModalDirectly);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ServiceCategory>('xerox');
  const [price, setPrice] = useState<number>(10);
  const [unit, setUnit] = useState<string>('per page');
  const [code, setCode] = useState<string>('');
  const [stock, setStock] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (showAddModalDirectly) {
      openAddModal();
    }
  }, [showAddModalDirectly]);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('xerox');
    setPrice(10);
    setUnit('per page');
    setCode('');
    setStock(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ServiceItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setUnit(item.unit);
    setCode(item.code || '');
    setStock(item.stock);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    if (editingItem) {
      updateService(editingItem.id, {
        name: name.trim(),
        category,
        price,
        unit,
        code: code.trim().toUpperCase() || undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
      });
    } else {
      addService({
        name: name.trim(),
        category,
        price,
        unit,
        code: code.trim().toUpperCase() || `SRV-${Math.floor(100 + Math.random() * 900)}`,
        stock: stock !== undefined ? Number(stock) : undefined,
        popular: true,
      });
    }

    closeModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from service catalog?`)) {
      deleteService(id);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCat = selectedCategory === 'all' || srv.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        srv.name.toLowerCase().includes(q) ||
        (srv.code && srv.code.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="space-y-5 h-full overflow-y-auto pr-1">
      {/* Top Action Bar & Filter */}
      <div className="bg-[#121827] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-amber-400" /> Service Management (CRUD)
            </h2>
            <p className="text-xs text-slate-400">
              Add, edit, or remove services in your center's catalog ({services.length} items total)
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Service Item</span>
          </button>
        </div>

        {/* Search and Category Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search service by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 text-slate-100 text-xs rounded-xl pl-10 pr-3 py-2.5 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['all', 'xerox', 'photos', 'esevai', 'stationery', 'lamination'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#0b0f19] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Table Container */}
      <div className="bg-[#121827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[380px]">
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <Search className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-400">No service items match your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121827] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d1322]">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Service Item' : 'Add New Service Item'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Service Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Xerox Single Side, Aadhaar Card Print"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 text-white text-xs rounded-xl p-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
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
                    className="w-full bg-[#0b0f19] border border-slate-800 focus:border-amber-500 font-mono text-white text-xs rounded-xl p-3 outline-none"
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
                    className="w-full bg-[#0b0f19] border border-slate-800 text-white text-xs rounded-xl p-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="XRX-SS, ESV-PAN"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-800 uppercase font-mono text-white text-xs rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20"
                >
                  {editingItem ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
