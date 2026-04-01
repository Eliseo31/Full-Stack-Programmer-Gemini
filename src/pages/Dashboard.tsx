import React from 'react';
import { useAppContext } from '../store/AppContext';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { users, products, customers, orders, returns } = useAppContext();

  const salesOrders = orders.filter(o => o.type === 'Venta');
  const totalSalesGross = salesOrders.reduce((acc, order) => acc + order.total, 0);
  const totalReturns = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
  const totalSales = totalSalesGross - totalReturns;

  const stats = [
    { label: 'Usuarios Totales', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Productos en Stock', value: products.reduce((acc, p) => acc + p.stock, 0), icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Clientes Activos', value: customers.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Ventas Totales', value: `$${totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const chartData = [
    { name: 'Ene', ventas: 4000 },
    { name: 'Feb', ventas: 3000 },
    { name: 'Mar', ventas: 2000 },
    { name: 'Abr', ventas: 2780 },
    { name: 'May', ventas: 1890 },
    { name: 'Jun', ventas: 2390 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general del sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-xl p-4 ${item.bg}`}>
                  <item.icon className={`h-8 w-8 ${item.color}`} aria-hidden="true" />
                </div>
                <div className="ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.label}</dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-800 mt-1">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ventas Mensuales</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="ventas" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
