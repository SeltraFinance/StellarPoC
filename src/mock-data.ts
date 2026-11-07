export type Market = {
  id: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  volume: string;
  high: string;
  low: string;
  baseBalance: string;
  quoteBalance: string;
  chart: number[];
};

export type BookLevel = {
  price: number;
  amount: number;
  total: number;
};

export type DemoOrder = {
  id: string;
  pair: string;
  side: "Buy" | "Sell";
  price: string;
  amount: string;
  status: "Open" | "Placed" | "Filled";
  time: string;
  takeProfit?: string;
  stopLoss?: string;
};

export const markets: Market[] = [
  {
    id: "XLM-USDC",
    base: "XLM",
    quote: "USDC",
    price: 0.4238,
    change: 2.84,
    volume: "$4.28M",
    high: "$0.4312",
    low: "$0.4071",
    baseBalance: "12,480.00",
    quoteBalance: "8,240.50",
    chart: [
      0.408, 0.411, 0.409, 0.414, 0.416, 0.413, 0.418, 0.419, 0.417, 0.421,
      0.424, 0.422, 0.426, 0.425, 0.429, 0.427, 0.431, 0.428, 0.43, 0.426,
      0.424, 0.421, 0.423, 0.425, 0.424, 0.422, 0.4238,
    ],
  },
  {
    id: "USDC-EURC",
    base: "USDC",
    quote: "EURC",
    price: 0.9184,
    change: -0.16,
    volume: "€1.14M",
    high: "€0.9210",
    low: "€0.9162",
    baseBalance: "8,240.50",
    quoteBalance: "3,185.20",
    chart: [
      0.9201, 0.9197, 0.92, 0.9194, 0.9198, 0.9191, 0.9188, 0.9192, 0.9187,
      0.9185, 0.919, 0.9186, 0.9183, 0.9179, 0.9182, 0.9178, 0.9181, 0.9185,
      0.9182, 0.9186, 0.9184, 0.9187, 0.9184,
    ],
  },
  {
    id: "AQUA-XLM",
    base: "AQUA",
    quote: "XLM",
    price: 0.00172,
    change: 4.61,
    volume: "810K XLM",
    high: "0.00179 XLM",
    low: "0.00161 XLM",
    baseBalance: "925,000.00",
    quoteBalance: "12,480.00",
    chart: [
      0.00161, 0.00163, 0.00162, 0.00165, 0.00166, 0.00164, 0.00168, 0.00167,
      0.0017, 0.00169, 0.00172, 0.00171, 0.00174, 0.00173, 0.00176, 0.00175,
      0.00178, 0.00174, 0.00172,
    ],
  },
];

const roundPrice = (value: number, precision: number) => Number(value.toFixed(precision));

export function makeBook(market: Market): { asks: BookLevel[]; bids: BookLevel[] } {
  const precision = market.price < 0.01 ? 6 : 4;
  const step = market.price * (market.price < 0.01 ? 0.006 : 0.0016);
  const amounts = [920, 1480, 610, 2270, 840, 1320];
  const asks = amounts.map((amount, index) => ({
    price: roundPrice(market.price + step * (6 - index), precision),
    amount: amount * (market.base === "AQUA" ? 110 : 1),
    total: amount * (index + 1),
  }));
  const bids = amounts.map((amount, index) => ({
    price: roundPrice(market.price - step * (index + 1), precision),
    amount: amount * (market.base === "AQUA" ? 110 : 1),
    total: amount * (index + 1),
  }));
  return { asks, bids };
}

export const initialOrders: DemoOrder[] = [
  {
    id: "ST-1048",
    pair: "XLM/USDC",
    side: "Buy",
    price: "0.1580",
    amount: "75 XLM",
    status: "Open",
    time: "12:42:08",
    takeProfit: "0.1660",
    stopLoss: "0.1530",
  },
  {
    id: "ST-1047",
    pair: "USDC/EURC",
    side: "Sell",
    price: "0.9210",
    amount: "50 USDC",
    status: "Filled",
    time: "12:36:51",
  },
  {
    id: "ST-1046",
    pair: "AQUA/XLM",
    side: "Buy",
    price: "0.00166",
    amount: "2,500 AQUA",
    status: "Open",
    time: "12:28:14",
    takeProfit: "0.00178",
    stopLoss: "0.00161",
  },
];

export const fills = [
  { price: "0.4238", amount: "840.00", time: "12:44:32", side: "buy" },
  { price: "0.4236", amount: "1,220.00", time: "12:44:18", side: "sell" },
  { price: "0.4239", amount: "580.00", time: "12:43:51", side: "buy" },
  { price: "0.4234", amount: "2,040.00", time: "12:43:29", side: "sell" },
  { price: "0.4237", amount: "910.00", time: "12:43:07", side: "buy" },
];
