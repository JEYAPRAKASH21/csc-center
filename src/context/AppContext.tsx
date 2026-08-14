import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ServiceItem, Bill, ApplicationRecord, CustomerCredit, StoreSettings, CartItem, User } from '../types';
import { initialServices, initialSettings, initialApplications, initialKhata, initialBills } from '../data/initialData';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (userData: { email: string; password: string; vleName: string; centerName: string; cscId: string }) => Promise<string | null>;
  logout: () => void;

  services: ServiceItem[];
  bills: Bill[];
  applications: ApplicationRecord[];
  khata: CustomerCredit[];
  settings: StoreSettings;
  cart: CartItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncStatus: SyncStatus;

  // Cart operations
  addToCart: (service: ServiceItem, quantity?: number, ackNumber?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  updateCartPrice: (itemId: string, price: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  discount: number;
  discountType: 'flat' | 'percentage';
  setDiscount: (discount: number) => void;
  setDiscountType: (type: 'flat' | 'percentage') => void;
  cartTotal: number;

  // Checkout & Bill operations
  processCheckout: (customerName: string, customerPhone: string, paymentMethod: Bill['paymentMethod'], amountPaid?: number, notes?: string) => Bill;
  updateBill: (id: string, updatedFields: Partial<Bill>) => void;
  deleteBill: (billId: string) => void;
  clearAllBills: () => void;

  // Service operations
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  updateService: (id: string, service: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;

  // Application operations
  addApplication: (app: Omit<ApplicationRecord, 'id'>) => void;
  updateApplication: (id: string, app: Partial<ApplicationRecord>) => void;
  updateAppStatus: (id: string, status: ApplicationRecord['status'], remarks?: string) => void;
  deleteApplication: (id: string) => void;

  // Khata operations
  addKhataCustomer: (name: string, phone: string) => void;
  updateKhataCustomer: (id: string, name: string, phone: string) => void;
  deleteKhataCustomer: (id: string) => void;
  recordKhataPayment: (customerId: string, amount: number, note: string) => void;
  addKhataDebit: (customerId: string, amount: number, description: string) => void;

  // Settings & Sync
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllData: () => void;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SYNC_API_URL = '/api/sync';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = window.localStorage.getItem('csc_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Helper to read initial state from LocalStorage or Fallback
  const getInitialStorage = <T,>(key: string, fallback: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const userKey = currentUser ? `usr_${currentUser.id}` : 'default';

  const [services, setServices] = useState<ServiceItem[]>(() => getInitialStorage(`csc_services_${userKey}`, initialServices));
  const [bills, setBills] = useState<Bill[]>(() => getInitialStorage(`csc_bills_${userKey}`, initialBills));
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => getInitialStorage(`csc_apps_${userKey}`, initialApplications));
  const [khata, setKhata] = useState<CustomerCredit[]>(() => getInitialStorage(`csc_khata_${userKey}`, initialKhata));
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const stored = getInitialStorage(`csc_settings_${userKey}`, initialSettings);
    if (currentUser) {
      return {
        ...stored,
        centerName: currentUser.centerName || stored.centerName,
        vleName: currentUser.vleName || stored.vleName,
        cscId: currentUser.cscId || stored.cscId,
      };
    }
    return stored;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');

  // Tracking flags to prevent sync loops
  const lastUpdatedRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Sync to local storage
  const saveToLocalStorage = useCallback((
    uKey: string,
    newServices: ServiceItem[],
    newBills: Bill[],
    newApps: ApplicationRecord[],
    newKhata: CustomerCredit[],
    newSettings: StoreSettings
  ) => {
    try {
      window.localStorage.setItem(`csc_services_${uKey}`, JSON.stringify(newServices));
      window.localStorage.setItem(`csc_bills_${uKey}`, JSON.stringify(newBills));
      window.localStorage.setItem(`csc_apps_${uKey}`, JSON.stringify(newApps));
      window.localStorage.setItem(`csc_khata_${uKey}`, JSON.stringify(newKhata));
      window.localStorage.setItem(`csc_settings_${uKey}`, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to update localStorage', e);
    }
  }, []);

  // Push local data payload to server (/api/sync)
  const pushToCloud = useCallback(async (
    sServices: ServiceItem[],
    sBills: Bill[],
    sApps: ApplicationRecord[],
    sKhata: CustomerCredit[],
    sSettings: StoreSettings
  ) => {
    try {
      setSyncStatus('syncing');
      const payload = {
        userId: currentUser?.id || 'default',
        services: sServices,
        bills: sBills,
        applications: sApps,
        khata: sKhata,
        settings: sSettings
      };
      const res = await fetch(SYNC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lastUpdated) {
          lastUpdatedRef.current = data.lastUpdated;
        }
        setSyncStatus('synced');

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'CSC_STATE_UPDATED',
            userId: currentUser?.id || 'default',
            timestamp: data.lastUpdated
          });
        }
      } else {
        setSyncStatus('offline');
      }
    } catch (e) {
      setSyncStatus('offline');
    }
  }, [currentUser]);

  // Pull data from server (/api/sync?userId=...)
  const pullFromCloud = useCallback(async () => {
    try {
      const uId = currentUser?.id || 'default';
      const res = await fetch(`${SYNC_API_URL}?userId=${uId}`, { method: 'GET' });
      if (!res.ok) {
        setSyncStatus('offline');
        return;
      }
      const data = await res.json();

      // First run for user: server database is empty, seed with initial defaults
      if (data.empty) {
        await pushToCloud(services, bills, applications, khata, settings);
        return;
      }

      if (data.lastUpdated && data.lastUpdated > lastUpdatedRef.current) {
        isPullingRef.current = true;
        lastUpdatedRef.current = data.lastUpdated;

        const mergedServices = data.services || services;
        const mergedBills = data.bills || bills;
        const mergedApps = data.applications || applications;
        const mergedKhata = data.khata || khata;
        const mergedSettings = data.settings || settings;

        setServices(mergedServices);
        setBills(mergedBills);
        setApplications(mergedApps);
        setKhata(mergedKhata);
        setSettings(mergedSettings);

        saveToLocalStorage(`usr_${uId}`, mergedServices, mergedBills, mergedApps, mergedKhata, mergedSettings);

        setSyncStatus('synced');
        setTimeout(() => {
          isPullingRef.current = false;
        }, 100);
      }
    } catch (e) {
      setSyncStatus('offline');
    }
  }, [currentUser, services, bills, applications, khata, settings, pushToCloud, saveToLocalStorage]);

  // Auth: Login
  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return data.error || 'Login failed';
      }
      const loggedUser: User = data.user;
      setCurrentUser(loggedUser);
      window.localStorage.setItem('csc_active_user', JSON.stringify(loggedUser));
      lastUpdatedRef.current = 0; // Reset last updated to trigger fresh pull
      return null;
    } catch (e) {
      return 'Network error connecting to server';
    }
  };

  // Auth: Register
  const register = async (userData: { email: string; password: string; vleName: string; centerName: string; cscId: string }): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return data.error || 'Registration failed';
      }
      const newLoggedUser: User = data.user;
      setCurrentUser(newLoggedUser);
      window.localStorage.setItem('csc_active_user', JSON.stringify(newLoggedUser));

      // Update settings with newly registered credentials
      const updatedSettings: StoreSettings = {
        ...settings,
        centerName: newLoggedUser.centerName,
        vleName: newLoggedUser.vleName,
        cscId: newLoggedUser.cscId
      };
      setSettings(updatedSettings);
      lastUpdatedRef.current = 0;
      await pushToCloud(initialServices, [], [], [], updatedSettings);
      return null;
    } catch (e) {
      return 'Network error connecting to server';
    }
  };

  // Auth: Logout
  const logout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem('csc_active_user');
    setCart([]);
    lastUpdatedRef.current = 0;
  };

  // Initial Sync & Polling setup when currentUser changes
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('csc_center_user_channel');
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === 'CSC_STATE_UPDATED' && event.data?.userId === (currentUser?.id || 'default')) {
          pullFromCloud();
        }
      };
    }

    pullFromCloud();

    const interval = setInterval(() => {
      pullFromCloud();
    }, 2000);

    const handleFocus = () => pullFromCloud();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [currentUser, pullFromCloud]);

  // Helper wrapper for updating state & pushing to cloud
  const updateAndSync = useCallback((
    newServices: ServiceItem[],
    newBills: Bill[],
    newApps: ApplicationRecord[],
    newKhata: CustomerCredit[],
    newSettings: StoreSettings
  ) => {
    setServices(newServices);
    setBills(newBills);
    setApplications(newApps);
    setKhata(newKhata);
    setSettings(newSettings);

    const uKey = currentUser ? `usr_${currentUser.id}` : 'default';
    saveToLocalStorage(uKey, newServices, newBills, newApps, newKhata, newSettings);

    if (!isPullingRef.current) {
      pushToCloud(newServices, newBills, newApps, newKhata, newSettings);
    }
  }, [currentUser, saveToLocalStorage, pushToCloud]);

  // Cart operations
  const addToCart = (service: ServiceItem, quantity = 1, ackNumber?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.serviceId === service.id && item.ackNumber === ackNumber);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * updated[existingIndex].unitPrice,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        serviceId: service.id,
        name: service.name,
        category: service.category,
        unitPrice: service.price,
        quantity,
        totalPrice: service.price * quantity,
        ackNumber,
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      )
    );
  };

  const updateCartPrice = (itemId: string, unitPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const calculatedDiscount = discountType === 'percentage'
    ? Math.round((cartSubtotal * discount) / 100)
    : discount;

  const cartTotal = Math.max(0, cartSubtotal - calculatedDiscount);

  // Process Bill Checkout
  const processCheckout = (
    customerName: string,
    customerPhone: string,
    paymentMethod: Bill['paymentMethod'],
    amountPaid?: number,
    notes?: string
  ): Bill => {
    const nextBillNumber = `CSC-${new Date().getFullYear()}-${1001 + bills.length}`;
    const paidVal = amountPaid !== undefined ? amountPaid : (paymentMethod === 'credit' ? 0 : cartTotal);
    const pendingVal = Math.max(0, cartTotal - paidVal);
    const payStatus = pendingVal === 0 ? 'paid' : (paidVal > 0 ? 'partially_paid' : 'pending');

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber: nextBillNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: [...cart],
      subtotal: cartSubtotal,
      discount: calculatedDiscount,
      discountType,
      tax: 0,
      totalAmount: cartTotal,
      paymentMethod,
      paymentStatus: payStatus,
      amountPaid: paidVal,
      pendingAmount: pendingVal,
      notes,
    };

    const updatedBills = [newBill, ...bills];
    let updatedKhata = [...khata];
    let updatedServices = [...services];

    if (paymentMethod === 'credit' || pendingVal > 0) {
      const custName = customerName.trim() || 'Walk-in Customer';
      const custPhone = customerPhone.trim() || 'N/A';

      const existingCustIndex = updatedKhata.findIndex(
        (c) => (custPhone !== 'N/A' && c.phone === custPhone) || c.name.toLowerCase() === custName.toLowerCase()
      );

      if (existingCustIndex > -1) {
        const target = updatedKhata[existingCustIndex];
        updatedKhata[existingCustIndex] = {
          ...target,
          totalOutstanding: target.totalOutstanding + pendingVal,
          history: [
            ...target.history,
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'debit',
              amount: pendingVal,
              description: `Bill ${nextBillNumber} (${cart.length} items)`,
              billId: newBill.id,
            },
          ],
        };
      } else {
        updatedKhata.push({
          id: `cust-${Date.now()}`,
          name: custName,
          phone: custPhone,
          totalOutstanding: pendingVal,
          history: [
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'debit',
              amount: pendingVal,
              description: `Bill ${nextBillNumber} (${cart.length} items)`,
              billId: newBill.id,
            },
          ],
        });
      }
    }

    cart.forEach((cartItem) => {
      if (cartItem.serviceId) {
        updatedServices = updatedServices.map((srv) =>
          srv.id === cartItem.serviceId && srv.stock !== undefined
            ? { ...srv, stock: Math.max(0, srv.stock - cartItem.quantity) }
            : srv
        );
      }
    });

    updateAndSync(updatedServices, updatedBills, applications, updatedKhata, settings);
    clearCart();
    return newBill;
  };

  const updateBill = (id: string, updatedFields: Partial<Bill>) => {
    const updated = bills.map((b) => (b.id === id ? { ...b, ...updatedFields } : b));
    updateAndSync(services, updated, applications, khata, settings);
  };

  const deleteBill = (billId: string) => {
    const updated = bills.filter((b) => b.id !== billId);
    updateAndSync(services, updated, applications, khata, settings);
  };

  const clearAllBills = () => {
    updateAndSync(services, [], applications, khata, settings);
  };

  // Service Management
  const addService = (newSrv: Omit<ServiceItem, 'id'>) => {
    const srv: ServiceItem = {
      ...newSrv,
      id: `srv-${Date.now()}`,
    };
    const updated = [...services, srv];
    updateAndSync(updated, bills, applications, khata, settings);
  };

  const updateService = (id: string, updatedFields: Partial<ServiceItem>) => {
    const updated = services.map((s) => (s.id === id ? { ...s, ...updatedFields } : s));
    updateAndSync(updated, bills, applications, khata, settings);
  };

  const deleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    updateAndSync(updated, bills, applications, khata, settings);
  };

  // Application Tracker
  const addApplication = (appData: Omit<ApplicationRecord, 'id'>) => {
    const newApp: ApplicationRecord = {
      ...appData,
      id: `app-${Date.now()}`,
    };
    const updated = [newApp, ...applications];
    updateAndSync(services, bills, updated, khata, settings);
  };

  const updateApplication = (id: string, updatedFields: Partial<ApplicationRecord>) => {
    const updated = applications.map((app) => (app.id === id ? { ...app, ...updatedFields } : app));
    updateAndSync(services, bills, updated, khata, settings);
  };

  const updateAppStatus = (id: string, status: ApplicationRecord['status'], remarks?: string) => {
    const updated = applications.map((app) =>
      app.id === id
        ? {
            ...app,
            status,
            remarks: remarks !== undefined ? remarks : app.remarks,
            statusUpdateDate: new Date().toISOString(),
          }
        : app
    );
    updateAndSync(services, bills, updated, khata, settings);
  };

  const deleteApplication = (id: string) => {
    const updated = applications.filter((app) => app.id !== id);
    updateAndSync(services, bills, updated, khata, settings);
  };

  // Khata operations
  const addKhataCustomer = (name: string, phone: string) => {
    const newCust: CustomerCredit = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      totalOutstanding: 0,
      history: [],
    };
    const updated = [...khata, newCust];
    updateAndSync(services, bills, applications, updated, settings);
  };

  const updateKhataCustomer = (id: string, name: string, phone: string) => {
    const updated = khata.map((cust) =>
      cust.id === id ? { ...cust, name: name.trim(), phone: phone.trim() } : cust
    );
    updateAndSync(services, bills, applications, updated, settings);
  };

  const deleteKhataCustomer = (id: string) => {
    const updated = khata.filter((cust) => cust.id !== id);
    updateAndSync(services, bills, applications, updated, settings);
  };

  const recordKhataPayment = (customerId: string, amount: number, note: string) => {
    const updated = khata.map((cust) => {
      if (cust.id === customerId) {
        const updatedOutstanding = Math.max(0, cust.totalOutstanding - amount);
        return {
          ...cust,
          totalOutstanding: updatedOutstanding,
          history: [
            ...cust.history,
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'credit' as const,
              amount,
              description: note.trim() || 'Payment Received (Cash/UPI)',
            },
          ],
        };
      }
      return cust;
    });
    updateAndSync(services, bills, applications, updated, settings);
  };

  const addKhataDebit = (customerId: string, amount: number, description: string) => {
    const updated = khata.map((cust) => {
      if (cust.id === customerId) {
        return {
          ...cust,
          totalOutstanding: cust.totalOutstanding + amount,
          history: [
            ...cust.history,
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'debit' as const,
              amount,
              description: description.trim() || 'Manual Credit Charge',
            },
          ],
        };
      }
      return cust;
    });
    updateAndSync(services, bills, applications, updated, settings);
  };

  const updateSettings = (newSet: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSet };
    updateAndSync(services, bills, applications, khata, updated);
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data for this account?')) {
      updateAndSync(initialServices, initialBills, initialApplications, initialKhata, initialSettings);
      clearCart();
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        services,
        bills,
        applications,
        khata,
        settings,
        cart,
        activeTab,
        setActiveTab,
        syncStatus,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartPrice,
        clearCart,
        cartSubtotal,
        discount,
        discountType,
        setDiscount,
        setDiscountType,
        cartTotal,
        processCheckout,
        updateBill,
        deleteBill,
        clearAllBills,
        addService,
        updateService,
        deleteService,
        addApplication,
        updateApplication,
        updateAppStatus,
        deleteApplication,
        addKhataCustomer,
        updateKhataCustomer,
        deleteKhataCustomer,
        recordKhataPayment,
        addKhataDebit,
        updateSettings,
        resetAllData,
        syncNow: pullFromCloud,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
