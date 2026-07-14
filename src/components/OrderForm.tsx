import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  UploadCloud, 
  Calculator,
  Activity,
  Settings,
  Camera,
  Calendar,
  User,
  Coins,
  Plus,
  Users
} from 'lucide-react';
import { Client, Filament, Order, PrintingSettings } from '../types';

interface OrderFormProps {
  clients: Client[];
  filaments: Filament[];
  initialOrder?: Order;
  settings: PrintingSettings;
  onSubmit: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function OrderForm({ clients, filaments, initialOrder, settings, onSubmit, onCancel }: OrderFormProps) {
  const [clientId, setClientId] = useState(initialOrder?.clientId || '');
  const [title, setTitle] = useState(initialOrder?.title || '');
  const [status, setStatus] = useState(initialOrder?.status || 'orcamento');
  const [filamentId, setFilamentId] = useState(initialOrder?.filamentId || '');
  
  // Raw parameters
  const [modelWeightGrams, setModelWeightGrams] = useState(initialOrder?.modelWeightGrams || 0);
  const [printTimeHours, setPrintTimeHours] = useState(initialOrder?.printTimeHours || 0);
  const [printTimeMinutes, setPrintTimeMinutes] = useState(initialOrder?.printTimeMinutes || 0);
  
  // Calibration default constants
  const [printerPowerWatts, setPrinterPowerWatts] = useState(initialOrder?.printerPowerWatts || settings.defaultPrinterPowerWatts);
  const [electricityCostKwh, setElectricityCostKwh] = useState(initialOrder?.electricityCostKwh || settings.defaultElectricityCostKwh);
  const [printerDepreciationPerHour, setPrinterDepreciationPerHour] = useState(initialOrder?.printerDepreciationPerHour || settings.defaultPrinterDepreciationPerHour);
  const [laborHourlyRate, setLaborHourlyRate] = useState(initialOrder?.laborHourlyRate || settings.defaultLaborHourlyRate);
  const [laborHoursNeeded, setLaborHoursNeeded] = useState(initialOrder?.laborHoursNeeded || 0.5);
  const [otherCosts, setOtherCosts] = useState(initialOrder?.otherCosts || 0);
  const [markupPercent, setMarkupPercent] = useState(initialOrder?.markupPercent || settings.defaultMarkupPercent);
  const [notes, setNotes] = useState(initialOrder?.notes || '');
  const [paymentDate, setPaymentDate] = useState(initialOrder?.paymentDate || '');
  const [deliveryDate, setDeliveryDate] = useState(initialOrder?.deliveryDate || '');
  const [photos, setPhotos] = useState<string[]>(initialOrder?.photos || []);

  // Multi-filament states
  const [useMultiFilament, setUseMultiFilament] = useState(!!initialOrder?.filamentsUsed && initialOrder.filamentsUsed.length > 0);
  const [filamentsUsed, setFilamentsUsed] = useState<Array<{ filamentId: string; weightGrams: number }>>(
    initialOrder?.filamentsUsed && initialOrder.filamentsUsed.length > 0
      ? initialOrder.filamentsUsed
      : [{ filamentId: initialOrder?.filamentId || (filaments[0]?.id || ''), weightGrams: initialOrder?.modelWeightGrams || 0 }]
  );

  // Optional calibration pricing configurations and print time toggles
  const [enableHardwarePricing, setEnableHardwarePricing] = useState(
    initialOrder ? (initialOrder.printerPowerWatts > 0 || initialOrder.printerDepreciationPerHour > 0) : true
  );
  const [enablePrintTime, setEnablePrintTime] = useState(
    initialOrder ? (initialOrder.printTimeHours > 0 || initialOrder.printTimeMinutes > 0) : true
  );
  const [enableLaborPricing, setEnableLaborPricing] = useState(
    initialOrder ? (initialOrder.laborHourlyRate > 0 && initialOrder.laborHoursNeeded > 0) : true
  );

  // Auto-set first filament if none is selected
  useEffect(() => {
    if (!filamentId && filaments.length > 0) {
      setFilamentId(filaments[0].id);
    }
  }, [filaments, filamentId]);

  // Calculations
  const selectedFilament = filaments.find(f => f.id === (useMultiFilament ? (filamentsUsed[0]?.filamentId || filamentId) : filamentId));
  const filamentCostPerGram = selectedFilament ? (selectedFilament.purchasePrice / selectedFilament.totalWeight) : 0.12; // default cost per gram if no filament

  let totalGrams = 0;
  let materialCost = 0;

  if (useMultiFilament) {
    filamentsUsed.forEach(row => {
      const fil = filaments.find(f => f.id === row.filamentId);
      const costPerG = fil ? (fil.purchasePrice / fil.totalWeight) : 0.12;
      totalGrams += row.weightGrams;
      materialCost += row.weightGrams * costPerG;
    });
  } else {
    totalGrams = modelWeightGrams;
    materialCost = totalGrams * filamentCostPerGram;
  }

  const actualPrintTimeHours = enablePrintTime ? printTimeHours : 0;
  const actualPrintTimeMinutes = enablePrintTime ? printTimeMinutes : 0;
  const totalTimeHours = actualPrintTimeHours + (actualPrintTimeMinutes / 60);

  const electricityCost = enableHardwarePricing 
    ? (printerPowerWatts / 1000) * totalTimeHours * electricityCostKwh 
    : 0;

  const depreciationCost = enableHardwarePricing 
    ? totalTimeHours * printerDepreciationPerHour 
    : 0;

  const laborCost = enableLaborPricing 
    ? laborHoursNeeded * laborHourlyRate 
    : 0;

  // Baseline calculated cost
  const calculatedCost = materialCost + electricityCost + depreciationCost + laborCost + otherCosts;
  
  // Final Price with Markup
  const finalPrice = calculatedCost * (1 + markupPercent / 100);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue; // ensure it's an image
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Selecione ou crie um cliente primeiro!');
      return;
    }
    if (!title) {
      alert('Digite o título ou descrição do pedido!');
      return;
    }

