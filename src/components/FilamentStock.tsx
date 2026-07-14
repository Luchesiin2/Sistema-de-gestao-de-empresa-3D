import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Coins, 
  Info,
  Scale,
  Settings,
  X,
  AlertTriangle,
  FlameKindling
} from 'lucide-react';
import { Filament, FilamentMaterial } from '../types';

interface FilamentStockProps {
  filaments: Filament[];
  onAddFilament: (filament: Omit<Filament, 'id'>) => void;
  onUpdateFilament: (filament: Filament) => void;
  onDeleteFilament: (id: string) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

const MATERIAL_OPTIONS: FilamentMaterial[] = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Outro'];

const PRESET_COLORS = [
  { name: 'Preto Coal', hex: '#1C1917' },
  { name: 'Branco Neve', hex: '#FAFAFA' },
  { name: 'Laranja Prusa', hex: '#FF6B00' },
  { name: 'Vermelho Fogo', hex: '#EF4444' },
  { name: 'Azul Celeste', hex: '#3B82F6' },
  { name: 'Verde Bambu', hex: '#10B981' },
  { name: 'Amarelo Sol', hex: '#FBBF24' },
  { name: 'Cinza Espacial', hex: '#6B7280' },
  { name: 'Ouro Seda', hex: '#D4AF37' },
  { name: 'Transparente', hex: '#E2E8F0' },
  { name: 'Glow Verde', hex: '#CCFF33' },
  { name: 'Rosa Chiclete', hex: '#EC4899' },
];

export default function FilamentStock({ filaments, onAddFilament, onUpdateFilament, onDeleteFilament, showConfirm }: FilamentStockProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('todos');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFilament, setSelectedFilament] = useState<Filament | null>(null);
  
