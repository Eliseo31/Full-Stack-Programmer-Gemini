import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Return, Order } from '../types';
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { AlertModal } from '../components/AlertModal';

export function Returns() {
  const { returns, setReturns, orders, products, setProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);
  
  // Modal state
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const filteredReturns = returns.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const availableProducts = selectedOrder 
    ? selectedOrder.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, name: product?.name || 'Producto Desconocido' };
      })
    : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !selectedProductId) return;

    const orderItem = selectedOrder.items.find(i => i.productId === selectedProductId);
    if (!orderItem) return;

    const amount = orderItem.unitPrice * quantity;

    const newReturn: Return = {
      id: `DEV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      orderId: selectedOrderId,
      date: new Date().toISOString(),
      productId: selectedProductId,
      quantity,
      amount,
      reason,
    };

    try {
      await api.createReturn(newReturn);
      
      // Update product stock (increase inventory)
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        const updatedProduct = { ...product, stock: product.stock + quantity };
        await api.updateProduct(product.id, updatedProduct);
        setProducts(products.map(p => p.id === selectedProductId ? updatedProduct : p));
      }

      setReturns([...returns, newReturn]);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving return:', error);
      setAlertMessage({ title: 'Error', message: 'No se pudo registrar la devolución.' });
    }
  };

  const resetForm = () => {
    setSelectedOrderId('');
    setSelectedProductId('');
    setQuantity(1);
    setReason('');
  };

  const handleDelete = (id: string) => {
    setReturnToDelete(id);
  };

  const confirmDelete = async () => {
    if (returnToDelete) {
      const returnItem = returns.find(r => r.id === returnToDelete);
      if (returnItem) {
        try {
          await api.deleteReturn(returnToDelete);
          
          // Decrease stock back since we are deleting the return
          const product = products.find(p => p.id === returnItem.productId);
          if (product) {
            const updatedProduct = { ...product, stock: product.stock - returnItem.quantity };
            await api.updateProduct(product.id, updatedProduct);
            setProducts(products.map(p => p.id === returnItem.productId ? updatedProduct : p));
          }

          setReturns(returns.filter(r => r.id !== returnToDelete));
          setReturnToDelete(null);
        } catch (error) {
          console.error('Error deleting return:', error);
          setAlertMessage({ title: 'Error', message: 'No se pudo eliminar la devolución.' });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Devoluciones</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-400 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-500 transition-all transform hover:scale-[1.02] shadow-sm text-base font-medium"
        >
          <Plus className="h-5 w-5" />
          Nueva Devolución
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar devolución..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden Ref</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReturns.map((ret) => {
                const product = products.find(p => p.id === ret.productId);
                return (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ret.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.date ? format(new Date(ret.date), 'dd/MM/yyyy') : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product?.name || 'Desconocido'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(ret.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(ret.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron devoluciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Registrar Devolución
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">Orden de Venta</label>
                      <select
                        id="orderId"
                        required
                        value={selectedOrderId}
                        onChange={(e) => {
                          setSelectedOrderId(e.target.value);
                          setSelectedProductId('');
                        }}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">Seleccione una orden...</option>
                        {orders.filter(o => o.type === 'Venta').map(order => (
                          <option key={order.id} value={order.id}>{order.id} - {format(new Date(order.date), 'dd/MM/yyyy')} (${order.total.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    {selectedOrderId && (
                      <div>
                        <label htmlFor="productId" className="block text-sm font-medium text-gray-700">Producto a Devolver</label>
                        <select
                          id="productId"
                          required
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                        >
                          <option value="">Seleccione un producto...</option>
                          {availableProducts.map(item => (
                            <option key={item.productId} value={item.productId}>
                              {item.name} (Comprados: {item.quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedProductId && (
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Cantidad Devuelta</label>
                        <input
                          type="number"
                          id="quantity"
                          required
                          min="1"
                          max={availableProducts.find(p => p.productId === selectedProductId)?.quantity || 1}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : 1)}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motivo de Devolución</label>
                      <textarea
                        id="reason"
                        required
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                        placeholder="Ej. Producto defectuoso, el cliente cambió de opinión..."
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-indigo-400 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]"
                  >
                    Guardar Devolución
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!returnToDelete}
        title="Eliminar Devolución"
        message="¿Estás seguro de que deseas eliminar esta devolución? Esta acción no se puede deshacer y el inventario será ajustado."
        onConfirm={confirmDelete}
        onCancel={() => setReturnToDelete(null)}
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
