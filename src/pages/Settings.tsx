import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Save, Upload } from 'lucide-react';
import { AlertModal } from '../components/AlertModal';
import { api } from '../services/api';

export function Settings() {
  const { settings, setSettings } = useAppContext();
  const [formData, setFormData] = useState(settings);
  const [alertMessage, setAlertMessage] = useState<{title: string, message: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(formData);
      setSettings(formData);
      setAlertMessage({ title: 'Éxito', message: 'Configuración guardada exitosamente.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlertMessage({ title: 'Error', message: 'No se pudo guardar la configuración.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de la Empresa</h1>
        <p className="mt-1 text-sm text-gray-500">
          Esta información se utilizará en los documentos generados por el sistema, como facturas y reportes.
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group">
                {formData.logoUrl ? (
                  <div className="relative w-full h-32 flex items-center justify-center">
                    <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <p className="text-white text-sm font-medium">Cambiar Logo</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        Subir un archivo
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 2MB</p>
                  </div>
                )}
                <input
                  id="logo-upload"
                  name="logo-upload"
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="w-full sm:w-2/3 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>

              <div>
                <label htmlFor="rnc" className="block text-sm font-medium text-gray-700">RNC / Identificación</label>
                <input
                  type="text"
                  name="rnc"
                  id="rnc"
                  required
                  value={formData.rnc}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Configuración de Comprobantes Fiscales (NCF)</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ncfPrefixFiscal" className="block text-sm font-medium text-gray-700">Prefijo NCF (Valor Fiscal)</label>
                <select
                  name="ncfPrefixFiscal"
                  id="ncfPrefixFiscal"
                  value={formData.ncfPrefixFiscal}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="B01">B01 (Crédito Fiscal)</option>
                  <option value="E31">E31 (Crédito Fiscal Electrónico)</option>
                </select>
              </div>
              <div>
                <label htmlFor="ncfSequenceFiscal" className="block text-sm font-medium text-gray-700">Secuencia Actual (Valor Fiscal)</label>
                <input
                  type="number"
                  name="ncfSequenceFiscal"
                  id="ncfSequenceFiscal"
                  min="1"
                  required
                  value={formData.ncfSequenceFiscal}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>
              <div>
                <label htmlFor="ncfPrefixFinal" className="block text-sm font-medium text-gray-700">Prefijo NCF (Consumidor Final)</label>
                <select
                  name="ncfPrefixFinal"
                  id="ncfPrefixFinal"
                  value={formData.ncfPrefixFinal}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                >
                  <option value="B02">B02 (Consumidor Final)</option>
                  <option value="E32">E32 (Consumidor Final Electrónico)</option>
                </select>
              </div>
              <div>
                <label htmlFor="ncfSequenceFinal" className="block text-sm font-medium text-gray-700">Secuencia Actual (Consumidor Final)</label>
                <input
                  type="number"
                  name="ncfSequenceFinal"
                  id="ncfSequenceFinal"
                  min="1"
                  required
                  value={formData.ncfSequenceFinal}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end mt-8">
            <button
              type="submit"
              className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-indigo-400 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 items-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Save className="h-4 w-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
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