    onSubmit({
      clientId,
      title,
      status,
      filamentId: useMultiFilament ? (filamentsUsed[0]?.filamentId || '') : filamentId,
      filamentsUsed: useMultiFilament ? filamentsUsed : undefined,
      stlFiles: initialOrder?.stlFiles || [], // empty or preserved from original
      modelWeightGrams: totalGrams,
      supportWeightGrams: 0, // removed support weight
      printTimeHours: actualPrintTimeHours,
      printTimeMinutes: actualPrintTimeMinutes,
      printerPowerWatts: enableHardwarePricing ? printerPowerWatts : 0,
      electricityCostKwh: enableHardwarePricing ? electricityCostKwh : 0,
      printerDepreciationPerHour: enableHardwarePricing ? printerDepreciationPerHour : 0,
      laborHourlyRate: enableLaborPricing ? laborHourlyRate : 0,
      laborHoursNeeded: enableLaborPricing ? laborHoursNeeded : 0,
      otherCosts,
      markupPercent,
      calculatedCost,
      finalPrice,
      notes,
      paymentDate,
      deliveryDate,
      photos
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="order-form-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-850">
            {initialOrder ? `Editar Pedido / Orçamento ${initialOrder.orderNumber}` : 'Novo Orçamento & Calculador de Custos'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer font-bold"
          id="btn-cancel-order"
        >
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmitForm} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Primary Data, File attachments, and STL preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Basic info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-600" />
              1. Identificação do Pedido
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Selecione o Cliente *</label>
                {clients.length === 0 ? (
                  <div className="text-xs text-slate-400 pt-2 font-mono">
                    Nenhum cliente cadastrado! Vá em "Clientes" e crie um primeiro.
                  </div>
                ) : (
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-850 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                    id="order-client-select"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Título / Nome do Projeto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Miniatura de Dragão Poseidon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  id="order-title-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-850 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                  id="order-status-select"
                >
                  <option value="orcamento">Orçamento (Aguardando Aprovação)</option>
                  <option value="aprovado">Aprovado (Fila de Impressão)</option>
                  <option value="impressao">Imprimindo</option>
                  <option value="acabamento">Acabamento / Pós-processamento</option>
                  <option value="concluido">Pronto para Entrega</option>
                  <option value="entregue">Entregue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Data de Entrada
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                  id="order-payment-date"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Data de Saída (Envio)
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                  id="order-delivery-date"
                />
              </div>
            </div>
          </div>

          {/* Section: Photos of the Order */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                2. Fotos do Pedido do Cliente
              </span>
              <span className="text-[9px] text-slate-400 lowercase">Anexe fotos de referência ou amostras do projeto</span>
            </h3>

            <div className="space-y-4">
              {/* Photo Upload Zone */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 transition-all cursor-pointer bg-slate-50/50 hover:bg-indigo-50/5 text-center group">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-700">Clique para selecionar ou arraste fotos</span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">PNG, JPG ou GIF (várias permitidas)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Photos Gallery */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                      <img
                        src={photo}
                        alt={`Foto do pedido ${index + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-xs cursor-pointer"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                  <span className="text-xs text-slate-400 italic font-mono">Nenhuma foto adicionada para este pedido ainda.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Manual Cost parameter controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              3. Parâmetros Detalhados do Processo
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Filament weight inputs & Multi-filament */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>Consumo de Filamento</span>
                    <span className="font-mono text-indigo-600 text-[11px]">({totalGrams}g total)</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-sans font-bold text-slate-500 uppercase">Várias Cores:</span>
                    <label className="relative inline-flex items-center cursor-pointer scale-75">
                      <input 
                        type="checkbox" 
                        checked={useMultiFilament}
                        onChange={(e) => setUseMultiFilament(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {!useMultiFilament ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Filamento Escolhido *</label>
                      {filaments.length === 0 ? (
                        <div className="text-xs text-slate-400 pt-2 font-mono">
                          Nenhum filamento no estoque! Vá em "Filamentos" e cadastre.
                        </div>
                      ) : (
                        <select
                          required={!useMultiFilament}
                          value={filamentId}
                          onChange={(e) => setFilamentId(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-855 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                          id="order-filament-select"
                        >
                          {filaments.map(f => {
                            const rem = f.totalWeight - f.usedWeight;
                            return (
                              <option key={f.id} value={f.id}>
                                {f.material} - {f.name} ({f.brand}) | Resta {rem.toFixed(0)}g
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Valor Total do Projeto (g)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Digite o peso total em gramas"
                        value={modelWeightGrams || ''}
                        onChange={(e) => setModelWeightGrams(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[9px] text-slate-400 font-sans leading-tight">Peso total incluindo raft e suportes se houver.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filamentsUsed.map((row, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white border border-slate-150 p-2 rounded-lg">
                        <div className="flex-1">
                          <label className="text-[9px] uppercase font-mono text-slate-400 block mb-0.5">Cor / Filamento {index + 1}</label>
                          <select
                            value={row.filamentId}
                            onChange={(e) => {
                              const updated = [...filamentsUsed];
                              updated[index].filamentId = e.target.value;
                              setFilamentsUsed(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                          >
                            <option value="">-- Escolha o Filamento --</option>
                            {filaments.map(f => {
                              const rem = f.totalWeight - f.usedWeight;
                              return (
                                <option key={f.id} value={f.id}>
                                  {f.material} - {f.name} ({f.brand}) | Resta {rem.toFixed(0)}g
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-20">
                          <label className="text-[9px] uppercase font-mono text-slate-400 block mb-0.5">Peso (g)</label>
                          <input
                            type="number"
                            min={0}
                            value={row.weightGrams || ''}
                            onChange={(e) => {
                              const updated = [...filamentsUsed];
                              updated[index].weightGrams = Number(e.target.value);
                              setFilamentsUsed(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 font-mono focus:outline-none focus:border-indigo-500 text-right"
                            placeholder="Ex: 50"
                          />
                        </div>

                        {filamentsUsed.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilamentsUsed(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="mt-3.5 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Remover cor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setFilamentsUsed(prev => [...prev, { filamentId: filaments[0]?.id || '', weightGrams: 0 }]);
                      }}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-bold font-mono uppercase tracking-wider pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Cor / Filamento
                    </button>
                  </div>
                )}
              </div>

              {/* Printing Time inputs */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span>Tempo de Impressão</span>
                    {enablePrintTime && (
                      <span className="font-mono text-indigo-600 text-[11px]">{printTimeHours}h {printTimeMinutes}m</span>
                    )}
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer scale-75">
                    <input 
                      type="checkbox" 
                      checked={enablePrintTime}
                      onChange={(e) => setEnablePrintTime(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {enablePrintTime ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Horas</label>
                      <input
                        type="number"
                        min={0}
                        value={printTimeHours || ''}
                        onChange={(e) => setPrintTimeHours(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono text-slate-400 font-bold">Minutos</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={printTimeMinutes || ''}
                        onChange={(e) => setPrintTimeMinutes(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-sans italic text-center p-6 bg-white/50 border border-dashed border-slate-200 rounded-lg">
                    Cálculo de tempo desativado (0h 0m)
                  </div>
                )}
              </div>

            </div>

            {/* Custom Calibration Settings accordion / detail */}
            <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Tarifação de Hardware
                </h4>
                <label className="relative inline-flex items-center cursor-pointer scale-75">
                  <input 
                    type="checkbox" 
                    checked={enableHardwarePricing}
                    onChange={(e) => setEnableHardwarePricing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {enableHardwarePricing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Potência (W)</span>
                    <input
                      type="number"
                      value={printerPowerWatts}
                      onChange={(e) => setPrinterPowerWatts(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Energia (R$/kWh)</span>
                    <input
                      type="number"
                      step={0.01}
                      value={electricityCostKwh}
                      onChange={(e) => setElectricityCostKwh(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Desgaste/h (R$)</span>
                    <input
                      type="number"
                      step={0.05}
                      value={printerDepreciationPerHour}
                      onChange={(e) => setPrinterDepreciationPerHour(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-sans italic text-center p-3 bg-white/50 border border-dashed border-slate-200 rounded-lg">
                  Consumo elétrico e desgaste da máquina desativados (R$ 0,00)
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-200 pt-1 pb-1.5">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Mão de Obra & Extras
                </h4>
                <label className="relative inline-flex items-center cursor-pointer scale-75">
                  <input 
                    type="checkbox" 
                    checked={enableLaborPricing}
                    onChange={(e) => setEnableLaborPricing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {enableLaborPricing ? (
                  <>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Mão de Obra/h (R$)</span>
                      <input
                        type="number"
                        value={laborHourlyRate}
                        onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Tempo de Pós-Processo (h)</span>
                      <input
                        type="number"
                        step={0.1}
                        value={laborHoursNeeded}
                        onChange={(e) => setLaborHoursNeeded(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 text-[10px] text-slate-400 font-sans italic text-center p-3 bg-white/50 border border-dashed border-slate-200 rounded-lg">
                    Cobrança de mão de obra desativada (R$ 0,00)
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase block">Insumos Extras (R$)</span>
                  <input
                    type="number"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Instruções de Produção / Observações</label>
              <textarea
                placeholder="Ex: Altura de camada 0.2mm, infill 20% giroscópio, requer suportes orgânicos..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                id="order-notes-textarea"
              />
            </div>
          </div>

        </div>

        {/* Col 3: Detailed Invoice breakdown & Price margin controls */}
        <div className="space-y-6">
          
          {/* Price setting card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Definição de Preço
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">
                <span>Margem de Lucro (Markup %)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex: 100"
                />
                <span className="text-slate-500 font-mono text-sm font-bold">%</span>
              </div>
              <p className="text-[9px] text-slate-400 font-sans leading-normal">
                Insira qualquer valor de margem de lucro sem limites. O preço sugerido será atualizado automaticamente.
              </p>
            </div>
          </div>

          {/* Paper Invoice design breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono shadow-xs relative overflow-hidden text-xs">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="text-slate-800 font-bold uppercase tracking-widest text-[11px]">Ficha de Orçamento</h3>
              <span className="text-[9px] text-slate-400 font-bold">SISTEMA DE PRECIFICAÇÃO AUTOMÁTICA</span>
            </div>

            <div className="py-4 space-y-3 border-b border-dashed border-slate-250">
              {/* Material */}
              <div className="flex justify-between text-slate-650">
                <span>Material ({totalGrams}g):</span>
                <span className="text-slate-800 font-bold">{formatCurrency(materialCost)}</span>
              </div>
              <div className="pl-3 text-[10px] text-slate-400 flex justify-between font-sans">
                <span>{selectedFilament ? `${selectedFilament.material} - ${selectedFilament.name}` : 'Filamento genérico'}</span>
                <span className="font-mono">{formatCurrency(filamentCostPerGram)}/g</span>
              </div>

              {/* Energy */}
              <div className="flex justify-between text-slate-655">
                <span>Energia ({totalTimeHours.toFixed(1)}h):</span>
                <span className="text-slate-850 font-bold">{formatCurrency(electricityCost)}</span>
              </div>
              <div className="pl-3 text-[10px] text-slate-400 flex justify-between font-sans">
                <span>{printerPowerWatts}W @ {electricityCostKwh.toFixed(2)}/kWh</span>
                <span></span>
              </div>

              {/* Wear */}
              <div className="flex justify-between text-slate-655">
                <span>Desgaste de Hardware:</span>
                <span className="text-slate-850 font-bold">{formatCurrency(depreciationCost)}</span>
              </div>
              <div className="pl-3 text-[10px] text-slate-400 flex justify-between font-sans">
                <span>Máquina @ {formatCurrency(printerDepreciationPerHour)}/h</span>
                <span></span>
              </div>

              {/* Labor */}
              <div className="flex justify-between text-slate-655">
                <span>Mão de Obra ({laborHoursNeeded}h):</span>
                <span className="text-slate-850 font-bold">{formatCurrency(laborCost)}</span>
              </div>
              <div className="pl-3 text-[10px] text-slate-400 flex justify-between font-sans">
                <span>Pós-processamento @ {formatCurrency(laborHourlyRate)}/h</span>
                <span></span>
              </div>

              {/* Extras */}
              {otherCosts > 0 && (
                <div className="flex justify-between text-slate-655">
                  <span>Insumos adicionais:</span>
                  <span className="text-slate-850 font-bold">{formatCurrency(otherCosts)}</span>
                </div>
              )}
            </div>

            {/* Total Pure Cost vs Sale Price */}
            <div className="py-3 space-y-2">
              <div className="flex justify-between text-slate-500 font-sans">
                <span>CUSTO DE PRODUÇÃO:</span>
                <span className="text-slate-700 font-bold font-mono">{formatCurrency(calculatedCost)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-sans">
                <span>LUCRO ({markupPercent}%):</span>
                <span className="text-emerald-600 font-bold font-mono">{formatCurrency(finalPrice - calculatedCost)}</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between">
              <span className="text-slate-800 font-bold text-xs">VALOR SUGERIDO:</span>
              <span className="text-lg font-black text-indigo-650 animate-pulse">{formatCurrency(finalPrice)}</span>
            </div>

            <div className="pt-2 text-center text-[9px] text-slate-400 font-sans">
              * Valores calculados com base no perfil de tarifação ativo.
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs uppercase tracking-wider"
              id="submit-order-form"
            >
              <Coins className="w-4 h-4" />
              {initialOrder ? 'Salvar Alterações' : 'Gerar Pedido/Orçamento'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-slate-100 text-slate-500 hover:text-slate-750 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold text-xs py-3 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
