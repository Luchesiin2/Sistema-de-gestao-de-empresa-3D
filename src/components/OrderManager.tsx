import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  CheckSquare, 
  Play, 
  ArrowRight, 
  Printer, 
  Scissors, 
  PackageCheck, 
  FileText,
  Clock,
  User,
  Scale,
  Settings,
  X,
  Sparkles,
  HelpCircle,
  Calendar,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { Client, Filament, Order, OrderStatus } from '../types';

interface OrderManagerProps {
  orders: Order[];
  clients: Client[];
  filaments: Filament[];
  onAddOrderClick: () => void;
  onEditOrderClick: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrderStatus: (id: string, nextStatus: OrderStatus) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

const STATUS_TABS: { status: 'todos' | OrderStatus; label: string; color: string }[] = [
  { status: 'todos', label: 'Todos', color: 'bg-slate-100 text-slate-600' },
  { status: 'orcamento', label: 'Orçamentos', color: 'bg-slate-100 text-slate-500' },
  { status: 'aprovado', label: 'Aprovados', color: 'bg-indigo-50 text-indigo-700' },
  { status: 'impressao', label: 'Impressão', color: 'bg-amber-50 text-amber-700' },
  { status: 'acabamento', label: 'Acabamento', color: 'bg-rose-50 text-rose-700' },
  { status: 'concluido', label: 'Prontos', color: 'bg-emerald-50 text-emerald-700' },
  { status: 'entregue', label: 'Entregues', color: 'bg-slate-100 text-slate-400' }
];

export default function OrderManager({ orders, clients, filaments, onAddOrderClick, onEditOrderClick, onDeleteOrder, onUpdateOrderStatus, showConfirm }: OrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | OrderStatus>('todos');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  // Interactive checklist state (persisted locally during view, or we can seed it)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    slicing: false,
    bedCleaning: false,
    bedLeveling: false,
    filamentLoad: false,
    firstLayerCheck: false,
    supportRemoval: false,
    sanding: false,
    qualityCheck: false,
  });

  // Filters
  const filteredOrders = orders.filter(order => {
    const clientName = clients.find(c => c.id === order.clientId)?.name || '';
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'todos' || order.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Excluído';
  };

  const getFilamentDetails = (filamentId: string) => {
    const fil = filaments.find(f => f.id === filamentId);
    return fil ? `${fil.material} - ${fil.name} (${fil.brand})` : 'Filamento não selecionado';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getDeadlineBadge = (order: Order) => {
    if (order.status === 'entregue' || !order.deliveryDate) return null;
    const targetDate = new Date(order.deliveryDate + 'T00:00:00');
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    targetDate.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isOverdue = diffDays < 0;
    
    if (diffDays <= 3) {
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
          isOverdue 
            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
            : 'bg-amber-50 text-amber-850 border border-amber-200'
        }`} title={`Data de Saída: ${new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}>
          <AlertTriangle className="w-3 h-3 text-current shrink-0" />
          <span>
            {isOverdue 
              ? `Atrasado ${Math.abs(diffDays)}d` 
              : diffDays === 0 
                ? 'Hoje!' 
                : diffDays === 1 
                  ? 'Amanhã!' 
                  : `Prazo: ${diffDays}d`}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-50 text-slate-500 border border-slate-200">
        <Calendar className="w-3 h-3 text-current shrink-0" />
        <span>Prazo: {new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
      </span>
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'orcamento':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">Orçamento</span>;
      case 'aprovado':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Aprovado</span>;
      case 'impressao':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Em Impressão</span>;
      case 'acabamento':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">Acabamento</span>;
      case 'concluido':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pronto</span>;
      case 'entregue':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-slate-100 text-slate-400 border border-slate-200">Entregue</span>;
    }
  };

  // Set checklists dynamically based on order status for immersion
  const openOrderDetails = (order: Order) => {
    setViewingOrder(order);
    
    // Seed checklists based on current status for a realistic maker flow
    setChecklist({
      slicing: ['aprovado', 'impressao', 'acabamento', 'concluido', 'entregue'].includes(order.status),
      bedCleaning: ['impressao', 'acabamento', 'concluido', 'entregue'].includes(order.status),
      bedLeveling: ['impressao', 'acabamento', 'concluido', 'entregue'].includes(order.status),
      filamentLoad: ['impressao', 'acabamento', 'concluido', 'entregue'].includes(order.status),
      firstLayerCheck: ['impressao', 'acabamento', 'concluido', 'entregue'].includes(order.status),
      supportRemoval: ['acabamento', 'concluido', 'entregue'].includes(order.status),
      sanding: ['concluido', 'entregue'].includes(order.status),
      qualityCheck: ['concluido', 'entregue'].includes(order.status),
    });
  };

  const handleToggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="orders-tab">
      
      {/* Header and top controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Gerenciar Pedidos ({orders.length})</h2>
          </div>
          <button
            onClick={onAddOrderClick}
            className="md:hidden bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            + Novo Orçamento
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por peça ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              id="order-search"
            />
          </div>
          
          <button
            onClick={onAddOrderClick}
            className="hidden md:block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            id="create-order-btn"
          >
            + Novo Orçamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" id="order-tabs">
        {STATUS_TABS.map(tab => {
          const count = tab.status === 'todos' 
            ? orders.length 
            : orders.filter(o => o.status === tab.status).length;
          
          const isSelected = activeTab === tab.status;

          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono shrink-0 transition-all cursor-pointer border ${
                isSelected 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {tab.label} <span className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders List Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-xs font-mono">
          Nenhum pedido encontrado para esta categoria.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="orders-list">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  <th className="p-4">Pedido</th>
                  <th className="p-4">Projeto / Peça</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Peso total</th>
                  <th className="p-4">Preço sugerido</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                {filteredOrders.map(order => {
                  const clientName = getClientName(order.clientId);
                  const totalGrams = order.modelWeightGrams + order.supportWeightGrams;

                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => openOrderDetails(order)}
                      id={`order-row-${order.id}`}
                    >
                      <td className="p-4 font-mono font-bold text-indigo-650">{order.orderNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-2">
                          <span>{order.title}</span>
                          {getDeadlineBadge(order)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5 font-bold">
                          <span>{order.printTimeHours}h {order.printTimeMinutes}m</span>
                          <span>•</span>
                          {order.stlFiles.length > 0 ? (
                            <>
                              <span>{order.stlFiles.length} STL(s)</span>
                              <span>•</span>
                            </>
                          ) : null}
                          {order.photos && order.photos.length > 0 ? (
                            <>
                              <span className="flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5 text-slate-400" />
                                {order.photos.length} {order.photos.length === 1 ? 'foto' : 'fotos'}
                              </span>
                              <span>•</span>
                            </>
                          ) : null}
                          {order.paymentDate && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 bg-emerald-50 px-1 rounded" title="Data de Entrada / Pagamento">
                                Pago: {new Date(order.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-bold">{clientName}</td>
                      <td className="p-4 font-mono text-slate-500 font-semibold">{totalGrams}g</td>
                      <td className="p-4 font-mono font-bold text-indigo-600">{formatCurrency(order.finalPrice)}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalhes"
                            id={`view-order-${order.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditOrderClick(order)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                            id={`edit-order-${order.id}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                            id={`delete-order-${order.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Order production details */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-8 animate-scale-up" id="order-details-modal">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                  Ficha de Produção • {viewingOrder.orderNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">{viewingOrder.title}</h3>
              </div>
              <button 
                onClick={() => setViewingOrder(null)}
                className="p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              
              {/* Col 1 & 2: Checklist & STLs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Maker Step-by-Step checklist */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Fluxo de Produção / Checklist
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Marque as etapas executadas. Algumas etapas estão pré-ativadas com base no status do pedido.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {/* Slicing */}
                    <button
                      onClick={() => handleToggleCheck('slicing')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.slicing 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.slicing} 
                        onChange={() => {}} // handled by button
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">1. Fatiamento 3D</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Gerar G-code no fatiador</span>
                      </div>
                    </button>

                    {/* Cleaning */}
                    <button
                      onClick={() => handleToggleCheck('bedCleaning')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.bedCleaning 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.bedCleaning} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">2. Limpeza da Mesa</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Passar álcool isopropílico</span>
                      </div>
                    </button>

                    {/* Leveling */}
                    <button
                      onClick={() => handleToggleCheck('bedLeveling')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.bedLeveling 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.bedLeveling} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">3. Nivelamento</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Calibrar mesa e Z-offset</span>
                      </div>
                    </button>

                    {/* Filament load */}
                    <button
                      onClick={() => handleToggleCheck('filamentLoad')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.filamentLoad 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.filamentLoad} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">4. Carga do Filamento</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Aquecer e purgar filamento</span>
                      </div>
                    </button>

                    {/* First Layer */}
                    <button
                      onClick={() => handleToggleCheck('firstLayerCheck')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.firstLayerCheck 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.firstLayerCheck} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">5. Primeira Camada</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Verificar adesão e linhas</span>
                      </div>
                    </button>

                    {/* Supports */}
                    <button
                      onClick={() => handleToggleCheck('supportRemoval')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.supportRemoval 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.supportRemoval} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">6. Remover Suportes</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Limpar pontes e rebarbas</span>
                      </div>
                    </button>

                    {/* Finishing */}
                    <button
                      onClick={() => handleToggleCheck('sanding')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.sanding 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.sanding} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">7. Pós-Processamento</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Lixamento, primer ou pintura</span>
                      </div>
                    </button>

                    {/* Quality check */}
                    <button
                      onClick={() => handleToggleCheck('qualityCheck')}
                      className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs cursor-pointer ${
                        checklist.qualityCheck 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist.qualityCheck} 
                        onChange={() => {}}
                        className="accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold block text-slate-800">8. Inspeção Final</span>
                        <span className="text-[9px] text-slate-400 block font-bold">Qualidade, encaixes e peso</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Fotos de Referência do Pedido */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Fotos de Referência do Pedido ({viewingOrder.photos?.length || 0})
                  </h4>
                  
                  {!viewingOrder.photos || viewingOrder.photos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-mono bg-slate-50 p-4 rounded-xl border border-slate-150 text-center">Nenhuma foto anexada a este pedido.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingOrder.photos.map((photo, index) => (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
                          <img
                            src={photo}
                            alt={`Referência ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <a 
                            href={photo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold tracking-wider uppercase font-mono"
                          >
                            Ampliar
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Col 3: Side summary & State evolution */}
              <div className="space-y-6">
                
                {/* Advanced state progress panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Evolução do Status
                  </h4>

                  <div className="space-y-3">
                    {/* Current Badge */}
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-500 font-bold">Estado Atual:</span>
                      {getStatusBadge(viewingOrder.status)}
                    </div>

                    {/* Progress actions based on current status */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      
                      {viewingOrder.status === 'orcamento' && (
                        <button
                          onClick={() => onUpdateOrderStatus(viewingOrder.id, 'aprovado')}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="w-4 h-4" />
                          Aprovar Orçamento
                        </button>
                      )}

                      {viewingOrder.status === 'aprovado' && (
                        <button
                          onClick={() => onUpdateOrderStatus(viewingOrder.id, 'impressao')}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-4 h-4" />
                          Iniciar Impressão
                        </button>
                      )}

                      {viewingOrder.status === 'impressao' && (
                        <button
                          onClick={() => onUpdateOrderStatus(viewingOrder.id, 'acabamento')}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Scissors className="w-4 h-4" />
                          Mover para Acabamento
                        </button>
                      )}

                      {viewingOrder.status === 'acabamento' && (
                        <button
                          onClick={() => onUpdateOrderStatus(viewingOrder.id, 'concluido')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <PackageCheck className="w-4 h-4" />
                          Concluir Produção
                        </button>
                      )}

                      {viewingOrder.status === 'concluido' && (
                        <button
                          onClick={() => onUpdateOrderStatus(viewingOrder.id, 'entregue')}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          Marcar como Entregue
                        </button>
                      )}

                      {/* Jump back step if needed */}
                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1">Mudar Status Manualmente:</span>
                        <div className="grid grid-cols-3 gap-1">
                          {['orcamento', 'aprovado', 'impressao', 'acabamento', 'concluido', 'entregue'].map(s => {
                            if (s === viewingOrder.status) return null;
                            return (
                              <button
                                key={s}
                                onClick={() => onUpdateOrderStatus(viewingOrder.id, s as any)}
                                className="bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-[9px] font-mono py-1 rounded transition-colors cursor-pointer font-bold"
                              >
                                {s === 'orcamento' ? 'Orç.' :
                                 s === 'aprovado' ? 'Aprov.' :
                                 s === 'impressao' ? 'Impr.' :
                                 s === 'acabamento' ? 'Acab.' :
                                 s === 'concluido' ? 'Pronto' : 'Entr.'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Datas Importantes side-card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Prazos & Datas
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-500 font-bold">Data de Entrada:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-150">
                        {viewingOrder.paymentDate 
                          ? new Date(viewingOrder.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR') 
                          : 'Sem data de entrada'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-500 font-bold">Data de Saída:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-150">
                        {viewingOrder.deliveryDate 
                          ? new Date(viewingOrder.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') 
                          : 'Sem data de saída'}
                      </span>
                    </div>

                    {viewingOrder.deliveryDate && viewingOrder.status !== 'entregue' && (
                      <div className="pt-1.5 border-t border-slate-200">
                        {(() => {
                          const targetDate = new Date(viewingOrder.deliveryDate + 'T00:00:00');
                          const currentDate = new Date();
                          currentDate.setHours(0,0,0,0);
                          targetDate.setHours(0,0,0,0);
                          const diffTime = targetDate.getTime() - currentDate.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const isOverdue = diffDays < 0;

                          if (diffDays <= 3) {
                            return (
                              <div className={`p-2 rounded-lg border text-[11px] font-sans flex items-start gap-1.5 leading-normal ${
                                isOverdue 
                                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}>
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-current shrink-0" />
                                <div>
                                  <span className="font-bold block">
                                    {isOverdue 
                                      ? `Atrasado há ${Math.abs(diffDays)} dia(s)!` 
                                      : diffDays === 0 
                                        ? 'O envio é HOJE!' 
                                        : diffDays === 1 
                                          ? 'O envio é AMANHÃ!' 
                                          : `Faltam apenas ${diffDays} dias para o envio!`}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">Recomenda-se agilizar a impressão.</span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="p-2 rounded-lg border border-slate-200 bg-slate-100/50 text-[10px] font-sans text-slate-600 leading-normal">
                              Faltam {diffDays} dias para a data limite de envio.
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Cost side-card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Resumo de Custos
                  </h4>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Cliente:</span>
                      <span className="text-slate-800 truncate max-w-[120px] font-sans font-bold">{getClientName(viewingOrder.clientId)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Filamento:</span>
                        {viewingOrder.filamentsUsed && viewingOrder.filamentsUsed.length > 0 ? (
                          <span className="text-slate-800 font-sans text-right font-bold">Vários ({viewingOrder.filamentsUsed.length})</span>
                        ) : (
                          <span className="text-slate-800 font-sans text-right truncate max-w-[120px] font-bold" title={getFilamentDetails(viewingOrder.filamentId)}>
                            {getFilamentDetails(viewingOrder.filamentId).split(' | ')[0]}
                          </span>
                        )}
                      </div>
                      {viewingOrder.filamentsUsed && viewingOrder.filamentsUsed.length > 0 && (
                        <div className="pl-2 border-l-2 border-indigo-200 text-[10px] text-slate-500 font-sans space-y-0.5 mt-1">
                          {viewingOrder.filamentsUsed.map((row, idx) => {
                            const fil = filaments.find(f => f.id === row.filamentId);
                            return (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate max-w-[110px]">{fil ? `${fil.material} - ${fil.name}` : 'Filamento'}</span>
                                <span className="font-mono font-bold">{row.weightGrams}g</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Peso Total:</span>
                      <span className="text-slate-800 font-bold">{viewingOrder.modelWeightGrams + viewingOrder.supportWeightGrams}g</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Tempo de Impressão:</span>
                      <span className="text-slate-800 font-bold">{viewingOrder.printTimeHours}h {viewingOrder.printTimeMinutes}m</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 font-semibold">
                      <span>Custo Puro:</span>
                      <span className="text-slate-700 font-bold">{formatCurrency(viewingOrder.calculatedCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Preço Sugerido:</span>
                      <span className="text-indigo-600 font-extrabold text-xs">{formatCurrency(viewingOrder.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional instructions notes panel */}
                {viewingOrder.notes && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1.5 shadow-2xs">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Observações do Projeto</span>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed font-sans italic">
                      "{viewingOrder.notes}"
                    </p>
                  </div>
                )}

                {/* Action panel */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onEditOrderClick(viewingOrder);
                      setViewingOrder(null);
                    }}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs py-2 rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                    id="edit-order-inside-details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => {
                      if (showConfirm) {
                        showConfirm(
                          'Excluir Pedido',
                          'Deseja mesmo excluir permanentemente este pedido do histórico?',
                          () => {
                            onDeleteOrder(viewingOrder.id);
                            setViewingOrder(null);
                          }
                        );
                      } else if (confirm('Deseja mesmo excluir permanentemente este pedido do histórico?')) {
                        onDeleteOrder(viewingOrder.id);
                        setViewingOrder(null);
                      }
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-650 font-bold text-xs px-3 py-2 rounded-lg border border-red-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    Excluir
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
