export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  cpf?: string;
}

export type FilamentMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'Nylon' | 'Outro';

export interface Filament {
  id: string;
  name: string;
  brand: string;
  material: FilamentMaterial;
  colorName: string;
  colorHex: string;
  purchasePrice: number; // e.g. R$ 120.00
  totalWeight: number; // total spool weight in grams, e.g., 1000
  usedWeight: number; // weight used so far in grams
  lowStockThreshold: number; // threshold in grams, e.g., 150
  notes: string;
}

export interface StlFile {
  id: string;
  name: string;
  size: number; // in bytes
  estimatedWeight: number; // in grams
  printTimeMinutes: number; // printing time for this STL
  volumeCm3?: number;
  dimensions?: {
    x: number;
    y: number;
    z: number;
  };
}

export type OrderStatus = 'orcamento' | 'aprovado' | 'impressao' | 'acabamento' | 'concluido' | 'entregue';

export interface OrderFilament {
  filamentId: string;
  weightGrams: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "PED-0001"
  clientId: string;
  title: string;
  status: OrderStatus;
  filamentId: string; // references Filament.id (main or singular)
  filamentsUsed?: OrderFilament[]; // multi-filament option
  stlFiles: StlFile[];
  filamentDeducted?: boolean; // tracks if weight was deducted from stock
  
  // Cost Calculations Parameters
  modelWeightGrams: number;
  supportWeightGrams: number;
  printTimeHours: number;
  printTimeMinutes: number;
  
  printerPowerWatts: number; // e.g. 150W
  electricityCostKwh: number; // e.g. R$ 0.85 / kWh
  printerDepreciationPerHour: number; // e.g. R$ 0.50 / hour
  
  laborHourlyRate: number; // e.g. R$ 20.00 / hour
  laborHoursNeeded: number; // time spent preparing / finishing
  
  otherCosts: number; // screws, glue, boxes, paint, etc.
  markupPercent: number; // e.g. 50% profit margin
  
  calculatedCost: number; // auto-calculated
  finalPrice: number; // final price to client after markup
  
  notes: string;
  createdAt: string;
  paymentDate?: string; // data de entrada / dia do pagamento do orçamento
  deliveryDate?: string; // data de saída / envio do pedido
  photos?: string[]; // fotos do pedido do cliente
}

export interface PrintingSettings {
  defaultPrinterPowerWatts: number;
  defaultElectricityCostKwh: number;
  defaultPrinterDepreciationPerHour: number;
  defaultLaborHourlyRate: number;
  defaultMarkupPercent: number;
  currencySymbol: string;
  disableCriticalShippingAlerts?: boolean;
}
