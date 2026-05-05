import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify payment completion
    const verifyPayment = async () => {
      try {
        setLoading(true);
        
        // Get transaction ID or cursor from Paddle
        const transactionId = searchParams.get('transaction_id');
        const cursor = searchParams.get('cursor');

        if (!transactionId && !cursor) {
          // Payment completed but we'll verify via database
          setSuccess(true);
          return;
        }

        // Verify with backend API
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId, cursor }),
        });

        if (response.ok) {
          setSuccess(true);
        } else {
          setError('Failed to verify payment. Please contact support.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Payment verification failed.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                Please check your email for payment confirmation. Your subscription may already be active.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => navigate('/billing')} className="w-full">
                Go to Billing
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Payment Successful!</CardTitle>
          <CardDescription className="text-green-600">
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
            <p className="text-slate-600">
              Thank you for your purchase! Your subscription is now active.
            </p>
            <p className="text-slate-600">
              A confirmation email has been sent to your inbox.
            </p>
            <p className="text-slate-600">
              You can now access all premium features.
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/billing')} variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </div>

          <div className="text-xs text-slate-500 text-center">
            <p>Questions? Check our help center or contact support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccessPage;
