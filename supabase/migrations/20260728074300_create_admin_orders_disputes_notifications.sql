/*
# Admin tables: orders, disputes, admin_notifications, admin audit

## Purpose
The admin interface needs tables to track orders, disputes, and notifications.
These support the /admin sections for orders, disputes, finances, and the
notification bell.

## 1. New table `orders`
Tracks every order placed on EthiMarket.
- id (uuid PK)
- buyer_id (uuid, nullable)
- producer_id (uuid FK producers.id, nullable)
- product_id (uuid FK products.id, nullable)
- quantity, unit, unit_price, total_amount, commission_rate, commission_amount, escrow_amount
- status (new/processing/shipped/delivered/disputed/cancelled/refunded)
- shipping_method, shipping_cost, customs_cost, tracking_number, notes
- created_at, updated_at

## 2. New table `disputes`
- id, order_id (FK), buyer_id, producer_id, reason, description, status, priority, resolution, refund_amount
- created_at, resolved_at, updated_at

## 3. New table `admin_notifications`
- id, type, title, message, link, priority, read, created_at

## 4. New table `admin_audit_log`
- id, admin_id, action, target_type, target_id, details (jsonb), created_at

## 5. Security
- RLS enabled on all. Public read (anon+authenticated), authenticated writes.

## 6. Seed sample orders + disputes + notifications for demo.
*/

-- ── orders ──
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid,
  producer_id uuid REFERENCES producers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'kg',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0.05,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  escrow_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','processing','shipped','delivered','disputed','cancelled','refunded')),
  shipping_method text,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  customs_cost numeric(10,2) NOT NULL DEFAULT 0,
  tracking_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_orders" ON orders;
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE TO authenticated USING (true);

-- ── disputes ──
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid,
  producer_id uuid,
  reason text NOT NULL DEFAULT 'other' CHECK (reason IN ('quality','delivery','authenticity','payment','other')),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','urgent')),
  resolution text,
  refund_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_disputes" ON disputes;
CREATE POLICY "public_read_disputes" ON disputes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_disputes" ON disputes;
CREATE POLICY "auth_insert_disputes" ON disputes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_disputes" ON disputes;
CREATE POLICY "auth_update_disputes" ON disputes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_disputes" ON disputes;
CREATE POLICY "auth_delete_disputes" ON disputes FOR DELETE TO authenticated USING (true);

-- ── admin_notifications ──
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_producer','dispute','expiring_cert','fraud','new_order')),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  link text,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','urgent')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_admin_notifs" ON admin_notifications;
CREATE POLICY "public_read_admin_notifs" ON admin_notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_admin_notifs" ON admin_notifications;
CREATE POLICY "auth_insert_admin_notifs" ON admin_notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_admin_notifs" ON admin_notifications;
CREATE POLICY "auth_update_admin_notifs" ON admin_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_admin_notifs" ON admin_notifications;
CREATE POLICY "auth_delete_admin_notifs" ON admin_notifications FOR DELETE TO authenticated USING (true);

-- ── admin_audit_log ──
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_audit" ON admin_audit_log;
CREATE POLICY "public_read_audit" ON admin_audit_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_audit" ON admin_audit_log;
CREATE POLICY "auth_insert_audit" ON admin_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ── updated_at triggers ──
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_touch_orders ON orders;
CREATE TRIGGER trg_touch_orders BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_disputes ON disputes;
CREATE TRIGGER trg_touch_disputes BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Seed sample orders + disputes + notifications ──
DO $$
DECLARE
  v_p_argan uuid; v_p_yirg uuid; v_p_saffron uuid;
  v_argan uuid; v_yirg uuid; v_saffron uuid;
  v_disputed_order uuid;
BEGIN
  SELECT id INTO v_p_argan FROM producers WHERE slug = 'argan-atlas';
  SELECT id INTO v_p_yirg FROM producers WHERE slug = 'yirgacheffe-union';
  SELECT id INTO v_p_saffron FROM producers WHERE slug = 'saffron-fields';
  SELECT id INTO v_argan FROM products WHERE slug = 'huile-argan-bio';
  SELECT id INTO v_yirg FROM products WHERE slug = 'cafe-ethiopien-yirgacheffe';
  SELECT id INTO v_saffron FROM products WHERE slug = 'safran-premium';

  INSERT INTO orders (producer_id, product_id, quantity, unit, unit_price, total_amount, commission_amount, escrow_amount, status, shipping_method, shipping_cost, customs_cost, created_at) VALUES
    (v_p_argan, v_argan, 50, 'L', 28.00, 1400.00, 70.00, 700.00, 'delivered', 'DHL Express', 245.00, 77.00, now() - INTERVAL '25 days'),
    (v_p_yirg, v_yirg, 100, 'kg', 18.00, 1800.00, 90.00, 900.00, 'shipped', 'UPS Standard', 180.00, 99.00, now() - INTERVAL '10 days'),
    (v_p_saffron, v_saffron, 500, 'g', 8.00, 4000.00, 200.00, 2000.00, 'processing', 'DHL Express', 245.00, 220.00, now() - INTERVAL '5 days'),
    (v_p_argan, v_argan, 20, 'L', 28.00, 560.00, 28.00, 280.00, 'new', 'Maritime', 65.00, 30.80, now() - INTERVAL '2 days'),
    (v_p_yirg, v_yirg, 200, 'kg', 18.00, 3600.00, 180.00, 1800.00, 'disputed', 'UPS Standard', 180.00, 198.00, now() - INTERVAL '15 days')
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO v_disputed_order FROM orders WHERE status = 'disputed' LIMIT 1;
  IF v_disputed_order IS NOT NULL THEN
    INSERT INTO disputes (order_id, producer_id, reason, description, status, priority, created_at) VALUES
      (v_disputed_order, v_p_yirg, 'quality', 'Le café reçu ne correspond pas à la qualité annoncée. Grains non triés.', 'open', 'urgent', now() - INTERVAL '3 days')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO admin_notifications (type, title, message, link, priority, read, created_at) VALUES
    ('new_producer', 'Nouveau producteur à vérifier', 'Coopérative Argan Atlas a soumis sa vérification', '/admin/verifications', 'normal', false, now() - INTERVAL '1 day'),
    ('dispute', 'Litige urgent à résoudre', 'Commande café Yirgacheffe — qualité non conforme', '/admin/disputes', 'urgent', false, now() - INTERVAL '3 days'),
    ('expiring_cert', 'Certificat expirant bientôt', 'Certification Bio de Saffron Fields expire dans 30 jours', '/admin/certifications', 'normal', false, now() - INTERVAL '5 days'),
    ('new_order', 'Nouvelle commande', 'Commande de 20L d''huile d''argan reçue', '/admin/orders', 'low', true, now() - INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;
END $$;
