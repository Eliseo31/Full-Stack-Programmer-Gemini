import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '../types';
import { format } from 'date-fns';
import { ConfirmModal } from '../components/ConfirmModal';
import { AlertModal } from '../components/AlertModal';
import { api } from '../services/api';

interface OrdersProps {
  type: 'Venta' | 'Compra';
}

export function Orders({ type }: OrdersProps) {
  const { orders, setOrders, customers, products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  const filteredOrders = orders.filter(o => o.type === type && o.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productName = formData.get('productName') as string;
    const product = products.find(p => p.name === productName);
    
    if (!product) {
      setAlertMessage({ title: 'Error', message: 'Producto no encontrado. Por favor seleccione uno de la lista.' });
      return;
    }
    
    const productId = product.id;
    const quantity = Number(formData.get('quantity'));
    
    const unitPrice = type === 'Venta' ? product.price : product.cost;
    const total = unitPrice * quantity;

    const partnerInput = formData.get('partnerId') as string;
    let finalPartnerId = partnerInput;
    if (type === 'Venta') {
      const customer = customers.find(c => c.name === partnerInput);
      if (customer) finalPartnerId = customer.id;
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      type,
      date: new Date().toISOString(),
      customerId: type === 'Venta' ? finalPartnerId : undefined,
      supplierId: type === 'Compra' ? finalPartnerId : undefined,
      items: [{ productId, quantity, unitPrice, total }],
      total,
      status: 'Pendiente',
    };

    try {
      await api.createOrder(newOrder);
      setOrders([newOrder, ...orders]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
      setAlertMessage({ title: 'Error', message: 'No se pudo crear la orden.' });
    }
  };

  const handleDelete = (id: string) => {
    setOrderToDelete(id);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await api.deleteOrder(orderToDelete);
        setOrders(orders.filter(o => o.id !== orderToDelete));
        setOrderToDelete(null);
      } catch (error) {
        console.error('Error deleting order:', error);
        setAlertMessage({ title: 'Error', message: 'No se pudo eliminar la orden.' });
      }
    }
  };

  const getPartnerName = (order: Order) => {
    if (order.type === 'Venta') {
      return customers.find(c => c.id === order.customerId)?.name || 'Cliente Desconocido';
    }
    return order.supplierId || 'Proveedor Desconocido';
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Completado': return 'bg-green-100 text-green-800';
      case 'Procesando': return 'bg-blue-100 text-blue-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de {type}</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona las operaciones de {type.toLowerCase()}.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-400 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 sm:w-auto transition-all transform hover:scale-[1.02]"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Nueva Orden
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Buscar por ID de orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Orden</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{type === 'Venta' ? 'Cliente' : 'Proveedor'}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(order.date), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getPartnerName(order)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setViewingOrder(order)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-20">
              <form onSubmit={handleCreateOrder}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Nueva Orden de {type}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700">
                        {type === 'Venta' ? 'Cliente' : 'Proveedor'}
                      </label>
                      <input 
                        list="partners-list"
                        name="partnerId" 
                        id="partnerId" 
                        required 
                        placeholder={type === 'Venta' ? "Escriba para buscar cliente..." : "Nombre del proveedor"}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" 
                      />
                      {type === 'Venta' && (
                        <datalist id="partners-list">
                          {customers.map(c => (
                            <option key={c.id} value={c.name} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div>
                      <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Producto</label>
                      <input 
                        list="products-list"
                        name="productName" 
                        id="productName" 
                        required 
                        placeholder="Escriba para buscar producto..."
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <datalist id="products-list">
                        {products.map(p => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
                      <input type="number" name="quantity" id="quantity" min="1" required defaultValue={1} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-indigo-400 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                    Crear Orden
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setViewingOrder(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-20">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Detalle de Orden {viewingOrder.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(viewingOrder.date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(viewingOrder.status)}`}>
                    {viewingOrder.status}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">{type === 'Venta' ? 'Cliente' : 'Proveedor'}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{getPartnerName(viewingOrder)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Artículos</h4>
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cant.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Precio Unit.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingOrder.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">{product?.name || 'Producto Eliminado'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 text-right">${item.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">${item.total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <th colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-900">Total General</th>
                        <td className="px-4 py-2 text-right text-sm font-bold text-indigo-600">${viewingOrder.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setViewingOrder(null)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        title="Eliminar Orden"
        message="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />
      
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
