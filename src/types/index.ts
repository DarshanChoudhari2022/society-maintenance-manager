export interface SocietyType {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  totalFlats: number;
  maintenanceAmt: number;
  dueDayOfMonth: number;
  lateFee: number;
  upiId: string | null;
  bankDetails: string | null;
  planTier: string;
  createdAt: Date;
}

export interface FlatType {
  id: string;
  societyId: string;
  flatNumber: string;
  wing: string | null;
  floor: number | null;
  ownerName: string;
  tenantName: string | null;
  contact: string;
  email: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceBillType {
  id: string;
  flatId: string;
  societyId: string;
  amount: number;
  lateFee: number;
  period: string;
  dueDate: Date;
  status: string;
  paidAt: Date | null;
  paidVia: string | null;
  paidAmount: number | null;
  receiptNote: string | null;
  receiptNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  flat?: FlatType;
}

export interface BillWithFlat extends MaintenanceBillType {
  flat: FlatType;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  societyId: string | null;
  flatId: string | null;
  createdAt: Date;
}

export interface ExpenseType {
  id: string;
  societyId: string;
  title: string;
  amount: number;
  category: string;
  paidTo: string | null;
  paidOn: Date;
  notes: string | null;
  createdAt: Date;
}

export interface ReminderLogType {
  id: string;
  flatId: string;
  billId: string | null;
  channel: string;
  sentAt: Date;
  status: string;
  messageBody: string;
}

export interface BillingSummary {
  paid: number;
  pending: number;
  total: number;
  collectedAmount: number;
  pendingAmount: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}
