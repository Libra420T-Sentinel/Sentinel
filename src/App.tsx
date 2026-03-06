/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Globe, 
  Bell, 
  BellOff, 
  RefreshCw, 
  Activity,
  ExternalLink,
  Shield,
  Search,
  Plus,
  Minus,
  Maximize,
  MapPin,
  X,
  ChevronRight,
  Zap,
  Download,
  FilterX,
  ArrowUpDown,
  Flame,
  Skull,
  Waves,
  Stethoscope,
  Radio,
  Camera,
  Mic,
  AlertOctagon,
  Eye,
  User,
  Info,
  Briefcase,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Orbit,
  Cpu,
  Sun,
  Heart,
  Anchor,
  Droplets,
  BookOpen,
  FileDown,
  HeartPulse,
  HandHelping,
  Tent,
  LifeBuoy,
  ShieldQuestion
} from 'lucide-react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import AboutModal from './components/AboutModal';
import CriticalAlertBanner from './components/CriticalAlertBanner';
import DefconOneOverlay from './components/DefconOneOverlay';
import { SolutionCard } from './components/SolutionCard';
import { getSolutionsForEmergency, HUMANITARIAN_SOLUTIONS } from './humanitarianData';
import { cn } from './utils';

import Markdown from 'react-markdown';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';



// Types
interface PresidentialInterruption {
  title: string;
  message: string;
  timestamp: string;
  live_url?: string;
  article_url?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Emergency {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'WARFARE' | 'EARTHQUAKE' | 'FIRE' | 'NATURAL_DISASTER' | 'HEALTH' | 'CYBER' | 'ECONOMY' | 'SPACE' | 'TERRORISM' | 'FINANCE' | 'STOCK' | 'AGRICULTURE' | 'OTHER';
  location: string;
  coordinates?: { lat: number; lng: number };
  summary: string;
  source_url?: string;
  magnitude?: string;
  timestamp: string;
}

interface GlobalStatus {
  defcon_level: number;
  emergencies: Emergency[];
  humanitarian_efforts: HumanitarianEffort[];
  stability_assessment: string;
  last_updated: string;
  presidential_interruption?: {
    title: string;
    message: string;
    timestamp: string;
    live_url?: string;
    article_url?: string;
  };
}

interface HistoryItem {
  id: string;
  type: 'DEFCON_CHANGE' | 'EMERGENCY_ALERT';
  title: string;
  description: string;
  timestamp: string;
  severity?: string;
  level?: number;
}

interface Anomaly {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  link?: string;
  metadata?: {
    price?: number;
    change?: number;
  };
}

interface Briefing {
  id: string;
  title: string;
  summary: string;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  source_url?: string;
}

interface HumanitarianEffort {
  id: string;
  title: string;
  type: 'AID' | 'RESCUE' | 'RECONSTRUCTION' | 'MEDICAL' | 'SHELTER' | 'FOOD' | 'WATER';
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  organization: string;
  timestamp: string;
  source_url?: string;
  official?: boolean;
  country_code?: string;
}

interface Leader {
  id: string;
  name: string;
  title: string;
  country: string;
  status: 'STABLE' | 'ELEVATED' | 'CRITICAL';
  portrait_url: string;
  recent_actions: string[];
  allies: string[];
  conflicts: string[];
  associated_crises: { title: string; url?: string }[];
}

// --- Constants & Helpers ---
const ISO3_TO_ISO2: Record<string, string> = {
  'brazil': 'br', 'afghanistan': 'af', 'china': 'cn', 'ethiopia': 'et', 'kenya': 'ke', 'angola': 'ao', 'south africa': 'za', 'ukraine': 'ua', 'sudan': 'sd', 'syria': 'sy', 'yemen': 'ye', 'gaza': 'ps', 'palestine': 'ps', 'israel': 'il', 'lebanon': 'lb', 'iran': 'ir', 'iraq': 'iq', 'libya': 'ly', 'mali': 'ml', 'niger': 'ne', 'chad': 'td', 'somalia': 'so', 'myanmar': 'mm', 'haiti': 'ht', 'venezuela': 've', 'colombia': 'co', 'mexico': 'mx', 'turkey': 'tr', 'turkiye': 'tr', 'pakistan': 'pk', 'india': 'in', 'bangladesh': 'bd', 'egypt': 'eg', 'nigeria': 'ng', 'congo': 'cd', 'drc': 'cd',
  'afg': 'af', 'alb': 'al', 'dza': 'dz', 'asm': 'as', 'and': 'ad', 'ago': 'ao', 'aia': 'ai', 'ata': 'aq', 'atg': 'ag', 'arg': 'ar', 'arm': 'am', 'abw': 'aw', 'aus': 'au', 'aut': 'at', 'aze': 'az',
  'bhs': 'bs', 'bhr': 'bh', 'bgd': 'bd', 'brb': 'bb', 'blr': 'by', 'bel': 'be', 'blz': 'bz', 'ben': 'bj', 'bmu': 'bm', 'btn': 'bt', 'bol': 'bo', 'bes': 'bq', 'bih': 'ba', 'bwa': 'bw', 'bvt': 'bv', 'bra': 'br', 'iot': 'io', 'brn': 'bn', 'bgr': 'bg', 'bfa': 'bf', 'bdi': 'bi',
  'cpv': 'cv', 'khm': 'kh', 'cmr': 'cm', 'can': 'ca', 'cym': 'ky', 'caf': 'cf', 'tcd': 'td', 'chl': 'cl', 'chn': 'cn', 'cxr': 'cx', 'cck': 'cc', 'col': 'co', 'com': 'km', 'cog': 'cg', 'cod': 'cd', 'cok': 'ck', 'cri': 'cr', 'hrv': 'hr', 'cub': 'cu', 'cuw': 'cw', 'cyp': 'cy', 'cze': 'cz',
  'dnk': 'dk', 'dji': 'dj', 'dma': 'dm', 'dom': 'do', 'ecu': 'ec', 'egy': 'eg', 'slv': 'sv', 'gnq': 'gq', 'eri': 'er', 'est': 'ee', 'eth': 'et', 'flk': 'fk', 'fro': 'fo', 'fji': 'fj', 'fin': 'fi', 'fra': 'fr', 'guf': 'gf', 'pyf': 'pf', 'atf': 'tf', 'gab': 'ga', 'gmb': 'gm', 'geo': 'ge', 'deu': 'de', 'gha': 'gh', 'gib': 'gi', 'grc': 'gr', 'grl': 'gl', 'grd': 'gd', 'glp': 'gp', 'gum': 'gu', 'gtm': 'gt', 'ggy': 'gg', 'gin': 'gn', 'gnb': 'gw', 'guy': 'gy', 'hti': 'ht', 'hmd': 'hm', 'vat': 'va', 'hnd': 'hn', 'hkg': 'hk', 'hun': 'hu', 'isl': 'is', 'ind': 'in', 'idn': 'id', 'irn': 'ir', 'irq': 'iq', 'irl': 'ie', 'imn': 'im', 'isr': 'il', 'ita': 'it', 'jam': 'jm', 'jpn': 'jp', 'jey': 'je', 'jor': 'jo', 'kaz': 'kz', 'ken': 'ke', 'kir': 'ki', 'prk': 'kp', 'kor': 'kr', 'kwt': 'kw', 'kgz': 'kg', 'lao': 'la', 'lva': 'lv', 'lbn': 'lb', 'lso': 'ls', 'lbr': 'lr', 'lby': 'ly', 'lie': 'li', 'ltu': 'lt', 'lux': 'lu', 'mac': 'mo', 'mkd': 'mk', 'mdg': 'mg', 'mwi': 'mw', 'mys': 'my', 'mdv': 'mv', 'mli': 'ml', 'mlt': 'mt', 'mhl': 'mh', 'mtq': 'mq', 'mrt': 'mr', 'mus': 'mu', 'myt': 'yt', 'mex': 'mx', 'fsm': 'fm', 'mda': 'md', 'mco': 'mc', 'mng': 'mn', 'mne': 'me', 'msr': 'ms', 'mar': 'ma', 'moz': 'mz', 'mmr': 'mm', 'nam': 'na', 'nru': 'nr', 'npl': 'np', 'nld': 'nl', 'ncl': 'nc', 'nzl': 'nz', 'nic': 'ni', 'ner': 'ne', 'nga': 'ng', 'niu': 'nu', 'nfk': 'nf', 'mnp': 'mp', 'nor': 'no', 'omn': 'om', 'pak': 'pk', 'plw': 'pw', 'pse': 'ps', 'pan': 'pa', 'png': 'pg', 'pry': 'py', 'per': 'pe', 'phl': 'ph', 'pcn': 'pn', 'pol': 'pl', 'prt': 'pt', 'pri': 'pr', 'qat': 'qa', 'reu': 're', 'rou': 'ro', 'rus': 'ru', 'rwa': 'rw', 'blm': 'bl', 'shn': 'sh', 'kna': 'kn', 'lca': 'lc', 'maf': 'mf', 'spm': 'pm', 'vct': 'vc', 'wsm': 'ws', 'smr': 'sm', 'stp': 'st', 'sau': 'sa', 'sen': 'sn', 'srb': 'rs', 'syc': 'sc', 'sle': 'sl', 'sgp': 'sg', 'sxm': 'sx', 'svk': 'sk', 'svn': 'si', 'slb': 'sb', 'som': 'so', 'zaf': 'za', 'sgs': 'gs', 'ssd': 'ss', 'esp': 'es', 'lka': 'lk', 'sdn': 'sd', 'sur': 'sr', 'sjm': 'sj', 'swz': 'sz', 'swe': 'se', 'che': 'ch', 'syr': 'sy', 'twn': 'tw', 'tjk': 'tj', 'tza': 'tz', 'tha': 'th', 'tls': 'tl', 'tgo': 'tg', 'tkl': 'tk', 'ton': 'to', 'tto': 'tt', 'tun': 'tn', 'tur': 'tr', 'tkm': 'tm', 'tca': 'tc', 'tuv': 'tv', 'uga': 'ug', 'ukr': 'ua', 'are': 'ae', 'gbr': 'gb', 'usa': 'us', 'umi': 'um', 'ury': 'uy', 'uzb': 'uz', 'vut': 'vu', 'ven': 've', 'vnm': 'vn', 'vgb': 'vg', 'vir': 'vi', 'wlf': 'wf', 'esh': 'eh', 'yem': 'ye', 'zmb': 'zm', 'zwe': 'zw'
};

const getCountryCode = (country: string): string => {
  const normalized = country.toLowerCase();
  if (ISO3_TO_ISO2[normalized]) return ISO3_TO_ISO2[normalized];
  
  const mapping: Record<string, string> = {
    'united states': 'us',
    'usa': 'us',
    'china': 'cn',
    'russia': 'ru',
    'united kingdom': 'gb',
    'uk': 'gb',
    'france': 'fr',
    'germany': 'de',
    'israel': 'il',
    'iran': 'ir',
    'north korea': 'kp',
    'south korea': 'kr',
    'ukraine': 'ua',
    'japan': 'jp',
    'india': 'in',
    'brazil': 'br',
    'canada': 'ca',
    'australia': 'au',
    'nato': 'un',
  };
  return mapping[normalized] || 'un';
};

const DEFCON_COLORS: Record<number, string> = {
  1: 'from-red-600 to-red-900 text-white shadow-[0_0_40px_rgba(220,38,38,0.6)]',
  2: 'from-orange-500 to-orange-800 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]',
  3: 'from-yellow-400 to-yellow-700 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]',
  4: 'from-green-500 to-green-800 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]',
  5: 'from-blue-500 to-blue-800 text-white shadow-[0_0_10px_rgba(59,130,246,0.1)]',
};

const DEFCON_GLOW: Record<number, string> = {
  1: 'bg-red-500/20',
  2: 'bg-orange-500/15',
  3: 'bg-yellow-500/10',
  4: 'bg-green-500/5',
  5: 'bg-blue-500/5',
};

const DEFCON_DESCRIPTIONS: Record<number, string> = {
  1: 'COCKED PISTOL - Maximum readiness. Immediate response required.',
  2: 'FAST PACE - Armed forces ready to deploy and engage in less than 6 hours.',
  3: 'ROUND HOUSE - Increase in force readiness above that required for normal readiness.',
  4: 'DOUBLE TAKE - Increased intelligence watch and strengthened security measures.',
  5: 'FADE OUT - Lowest state of readiness. Normal peacetime readiness.',
};

const DEFCON_DEFINITIONS: Record<number, string> = {
  1: 'Maximum readiness. All forces ready for immediate action. Nuclear war is imminent.',
  2: 'Significant increase in force readiness. Deployment of strategic assets is underway.',
  3: 'Heightened state of alert. Strategic forces are mobilized and ready for rapid deployment.',
  4: 'Increased intelligence gathering and security. Precautionary measures are in place.',
  5: 'Standard peacetime readiness. No immediate military threat detected.',
};

const RESILIENCE_LEVELS: Record<number, string> = {
  1: "Global Unity. Humanitarian efforts are fully synchronized. Maximum resilience achieved.",
  2: "High Cooperation. Major aid corridors are open and protected. Strong community bonds.",
  3: "Active Response. Relief efforts are mobilized. Local networks are stabilizing.",
  4: "Emerging Hope. Initial aid reaching affected zones. Awareness is growing.",
  5: "Baseline Resilience. Standard humanitarian protocols in place. Monitoring for needs."
};

const RESILIENCE_COLORS: Record<number, string> = {
  1: "from-emerald-600 to-teal-600 shadow-[0_0_40px_rgba(16,185,129,0.4)]",
  2: "from-emerald-500 to-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]",
  3: "from-teal-500 to-emerald-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]",
  4: "from-lime-500 to-emerald-500 shadow-[0_0_15px_rgba(132,204,22,0.15)]",
  5: "from-emerald-400/20 to-emerald-500/20 shadow-none border border-emerald-500/20"
};

const safeUrl = (url: any): string | null => {
  if (!url || typeof url !== 'string') return null;
  let cleaned = url.trim();
  if (!cleaned || cleaned === '#' || cleaned === 'null' || cleaned === 'undefined') return null;
  
  // Try to fix missing protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  
  try {
    new URL(cleaned);
    return cleaned;
  } catch (e) {
    return null;
  }
};

const safeJsonParse = (text: any, fallback: any) => {
  if (!text || typeof text !== 'string') return fallback;
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    try {
      // Clean and try again
      let cleaned = text.trim();
      
      // Remove markdown blocks
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Find the first '{' or '['
      const start = cleaned.search(/[\{\[]/);
      if (start !== -1) {
        cleaned = cleaned.substring(start);
      }
      
      // Find the last '}' or ']'
      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);
      if (end !== -1) {
        cleaned = cleaned.substring(0, end + 1);
      }
      
      // Final attempt to parse
      return JSON.parse(cleaned);
    } catch (innerError) {
      console.warn("Sovereign-Resilience: JSON Parse Recovery Failed", {
        error: innerError,
        snippet: text.substring(0, 100) + "..."
      });
      return fallback;
    }
  }
};

// --- World Map Component ---
export interface WorldMapHandle {
  zoomTo: (lat: number, lng: number) => void;
  resetZoom: () => void;
}

const WorldMap = React.forwardRef<WorldMapHandle, { emergencies: Emergency[], onSearch: (location: string) => void }>(({ emergencies, onSearch }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const zoomRef = useRef<any>(null);
  const projectionRef = useRef<any>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        setWorldData(feature(data, data.objects.countries));
      });
  }, []);

  // ZoomTo implementation
  React.useImperativeHandle(ref, () => ({
    zoomTo: (lat: number, lng: number) => {
      if (!svgRef.current || !zoomRef.current || !projectionRef.current) return;
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      const [x, y] = projectionRef.current([lng, lat]) || [0, 0];
      
      svg.transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(6).translate(-x, -y));
    },
    resetZoom: () => {
      if (!svgRef.current || !zoomRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }));

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove();

    const g = svg.append("g");
    gRef.current = g.node() as SVGGElement;

    const projection = d3.geoMercator()
      .scale(width / 6.5)
      .translate([width / 2, height / 1.5]);
    
    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    // Draw countries
    g.append("g")
      .selectAll("path")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", "#18181B")
      .attr("stroke", "#27272A")
      .attr("stroke-width", 0.5)
      .attr("class", "cursor-crosshair hover:fill-white/5 transition-colors")
      .on("click", (event, d: any) => {
        if (d.properties && d.properties.name) {
          onSearch(d.properties.name);
        } else {
          const [lng, lat] = projection.invert!(d3.pointer(event, svg.node())) || [0, 0];
          onSearch(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        }
      });

    // Clustering Logic
    const clusterRadius = 25; 
    const clusters: { center: [number, number], items: Emergency[], color: string }[] = [];

    emergencies.forEach(emergency => {
      if (!emergency.coordinates) return;
      const [x, y] = projection([emergency.coordinates.lng, emergency.coordinates.lat]) || [0, 0];
      
      let foundCluster = false;
      for (const cluster of clusters) {
        const dx = cluster.center[0] - x;
        const dy = cluster.center[1] - y;
        if (Math.sqrt(dx * dx + dy * dy) < clusterRadius) {
          cluster.items.push(emergency);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        const color = 
          emergency.severity === 'CRITICAL' ? "#DC2626" :
          emergency.severity === 'HIGH' ? "#F97316" :
          emergency.severity === 'MEDIUM' ? "#EAB308" : "#3B82F6";
        clusters.push({ center: [x, y], items: [emergency], color });
      }
    });

    // Draw clusters/markers
    const markers = g.append("g");

    clusters.forEach(cluster => {
      const [x, y] = cluster.center;
      const isCluster = cluster.items.length > 1;
      
      const markerGroup = markers.append("g")
        .attr("class", "cursor-pointer")
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1);
          if (isCluster) {
            tooltip.html(`
              <div class="p-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">
                <div class="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                  <div class="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <p class="font-bold text-[10px] uppercase tracking-widest text-white/60">${cluster.items.length} Events in Area</p>
                </div>
                <div class="space-y-2">
                  ${cluster.items.slice(0, 3).map(e => `
                    <div class="flex flex-col">
                      <p class="text-[11px] font-bold text-white/90 leading-tight">${e.title}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[8px] font-mono px-1 rounded bg-white/5 border border-white/10 text-white/40">${e.severity}</span>
                        <span class="text-[8px] font-mono text-white/30">${e.location}</span>
                      </div>
                    </div>
                  `).join('')}
                  ${cluster.items.length > 3 ? `<p class="text-[9px] font-mono text-white/20 pt-1">+ ${cluster.items.length - 3} more detected</p>` : ''}
                </div>
              </div>
            `);
          } else {
            const e = cluster.items[0];
            const timeStr = format(new Date(e.timestamp), 'HH:mm');
            tooltip.html(`
              <div class="p-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl min-w-[180px]">
                <div class="flex items-center justify-between gap-4 mb-2 border-b border-white/10 pb-2">
                  <span class="text-[8px] font-mono font-black px-1.5 py-0.5 rounded border" style="background: ${cluster.color}20; color: ${cluster.color}; border-color: ${cluster.color}40">
                    ${e.severity}
                  </span>
                  <span class="text-[8px] font-mono text-white/40 uppercase tracking-widest">${timeStr} ZULU</span>
                </div>
                <p class="font-bold text-[11px] text-white leading-tight mb-1">${e.title}</p>
                <div class="flex items-center gap-1.5 text-[9px] text-white/50">
                  <MapPin class="w-2.5 h-2.5" />
                  ${e.location}
                </div>
              </div>
            `);
          }
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      if (isCluster) {
        markerGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 12)
          .attr("fill", "#000")
          .attr("stroke", cluster.color)
          .attr("stroke-width", 2);

        markerGroup.append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "9px")
          .attr("font-family", "monospace")
          .attr("font-weight", "bold")
          .text(cluster.items.length);
      } else {
        const color = cluster.color;
        markerGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 5)
          .attr("fill", color)
          .attr("opacity", 0.6)
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", "5;12;5")
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");

        markerGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 4)
          .attr("fill", color);
      }
    });

  }, [worldData, emergencies, onSearch]);

  return (
    <div className="relative w-full h-[350px] bg-black/20 rounded-2xl overflow-hidden border border-white/5">
      <svg ref={svgRef} className="w-full h-full touch-none" />
      <div 
        ref={tooltipRef} 
        className="fixed pointer-events-none bg-black/90 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl text-white opacity-0 transition-opacity z-[100] min-w-[120px]"
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[9px] font-mono text-white/40 uppercase tracking-widest">
          Scroll to Zoom • Drag to Pan
        </div>
      </div>
      <div className="absolute bottom-4 left-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-[10px] font-mono text-white/40 uppercase">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[10px] font-mono text-white/40 uppercase">High</span>
        </div>
      </div>
    </div>
  );
});

