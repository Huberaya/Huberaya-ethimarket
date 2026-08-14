import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TEMPLATES: Record<string, { subject: string; body: (ctx: Record<string, string>) => string }> = {
  welcome: {
    subject: "Bienvenue sur EthiMarket — Commencez votre vérification",
    body: (c) => `Bonjour ${c.name},\n\nBienvenue sur EthiMarket ! Pour commencer à vendre, vous devez compléter les 5 sections de vérification producteur.\n\nConnectez-vous à votre tableau de bord et rendez-vous dans l'onglet "Vérification".\n\nL'équipe EthiMarket`,
  },
  section_approved: {
    subject: "Section validée — Continuez !",
    body: (c) => `Bonjour ${c.name},\n\nLa section "${c.section}" de votre vérification a été validée. Continuez avec les sections restantes !\n\nL'équipe EthiMarket`,
  },
  section_rejected: {
    subject: "Section à corriger — Modifications nécessaires",
    body: (c) => `Bonjour ${c.name},\n\nLa section "${c.section}" a été rejetée.\nMotif : ${c.reason}\n\nVeuillez corriger et renvoyer depuis votre tableau de bord.\n\nL'équipe EthiMarket`,
  },
  verification_complete: {
    subject: "Vérification complète — Vous pouvez vendre !",
    body: (c) => `Bonjour ${c.name},\n\nToutes les sections de votre vérification sont validées. Vous pouvez désormais publier des produits et recevoir des commandes !\nBadge attribué : ${c.badge}.\n\nL'équipe EthiMarket`,
  },
  cert_expiring: {
    subject: "Certificat expire bientôt — Renouvelez",
    body: (c) => `Bonjour ${c.name},\n\nVotre certificat "${c.cert_type}" expire le ${c.expires_at}. Pensez à le renouveler pour conserver votre badge.\n\nL'équipe EthiMarket`,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { template, producer_id, context } = await req.json();
    const tpl = TEMPLATES[template];
    if (!tpl) {
      return new Response(JSON.stringify({ error: "Unknown template" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: producer } = await supabase
      .from("producers")
      .select("name, user_id")
      .eq("id", producer_id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", producer?.user_id)
      .maybeSingle();

    const email = profile?.email ?? "";
    const name = profile?.full_name ?? producer?.name ?? "Producteur";
    const body = tpl.body({ ...context, name });

    // Insert into a notifications table (created separately) or log
    await supabase.from("verification_logs").insert({
      verification_id: null,
      action: `email:${template}`,
      message: `Sent to ${email}: ${tpl.subject}`,
    });

    // In production, integrate with an email provider (Resend, SendGrid, etc.)
    console.log(`[EMAIL] To: ${email} | Subject: ${tpl.subject}\n${body}`);

    return new Response(JSON.stringify({ success: true, sent_to: email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
