import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, UsersRound, ShoppingCart, Truck, Menu, Bell, LogOut, MonitorSmartphone, FileText, BarChart3, RotateCcw, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: MonitorSmartphone, label: 'Caja (POS)' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/purchases', icon: Truck, label: 'Compras' },
  { to: '/invoices', icon: FileText, label: 'Facturación' },
  { to: '/returns', icon: RotateCcw, label: 'Devoluciones' },
  { to: '/products', icon: Package, label: 'Inventario' },
  { to: '/customers', icon: UsersRound, label: 'Clientes' },
  { to: '/users', icon: Users, label: 'Usuarios y Roles' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const navigate = useNavigate();
  const { settings } = useAppContext();

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          {sidebarOpen ? (
            <span className="text-xl font-bold text-indigo-600 tracking-tight flex items-center gap-2 truncate">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <Package className="h-6 w-6 flex-shrink-0" />
              )}
              <span className="truncate">{settings.name}</span>
            </span>
          ) : (
            <span className="text-xl font-bold text-indigo-600">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <Package className="h-6 w-6" />
              )}
            </span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon className={cn("flex-shrink-0", sidebarOpen ? "mr-3 h-5 w-5" : "mx-auto h-6 w-6")} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                A
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@erp.com</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
