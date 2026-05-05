// Supabase Edge Function: Handle Paddle Webhooks
// Deploy to: /functions/paddle-webhooks

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET") || "";

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const secret = encoder.encode(PADDLE_WEBHOOK_SECRET);
  
  const algorithm = { name: "HMAC", hash: "SHA-256" };
  const key = await crypto.subtle.importKey("raw", secret, algorithm, false, ["sign"]);
  const signatureBytes = await crypto.subtle.sign(algorithm, key, data);
  
  const hashArray = Array.from(new Uint8Array(signatureBytes));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex === signature;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("Paddle-Signature");
    const body = await req.text();

    if (!signature || !(await verifySignature(body, signature))) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paddle webhook event:", event.event_type);

    // Store the event for audit
    await supabase.from("billing_events").insert({
      paddle_event_id: event.event_id,
      event_type: event.event_type,
      event_data: event.data,
    });

    // Handle different event types
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionEvent(event);
        break;
      
      case "subscription.activated":
        await updateSubscriptionStatus(event.data.id, "active");
        break;
      
      case "subscription.paused":
        await updateSubscriptionStatus(event.data.id, "paused");
        break;
      
      case "subscription.resumed":
        await updateSubscriptionStatus(event.data.id, "active");
        break;
      
      case "subscription.past_due":
        await updateSubscriptionStatus(event.data.id, "past_due");
        break;
      
      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;
      
      case "transaction.created":
      case "transaction.updated":
      case "transaction.completed":
        await handleTransactionEvent(event);
        break;
      
      default:
        console.log("Unhandled event type:", event.event_type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleSubscriptionEvent(event: any) {
  const data = event.data;
  const paddleCustomerId = data.customer_id;
  
  // Find the billing customer
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("paddle_customer_id", paddleCustomerId)
    .single();

  if (!billingCustomer) {
    console.error("Billing customer not found:", paddleCustomerId);
    return;
  }

  // Upsert subscription
  const items = data.items?.[0];
  if (!items) return;

  await supabase.from("billing_subscriptions").upsert(
    {
      billing_customer_id: billingCustomer.id,
      paddle_subscription_id: data.id,
      paddle_product_id: items.product_id,
      paddle_price_id: items.price_id,
      plan_name: data.custom_data?.plan_name || "pro",
      plan_price: items.price?.amount || 0,
      currency: items.price?.currency_code || "INR",
      billing_cycle: items.price?.billing_cycle?.interval || "monthly",
      status: data.status || "active",
      started_at: data.started_at,
      current_period_start: data.current_billing_period?.starts_at,
      current_period_end: data.current_billing_period?.ends_at,
      next_billed_at: data.next_billed_at,
      trial_ends_at: data.trialing_period?.ends_at,
    },
    { onConflict: "paddle_subscription_id" }
  );
}

async function updateSubscriptionStatus(subscriptionId: string, status: string) {
  await supabase
    .from("billing_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", subscriptionId);
}

async function handleSubscriptionCanceled(data: any) {
  await supabase
    .from("billing_subscriptions")
    .update({
      status: "canceled",
      canceled_at: data.canceled_at,
      cancel_reason: data.cancel_reason,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id);
}

async function handleTransactionEvent(event: any) {
  const data = event.data;
  const paddleCustomerId = data.customer_id;

  // Find the billing customer
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("paddle_customer_id", paddleCustomerId)
    .single();

  if (!billingCustomer) {
    console.error("Billing customer not found:", paddleCustomerId);
    return;
  }

  // Find subscription if exists
  let subscriptionId = null;
  if (data.subscription_id) {
    const { data: subscription } = await supabase
      .from("billing_subscriptions")
      .select("id")
      .eq("paddle_subscription_id", data.subscription_id)
      .single();
    
    subscriptionId = subscription?.id;
  }

  // Insert transaction
  const { details } = data;
  const amount = details?.line_items?.[0]?.total?.amount || 0;
  const currency = details?.line_items?.[0]?.total?.currency_code || "INR";

  await supabase.from("billing_transactions").insert({
    billing_customer_id: billingCustomer.id,
    billing_subscription_id: subscriptionId,
    paddle_transaction_id: data.id,
    amount,
    currency,
    status: data.status,
    type: data.subscription_id ? "subscription" : "one_time",
    receipt_url: data.receipt?.url,
    receipt_number: data.receipt?.number,
  });
}