// --- Dashboard Toggle Component ---
const DashboardToggle = ({ mode, setMode, showHeader }: { mode: 'THREAT' | 'RESILIENCE', setMode: (m: 'THREAT' | 'RESILIENCE') => void, showHeader: boolean }) => {
  return (
    <div className={cn(
      "sticky z-[40] flex justify-center py-4 backdrop-blur-md border-b border-white/5 print:hidden transition-all duration-300",
      mode === 'THREAT' ? "bg-black/40" : "bg-[#020804]/60",
      showHeader ? "top-[57px]" : "top-0"
    )}>
      <div className="relative flex items-center bg-[#121214] border border-white/10 rounded-full p-1 shadow-2xl">
        <motion.div
          className="absolute inset-1 rounded-full"
          initial={false}
          animate={{
            x: mode === 'THREAT' ? 0 : '100%',
            backgroundColor: mode === 'THREAT' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: 'calc(50% - 4px)' }}
        />
        <button
          onClick={() => setMode('THREAT')}
          className={cn(
            "relative px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            mode === 'THREAT' ? "text-red-500" : "text-white/40 hover:text-white/60"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full bg-red-500", mode === 'THREAT' && "animate-pulse")} />
          🔴 Global Threat Monitor
        </button>
        <button
          onClick={() => setMode('RESILIENCE')}
          className={cn(
            "relative px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            mode === 'RESILIENCE' ? "text-emerald-500" : "text-white/40 hover:text-white/60"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full bg-emerald-500", mode === 'RESILIENCE' && "animate-pulse")} />
          🌿 Humanitarian Resilience
        </button>
      </div>
    </div>
  );
};

