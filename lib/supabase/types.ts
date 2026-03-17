export interface Generation {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  page_count: number;
  created_at: string;
  form_data: Record<string, unknown>;
  files: string | null;
}

export interface StripeCustomer {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: 'free' | 'pro';
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}
