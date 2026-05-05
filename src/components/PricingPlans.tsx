import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  { 
    name: "Free", price: "₹0", period: "forever", icon: Zap, accent: false, 
    features: ["3 resume scans / month", "Basic ATS score", "View job listings", "Apply to 5 jobs / month"], 
    cta: "Get Started", action: "free" 
  },
  { 
    name: "Pro", price: "₹499", period: "/ month", icon: Sparkles, accent: true, 
    features: ["Unlimited resume scans", "AI-powered detailed feedback", "Priority job applications", "Keyword optimization tips"], 
    cta: "Upgrade to Pro", action: "pro" 
  },
  { 
    name: "Enterprise", price: "₹1,999", period: "/ month", icon: Crown, accent: false, 
    features: ["Everything in Pro", "Recruiter dashboard access", "Candidate ranking & analytics", "Dedicated account manager"], 
    cta: "Upgrade to Enterprise", action: "enterprise" 
  },
];

const PricingPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkPlan = async () => {
      const { data: cust } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
      if (cust) {
        // Fix: Order by latest created and limit to 1 so it doesn't crash if there are multiple records
        const { data: sub } = await supabase
          .from('billing_subscriptions')
          .select('plan_name, status')
          .eq('billing_customer_id', cust.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (sub && sub.status === 'active') {
          setActivePlan(sub.plan_name);
        } else {
          setActivePlan(null); // Explicitly reset if canceled
        }
      }
    };
    checkPlan();
  }, [user]);

  const handlePlanSelection = (action: string) => {
    if (action === "free") navigate("/auth");
    else if (action === "pro") navigate("/checkout?plan=pro&amount=499&currency=INR&billing_cycle=monthly");
    else if (action === "enterprise") navigate("/checkout?plan=enterprise&amount=1999&currency=INR&billing_cycle=monthly");
  };

  const renderCard = (plan: any) => (
    <div key={plan.name} className={`relative rounded-2xl p-6 flex flex-col ${plan.accent ? "bg-foreground text-background shadow-2xl scale-[1.03] border-0" : "bg-card border border-border shadow-sm"}`}>
      {plan.accent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground uppercase">Most Popular</div>}
      <div className="flex items-center gap-2 mb-4">
        <plan.icon className={`w-6 h-6 ${plan.accent ? "text-primary" : "text-primary"}`} />
        <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
      </div>
      <div className="mb-5"><span className="text-3xl font-display font-bold">{plan.price}</span><span className="text-sm ml-1 opacity-60">{plan.period}</span></div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 mt-0.5 text-primary" /> <span className="opacity-80">{f}</span></li>)}
      </ul>
      <button onClick={() => handlePlanSelection(plan.action)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.accent ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
        {plan.cta}
      </button>
    </div>
  );

  return (
    <section id="plans" className="py-24 px-6 relative overflow-hidden bg-background">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* IF USER HAS ENTERPRISE */}
        {activePlan === 'enterprise' ? (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-12 text-center max-w-2xl mx-auto border-primary/20 bg-primary/5">
             <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Crown className="w-8 h-8 text-primary" />
             </div>
             <h2 className="text-3xl font-display font-bold mb-4">You're an ENTERPRISE Member!</h2>
             <p className="text-muted-foreground mb-8">You have unlocked everything. Enjoy full ATS analysis, recruiter dashboard, and unlimited features.</p>
             <button onClick={() => navigate('/billing')} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-primary/90 transition">
               Manage Subscription <ArrowRight className="w-4 h-4" />
             </button>
           </motion.div>
           
        /* IF USER HAS PRO */
        ) : activePlan === 'pro' ? (
           <div className="space-y-16">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-12 text-center max-w-2xl mx-auto border-primary/20 bg-primary/5">
               <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
               </div>
               <h2 className="text-3xl font-display font-bold mb-4">You're a PRO Member!</h2>
               <p className="text-muted-foreground mb-8">You currently have access to unlimited AI scans and detailed feedback.</p>
               <button onClick={() => navigate('/billing')} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-primary/90 transition">
                 Manage Subscription <ArrowRight className="w-4 h-4" />
               </button>
             </motion.div>
             
             <div className="text-center pt-8 border-t border-border">
                <h3 className="text-2xl font-display font-bold mb-8">Need Recruiter Features? Upgrade to Enterprise</h3>
                <div className="max-w-md mx-auto text-left">
                    {renderCard(plans.find(p => p.action === 'enterprise'))}
                </div>
             </div>
           </div>
           
        /* IF USER IS FREE / CANCELED / LOGGED OUT */
        ) : (
          <>
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">Pricing</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Choose your plan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(renderCard)}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PricingPlans;