export interface HostedSite {
  id: string;
  user_id: string;
  generation_id: string | null;
  domain: string;
  domain_purchased: boolean;
  domain_verified: boolean;
  vercel_project_id: string | null;
  vercel_project_name: string | null;
  vercel_deployment_id: string | null;
  vercel_deployment_url: string | null;
  billing_plan: 'monthly' | 'annual';
  billing_amount: number | null;
  domain_price: number | null;
  status: 'pending' | 'live' | 'failed' | 'cancelled';
  error_message: string | null;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

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
