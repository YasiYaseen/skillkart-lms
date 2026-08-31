import { api } from '@/lib/api';

export interface PayoutInstructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PayoutAccountDetails {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
}

export interface AdminPayoutRecord {
  _id: string;
  instructor: PayoutInstructor | null;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: PayoutAccountDetails;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  referenceNumber: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutsSummary {
  pending: { count: number; amount: number };
  processing: { count: number; amount: number };
  completed: { count: number; amount: number };
  rejected: { count: number; amount: number };
  totalCount: number;
}

export interface PayoutsResponse {
  payouts: AdminPayoutRecord[];
  summary: PayoutsSummary;
}

export async function fetchAdminPayouts(status?: string, search?: string): Promise<PayoutsResponse> {
  const params: Record<string, string> = {};
  if (status && status !== 'all') params.status = status;
  if (search && search.trim()) params.search = search.trim();

  const res = await api.get<PayoutsResponse>('/admin/payouts', { params });
  return res.data;
}

export async function updateAdminPayoutStatus(
  payoutId: string,
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  notes?: string
): Promise<{ message: string; payout: AdminPayoutRecord }> {
  const res = await api.patch<{ message: string; payout: AdminPayoutRecord }>(
    `/admin/payouts/${payoutId}/status`,
    { status, notes }
  );
  return res.data;
}

export async function exportAdminPayoutsCsv(status?: string): Promise<Blob> {
  const params: Record<string, string> = {};
  if (status && status !== 'all') params.status = status;

  const res = await api.get('/admin/payouts/export-csv', {
    params,
    responseType: 'blob',
  });
  return res.data;
}
