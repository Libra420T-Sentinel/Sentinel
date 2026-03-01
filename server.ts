import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { XMLParser } from "fast-xml-parser";

// In-memory storage for anomalies
let anomalies: any[] = [];
const MAX_ANOMALIES = 50;

async function startServer() {
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;
  const parser = new XMLParser();

  // Broadcast function
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Data Pipeline Fetchers
  const fetchUSGS = async () => {
    try {
      const res = await fetch("https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5");
      const data = await res.json();
      const features = data.features || [];
      features.forEach((f: any) => {
        const mag = f.properties.mag;
        if (mag >= 6.0) {
          const anomaly = {
            id: `usgs-${f.id}`,
            source: "USGS",
            type: "SEISMIC_ANOMALY",
            title: `MAJOR QUAKE: Mag ${mag}`,
            description: f.properties.place,
            severity: mag >= 7.0 ? "CRITICAL" : "HIGH",
            timestamp: new Date(f.properties.time).toISOString(),
            link: f.properties.url
          };
          addAnomaly(anomaly);
        }
      });
    } catch (e) {
      console.error("USGS Fetch Error:", e);
    }
  };

  const fetchNOAASpace = async () => {
    try {
      const res = await fetch("https://services.swpc.noaa.gov/products/alerts.json");
      const data = await res.json();
      if (!Array.isArray(data)) return;
      
      data.slice(0, 5).forEach((alert: any) => {
        if (alert.message.includes("SUMMARY: X-Class") || alert.message.includes("Geomagnetic Storm")) {
          const anomaly = {
            id: `noaa-space-${alert.issue_datetime}`,
            source: "NOAA SPACE",
            type: "SPACE_WEATHER",
            title: "SPACE WEATHER ALERT",
            description: alert.message.split('\n')[0],
            severity: alert.message.includes("X-Class") ? "CRITICAL" : "HIGH",
            timestamp: new Date(alert.issue_datetime).toISOString(),
          };
          addAnomaly(anomaly);
        }
      });
    } catch (e) {
      console.error("NOAA Space Fetch Error:", e);
    }
  };

  const fetchNOAATsunami = async () => {
    try {
      const res = await fetch("https://www.tsunami.gov/events/xml/WEPA40.xml");
      const text = await res.text();
      const data = parser.parse(text);
      const items = data.rss?.channel?.item || [];
      const itemList = Array.isArray(items) ? items : [items];
      
      itemList.forEach((item: any) => {
        if (item.title?.toLowerCase().includes("warning") || item.title?.toLowerCase().includes("advisory")) {
          const anomaly = {
            id: `tsunami-${item.guid || Date.now()}`,
            source: "NOAA TSUNAMI",
            type: "OCEANIC_ANOMALY",
            title: item.title,
            description: item.description,
            severity: item.title.toLowerCase().includes("warning") ? "CRITICAL" : "HIGH",
            timestamp: new Date(item.pubDate).toISOString(),
            link: item.link
          };
          addAnomaly(anomaly);
        }
      });
    } catch (e) {
      console.error("NOAA Tsunami Fetch Error:", e);
    }
  };

  const fetchOpenSky = async () => {
    try {
      // OpenSky is heavy, we just check for total count or specific patterns if we had more time
      // For now, let's just log if it's reachable as a "Grid Tracker"
      const res = await fetch("https://opensky-network.org/api/states/all");
      if (res.ok) {
        const data = await res.json();
        const count = data.states?.length || 0;
        if (count < 1000) { // Arbitrary "sudden drop" threshold for demo
          addAnomaly({
            id: `opensky-${Date.now()}`,
            source: "OPENSKY",
            type: "AVIATION_ANOMALY",
            title: "FLIGHT VOLUME DROP",
            description: `Global active flights dropped to ${count}. Potential airspace restriction.`,
            severity: "HIGH",
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error("OpenSky Fetch Error:", e);
    }
  };

  const fetchCloudflare = async () => {
    try {
      // Cloudflare Radar often needs Auth, but we'll try the public endpoint if it exists
      const res = await fetch("https://api.cloudflare.com/client/v4/radar/annotations/outages");
      if (res.ok) {
        const data = await res.json();
        const outages = data.result?.outages || [];
        outages.forEach((o: any) => {
          addAnomaly({
            id: `cloudflare-${o.id}`,
            source: "CLOUDFLARE",
            type: "NETWORK_ANOMALY",
            title: `INTERNET OUTAGE: ${o.locationName}`,
            description: `Outage detected in ${o.locationName}. Scope: ${o.scope}`,
            severity: "HIGH",
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (e) {
      // Silent fail for Cloudflare as it's often restricted
    }
  };

  const fetchUSDA = async () => {
    const feeds = [
      "https://www.ars.usda.gov/news-events/rss-feeds/?feed=news",
      "https://www.ars.usda.gov/news-events/rss-feeds/?feed=crops",
      "https://www.ars.usda.gov/news-events/rss-feeds/?feed=organics",
      "https://www.ars.usda.gov/news-events/rss-feeds/?feed=climate"
    ];
    
    for (const url of feeds) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const data = parser.parse(text);
        const items = data.rss?.channel?.item || [];
        const itemList = Array.isArray(items) ? items : [items];
        
        itemList.forEach((item: any) => {
          const title = item.title?.toLowerCase() || "";
          const description = item.description?.toLowerCase() || "";
          const combined = `${title} ${description}`;
          
          if (combined.includes("pest") || combined.includes("disease") || combined.includes("crop") || combined.includes("shortage") || combined.includes("drought") || combined.includes("impact")) {
            addAnomaly({
              id: `usda-${item.guid || item.link || Date.now()}`,
              source: "USDA ARS",
              type: "AGRICULTURAL_ANOMALY",
              title: item.title,
              description: item.description,
              severity: combined.includes("severe") || combined.includes("critical") ? "HIGH" : "MEDIUM",
              timestamp: new Date(item.pubDate).toISOString(),
              link: item.link
            });
          }
        });
      } catch (e) {
        console.error(`USDA Fetch Error (${url}):`, e);
      }
    }
  };

  const fetchCommodities = async () => {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return;
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quotes/commodity?apikey=${apiKey}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      
      data.forEach((item: any) => {
        const staples = ["Wheat", "Corn", "Soybeans", "Sugar", "Coffee"];
        if (staples.some(s => item.name.includes(s))) {
          const change = item.changesPercentage;
          if (Math.abs(change) >= 5.0) {
            addAnomaly({
              id: `fmp-${item.symbol}-${Date.now()}`,
              source: "FMP COMMODITIES",
              type: "SUPPLY_CHAIN_ANOMALY",
              title: `${item.name.toUpperCase()} VOLATILITY: ${change.toFixed(2)}%`,
              description: `Significant price movement detected in ${item.name}. Current Price: ${item.price}. Change: ${change.toFixed(2)}%.`,
              severity: change >= 5.0 ? "CRITICAL" : "HIGH",
              timestamp: new Date().toISOString(),
              metadata: { price: item.price, change: item.changesPercentage }
            });
          }
        }
      });
    } catch (e) {
      console.error("FMP Fetch Error:", e);
    }
  };

  const fetchSupplyChain = async () => {
    const apiKey = process.env.NEWSCATCHER_API_KEY;
    if (!apiKey) return;
    try {
      // Updated host to v3-api.newscatcherapi.com which is the standard for V3
      const res = await fetch("https://v3-api.newscatcherapi.com/v3/search_events", {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          q: "port strike OR manufacturing fire OR cargo accident",
          event_type: "supply_chain_disruption",
          lang: "en"
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.articles)) {
          data.articles.forEach((article: any) => {
            addAnomaly({
              id: `newscatcher-${article._id}`,
              source: "NEWSCATCHER",
              type: "LOGISTICS_SHOCK",
              title: article.title,
              description: article.excerpt,
              severity: "HIGH",
              timestamp: new Date(article.published_date).toISOString(),
              link: article.link
            });
          });
        }
      }
    } catch (e) {
      console.error("Newscatcher Fetch Error:", e);
    }
  };

  const fetchGSCPI = async () => {
    try {
      // Scrape simulation or direct check if possible
      const res = await fetch("https://www.newyorkfed.org/research/policy/gscpi");
      if (res.ok) {
        // In a real scenario, we'd parse the HTML for the latest index value
        // For now, we'll simulate a "Pressure Spike" if we detect certain keywords
        const text = await res.text();
        if (text.includes("significant increase") || text.includes("supply chain pressure spikes")) {
          addAnomaly({
            id: `gscpi-${Date.now()}`,
            source: "NY FED GSCPI",
            type: "MACRO_ANOMALY",
            title: "GLOBAL SUPPLY CHAIN PRESSURE SPIKE",
            description: "The GSCPI index has shown a violent upward movement, indicating systemic buckling in global logistics.",
            severity: "CRITICAL",
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error("GSCPI Fetch Error:", e);
    }
  };

  const addAnomaly = (anomaly: any) => {
    const exists = anomalies.find(a => a.id === anomaly.id);
    if (!exists) {
      anomalies = [anomaly, ...anomalies].slice(0, MAX_ANOMALIES);
      broadcast({ type: "ANOMALY_DETECTED", anomaly });
    }
  };

  // Run pipelines periodically
  setInterval(fetchUSGS, 60000); // 1 min
  setInterval(fetchNOAASpace, 120000); // 2 min
  setInterval(fetchNOAATsunami, 180000); // 3 min
  setInterval(fetchOpenSky, 300000); // 5 min
  setInterval(fetchCloudflare, 300000); // 5 min
  setInterval(fetchUSDA, 360000); // 6 min
  setInterval(fetchCommodities, 300000); // 5 min
  setInterval(fetchSupplyChain, 600000); // 10 min
  setInterval(fetchGSCPI, 1200000); // 20 min

  // Initial fetch
  fetchUSGS();
  fetchNOAASpace();
  fetchNOAATsunami();
  fetchUSDA();
  fetchCommodities();

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    
    ws.send(JSON.stringify({ 
      type: "CONNECTED", 
      message: "Sentinel Real-time Link Established",
      initialAnomalies: anomalies
    }));

    ws.on("close", () => console.log("Client disconnected"));
  });

  // Simulate periodic "Live Updates"
  setInterval(() => {
    if (wss.clients.size > 0) {
      broadcast({
        type: "HEARTBEAT",
        timestamp: new Date().toISOString()
      });
    }
  }, 30000);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/anomalies", (req, res) => {
    res.json(anomalies);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
