import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { XMLParser } from "fast-xml-parser";

// In-memory storage
let anomalies: any[] = [];
let humanitarianEfforts: any[] = [];
const MAX_ANOMALIES = 50;
const MAX_EFFORTS = 50;

const MOCK_ANOMALIES = [
  {
    id: 'mock-anomaly-1',
    source: 'MOCK SYSTEM',
    type: 'SEISMIC_ANOMALY',
    title: 'TEST ANOMALY: Seismic Activity',
    description: 'This is a test anomaly to verify the Emergency Monitor.',
    severity: 'MEDIUM',
    timestamp: new Date().toISOString()
  }
];

const MOCK_HUMANITARIAN_EFFORTS = [
  {
    id: 'effort-1',
    title: 'Clean Water Initiative',
    type: 'WATER',
    status: 'ACTIVE',
    location: 'Gaza Strip',
    coordinates: { lat: 31.3547, lng: 34.3088 },
    description: 'Deploying mobile desalination units to provide potable water to displaced families.',
    organization: 'UNRWA',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.unrwa.org/'
  },
  {
    id: 'effort-2',
    title: 'Emergency Medical Camp',
    type: 'MEDICAL',
    status: 'ACTIVE',
    location: 'Kharkiv, Ukraine',
    coordinates: { lat: 49.9935, lng: 36.2304 },
    description: 'Providing trauma surgery and primary care in underground shelters.',
    organization: 'Doctors Without Borders',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.msf.org/'
  },
  {
    id: 'effort-3',
    title: 'Earthquake Reconstruction',
    type: 'RECONSTRUCTION',
    status: 'PLANNED',
    location: 'Hatay, Turkey',
    coordinates: { lat: 36.4018, lng: 36.3498 },
    description: 'Planning sustainable housing for 5,000 families affected by the recent seismic activity.',
    organization: 'UN-Habitat',
    timestamp: new Date().toISOString(),
    source_url: 'https://unhabitat.org/'
  },
  {
    id: 'effort-4',
    title: 'Food Security Program',
    type: 'FOOD',
    status: 'ACTIVE',
    location: 'Tigray, Ethiopia',
    coordinates: { lat: 13.7, lng: 39.0 },
    description: 'Distributing high-protein grain supplements to combat acute malnutrition.',
    organization: 'World Food Programme',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.wfp.org/'
  },
  {
    id: 'effort-5',
    title: 'Search and Rescue Ops',
    type: 'RESCUE',
    status: 'ACTIVE',
    location: 'Central Japan',
    coordinates: { lat: 36.5, lng: 137.0 },
    description: 'Specialized teams searching for survivors following the coastal flooding.',
    organization: 'Japanese Red Cross Society',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.jrc.or.jp/english/'
  }
];

