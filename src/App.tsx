import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Users, 
  Layers, 
  FlameKindling, 
  Settings as SettingsIcon, 
  Coins, 
  Info,
  Scale,
  Bell,
  Sparkles,
  HelpCircle,
  Activity,
  LogOut,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

import { Client, Filament, Order, OrderStatus, PrintingSettings } from './types';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import FilamentStock from './components/FilamentStock';
import OrderManager from './components/OrderManager';
import OrderForm from './components/OrderForm';

// Initial printing configuration defaults
const DEFAULT_SETTINGS: PrintingSettings = {
  defaultPrinterPowerWatts: 120,
  defaultElectricityCostKwh: 0.85,
  defaultPrinterDepreciationPerHour: 0.40,
  defaultLaborHourlyRate: 20.00,
  defaultMarkupPercent: 100,
  currencySymbol: 'R$',
  disableCriticalShippingAlerts: false
};

// Seeding of highly realistic mock data to make the app beautiful immediately!
const SEED_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Luchesi Oficial',
    email: 'luchesioficial@gmail.com',
    phone: '(11) 98888-7777',
    address: 'Rua das Flores, 123 - Jardins\nSão Paulo - SP',
    notes: 'Cliente prioritário. Prefere acabamento premium em PLA.',
    createdAt: '2026-07-01T10:00:00Z'
  },
  {
    id: 'cli-2',
    name: 'Mariana Sousa',
    email: 'mari.sousa@design.com',
    phone: '(21) 97777-6666',
    address: 'Av. Atlântica, 456 - Copacabana\nRio de Janeiro - RJ',
    notes: 'Designer de interiores. Solicita vasos em modo espiral.',
    createdAt: '2026-07-05T14:30:00Z'
  },
  {
    id: 'cli-3',
    name: 'Carlos Tech Solutions',
    email: 'contato@carlostech.com.br',
    phone: '(19) 96666-5555',
    address: 'Rua Engenheiros, 789 - Centro\nCampinas - SP',
    notes: 'Prototipagem mecânica. Exige alta precisão dimensional e material resistente (PETG ou ABS).',
    createdAt: '2026-07-10T09:15:00Z'
  }
];

