import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, 
  ShoppingCart, 
  Grid, 
  BarChart3, 
  Receipt, 
  Settings,
  Store,
  X
} from 'lucide-react';

interface SidebarProps {
  onOpenAddModal: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddModal, isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, services } = useApp();

  const menuItems = [
    { 
      id: 'pos', 
      label: 'Billing Desk', 
      icon: ShoppingCart,
      badge: null 
    },
    { 
      id: 'catalog', 
      label: 'Service Management', 
      icon: Grid,
      badge: services.length.toString(),
      badgeColor: 'bg-csc-600/30 text-csc-300 border-csc-500/40' 
    },
    { 
      id: 'analytics', 
      label: 'Revenue Analytics', 
      icon: BarChart3,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    },
    { 
      id: 'ledger', 
      label: 'Payment History', 
      icon: Receipt,
      badge: null 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      badge: null 
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 space-y-4">
      <div className="space-y-4">
        {/* Header inside drawer */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
              <Store className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-sm text-white tracking-wide">
                CSC Billing App
              </h1>
              <p className="text-[10px] text-slate-400">Digital Express Portal</p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            onOpenAddModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Service Item</span>
        </button>

        {/* Navigation Buttons */}
        <nav className="space-y-1.5 pt-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#182136] text-amber-400 border border-amber-500/30 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer VLE Badge */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="bg-[#151c2e] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
          <p className="font-bold text-slate-200">CSC VLE Desk</p>
          <p className="text-[10px] text-slate-400 mt-0.5">ID: CSC-TN-984210</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex w-64 bg-[#0d1322] border-r border-slate-800/80 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-[#0d1322] border-r border-slate-800 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
