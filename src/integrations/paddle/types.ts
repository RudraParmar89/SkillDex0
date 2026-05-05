// Paddle Payment Integration Types

export interface PaddleProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle?: 'monthly' | 'yearly';
}

export interface PaddlePrice {
  product_id: string;
  currency: string;
  amount: number;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface PaddleCustomer {
  id: string;
  email: string;
  name?: string;
  addresses?: PaddleAddress[];
}

export interface PaddleAddress {
  city: string;
  country_code: string;
  postal_code: string;
  region: string;
  street?: string;
}

export interface PaddleSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'paused' | 'past_due' | 'canceled' | 'trialing';
  current_billing_period_start?: string;
  current_billing_period_end?: string;
  started_at: string;
  paused_at?: string;
  canceled_at?: string;
  next_billed_at?: string;
  billing_cycle: 'monthly' | 'yearly';
  discount_id?: string;
  custom_data?: Record<string, unknown>;
}

export interface PaddleTransaction {
  id: string;
  customer_id: string;
  subscription_id?: string;
  product_id?: string;
  status: 'completed' | 'pending' | 'failed' | 'ready' | 'processing';
  currency_code: string;
  billed_at: string;
  created_at: string;
  receipt_number?: string;
  receipt_url?: string;
  details: {
    line_items: Array<{
      product_id: string;
      quantity: number;
      price_id?: string;
    }>;
  };
}

export interface PaddleCheckoutSession {
  checkout_id: string;
  status: string;
  completion_date?: string;
  customer_id?: string;
  subscription_id?: string;
  transaction_id?: string;
}

export interface PaddleWebhookEvent {
  event_id: string;
  event_type: 
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.activated'
    | 'subscription.trialed'
    | 'subscription.paused'
    | 'subscription.resumed'
    | 'subscription.past_due'
    | 'subscription.canceled'
    | 'transaction.created'
    | 'transaction.updated'
    | 'transaction.completed'
    | 'transaction.payment_failed';
  data: Record<string, unknown>;
  occurred_at: string;
}
