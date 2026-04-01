export type Role = 'Admin' | 'Gerente' | 'Vendedor' | 'Almacén';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Activo' | 'Inactivo';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  receiptType: 'Fiscal' | 'Final' | 'Constancia';
}

export type OrderStatus = 'Pendiente' | 'Procesando' | 'Completado' | 'Cancelado';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  type: 'Venta' | 'Compra';
  date: string;
  customerId?: string; // For Sales
  supplierId?: string; // For Purchases
  items: OrderItem[];
  total: number;
  status: OrderStatus;
}

export interface Return {
  id: string;
  orderId: string;
  date: string;
  productId: string;
  quantity: number;
  amount: number;
  reason: string;
}

export interface CompanySettings {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  ncfPrefixFiscal: string;
  ncfSequenceFiscal: number;
  ncfPrefixFinal: string;
  ncfSequenceFinal: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  date: string;
  customerName: string;
  rfc: string;
  ncf?: string;
  receiptType: 'Fiscal' | 'Final' | 'Constancia';
  subtotal: number;
  tax: number;
  total: number;
  status: 'Pagada' | 'Pendiente' | 'Cancelada';
}
