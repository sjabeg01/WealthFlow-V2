-- ============================================================
-- WealthFlow v2 — Migration 003: System Categories Seed
-- Inserts default system categories for new users via a trigger.
-- ============================================================

-- Function to seed default categories on first sign-up
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, is_system)
  VALUES
    (NEW.id, 'Groceries',        '#4CAF50', 'ShoppingCart',    true),
    (NEW.id, 'Dining Out',       '#FF9800', 'Utensils',        true),
    (NEW.id, 'Transport',        '#2196F3', 'Car',             true),
    (NEW.id, 'Fuel',             '#607D8B', 'Fuel',            true),
    (NEW.id, 'Rent / Mortgage',  '#9C27B0', 'Home',            true),
    (NEW.id, 'Utilities',        '#00BCD4', 'Zap',             true),
    (NEW.id, 'Health',           '#F44336', 'Heart',           true),
    (NEW.id, 'Insurance',        '#795548', 'Shield',          true),
    (NEW.id, 'Subscriptions',    '#3F51B5', 'Repeat',          true),
    (NEW.id, 'Entertainment',    '#E91E63', 'Tv',              true),
    (NEW.id, 'Shopping',         '#FF5722', 'ShoppingBag',     true),
    (NEW.id, 'Education',        '#009688', 'BookOpen',        true),
    (NEW.id, 'Travel',           '#FFC107', 'Plane',           true),
    (NEW.id, 'Investments',      '#8BC34A', 'TrendingUp',      true),
    (NEW.id, 'Salary / Income',  '#4CAF50', 'Banknote',        true),
    (NEW.id, 'Transfers',        '#9E9E9E', 'ArrowLeftRight',  true),
    (NEW.id, 'Fees & Charges',   '#F44336', 'Receipt',         true),
    (NEW.id, 'Uncategorized',    '#9E9E9E', 'HelpCircle',      true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: run after new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_categories();