const SEED_FILAMENTS: Filament[] = [
  {
    id: 'fil-1',
    name: 'Laranja Prusa PLA',
    brand: '3D Fila',
    material: 'PLA',
    colorName: 'Laranja Prusa',
    colorHex: '#FF6B00',
    purchasePrice: 115.00,
    totalWeight: 1000,
    usedWeight: 890, // almost finished! (110g left - triggers low stock warn!)
    lowStockThreshold: 150,
    notes: 'Excelente fluidez, ótima adesão na mesa PEI. Imprimir a 205°C.'
  },
  {
    id: 'fil-2',
    name: 'Preto Coal PETG',
    brand: 'Esun',
    material: 'PETG',
    colorName: 'Preto Coal',
    colorHex: '#18181B',
    purchasePrice: 130.00,
    totalWeight: 1000,
    usedWeight: 240, // 760g left
    lowStockThreshold: 150,
    notes: 'Muito resistente. Necessita mesa a 80°C e bico a 240°C.'
  },
  {
    id: 'fil-3',
    name: 'Branco Neve PLA',
    brand: 'Sunlu',
    material: 'PLA',
    colorName: 'Branco Neve',
    colorHex: '#F4F4F5',
    purchasePrice: 110.00,
    totalWeight: 1000,
    usedWeight: 420, // 580g left
    lowStockThreshold: 150,
    notes: 'Branco puro excelente para pintura ou litofanias.'
  }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'PED-0001',
    clientId: 'cli-3',
    title: 'Engrenagem Helicoidal H8',
    status: 'entregue',
    filamentId: 'fil-2', // PETG Black
    stlFiles: [
      {
        id: 'stl-gear',
        name: 'herringbone_gear_mechanic.stl',
        size: 1850100,
        estimatedWeight: 28,
        printTimeMinutes: 190,
        volumeCm3: 22.4,
        dimensions: { x: 85, y: 85, z: 15 }
      }
    ],
    filamentDeducted: true,
    modelWeightGrams: 28,
    supportWeightGrams: 4,
    printTimeHours: 3,
    printTimeMinutes: 10,
    printerPowerWatts: 120,
    electricityCostKwh: 0.85,
    printerDepreciationPerHour: 0.40,
    laborHourlyRate: 20.00,
    laborHoursNeeded: 0.5,
    otherCosts: 0,
    markupPercent: 100,
    calculatedCost: 18.25,
    finalPrice: 36.50,
    notes: 'Peça mecânica de reposição. Preencher com 40% de infill e 4 paredes para máxima rigidez.',
    createdAt: '2026-07-11T16:00:00Z',
    deliveryDate: '2026-07-13T10:00:00Z'
  },
  {
    id: 'ord-2',
    orderNumber: 'PED-0002',
    clientId: 'cli-2',
    title: 'Vaso Orgânico Espiralado',
    status: 'acabamento',
    filamentId: 'fil-1', // Orange Prusa
    stlFiles: [
      {
        id: 'stl-vase',
        name: 'spiral_vase_organic.stl',
        size: 3450200,
        estimatedWeight: 42,
        printTimeMinutes: 280,
        volumeCm3: 33.6,
        dimensions: { x: 110, y: 110, z: 180 }
      }
    ],
    filamentDeducted: true,
    modelWeightGrams: 42,
    supportWeightGrams: 0,
    printTimeHours: 4,
    printTimeMinutes: 40,
    printerPowerWatts: 120,
    electricityCostKwh: 0.85,
    printerDepreciationPerHour: 0.40,
    laborHourlyRate: 20.00,
    laborHoursNeeded: 1.0, // extra finishing
    otherCosts: 5.00, // packaging box
    markupPercent: 120, // high markup for design piece
    calculatedCost: 35.80,
    finalPrice: 78.76,
    notes: 'Imprimir em Modo Vaso (spiralize outer contour). Altura de camada de 0.28mm com bico de 0.6mm para maior robustez.',
    createdAt: '2026-07-12T11:00:00Z'
  },
  {
    id: 'ord-3',
    orderNumber: 'PED-0003',
    clientId: 'cli-1',
    title: 'Barco de Teste 3DBenchy',
    status: 'impressao',
    filamentId: 'fil-1', // Orange Prusa
    stlFiles: [
      {
        id: 'stl-boat',
        name: '3DBenchy_boat.stl',
        size: 1145300,
        estimatedWeight: 14,
        printTimeMinutes: 115,
        volumeCm3: 11.2,
        dimensions: { x: 60, y: 31, z: 48 }
      }
    ],
    filamentDeducted: true,
    modelWeightGrams: 14,
    supportWeightGrams: 0,
    printTimeHours: 1,
    printTimeMinutes: 55,
    printerPowerWatts: 120,
    electricityCostKwh: 0.85,
    printerDepreciationPerHour: 0.40,
    laborHourlyRate: 20.00,
    laborHoursNeeded: 0.2,
    otherCosts: 0,
    markupPercent: 100,
    calculatedCost: 7.20,
    finalPrice: 14.40,
    notes: 'Modelo de calibração para testar retração do filamento laranja.',
    createdAt: '2026-07-13T08:30:00Z'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core lists with localStorage support
  const [clients, setClients] = useState<Client[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<PrintingSettings>(DEFAULT_SETTINGS);

  // Selected order for editing
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);

  // Quick toast messages
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Custom Confirm Dialog Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  // Helper to handle both multi-filament and single-filament stock deductions
  const deductFilamentStock = (filamentsList: Filament[], order: Order, factor: 1 | -1): Filament[] => {
    let nextFilaments = [...filamentsList];
    if (order.filamentsUsed && order.filamentsUsed.length > 0) {
      order.filamentsUsed.forEach(row => {
        if (!row.filamentId) return;
        nextFilaments = nextFilaments.map(f => {
          if (f.id === row.filamentId) {
            const change = row.weightGrams * factor;
            // deduct increases usedWeight, refund decreases usedWeight
            const nextUsed = Math.max(0, Math.min(f.totalWeight, f.usedWeight + change));
            return { ...f, usedWeight: nextUsed };
          }
          return f;
        });
      });
    } else if (order.filamentId) {
      const totalWeight = order.modelWeightGrams + (order.supportWeightGrams || 0);
      nextFilaments = nextFilaments.map(f => {
        if (f.id === order.filamentId) {
          const change = totalWeight * factor;
          const nextUsed = Math.max(0, Math.min(f.totalWeight, f.usedWeight + change));
          return { ...f, usedWeight: nextUsed };
        }
        return f;
      });
    }
    return nextFilaments;
  };

  // Load and seed database from LocalStorage
  useEffect(() => {
    const storedClients = localStorage.getItem('3d_clients');
    const storedFilaments = localStorage.getItem('3d_filaments');
    const storedOrders = localStorage.getItem('3d_orders');
    const storedSettings = localStorage.getItem('3d_settings');

    if (storedClients) setClients(JSON.parse(storedClients));
    else {
      setClients(SEED_CLIENTS);
      localStorage.setItem('3d_clients', JSON.stringify(SEED_CLIENTS));
    }

    if (storedFilaments) setFilaments(JSON.parse(storedFilaments));
    else {
      setFilaments(SEED_FILAMENTS);
      localStorage.setItem('3d_filaments', JSON.stringify(SEED_FILAMENTS));
    }

    if (storedOrders) setOrders(JSON.parse(storedOrders));
    else {
      setOrders(SEED_ORDERS);
      localStorage.setItem('3d_orders', JSON.stringify(SEED_ORDERS));
    }

    if (storedSettings) setSettings(JSON.parse(storedSettings));
    else {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('3d_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
  }, []);

  // Sync utilities
  const saveClientsState = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('3d_clients', JSON.stringify(newClients));
  };

  const saveFilamentsState = (newFilaments: Filament[]) => {
    setFilaments(newFilaments);
    localStorage.setItem('3d_filaments', JSON.stringify(newFilaments));
  };

  const saveOrdersState = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('3d_orders', JSON.stringify(newOrders));
  };

  const saveSettingsState = (newSettings: PrintingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('3d_settings', JSON.stringify(newSettings));
  };

  const showToast = (message: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // CLIENT HANDLERS
  const handleAddClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    const nextClients = [newClient, ...clients];
    saveClientsState(nextClients);
    showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`);
  };

  const handleUpdateClient = (updated: Client) => {
    const nextClients = clients.map(c => c.id === updated.id ? updated : c);
    saveClientsState(nextClients);
    showToast(`Informações de "${updated.name}" atualizadas.`);
  };

  const DEDUCTIBLE_STATUSES = ['aprovado', 'impressao', 'acabamento', 'concluido', 'entregue'];

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    // Check if client has active orders
    const hasActiveOrders = orders.some(o => o.clientId === id && o.status !== 'entregue');
    if (hasActiveOrders) {
      showToast(`Não é possível excluir "${client.name}" pois existem pedidos em produção pendentes.`, 'warn');
      return;
    }

    showConfirm(
      'Remover Cliente',
      `Deseja realmente remover o cliente "${client.name}"? Todos os pedidos dele continuarão listados.`,
      () => {
        saveClientsState(clients.filter(c => c.id !== id));
        showToast(`Cliente "${client.name}" excluído.`);
      }
    );
  };

  // FILAMENT HANDLERS
  const handleAddFilament = (filData: Omit<Filament, 'id'>) => {
    const newFil: Filament = {
      ...filData,
      id: `fil-${Math.random().toString(36).substring(2, 9)}`
    };
    const nextFils = [newFil, ...filaments];
    saveFilamentsState(nextFils);
    showToast(`Bobina "${newFil.name}" adicionada ao estoque.`);
  };

  const handleUpdateFilament = (updated: Filament) => {
    const nextFils = filaments.map(f => f.id === updated.id ? updated : f);
    saveFilamentsState(nextFils);
    showToast(`Bobina "${updated.name}" atualizada.`);
  };

  const handleDeleteFilament = (id: string) => {
    const fil = filaments.find(f => f.id === id);
    if (!fil) return;

    // Check if filament is used in ANY order that is active
    const hasActiveOrders = orders.some(o => {
      if (o.status === 'entregue') return false;
      if (o.filamentId === id) return true;
      if (o.filamentsUsed && o.filamentsUsed.some(row => row.filamentId === id)) return true;
      return false;
    });

    if (hasActiveOrders) {
      showToast(`Não é possível excluir "${fil.name}" pois está sendo usada em pedidos ativos.`, 'warn');
      return;
    }

    showConfirm(
      'Excluir Bobina',
      `Deseja realmente remover a bobina "${fil.name}" do estoque?`,
      () => {
        saveFilamentsState(filaments.filter(f => f.id !== id));
        showToast(`Bobina "${fil.name}" excluída.`);
      }
    );
  };

  // ORDER HANDLERS
  const handleAddOrUpdateOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    // Determine if we are editing an existing order
    if (editingOrder) {
      const updatedOrder: Order = {
        ...editingOrder,
        ...orderData
      };
      
      let nextFilaments = [...filaments];

      // 1. If original order was already deducted, refund the stock first to avoid dual-accounting or stale values
      if (editingOrder.filamentDeducted) {
        nextFilaments = deductFilamentStock(nextFilaments, editingOrder, -1);
      }

      // 2. Check if new order state requires stock deduction
      const needsDeduction = DEDUCTIBLE_STATUSES.includes(updatedOrder.status);
      if (needsDeduction) {
        nextFilaments = deductFilamentStock(nextFilaments, updatedOrder, 1);
        updatedOrder.filamentDeducted = true;
        showToast(`Estoque de filamento atualizado para o pedido.`);
      } else {
        updatedOrder.filamentDeducted = false;
      }

      const nextOrders = orders.map(o => o.id === editingOrder.id ? updatedOrder : o);
      saveOrdersState(nextOrders);
      saveFilamentsState(nextFilaments);
      showToast(`Pedido ${updatedOrder.orderNumber} atualizado com sucesso.`);
      setEditingOrder(undefined);
      setActiveTab('pedidos');
    } else {
      // Create new order
      const orderCount = orders.length + 1;
      const orderNumber = `PED-${String(orderCount).padStart(4, '0')}`;
      
      const newOrder: Order = {
        ...orderData,
        id: `ord-${Math.random().toString(36).substring(2, 9)}`,
        orderNumber,
        createdAt: new Date().toISOString(),
        filamentDeducted: false
      };

      let nextFilaments = [...filaments];
      // Subtract stock immediately if status is approved/printing or higher
      const needsDeduction = DEDUCTIBLE_STATUSES.includes(newOrder.status);
      if (needsDeduction) {
        nextFilaments = deductFilamentStock(nextFilaments, newOrder, 1);
        newOrder.filamentDeducted = true;
        showToast(`Material deduzido do estoque para o novo pedido.`);
      }

      const nextOrders = [newOrder, ...orders];
      saveOrdersState(nextOrders);
      saveFilamentsState(nextFilaments);
      showToast(`Pedido ${orderNumber} criado com sucesso!`);
      setActiveTab('pedidos');
    }
  };

  const handleEditOrderClick = (order: Order) => {
    setEditingOrder(order);
    setActiveTab('pedidos-novo');
  };

  const handleDeleteOrder = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let nextFilaments = [...filaments];
    // If deleted order was already deducted, refund its used filament back to stock
    if (order.filamentDeducted) {
      nextFilaments = deductFilamentStock(filaments, order, -1);
      showToast(`Pedido ${order.orderNumber} excluído. Materiais devolvidos ao estoque.`, 'info');
    } else {
      showToast(`Pedido ${order.orderNumber} excluído.`);
    }

    saveOrdersState(orders.filter(o => o.id !== id));
    saveFilamentsState(nextFilaments);
  };

  const handleUpdateOrderStatus = (id: string, nextStatus: OrderStatus) => {
    let nextFilaments = [...filaments];
    const nextOrders = orders.map(order => {
      if (order.id === id) {
        const updated = { ...order, status: nextStatus };
        
        const isNowActive = DEDUCTIBLE_STATUSES.includes(nextStatus);
        if (isNowActive && !updated.filamentDeducted) {
          nextFilaments = deductFilamentStock(nextFilaments, updated, 1);
          updated.filamentDeducted = true;
          showToast(`Pedido aprovado/iniciado! Deduzido material do estoque.`, 'success');
        } else if (!isNowActive && updated.filamentDeducted) {
          // If moved back to 'orcamento'
          nextFilaments = deductFilamentStock(nextFilaments, updated, -1);
          updated.filamentDeducted = false;
          showToast(`Pedido retornado para orçamento. Material devolvido ao estoque.`, 'info');
        }
        
        if (nextStatus === 'entregue' && !updated.deliveryDate) {
          updated.deliveryDate = new Date().toISOString();
        }

        return updated;
      }
      return order;
    });

    saveOrdersState(nextOrders);
    saveFilamentsState(nextFilaments);
  };

  const handleTabNavigation = (tab: string) => {
    if (tab !== 'pedidos-novo') {
      setEditingOrder(undefined); // Reset editing order if navigating away
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Render components dynamically
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            clients={clients} 
            filaments={filaments} 
            orders={orders} 
            onNavigate={handleTabNavigation} 
            settings={settings}
          />
        );
      case 'pedidos':
        return (
          <OrderManager 
            orders={orders} 
            clients={clients} 
            filaments={filaments} 
            onAddOrderClick={() => handleTabNavigation('pedidos-novo')} 
            onEditOrderClick={handleEditOrderClick} 
            onDeleteOrder={handleDeleteOrder} 
            onUpdateOrderStatus={handleUpdateOrderStatus} 
            showConfirm={showConfirm}
          />
        );
      case 'pedidos-novo':
        return (
          <OrderForm 
            clients={clients} 
            filaments={filaments} 
            initialOrder={editingOrder} 
            settings={settings} 
            onSubmit={handleAddOrUpdateOrder} 
            onCancel={() => handleTabNavigation('pedidos')} 
          />
        );
      case 'estoque':
        return (
          <FilamentStock 
            filaments={filaments} 
            onAddFilament={handleAddFilament} 
            onUpdateFilament={handleUpdateFilament} 
            onDeleteFilament={handleDeleteFilament} 
            showConfirm={showConfirm}
          />
        );
      case 'clientes':
        return (
          <ClientManager 
            clients={clients} 
            orders={orders} 
            onAddClient={handleAddClient} 
            onUpdateClient={handleUpdateClient} 
            onDeleteClient={handleDeleteClient} 
          />
        );
      case 'configuracoes':
        return <ConfigTab settings={settings} onSave={saveSettingsState} />;
      default:
        return <div className="text-zinc-500 font-mono">Página em construção...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col lg:flex-row selection:bg-indigo-600/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 max-w-sm bg-white border border-slate-200 text-slate-800 px-4 py-3.5 rounded-xl shadow-xl z-50 flex items-start gap-3 animate-slide-up">
          <div className={`p-1.5 rounded-lg border ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/40' :
            toast.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200/40' :
            'bg-slate-150 text-slate-700 border-slate-250'
          }`}>
            {toast.type === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Notificação</span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <span>{confirmDialog.title}</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-950/40 group relative overflow-hidden">
            <Printer className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
              Maker3D
            </h1>
            <span className="text-[10px] text-slate-400 font-mono">Ateliê Luchesi Oficial</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => handleTabNavigation('dashboard')}
            className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            Dashboard
          </button>

          <button
            onClick={() => handleTabNavigation('pedidos')}
            className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'pedidos' || activeTab === 'pedidos-novo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            Pedidos & Orçamentos
          </button>

          <button
            onClick={() => handleTabNavigation('estoque')}
            className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'estoque' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FlameKindling className="w-4.5 h-4.5" />
            Estoque Filamentos
          </button>

          <button
            onClick={() => handleTabNavigation('clientes')}
            className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'clientes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            Clientes
          </button>

          <button
            onClick={() => handleTabNavigation('configuracoes')}
            className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'configuracoes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <SettingsIcon className="w-4.5 h-4.5" />
            Configuração
          </button>
        </nav>

        {/* Low stock counter in sidebar */}
        {filaments.filter(f => (f.totalWeight - f.usedWeight) <= f.lowStockThreshold).length > 0 && (
          <div className="p-4 mx-4 mb-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-[10px] text-amber-500 font-mono space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> Alerta de Estoque
            </div>
            <p className="text-slate-400 leading-normal">
              {filaments.filter(f => (f.totalWeight - f.usedWeight) <= f.lowStockThreshold).length} bobina(s) em nível crítico.
            </p>
          </div>
        )}

        {/* Shipping deadline alert in sidebar */}
        {!settings.disableCriticalShippingAlerts && (() => {
          const urgentCount = orders.filter(o => {
            if (o.status === 'entregue' || !o.deliveryDate) return false;
            const targetDate = new Date(o.deliveryDate + 'T00:00:00');
            const currentDate = new Date();
            currentDate.setHours(0,0,0,0);
            targetDate.setHours(0,0,0,0);
            const diffTime = targetDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 3;
          }).length;

          if (urgentCount > 0) {
            return (
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="p-4 mx-4 mb-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-[10px] text-rose-500 font-mono space-y-1 cursor-pointer hover:bg-rose-950/35 transition-colors"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 animate-bounce text-rose-400" /> Alerta de Prazos
                </div>
                <p className="text-slate-400 leading-normal">
                  {urgentCount} pedido(s) com prazo crítico ou em atraso.
                </p>
              </div>
            );
          }
          return null;
        })()}
      </aside>

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Printer className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-xs font-black tracking-wider uppercase text-white font-mono">
              Maker3D
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
            id="mobile-menu-trigger"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </header>

        {/* Mobile Drawer Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1.5 z-30 animate-slide-down">
            <button
              onClick={() => { handleTabNavigation('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </button>
            
            <button
              onClick={() => { handleTabNavigation('pedidos'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === 'pedidos' || activeTab === 'pedidos-novo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Pedidos & Orçamentos
            </button>

            <button
              onClick={() => { handleTabNavigation('estoque'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === 'estoque' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FlameKindling className="w-4 h-4" />
              Estoque Filamentos
            </button>

            <button
              onClick={() => { handleTabNavigation('clientes'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === 'clientes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Clientes
            </button>

            <button
              onClick={() => { handleTabNavigation('configuracoes'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === 'configuracoes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Configuração de Tarifas
            </button>
          </nav>
        )}

        {/* Desktop View Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30 shadow-xs">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-indigo-600 font-bold">
              {activeTab === 'dashboard' && 'Visão Geral Operacional'}
              {activeTab === 'pedidos' && 'Orçamentos & Gestão de Pedidos'}
              {activeTab === 'pedidos-novo' && (editingOrder ? 'Editar Ficha do Pedido' : 'Nova Calculadora & Orçamento')}
              {activeTab === 'estoque' && 'Estoque & Rastreabilidade de Bobinas'}
              {activeTab === 'clientes' && 'Fichas de Clientes'}
              {activeTab === 'configuracoes' && 'Configurações de Produção'}
            </h2>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5 font-medium">Maker3D • Centro de Controle Técnico</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Urgent shipping deadline notification bell */}
            {(() => {
              const urgentCount = orders.filter(o => {
                if (o.status === 'entregue' || !o.deliveryDate) return false;
                const targetDate = new Date(o.deliveryDate + 'T00:00:00');
                const currentDate = new Date();
                currentDate.setHours(0,0,0,0);
                targetDate.setHours(0,0,0,0);
                const diffTime = targetDate.getTime() - currentDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 3;
              }).length;

              if (urgentCount > 0) {
                return (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="relative p-1.5 bg-rose-50 text-rose-650 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                    title={`${urgentCount} pedido(s) com prazo crítico ou em atraso!`}
                    id="desktop-notifications-trigger"
                  >
                    <Bell className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      {urgentCount}
                    </span>
                  </button>
                );
              }
              return (
                <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-slate-400" />
                </div>
              );
            })()}

            {activeTab !== 'pedidos-novo' && (
              <button
                onClick={() => handleTabNavigation('pedidos-novo')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                + Novo Orçamento
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs font-mono">
              LO
            </div>
          </div>
        </header>

        {/* Main Content Area Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8" id="main-content-stage">
          {renderTabContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 p-4 text-center text-[10px] text-slate-400 font-mono flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>Ateliê de Impressão 3D Luchesi © 2026</div>
          <div className="flex justify-center gap-3 mt-2 sm:mt-0 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Prusa Grid: Ativo</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span> Bambu Slicer Link: Pronto</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* Small Sub-component: Configuration settings tab */
interface ConfigTabProps {
  settings: PrintingSettings;
  onSave: (settings: PrintingSettings) => void;
}

function ConfigTab({ settings, onSave }: ConfigTabProps) {
  const [power, setPower] = useState(settings.defaultPrinterPowerWatts);
  const [energy, setEnergy] = useState(settings.defaultElectricityCostKwh);
  const [depreciation, setDepreciation] = useState(settings.defaultPrinterDepreciationPerHour);
  const [labor, setLabor] = useState(settings.defaultLaborHourlyRate);
  const [markup, setMarkup] = useState(settings.defaultMarkupPercent);
  const [currency, setCurrency] = useState(settings.currencySymbol);
  const [disableAlerts, setDisableAlerts] = useState(!!settings.disableCriticalShippingAlerts);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      defaultPrinterPowerWatts: Number(power),
      defaultElectricityCostKwh: Number(energy),
      defaultPrinterDepreciationPerHour: Number(depreciation),
      defaultLaborHourlyRate: Number(labor),
      defaultMarkupPercent: Number(markup),
      currencySymbol: currency,
      disableCriticalShippingAlerts: disableAlerts
    });
    alert('Configurações salvas com sucesso! Novos pedidos usarão estes valores como padrão.');
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-slate-800" id="config-tab-container">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <SettingsIcon className="w-4.5 h-4.5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Taxas e Tarifações Padrão</h3>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed font-sans">
        Ajuste as taxas gerais de consumo de energia, depreciação do bico/mesa e valor de sua hora de serviço. Estas configurações preencherão automaticamente o formulário do calculador de custos na criação de novos orçamentos.
      </p>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Potência Padrão (Watts)</label>
            <input
              type="number"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Tarifa de Energia (R$/kWh)</label>
            <input
              type="number"
              step={0.01}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Depreciação de Máquina (R$/hora)</label>
            <input
              type="number"
              step={0.01}
              value={depreciation}
              onChange={(e) => setDepreciation(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Sua Mão de Obra (R$/hora)</label>
            <input
              type="number"
              step={0.5}
              value={labor}
              onChange={(e) => setLabor(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Markup de Margem Padrão (%)</label>
            <input
              type="number"
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Símbolo Monetário</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5 max-w-[80%]">
            <span className="text-xs font-bold text-slate-800 font-mono uppercase block">Envios Críticos</span>
            <span className="text-[10px] text-slate-450 leading-relaxed font-sans block">Desative avisos visuais de prazos críticos ou em atraso na barra lateral e no painel principal.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={disableAlerts}
              onChange={(e) => setDisableAlerts(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
          id="save-config-btn"
        >
          Salvar Configurações Gerais
        </button>
      </form>
    </div>
  );
}
