import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { api } from '../services/api';
import { AlertModal } from '../components/AlertModal';

export function Customers() {
  const { customers, setCustomers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      address: formData.get('address') as string,
      receiptType: formData.get('receiptType') as 'Fiscal' | 'Final' | 'Constancia',
    };

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, newCustomer);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? newCustomer : c));
      } else {
        await api.createCustomer(newCustomer);
        setCustomers([...customers, newCustomer]);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      setAlertMessage({ title: 'Error', message: 'No se pudo guardar el cliente.' });
    }
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await api.deleteCustomer(customerToDelete);
        setCustomers(customers.filter(c => c.id !== customerToDelete));
        setCustomerToDelete(null);
      } catch (error) {
        console.error('Error deleting customer:', error);
        setAlertMessage({ title: 'Error', message: 'No se pudo eliminar el cliente.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Directorio de clientes y empresas.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-400 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 sm:w-auto transition-all transform hover:scale-[1.02]"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Nuevo Cliente
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
              placeholder="Buscar por nombre o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Comprobante</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.receiptType === 'Fiscal' ? 'bg-green-100 text-green-800' : 
                      customer.receiptType === 'Final' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.receiptType === 'Fiscal' ? 'Valor Fiscal' : 
                       customer.receiptType === 'Final' ? 'Consumidor Final' : 
                       'Constancia (N/A)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-20">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                      <input type="text" name="name" id="name" defaultValue={editingCustomer?.name} required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">Empresa</label>
                      <input type="text" name="company" id="company" defaultValue={editingCustomer?.company} required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" defaultValue={editingCustomer?.email} required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <input type="text" name="phone" id="phone" defaultValue={editingCustomer?.phone} required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                      <input type="text" name="address" id="address" defaultValue={editingCustomer?.address} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="receiptType" className="block text-sm font-medium text-gray-700">Tipo de Comprobante Requerido</label>
                      <select
                        id="receiptType"
                        name="receiptType"
                        defaultValue={editingCustomer ? editingCustomer.receiptType : 'Final'}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="Fiscal">Valor Fiscal (ITBIS y NCF B01/E31)</option>
                        <option value="Final">Consumidor Final (NCF B02/E32)</option>
                        <option value="Constancia">Solo Constancia (N/A)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-indigo-400 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                    Guardar
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
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setCustomerToDelete(null)}
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