  // Custom manual usage adjustments
  const [adjustingFilament, setAdjustingFilament] = useState<Filament | null>(null);
  const [adjustWeightGrams, setAdjustWeightGrams] = useState<number>(50);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    material: 'PLA' as FilamentMaterial,
    colorName: 'Laranja Prusa',
    colorHex: '#FF6B00',
    purchasePrice: 120,
    totalWeight: 1000,
    usedWeight: 0,
    lowStockThreshold: 150,
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      material: 'PLA',
      colorName: 'Laranja Prusa',
      colorHex: '#FF6B00',
      purchasePrice: 120,
      totalWeight: 1000,
      usedWeight: 0,
      lowStockThreshold: 150,
      notes: ''
    });
    setSelectedFilament(null);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand) return;

    if (selectedFilament) {
      onUpdateFilament({
        ...selectedFilament,
        ...formData
      });
    } else {
      onAddFilament(formData);
    }
    resetForm();
  };

  const handleEditClick = (filament: Filament) => {
    setSelectedFilament(filament);
    setFormData({
      name: filament.name,
      brand: filament.brand,
      material: filament.material,
      colorName: filament.colorName,
      colorHex: filament.colorHex,
      purchasePrice: filament.purchasePrice,
      totalWeight: filament.totalWeight,
      usedWeight: filament.usedWeight,
      lowStockThreshold: filament.lowStockThreshold,
      notes: filament.notes
    });
    setIsEditing(true);
    document.getElementById('filament-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickAddUsage = (filament: Filament, g: number) => {
    const nextUsed = Math.min(filament.totalWeight, filament.usedWeight + g);
    onUpdateFilament({
      ...filament,
      usedWeight: nextUsed
    });
    setAdjustingFilament(null);
  };

  const handleQuickResetUsage = (filament: Filament) => {
    onUpdateFilament({
      ...filament,
      usedWeight: 0
    });
  };

  // Filters
  const filteredFilaments = filaments.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.colorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMaterial = selectedMaterial === 'todos' || f.material === selectedMaterial;
    
    return matchesSearch && matchesMaterial;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="filaments-tab">
      
      {/* Left Columns: Filament Grid & Details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Filters Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <FlameKindling className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Bobinas em Estoque ({filaments.length})</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar filamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-850 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                id="filament-search"
              />
            </div>
            
            {/* Material selector */}
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
              id="material-filter"
            >
              <option value="todos">Todos Materiais</option>
              {MATERIAL_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filaments Grid */}
        {filteredFilaments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-xs font-sans">
            Nenhum filamento encontrado no estoque. Cadastre uma nova bobina à direita!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFilaments.map(fil => {
              const remaining = fil.totalWeight - fil.usedWeight;
              const pct = Math.max(0, Math.min(100, (remaining / fil.totalWeight) * 100));
              const costPerGram = fil.purchasePrice / fil.totalWeight;
              const isLowStock = remaining <= fil.lowStockThreshold;

              return (
                <div 
                  key={fil.id} 
                  className={`bg-white border ${
                    isLowStock ? 'border-amber-400 ring-1 ring-amber-100' : 'border-slate-200'
                  } rounded-2xl p-5 flex flex-col justify-between shadow-xs relative group hover:border-slate-350 transition-colors`}
                  id={`filament-card-${fil.id}`}
                >
                  {isLowStock && (
                    <div className="absolute top-4 right-16 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[8px] font-mono font-bold flex items-center gap-1 shadow-2xs">
                      <AlertTriangle className="w-3 h-3" />
                      REPOSIÇÃO
                    </div>
                  )}

                  {/* Top: Color indicator & Spool name */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-slate-200 shadow-md shrink-0 relative flex items-center justify-center"
                          style={{ backgroundColor: fil.colorHex }}
                        >
                          {/* Inner spool circle representation */}
                          <div className="w-2.5 h-2.5 rounded-full bg-white/70 border border-slate-350 shadow-inner"></div>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {fil.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] uppercase font-mono font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {fil.material}
                            </span>
                            <span className="text-[10px] text-slate-400">{fil.brand}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tool actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditClick(fil)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Editar"
                          id={`edit-fil-${fil.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFilament(fil.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir"
                          id={`delete-fil-${fil.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar remaining */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400 font-sans">Restante:</span>
                        <span className={`${isLowStock ? 'text-amber-600 font-bold' : 'text-slate-700 font-semibold'}`}>
                          {remaining.toFixed(0)}g / {fil.totalWeight}g
                        </span>
                        <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isLowStock ? 'bg-amber-500' : 'bg-emerald-550'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Cost specifics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-sans">Preço de Custo:</span>
                        <span className="text-slate-700 font-bold">{formatCurrency(fil.purchasePrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block font-sans">Custo por Grama:</span>
                        <span className="text-emerald-600 font-bold">{formatCurrency(costPerGram)}/g</span>
                      </div>
                    </div>
                    
                    {fil.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-1 font-sans line-clamp-1 border-t border-slate-50 pt-1.5">
                        "{fil.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions: Log Manual Usage */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => setAdjustingFilament(fil)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-[9px] uppercase tracking-wider py-1.5 rounded-lg transition-colors cursor-pointer"
                      id={`use-fil-${fil.id}`}
                    >
                      Ajustar Peso
                    </button>
                    {fil.usedWeight > 0 && (
                      <button
                        onClick={() => {
                          if (showConfirm) {
                            showConfirm(
                              'Resetar Uso',
                              'Deseja mesmo resetar o uso desta bobina para 0g?',
                              () => handleQuickResetUsage(fil)
                            );
                          } else if (confirm('Deseja mesmo resetar o uso desta bobina para 0g?')) {
                            handleQuickResetUsage(fil);
                          }
                        }}
                        className="bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg text-[10px] transition-colors border border-slate-200 cursor-pointer"
                        title="Resetar peso consumido para 0"
                        id={`reset-use-${fil.id}`}
                      >
                        Resetar Uso
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Adjust Filament weight manually */}
        {adjustingFilament && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Ajustar Peso da Bobina
                </h3>
                <button 
                  onClick={() => setAdjustingFilament(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 border border-slate-150 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-500 font-sans leading-relaxed">
                Você está ajustando o uso da bobina <strong>{adjustingFilament.name}</strong>. Insira abaixo o peso correspondente ao consumo ou perda de filamento.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Consumir Gramas (+)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={adjustingFilament.totalWeight - adjustingFilament.usedWeight}
                    value={adjustWeightGrams}
                    onChange={(e) => setAdjustWeightGrams(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-indigo-500 font-mono"
                    id="adjust-weight-input"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-mono text-xs">g</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono block">Disponível em carretel: {(adjustingFilament.totalWeight - adjustingFilament.usedWeight).toFixed(0)}g</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleQuickAddUsage(adjustingFilament, adjustWeightGrams)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  id="confirm-adjust-btn"
                >
                  Confirmar Uso
                </button>
                <button
                  onClick={() => setAdjustingFilament(null)}
                  className="bg-slate-100 text-slate-500 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Right Column: Add/Edit Filament Form */}
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5" id="filament-form-card">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 bg-slate-50/50 -m-5 mb-0 p-5 rounded-t-2xl">
            <Layers className="w-4.5 h-4.5 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              {isEditing ? 'Editar Bobina' : 'Cadastrar Bobina'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Nome do Filamento *</label>
              <input
                type="text"
                required
                placeholder="Ex: PLA Preto Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                id="form-fil-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 3D Fila, Esun"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  id="form-fil-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Material *</label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value as FilamentMaterial })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                  id="form-fil-material"
                >
                  {MATERIAL_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color section */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Cor do Filamento</label>
              
              {/* Preset grids */}
              <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorName: color.name, colorHex: color.hex })}
                    className={`w-full h-7 rounded-full border relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      formData.colorHex === color.hex ? 'border-indigo-500 ring-1 ring-indigo-100 scale-105 shadow-md' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {formData.colorHex === color.hex && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white border border-slate-400"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Nome da Cor</span>
                  <input
                    type="text"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    id="form-fil-color-name"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Hexadecimal</span>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={formData.colorHex}
                      onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                      className="w-8 h-8 bg-transparent border-0 cursor-pointer outline-none shrink-0"
                      id="form-fil-color-picker"
                    />
                    <input
                      type="text"
                      value={formData.colorHex}
                      onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 font-mono focus:border-indigo-500 focus:ring-1"
                      id="form-fil-color-hex"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Weight and Purchase Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Preço Pago (R$)</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.01}
                  required
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                  id="form-fil-price"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Peso Total (g)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.totalWeight}
                  onChange={(e) => setFormData({ ...formData, totalWeight: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                  id="form-fil-weight"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Já Consumido (g)</label>
                <input
                  type="number"
                  min={0}
                  max={formData.totalWeight}
                  required
                  value={formData.usedWeight}
                  onChange={(e) => setFormData({ ...formData, usedWeight: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                  id="form-fil-used-weight"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Alerta Mínimo (g)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                  id="form-fil-threshold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Notas / Fornecedor</label>
              <textarea
                placeholder="Ex: Fornecedor oficial, temperatura ideal 205C..."
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                id="form-fil-notes"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg py-2.5 transition-colors cursor-pointer shadow-xs uppercase tracking-wider"
                id="form-fil-submit"
              >
                {isEditing ? 'Salvar Bobina' : 'Adicionar Bobina'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-lg px-3.5 py-2.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