// --- Humanitarian Map Component ---
const HumanitarianMap = ({ efforts }: { efforts: HumanitarianEffort[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<any>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        setWorldData(feature(data, data.objects.countries));
      });
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    const projection = d3.geoMercator()
      .scale(width / 6.5)
      .translate([width / 2, height / 1.5]);
    
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // Add zoom controls
    const zoomIn = () => svg.transition().call(zoom.scaleBy, 1.5);
    const zoomOut = () => svg.transition().call(zoom.scaleBy, 0.7);
    const resetZoom = () => svg.transition().call(zoom.transform, d3.zoomIdentity);

    (window as any).mapZoomIn = zoomIn;
    (window as any).mapZoomOut = zoomOut;
    (window as any).mapResetZoom = resetZoom;

    // Draw countries with earthy tones
    g.append("g")
      .selectAll("path")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("fill", "#1B261D")
      .attr("stroke", "#2D3A2F")
      .attr("stroke-width", 0.5);

    // Draw efforts
    const markers = g.append("g");

    efforts.forEach(effort => {
      const [x, y] = projection([effort.coordinates.lng, effort.coordinates.lat]) || [0, 0];
      
      const color = 
        effort.type === 'MEDICAL' ? "#10B981" : // Emerald
        effort.type === 'WATER' ? "#06B6D4" : // Cyan
        effort.type === 'FOOD' ? "#F59E0B" : // Amber
        effort.type === 'RESCUE' ? "#F43F5E" : // Rose
        "#8B5CF6"; // Violet

      const markerGroup = markers.append("g")
        .attr("class", "cursor-pointer")
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1);
          tooltip.html(`
            <div class="p-3 bg-[#020804]/90 backdrop-blur-xl border border-emerald-500/20 rounded-xl shadow-2xl min-w-[200px]">
              <div class="flex items-center justify-between gap-4 mb-2 border-b border-emerald-500/10 pb-2">
                <span class="text-[8px] font-mono font-black px-1.5 py-0.5 rounded border" style="background: ${color}20; color: ${color}; border-color: ${color}40">
                  ${effort.type}
                </span>
                <span class="text-[8px] font-mono text-emerald-500/40 uppercase tracking-widest">${effort.status}</span>
              </div>
              <p class="font-bold text-[11px] text-white leading-tight mb-1">${effort.title}</p>
              <p class="text-[9px] text-emerald-500/60 mb-2">${effort.organization}</p>
              <div class="flex items-center gap-1.5 text-[9px] text-white/50">
                <MapPin class="w-2.5 h-2.5" />
                ${effort.location}
              </div>
            </div>
          `);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      markerGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", color)
        .attr("opacity", 0.4)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", "6;14;6")
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");

      markerGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 1);
    });

  }, [worldData, efforts]);

  return (
    <div className="relative w-full h-[400px] bg-[#020804]/40 rounded-[2rem] overflow-hidden border border-emerald-500/10">
      <svg ref={svgRef} className="w-full h-full touch-none" />
      <div 
        ref={tooltipRef} 
        className="fixed pointer-events-none opacity-0 transition-opacity z-[100]"
      />
      <div className="absolute top-6 right-6 flex flex-col gap-2">
        <button 
          onClick={() => (window as any).mapZoomIn?.()}
          className="w-10 h-10 rounded-xl bg-[#020804]/80 backdrop-blur-md border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
          onClick={() => (window as any).mapZoomOut?.()}
          className="w-10 h-10 rounded-xl bg-[#020804]/80 backdrop-blur-md border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-xl"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button 
          onClick={() => (window as any).mapResetZoom?.()}
          className="w-10 h-10 rounded-xl bg-[#020804]/80 backdrop-blur-md border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all shadow-xl"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-6 left-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Resilience Map</span>
        </div>
      </div>
    </div>
  );
};

// --- Global State & Types ---

const getFlagUrl = (code?: string) => {
  if (!code) return null;
  const normalized = code.toLowerCase();
  const iso2 = ISO3_TO_ISO2[normalized] || (normalized.length === 2 ? normalized : null);
  if (!iso2) return null;
  return `https://flagcdn.com/w160/${iso2}.png`;
};

// --- Aid Organization Data ---
const AID_ORGANIZATIONS = [
  { name: 'ICRC', status: 'OPERATIONAL', focus: 'Conflict Zones', region: 'Global' },
  { name: 'WFP', status: 'ACTIVE', focus: 'Food Security', region: 'Global' },
  { name: 'MSF', status: 'CRITICAL', focus: 'Medical Emergency', region: 'Global' },
  { name: 'UNHCR', status: 'ACTIVE', focus: 'Refugee Support', region: 'Global' },
  { name: 'Red Cross', status: 'OPERATIONAL', focus: 'Disaster Relief', region: 'Global' },
];

