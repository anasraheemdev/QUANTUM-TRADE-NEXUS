# QUANTUM TRADE NEXUS - Trading Platform UI

A modern, fully static trading platform built with Next.js 14 (App Router), featuring a beautiful bluish-dark theme with simulated live stock prices and comprehensive trading interface.

## 🚀 Features

- **Landing Page** - Beautiful marketing page with hero section, features, and CTA
- **Sign In Page** - Login form with social authentication options (UI only)
- **Markets Page** - Overview of the platform with market movers and all stocks
- **Dashboard** - Portfolio summary, positions, watchlist, and market movers
- **User Profile** - Account information, trading statistics, and preferences
- **Stock Details** - Detailed stock information with line charts, candlestick charts, and volume data
- **Simulated Live Prices** - Real-time price updates using setInterval with random fluctuations
- **Trading Modals** - Buy/Sell modals with order summary (UI only, no backend)
- **Modern UI** - Bluish-dark theme with smooth animations using Framer Motion

## 🎨 Theme

The platform uses a consistent bluish-dark theme throughout:
- Dark navy backgrounds (`#0a0e27`, `#0f1629`)
- Blue gradients and accents
- Neon blue glow highlights
- Light blue text and UI elements
- Smooth transitions and hover effects

## 📦 Tech Stack

- **Next.js 14** - App Router with TypeScript
- **Tailwind CSS** - Styling with custom theme
- **Framer Motion** - Smooth animations
- **Recharts** - Chart visualizations (line, candlestick, volume)
- **Lucide React** - Icons
- **Static JSON Data** - All data stored in `/public/data/`

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
├── app/
│   ├── api/                # API routes
│   │   ├── stocks/         # Get all stocks
│   │   ├── stock/[symbol]/ # Get single stock & history
│   │   └── portfolio/      # Get portfolio with real-time prices
│   ├── landing/            # Landing/marketing page
│   ├── signin/             # Sign in page
│   ├── dashboard/          # Dashboard page
│   ├── profile/            # User profile page
│   ├── stock/[symbol]/     # Stock details page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Markets/home page
│   └── globals.css         # Global styles
├── components/
│   ├── Navbar.tsx          # Top navigation
│   ├── Sidebar.tsx         # Side navigation
│   ├── StockCard.tsx       # Stock card component
│   ├── PriceTicker.tsx     # Live price ticker
│   ├── Watchlist.tsx       # Watchlist component
│   ├── PortfolioSummary.tsx # Portfolio overview
│   ├── MarketMovers.tsx    # Top market movers
│   ├── StockChart.tsx      # Chart component
│   └── BuySellModal.tsx    # Trading modal
├── lib/
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── public/
    └── data/
        └── stocks.json      # Stock data (150+ stocks)
```

## 📊 Data Structure

Data is stored in static JSON files for fast performance:

- **Stock Data** - Loaded from `/public/data/stocks.json` (150+ stocks with realistic data)
- **Portfolio Data** - Fetched from `/api/portfolio` endpoint (uses static stock data)
- **Stock History** - Generated dynamically from `/api/stock/[symbol]/history` endpoint (based on current price)
- **User Data** - Stored in Supabase database (fully dynamic)

## 🎯 Key Components

### PriceTicker
- Displays scrolling stock prices
- Updates every 2 seconds with simulated price fluctuations
- Shows symbol, price, and change percentage

### StockChart
- Three chart types: Line, Candlestick, Volume
- Interactive tooltips
- Responsive design

### BuySellModal
- Market and Limit order types
- Order summary with fees
- Static UI only (no backend functionality)

## 🎨 Customization

The theme can be customized in `tailwind.config.ts`:
- Colors: `dark-bg`, `dark-card`, `blue-primary`, `blue-accent`, etc.
- Gradients: `blue-gradient`
- Shadows: `blue-glow`, `neon-blue`

## 📝 Notes

- **Static Data**: All stock data is loaded from JSON files for fast performance (150+ stocks)
- **Supabase Integration**: User data, portfolio, and transactions stored in Supabase
- **Real-Time Data**: Prices and portfolio values update dynamically from live API
- **Caching**: API calls are cached (30-60 seconds) to reduce API usage and improve performance
- **UI Only**: Trading modals are for display purposes only
- **Client-Side**: Data fetching happens client-side using Next.js API routes

## 🚀 Build for Production

```bash
npm run build
npm start
```

## 📄 License

This project is for demonstration purposes only.

---

Built with ❤️ using Next.js and Tailwind CSS

