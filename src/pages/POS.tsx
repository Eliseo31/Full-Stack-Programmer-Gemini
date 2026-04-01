import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Image as ImageIcon } from 'lucide-react';
import { Product, Order, OrderItem } from '../types';
import { AlertModal } from '../components/AlertModal';
import { api } from '../services/api';

export function POS() {
  const { products, customers, orders, setOrders, setProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  const filteredProducts = products.filter(p => 
    p.stock > 0 && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        ));
      }
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, unitPrice: product.price, total: product.price }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0 && newQuantity <= product.stock) {
          return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice };
        }
        return item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomer) {
      setAlertMessage({ title: 'Aviso', message: 'Por favor selecciona un cliente.' });
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      type: 'Venta',
      date: new Date().toISOString(),
      customerId: selectedCustomer,
      items: cart,
      total: cartTotal,
      status: 'Completado',
    };

    try {
      await api.createOrder(newOrder);
      
      // Update stock locally and on server
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(item => item.productId === p.id);
        if (cartItem) {
          const updatedProduct = { ...p, stock: p.stock - cartItem.quantity };
          api.updateProduct(p.id, updatedProduct); // Update on server (fire and forget for now)
          return updatedProduct;
        }
        return p;
      });

      setProducts(updatedProducts);
      setOrders([newOrder, ...orders]);
      setCart([]);
      setSelectedCustomer('');
      setCustomerInput('');
      setAlertMessage({ title: 'Éxito', message: `Venta completada con éxito. Orden: ${newOrder.id}` });
    } catch (error) {
      console.error('Error during checkout:', error);
      setAlertMessage({ title: 'Error', message: 'No se pudo completar la venta.' });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex-1">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-md mb-3" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-600">${product.price.toLocaleString()}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.stock} disp.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-gray-500" />
            Caja
          </h2>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {cart.length} items
          </span>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input 
            list="customers-list"
            id="customer"
            value={customerInput}
            onChange={(e) => {
              setCustomerInput(e.target.value);
              const found = customers.find(c => c.name === e.target.value);
              setSelectedCustomer(found ? found.id : '');
            }}
            placeholder="Escriba para buscar cliente..."
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <datalist id="customers-list">
            {customers.map(c => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ShoppingCart className="h-12 w-12 mb-2 text-gray-300" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <li key={item.productId} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product?.name}</p>
                      <p className="text-sm text-gray-500">${item.unitPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-gray-500 hover:text-gray-700">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-gray-500 hover:text-gray-700">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-500 hover:text-red-700 ml-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">${cartTotal.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-indigo-400 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:bg-indigo-200 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Cobrar
          </button>
        </div>
      </div>
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={!!alertMessage}
        title={alertMessage?.title || ''}
        message={alertMessage?.message || ''}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}
