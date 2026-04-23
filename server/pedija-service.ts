/**
 * PedijaService — sincroniza o cardápio do restaurante (produtos PDV) com o
 * BuscaZap (Pedijá) via PDV API REST.
 *
 * Variáveis de ambiente necessárias no .env do PDV:
 *   BUSCAZAP_APP_API_URL   — ex: https://app.buscazap.com
 *   PDV_API_SECRET         — segredo compartilhado (x-pdv-secret)
 *
 * O fluxo:
 *   1. Ao criar produto (businessType === restaurant) → cria menuItem no BuscaZap
 *   2. Ao editar produto → atualiza menuItem no BuscaZap
 *   3. Ao deletar produto → remove menuItem no BuscaZap
 *   4. O seller precisa ter `buscazapCompanyId` configurado para o sync funcionar.
 *
 * Cada produto pode ter `buscazapMenuItemId` salvo localmente para mapear
 * o ID do item criado no BuscaZap — campo adicionado na migração 0005.
 */

const BASE = () => process.env.BUSCAZAP_APP_API_URL?.replace(/\/$/, "") ?? "";
const SECRET = () => process.env.PDV_API_SECRET ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    "x-pdv-secret": SECRET(),
  };
}

export interface MenuItemPayload {
  name: string;
  description?: string | null;
  price: string;
  categoryId?: number | null;
  imageUrl?: string | null;
  isActive?: number;
}

/** Cria item no cardápio do BuscaZap e retorna o ID criado. */
export async function syncCreateMenuItem(
  buscazapCompanyId: number,
  payload: MenuItemPayload
): Promise<number | null> {
  const base = BASE();
  if (!base || !SECRET()) return null;
  try {
    const res = await fetch(`${base}/api/pdv/menu/${buscazapCompanyId}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[PedijaService] createMenuItem failed: ${res.status}`, await res.text());
      return null;
    }
    const data = (await res.json()) as { ok: boolean; id?: number };
    return data.id ?? null;
  } catch (err) {
    console.error("[PedijaService] createMenuItem error:", err);
    return null;
  }
}

/** Atualiza item no cardápio do BuscaZap. */
export async function syncUpdateMenuItem(
  buscazapCompanyId: number,
  buscazapMenuItemId: number,
  payload: Partial<MenuItemPayload>
): Promise<boolean> {
  const base = BASE();
  if (!base || !SECRET()) return false;
  try {
    const res = await fetch(`${base}/api/pdv/menu/${buscazapCompanyId}/${buscazapMenuItemId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[PedijaService] updateMenuItem failed: ${res.status}`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[PedijaService] updateMenuItem error:", err);
    return false;
  }
}

/** Remove item do cardápio no BuscaZap. */
export async function syncDeleteMenuItem(
  buscazapCompanyId: number,
  buscazapMenuItemId: number
): Promise<boolean> {
  const base = BASE();
  if (!base || !SECRET()) return false;
  try {
    const res = await fetch(`${base}/api/pdv/menu/${buscazapCompanyId}/${buscazapMenuItemId}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!res.ok) {
      console.error(`[PedijaService] deleteMenuItem failed: ${res.status}`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[PedijaService] deleteMenuItem error:", err);
    return false;
  }
}

/** Busca pedidos Pedijá da empresa no BuscaZap. */
export async function fetchPedijaOrders(
  buscazapCompanyId: number,
  status?: string
): Promise<unknown[]> {
  const base = BASE();
  if (!base || !SECRET()) return [];
  try {
    const url = new URL(`${base}/api/pdv/orders/${buscazapCompanyId}`);
    if (status) url.searchParams.set("status", status);
    const res = await fetch(url.toString(), { headers: headers() });
    if (!res.ok) {
      console.error(`[PedijaService] fetchOrders failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { ok: boolean; orders?: unknown[] };
    return data.orders ?? [];
  } catch (err) {
    console.error("[PedijaService] fetchOrders error:", err);
    return [];
  }
}

/** Atualiza status de um pedido Pedijá diretamente no BuscaZap. */
export async function updatePedijaOrderStatus(
  buscazapOrderId: number,
  status: string
): Promise<boolean> {
  const base = BASE();
  if (!base || !SECRET()) return false;
  try {
    const res = await fetch(`${base}/api/pdv/orders/${buscazapOrderId}/status`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      console.error(`[PedijaService] updateOrderStatus failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[PedijaService] updateOrderStatus error:", err);
    return false;
  }
}