// --- Resilience Dashboard Component ---
const ResilienceDashboard = ({ status }: { status: GlobalStatus | null }) => {
  // Derive resilience level inversely from DEFCON for symmetry, or keep it positive
  const resilienceLevel = status ? (6 - status.defcon_level) : 5;
  const [knowledgeIndex, setKnowledgeIndex] = useState(0);
  const [feedFilter, setFeedFilter] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [enrichedArticles, setEnrichedArticles] = useState<Record<string, string>>({});

  const findOfficialArticle = async (effort: HumanitarianEffort) => {
    setEnrichingId(effort.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the most official news article or report for this event: "${effort.title}" in ${effort.location}. Return ONLY the URL of the most official source (e.g. Reuters, AP, UN, BBC, or official government site).`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const url = response.text?.match(/https?:\/\/[^\s]+/)?.[0];
      if (url) {
        setEnrichedArticles(prev => ({ ...prev, [effort.id]: url }));
      }
    } catch (err) {
      console.error("Failed to find official article:", err);
    } finally {
      setEnrichingId(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setKnowledgeIndex(prev => (prev + 1) % HUMANITARIAN_SOLUTIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredEfforts = status?.humanitarian_efforts?.filter(e => !feedFilter || e.type === feedFilter) || [];
  const ALL_TOPICS = ['AID', 'RESCUE', 'RECONSTRUCTION', 'MEDICAL', 'SHELTER', 'FOOD', 'WATER'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
            {/* Humanitarian Watchlist (Symmetry with Leader Watchlist) */}
      <div className="bg-[#020804]/40 border-b border-emerald-500/5 py-4 overflow-x-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
          <div className="shrink-0 flex flex-col">
            <span className="text-[8px] font-mono text-emerald-500/30 uppercase tracking-[0.3em] mb-1">Humanitarian</span>
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Relief Watch</span>
          </div>
          <div className="h-10 w-[1px] bg-emerald-500/10 shrink-0" />
          <div className="flex items-center gap-8 pr-4">
            {(status?.humanitarian_efforts || []).slice(0, 10).map((effort) => {
              const flagUrl = getFlagUrl(effort.country_code);
              return (
                <div key={effort.id} className="flex items-center gap-3 group transition-all">
                  <div className="relative w-12 h-12 shrink-0">
                    {/* Heart Shape SVG for Clipping and Background */}
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <clipPath id="heartClipTop" clipPathUnits="objectBoundingBox">
                          <path d="M.5,1 C.5,1 0,.7 .05,.35 C.05,.15 .25,0 .5,.25 C.75,0 .95,.15 .95,.35 C1,.7 .5,1 .5,1" />
                        </clipPath>
                      </defs>
                    </svg>
                    
                    <div className={cn(
                      "absolute inset-0 w-full h-full transition-colors duration-500",
                      effort.type === 'MEDICAL' ? "bg-emerald-500/20" :
                      effort.type === 'WATER' ? "bg-cyan-500/20" :
                      effort.type === 'FOOD' ? "bg-amber-500/20" :
                      effort.type === 'RESCUE' ? "bg-rose-500/20" :
                      effort.type === 'SHELTER' ? "bg-indigo-500/20" :
                      "bg-amber-500/20"
                    )} style={{ clipPath: 'url(#heartClipTop)' }} />
                    
                    <div 
                      className="absolute inset-0 flex items-center justify-center overflow-hidden"
                      style={{ clipPath: 'url(#heartClipTop)' }}
                    >
                      {flagUrl ? (
                        <img 
                          src={flagUrl} 
                          alt={effort.location}
                          className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center",
                          effort.type === 'MEDICAL' ? "text-emerald-500" :
                          effort.type === 'WATER' ? "text-cyan-500" :
                          effort.type === 'FOOD' ? "text-amber-500" :
                          effort.type === 'RESCUE' ? "text-rose-500" :
                          effort.type === 'SHELTER' ? "text-indigo-500" :
                          "text-amber-500"
                        )}>
                          {effort.type === 'MEDICAL' && <HeartPulse className="w-5 h-5" />}
                          {effort.type === 'WATER' && <Droplets className="w-5 h-5" />}
                          {effort.type === 'FOOD' && <Flame className="w-5 h-5" />}
                          {effort.type === 'RESCUE' && <LifeBuoy className="w-5 h-5" />}
                          {effort.type === 'SHELTER' && <Tent className="w-5 h-5" />}
                          {effort.type === 'AID' && <HandHelping className="w-5 h-5" />}
                          {!['MEDICAL', 'WATER', 'FOOD', 'RESCUE', 'SHELTER', 'AID'].includes(effort.type) && <Heart className="w-5 h-5" />}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-500/90 leading-none mb-1 truncate max-w-[100px]">{effort.organization}</p>
                    <p className="text-[8px] font-mono text-amber-500 uppercase tracking-widest truncate max-w-[100px] font-black">{effort.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Intelligence and Knowledge */}
          <div className="lg:col-span-4 order-1 lg:order-none space-y-8">
            {/* Resilience Metrics (Symmetry with Leader Watchlist) */}
            <section className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 shadow-xl shadow-amber-900/10">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Resilience Metrics</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Active Efforts', value: status?.humanitarian_efforts?.length || 0 },
                    { label: 'Official Sources', value: new Set(status?.humanitarian_efforts?.map(e => e.organization)).size || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-amber-500/5 transition-colors">
                      <div className="text-2xl font-black tabular-nums text-amber-500">{value}</div>
                      <div className="text-[8px] font-mono opacity-40 uppercase tracking-widest mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Resilience Level Card (Symmetry with DEFCON) */}
            <section className="relative group">
              <div className={cn(
                "absolute -inset-1 rounded-[2.5rem] blur-2xl transition-all duration-1000 opacity-20 bg-amber-500/20"
              )} />
              
              <div className="relative bg-[#020804] border border-amber-500/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-900/20">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-amber-500/40" />
                    <h2 className="text-[10px] font-mono font-bold text-amber-500/40 uppercase tracking-[0.2em]">Humanitarian Readiness</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-amber-500/80 uppercase">Active</span>
                  </div>
                </div>

                <div className="px-8 pb-10 flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full border border-amber-500/5 scale-150" />
                    <div className="absolute inset-0 rounded-full border border-amber-500/5 scale-125" />
                    
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: ["0 0 20px rgba(245,158,11,0.2)", "0 0 40px rgba(245,158,11,0.4)", "0 0 20px rgba(245,158,11,0.2)"]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={cn(
                        "w-40 h-40 rounded-full flex flex-col items-center justify-center bg-gradient-to-br transition-all duration-700 relative z-10",
                        RESILIENCE_COLORS[resilienceLevel]
                      )}
                    >
                      <span className="text-[10px] font-mono font-bold tracking-[0.3em] opacity-60 mb-1 uppercase">Level</span>
                      <span className="text-7xl font-black tracking-tighter tabular-nums text-white">
                        {resilienceLevel}
                      </span>
                    </motion.div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-[10px] font-mono text-amber-500/40 uppercase tracking-widest mb-1 text-left">Resilience Status</p>
                      <p className="text-xs font-bold text-white text-left leading-relaxed">
                        {RESILIENCE_LEVELS[resilienceLevel]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/[0.02] p-6 border-t border-amber-500/5">
                  <div className="flex justify-between text-[9px] font-mono text-amber-500/30 mb-4 tracking-widest">
                    <span>RESILIENCE SCALE</span>
                    <span>LEVEL {resilienceLevel}</span>
                  </div>
                  <div className="flex gap-2 h-1.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          resilienceLevel === level ? "opacity-100" : "opacity-10",
                          "bg-amber-500"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Active Countermeasures (Direct response to emergencies) */}
            {status?.emergencies && status.emergencies.length > 0 && (
              <div className="p-8 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Active Countermeasures</h3>
                </div>
                <div className="space-y-4">
                  {status.emergencies.slice(0, 2).map((emergency) => {
                    const solutions = getSolutionsForEmergency(emergency);
                    return (
                      <div key={emergency.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest truncate max-w-[150px]">Target: {emergency.title}</span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Solution Sync</span>
                        </div>
                        <div className="space-y-2">
                          {solutions.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest">{s.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Global Aid Coordination */}
            <div className="p-8 rounded-[2.5rem] bg-[#020804] border border-amber-500/10 shadow-xl shadow-amber-900/10">
              <div className="flex items-center gap-3 mb-6">
                <HandHelping className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Global Aid Coordination</h3>
              </div>
              <div className="space-y-3">
                {AID_ORGANIZATIONS.map((org) => (
                  <div key={org.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">{org.name}</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">{org.focus}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={cn(
                          "text-[8px] font-bold uppercase tracking-widest",
                          org.status === 'CRITICAL' ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {org.status}
                        </div>
                        <div className="text-[7px] text-white/20 uppercase">{org.region}</div>
                      </div>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        org.status === 'CRITICAL' ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[#020804] border border-amber-500/10 shadow-xl shadow-amber-900/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Resilience Knowledge</h3>
                </div>
                <div className="flex gap-1">
                  {HUMANITARIAN_SOLUTIONS.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1 h-1 rounded-full transition-all",
                        i === knowledgeIndex ? "bg-amber-500 w-3" : "bg-white/10"
                      )} 
                    />
                  ))}
                </div>
              </div>
              <div className="relative h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={knowledgeIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute inset-0"
                  >
                    <SolutionCard solution={HUMANITARIAN_SOLUTIONS[knowledgeIndex]} className="h-full border-amber-500/20" />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-6 flex justify-between gap-4">
                <button 
                  onClick={() => setKnowledgeIndex(prev => (prev - 1 + HUMANITARIAN_SOLUTIONS.length) % HUMANITARIAN_SOLUTIONS.length)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setKnowledgeIndex(prev => (prev + 1) % HUMANITARIAN_SOLUTIONS.length)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Tactical Intelligence (Symmetry with Threat Dashboard) */}
          <div className="lg:col-span-8 space-y-8 order-2 lg:order-none">
            {/* Global Resilience Network (Map) */}
            <section className="bg-[#020804] border border-amber-500/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl shadow-amber-900/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Globe className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Global Resilience Network</h2>
                    <p className="text-[10px] text-amber-500/40 uppercase tracking-widest">Tracking active humanitarian efforts</p>
                  </div>
                </div>
              </div>
              <HumanitarianMap efforts={status?.humanitarian_efforts || []} />
            </section>

            {/* Live Relief Watch */}
            <section className="bg-[#020804] border border-amber-500/10 rounded-[2.5rem] p-8 shadow-2xl shadow-amber-900/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Activity className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em]">Live Relief Watch</h2>
                    <p className="text-[10px] text-amber-500/40 uppercase tracking-widest">Real-time aid & resilience tracking</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFeedFilter(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                      !feedFilter ? "bg-amber-500 border-amber-500 text-black" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    All
                  </button>
                  {ALL_TOPICS.map(type => (
                    <button 
                      key={type}
                      onClick={() => setFeedFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                        feedFilter === type ? "bg-amber-500 border-amber-500 text-black" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredEfforts.map((effort) => (
                  <article 
                    key={effort.id}
                    className="group relative p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/[0.02] transition-all cursor-default overflow-hidden"
                  >
                    {/* Vertical Type Indicator Bar */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      effort.type === 'MEDICAL' ? "bg-emerald-500" :
                      effort.type === 'WATER' ? "bg-cyan-500" :
                      effort.type === 'FOOD' ? "bg-amber-500" :
                      effort.type === 'RESCUE' ? "bg-rose-500" :
                      effort.type === 'SHELTER' ? "bg-indigo-500" :
                      "bg-amber-500"
                    )} />

                    <div className="flex flex-col gap-5">
                      {/* Top Metadata Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                            effort.type === 'MEDICAL' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                            effort.type === 'WATER' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" :
                            effort.type === 'FOOD' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                            effort.type === 'RESCUE' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                            effort.type === 'SHELTER' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" :
                            "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          )}>
                            {effort.type === 'MEDICAL' && <HeartPulse className="w-3 h-3" />}
                            {effort.type === 'WATER' && <Droplets className="w-3 h-3" />}
                            {effort.type === 'FOOD' && <Flame className="w-3 h-3" />}
                            {effort.type === 'RESCUE' && <LifeBuoy className="w-3 h-3" />}
                            {effort.type === 'RECONSTRUCTION' && <Briefcase className="w-3 h-3" />}
                            {effort.type === 'SHELTER' && <Tent className="w-3 h-3" />}
                            {effort.type === 'AID' && <HandHelping className="w-3 h-3" />}
                            {!['MEDICAL', 'WATER', 'FOOD', 'RESCUE', 'RECONSTRUCTION', 'SHELTER', 'AID'].includes(effort.type) && <Heart className="w-3 h-3" />}
                            {effort.type}
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black">
                            <MapPin className="w-3 h-3" />
                            {effort.location}
                          </div>

                          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                            {format(new Date(effort.timestamp), 'HH:mm')} ZULU
                          </div>
                        </div>

                        {effort.official && (
                          <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[8px] font-black text-amber-500 uppercase tracking-widest shrink-0 w-fit">
                            Official Deployment
                          </div>
                        )}
                      </div>

                      {/* Title and Description Section */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">
                          {effort.title}
                        </h3>

                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 shadow-inner group-hover:bg-amber-500/[0.08] transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] block">Reason for Listing</span>
                          </div>
                          <p className="text-sm text-white/90 leading-relaxed font-medium whitespace-pre-wrap">
                            {effort.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                          <Users className="w-3 h-3" />
                          {effort.organization}
                        </div>

                        <div className="flex items-center gap-3">
                          {!enrichedArticles[effort.id] && (
                            <button
                              onClick={() => findOfficialArticle(effort)}
                              disabled={enrichingId === effort.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 hover:text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                              {enrichingId === effort.id ? 'Searching...' : 'Find Coverage'} <Search className="w-3 h-3" />
                            </button>
                          )}
                          
                          {effort.source_url && (
                            <a 
                              href={enrichedArticles[effort.id] || effort.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 hover:bg-amber-500/20 transition-all uppercase tracking-widest"
                            >
                              {enrichedArticles[effort.id] ? 'Official Article' : 'View Report'} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {filteredEfforts.length === 0 && (
                  <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Activity className="w-12 h-12 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">No active resilience coverage detected for this topic.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Analog Resilience (Moved to bottom) */}
        <section className="mt-12 p-10 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Download className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-amber-500 uppercase tracking-[0.3em]">Analog Resilience Protocols</h3>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                In a grid-down scenario, digital tools fail. Download the complete offline manual for your physical emergency binder. 
                Includes medical protocols, water purification guides, and local coordination maps.
              </p>
            </div>
            <button 
              onClick={() => {
                try {
                  const doc = new jsPDF();
                  
                  // Title
                  doc.setFontSize(24);
                  doc.setTextColor(180, 130, 0); // Amber
                  doc.text('SOVEREIGN-RESILIENCE INTELLIGENCE MANUAL', 105, 20, { align: 'center' });
                  
                  doc.setFontSize(10);
                  doc.setTextColor(100, 100, 100);
                  doc.text(`Grid-Down Protocol v2.0 | Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
                  
                  // Section: Water
                  doc.setFontSize(16);
                  doc.setTextColor(0, 0, 0);
                  doc.text('I. WATER PURIFICATION & SECURITY', 20, 45);
                  doc.setFontSize(10);
                  doc.text('1. Boiling: 1 min rolling boil (3 mins > 2000m). Kills bacteria, viruses, parasites.', 25, 55);
                  doc.text('2. Chemical: 8 drops unscented bleach per gallon. Wait 30 mins. Must smell slightly of chlorine.', 25, 62);
                  doc.text('3. SODIS: PET bottles in direct sun for 6 hours. UV radiation destroys pathogens.', 25, 69);
                  doc.text('4. Distillation: Necessary for salt water or chemical contamination. Collect steam.', 25, 76);
                  
                  // Section: Medical
                  doc.setFontSize(16);
                  doc.text('II. TACTICAL MEDICAL TRIAGE (MARCH)', 20, 95);
                  doc.setFontSize(10);
                  doc.text('M - Massive Hemorrhage: Tourniquet high and tight. Pack wounds with gauze.', 25, 105);
                  doc.text('A - Airway: Check for obstructions. Use recovery position.', 25, 112);
                  doc.text('R - Respiration: Seal sucking chest wounds. Monitor breathing rate.', 25, 119);
                  doc.text('C - Circulation: Check pulses. Manage shock by keeping patient warm.', 25, 126);
                  doc.text('H - Head/Hypothermia: Prevent heat loss. Assess neurological status.', 25, 133);
                  
                  // Section: Comms
                  doc.setFontSize(16);
                  doc.text('III. GRID-DOWN COMMUNICATION', 20, 150);
                  doc.setFontSize(10);
                  doc.text('1. Radio: Monitor NOAA frequencies. Use HAM/GMRS for local coordination.', 25, 160);
                  doc.text('2. Signals: Whistle (3 blasts = distress). Signal mirrors for aerial SAR.', 25, 167);
                  doc.text('3. Mesh: Use Briar or Meshtastic for off-grid digital text coordination.', 25, 174);
                  
                  // Section: Community
                  doc.setFontSize(16);
                  doc.text('IV. COMMUNITY RESILIENCE', 20, 190);
                  doc.setFontSize(10);
                  doc.text('1. Neighborhood Watch: Establish 24/7 perimeter safety rotations.', 25, 200);
                  doc.text('2. Resource Mapping: Inventory local medical, mechanical, and agricultural skills.', 25, 207);
                  doc.text('3. Meeting Point: Designate a primary and secondary physical rally point.', 25, 214);

                  // Disclaimer
                  doc.setFontSize(7);
                  doc.setTextColor(200, 0, 0);
                  doc.text('DISCLAIMER: This manual is for informational purposes only. Use at your own risk. The authors assume no liability.', 105, 275, { align: 'center' });
                  
                  // Footer
                  doc.setFontSize(8);
                  doc.setTextColor(150, 150, 150);
                  doc.text('Sovereign-Resilience Intelligence Network - "Stay Sovereign, Stay Resilient"', 105, 285, { align: 'center' });
                  
                  doc.save('Sovereign-Resilience-Manual.pdf');
                } catch (err) {
                  console.error('PDF Generation Error:', err);
                  alert('Failed to generate PDF. Please try again.');
                }
              }}
              className="px-10 py-5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-900/40 hover:scale-[1.02] active:scale-95 flex items-center gap-3"
            >
              <FileDown className="w-5 h-5" />
              Download Resilience Manual (.pdf)
            </button>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

