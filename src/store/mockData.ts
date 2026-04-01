import { User, Product, Customer, Order, Invoice, Return, CompanySettings } from '../types';

export const initialUsers: User[] = [
  { id: '1', name: 'Ana García', email: 'ana@empresa.com', role: 'Admin', status: 'Activo' },
  { id: '2', name: 'Carlos López', email: 'carlos@empresa.com', role: 'Gerente', status: 'Activo' },
  { id: '3', name: 'María Rodríguez', email: 'maria@empresa.com', role: 'Vendedor', status: 'Inactivo' },
];

export const initialProducts: Product[] = [
  { id: '1', sku: 'LAP-001', name: 'Laptop Pro 15"', description: 'Laptop de alto rendimiento', price: 1200, cost: 800, stock: 45, category: 'Electrónica' },
  { id: '2', sku: 'MON-001', name: 'Monitor 27" 4K', description: 'Monitor de alta resolución', price: 350, cost: 200, stock: 12, category: 'Electrónica' },
  { id: '3', sku: 'TEC-001', name: 'Teclado Mecánico', description: 'Teclado mecánico RGB', price: 80, cost: 40, stock: 150, category: 'Accesorios' },
];

export const initialCustomers: Customer[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan@cliente.com', phone: '555-0101', company: 'Tech Solutions', address: 'Av. Principal 123', receiptType: 'Fiscal' },
  { id: '2', name: 'Laura Martínez', email: 'laura@cliente.com', phone: '555-0202', company: 'Innovación SA', address: 'Calle Secundaria 456', receiptType: 'Final' },
  { id: '3', name: 'Pedro Gómez', email: 'pedro@cliente.com', phone: '555-0303', company: 'Particular', address: 'Calle 3', receiptType: 'Constancia' },
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-001',
    type: 'Venta',
    date: '2026-03-30T10:00:00Z',
    customerId: '1',
    items: [{ productId: '1', quantity: 2, unitPrice: 1200, total: 2400 }],
    total: 2400,
    status: 'Completado',
  },
  {
    id: 'ORD-002',
    type: 'Compra',
    date: '2026-03-31T09:30:00Z',
    supplierId: 'SUP-01',
    items: [{ productId: '2', quantity: 10, unitPrice: 200, total: 2000 }],
    total: 2000,
    status: 'Procesando',
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'FAC-001',
    orderId: 'ORD-001',
    date: '2026-03-30T10:05:00Z',
    customerName: 'Tech Solutions',
    rfc: 'TEC123456789',
    ncf: 'B0100000001',
    receiptType: 'Fiscal',
    subtotal: 2033.90,
    tax: 366.10,
    total: 2400,
    status: 'Pagada',
  }
];

export const initialReturns: Return[] = [];

export const initialSettings: CompanySettings = {
  name: 'CS ELITE GROUP',
  rnc: '130000000',
  address: 'Av. Principal #123, Santo Domingo',
  phone: '809-555-0000',
  email: 'contacto@cselitegroup.com',
  ncfPrefixFiscal: 'B01',
  ncfSequenceFiscal: 1,
  ncfPrefixFinal: 'B02',
  ncfSequenceFinal: 1,
};
