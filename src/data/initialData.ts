import { ServiceItem, ApplicationRecord, CustomerCredit, StoreSettings, Bill } from '../types';

export const initialServices: ServiceItem[] = [
  // Xerox & Copying
  {
    id: 'srv-1',
    name: 'Xerox (Single Side B&W)',
    category: 'xerox',
    price: 2,
    unit: 'per page',
    popular: true,
    code: 'XRX-SS'
  },
  {
    id: 'srv-2',
    name: 'Xerox (Double Side B&W)',
    category: 'xerox',
    price: 3,
    unit: 'per page',
    popular: true,
    code: 'XRX-DS'
  },
  {
    id: 'srv-3',
    name: 'Color Print / Copy (A4)',
    category: 'xerox',
    price: 10,
    unit: 'per page',
    popular: true,
    code: 'XRX-CLR'
  },
  {
    id: 'srv-4',
    name: 'A3 Size Xerox / Print',
    category: 'xerox',
    price: 20,
    unit: 'per page',
    popular: false,
    code: 'XRX-A3'
  },

  // Photos
  {
    id: 'srv-6',
    name: 'Passport Size Photos (8 Pcs)',
    category: 'photos',
    price: 50,
    unit: 'per sheet',
    popular: true,
    code: 'PHT-8P'
  },
  {
    id: 'srv-7',
    name: 'Passport Size Photos (16 Pcs)',
    category: 'photos',
    price: 80,
    unit: 'per sheet',
    popular: true,
    code: 'PHT-16P'
  },

  // E-Sevai Govt Services
  {
    id: 'srv-10',
    name: 'PAN Card New / Correction',
    category: 'esevai',
    price: 150,
    unit: 'per app',
    popular: true,
    code: 'ESV-PAN'
  },
  {
    id: 'srv-11',
    name: 'Aadhaar PVC Card Print',
    category: 'esevai',
    price: 50,
    unit: 'per card',
    popular: true,
    code: 'ESV-ADH'
  },
  {
    id: 'srv-12',
    name: 'Income Certificate Apply',
    category: 'esevai',
    price: 60,
    unit: 'per app',
    popular: true,
    code: 'ESV-INC'
  },
  {
    id: 'srv-13',
    name: 'Community Certificate Apply',
    category: 'esevai',
    price: 60,
    unit: 'per app',
    popular: true,
    code: 'ESV-COM'
  },
  {
    id: 'srv-15',
    name: 'Ration Card Member Change',
    category: 'esevai',
    price: 80,
    unit: 'per app',
    popular: true,
    code: 'ESV-RTN'
  },

  // Lamination & Stationery
  {
    id: 'srv-22',
    name: 'A4 Document Lamination',
    category: 'lamination',
    price: 30,
    unit: 'per sheet',
    popular: true,
    code: 'LAM-A4'
  },
  {
    id: 'srv-25',
    name: 'A4 Paper Ream (500 Sheets)',
    category: 'stationery',
    price: 280,
    unit: 'per ream',
    stock: 15,
    popular: false,
    code: 'STN-RM'
  },
  {
    id: 'srv-27',
    name: 'Project Files & Folders',
    category: 'stationery',
    price: 20,
    unit: 'per pc',
    stock: 50,
    popular: true,
    code: 'STN-FLE'
  }
];

export const initialSettings: StoreSettings = {
  centerName: 'CSC Digital Express',
  cscId: 'CSC-TN-984210',
  vleName: 'Dhilipan Kumar (VLE)',
  phone: '+91 98765 43210',
  email: 'csc.digitalexpress@gmail.com',
  address: 'No. 45, Main Road, Near Bus Stand',
  district: 'Coimbatore',
  state: 'Tamil Nadu - 641001',
  upiId: 'csc.express@upi',
  upiName: 'CSC Digital Express',
  thermalPrinterWidth: '3inch',
  currencySymbol: '₹',
  gstEnabled: false,
  gstRate: 0
};

export const initialApplications: ApplicationRecord[] = [];
export const initialKhata: CustomerCredit[] = [];
export const initialBills: Bill[] = []; // Fresh 0 bills data
