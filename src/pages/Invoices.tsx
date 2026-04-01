import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { FileText, Search, Plus, Download, Trash2, Eye } from 'lucide-react';
import { Invoice, Order } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmModal } from '../components/ConfirmModal';

export function Invoices() {
  const { invoices, setInvoices, orders, customers, settings, setSettings, products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const filteredInvoices = invoices.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unbilledOrders = orders.filter(o => 
    o.type === 'Venta' && 
    o.status === 'Completado' && 
    !invoices.some(i => i.orderId === o.id)
  );

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderId = formData.get('orderId') as string;
    const rfc = formData.get('rfc') as string;
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const customer = customers.find(c => c.id === order.customerId);
    const customerName = customer ? customer.name : 'Cliente General';
    const receiptType = customer ? customer.receiptType : 'Final';

    const subtotal = receiptType === 'Fiscal' ? order.total / 1.18 : order.total;
    const tax = receiptType === 'Fiscal' ? order.total - subtotal : 0;
    
    let ncf = '';
    if (receiptType === 'Fiscal') {
      ncf = `${settings.ncfPrefixFiscal}${settings.ncfSequenceFiscal.toString().padStart(8, '0')}`;
      setSettings(prev => ({ ...prev, ncfSequenceFiscal: prev.ncfSequenceFiscal + 1 }));
    } else if (receiptType === 'Final') {
      ncf = `${settings.ncfPrefixFinal}${settings.ncfSequenceFinal.toString().padStart(8, '0')}`;
      setSettings(prev => ({ ...prev, ncfSequenceFinal: prev.ncfSequenceFinal + 1 }));
    } else {
      ncf = 'N/A';
    }

    const newInvoice: Invoice = {
      id: `FAC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      orderId,
      date: new Date().toISOString(),
      customerName,
      rfc,
      ncf,
      receiptType,
      subtotal,
      tax,
      total: order.total,
      status: 'Pagada',
    };

    setInvoices([newInvoice, ...invoices]);
    setIsModalOpen(false);
  };

  const exportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Add Logo if exists
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 30);
      } catch (e) {
        console.error("Error adding logo to PDF", e);
      }
    }

    doc.setFontSize(20);
    doc.text('FACTURA', settings.logoUrl ? 50 : 14, 22);
    
    doc.setFontSize(10);
    doc.text(settings.name, settings.logoUrl ? 50 : 14, 28);
    doc.text(`RNC: ${settings.rnc}`, settings.logoUrl ? 50 : 14, 33);
    doc.text(settings.address, settings.logoUrl ? 50 : 14, 38);
    doc.text(`Tel: ${settings.phone} | Email: ${settings.email}`, settings.logoUrl ? 50 : 14, 43);

    doc.text(`Folio: ${invoice.id}`, 140, 22);
    doc.text(`NCF: ${invoice.ncf || 'N/A'}`, 140, 27);
    doc.text(`Fecha: ${format(new Date(invoice.date), 'dd/MM/yyyy HH:mm')}`, 140, 32);
    doc.text(`Orden Ref: ${invoice.orderId}`, 140, 37);
    
    doc.text('Facturar a:', 14, 55);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.customerName, 14, 60);
    doc.setFont(undefined, 'normal');
    doc.text(`RFC/RNC: ${invoice.rfc}`, 14, 65);
    doc.text(`Tipo: ${invoice.receiptType === 'Fiscal' ? 'Valor Fiscal' : invoice.receiptType === 'Final' ? 'Consumidor Final' : 'Constancia'}`, 14, 70);

    const order = orders.find(o => o.id === invoice.orderId);
    
    if (order) {
      autoTable(doc, {
        startY: 80,
        head: [['Producto ID', 'Cant.', 'Precio Unit.', 'Total']],
        body: order.items.map(item => [
          item.productId,
          item.quantity,
          `$${item.unitPrice.toFixed(2)}`,
          `$${item.total.toFixed(2)}`
        ]),
      });
    }

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 75;
    
    if (invoice.receiptType === 'Fiscal') {
      doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 140, finalY + 10);
      doc.text(`ITBIS (18%): $${invoice.tax.toFixed(2)}`, 140, finalY + 15);
      doc.setFont(undefined, 'bold');
      doc.text(`Total: $${invoice.total.toFixed(2)}`, 140, finalY + 20);
    } else {
      doc.setFont(undefined, 'bold');
      doc.text(`Total: $${invoice.total.toFixed(2)}`, 140, finalY + 10);
    }

    doc.save(`${invoice.id}.pdf`);
  };

  const handleDelete = (id: string) => {
    setInvoiceToDelete(id);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      setInvoices(invoices.filter(i => i.id !== invoiceToDelete));
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona las facturas de tus ventas.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-400 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 sm:w-auto transition-all transform hover:scale-[1.02]"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Generar Factura
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
              placeholder="Buscar por folio o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCF</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    <button onClick={() => setViewingInvoice(invoice)} className="hover:underline">
                      {invoice.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.ncf || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.rfc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${invoice.total.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button onClick={() => setViewingInvoice(invoice)} className="text-indigo-600 hover:text-indigo-900" title="Ver Factura">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => exportPDF(invoice)} className="text-gray-600 hover:text-indigo-600" title="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Generar Factura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-20">
              <form onSubmit={handleCreateInvoice}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Generar Factura
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">Orden de Venta</label>
                      <input 
                        list="orders-list"
                        name="orderId" 
                        id="orderId" 
                        required 
                        placeholder="Escriba el ID de la orden (ej. ORD-1234)"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <datalist id="orders-list">
                        {unbilledOrders.map(o => {
                          const customer = customers.find(c => c.id === o.customerId);
                          return (
                            <option key={o.id} value={o.id}>{customer?.name} - ${o.total}</option>
                          );
                        })}
                      </datalist>
                    </div>
                    <div>
                      <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">RFC del Cliente</label>
                      <input type="text" name="rfc" id="rfc" required placeholder="XAXX010101000" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-indigo-400 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                    Generar
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
      {/* Modal Ver Factura */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setViewingInvoice(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full relative z-20">
              <div className="bg-white px-8 pt-8 pb-6 sm:p-10 sm:pb-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                    )}
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">FACTURA</h2>
                      <p className="text-lg font-semibold text-gray-800 mt-1">{settings.name}</p>
                      <p className="text-sm text-gray-500">RNC: {settings.rnc}</p>
                      <p className="text-sm text-gray-500">{settings.address}</p>
                      <p className="text-sm text-gray-500">{settings.phone} | {settings.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-indigo-600">{viewingInvoice.id}</p>
                    <p className="text-sm font-medium text-gray-700">NCF: {viewingInvoice.ncf || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Fecha: {format(new Date(viewingInvoice.date), 'dd/MM/yyyy HH:mm')}</p>
                    <p className="text-sm text-gray-500">Orden Ref: {viewingInvoice.orderId}</p>
                  </div>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4 mb-8">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Facturar a:</h3>
                  <p className="text-base font-bold text-gray-900">{viewingInvoice.customerName}</p>
                  <p className="text-sm text-gray-600">RFC/RNC: {viewingInvoice.rfc}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Tipo: <span className="font-medium">{viewingInvoice.receiptType === 'Fiscal' ? 'Valor Fiscal' : viewingInvoice.receiptType === 'Final' ? 'Consumidor Final' : 'Constancia'}</span>
                  </p>
                </div>

                <table className="min-w-full divide-y divide-gray-200 mb-8">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.find(o => o.id === viewingInvoice.orderId)?.items.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">{product?.name || item.productId}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-right">${item.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">${item.total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-3">
                    {viewingInvoice.receiptType === 'Fiscal' ? (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span>${viewingInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>ITBIS (18%)</span>
                          <span>${viewingInvoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    ) : null}
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                      <span>Total</span>
                      <span>${viewingInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => exportPDF(viewingInvoice)} className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-indigo-400 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                  <Download className="h-4 w-4 mr-2" /> Descargar PDF
                </button>
                <button type="button" onClick={() => setViewingInvoice(null)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-200 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto transition-all transform hover:scale-[1.02]">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        title="Eliminar Factura"
        message="¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
}
