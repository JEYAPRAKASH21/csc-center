import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceItem, Bill, ApplicationRecord, CustomerCredit, StoreSettings, CartItem } from '../types';
import { initialServices, initialSettings, initialApplications, initialKhata, initialBills } from '../data/initialData';

interface AppContextType {
  services: ServiceItem[];
  bills: Bill[];
  applications: ApplicationRecord[];
  khata: CustomerCredit[];
  settings: StoreSettings;
  cart: CartItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;

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

  // Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LocalStorage Helper
  const useLocalStorage = <T,>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return initialValue;
      }
    });

    useEffect(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
  };

  const [services, setServices] = useLocalStorage<ServiceItem[]>('csc_services', initialServices);
  const [bills, setBills] = useLocalStorage<Bill[]>('csc_bills', initialBills);
  const [applications, setApplications] = useLocalStorage<ApplicationRecord[]>('csc_applications', initialApplications);
  const [khata, setKhata] = useLocalStorage<CustomerCredit[]>('csc_khata', initialKhata);
  const [settings, setSettings] = useLocalStorage<StoreSettings>('csc_settings', initialSettings);

  const [activeTab, setActiveTab] = useState<string>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');

  // Cart logic
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

    setBills((prev) => [newBill, ...prev]);

    // If payment method is Credit or pending amount > 0, update Khata ledger!
    if (paymentMethod === 'credit' || pendingVal > 0) {
      const custName = customerName.trim() || 'Walk-in Customer';
      const custPhone = customerPhone.trim() || 'N/A';

      setKhata((prevKhata) => {
        const existingCust = prevKhata.find(
          (c) => (custPhone !== 'N/A' && c.phone === custPhone) || c.name.toLowerCase() === custName.toLowerCase()
        );

        if (existingCust) {
          return prevKhata.map((c) =>
            c.id === existingCust.id
              ? {
                  ...c,
                  totalOutstanding: c.totalOutstanding + pendingVal,
                  history: [
                    ...c.history,
                    {
                      id: `h-${Date.now()}`,
                      date: new Date().toISOString(),
                      type: 'debit',
                      amount: pendingVal,
                      description: `Bill ${nextBillNumber} (${cart.length} items)`,
                      billId: newBill.id,
                    },
                  ],
                }
              : c
          );
        } else {
          const newCust: CustomerCredit = {
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
          };
          return [...prevKhata, newCust];
        }
      });
    }

    // Also deduct stock for stationery items
    cart.forEach((cartItem) => {
      if (cartItem.serviceId) {
        setServices((prevServices) =>
          prevServices.map((srv) =>
            srv.id === cartItem.serviceId && srv.stock !== undefined
              ? { ...srv, stock: Math.max(0, srv.stock - cartItem.quantity) }
              : srv
          )
        );
      }
    });

    clearCart();
    return newBill;
  };

  const updateBill = (id: string, updatedFields: Partial<Bill>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updatedFields } : b)));
  };

  const deleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
  };

  const clearAllBills = () => {
    setBills([]);
  };

  // Service Management
  const addService = (newSrv: Omit<ServiceItem, 'id'>) => {
    const srv: ServiceItem = {
      ...newSrv,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, srv]);
  };

  const updateService = (id: string, updatedFields: Partial<ServiceItem>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Application Tracker
  const addApplication = (appData: Omit<ApplicationRecord, 'id'>) => {
    const newApp: ApplicationRecord = {
      ...appData,
      id: `app-${Date.now()}`,
    };
    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplication = (id: string, updatedFields: Partial<ApplicationRecord>) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...updatedFields } : app)));
  };

  const updateAppStatus = (id: string, status: ApplicationRecord['status'], remarks?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              remarks: remarks !== undefined ? remarks : app.remarks,
              statusUpdateDate: new Date().toISOString(),
            }
          : app
      )
    );
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
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
    setKhata((prev) => [...prev, newCust]);
  };

  const updateKhataCustomer = (id: string, name: string, phone: string) => {
    setKhata((prev) =>
      prev.map((cust) =>
        cust.id === id
          ? { ...cust, name: name.trim(), phone: phone.trim() }
          : cust
      )
    );
  };

  const deleteKhataCustomer = (id: string) => {
    setKhata((prev) => prev.filter((cust) => cust.id !== id));
  };

  const recordKhataPayment = (customerId: string, amount: number, note: string) => {
    setKhata((prev) =>
      prev.map((cust) => {
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
                type: 'credit',
                amount,
                description: note.trim() || 'Payment Received (Cash/UPI)',
              },
            ],
          };
        }
        return cust;
      })
    );
  };

  const addKhataDebit = (customerId: string, amount: number, description: string) => {
    setKhata((prev) =>
      prev.map((cust) => {
        if (cust.id === customerId) {
          return {
            ...cust,
            totalOutstanding: cust.totalOutstanding + amount,
            history: [
              ...cust.history,
              {
                id: `h-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'debit',
                amount,
                description: description.trim() || 'Manual Credit Charge',
              },
            ],
          };
        }
        return cust;
      })
    );
  };

  const updateSettings = (newSet: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSet }));
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data to initial defaults?')) {
      setServices(initialServices);
      setBills(initialBills);
      setApplications(initialApplications);
      setKhata(initialKhata);
      setSettings(initialSettings);
      clearCart();
    }
  };

  return (
    <AppContext.Provider
      value={{
        services,
        bills,
        applications,
        khata,
        settings,
        cart,
        activeTab,
        setActiveTab,
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
