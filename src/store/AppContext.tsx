import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, Customer, Order, Invoice, Return, CompanySettings } from '../types';
import { api } from '../services/api';

interface AppState {
  users: User[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  invoices: Invoice[];
  returns: Return[];
  settings: CompanySettings;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setReturns: React.Dispatch<React.SetStateAction<Return[]>>;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [settings, setSettings] = useState<CompanySettings>({
    name: 'CSELITEGROUP POS',
    rnc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    currency: 'DOP'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c, o, r, s, u] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getOrders(),
          api.getReturns(),
          api.getSettings(),
          api.getUsers()
        ]);
        setProducts(p);
        setCustomers(c);
        setOrders(o);
        setReturns(r);
        if (s && s.name) setSettings(s);
        setUsers(u);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <AppContext.Provider value={{ 
      users, products, customers, orders, invoices, returns, settings,
      setUsers, setProducts, setCustomers, setOrders, setInvoices, setReturns, setSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
