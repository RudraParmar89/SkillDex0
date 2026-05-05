import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, CheckCircle, CreditCard, ShieldCheck, ArrowLeft, Smartphone, Building, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [checkoutSession, setCheckoutSession] = useState<{planName: string, amount: number, currency: string, billingCycle: string} | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to upgrade your account");
      navigate("/auth");
      return;
    }
    setCheckoutSession({
      planName: searchParams.get('plan') || 'pro',
      amount: parseFloat(searchParams.get('amount') || '499'),
      currency: searchParams.get('currency') || 'INR',
      billingCycle: searchParams.get('billing_cycle') || 'monthly'
    });
  }, [searchParams, user, navigate]);

  const handleDemoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutSession || !user) return;
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      // 1. Check or create customer
      let customerId;
      const { data: existingCustomer } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custError } = await supabase.from('billing_customers').insert({
          user_id: user.id, email: user.email, name: user.user_metadata?.full_name || 'Demo User',
          paddle_customer_id: 'demo_cust_' + Math.random().toString(36).substr(2, 9)
        }).select('id').single();
        if (custError) throw custError;
        customerId = newCustomer.id;
      }

      // 2. Insert Subscription & Transaction
      const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 1);
      
      await supabase.from('billing_subscriptions').insert({
        billing_customer_id: customerId,
        paddle_subscription_id: 'demo_sub_' + Math.random().toString(36).substr(2, 9),
        paddle_product_id: 'demo_prod_' + checkoutSession.planName,
        plan_name: checkoutSession.planName, plan_price: checkoutSession.amount,
        currency: checkoutSession.currency, billing_cycle: checkoutSession.billingCycle,
        status: 'active', started_at: new Date().toISOString(),
        current_period_end: endDate.toISOString(), next_billed_at: endDate.toISOString(),
      });

      await supabase.from('billing_transactions').insert({
        billing_customer_id: customerId,
        paddle_transaction_id: 'demo_tx_' + Math.random().toString(36).substr(2, 9),
        amount: checkoutSession.amount, currency: checkoutSession.currency,
        status: 'completed', type: 'subscription',
        receipt_number: 'DEMO-' + Math.floor(Math.random() * 1000000)
      });

      // Role upgrade
      if (checkoutSession.planName === 'enterprise') {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'recruiter' });
      }

      toast.success(`Successfully upgraded to ${checkoutSession.planName.toUpperCase()}!`);
      navigate('/billing');
    } catch (err) {
      console.error(err); toast.error('Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutSession) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 relative z-10">
        
        {/* Left Side: Summary & Back Button */}
        <div className="space-y-8 pt-8">
          <button onClick={() => navigate('/#plans')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Pricing
          </button>
          
          <div>
            <h1 className="text-4xl font-display font-bold mb-3">Upgrade to {checkoutSession.planName.toUpperCase()}</h1>
            <p className="text-muted-foreground text-lg">Unlock the full power of Skilldex.</p>
          </div>

          <div className="bg-secondary/50 rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-end border-b border-border pb-4 mb-4">
              <span className="text-muted-foreground font-medium">Billed {checkoutSession.billingCycle}</span>
              <span className="font-semibold text-xl">{checkoutSession.currency} {checkoutSession.amount}</span>
            </div>
            <div className="flex justify-between items-end text-2xl font-bold">
              <span>Total Due</span>
              <span className="text-primary">{checkoutSession.currency} {checkoutSession.amount}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <Card className="shadow-xl border-border bg-card">
          <CardHeader className="bg-secondary/30 border-b border-border rounded-t-xl pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Payment Method</CardTitle>
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 text-xs font-bold rounded uppercase tracking-wider border border-yellow-500/20">Demo Mode</span>
            </div>
            
            {/* Tabs */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { id: 'card', icon: CreditCard, label: 'Card' },
                { id: 'upi', icon: Smartphone, label: 'UPI' },
                { id: 'net', icon: Building, label: 'NetBank' },
                { id: 'gpay', icon: Wallet, label: 'GPay' }
              ].map(method => (
                <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`flex flex-col items-center justify-center py-3 rounded-lg border text-xs font-medium transition-all ${paymentMethod === method.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30'}`}>
                  <method.icon className="w-5 h-5 mb-1" />
                  {method.label}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleDemoPayment} className="space-y-5">
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <input type="text" disabled value="**** **** **** 4242" className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground" />
                  <div className="flex gap-4">
                    <input type="text" disabled value="12/34" className="w-1/2 px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground" />
                    <input type="text" disabled value="123" className="w-1/2 px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground" />
                  </div>
                </div>
              )}
              {paymentMethod === 'upi' && (
                <input type="text" disabled value="demo@upi" className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground" />
              )}
              {paymentMethod === 'net' && (
                <select disabled className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground"><option>State Bank of India (Demo)</option></select>
              )}
              {paymentMethod === 'gpay' && (
                <div className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-secondary/50 text-muted-foreground text-center font-medium">Google Pay Demo Active</div>
              )}

              <input type="text" required defaultValue={user?.user_metadata?.full_name || ""} className="w-full px-4 py-3 border border-border rounded-lg text-sm outline-none focus:border-primary bg-background" placeholder="Billing Name" />

              <Button type="submit" disabled={loading} className="w-full h-12 text-base mt-2 font-bold shadow-lg shadow-primary/25">
                {loading ? <><Loader className="h-5 w-5 mr-2 animate-spin" /> Processing...</> : `Pay ${checkoutSession.currency} ${checkoutSession.amount}`}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="w-4 h-4 text-green-500" /> <span>Simulated secure transaction</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CheckoutPage;