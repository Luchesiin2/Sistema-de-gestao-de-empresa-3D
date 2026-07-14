import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  Coins, 
  Printer, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Play
} from 'lucide-react';
import { Client, Filament, Order, PrintingSettings } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-200 p-3 rounded-xl shadow-lg backdrop-blur-xs font-sans text-xs">
        <p className="font-bold text-slate-700 mb-1 font-mono">{label}</p>
        <p className="text-indigo-650 font-bold font-mono">
          Receita: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-slate-500 font-mono text-[10px] mt-0.5">
            Pedidos: {payload[1].value}
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  clients: Client[];
  filaments: Filament[];
  orders: Order[];
  onNavigate: (tab: string) => void;
  settings?: PrintingSettings;
}

export default function Dashboard({ clients, filaments, orders, onNavigate, settings }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  // Stats
  const activeOrders = orders.filter(o => o.status !== 'entregue' && o.status !== 'orcamento');
  const quoteOrders = orders.filter(o => o.status === 'orcamento');
  const printingOrders = orders.filter(o => o.status === 'impressao');

  // Filter orders with critical shipping deadlines (3 days or fewer left, or overdue)
  const urgentOrders = settings?.disableCriticalShippingAlerts ? [] : orders.filter(o => {
    if (o.status === 'entregue' || !o.deliveryDate) return false;
    const targetDate = new Date(o.deliveryDate + 'T00:00:00');
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    targetDate.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // falte 3 dias ou menos, ou atrasado
  });
  
  // Total Revenue (Only approved or finalized orders)
  const totalRevenue = orders
    .filter(o => o.status !== 'orcamento')
    .reduce((sum, o) => sum + o.finalPrice, 0);

  // Profit estimation
  const totalCost = orders
    .filter(o => o.status !== 'orcamento')
    .reduce((sum, o) => sum + o.calculatedCost, 0);
  const estimatedProfit = totalRevenue - totalCost;

  // Active printers simulation
  const printerCapacityCount = 3; // Let's say user has 3 printers
  
  // Low stock filaments
  const lowStockFilaments = filaments.filter(f => {
    const remaining = f.totalWeight - f.usedWeight;
    return remaining <= f.lowStockThreshold;
  });

  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Status counters
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Recharts aggregation functions
  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const getMonthlyData = (monthsCount: number) => {
    const data = [];
    const refDate = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      const label = `${MONTHS_PT[monthIndex]} ${year.toString().slice(-2)}`;
      
      const monthOrders = orders.filter(o => {
        // Count finalized orders ('concluido' or 'entregue')
        if (o.status !== 'concluido' && o.status !== 'entregue') return false;
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === year;
      });
      
      const revenue = monthOrders.reduce((sum, o) => sum + o.finalPrice, 0);
      const count = monthOrders.length;
      
      data.push({
        name: label,
        "Receita (R$)": Number(revenue.toFixed(2)),
        "Pedidos": count,
      });
    }
    return data;
  };

  const getDailyData = (daysCount: number) => {
    const data = [];
    const refDate = new Date();
    refDate.setHours(0,0,0,0);
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(refDate.getTime() - i * 24 * 60 * 60 * 1000);
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const dayOrders = orders.filter(o => {
        if (o.status !== 'concluido' && o.status !== 'entregue') return false;
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getDate() === d.getDate() &&
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getFullYear() === d.getFullYear()
        );
      });
      
      const revenue = dayOrders.reduce((sum, o) => sum + o.finalPrice, 0);
      const count = dayOrders.length;
      
      data.push({
        name: label,
        "Receita (R$)": Number(revenue.toFixed(2)),
        "Pedidos": count,
      });
    }
    return data;
  };

  const chartData = timeRange === '1m' ? getDailyData(30) : 
                    timeRange === '3m' ? getMonthlyData(3) :
                    timeRange === '6m' ? getMonthlyData(6) : 
                    getMonthlyData(12);

  const totalRangeRevenue = chartData.reduce((sum, item) => sum + item["Receita (R$)"], 0);
  const totalRangeOrders = chartData.reduce((sum, item) => sum + item["Pedidos"], 0);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-tab">
      {/* Dynamic Intro Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Painel de Controle Central</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Olá, Luchesi! 👋
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Seu ateliê de impressão 3D está ativo. Você tem <span className="text-indigo-300 font-semibold">{activeOrders.length} pedidos em produção</span> e <span className="text-amber-350 font-semibold">{lowStockFilaments.length} filamentos precisando de reposição</span>.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('pedidos-novo')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/25 cursor-pointer"
              id="dashboard-new-order-btn"
            >
              + Novo Orçamento
            </button>
            <button
              onClick={() => onNavigate('pedidos')}
              className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
              id="dashboard-view-orders-btn"
            >
              Ver Pedidos Ativos
            </button>
          </div>
        </div>
      </div>

      {/* Alert: Shipping Deadlines (Falte 3 dias ou menos / Atrasado) */}
      {urgentOrders.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 animate-fade-in" id="shipping-deadline-alerts">
          <div className="flex items-center gap-2 text-rose-800 font-bold font-sans text-xs uppercase tracking-wide">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            <span>Atenção: Prazos de Envio Críticos ({urgentOrders.length})</span>
          </div>
          <p className="text-xs text-rose-700 font-sans font-medium">
            Os seguintes pedidos estão com envio agendado para os próximos 3 dias ou estão em atraso. Priorize-os na fila de impressão e acabamento!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {urgentOrders.map(order => {
              const targetDate = new Date(order.deliveryDate + 'T00:00:00');
              const currentDate = new Date();
              currentDate.setHours(0,0,0,0);
              targetDate.setHours(0,0,0,0);
              const diffTime = targetDate.getTime() - currentDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              const isOverdue = diffDays < 0;
              const clientName = clients.find(c => c.id === order.clientId)?.name || 'Cliente';
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => onNavigate('pedidos')}
                  className="bg-white hover:bg-rose-100/30 border border-rose-200/60 hover:border-rose-300 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-rose-700">{order.orderNumber}</span>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{order.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      Cliente: <strong className="text-slate-700">{clientName}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold font-mono ${
                      isOverdue 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isOverdue 
                        ? `Atrasado: ${Math.abs(diffDays)}d` 
                        : diffDays === 0 
                          ? 'Envia Hoje!' 
                          : diffDays === 1 
                            ? 'Amanhã!' 
                            : `Em ${diffDays} dias`}
                    </span>
                    <div className="text-[9px] text-slate-400 font-mono mt-1 font-bold">
                      Prazo: {new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Faturamento</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-sans">
              <TrendingUp className="w-3.5 h-3.5" />
              Lucro est: {formatCurrency(estimatedProfit)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Clientes Ativos</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">{clients.length}</h3>
            <p className="text-[10px] text-slate-400">Cadastrados no sistema</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Em Impressão</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">{printingOrders.length}</h3>
            <p className="text-[10px] text-indigo-600 flex items-center gap-1 font-sans">
              <Printer className="w-3.5 h-3.5 animate-pulse" />
              Ocupando as impressoras
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Aguardando Aprovação</span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">{quoteOrders.length}</h3>
            <p className="text-[10px] text-slate-400">Orçamentos pendentes</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart: Monthly Revenue of Completed Orders */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Receita Total Mensal (Pedidos Finalizados)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Total faturado no período selecionado: <strong className="text-slate-750 font-mono font-bold">{formatCurrency(totalRangeRevenue)}</strong> • <span className="font-mono">{totalRangeOrders}</span> pedidos concluídos/entregues
            </p>
          </div>
          
          {/* Custom period selector pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setTimeRange('1m')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                timeRange === '1m'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30 Dias (Diário)
            </button>
            <button
              onClick={() => setTimeRange('3m')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                timeRange === '3m'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3 Meses
            </button>
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                timeRange === '6m'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setTimeRange('12m')}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer ${
                timeRange === '12m'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              12 Meses
            </button>
          </div>
        </div>

        {totalRangeRevenue === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-450 text-xs font-sans border-2 border-dashed border-slate-150 rounded-xl bg-slate-50/20">
            <Coins className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2 animate-pulse" />
            Nenhuma receita registrada neste período de pedidos finalizados.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono, SFMono-Regular, monospace"
                  fontWeight={500}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono, SFMono-Regular, monospace"
                  fontWeight={500}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                <Bar 
                  dataKey="Receita (R$)" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Left 2 Cols: Recent Orders & Stock Alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Orders Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Pedidos Recentes
              </h3>
              <button 
                onClick={() => onNavigate('pedidos')}
                className="text-[11px] font-bold font-mono text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-sans">
                Nenhum pedido cadastrado ainda. Comece criando um orçamento!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const clientName = clients.find(c => c.id === order.clientId)?.name || 'Cliente Desconhecido';
                  const filament = filaments.find(f => f.id === order.filamentId);
                  
                  return (
                    <div key={order.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                          <span className="text-xs text-slate-800 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                            {order.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>Para: <strong>{clientName}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-slate-200 inline-block"
                              style={{ backgroundColor: filament?.colorHex || '#ccc' }}
                            ></span>
                            {filament ? `${filament.material} - ${filament.name}` : 'Sem filamento'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex items-center gap-3">
                        <div className="hidden sm:block">
                          <div className="text-xs font-mono font-bold text-slate-800">{formatCurrency(order.finalPrice)}</div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-mono font-bold border ${
                          order.status === 'orcamento' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                          order.status === 'aprovado' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          order.status === 'impressao' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          order.status === 'acabamento' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          order.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {order.status === 'orcamento' ? 'Orçamento' :
                           order.status === 'aprovado' ? 'Aprovado' :
                           order.status === 'impressao' ? 'Imprimindo' :
                           order.status === 'acabamento' ? 'Acabamento' :
                           order.status === 'concluido' ? 'Pronto' : 'Entregue'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filament Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                Estoque de Filamentos Críticos
              </h3>
              <button 
                onClick={() => onNavigate('estoque')}
                className="text-[11px] font-bold font-mono text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Gerenciar Estoque
              </button>
            </div>
            
            {lowStockFilaments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-sans">
                🎉 Todos os filamentos estão acima do limite mínimo de segurança!
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {lowStockFilaments.map(fil => {
                  const remaining = fil.totalWeight - fil.usedWeight;
                  const pct = Math.max(0, Math.min(100, (remaining / fil.totalWeight) * 100));
                  
                  return (
                    <div key={fil.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full border border-slate-200 shadow-xs"
                          style={{ backgroundColor: fil.colorHex }}
                        ></div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{fil.name} <span className="text-slate-400 text-[10px] font-normal">({fil.brand})</span></h4>
                          <span className="text-[9px] uppercase font-mono font-bold tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {fil.material}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        {/* Progress Bar */}
                        <div className="flex-1 sm:w-32 space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400">
                            <span>Restam {remaining.toFixed(0)}g</span>
                            <span className="text-amber-600 font-bold">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-amber-600 font-bold font-mono flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Baixo Estoque</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Filament Material Chart, Quick formulas & Calculator Info */}
        <div className="space-y-6">
          
          {/* Material breakdown & Custom SVG chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Distribuição de Materiais
            </h3>
            
            {filaments.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-sans">Sem filamentos para gerar gráficos</div>
            ) : (
              <div className="space-y-3.5">
                {/* Custom SVG ring charts / vertical bar graphs */}
                {['PLA', 'PETG', 'ABS', 'TPU'].map(mat => {
                  const matFilaments = filaments.filter(f => f.material === mat);
                  const total = filaments.reduce((sum, f) => sum + (f.totalWeight - f.usedWeight), 0);
                  const matWeight = matFilaments.reduce((sum, f) => sum + Math.max(0, f.totalWeight - f.usedWeight), 0);
                  const pct = total > 0 ? (matWeight / total) * 100 : 0;
                  
                  if (matWeight === 0) return null;
                  
                  return (
                    <div key={mat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 font-mono text-[11px]">{mat}</span>
                        <span className="text-slate-450 font-mono text-[10px]">{matWeight.toFixed(0)}g ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            mat === 'PLA' ? 'bg-indigo-650' :
                            mat === 'PETG' ? 'bg-sky-500' :
                            mat === 'ABS' ? 'bg-teal-500' :
                            'bg-pink-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Formula & Cost info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden text-slate-800">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-xl pointer-events-none"></div>
            
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Como Calculamos Custos?
            </h3>
            
            <div className="space-y-3 text-xs text-slate-500 leading-relaxed font-sans">
              <p>O sistema de cálculo automático combina cinco variáveis principais para obter o preço final:</p>
              
              <ul className="space-y-2 font-mono text-[10px] text-slate-600 leading-normal">
                <li className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">1.</span>
                  <span><strong>Material:</strong> Peso total da peça + suportes multiplicado pelo custo por grama do filamento.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">2.</span>
                  <span><strong>Energia:</strong> Tempo × potência da máquina (W) × tarifa local de energia (kWh).</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">3.</span>
                  <span><strong>Depreciação:</strong> Taxa de desgaste por hora baseada na depreciação de bico e mesa de sua impressora.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">4.</span>
                  <span><strong>Mão de Obra:</strong> Horas necessárias de fatiamento e pós-processamento × seu valor hora técnico.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-indigo-600 font-bold">5.</span>
                  <span><strong>Margem (Markup):</strong> Percentual de lucro aplicado sobre o custo total de fabricação da peça.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
