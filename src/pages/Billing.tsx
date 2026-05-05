import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader, CreditCard, Clock, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: customer } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      if (!customer) { setSubscription(null); setTransactions([]); return; }

      const { data: subData } = await supabase.from('billing_subscriptions').select('*').eq('billing_customer_id', customer.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setSubscription(subData);

      const { data: txData } = await supabase.from('billing_transactions').select('*').eq('billing_customer_id', customer.id).order('created_at', { ascending: false });
      setTransactions(txData || []);
    } catch (err) {
      console.error(err); setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/');
    setTimeout(() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.status === 'canceled') return;
    const confirmCancel = window.confirm("Are you sure you want to cancel your subscription? You will lose premium features.");
    if (!confirmCancel) return;

    try {
      setLoading(true);
      
      // 1. Update the subscription to canceled
      const { error: updateError } = await supabase.from('billing_subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString(), next_billed_at: null })
        .eq('id', subscription.id);
        
      if (updateError) throw updateError;

      // 2. Create a Cancellation Log in the transactions table
      await supabase.from('billing_transactions').insert({
        billing_customer_id: subscription.billing_customer_id,
        paddle_transaction_id: 'cancel_' + Math.random().toString(36).substr(2, 9),
        amount: 0,
        currency: subscription.currency,
        status: 'completed',
        type: 'cancellation', // Marked explicitly as a cancellation
        receipt_number: 'CANCEL-' + Math.floor(Math.random() * 1000000)
      });

      // 3. Remove recruiter role if downgrading from Enterprise
      if (subscription.plan_name === 'enterprise') {
        await supabase.from('user_roles').delete().eq('user_id', user?.id).eq('role', 'recruiter');
      }

      toast.success("Subscription canceled successfully.");
      await loadBillingData(); // Reload the page to show changes
    } catch (err) {
      console.error(err); toast.error("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pt-12 pb-20">
      
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div>
        <h1 className="text-3xl font-display font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your active plan and payment history</p>
      </div>

      {error && <Alert className="bg-destructive/10 border-destructive/20 text-destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Card className="border-border shadow-md">
        <CardHeader className="bg-secondary/30 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-primary" /> Current Plan</CardTitle>
          <CardDescription>Manage your premium features</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-sm text-muted-foreground font-medium mb-1">Plan</p><p className="text-3xl font-display font-bold capitalize text-foreground">{subscription.plan_name}</p></div>
                <div><p className="text-sm text-muted-foreground font-medium mb-2">Status</p><Badge variant="outline" className={`capitalize px-3 py-1 ${getStatusColor(subscription.status)}`}>{subscription.status}</Badge></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div><p className="text-sm text-muted-foreground font-medium">Billing Cycle</p><p className="capitalize font-medium">{subscription.billing_cycle}</p></div>
                <div><p className="text-sm text-muted-foreground font-medium">Price</p><p className="text-lg font-bold text-primary">{subscription.currency} {subscription.plan_price}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Next Billing Date</p>
                    <p className="font-medium">
                      {/* Hide next billing date if canceled */}
                      {subscription.status === 'canceled' ? 'Canceled' : (subscription.next_billed_at ? new Date(subscription.next_billed_at).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                </div>
                <div><p className="text-sm text-muted-foreground font-medium">Started</p><p className="font-medium">{new Date(subscription.started_at).toLocaleDateString()}</p></div>
              </div>

              <div className="pt-6 flex gap-3">
                <Button onClick={handleUpgrade} className="flex-1 font-semibold">Change Plan</Button>
                {/* The Cancel button will naturally disappear when status is canceled */}
                {subscription.status === 'active' && <Button onClick={handleCancelSubscription} variant="destructive" className="flex-1 font-semibold"><XCircle className="w-4 h-4 mr-2" /> Cancel Subscription</Button>}
              </div>
            </>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2"><CreditCard className="w-8 h-8 text-muted-foreground" /></div>
              <h3 className="text-xl font-display font-semibold">No active subscription</h3>
              <p className="text-muted-foreground">Upgrade to a Pro or Enterprise plan to unlock all features.</p>
              <Button onClick={handleUpgrade} className="mt-4 px-8">View Pricing Plans</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-md">
        <CardHeader className="bg-secondary/30 border-b border-border"><CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" /> Billing History</CardTitle></CardHeader>
        <CardContent className="pt-6">
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {t.type === 'cancellation' ? `Cancellation #${t.receipt_number}` : (t.receipt_number ? `Receipt #${t.receipt_number}` : 'Transaction')}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Make cancellations show up as red "CANCELED" text instead of a price */}
                    <p className={`font-bold ${t.type === 'cancellation' ? 'text-destructive' : 'text-primary'}`}>
                      {t.type === 'cancellation' ? 'Canceled' : `${t.currency} ${t.amount}`}
                    </p>
                    <Badge variant="outline" className={`mt-1 text-[10px] uppercase tracking-wider ${t.type === 'cancellation' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`}>
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground py-8">No transactions yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;