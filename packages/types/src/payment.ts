import type { UUID, Timestamp } from './common';

export type PaymentType = 'job_payment' | 'subscription' | 'advance' | 'refund';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: UUID;
  agency_id?: UUID;
  job_id?: UUID;

  // Payment Details
  amount: number;
  payment_type: PaymentType;

  // Status
  status: PaymentStatus;

  // Payment Method
  payment_method?: string;
  payment_gateway_id?: string;

  // Invoice
  invoice_number?: string;
  invoice_url?: string;
  invoice_date?: Timestamp;
  due_date?: Timestamp;

  // Timestamps
  paid_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreatePaymentInput {
  agency_id?: UUID;
  job_id?: UUID;
  amount: number;
  payment_type: PaymentType;
  payment_method?: string;
  due_date?: Timestamp;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  payment_gateway_id?: string;
  invoice_number?: string;
  invoice_url?: string;
  paid_at?: Timestamp;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_date: Timestamp;
  agency_name: string;
  agency_address: string;
  agency_gstn: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}
