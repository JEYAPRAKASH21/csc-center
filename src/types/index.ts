export type ServiceCategory = 
  | 'xerox' 
  | 'photos' 
  | 'esevai' 
  | 'stationery' 
  | 'printing' 
  | 'lamination' 
  | 'other';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  unit: string;
  image?: string;
  stock?: number;
  popular?: boolean;
  code?: string;
  govFee?: number;
  cscCommission?: number;
}

export interface CartItem {
  id: string;
  serviceId?: string;
  name: string;
  category: ServiceCategory;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  image?: string;
  notes?: string;
  ackNumber?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit';

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number; // Total without GST and Discount
  discount: number;
  discountType?: 'flat' | 'percentage';
  tax: number; // GST Amount
  totalAmount: number; // Final Payable Total
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'partially_paid';
  amountPaid: number;
  pendingAmount: number;
  notes?: string;
}

export type ApplicationStatus = 'pending' | 'processing' | 'approved' | 'ready_for_print' | 'delivered' | 'rejected';

export interface ApplicationRecord {
  id: string;
  ackNumber: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  appliedDate: string;
  status: ApplicationStatus;
  statusUpdateDate: string;
  govFeePaid: number;
  serviceCharge: number;
  remarks?: string;
}

export interface CustomerCredit {
  id: string;
  name: string;
  phone: string;
  totalOutstanding: number;
  history: {
    id: string;
    date: string;
    type: 'debit' | 'credit';
    amount: number;
    description: string;
    billId?: string;
  }[];
}

export interface StoreSettings {
  centerName: string;
  cscId: string;
  vleName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  state: string;
  upiId: string;
  upiName: string;
  thermalPrinterWidth: '2inch' | '3inch';
  currencySymbol: string;
  gstEnabled: boolean;
  gstRate: number; // e.g., 18%
}

export interface User {
  id: string;
  email: string;
  vleName: string;
  centerName: string;
  cscId: string;
}
