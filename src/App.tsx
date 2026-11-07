import {
  ArrowDownUp,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  Layers3,
  LogOut,
  Menu,
  Radio,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fills,
  initialOrders,
  makeBook,
  markets,
  type BookLevel,
  type DemoOrder,
  type Market,
} from "./mock-data";
import { fetchLiveXlmPrice, type LiveXlmPrice } from "./live-price";
import {
  connectWallet,
  disconnectWallet,
  initializeWalletKit,
  walletErrorMessage,
  watchWalletAddress,
} from "./wallet";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 270;
const CHART_PADDING = 18;

function shortAddress(address: string): string {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

function formatPrice(value: number): string {
  return value < 0.01 ? value.toFixed(6) : value.toFixed(4);
}

function linePath(points: number[], offset = 0): string {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const width = CHART_WIDTH - CHART_PADDING * 2;
  const height = CHART_HEIGHT - CHART_PADDING * 2;

  return points
    .map((point, index) => {
      const x = CHART_PADDING + (index / Math.max(points.length - 1, 1)) * width;
      const normalized = (point - min) / spread;
      const y = CHART_HEIGHT - CHART_PADDING - normalized * height + offset;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function areaPath(points: number[]): string {
  const path = linePath(points);
  return `${path} L${CHART_WIDTH - CHART_PADDING},${CHART_HEIGHT - CHART_PADDING} L${CHART_PADDING},${CHART_HEIGHT - CHART_PADDING} Z`;
}

function SeltraMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function NetworkBadge() {
  return (
    <div className="network-badge" title="The wallet connector is locked to Stellar testnet">
      <span className="network-orbit" aria-hidden="true">
        <span />
      </span>
      <span>Stellar Testnet</span>
    </div>
  );
}

type WalletButtonProps = {
  address?: string;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

function WalletButton({ address, connecting, onConnect, onDisconnect }: WalletButtonProps) {
  if (!address) {
    return (
      <button className="wallet-button" type="button" onClick={onConnect} disabled={connecting}>
        <WalletCards size={17} />
        <span>{connecting ? "Opening wallets…" : "Connect wallet"}</span>
      </button>
    );
  }

  return (
    <div className="connected-wallet">
      <span className="wallet-dot" />
      <span>{shortAddress(address)}</span>
      <button type="button" onClick={onDisconnect} aria-label="Disconnect wallet" title="Disconnect">
        <LogOut size={15} />
      </button>
    </div>
  );
}

function MarketPicker({ market, onSelect }: { market: Market; onSelect: (market: Market) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="market-picker" ref={root}>
      <button type="button" className="market-picker-trigger" onClick={() => setOpen((value) => !value)}>
        <div className="asset-stack" aria-hidden="true">
          <span className={`asset-icon asset-${market.base.toLowerCase().replace(".", "")}`}>
            {market.base.slice(0, 1)}
          </span>
          <span className={`asset-icon asset-${market.quote.toLowerCase().replace(".", "")}`}>
            {market.quote.slice(0, 1)}
          </span>
        </div>
        <div>
          <strong>{market.base}/{market.quote}</strong>
          <span>Spot market</span>
        </div>
        <ChevronDown size={17} className={open ? "rotate" : ""} />
      </button>

      {open && (
        <div className="market-menu">
          <div className="market-menu-label">Markets</div>
          {markets.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === market.id ? "selected" : ""}
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
            >
              <span className="market-symbols">{item.base}/{item.quote}</span>
              <span className="market-menu-price">{formatPrice(item.price)}</span>
              <span className={item.change >= 0 ? "positive" : "negative"}>
                {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
              </span>
              {item.id === market.id && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceChart({ market, live }: { market: Market; live: boolean }) {
  const path = linePath(market.chart);
  const secondary = linePath(market.chart.map((point, index) => point * (1 + Math.sin(index * 0.9) * 0.0018)), 2);
  const tertiary = linePath(market.chart.map((point, index) => point * (1 - Math.cos(index * 0.72) * 0.0014)), -1);

  return (
    <section className="panel chart-panel">
      <div className="panel-header chart-heading">
        <div>
          <div className="eyebrow"><BarChart3 size={13} /> Aggregated price</div>
          <div className="chart-price-row">
            <strong>{formatPrice(market.price)}</strong>
            <span>{market.quote}</span>
            <span className={market.change >= 0 ? "change-pill positive-bg" : "change-pill negative-bg"}>
              {market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="timeframes" aria-label="Chart timeframe">
          <button type="button">1H</button>
          <button type="button" className="active">1D</button>
          <button type="button">1W</button>
          <button type="button">1M</button>
        </div>
      </div>

      <div className="venue-legend">
        <span><i className="venue-dot stellar-dex" />Stellar DEX <b>{formatPrice(market.price)}</b></span>
        <span><i className="venue-dot soroswap" />Soroswap <b>{formatPrice(market.price * 0.9994)}</b></span>
        <span><i className="venue-dot aqua" />Aqua AMM <b>{formatPrice(market.price * 1.0007)}</b></span>
      </div>

      <div className="chart-wrap">
        <svg className="price-chart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${market.base} to ${market.quote} price chart`}>
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#a691ff" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#a691ff" stopOpacity="0" />
            </linearGradient>
            <filter id="line-glow" x="-10%" y="-20%" width="120%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[58, 112, 166, 220].map((y) => <line key={y} x1="18" x2="742" y1={y} y2={y} className="chart-grid" />)}
          <path d={areaPath(market.chart)} fill="url(#chart-fill)" />
          <path d={secondary} className="chart-line chart-secondary" />
          <path d={tertiary} className="chart-line chart-tertiary" />
          <path d={path} className="chart-line chart-primary" filter="url(#line-glow)" />
          <circle cx="742" cy={path.split(" ").at(-1)?.split(",")[1]} r="4.5" className="chart-end" />
        </svg>
        <div className="chart-axis">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
        </div>
        <div className={`price-source ${live ? "live" : ""}`}><Radio size={12} />{live ? "Live XLM reference" : "Reference snapshot"}</div>
      </div>
    </section>
  );
}

type DisplayBookLevel = BookLevel & {
  id?: string;
  user?: boolean;
  protected?: boolean;
  side?: "Buy" | "Sell";
};

function orderAmount(order: DemoOrder): number {
  return Number(order.amount.split(" ")[0].replaceAll(",", ""));
}

function OrderBook({ market, orders }: { market: Market; orders: DemoOrder[] }) {
  const { asks, bids, userCount } = useMemo(() => {
    const base = makeBook(market);
    const pair = `${market.base}/${market.quote}`;
    const activeOrders = orders.filter(
      (order) => order.pair === pair && order.status !== "Filled",
    );
    const userLevels: DisplayBookLevel[] = activeOrders
      .map((order) => {
        const price = Number(order.price);
        const amount = orderAmount(order);
        return {
          id: order.id,
          price,
          amount,
          total: price * amount,
          user: true,
          protected: Boolean(order.takeProfit || order.stopLoss),
          side: order.side,
        };
      })
      .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.amount));

    const userAsks = userLevels.filter((level) => level.side === "Sell");
    const userBids = userLevels.filter((level) => level.side === "Buy");
    const askDepth = Math.max(3, 6 - userAsks.length);
    const bidDepth = Math.max(3, 6 - userBids.length);

    return {
      asks: ([...base.asks.slice(0, askDepth), ...userAsks] as DisplayBookLevel[]).sort((a, b) => b.price - a.price),
      bids: ([...base.bids.slice(0, bidDepth), ...userBids] as DisplayBookLevel[]).sort((a, b) => b.price - a.price),
      userCount: activeOrders.length,
    };
  }, [market, orders]);

  return (
    <section className="panel book-panel">
      <div className="panel-header">
        <div>
          <h2>Order book</h2>
          <span className="panel-subtitle">Aggregated liquidity{userCount > 0 ? ` · ${userCount} yours` : ""}</span>
        </div>
        <div className="book-icons" aria-hidden="true"><Layers3 size={16} /><ArrowDownUp size={16} /></div>
      </div>
      <div className="book-columns"><span>Price ({market.quote})</span><span>Amount ({market.base})</span><span>Total</span></div>
      <div className="book-levels asks">
        {asks.map((level, index) => (
          <div className={`book-row ${level.user ? "user-order" : ""}`} key={level.id ?? `${level.price}-${index}`}>
            <i style={{ width: `${28 + index * 10}%` }} />
            <span>{level.user && <em>Your{level.protected ? " · TP/SL" : ""}</em>}{formatPrice(level.price)}</span><span>{level.amount.toLocaleString()}</span><span>{level.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
      <div className="spread-row">
        <strong>{formatPrice(market.price)}</strong>
        <span>≈ {formatPrice(market.price)} {market.quote}</span>
        <small>0.08% spread</small>
      </div>
      <div className="book-levels bids">
        {bids.map((level, index) => (
          <div className={`book-row ${level.user ? "user-order" : ""}`} key={level.id ?? `${level.price}-${index}`}>
            <i style={{ width: `${76 - index * 8}%` }} />
            <span>{level.user && <em>Your{level.protected ? " · TP/SL" : ""}</em>}{formatPrice(level.price)}</span><span>{level.amount.toLocaleString()}</span><span>{level.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

type OrderTicketProps = {
  market: Market;
  onPlace: (order: DemoOrder) => void;
};

function OrderTicket({ market, onPlace }: OrderTicketProps) {
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [orderType, setOrderType] = useState<"Limit" | "Grid">("Limit");
  const [amount, setAmount] = useState("250");
  const [price, setPrice] = useState(formatPrice(market.price * 0.99));
  const [placement, setPlacement] = useState<"idle" | "placed">("idle");
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState(formatPrice(market.price * 1.04));
  const [stopLoss, setStopLoss] = useState(formatPrice(market.price * 0.975));

  useEffect(() => {
    setPrice(formatPrice(market.price * 0.99));
    setAmount(market.base === "AQUA" ? "2500" : market.base === "XLM" ? "25" : "50");
    setTakeProfit(formatPrice(market.price * (side === "Buy" ? 1.04 : 0.96)));
    setStopLoss(formatPrice(market.price * (side === "Buy" ? 0.975 : 1.025)));
    setPlacement("idle");
  }, [market, side]);

  const chooseSide = (nextSide: "Buy" | "Sell") => {
    setSide(nextSide);
    setTakeProfit(formatPrice(market.price * (nextSide === "Buy" ? 1.04 : 0.96)));
    setStopLoss(formatPrice(market.price * (nextSide === "Buy" ? 0.975 : 1.025)));
  };

  const total = (Number(amount || 0) * Number(price || 0)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

  const submit = () => {
    onPlace({
      id: `ST-${Math.floor(1100 + Math.random() * 800)}`,
      pair: `${market.base}/${market.quote}`,
      side,
      price,
      amount: `${Number(amount || 0).toLocaleString()} ${market.base}`,
      status: "Placed",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      takeProfit: takeProfitEnabled ? takeProfit : undefined,
      stopLoss: stopLossEnabled ? stopLoss : undefined,
    });
    setPlacement("placed");
    window.setTimeout(() => setPlacement("idle"), 2200);
  };

  return (
    <section className="panel ticket-panel">
      <div className="ticket-tabs">
        <button type="button" className={orderType === "Limit" ? "active" : ""} onClick={() => setOrderType("Limit")}>Limit</button>
        <button type="button" className={orderType === "Grid" ? "active" : ""} onClick={() => setOrderType("Grid")}>Grid</button>
      </div>
      <div className="side-toggle">
        <button type="button" className={side === "Buy" ? "active buy" : ""} onClick={() => chooseSide("Buy")}>Buy</button>
        <button type="button" className={side === "Sell" ? "active sell" : ""} onClick={() => chooseSide("Sell")}>Sell</button>
      </div>

      <div className="demo-balance">
        <span>Balance</span>
        <strong>{side === "Buy" ? `${market.quoteBalance} ${market.quote}` : `${market.baseBalance} ${market.base}`}</strong>
      </div>

      <label className="order-field">
        <span>Amount</span>
        <div><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /><b>{market.base}</b></div>
      </label>
      <label className="order-field">
        <span>Limit price</span>
        <div><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /><b>{market.quote}</b></div>
      </label>

      {orderType === "Grid" && (
        <div className="grid-preview-fields">
          <div><span>Levels</span><strong>5</strong></div>
          <div><span>Range</span><strong>± 3.0%</strong></div>
          <div><span>Expiry</span><strong>7 days</strong></div>
        </div>
      )}

      <div className="protection-section">
        <div className="protection-heading"><span>Exit strategy</span><small>Optional</small></div>
        <div className={`protection-control ${takeProfitEnabled ? "enabled" : ""}`}>
          <button type="button" role="switch" aria-checked={takeProfitEnabled} onClick={() => setTakeProfitEnabled((value) => !value)}>
            <i />
          </button>
          <span>Take profit</span>
          <div className="protection-input"><input aria-label="Take profit price" inputMode="decimal" value={takeProfit} disabled={!takeProfitEnabled} onChange={(event) => setTakeProfit(event.target.value)} /><b>{market.quote}</b></div>
        </div>
        <div className={`protection-control ${stopLossEnabled ? "enabled" : ""}`}>
          <button type="button" role="switch" aria-checked={stopLossEnabled} onClick={() => setStopLossEnabled((value) => !value)}>
            <i />
          </button>
          <span>Stop loss</span>
          <div className="protection-input"><input aria-label="Stop loss price" inputMode="decimal" value={stopLoss} disabled={!stopLossEnabled} onChange={(event) => setStopLoss(event.target.value)} /><b>{market.quote}</b></div>
        </div>
      </div>

      <div className="order-summary">
        <span>Estimated total</span><strong>{total} {market.quote}</strong>
      </div>
      <button type="button" className={`preview-button ${side.toLowerCase()} ${placement}`} onClick={submit} disabled={!Number(amount) || !Number(price) || placement === "placed"}>
        {placement === "placed" ? <Check size={17} /> : <Zap size={17} />}
        {placement === "placed" ? "Order placed" : `Place ${orderType.toLowerCase()} order`}
      </button>
    </section>
  );
}

function RecentTrades({ market }: { market: Market }) {
  return (
    <section className="panel trades-panel">
      <div className="panel-header"><div><h2>Recent fills</h2><span className="panel-subtitle">Latest matches</span></div><Radio size={15} className="radio-icon" /></div>
      <div className="trade-heading"><span>Price ({market.quote})</span><span>Amount ({market.base})</span><span>Time</span></div>
      {fills.map((fill, index) => (
        <div className="trade-row" key={`${fill.time}-${index}`}>
          <span className={fill.side === "buy" ? "positive" : "negative"}>{index === 0 ? formatPrice(market.price) : fill.price}</span>
          <span>{fill.amount}</span><span>{fill.time}</span>
        </div>
      ))}
    </section>
  );
}

function OrdersPanel({ orders, onCancel }: { orders: DemoOrder[]; onCancel: (id: string) => void }) {
  return (
    <section className="panel orders-panel">
      <div className="panel-header">
        <div><h2>Orders</h2><span className="panel-subtitle">Session activity</span></div>
        <span className="order-count">{orders.filter((order) => order.status === "Open" || order.status === "Placed").length} active</span>
      </div>
      <div className="orders-table-wrap">
        <div className="orders-table orders-head"><span>Market</span><span>Side</span><span>Price</span><span>Amount</span><span>Protection</span><span>Status</span><span>Time</span><span /></div>
        {orders.map((order) => (
          <div className="orders-table" key={order.id}>
            <span className="order-market">{order.pair}</span>
            <span className={order.side === "Buy" ? "positive" : "negative"}>{order.side}</span>
            <span>{order.price}</span><span>{order.amount}</span>
            <span className="protection-summary">
              {order.takeProfit && <i className="tp">TP {order.takeProfit}</i>}
              {order.stopLoss && <i className="sl">SL {order.stopLoss}</i>}
              {!order.takeProfit && !order.stopLoss && <i>—</i>}
            </span>
            <span><i className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</i></span>
            <span>{order.time}</span>
            <span>{order.status !== "Filled" && <button type="button" onClick={() => onCancel(order.id)}>Cancel</button>}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [market, setMarket] = useState(markets[0]);
  const [liveXlm, setLiveXlm] = useState<LiveXlmPrice>();
  const [address, setAddress] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string>();
  const [orders, setOrders] = useState(initialOrders);
  const [toast, setToast] = useState<string>();
  const [mobileMenu, setMobileMenu] = useState(false);

  const displayMarket = useMemo<Market>(() => {
    if (market.id !== "XLM-USDC" || !liveXlm) return market;
    return {
      ...market,
      price: liveXlm.usd,
      change: liveXlm.change24h,
    };
  }, [liveXlm, market]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      void fetchLiveXlmPrice(controller.signal)
        .then(setLiveXlm)
        .catch(() => undefined);
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    initializeWalletKit();
    return watchWalletAddress(setAddress);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleConnect = async () => {
    setConnecting(true);
    setWalletError(undefined);
    try {
      setAddress(await connectWallet());
      setToast("Wallet connected on Stellar testnet.");
    } catch (error) {
      const message = walletErrorMessage(error);
      if (!message.toLowerCase().includes("closed")) setWalletError(message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setAddress(undefined);
    setToast("Wallet disconnected.");
  };

  const placeOrder = (order: DemoOrder) => {
    setOrders((current) => [order, ...current]);
    setToast(`${order.side} order placed for ${order.amount}.`);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Seltra Stellar home">
          <SeltraMark />
          <span>Seltra</span>
          <i>stellar</i>
        </a>
        <nav className={mobileMenu ? "open" : ""}>
          <a className="active" href="#trade">Trade</a>
          <a href="#orders">Orders</a>
          <a className="external-nav-link" href="https://app.seltra.finance/docs" target="_blank" rel="noreferrer">
            Docs <ExternalLink size={12} />
          </a>
          <a className="external-nav-link avalanche-link" href="https://app.seltra.finance/trade/WAVAX-USDC" target="_blank" rel="noreferrer">
            Avalanche app <ExternalLink size={12} />
          </a>
        </nav>
        <div className="topbar-actions">
          <NetworkBadge />
          <WalletButton address={address} connecting={connecting} onConnect={handleConnect} onDisconnect={handleDisconnect} />
          <button className="mobile-menu-button" type="button" onClick={() => setMobileMenu((value) => !value)} aria-label="Toggle navigation">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="demo-banner" id="top">
        <div><Sparkles size={15} /><strong>Stellar preview</strong><span>Simulated execution environment</span></div>
        <span className="connection-boundary"><ShieldCheck size={14} />Wallet connection live</span>
      </div>

      <main>
        {walletError && <div className="error-banner"><CircleHelp size={16} /><span>{walletError}</span><button type="button" onClick={() => setWalletError(undefined)}><X size={15} /></button></div>}

        <section className="market-strip" id="trade">
          <MarketPicker market={market} onSelect={setMarket} />
          <div className="market-stat price-stat"><span>{market.id === "XLM-USDC" && liveXlm ? "Live price" : "Reference price"}</span><strong>{formatPrice(displayMarket.price)} {displayMarket.quote}</strong></div>
          <div className="market-stat"><span>24h change</span><strong className={displayMarket.change >= 0 ? "positive" : "negative"}>{displayMarket.change >= 0 ? "+" : ""}{displayMarket.change.toFixed(2)}%</strong></div>
          <div className="market-stat"><span>{market.id === "XLM-USDC" && liveXlm ? "Feed" : "24h high"}</span><strong>{market.id === "XLM-USDC" && liveXlm ? "CoinGecko" : market.high}</strong></div>
          <div className="market-stat"><span>{market.id === "XLM-USDC" && liveXlm ? "Updated" : "24h low"}</span><strong>{market.id === "XLM-USDC" && liveXlm ? new Date(liveXlm.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : market.low}</strong></div>
          <div className="market-stat"><span>24h volume</span><strong>{market.volume}</strong></div>
        </section>

        <div className="trading-grid">
          <PriceChart market={displayMarket} live={market.id === "XLM-USDC" && Boolean(liveXlm)} />
          <OrderBook market={displayMarket} orders={orders} />
          <OrderTicket market={displayMarket} onPlace={placeOrder} />
          <RecentTrades market={displayMarket} />
        </div>

        <div id="orders"><OrdersPanel orders={orders} onCancel={(id) => setOrders((current) => current.filter((order) => order.id !== id))} /></div>

        <section className="poc-explainer" id="about">
          <div className="explainer-icon"><Zap size={23} /></div>
          <div><span className="eyebrow">POC boundary</span><h2>Stellar-native feel, zero trading side effects.</h2><p>This prototype exercises wallet discovery and account connection through Stellar Wallets Kit on testnet. Every trading surface is deterministic presentation data and remains inside this browser session.</p></div>
          <a href="https://stellarwalletskit.dev" target="_blank" rel="noreferrer">Wallet kit docs <ExternalLink size={14} /></a>
        </section>
      </main>

      <footer id="activity">
        <div><SeltraMark /><span>Seltra Stellar visual PoC</span></div>
        <span><Clock3 size={13} />Live XLM reference · simulated execution</span>
        <span>Stellar testnet wallet connection</span>
      </footer>

      {toast && <div className="toast"><Check size={16} /><span>{toast}</span><button type="button" onClick={() => setToast(undefined)}><X size={14} /></button></div>}
    </div>
  );
}