async function startServer() {
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;
  const parser = new XMLParser();

  // Helper for fetch with timeout
  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

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
      const res = await fetchWithTimeout("https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.5");
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
      const res = await fetchWithTimeout("https://services.swpc.noaa.gov/products/alerts.json");
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
      const res = await fetchWithTimeout("https://www.tsunami.gov/events/xml/WEPA40.xml");
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

  const fetchOpenSky = async (retries = 2) => {
    try {
      const res = await fetchWithTimeout("https://opensky-network.org/api/states/all", {}, 5000);
      
      if (res.ok) {
        const data = await res.json();
        const count = data.states?.length || 0;
        if (count < 1000 && count > 0) {
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
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.warn("OpenSky Fetch Timeout: Request aborted after 5s");
      } else if (retries > 0) {
        console.warn(`OpenSky Fetch Failed, retrying... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchOpenSky(retries - 1);
      } else {
        console.error("OpenSky Fetch Error:", e.message || e);
      }
    }
  };

  const fetchCloudflare = async () => {
    try {
      const res = await fetchWithTimeout("https://api.cloudflare.com/client/v4/radar/annotations/outages");
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
        const res = await fetchWithTimeout(url);
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
      const res = await fetchWithTimeout(`https://financialmodelingprep.com/api/v3/quotes/commodity?apikey=${apiKey}`);
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
      const res = await fetchWithTimeout("https://v3-api.newscatcherapi.com/v3/search_events", {
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
      const res = await fetchWithTimeout("https://www.newyorkfed.org/research/policy/gscpi");
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

  const categorizeEffort = (title: string, body: string): 'AID' | 'RESCUE' | 'RECONSTRUCTION' | 'MEDICAL' | 'SHELTER' | 'FOOD' | 'WATER' => {
    const text = (title + " " + body).toLowerCase();
    if (text.includes('medical') || text.includes('health') || text.includes('hospital') || text.includes('vaccine') || text.includes('epidemic') || text.includes('disease') || text.includes('doctor') || text.includes('nurse')) return 'MEDICAL';
    if (text.includes('water') || text.includes('sanitation') || text.includes('wash') || text.includes('flood') || text.includes('drought') || text.includes('well') || text.includes('irrigation')) return 'WATER';
    if (text.includes('food') || text.includes('hunger') || text.includes('nutrition') || text.includes('agriculture') || text.includes('famine') || text.includes('meal') || text.includes('grain')) return 'FOOD';
    if (text.includes('shelter') || text.includes('housing') || text.includes('displacement') || text.includes('refugee') || text.includes('camp') || text.includes('tent') || text.includes('idp')) return 'SHELTER';
    if (text.includes('rescue') || text.includes('search') || text.includes('evacuation') || text.includes('emergency response') || text.includes('cyclone') || text.includes('storm') || text.includes('earthquake') || text.includes('fire')) return 'RESCUE';
    if (text.includes('reconstruction') || text.includes('rebuild') || text.includes('infrastructure') || text.includes('recovery') || text.includes('repair')) return 'RECONSTRUCTION';
    return 'AID';
  };

  const fetchReliefWeb = async () => {
    try {
      // Improved query with more specific filters if needed, but keeping it broad for now
      const url = "https://api.reliefweb.int/v1/reports?appname=SovereignResilience&limit=50&preset=latest&fields[include][]=title&fields[include][]=body&fields[include][]=date&fields[include][]=source&fields[include][]=primary_country&fields[include][]=url&fields[include][]=primary_country.iso3";
      const res = await fetchWithTimeout(url);
      const data = await res.json();
      const reports = data.data || [];
      
      if (reports.length === 0) {
        console.warn("ReliefWeb: No reports returned in current window.");
        if (humanitarianEfforts.length === 0) {
          humanitarianEfforts = [...MOCK_HUMANITARIAN_EFFORTS];
        }
        return;
      }

      reports.forEach((report: any) => {
        const fields = report.fields;
        if (!fields) return;

        const typeMap: { [key: string]: string } = {
          'Epidemic': 'MEDICAL',
          'Flood': 'WATER',
          'Drought': 'WATER',
          'Food Insecurity': 'FOOD',
          'Conflict': 'RESCUE',
          'Earthquake': 'RESCUE',
          'Natural Disaster': 'RESCUE'
        };

        const effort = {
          id: `reliefweb-${report.id}`,
          source: "UN OCHA / ReliefWeb",
          type: categorizeEffort(fields.title, fields.body || ""),
          title: fields.title,
          description: fields.body ? (fields.body.substring(0, 200) + '...') : fields.title,
          status: "ACTIVE",
          location: fields.primary_country?.[0]?.name || fields.primary_country?.name || "Global",
          coordinates: fields.primary_country?.[0]?.location ? { 
            lat: fields.primary_country[0].location.lat, 
            lng: fields.primary_country[0].location.lon 
          } : fields.primary_country?.location ? {
            lat: fields.primary_country.location.lat,
            lng: fields.primary_country.location.lon
          } : { lat: (Math.random() * 120 - 60), lng: (Math.random() * 240 - 120) },
          organization: fields.source?.[0]?.name || "UN OCHA",
          timestamp: fields.date.created,
          source_url: fields.url,
          official: true,
          country_code: fields.primary_country?.[0]?.iso3?.toLowerCase() || fields.primary_country?.iso3?.toLowerCase()
        };
        addEffort(effort);
      });
    } catch (e) {
      console.error("ReliefWeb Fetch Error:", e);
      if (humanitarianEfforts.length === 0) {
        console.log("Using mock humanitarian efforts.");
        humanitarianEfforts = [...MOCK_HUMANITARIAN_EFFORTS];
      }
    }
  };

  const fetchGDACS = async () => {
    try {
      const url = "https://www.gdacs.org/xml/rss.xml";
      const res = await fetchWithTimeout(url);
      const text = await res.text();
      
      // Simple XML parsing for RSS
      const items = (text.match(/<item>[\s\S]*?<\/item>/g) || []) as string[];
      
      items.forEach((item: string) => {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "GDACS Alert";
        
        // Filter out low-priority "Green" alerts if they are just notifications
        if (title.startsWith('Green') && items.length > 10) return;

        const description = item.match(/<description>(.*?)<\/description>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "https://www.gdacs.org";
        const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
        const lat = parseFloat(item.match(/<geo:lat>(.*?)<\/geo:lat>/)?.[1] || "0");
        const lng = parseFloat(item.match(/<geo:long>(.*?)<\/geo:long>/)?.[1] || "0");
        
        let type: 'AID' | 'RESCUE' | 'RECONSTRUCTION' | 'MEDICAL' | 'SHELTER' | 'FOOD' | 'WATER' = 'AID';
        if (title.includes('Flood')) type = 'WATER';
        else if (title.includes('Earthquake')) type = 'RESCUE';
        else if (title.includes('Cyclone') || title.includes('Storm')) type = 'RESCUE';
        else if (title.includes('Drought')) type = 'FOOD';
        else if (title.includes('Fire')) type = 'RESCUE';
        else if (title.includes('Epidemic') || title.includes('Health')) type = 'MEDICAL';
        
        const iso3 = item.match(/<gdacs:iso3>(.*?)<\/gdacs:iso3>/)?.[1] || "";
        
        const effort = {
          id: `gdacs-${title.replace(/\s+/g, '-').toLowerCase()}`,
          source: "GDACS",
          type: categorizeEffort(title, description),
          title: title,
          description: description.substring(0, 200) + '...',
          status: "ACTIVE",
          location: title.split(' in ')?.[1] || "Global",
          coordinates: { lat, lng },
          organization: "GDACS",
          timestamp: date,
          source_url: link,
          official: true,
          country_code: iso3.toLowerCase()
        };
        addEffort(effort);
      });
    } catch (e) {
      console.error("GDACS Fetch Error:", e);
    }
  };

  const fetchUNNews = async () => {
    try {
      const url = "https://news.un.org/feed/subscribe/en/news/all/rss.xml";
      const res = await fetchWithTimeout(url);
      const text = await res.text();
      
      const items = (text.match(/<item>[\s\S]*?<\/item>/g) || []) as string[];
      
      items.forEach((item: string) => {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "UN News Update";
        const description = item.match(/<description>(.*?)<\/description>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "https://news.un.org";
        const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
        
        const locationMatch = title.match(/^(.*?):/);
        const location = locationMatch ? locationMatch[1] : "Global";
        
        const effort = {
          id: `unnews-${title.replace(/\s+/g, '-').toLowerCase()}`,
          source: "UN News",
          type: categorizeEffort(title, description),
          title: title,
          description: description.substring(0, 200) + '...',
          status: "ACTIVE",
          location: location,
          coordinates: { lat: (Math.random() * 120 - 60), lng: (Math.random() * 240 - 120) },
          organization: "United Nations",
          timestamp: date,
          source_url: link,
          official: true,
          country_code: location.toLowerCase() // Will try to match in ISO map if it's a country name
        };
        addEffort(effort);
      });
    } catch (e) {
      console.error("UN News Fetch Error:", e);
    }
  };

  const addEffort = (effort: any) => {
    const isDrought = (effort.title + " " + effort.description).toLowerCase().includes('drought');
    
    // Deduplication and Combining logic
    let existingIndex = -1;
    
    if (isDrought) {
      // For droughts, consolidate EVERYTHING into ONE global card
      existingIndex = humanitarianEfforts.findIndex(e => 
        e.id === 'global-drought-crisis' || 
        (e.title + " " + e.description).toLowerCase().includes('drought')
      );
    } else {
      existingIndex = humanitarianEfforts.findIndex(e => 
        (e.id === effort.id) || 
        (e.title === effort.title && e.location === effort.location)
      );
    }

    if (existingIndex !== -1) {
      const existing = humanitarianEfforts[existingIndex];
      if (isDrought) {
        // Combine drought info if it's a new unique report
        // Check if this specific report (by title) is already in the description
        if (!existing.description.includes(effort.title.substring(0, 20))) {
          existing.id = 'global-drought-crisis';
          existing.title = `Global Drought Crisis: Multiple Regions Affected`;
          existing.location = 'Global / Multiple Regions';
          existing.type = 'WATER';
          existing.country_code = 'un';
          existing.description = `${existing.description}\n\n[Update - ${effort.location}]: ${effort.title} - ${effort.description}`;
          existing.timestamp = effort.timestamp; // Keep latest timestamp
          existing.organization = 'Multiple Agencies (UN/GDACS/ReliefWeb)';
          
          // Keep the latest source URL if the old one is different
          if (effort.source_url && existing.source_url !== effort.source_url) {
            existing.source_url = effort.source_url;
          }
          // Broadcast the update
          broadcast({ type: "EFFORT_DETECTED", effort: existing });
        }
      } else {
        humanitarianEfforts[existingIndex] = { ...existing, ...effort };
        broadcast({ type: "EFFORT_DETECTED", effort: humanitarianEfforts[existingIndex] });
      }
    } else {
      if (isDrought) {
        // Create the first global drought card
        const globalDrought = {
          ...effort,
          id: 'global-drought-crisis',
          title: `Global Drought Crisis: ${effort.location}`,
          location: 'Global / Multiple Regions',
          country_code: 'un',
          description: `[Initial Report - ${effort.location}]: ${effort.title} - ${effort.description}`,
          organization: 'Multiple Agencies (UN/GDACS/ReliefWeb)'
        };
        humanitarianEfforts = [globalDrought, ...humanitarianEfforts].slice(0, MAX_EFFORTS);
        broadcast({ type: "EFFORT_DETECTED", effort: globalDrought });
      } else {
        humanitarianEfforts = [effort, ...humanitarianEfforts].slice(0, MAX_EFFORTS);
        broadcast({ type: "EFFORT_DETECTED", effort });
      }
    }
  };

  const addAnomaly = (anomaly: any) => {
    const exists = anomalies.find(a => a.id === anomaly.id);
    if (!exists) {
      console.log(`DEBUG: Adding anomaly: ${anomaly.title}`);
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
  setInterval(fetchReliefWeb, 120000); // 2 min
  setInterval(fetchGDACS, 120000); // 2 min
  setInterval(fetchUNNews, 300000); // 5 min

  // Initial fetch
  fetchUSGS();
  fetchNOAASpace();
  fetchNOAATsunami();
  fetchUSDA();
  fetchCommodities();
  fetchReliefWeb();
  fetchGDACS();
  fetchUNNews();

  // WebSocket connection handling
  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    
    ws.send(JSON.stringify({ 
      type: "CONNECTED", 
      message: "Sovereign-Resilience Real-time Link Established",
      initialAnomalies: anomalies.length > 0 ? anomalies : MOCK_ANOMALIES,
      initialEfforts: humanitarianEfforts.length > 0 ? humanitarianEfforts : MOCK_HUMANITARIAN_EFFORTS
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

  app.get("/api/humanitarian", (req, res) => {
    res.json(humanitarianEfforts);
  });

  app.get("/api/validate-url", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { 
        method: "HEAD", 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      const isOfficial = url.includes(".gov") || 
                        url.includes("reuters.com") || 
                        url.includes("apnews.com") || 
                        url.includes("bbc.com") || 
                        url.includes("un.org") ||
                        url.includes("nato.int") ||
                        url.includes("whitehouse.gov");

      res.json({ 
        valid: response.ok, 
        status: response.status,
        official: isOfficial,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      res.json({ valid: false, error: "Timeout or Connection Error", official: false });
    }
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
