"use client";
// BroQuest — shop: browse, buy, equip cosmetics
import { useState } from "react";
import type { CosmeticCategory } from "@/lib/db/types";
import { buyCosmetic, toggleEquip } from "@/app/actions/shop";

export interface ShopItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  price: number;
  assetRef: string;
  owned: boolean;
  equipped: boolean;
}

const CATEGORY_LABEL: Record<CosmeticCategory, string> = {
  accessory: "Accessories",
  nickname_color: "Nickname colors",
  flame_decoration: "Flame decorations",
};

const FLAME_EMOJI: Record<string, string> = { blue: "🔵🔥", rainbow: "🌈🔥", crown: "👑🔥" };
const ACC_EMOJI: Record<string, string> = { glasses: "👓", cap: "🧢" };

function Preview({ item }: { item: ShopItem }) {
  if (item.category === "nickname_color")
    return <div style={{ width: 44, height: 44, borderRadius: 12, background: item.assetRef, border: "2px solid var(--border)" }} />;
  const emoji = item.category === "flame_decoration" ? FLAME_EMOJI[item.assetRef] ?? "🔥" : ACC_EMOJI[item.assetRef] ?? "✨";
  return <div style={{ fontSize: 32, width: 44, textAlign: "center" }}>{emoji}</div>;
}

export default function ShopGrid({ items, balance }: { items: ShopItem[]; balance: number }) {
  const [coins, setCoins] = useState(balance);
  const [state, setState] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function flash(t: string) {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  }

  async function buy(item: ShopItem) {
    if (busy || coins < item.price) return;
    setBusy(item.id);
    const res = await buyCosmetic(item.id);
    setBusy(null);
    if (!res.ok) return flash(res.error ?? "Failed");
    setCoins((c) => c - item.price);
    setState((s) => s.map((x) => (x.id === item.id ? { ...x, owned: true } : x)));
    flash(`Bought ${item.name}! 🎉`);
  }

  async function equip(item: ShopItem) {
    if (busy) return;
    setBusy(item.id);
    const res = await toggleEquip(item.id);
    setBusy(null);
    if (!res.ok) return flash(res.error ?? "Failed");
    const turningOn = !item.equipped;
    setState((s) =>
      s.map((x) =>
        x.id === item.id
          ? { ...x, equipped: turningOn }
          : x.category === item.category && turningOn
            ? { ...x, equipped: false }
            : x
      )
    );
    flash(turningOn ? `Equipped ${item.name} ✨` : `Unequipped ${item.name}`);
  }

  const categories: CosmeticCategory[] = ["accessory", "nickname_color", "flame_decoration"];

  return (
    <div>
      <div className="screen-title">Shop</div>
      <div className="screen-sub">Spend your coins. Flex on your crew. 🪙 {coins} available</div>

      {categories.map((cat) => {
        const group = state.filter((i) => i.category === cat);
        if (!group.length) return null;
        return (
          <div key={cat}>
            <div className="section-h"><h2>{CATEGORY_LABEL[cat]}</h2></div>
            <div style={{ padding: "0 16px" }}>
              {group.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 18, padding: "12px 14px", marginBottom: 10 }}
                >
                  <Preview item={item} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15.5 }}>{item.name}</div>
                    <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 13 }}>🪙 {item.price}</div>
                  </div>
                  {item.owned ? (
                    <button
                      className={"btn btn-sm " + (item.equipped ? "btn-ghost" : "btn-primary")}
                      disabled={busy === item.id}
                      onClick={() => equip(item)}
                    >
                      {item.equipped ? "Equipped ✓" : "Equip"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busy === item.id || coins < item.price}
                      onClick={() => buy(item)}
                    >
                      {coins < item.price ? "Need 🪙" : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ height: 8 }} />
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