export default function App() {
  const [dashboardMode, setDashboardMode] = useState<'THREAT' | 'RESILIENCE'>('THREAT');
  const [status, setStatus] = useState<GlobalStatus | null>(() => {
    const saved = localStorage.getItem('sovereign_resilience_status');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [activeLocation, setActiveLocation] = useState('Global');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPanicMode, setIsPanicMode] = useState(false);

  // Persist status to localStorage
  useEffect(() => {
    if (status) {
      localStorage.setItem('sovereign_resilience_status', JSON.stringify(status));
    }
  }, [status]);

  const togglePanicMode = useCallback(() => {
    setIsPanicMode(prev => !prev);
  }, []);
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0);
  const [isInitialScan, setIsInitialScan] = useState(false); // New state for initial scan

  const startInitialScan = useCallback(() => {
    setIsInitialScan(true);
  }, []);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLiveRecon, setIsLiveRecon] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDefconInfoOpen, setIsDefconInfoOpen] = useState(false);
  const [isDefconOneOpen, setIsDefconOneOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Trigger DEFCON 1 Overlay
  useEffect(() => {
    if (status?.defcon_level === 1) {
      if (!isDefconOneOpen) setIsDefconOneOpen(true);
    } else {
      setIsDefconOneOpen(false);
    }
  }, [status?.defcon_level]);

  // Combine presidential interruption and critical emergencies for high-priority alerts
  const highPriorityAlerts = useMemo(() => {
    const alerts: (PresidentialInterruption | Emergency)[] = [];
    if (status?.presidential_interruption) {
      alerts.push(status.presidential_interruption);
    }
    if (status?.emergencies) {
      const criticalEmergencies = status.emergencies.filter(e => e.severity === 'CRITICAL');
      alerts.push(...criticalEmergencies);
    }
    return alerts;
  }, [status]);

  // Reset currentSummaryIndex if highPriorityAlerts changes
  useEffect(() => {
    setCurrentSummaryIndex(0);
  }, [highPriorityAlerts]);
  const [customSoundUrl, setCustomSoundUrl] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [alertHistory, setAlertHistory] = useState<HistoryItem[]>([]);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mapRef = useRef<WorldMapHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevStatusRef = useRef<GlobalStatus | null>(null);

  // Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Scroll effect for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const playAlertSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
    }
  }, []);

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomSoundUrl(url);
    }
  };

  // Link Health Validation Hook
  const useLinkHealth = (url: string | undefined) => {
    const [health, setHealth] = useState<{ valid: boolean; official: boolean; loading: boolean }>({
      valid: false,
      official: false,
      loading: !!url
    });

    useEffect(() => {
      if (!url) return;
      
      const validate = async () => {
        try {
          const res = await fetch(`/api/validate-url?url=${encodeURIComponent(url)}`);
          const data = await res.json();
          setHealth({ valid: data.valid, official: data.official, loading: false });
        } catch (e) {
          setHealth({ valid: false, official: false, loading: false });
        }
      };

      validate();
    }, [url]);

    return health;
  };

  const LinkStatus = ({ url }: { url: string | undefined }) => {
    const { valid, official, loading } = useLinkHealth(url);
    
    if (!url || loading) return null;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        {valid ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-tighter">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-2.5 h-2.5 text-red-500" />
            <span className="text-[7px] font-bold text-red-500 uppercase tracking-tighter">Unstable</span>
          </div>
        )}
        {official && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
            <span className="text-[7px] font-bold text-blue-500 uppercase tracking-tighter">Official</span>
          </div>
        )}
      </div>
    );
  };

  // WebSocket Integration
  useEffect(() => {
    // Backup fetch for initial data
    fetch('/api/humanitarian')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStatus(prev => ({
            ...prev,
            defcon_level: prev?.defcon_level || 5,
            emergencies: prev?.emergencies || [],
            humanitarian_efforts: data,
            stability_assessment: prev?.stability_assessment || 'STABLE',
            last_updated: new Date().toISOString(),
            source: 'Sovereign-Resilience Network'
          } as GlobalStatus));
        }
      })
      .catch(err => console.error('Backup fetch error:', err));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED') {
          console.log('DEBUG: WebSocket CONNECTED, initialAnomalies:', data.initialAnomalies);
          if (data.initialAnomalies) setAnomalies(data.initialAnomalies);
          setStatus(prev => ({
            defcon_level: prev?.defcon_level || 5,
            emergencies: data.initialAnomalies || [],
            humanitarian_efforts: data.initialEfforts || [],
            stability_assessment: prev?.stability_assessment || 'STABLE',
            last_updated: new Date().toISOString(),
            source: 'Sovereign-Resilience Network'
          }));
        } else if (data.type === 'HEARTBEAT') {
          console.log('Real-time pulse received:', data.timestamp);
        } else if (data.type === 'ANOMALY_DETECTED') {
          setAnomalies(prev => [data.anomaly, ...prev].slice(0, 50));
          if (data.anomaly.severity === 'CRITICAL' || data.anomaly.severity === 'HIGH') {
            playAlertSound();
          }
        } else if (data.type === 'EFFORT_DETECTED') {
          setStatus(prev => {
            if (!prev) return null;
            const existingIndex = prev.humanitarian_efforts.findIndex(e => e.id === data.effort.id);
            let newEfforts;
            if (existingIndex !== -1) {
              newEfforts = [...prev.humanitarian_efforts];
              newEfforts[existingIndex] = data.effort;
            } else {
              newEfforts = [data.effort, ...prev.humanitarian_efforts].slice(0, 50);
            }
            return {
              ...prev,
              humanitarian_efforts: newEfforts,
              last_updated: new Date().toISOString()
            };
          });
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    };

    return () => ws.close();
  }, []);



  // Keep ref in sync with status to avoid stale state in fetchStatus
  useEffect(() => {
    if (status) {
      prevStatusRef.current = status;
    }
  }, [status]);

  const fetchStatus = useCallback(async (locationOverride?: string) => {
    if (isPanicMode) return; // Freeze in panic mode

    // Check for API key and prompt if not selected
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
      // Assume key selection was successful and proceed
    }

    const locationToSearch = locationOverride !== undefined ? locationOverride : searchLocation;
    setLoading(true);
    setError(null);
    try {
      // Create GoogleGenAI instance right before API call to ensure it uses the most up-to-date key
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const userLanguage = navigator.language || 'en-US';
      
      const systemInstruction = `You are an expert intelligence analyst whose job is to translate complex geopolitical and crisis data for the general public. 
      Your audience is not highly tech-savvy, has a short attention span, and needs to understand the immediate impact of an event within three seconds.
      Write at an 8th-grade reading level in the user's language: ${userLanguage}. No academic jargon, no long-winded explanations, and no walls of text. 
      
      Whenever you provide a summary or description of a global event, you MUST format it exactly like this:
      🚨 [3-5 WORD HEADLINE IN ALL CAPS]
      * The Threat: [1 short sentence explaining what is happening. Bold the most intense action words, statistics, or numbers.]
      * The Cause: [1 short sentence explaining why it's happening in plain English.]
      * Current Status: [1 short sentence on where things stand right now.]
      
      ⚠️ THE "SO WHAT?" IMPACT: [1 short sentence explaining exactly how this affects an everyday person's life (e.g., higher gas prices, grocery shortages, internet outages, or travel delays). Be direct and concise.]
      
      Rules:
      - Never use paragraphs.
      - Keep bullet points under 15 words each.
      - Do not use prefatory language. Just output the requested format directly.
      - ALWAYS use the googleSearch tool to find REAL, VALID, and DIRECT URLs for articles, live streams, and sources. Do not hallucinate URLs.
      - IMPORTANT: Do not construct URLs based on patterns (e.g., appending the current year '2026' to a news site URL). Only use URLs that are explicitly returned by the googleSearch tool and verified as active.
      - If you cannot find a specific article URL for an event, provide the main news landing page of a reputable source (e.g., reuters.com, apnews.com) instead of a broken deep link.
      - IMPORTANT: When asked for JSON output, ONLY output the raw JSON object. DO NOT include any thinking process, "thought" blocks, conversational text, or markdown formatting outside the JSON. Your response must be a valid JSON string that can be parsed by JSON.parse().
      - Rule: You must output your response ONLY as a valid JSON object. Do not include any markdown styling or extra text.`;

      // Fetch Status
      const locationContext = locationToSearch ? ` specifically for the area: "${locationToSearch}"` : " globally";
      const statusPrompt = `Search for current emergencies, major conflicts, natural disasters (including weather-related alerts like hurricanes, tornadoes, extreme temperatures), and the current estimated DEFCON level${locationContext} based on open-source intelligence and news reports as of ${new Date().toISOString()}. 
      Provide a structured report with at least 10-15 active emergencies if possible.
      DEFCON 1 is the most severe (imminent nuclear war), DEFCON 5 is normal peacetime.
      Focus on events that are currently unfolding or have significant impact${locationToSearch ? ` on ${locationToSearch}` : " globally"}.
      
      For each emergency:
      1. Provide approximate latitude and longitude coordinates.
      2. Categorize it into one of: WARFARE, EARTHQUAKE, FIRE, NATURAL_DISASTER, HEALTH, CYBER, ECONOMY, SPACE, TERRORISM, FINANCE, STOCK, AGRICULTURE, OTHER. 
      - Weather events should be NATURAL_DISASTER.
      - Hacking, data breaches, and infrastructure attacks should be CYBER.
      - Market crashes, hyperinflation, and trade wars should be ECONOMY.
      - Solar flares and satellite failures should be SPACE.
      - Insurgency and extremist attacks should be TERRORISM.
      - Banking crises, currency devaluations, and fiscal policy shocks should be FINANCE.
      - Major stock market crashes or volatility should be STOCK.
      - Crop failures, food shortages, and agricultural crises should be AGRICULTURE.
      
      STRICT REQUIREMENT: For EVERY emergency tab (CYBER, ECONOMY, SPACE, TERRORISM, FINANCE, STOCK, AGRICULTURE, etc.), you MUST find and provide REAL, OFFICIAL article URLs from reputable sources like Reuters, AP, BBC, or government agencies.
      
      3. For EARTHQUAKE events (especially HIGH or CRITICAL severity), include the magnitude or intensity (e.g., Richter scale).
      4. Provide an approximate timestamp of occurrence in ISO format.
      
      Also, check if there are any high-priority live interruptions or emergency broadcasts from the U.S. President or NATO [Breaking News] that are currently relevant or very recent. 
      STRICT REQUIREMENT: Only provide links from OFFICIAL and VERIFIED sources.
      Prioritize:
      - White House YouTube: https://www.youtube.com/@WhiteHouse/live
      - C-SPAN YouTube: https://www.youtube.com/@CSPAN/live
      - Reuters YouTube: https://www.youtube.com/@Reuters/live
      - NATO News: https://www.youtube.com/@NATO/live
      - AP News: https://apnews.com
      - Reuters: https://www.reuters.com
      Ensure the URL is a direct link to the live broadcast or a highly credible news landing page. 
      If no direct live stream is found but the event is real, provide a link to a major news coverage page from a reputable source (AP, Reuters, BBC, NATO official site).
      Include an 'article_url' if there is a specific news article or official statement page for the event.
      DO NOT provide broken, dead, or non-official links. If you are unsure of a link's validity, do not include it. If search fails to find a specific article, use the homepage of a major news outlet (e.g., https://www.reuters.com).`;

      // Fetch Strategic Briefings
      const briefingPrompt = `Provide 3 strategic briefings on major global trends or under-the-radar geopolitical shifts as of ${new Date().toISOString()}. 
      Focus on supply chain, food security, energy stability, and cyber-infrastructure. 
      Return a JSON array of objects with: id, title, summary, impact_level (HIGH, MEDIUM, LOW), source.`;

      // Fetch World Leaders Watchlist
      const leaderPrompt = `Provide a watchlist of 6 key world leaders (e.g., US, China, Russia, UK, France, Germany, or others currently in high-stakes situations) as of ${new Date().toISOString()}. 
      For each leader, provide:
      1. Name and Title.
      2. Country.
      3. Current Status (STABLE, ELEVATED, CRITICAL) based on their recent geopolitical actions or domestic stability.
      4. A list of 3-4 recent significant actions or statements.
      5. A list of allies and conflicts (names of other countries or leaders).
      6. Associated crisis nodes (objects with 'title' and 'url' to a REAL, OFFICIAL news article about their involvement). 
         STRICT REQUIREMENT: If a leader is associated with a "dossier" (e.g., Trump Dossier, Steele Dossier, or any other intelligence dossier), you MUST provide a link to an OFFICIAL and RELIABLE article from a major news outlet (Reuters, AP, BBC, etc.).
      7. A REAL, HIGH-QUALITY portrait URL. Prioritize official government sites (.gov), Wikipedia, or verified social media profile images (X, Facebook, etc.). Ensure the URL is direct to the image file.
      STRICT REQUIREMENT: All news links must be from official sources (Reuters, AP, BBC, Government sites).
      Return a JSON array of objects with: id, name, title, country, status, portrait_url, recent_actions, allies, conflicts, associated_crises.`;

      // Parallelize API calls for better efficiency
      const [statusResponse, briefingResponse, leaderResponse] = await Promise.all([
        ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: statusPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                defcon_level: {
                  type: Type.INTEGER,
                  description: "Estimated DEFCON level (1-5) based on current global tensions.",
                },
                emergencies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      severity: { 
                        type: Type.STRING, 
                        description: "One of: CRITICAL, HIGH, MEDIUM, LOW" 
                      },
                      category: {
                        type: Type.STRING,
                        description: "One of: WARFARE, EARTHQUAKE, FIRE, NATURAL_DISASTER, HEALTH, CYBER, ECONOMY, SPACE, TERRORISM, FINANCE, STOCK, AGRICULTURE, OTHER"
                      },
                      location: { type: Type.STRING },
                      coordinates: {
                        type: Type.OBJECT,
                        properties: {
                          lat: { type: Type.NUMBER },
                          lng: { type: Type.NUMBER }
                        },
                        required: ["lat", "lng"]
                      },
                      summary: { type: Type.STRING, description: "Follow the strict 🚨 format provided in system instructions." },
                      source_url: { type: Type.STRING, description: "REAL, VALID URL to the source article." },
                      magnitude: { type: Type.STRING, description: "Magnitude/intensity for earthquakes" },
                      timestamp: { type: Type.STRING, description: "ISO timestamp of occurrence" },
                    },
                    required: ["id", "title", "severity", "category", "location", "summary", "coordinates", "timestamp", "source_url"]
                  }
                },
                stability_assessment: {
                  type: Type.STRING,
                  description: "A brief general assessment of global stability."
                },
                presidential_interruption: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    message: { type: Type.STRING, description: "Follow the strict 🚨 format provided in system instructions." },
                    timestamp: { type: Type.STRING },
                    live_url: { type: Type.STRING, description: "REAL, VALID URL to a live stream of the broadcast if available" },
                    article_url: { type: Type.STRING, description: "REAL, VALID URL to an official article or statement page" }
                  },
                  required: ["title", "message", "timestamp"]
                }
              },
              required: ["defcon_level", "emergencies", "stability_assessment"]
            }
          }
        }),
        ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: briefingPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING, description: "Follow the strict 🚨 format provided in system instructions." },
                  impact_level: { type: Type.STRING },
                  source: { type: Type.STRING }
                },
                required: ["id", "title", "summary", "impact_level", "source"]
              }
            }
          }
        }),
        ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: leaderPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  country: { type: Type.STRING },
                  status: { type: Type.STRING, description: "STABLE, ELEVATED, CRITICAL" },
                  portrait_url: { type: Type.STRING, description: "REAL, VALID URL to a portrait image." },
                  recent_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  allies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  associated_crises: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING, description: "REAL, VALID URL to a news article." }
                      },
                      required: ["title", "url"]
                    } 
                  }
                },
                required: ["id", "name", "title", "country", "status", "portrait_url", "recent_actions", "allies", "conflicts", "associated_crises"]
              }
            }
          }
        })
      ]);

      const statusData = safeJsonParse(statusResponse.text, {});
      const newStatus: GlobalStatus = {
        defcon_level: statusData.defcon_level || 5,
        emergencies: Array.isArray(statusData.emergencies) ? statusData.emergencies : [],
        humanitarian_efforts: prevStatusRef.current?.humanitarian_efforts || [],
        stability_assessment: statusData.stability_assessment || "Stability assessment unavailable.",
        presidential_interruption: statusData.presidential_interruption,
        last_updated: new Date().toISOString()
      };

      const briefingData = safeJsonParse(briefingResponse.text, []);
      setBriefings(prev => {
        if (prev.length === 0) return briefingData;
        
        // Merge briefings, avoiding duplicates by ID
        const existingIds = new Set(prev.map(b => b.id));
        const mergedBriefings = [
          ...briefingData.filter(b => !existingIds.has(b.id)),
          ...prev
        ].slice(0, 50); // Keep last 50 strategic briefings
        
        return mergedBriefings;
      });

      const leaderData = safeJsonParse(leaderResponse.text, []);
      setLeaders(leaderData);
      
      // History tracking
      const newHistoryItems: HistoryItem[] = [];
      
      // Check DEFCON change
      if (prevStatusRef.current && prevStatusRef.current.defcon_level !== newStatus.defcon_level) {
        newHistoryItems.push({
          id: `defcon-${Date.now()}`,
          type: 'DEFCON_CHANGE',
          title: `DEFCON LEVEL ${newStatus.defcon_level} ACTIVATED`,
          description: `Global readiness state adjusted from ${prevStatusRef.current.defcon_level} to ${newStatus.defcon_level}.`,
          timestamp: new Date().toISOString(),
          level: newStatus.defcon_level
        });
        if (newStatus.defcon_level <= 2) playAlertSound();
      }

      // Check new critical emergencies
      const newEmergencies = newStatus.emergencies.filter(e => !seenIds.has(e.id));
      
      newEmergencies.forEach(e => {
        if (e.severity === 'CRITICAL' || e.severity === 'HIGH') {
          newHistoryItems.push({
            id: `alert-${e.id}`,
            type: 'EMERGENCY_ALERT',
            title: e.title,
            description: e.summary,
            timestamp: e.timestamp,
            severity: e.severity
          });
          if (e.severity === 'CRITICAL') playAlertSound();
        }
      });

      if (newHistoryItems.length > 0) {
        setAlertHistory(prev => [...newHistoryItems, ...prev].slice(0, 100));
      }

      prevStatusRef.current = newStatus;
      setStatus(prev => {
        if (!prev) return newStatus;
        
        // Check if day changed (using local time)
        const prevDate = new Date(prev.last_updated).toDateString();
        const newDate = new Date(newStatus.last_updated).toDateString();
        
        if (prevDate !== newDate) {
          return newStatus; // Clear and start new day
        }
        
        // Merge emergencies, avoiding duplicates by ID
        const existingIds = new Set(prev.emergencies.map(e => e.id));
        const mergedEmergencies = [
          ...newStatus.emergencies.filter(e => !existingIds.has(e.id)),
          ...prev.emergencies
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         .slice(0, 300); // Keep last 300 for a comprehensive daily archive
        
        return {
          ...newStatus,
          emergencies: mergedEmergencies,
          humanitarian_efforts: prev.humanitarian_efforts // Preserve efforts from WebSocket
        };
      });
      setActiveLocation(locationToSearch || 'Global');
      setIsBannerDismissed(false); // Reset dismissal on new scan results

      // Track seen IDs for "NEW" badge
      if (seenIds.size === 0) {
        setSeenIds(new Set(newStatus.emergencies.map(e => e.id)));
      } else {
        // Only highlight new ones for a while
        const currentIds = new Set(newStatus.emergencies.map(e => e.id));
        const newIds = new Set([...currentIds].filter(id => !seenIds.has(id)));
        if (newIds.size > 0) {
          setTimeout(() => {
            setSeenIds(prev => new Set([...prev, ...newIds]));
          }, 10000); // Highlight for 10 seconds
        }
      }

      // Trigger notification if DEFCON is 1 or 2, or if there's an emergency meeting threshold
      const thresholdMet = newStatus.emergencies.some(e => {
        const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        return levels.indexOf(e.severity) <= levels.indexOf('HIGH');
      });

      if (notificationsEnabled) {
        if (newStatus.defcon_level <= 2) {
          new Notification("CRITICAL ALERT: DEFCON LEVEL " + newStatus.defcon_level, {
            body: "Global stability is severely compromised. Check the dashboard for details.",
            icon: "/favicon.ico"
          });
        } else if (thresholdMet) {
          const urgent = newStatus.emergencies.find(e => {
            const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
            return levels.indexOf(e.severity) <= levels.indexOf('HIGH');
          });
          if (urgent) {
            new Notification(`EMERGENCY ALERT [${urgent.severity}]: ${urgent.title}`, {
              body: urgent.summary,
              icon: "/favicon.ico"
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
      setError("Failed to retrieve global status. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [notificationsEnabled, searchLocation, isPanicMode, seenIds]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const triggerPanic = () => {
    setIsPanicMode(true);
    setStatus(prev => prev ? { ...prev, defcon_level: 1 } : null);
    setIsBannerDismissed(false);
    new Notification("PANIC ALERT: DEFCON 1 ACTIVATED", {
      body: "Emergency response protocols engaged. All systems at maximum readiness.",
      icon: "/favicon.ico"
    });
  };

  const toggleLiveRecon = async () => {
    if (!isLiveRecon) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLiveRecon(true);
      } catch (err) {
        alert("Camera/Microphone access denied. Live Recon requires media permissions.");
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsLiveRecon(false);
    }
  };

  // Auto-scan every 15 minutes if enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoScanning) {
      interval = setInterval(fetchStatus, 15 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [isAutoScanning, fetchStatus]);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      } else {
        alert("Notification permission denied.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus();
  };

  const clearSearch = () => {
    setSearchLocation('');
    fetchStatus('');
  };

  const severityOrder: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };

  const filteredEmergencies = status?.emergencies
    .filter(e => {
      return selectedCategory === 'ALL' || e.category === selectedCategory;
    })
    .sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }) || [];

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const categories = [
    { id: 'ALL', label: 'All Intelligence', icon: Globe },
    { id: 'WARFARE', label: 'Warfare', icon: ShieldAlert },
    { id: 'CYBER', label: 'Cyber Warfare', icon: Cpu },
    { id: 'ECONOMY', label: 'Economic Shocks', icon: TrendingUp },
    { id: 'FINANCE', label: 'Finance', icon: Briefcase },
    { id: 'STOCK', label: 'Stock Market', icon: Activity },
    { id: 'AGRICULTURE', label: 'Agriculture', icon: Sun },
    { id: 'SPACE', label: 'Space Weather', icon: Orbit },
    { id: 'TERRORISM', label: 'Terrorism', icon: Target },
    { id: 'EARTHQUAKE', label: 'Seismic', icon: Activity },
    { id: 'NATURAL_DISASTER', label: 'Disasters', icon: AlertTriangle },
    { id: 'HEALTH', label: 'Health', icon: Activity },
  ];

  const hasCriticalAlert = status && (status.defcon_level <= 2);
  const showBanner = hasCriticalAlert && !isBannerDismissed;

  // Initial data fetch
  useEffect(() => {
    if (!isInitialScan) return; // Only fetch data if initial scan is initiated
    fetchStatus();
  }, [fetchStatus, isInitialScan]);

  return (
    <div className={cn(
      "min-h-screen text-[#E4E4E7] font-sans selection:bg-red-500/30 transition-all duration-1000",
      dashboardMode === 'THREAT' ? "bg-[#0A0A0B]" : "bg-[#020804]",
      status?.defcon_level === 1 && dashboardMode === 'THREAT' && "defcon-1-glitch"
    )}>
      <DefconOneOverlay 
        isOpen={isDefconOneOpen} 
        onClose={() => setIsDefconOneOpen(false)}
        cause={status?.emergencies.find(e => e.severity === 'CRITICAL')}
      />
      <SettingsModal
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        theme={theme}
        setTheme={setTheme}
        handleSoundUpload={handleSoundUpload}
        customSoundUrl={customSoundUrl}
        setCustomSoundUrl={setCustomSoundUrl}
        playAlertSound={playAlertSound}
      />

      <HistoryModal
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        alertHistory={alertHistory}
      />

      <AboutModal
        isAboutOpen={isAboutOpen}
        setIsAboutOpen={setIsAboutOpen}
        DEFCON_DESCRIPTIONS={DEFCON_DESCRIPTIONS}
      />

      <CriticalAlertBanner
        showBanner={showBanner}
        status={status}
        setIsBannerDismissed={setIsBannerDismissed}
      />

      {/* Leader Dossier Side Panel */}
      <AnimatePresence>
        {selectedLeader && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeader(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0a0c] border-l border-white/10 z-[70] shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-white/40" />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Intelligence Dossier</span>
                  </div>
                  <button 
                    onClick={() => setSelectedLeader(null)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-start gap-6 mb-8">
                  <div className={cn(
                    "w-32 h-32 rounded-2xl p-1 shrink-0",
                    selectedLeader.status === 'CRITICAL' ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]" :
                    selectedLeader.status === 'ELEVATED' ? "bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]" :
                    "bg-blue-500/50"
                  )}>
                    <div className="w-full h-full rounded-xl overflow-hidden bg-black border border-white/20">
                      <img 
                        src={`https://flagcdn.com/w160/${getCountryCode(selectedLeader.country)}.png`} 
                        alt={selectedLeader.country}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">{selectedLeader.name}</h2>
                    <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">{selectedLeader.title}</p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                      <Globe className="w-3 h-3 text-white/40" />
                      <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{selectedLeader.country}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Status Indicator */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Threat Level Status</span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                        selectedLeader.status === 'CRITICAL' ? "text-red-500 bg-red-500/10" :
                        selectedLeader.status === 'ELEVATED' ? "text-orange-500 bg-orange-500/10" :
                        "text-emerald-500 bg-emerald-500/10"
                      )}>
                        {selectedLeader.status}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: selectedLeader.status === 'CRITICAL' ? '100%' : selectedLeader.status === 'ELEVATED' ? '65%' : '30%' }}
                        className={cn(
                          "h-full rounded-full",
                          selectedLeader.status === 'CRITICAL' ? "bg-red-500" :
                          selectedLeader.status === 'ELEVATED' ? "bg-orange-500" :
                          "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Recent Actions */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-red-500" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Actions Ticker</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedLeader.recent_actions.map((action, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <p className="text-xs text-white/70 leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diplomatic Stance Matrix */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Allies</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedLeader.allies.map((ally, i) => (
                          <span key={i} className="text-[10px] text-white/60 font-mono">{ally}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-3 h-3 text-red-500" />
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Conflicts</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedLeader.conflicts.map((conflict, i) => (
                          <span key={i} className="text-[10px] text-white/60 font-mono">{conflict}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Associated Crisis Nodes */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-4 h-4 text-orange-500" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Crisis Involvement</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedLeader.associated_crises.map((crisis, i) => safeUrl(crisis.url) && (
                        <div key={i} className="space-y-1">
                          <a 
                            href={safeUrl(crisis.url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-all"
                          >
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-tight">{crisis.title}</span>
                            <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white transition-colors" />
                          </a>
                          <LinkStatus url={crisis.url} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Header
        showHeader={showHeader}
        defconLevel={status?.defcon_level || 5}
        theme={theme}
        setTheme={setTheme}
        isPanicMode={isPanicMode}
        togglePanicMode={togglePanicMode}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        setIsAboutOpen={setIsAboutOpen}
        isInitialScan={isInitialScan}
        startInitialScan={startInitialScan}
        isLoading={loading}
        setIsDefconInfoOpen={setIsDefconInfoOpen}
        setSearchLocation={setSearchLocation}
        setActiveLocation={setActiveLocation}
        fetchStatus={fetchStatus}
        searchLocation={searchLocation}
        clearSearch={clearSearch}
        handleSearch={handleSearch}
        toggleNotifications={toggleNotifications}
        notificationsEnabled={notificationsEnabled}
        isAutoScanning={isAutoScanning}
        setIsAutoScanning={setIsAutoScanning}
      />

      <DashboardToggle mode={dashboardMode} setMode={setDashboardMode} showHeader={showHeader} />

      <AnimatePresence mode="wait">
        {dashboardMode === 'THREAT' ? (
          <motion.div
            key="threat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Leader Watchlist Carousel */}
            <div className="bg-black/20 border-b border-white/5 py-4 overflow-x-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
          <div className="shrink-0 flex flex-col">
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1">Intelligence</span>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Leader Watchlist</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10 shrink-0" />
          <div className="flex items-center gap-8 pr-4">
            {leaders.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 opacity-20 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20" />
                  <div className="space-y-1">
                    <div className="w-16 h-2 bg-white/20 rounded" />
                    <div className="w-12 h-1.5 bg-white/10 rounded" />
                  </div>
                </div>
              ))
            ) : (
              leaders.map((leader) => (
                <button
                  key={leader.id}
                  onClick={() => setSelectedLeader(leader)}
                  className="flex items-center gap-3 group transition-all"
                >
                  <div className={cn(
                    "relative w-12 h-12 rounded-full p-0.5 transition-all duration-500 group-hover:scale-110 flex items-center justify-center",
                    leader.status === 'CRITICAL' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" :
                    leader.status === 'ELEVATED' ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" :
                    "bg-blue-500/50"
                  )}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center">
                      <img 
                        src={`https://flagcdn.com/w80/${getCountryCode(leader.country)}.png`} 
                        alt={leader.country}
                        className="w-full h-full object-cover transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white/90 group-hover:text-white transition-colors leading-none mb-1">{leader.name}</p>
                    <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{leader.country}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">SYSTEM ERROR</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* DEFCON Card - Top Left on Desktop, First on Mobile */}
          <div className="lg:col-span-4 order-1 lg:order-none">
            {/* Modern DEFCON Card */}
            <section className="relative group">
              <div className={cn(
                "absolute -inset-1 rounded-[2.5rem] blur-2xl transition-all duration-1000 opacity-20",
                status ? DEFCON_GLOW[status.defcon_level] : "bg-white/5"
              )} />
              
              <div className="relative bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-white/40" />
                    <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">System Readiness</h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-500/80 uppercase">Live</span>
                  </div>
                </div>

                <div className="px-8 pb-10 flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-150" />
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-125" />
                    
                    {/* Main Circle */}
                    <motion.div 
                      initial={false}
                      onClick={() => setIsDefconInfoOpen(true)}
                      animate={{ 
                        scale: status 
                          ? (status.defcon_level <= 2 ? [1, 1.08, 1] 
                            : (status.defcon_level <= 4 ? [1, 1.03, 1] : 1)) 
                          : 0.9,
                        boxShadow: status && status.defcon_level <= 2 
                          ? ["0 0 20px rgba(220,38,38,0.4)", "0 0 60px rgba(220,38,38,0.8)", "0 0 20px rgba(220,38,38,0.4)"]
                          : "none"
                      }}
                      transition={{
                        scale: {
                          duration: status && status.defcon_level <= 2 ? 1.2 : 3,
                          repeat: status && status.defcon_level <= 4 ? Infinity : 0,
                          ease: "easeInOut"
                        },
                        boxShadow: {
                          duration: 1.2,
                          repeat: status && status.defcon_level <= 2 ? Infinity : 0,
                          ease: "easeInOut"
                        }
                      }}
                      className={cn(
                        "w-40 h-40 rounded-full flex flex-col items-center justify-center bg-gradient-to-br transition-all duration-700 relative z-10 cursor-pointer hover:brightness-110 active:scale-95",
                        status ? DEFCON_COLORS[status.defcon_level] : "from-white/5 to-white/10"
                      )}
                    >
                      <span className="text-[10px] font-mono font-bold tracking-[0.3em] opacity-60 mb-1">DEFCON</span>
                      <span className="text-7xl font-black tracking-tighter tabular-nums">
                        {status?.defcon_level || '-'}
                      </span>
                      <div className="absolute bottom-4 flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Info className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Details</span>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1 text-left">Current Status</p>
                      <p className="text-xs font-bold text-white text-left leading-relaxed">
                        {status ? DEFCON_DESCRIPTIONS[status.defcon_level] : 'System initializing...'}
                      </p>
                    </div>
                    
                    <a 
                      href="https://www.defconlevel.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest transition-colors">Official Status Provider</span>
                      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-6 border-t border-white/5">
                  <div className="flex justify-between text-[9px] font-mono text-white/30 mb-4 tracking-widest">
                    <span>STRATEGIC SCALE</span>
                    <span>LEVEL {status?.defcon_level || 'X'}</span>
                  </div>
                  <div className="flex gap-2 h-1.5">
                    {[5, 4, 3, 2, 1].map((level) => (
                      <div 
                        key={level}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-500",
                          status?.defcon_level === level ? "opacity-100" : "opacity-10",
                          level === 1 ? "bg-red-600" : 
                          level === 2 ? "bg-orange-500" : 
                          level === 3 ? "bg-yellow-400" : 
                          level === 4 ? "bg-green-500" : "bg-blue-500"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Presidential Interruption - Top Right on Desktop, Second on Mobile */}
          <div className="lg:col-span-8 lg:row-start-1 order-2 lg:order-none">
            <AnimatePresence>
              {highPriorityAlerts.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-600 border-4 border-white rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(220,38,38,0.4)] relative overflow-hidden h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-white/30 animate-pulse" />
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xl">
                      <Shield className="w-12 h-12 text-red-600" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-white font-black text-3xl tracking-tighter uppercase leading-none mb-1">
                            CRITICAL STRATEGIC ALERTS
                          </h2>
                          <p className="text-white/90 font-mono text-[10px] uppercase tracking-widest">Live Strategic Broadcast • {highPriorityAlerts[currentSummaryIndex]?.timestamp}</p>
                        </div>
                        {highPriorityAlerts.length > 1 && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setCurrentSummaryIndex(prev => (prev - 1 + highPriorityAlerts.length) % highPriorityAlerts.length)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                            <span className="text-[10px] font-mono font-bold">{currentSummaryIndex + 1} / {highPriorityAlerts.length}</span>
                            <button 
                              onClick={() => setCurrentSummaryIndex(prev => (prev + 1) % highPriorityAlerts.length)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 bg-black/20 rounded-2xl p-5 border border-white/20 backdrop-blur-sm">
                    <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">
                      {highPriorityAlerts[currentSummaryIndex]?.title}
                    </h3>
                    <div className="text-white/95 leading-normal font-medium italic text-base mb-3 whitespace-pre-wrap markdown-body">
                      <Markdown>
                        {'message' in highPriorityAlerts[currentSummaryIndex] ? highPriorityAlerts[currentSummaryIndex].message : highPriorityAlerts[currentSummaryIndex].summary}
                      </Markdown>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      {('source_url' in highPriorityAlerts[currentSummaryIndex] && safeUrl(highPriorityAlerts[currentSummaryIndex].source_url)) && (
                        <div className="flex flex-col gap-1">
                          <a 
                            href={safeUrl(highPriorityAlerts[currentSummaryIndex].source_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/90 transition-all shadow-lg"
                          >
                            <Search className="w-4 h-4" />
                            View Full Intelligence
                          </a>
                          <LinkStatus url={highPriorityAlerts[currentSummaryIndex].source_url} />
                        </div>
                      )}
                      <a 
                        href={`https://www.youtube.com/results?search_query=live+news+${encodeURIComponent(highPriorityAlerts[currentSummaryIndex]?.title || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black/40 text-white border border-white/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black/60 transition-all"
                      >
                        <Search className="w-4 h-4" />
                        Search Live Coverage
                      </a>
                      <a 
                        href="https://www.whitehouse.gov/briefing-room/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-800 text-white border border-white/20 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-900 transition-all"
                      >
                        <Shield className="w-4 h-4" />
                        White House Briefing
                      </a>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Left Column: Strategic Status Continued */}
          <div className="lg:col-span-4 space-y-6 order-3 lg:order-none">
            {/* Strategic Briefings */}
            <section className="bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Strategic Briefings</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-blue-500/80 uppercase">Analysis Active</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {briefings.length === 0 ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="w-6 h-6 text-white/10 mx-auto mb-2 animate-spin" />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Generating intelligence report...</p>
                  </div>
                ) : (
                  briefings.map((briefing) => (
                    <div key={briefing.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn(
                          "text-[8px] font-mono font-bold px-2 py-0.5 rounded border",
                          briefing.impact_level === 'HIGH' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          briefing.impact_level === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          IMPACT: {briefing.impact_level}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[8px] font-mono text-white/60 uppercase">
                            {briefing.source}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1.5">{briefing.title}</h4>
                      <div className="text-[11px] text-white/50 leading-normal whitespace-pre-wrap markdown-body">
                        <Markdown>{briefing.summary}</Markdown>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Stability Assessment */}
            <section className="bg-[#121214] border border-white/10 rounded-[2rem] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Stability Index</h2>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                {status ? (
                  <div className="text-white/70 leading-relaxed font-medium text-xs">
                    <Markdown>
                      {status.stability_assessment}
                    </Markdown>
                  </div>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-2 bg-white/5 rounded-full w-full"></div>
                    <div className="h-2 bg-white/5 rounded-full w-5/6"></div>
                    <div className="h-2 bg-white/5 rounded-full w-4/6"></div>
                  </div>
                )}
              </div>
            </section>

            {/* Under-the-Radar Anomalies */}
            <section className="bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Raw Data Pipelines</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-yellow-500/80 uppercase">Scanning</span>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {anomalies.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="w-6 h-6 text-white/10 mx-auto mb-2" />
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">No anomalies detected</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {anomalies.map((anomaly) => (
                      <div key={anomaly.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn(
                            "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border",
                            anomaly.severity === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            anomaly.severity === 'HIGH' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {anomaly.source}
                          </span>
                          <span className="text-[8px] font-mono text-white/60 uppercase">
                            {format(new Date(anomaly.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white/90 mb-1 group-hover:text-white transition-colors">
                          {anomaly.title}
                        </h4>
                        
                        {anomaly.metadata && (
                          <div className="mb-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const target = e.currentTarget.nextElementSibling as HTMLElement;
                                if (target) target.classList.toggle('hidden');
                              }}
                              className="text-[8px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                            >
                              View Market Data <ChevronRight className="w-2 h-2" />
                            </button>
                            <div className="hidden mt-2 p-2 bg-black/40 rounded border border-white/5 space-y-1">
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-white/40">PRICE:</span>
                                <span className="text-white">${anomaly.metadata.price}</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-white/40">CHANGE:</span>
                                <span className={cn(
                                  anomaly.metadata.change && anomaly.metadata.change > 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                  {anomaly.metadata.change}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                          {anomaly.description}
                        </p>
                        {safeUrl(anomaly.link) && (
                          <div className="flex flex-col gap-1 mt-2">
                            <a 
                              href={safeUrl(anomaly.link)!} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                            >
                              Source Data <ExternalLink className="w-2 h-2" />
                            </a>
                            <LinkStatus url={anomaly.link} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Metadata */}
            <div className="bg-[#121214]/50 border border-white/5 rounded-2xl p-5 space-y-2 text-[9px] font-mono text-white/60 uppercase tracking-wider">
              <div className="flex justify-between">
                <span>Last Scan</span>
                <span>{status ? format(new Date(status.last_updated), 'HH:mm:ss OOO') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>System Status</span>
                <span className="text-emerald-500">Operational</span>
              </div>
              <div className="flex justify-between">
                <span>Data Source</span>
                <span>Gemini OSINT</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tactical Intelligence Continued */}
          <div className="lg:col-span-8 space-y-8 order-4 lg:order-none">
            {/* Map Overview - Expanded */}
            <section className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <h2 className="text-xs font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Global Risk Mapping</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Real-time coordinate visualization</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSearchLocation('');
                      fetchStatus('');
                      mapRef.current?.resetZoom();
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest"
                  >
                    Reset View
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Live Data</span>
                  </div>
                </div>
              </div>
              <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                <WorldMap 
                  ref={mapRef}
                  emergencies={filteredEmergencies} 
                  onSearch={(loc) => {
                    setSearchLocation(loc);
                    fetchStatus(loc);
                  }}
                />
              </div>
            </section>

            {/* Topic Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                    selectedCategory === cat.id 
                      ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]" 
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
                  )}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  Active Emergency Feed
                  {activeLocation !== 'Global' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-mono rounded-full border border-red-500/20">
                      <MapPin className="w-3 h-3" />
                      {activeLocation.toUpperCase()}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  {filteredEmergencies.length} Active Intelligence Nodes
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {loading && !status ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  </div>
                ))
              ) : filteredEmergencies.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                  <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">No {selectedCategory !== 'ALL' ? selectedCategory.toLowerCase().replace('_', ' ') : ''} events detected in current scan.</p>
                </div>
              ) : (
                filteredEmergencies.map((emergency) => (
                  <article 
                    key={emergency.id} 
                    className={cn(
                      "group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all duration-300 relative overflow-hidden",
                      !seenIds.has(emergency.id) && "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] ring-1 ring-emerald-500/20"
                    )}
                  >
                    {/* Severity Indicator Bar */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      emergency.severity === 'CRITICAL' ? "bg-red-600" :
                      emergency.severity === 'HIGH' ? "bg-orange-500" :
                      emergency.severity === 'MEDIUM' ? "bg-yellow-500" : "bg-blue-500"
                    )} />

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={cn(
                              "text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1.5",
                              emergency.severity === 'CRITICAL' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              emergency.severity === 'HIGH' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                              emergency.severity === 'MEDIUM' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {emergency.severity === 'CRITICAL' && <Skull className="w-3 h-3" />}
                              {emergency.severity === 'HIGH' && <Flame className="w-3 h-3" />}
                              {emergency.severity === 'MEDIUM' && <AlertTriangle className="w-3 h-3" />}
                              {emergency.severity === 'LOW' && <Info className="w-3 h-3" />}
                              {emergency.severity}
                            </span>
                            {!seenIds.has(emergency.id) && (
                              <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse tracking-tighter">NEW</span>
                            )}
                            <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest flex items-center gap-1">
                              {emergency.category === 'WARFARE' && <ShieldAlert className="w-3 h-3" />}
                              {emergency.category === 'CYBER' && <Cpu className="w-3 h-3" />}
                              {emergency.category === 'ECONOMY' && <TrendingUp className="w-3 h-3" />}
                              {emergency.category === 'SPACE' && <Orbit className="w-3 h-3" />}
                              {emergency.category === 'TERRORISM' && <Target className="w-3 h-3" />}
                              {emergency.category === 'EARTHQUAKE' && <Activity className="w-3 h-3" />}
                              {emergency.category === 'NATURAL_DISASTER' && <AlertTriangle className="w-3 h-3" />}
                              {emergency.category === 'HEALTH' && <Activity className="w-3 h-3" />}
                              {emergency.category === 'FIRE' && <Zap className="w-3 h-3" />}
                              {emergency.location}
                            </span>
                            <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
                              {format(new Date(emergency.timestamp), 'MMM d, yyyy HH:mm')}
                            </span>
                            {!seenIds.has(emergency.id) && (
                              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase tracking-tighter animate-bounce">
                                New
                              </span>
                            )}
                            {emergency.category === 'EARTHQUAKE' && emergency.magnitude && (
                              <span className="text-[10px] font-mono text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                MAG: {emergency.magnitude}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold group-hover:text-white transition-colors">{emergency.title}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              if (emergency.coordinates) {
                                mapRef.current?.zoomTo(emergency.coordinates.lat, emergency.coordinates.lng);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                          >
                            <MapPin className="w-3 h-3" />
                            View on Map
                          </button>
                          <button 
                            onClick={() => toggleExpand(emergency.id)}
                            className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                          >
                            {expandedIds.has(emergency.id) ? 'Hide Details' : 'Details'}
                            <ChevronRight className={cn("w-3 h-3 transition-transform", expandedIds.has(emergency.id) && "rotate-90")} />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedIds.has(emergency.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 border-t border-white/5 space-y-4">
                              <p className="text-sm text-white/80 leading-relaxed">
                                {emergency.summary}
                              </p>
                              {safeUrl(emergency.source_url) && (
                                <div className="space-y-2">
                                  <a 
                                    href={safeUrl(emergency.source_url)!} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                                  >
                                    Official Source
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <LinkStatus url={emergency.source_url} />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  ) : (
    <ResilienceDashboard key="resilience" status={status} />
  )}
</AnimatePresence>

      {/* DEFCON Info Modal */}
      <AnimatePresence>
        {isDefconInfoOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDefconInfoOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#121214] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-white/40" />
                    <h2 className="text-xs font-mono font-bold text-white/40 uppercase tracking-[0.2em]">DEFCON Readiness Scale</h2>
                  </div>
                  <button 
                    onClick={() => setIsDefconInfoOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level}
                      className={cn(
                        "p-4 rounded-2xl border transition-all bg-gradient-to-br",
                        DEFCON_COLORS[level],
                        status?.defcon_level === level 
                          ? "ring-2 ring-white/50 scale-[1.02]"
                          : "opacity-40 grayscale-[0.5]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black tabular-nums">LEVEL {level}</span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">
                            {DEFCON_DESCRIPTIONS[level].split(' - ')[0]}
                          </span>
                        </div>
                        {status?.defcon_level === level && (
                          <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[8px] font-bold uppercase tracking-widest">
                            Current Status
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {DEFCON_DEFINITIONS[level]}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Source: defconlevel.com</p>
                  <a 
                    href="https://www.defconlevel.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                  >
                    Official Documentation <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 py-12 bg-black/40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-widest">Sovereign-Resilience Intelligence Network</span>
          </div>
          
          <div className="flex gap-8 text-[10px] font-mono text-white/70 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", wsStatus === 'connected' ? "bg-emerald-500" : "bg-red-500")} />
              REAL-TIME LINK: {wsStatus.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              AI ANALYSIS ACTIVE
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SEARCH GROUNDING ENABLED
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[10px] font-mono text-white/60 max-w-xs text-center md:text-right">
              Sovereign-Resilience is a free, hobbyist project created strictly for educational and informational purposes. We aggregate publicly available news and data to provide a high-level overview of global events.
            </p>
            <div className="text-[8px] font-mono text-white/50 tracking-[0.4em] font-bold uppercase mt-2">
              CREATOR INFO [ LIBRA420T & ARIESSECRET3 ]
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-white/5">
          <p className="text-[9px] font-mono text-white/40 leading-relaxed text-center uppercase tracking-widest">
            DISCLAIMER: This website is provided "As-Is" and makes no guarantees regarding the accuracy, completeness, or real-time reliability of the information displayed. 
            Educational use only, we do not collect data.
          </p>
          <p className="text-[10px] font-mono text-red-400 font-bold leading-relaxed text-center uppercase tracking-widest mt-2 bg-red-500/10 py-3 px-6 rounded-xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            The data and threat assessments shown here should never be used for emergency planning, personal safety assessments, travel decisions, or financial planning. 
            By using this site, you agree that the creators are not liable for any actions taken or decisions made based on the information provided.
          </p>
        </div>
      </footer>
    </div>
  );
}
