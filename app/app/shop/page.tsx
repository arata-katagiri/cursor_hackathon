// BroQuest — cosmetics shop
import { requireProfile } from "@/lib/auth";
import { getShop } from "@/lib/queries";
import ShopGrid, { type ShopItem } from "@/components/broquest/ShopGrid";

export default async function ShopPage() {
  const profile = await requireProfile();
  const cosmetics = await getShop(profile.id);

  const items: ShopItem[] = cosmetics.map((c) => ({
    id: c.id,
    category: c.category,
    name: c.name,
    price: c.price,
    assetRef: c.asset_ref,
    owned: c.owned,
    equipped: c.equipped,
  }));

  return <ShopGrid items={items} balance={profile.coin_balance} />;
}
