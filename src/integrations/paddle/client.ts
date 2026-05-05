// Paddle Client Configuration
import Paddle from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;

export const initializePaddle = async (): Promise<Paddle> => {
  if (paddleInstance) {
    return paddleInstance;
  }

  const apiKey = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  
  if (!apiKey) {
    throw new Error('VITE_PADDLE_CLIENT_TOKEN is not defined in environment variables');
  }

  // Initialize Paddle with your client token
  paddleInstance = await Paddle.Setup({
    token: apiKey,
    environment: import.meta.env.VITE_PADDLE_ENVIRONMENT || 'production',
    eventCallback: (event) => {
      console.log('[Paddle Event]', event);
    }
  });

  return paddleInstance;
};

export const getPaddle = (): Paddle => {
  if (!paddleInstance) {
    throw new Error('Paddle is not initialized. Call initializePaddle() first.');
  }
  return paddleInstance;
};

export const openCheckout = async (options: {
  productId?: string;
  priceId?: string;
  email?: string;
  customData?: Record<string, unknown>;
  successUrl?: string;
  type?: 'inline' | 'overlay';
}): Promise<void> => {
  const paddle = getPaddle();
  
  const checkoutOptions: any = {
    settings: {
      displayMode: options.type || 'overlay',
      theme: 'light',
      variant: 'all',
      frameInitialHeight: 450,
      successUrl: options.successUrl || `${window.location.origin}/payment-success`,
      closeFrameInitialHeight: 450,
    }
  };

  if (options.productId) {
    checkoutOptions.items = [{ product_id: options.productId }];
  } else if (options.priceId) {
    checkoutOptions.items = [{ price_id: options.priceId }];
  }

  if (options.email) {
    checkoutOptions.customer = { email: options.email };
  }

  if (options.customData) {
    checkoutOptions.customData = options.customData;
  }

  return paddle.Checkout.open && paddle.Checkout.open(checkoutOptions);
};

export const createPaymentLink = async (options: {
  productId?: string;
  priceId?: string;
  discountCode?: string;
  customData?: Record<string, unknown>;
}): Promise<string> => {
  // This would typically be called from your backend
  // to create a checkout link via Paddle API
  throw new Error('Create payment link should be called from backend API');
};
