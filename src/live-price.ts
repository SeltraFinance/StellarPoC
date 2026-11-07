export type LiveXlmPrice = {
  usd: number;
  change24h: number;
  updatedAt: number;
};

type CoinGeckoResponse = {
  stellar?: {
    usd?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
};

const XLM_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true";

export async function fetchLiveXlmPrice(signal?: AbortSignal): Promise<LiveXlmPrice> {
  const response = await fetch(XLM_PRICE_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`XLM price request failed with ${response.status}`);
  }

  const data = (await response.json()) as CoinGeckoResponse;
  const price = data.stellar?.usd;
  const change = data.stellar?.usd_24h_change;
  const updatedAt = data.stellar?.last_updated_at;

  if (!Number.isFinite(price) || !price || price <= 0) {
    throw new Error("XLM price response did not include a valid USD price");
  }

  return {
    usd: price,
    change24h: Number.isFinite(change) ? Number(change) : 0,
    updatedAt: Number.isFinite(updatedAt) ? Number(updatedAt) * 1000 : Date.now(),
  };
}
