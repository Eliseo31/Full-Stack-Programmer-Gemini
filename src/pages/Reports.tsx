import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertModal } from '../components/AlertModal';

type ReportType = 'Ventas' | 'Compras' | 'Inventario' | 'Clientes' | 'Devoluciones';

export function Reports() {
  const { orders, products, customers, returns } = useAppContext();
  const [reportType, setReportType] = useState<ReportType>('Ventas');
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  const reportData = useMemo(() => {
    switch (reportType) {
      case 'Ventas':
        return orders
          .filter(o => o.type === 'Venta' && isWithinInterval(parseISO(o.date), { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') }))
          .map(o => ({
            'ID Orden': o.id,
            'Fecha': format(parseISO(o.date), 'dd/MM/yyyy HH:mm'),
            'Cliente': customers.find(c => c.id === o.customerId)?.name || 'N/A',
            'Total': o.total,
            'Estado': o.status
          }));
      case 'Compras':
        return orders
          .filter(o => o.type === 'Compra' && isWithinInterval(parseISO(o.date), { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') }))
          .map(o => ({
            'ID Orden': o.id,
            'Fecha': format(parseISO(o.date), 'dd/MM/yyyy HH:mm'),
            'Proveedor': o.supplierId || 'N/A',
            'Total': o.total,
            'Estado': o.status
          }));
      case 'Inventario':
        return products.map(p => ({
          'SKU': p.sku,
          'Nombre': p.name,
          'Categoría': p.category,
          'Stock': p.stock,
          'Precio Venta': p.price,
          'Costo': p.cost,
          'Valor Inventario': p.stock * p.cost
        }));
      case 'Clientes':
        return customers.map(c => ({
          'ID': c.id,
          'Nombre': c.name,
          'Empresa': c.company,
          'Email': c.email,
          'Teléfono': c.phone
        }));
      case 'Devoluciones':
        return returns
          .filter(r => r.date ? isWithinInterval(parseISO(r.date), { start: new Date(startDate), end: new Date(endDate + 'T23:59:59') }) : false)
          .map(r => ({
            'ID': r.id,
            'Fecha': r.date ? format(parseISO(r.date), 'dd/MM/yyyy HH:mm') : 'N/A',
            'Orden Ref': r.orderId,
            'Producto': products.find(p => p.id === r.productId)?.name || 'N/A',
            'Cant.': r.quantity,
            'Monto': r.amount || 0,
            'Motivo': r.reason
          }));
      default:
        return [];
    }
  }, [reportType, startDate, endDate, orders, products, customers, returns]);

  const exportToExcel = () => {
    if (reportData.length === 0) {
      setAlertMessage({ title: 'Aviso', message: 'No hay datos para exportar' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType);
    XLSX.writeFile(wb, `Reporte_${reportType}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      setAlertMessage({ title: 'Aviso', message: 'No hay datos para exportar' });
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Reporte de ${reportType}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
    
    if (reportType === 'Ventas' || reportType === 'Compras' || reportType === 'Devoluciones') {
      doc.text(`Periodo: ${startDate} al ${endDate}`, 14, 33);
    }

    const headers = Object.keys(reportData[0]);
    const data = reportData.map(row => headers.map(h => row[h as keyof typeof row]));

    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: data,
    });

    doc.save(`Reporte_${reportType}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">Genera y exporta reportes de tu negocio.</p>
      </div>

      <div className="bg-white shadow rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="Ventas">Ventas</option>
              <option value="Compras">Compras</option>
              <option value="Inventario">Inventario actual</option>
              <option value="Clientes">Directorio de Clientes</option>
              <option value="Devoluciones">Devoluciones</option>
            </select>
          </div>
          
          {(reportType === 'Ventas' || reportType === 'Compras' || reportType === 'Devoluciones') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}

          <div className="flex space-x-2 md:col-start-4 justify-end">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-6 py-3 border border-gray-200 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-all transform hover:scale-[1.02]"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-indigo-400 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-all transform hover:scale-[1.02]"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Vista Previa ({reportData.length} registros)
          </h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          {reportData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof val === 'number' && (Object.keys(row)[colIdx].includes('Total') || Object.keys(row)[colIdx].includes('Precio') || Object.keys(row)[colIdx].includes('Costo') || Object.keys(row)[colIdx].includes('Valor') || Object.keys(row)[colIdx].includes('Monto')) 
                          ? `$${val.toLocaleString()}` 
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay datos para mostrar en este periodo.
            </div>
          )}
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
