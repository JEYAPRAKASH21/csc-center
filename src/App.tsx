import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { POSView } from './components/POSView';
import { CatalogView } from './components/CatalogView';
import { AnalyticsView } from './components/AnalyticsView';
import { OrderLedgerView } from './components/OrderLedgerView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { ShoppingCart, Grid, BarChart3, Receipt, Settings } from 'lucide-react';

const MainContent: React.FC<{ showAddModal: boolean; onCloseAddModal: () => void }> = ({
  showAddModal,
  onCloseAddModal,
}) => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 p-3 md:p-5 overflow-y-auto pb-16 md:pb-5 bg-[#0b0f19]">
      {activeTab === 'pos' && <POSView />}
      {activeTab === 'catalog' && (
        <CatalogView
          showAddModalDirectly={showAddModal}
          onCloseAddModalDirectly={onCloseAddModal}
        />
      )}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'ledger' && <OrderLedgerView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

export function AppInner() {
  const { currentUser, activeTab, setActiveTab } = useApp();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  if (!currentUser) {
    return <AuthModal />;
  }

  const handleOpenAddModal = () => {
    setActiveTab('catalog');
    setShowAddModal(true);
  };

  const mobileNavItems = [
    { id: 'pos', label: 'Billing', icon: ShoppingCart },
    { id: 'catalog', label: 'Services', icon: Grid },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ledger', label: 'History', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar
          onOpenAddModal={handleOpenAddModal}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <MainContent
          showAddModal={showAddModal}
          onCloseAddModal={() => setShowAddModal(false)}
        />
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1322]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
