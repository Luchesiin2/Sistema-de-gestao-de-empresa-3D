import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  User,
  History,
  X
} from 'lucide-react';
import { Client, Order } from '../types';

interface ClientManagerProps {
  clients: Client[];
  orders: Order[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientManager({ clients, orders, onAddClient, onUpdateClient, onDeleteClient }: ClientManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    cpf: ''
  });

  // Client Details panel
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.cpf && client.cpf.includes(searchTerm))
  );

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', notes: '', cpf: '' });
    setSelectedClient(null);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (selectedClient) {
      onUpdateClient({
        ...selectedClient,
        ...formData
      });
    } else {
      onAddClient(formData);
    }
    resetForm();
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      cpf: client.cpf || ''
    });
    setIsEditing(true);
    // Smooth scroll to form on mobile
    document.getElementById('client-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewClientDetails = (client: Client) => {
    setViewingClient(client);
  };

  const getClientOrders = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="clients-tab">
      
      {/* Left Columns: Clients list & Details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search & Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Clientes ({clients.length})</h2>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
              id="client-search"
            />
          </div>
        </div>

        {/* Clients list */}
        {filteredClients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-xs font-sans">
            Nenhum cliente encontrado. Adicione um novo cliente na barra lateral!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredClients.map(client => {
              const clientOrders = getClientOrders(client.id);
              const totalSpent = clientOrders
                .filter(o => o.status !== 'orcamento')
                .reduce((sum, o) => sum + o.finalPrice, 0);

              return (
                <div 
                  key={client.id}
                  className={`bg-white border ${
                    viewingClient?.id === client.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-350'
                  } rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-xs cursor-pointer relative group`}
                  onClick={() => handleViewClientDetails(client)}
                  id={`client-card-${client.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow-xs">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {client.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Cadastrado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditClick(client)}
                          className="p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Editar"
                          id={`edit-client-${client.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir"
                          id={`delete-client-${client.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-slate-500 text-xs">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-[11px] font-mono truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                    <div className="text-slate-400">
                      Pedidos: <span className="text-slate-700 font-bold">{clientOrders.length}</span>
                    </div>
                    <div className="text-slate-400">
                      Total Gasto: <span className="text-emerald-600 font-bold">{formatCurrency(totalSpent)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Client details panel */}
        {viewingClient && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-5 relative animate-fade-in" id="client-detail-panel">
            <button 
              onClick={() => setViewingClient(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 cursor-pointer"
              id="close-client-details"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shadow-xs">
                {viewingClient.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">{viewingClient.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">ID de Rastreabilidade: {viewingClient.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-500 font-mono uppercase tracking-wider text-[9px]">Informações de Contato</h4>
                <div className="space-y-2 text-slate-650 font-mono bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  {viewingClient.cpf && (
                    <div className="flex items-center gap-2 font-bold text-slate-800 pb-1.5 border-b border-slate-200/50 mb-1">
                      <span className="text-[9px] uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">CPF</span>
                      <span>{viewingClient.cpf}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{viewingClient.email || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{viewingClient.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-200/50">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line text-sans">{viewingClient.address || 'Sem endereço cadastrado'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-500 font-mono uppercase tracking-wider text-[9px]">Notas / Observações</h4>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 font-sans border border-slate-100 min-h-[92px] whitespace-pre-line">
                  {viewingClient.notes || 'Nenhuma nota adicional cadastrada para este cliente.'}
                </div>
              </div>
            </div>

            {/* Client Orders History */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <h4 className="font-bold text-slate-500 font-mono uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Histórico de Pedidos ({getClientOrders(viewingClient.id).length})
              </h4>
              
              {getClientOrders(viewingClient.id).length === 0 ? (
                <p className="text-[11px] text-slate-400 font-mono">Este cliente ainda não possui nenhum pedido cadastrado.</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                  {getClientOrders(viewingClient.id).map(order => (
                    <div key={order.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{order.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-800 font-semibold">{formatCurrency(order.finalPrice)}</span>
                        
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold border ${
                          order.status === 'orcamento' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                          order.status === 'aprovado' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          order.status === 'impressao' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          order.status === 'acabamento' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          order.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {order.status === 'orcamento' ? 'Orç.' :
                           order.status === 'aprovado' ? 'Aprov.' :
                           order.status === 'impressao' ? 'Impr.' :
                           order.status === 'acabamento' ? 'Acab.' :
                           order.status === 'concluido' ? 'Pronto' : 'Entr.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Right Column: Add/Edit Client Form */}
      <div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5" id="client-form-card">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 bg-slate-50/50 -m-5 mb-0 p-5 rounded-t-2xl">
            <User className="w-4.5 h-4.5 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              {isEditing ? 'Editar Ficha' : 'Cadastrar Cliente'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Nome do Cliente *</label>
              <input
                type="text"
                required
                placeholder="Ex: Ateliê Luchesi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                id="form-client-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">CPF</label>
              <input
                type="text"
                placeholder="Ex: 000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                id="form-client-cpf"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Telefone</label>
              <input
                type="text"
                placeholder="Ex: (11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                id="form-client-phone"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">E-mail</label>
              <input
                type="email"
                placeholder="Ex: cliente@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                id="form-client-email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Endereço de Entrega</label>
              <textarea
                placeholder="Rua, Número, Bairro, Cidade - CEP"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                id="form-client-address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-450 font-bold">Notas Adicionais</label>
              <textarea
                placeholder="Preferências, restrições ou detalhes de entrega..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                id="form-client-notes"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg py-2.5 transition-colors cursor-pointer shadow-xs uppercase tracking-wider"
                id="form-client-submit"
              >
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-lg px-3.5 py-2.5 transition-colors border border-slate-200 cursor-pointer"
                  id="form-client-cancel"
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
