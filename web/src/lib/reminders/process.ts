import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/lib/env/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type Delivery = { id: string; letter_id: string; user_id: string; attempt_count: number };

export async function processDueReminders() {
  const admin = createSupabaseAdmin();
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY 未配置");
  const resend = new Resend(env.RESEND_API_KEY);
  const { error: enqueueError } = await admin.rpc("enqueue_due_reminders");
  if (enqueueError) throw enqueueError;
  const { data, error: claimError } = await admin.rpc("claim_reminder_batch", { p_limit: 50, p_lease_seconds: 300 });
  if (claimError) throw claimError;
  const deliveries = (data ?? []) as Delivery[];
  const results = await Promise.allSettled(deliveries.map(async (delivery) => {
    const [{ data: profile, error: profileError }, { data: letter, error: letterError }] = await Promise.all([
      admin.from("profiles").select("email,account_state").eq("id", delivery.user_id).single(),
      admin.from("letters").select("title,unlock_at").eq("id", delivery.letter_id).single(),
    ]);
    if (profileError || letterError || profile?.account_state !== "active") throw profileError ?? letterError ?? new Error("账号不可用");
    const { data: sent, error: sendError } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: profile.email,
      subject: "你写给未来的一封信，今天可以启封了",
      html: `<div style="font-family:serif;max-width:560px;margin:auto;color:#3b2b20"><h1 style="font-weight:normal">树洞来信</h1><p>你曾写下的「${escapeHtml(letter.title)}」，今天已经可以启封。</p><p><a href="${siteUrl()}/letters/${delivery.letter_id}">回到树洞，亲手启封</a></p><p style="color:#7b6a5a;font-size:12px">为了保护隐私，这封邮件不会展示信件正文。</p></div>`,
    });
    if (sendError) throw new Error(sendError.message);
    const { error: updateError } = await admin.from("reminder_deliveries").update({ status: "sent", provider_message_id: sent?.id ?? null, sent_at: new Date().toISOString(), lease_expires_at: null, last_error_code: null, last_error_message: null }).eq("id", delivery.id).eq("status", "sending");
    if (updateError) throw updateError;
  }));
  await Promise.all(results.map(async (result, index) => {
    if (result.status === "fulfilled") return;
    const delivery = deliveries[index];
    const backoffMinutes = Math.min(24 * 60, 5 * 2 ** Math.max(0, delivery.attempt_count - 1));
    await admin.from("reminder_deliveries").update({ status: "failed", lease_expires_at: null, next_attempt_at: new Date(Date.now() + backoffMinutes * 60000).toISOString(), last_error_code: "SEND_FAILED", last_error_message: result.reason instanceof Error ? result.reason.message.slice(0, 300) : "unknown" }).eq("id", delivery.id).eq("status", "sending");
  }));
  return { claimed: deliveries.length, sent: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length };
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!); }
function siteUrl() { return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""); }
