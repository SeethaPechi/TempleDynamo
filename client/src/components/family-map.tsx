import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import { Search, Maximize2, RotateCcw, Users, Map, Target, UserCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FamilyNode {
  id: number;
  fullName: string;
  fullNameTa: string | null;
  gender: string | null;
  parentIds: number[];
  spouseIds: number[];
  generation: number;
}

interface FamilyEdge {
  sourceId: number;
  targetId: number;
  type: "parent-child" | "spouse";
}

interface FamilyGraph {
  nodes: FamilyNode[];
  edges: FamilyEdge[];
}

interface LayoutNode extends FamilyNode {
  x: number;
  y: number;
}

export interface FamilyMapProps {
  onMemberClick?: (id: number) => void;
  selectedMemberId?: number | null;
}

// ── Shared colour helpers ─────────────────────────────────────────────────────
const PALETTE = {
  Male:    { bg: "#EBF3FB", bar: "#4372A8", stroke: "#4372A8", text: "#0f2d4f" },
  Female:  { bg: "#FDF0F5", bar: "#C1567D", stroke: "#C1567D", text: "#4f0f2a" },
  Unknown: { bg: "#F5F3FA", bar: "#8B7AB2", stroke: "#8B7AB2", text: "#2a1a4a" },
} as const;

function genderPalette(g: string | null) {
  if (g === "Male")   return PALETTE.Male;
  if (g === "Female") return PALETTE.Female;
  return PALETTE.Unknown;
}

// Display label — first given name
function shortLabel(n: FamilyNode, lang: string): string {
  if (lang.startsWith("ta") && n.fullNameTa) return n.fullNameTa.slice(0, 13);
  const first = n.fullName.trim().replace(/\.$/, "").split(/\s+/)[0];
  return first.length > 14 ? first.slice(0, 13) + "…" : first;
}

// ── Full-map layout (D3) ──────────────────────────────────────────────────────
const SLOT    = 145;
const ROW_H   = 200;
const NODE_R  = 25;

function computeLayout(nodes: FamilyNode[]): Map<number, { x: number; y: number }> {
  const nodeMap   = new Map(nodes.map((n) => [n.id, n]));
  const positions = new Map<number, { x: number; y: number }>();
  const maxGen    = nodes.reduce((m, n) => Math.max(m, n.generation), 0);
  const byGen: FamilyNode[][] = Array.from({ length: maxGen + 1 }, () => []);
  nodes.forEach((n) => byGen[n.generation].push(n));

  for (let g = 0; g <= maxGen; g++) {
    const members = byGen[g];
    if (!members.length) continue;

    const sorted =
      g === 0
        ? [...members].sort((a, b) => a.fullName.localeCompare(b.fullName))
        : [...members].sort((a, b) => {
            const avg = (n: FamilyNode) => {
              const pxs = n.parentIds
                .map((pid) => positions.get(pid)?.x)
                .filter((x): x is number => x !== undefined);
              return pxs.length ? pxs.reduce((s, x) => s + x, 0) / pxs.length : 99_999;
            };
            return avg(a) - avg(b);
          });

    const placed  = new Set<number>();
    const ordered: FamilyNode[] = [];
    sorted.forEach((m) => {
      if (placed.has(m.id)) return;
      placed.add(m.id);
      ordered.push(m);
      m.spouseIds.forEach((sid) => {
        if (!placed.has(sid) && nodeMap.has(sid)) {
          placed.add(sid);
          ordered.push(nodeMap.get(sid)!);
        }
      });
    });
    ordered.forEach((m, i) => {
      positions.set(m.id, { x: i * SLOT, y: g * ROW_H });
    });
  }
  return positions;
}

// ── Focus-view data builder ───────────────────────────────────────────────────
interface FocusLevel {
  nodes: FamilyNode[];
  label: string;
  labelTa: string;
}

function buildFocusLevels(focalId: number, graph: FamilyGraph): FocusLevel[] {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const focal   = nodeMap.get(focalId);
  if (!focal) return [];

  const childToParents  = new Map<number, number[]>();
  const parentToChildren = new Map<number, number[]>();
  graph.edges
    .filter((e) => e.type === "parent-child")
    .forEach((e) => {
      if (!childToParents.has(e.targetId)) childToParents.set(e.targetId, []);
      childToParents.get(e.targetId)!.push(e.sourceId);
      if (!parentToChildren.has(e.sourceId)) parentToChildren.set(e.sourceId, []);
      parentToChildren.get(e.sourceId)!.push(e.targetId);
    });

  const seen = new Set<number>();

  const withSpouses = (ids: number[]): number[] => {
    const result = [...ids];
    ids.forEach((id) => nodeMap.get(id)?.spouseIds.forEach((sid) => {
      if (!seen.has(sid) && nodeMap.has(sid)) result.push(sid);
    }));
    return [...new Set(result)].filter((id) => nodeMap.has(id));
  };

  // Level 0 – focal + their spouses
  const l0 = withSpouses([focalId]);
  l0.forEach((id) => seen.add(id));

  // Level −1 – parents + their spouses
  const parentIds = childToParents.get(focalId) ?? [];
  const l_1 = withSpouses(parentIds.filter((id) => !seen.has(id)));
  l_1.forEach((id) => seen.add(id));

  // Level −2 – grandparents + their spouses
  const gpIds = [...new Set(parentIds.flatMap((pid) => childToParents.get(pid) ?? []))];
  const l_2 = withSpouses(gpIds.filter((id) => !seen.has(id)));
  l_2.forEach((id) => seen.add(id));

  // Level +1 – children of focal group + their spouses
  const childIds = [...new Set(l0.flatMap((id) => parentToChildren.get(id) ?? []))];
  const l_plus1 = withSpouses(childIds.filter((id) => !seen.has(id)));
  l_plus1.forEach((id) => seen.add(id));

  // Level +2 – grandchildren
  const gcIds = [...new Set(childIds.flatMap((cid) => parentToChildren.get(cid) ?? []))];
  const l_plus2 = withSpouses(gcIds.filter((id) => !seen.has(id)));

  const toNodes = (ids: number[]) =>
    ids.map((id) => nodeMap.get(id)).filter(Boolean) as FamilyNode[];

  return [
    { nodes: toNodes(l_2),     label: "Grandparents",    labelTa: "தாத்தா-பாட்டி" },
    { nodes: toNodes(l_1),     label: "Parents",          labelTa: "பெற்றோர்" },
    { nodes: toNodes(l0),      label: "Focal",            labelTa: "மையம்" },
    { nodes: toNodes(l_plus1), label: "Children",         labelTa: "பிள்ளைகள்" },
    { nodes: toNodes(l_plus2), label: "Grandchildren",    labelTa: "பேரன்-பேத்தி" },
  ];
}

// ── Focus View SVG component ──────────────────────────────────────────────────
const F_CW = 116;   // card width
const F_CH = 52;    // card height
const F_RX = 9;     // card corner radius
const F_GAP = 14;   // gap between cards
const F_SLOT = F_CW + F_GAP;   // 130
const F_VW = 820;   // virtual SVG width
const F_VH = 500;   // virtual SVG height

interface FocusViewProps {
  graph: FamilyGraph;
  focalId: number;
  lang: string;
  onMemberClick?: (id: number) => void;
}

function FocusView({ graph, focalId, lang, onMemberClick }: FocusViewProps) {
  const allLevels = buildFocusLevels(focalId, graph);
  const nodeMap   = new Map(graph.nodes.map((n) => [n.id, n]));

  // Only show levels that have nodes
  const activeLevels = allLevels
    .map((lv, originalIdx) => ({ ...lv, originalIdx }))
    .filter((lv) => lv.nodes.length > 0);

  const nRows = activeLevels.length;

  // Compute row y positions (evenly distributed)
  const rowYs = activeLevels.map((_, i) =>
    nRows === 1 ? F_VH / 2 : 52 + (i * (F_VH - 100)) / (nRows - 1),
  );

  // Build a position map for all nodes in the focused subset
  const posMap = new Map<number, { x: number; y: number }>();
  activeLevels.forEach((lv, ri) => {
    const n       = lv.nodes.length;
    const visible = n > 6 ? lv.nodes.slice(0, 6) : lv.nodes;
    const totalW  = visible.length * F_CW + (visible.length - 1) * F_GAP;
    const startX  = F_VW / 2 - totalW / 2 + F_CW / 2;
    visible.forEach((node, ni) => {
      posMap.set(node.id, { x: startX + ni * F_SLOT, y: rowYs[ri] });
    });
  });

  // Collect edges within focused subset
  const focusedIds = new Set(posMap.keys());
  const pcEdges    = graph.edges.filter(
    (e) => e.type === "parent-child" && focusedIds.has(e.sourceId) && focusedIds.has(e.targetId),
  );
  const spEdges    = graph.edges.filter(
    (e) => e.type === "spouse" && focusedIds.has(e.sourceId) && focusedIds.has(e.targetId),
  );

  return (
    <svg
      viewBox={`0 0 ${F_VW} ${F_VH}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ maxHeight: "calc(100vh - 260px)", minHeight: 260 }}
    >
      <defs>
        {/* Focal glow */}
        <filter id="focal-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={F_VW} height={F_VH} fill="#FEFBF3" rx="14" />

      {/* Subtle row band for the focal row */}
      {activeLevels.map((lv, ri) =>
        lv.originalIdx === 2 ? (
          <rect
            key="focal-band"
            x="0" y={rowYs[ri] - F_CH / 2 - 10}
            width={F_VW} height={F_CH + 20}
            fill="#FFF8E1" rx="0"
            opacity="0.7"
          />
        ) : null,
      )}

      {/* Parent-child edges */}
      {pcEdges.map((e) => {
        const s = posMap.get(e.sourceId);
        const t = posMap.get(e.targetId);
        if (!s || !t) return null;
        const mid = (s.y + t.y) / 2;
        return (
          <path
            key={`pc-${e.sourceId}-${e.targetId}`}
            d={`M ${s.x} ${s.y + F_CH / 2} C ${s.x} ${mid}, ${t.x} ${mid}, ${t.x} ${t.y - F_CH / 2}`}
            fill="none"
            stroke="#C8A87A"
            strokeWidth="1.8"
            opacity="0.75"
          />
        );
      })}

      {/* Spouse edges */}
      {spEdges.map((e) => {
        const s = posMap.get(e.sourceId);
        const t = posMap.get(e.targetId);
        if (!s || !t) return null;
        const lx = Math.min(s.x, t.x) + F_CW / 2 + 2;
        const rx = Math.max(s.x, t.x) - F_CW / 2 - 2;
        const y  = (s.y + t.y) / 2;
        if (lx >= rx) return null;
        return (
          <line
            key={`sp-${e.sourceId}-${e.targetId}`}
            x1={lx} y1={y} x2={rx} y2={y}
            stroke="#D4A017"
            strokeWidth="2"
            strokeDasharray="5 3"
            opacity="0.85"
          />
        );
      })}

      {/* Node cards */}
      {activeLevels.flatMap((lv, ri) => {
        const isFocalRow = lv.originalIdx === 2;
        const visible = lv.nodes.length > 6 ? lv.nodes.slice(0, 6) : lv.nodes;
        const overflow = lv.nodes.length > 6 ? lv.nodes.length - 6 : 0;

        return [
          ...visible.map((node) => {
            const pos = posMap.get(node.id);
            if (!pos) return null;
            const isFocal = node.id === focalId;
            const pal     = genderPalette(node.gender);
            const cx      = pos.x - F_CW / 2;
            const cy      = pos.y - F_CH / 2;
            const parts   = (lang.startsWith("ta") && node.fullNameTa
              ? node.fullNameTa
              : node.fullName.trim().replace(/\.$/, "")
            ).split(/\s+/);
            const line1 = parts[0].slice(0, 14);
            const line2 = parts.slice(1).join(" ").slice(0, 16);
            const scale = isFocal ? 1.10 : 1;
            const scaledW = F_CW * scale, scaledH = F_CH * scale;
            const ox = pos.x - scaledW / 2, oy = pos.y - scaledH / 2;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onMemberClick?.(node.id)}
                style={{ cursor: "pointer" }}
                role="button"
                aria-label={node.fullName}
              >
                {/* Focal outer ring */}
                {isFocal && (
                  <rect
                    x={-scaledW / 2 - 4} y={-scaledH / 2 - 4}
                    width={scaledW + 8} height={scaledH + 8}
                    rx={F_RX + 4}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    filter="url(#focal-glow)"
                  />
                )}
                {/* Card background */}
                <rect
                  x={-scaledW / 2} y={-scaledH / 2}
                  width={scaledW} height={scaledH}
                  rx={F_RX}
                  fill={pal.bg}
                  stroke={pal.stroke}
                  strokeWidth={isFocal ? 2 : 1.2}
                />
                {/* Gender bar */}
                <rect
                  x={-scaledW / 2} y={-scaledH / 2}
                  width="6" height={scaledH}
                  rx={F_RX}
                  fill={pal.bar}
                />
                {/* Name text */}
                <text
                  x={-scaledW / 2 + 14}
                  y={line2 ? -4 : 5}
                  fontSize={isFocal ? 14 : 13}
                  fontWeight="700"
                  fill={pal.text}
                  fontFamily="system-ui,sans-serif"
                  dominantBaseline="middle"
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={-scaledW / 2 + 14}
                    y={13}
                    fontSize="10.5"
                    fill={pal.bar}
                    fontFamily="system-ui,sans-serif"
                    dominantBaseline="middle"
                    opacity="0.85"
                  >
                    {line2}
                  </text>
                )}
              </g>
            );
          }),
          // "+N more" indicator for overflow
          overflow > 0 && rowYs[ri] !== undefined ? (
            <text
              key={`overflow-${ri}`}
              x={F_VW - 24}
              y={rowYs[ri]}
              fontSize="11"
              fill="#A89070"
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="system-ui,sans-serif"
            >
              +{overflow} more
            </text>
          ) : null,
        ].filter(Boolean);
      })}

      {/* Row labels on the right margin */}
      {activeLevels.map((lv, ri) => (
        <text
          key={`lbl-${ri}`}
          x={F_VW - 8}
          y={rowYs[ri]}
          fontSize="10.5"
          fill="#B09070"
          textAnchor="end"
          dominantBaseline="middle"
          fontFamily="system-ui,sans-serif"
          fontStyle="italic"
        >
          {lang.startsWith("ta") ? lv.labelTa : lv.label}
        </text>
      ))}

      {/* Legend bottom-left */}
      <g transform="translate(10, 460)">
        <circle cx="6"  cy="5" r="5" fill={PALETTE.Male.bar}    opacity="0.85"/>
        <text x="14" y="9" fontSize="9.5" fill="#7a6040" fontFamily="system-ui,sans-serif">
          {lang.startsWith("ta") ? "ஆண்" : "Male"}
        </text>
        <circle cx="50" cy="5" r="5" fill={PALETTE.Female.bar}  opacity="0.85"/>
        <text x="58" y="9" fontSize="9.5" fill="#7a6040" fontFamily="system-ui,sans-serif">
          {lang.startsWith("ta") ? "பெண்" : "Female"}
        </text>
        <line x1="90" y1="5" x2="104" y2="5" stroke="#D4A017" strokeWidth="1.8" strokeDasharray="3 2"/>
        <text x="107" y="9" fontSize="9.5" fill="#7a6040" fontFamily="system-ui,sans-serif">
          {lang.startsWith("ta") ? "திருமணம்" : "Married"}
        </text>
        <line x1="145" y1="5" x2="159" y2="5" stroke="#C8A87A" strokeWidth="1.8"/>
        <text x="162" y="9" fontSize="9.5" fill="#7a6040" fontFamily="system-ui,sans-serif">
          {lang.startsWith("ta") ? "பெற்றோர்-குழந்தை" : "Parent-child"}
        </text>
      </g>

      {/* Empty state */}
      {activeLevels.length === 0 && (
        <text
          x={F_VW / 2} y={F_VH / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#A89070"
          fontFamily="system-ui,sans-serif"
        >
          No family connections found for this person.
        </text>
      )}
    </svg>
  );
}

// ── Main FamilyMap component ──────────────────────────────────────────────────
export function FamilyMap({ onMemberClick, selectedMemberId }: FamilyMapProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const svgRef     = useRef<SVGSVGElement>(null);
  const zoomBehRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const nodeGrpRef = useRef<d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>>();

  // Mode state
  const [viewMode, setViewMode] = useState<"map" | "focus">("map");

  // Full-map controls
  const [searchTerm, setSearchTerm] = useState("");

  // Focus-view controls
  const [focalId, setFocalId] = useState<number | null>(null);
  const [focusSearch, setFocusSearch] = useState("");
  const [focusDropdown, setFocusDropdown] = useState(false);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const { data: graph, isLoading, error, refetch } = useQuery<FamilyGraph>({
    queryKey: ["/api/family-graph"],
    queryFn: async () => {
      const res = await fetch("/api/family-graph", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch family graph");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Default focal to first node alphabetically when data arrives
  const sortedNodes = useMemo(
    () => graph ? [...graph.nodes].sort((a, b) => a.fullName.localeCompare(b.fullName)) : [],
    [graph],
  );
  useEffect(() => {
    if (sortedNodes.length && focalId === null) setFocalId(sortedNodes[0].id);
  }, [sortedNodes, focalId]);

  // Sync focal to external selectedMemberId when switching to focus mode
  useEffect(() => {
    if (viewMode === "focus" && selectedMemberId) setFocalId(selectedMemberId);
  }, [viewMode, selectedMemberId]);

  // Focus search results
  const focusResults = useMemo(() => {
    if (!focusSearch.trim()) return sortedNodes.slice(0, 8);
    const q = focusSearch.toLowerCase();
    return sortedNodes.filter(
      (n) =>
        n.fullName.toLowerCase().includes(q) ||
        (n.fullNameTa && n.fullNameTa.includes(focusSearch)),
    ).slice(0, 10);
  }, [focusSearch, sortedNodes]);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const layoutNodes = useMemo<LayoutNode[]>(() => {
    if (!graph) return [];
    const positions = computeLayout(graph.nodes);
    return graph.nodes.map((n) => ({
      ...n,
      x: positions.get(n.id)?.x ?? 0,
      y: positions.get(n.id)?.y ?? 0,
    }));
  }, [graph]);

  // ── Pan helpers ────────────────────────────────────────────────────────────
  const panTo = useCallback((node: LayoutNode, zoom?: number) => {
    const svgEl = svgRef.current;
    if (!svgEl || !zoomBehRef.current) return;
    const w = svgEl.clientWidth, h = svgEl.clientHeight;
    const k = zoom ?? Math.max(0.9, d3.zoomTransform(svgEl).k);
    d3.select(svgEl)
      .transition().duration(500).ease(d3.easeCubicInOut)
      .call(zoomBehRef.current.transform,
        d3.zoomIdentity.translate(w / 2 - k * node.x, h / 3 - k * node.y).scale(k));
  }, []);

  const fitAll = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !zoomBehRef.current || !layoutNodes.length) return;
    const xs = layoutNodes.map((n) => n.x), ys = layoutNodes.map((n) => n.y);
    const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80;
    const minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 80;
    const w = svgEl.clientWidth, h = svgEl.clientHeight;
    const k = Math.min(w / (maxX - minX), h / (maxY - minY)) * 0.85;
    d3.select(svgEl).transition().duration(500).ease(d3.easeCubicInOut)
      .call(zoomBehRef.current.transform,
        d3.zoomIdentity
          .translate(w / 2 - k * (minX + maxX) / 2, h / 2 - k * (minY + maxY) / 2)
          .scale(k));
  }, [layoutNodes]);

  // Full-map search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term.trim() || !layoutNodes.length) return;
    const q   = term.toLowerCase();
    const hit = layoutNodes.find(
      (n) => n.fullName.toLowerCase().includes(q) || (n.fullNameTa && n.fullNameTa.includes(term)),
    );
    if (hit) panTo(hit);
  }, [layoutNodes, panTo]);

  // ── D3 full-map init ───────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "map") return;
    const svgEl = svgRef.current;
    if (!svgEl || !graph || !layoutNodes.length) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const container = svg.append("g").attr("class", "map-root");
    const gBands    = container.append("g").attr("class", "gen-bands");
    const gLinks    = container.append("g").attr("class", "pc-links");
    const gSpouse   = container.append("g").attr("class", "sp-links");
    const gNodes    = container.append("g").attr("class", "nodes");

    // SVG defs — gradients
    const defs = svg.append("defs");
    [
      { id: "grd-m", c1: "#6A9EC9", c2: "#3A6590" },
      { id: "grd-f", c1: "#D9729A", c2: "#9E3A60" },
      { id: "grd-u", c1: "#A89EC9", c2: "#6A5A90" },
    ].forEach(({ id, c1, c2 }) => {
      const g = defs.append("radialGradient")
        .attr("id", id)
        .attr("cx", "38%").attr("cy", "35%").attr("r", "60%");
      g.append("stop").attr("offset", "0%").attr("stop-color", c1);
      g.append("stop").attr("offset", "100%").attr("stop-color", c2);
    });

    const nodeMap   = new Map(layoutNodes.map((n) => [n.id, n]));
    const xs        = layoutNodes.map((n) => n.x);
    const ys        = layoutNodes.map((n) => n.y);
    const minX      = Math.min(...xs) - 90, maxX = Math.max(...xs) + 90;
    const maxGen    = layoutNodes.reduce((m, n) => Math.max(m, n.generation), 0);

    const genLabelsEn = ["1st Gen","2nd Gen","3rd Gen","4th Gen","5th Gen","6th Gen"];
    const genLabelsTa = ["முதல்","இரண்டாம்","மூன்றாம்","நான்காம்","ஐந்தாம்","ஆறாம்"];

    // Generation bands — subtle alternating fills
    for (let g = 0; g <= maxGen; g++) {
      const y1 = g * ROW_H - ROW_H * 0.42;
      const y2 = g * ROW_H + ROW_H * 0.42;
      gBands.append("rect")
        .attr("x", minX).attr("y", y1)
        .attr("width", maxX - minX).attr("height", y2 - y1)
        .attr("fill", g % 2 === 0 ? "#FFFBF2" : "#FDF6E8")
        .attr("opacity", 0.55);
      gBands.append("line")
        .attr("x1", minX).attr("x2", maxX)
        .attr("y1", y1).attr("y2", y1)
        .attr("stroke", "#e8d9be").attr("stroke-width", 0.8);
      gBands.append("text")
        .attr("class", `gen-lbl gen-lbl-${g}`)
        .attr("x", minX + 10).attr("y", y1 + 16)
        .attr("font-size", "11.5px").attr("font-family", "system-ui,sans-serif")
        .attr("fill", "#b09a70").attr("font-style", "italic")
        .text(lang.startsWith("ta")
          ? (g < genLabelsTa.length ? genLabelsTa[g] : `தலை ${g + 1}`)
          : (g < genLabelsEn.length ? genLabelsEn[g] : `Gen ${g + 1}`));
    }

    // Parent-child edges — smooth cubic bezier
    const pcEdges = (graph.edges ?? []).filter((e) => e.type === "parent-child");
    gLinks.selectAll("path").data(pcEdges).join("path")
      .attr("fill", "none")
      .attr("stroke", "#C4A882")
      .attr("stroke-width", 1.8)
      .attr("opacity", 0.7)
      .attr("d", (e) => {
        const s = nodeMap.get(e.sourceId), t = nodeMap.get(e.targetId);
        if (!s || !t) return "";
        const mid = (s.y + t.y) / 2;
        return `M ${s.x} ${s.y + NODE_R} C ${s.x} ${mid}, ${t.x} ${mid}, ${t.x} ${t.y - NODE_R}`;
      });

    // Spouse edges — gold double dash
    const spEdges = (graph.edges ?? []).filter((e) => e.type === "spouse");
    gSpouse.selectAll("line").data(spEdges).join("line")
      .attr("stroke", "#D4A017")
      .attr("stroke-width", 2.2)
      .attr("stroke-dasharray", "5 3")
      .attr("opacity", 0.8)
      .attr("x1", (e) => (nodeMap.get(e.sourceId)?.x ?? 0) + NODE_R + 2)
      .attr("y1", (e) => nodeMap.get(e.sourceId)?.y ?? 0)
      .attr("x2", (e) => (nodeMap.get(e.targetId)?.x ?? 0) - NODE_R - 2)
      .attr("y2", (e) => nodeMap.get(e.targetId)?.y ?? 0);

    // Nodes
    const nodeGrps = gNodes
      .selectAll<SVGGElement, LayoutNode>("g.node")
      .data(layoutNodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => d.fullName);

    // Glow ring for selected
    nodeGrps.append("circle")
      .attr("class", "node-glow")
      .attr("r", NODE_R + 7)
      .attr("fill", "none")
      .attr("stroke", "#D97706")
      .attr("stroke-width", 3)
      .attr("opacity", 0);

    // Shadow circle
    nodeGrps.append("circle")
      .attr("r", NODE_R + 1)
      .attr("fill", "rgba(0,0,0,0.12)")
      .attr("transform", "translate(2,2)");

    // Main circle with gradient
    nodeGrps.append("circle")
      .attr("class", "node-circle")
      .attr("r", NODE_R)
      .attr("fill", (d) =>
        d.gender === "Male" ? "url(#grd-m)" :
        d.gender === "Female" ? "url(#grd-f)" : "url(#grd-u)")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5);

    // First name label above/inside circle (short)
    nodeGrps.append("text")
      .attr("class", "node-init")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "system-ui,sans-serif")
      .attr("font-weight", "800")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .text((d) => {
        const word = d.fullName.trim().split(/\s+/)[0];
        return word.slice(0, 3).toUpperCase();
      });

    // Name label below
    nodeGrps.append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("y", NODE_R + 16)
      .attr("font-family", "system-ui,sans-serif")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#4a3520")
      .attr("pointer-events", "none")
      .text((d) => shortLabel(d, lang));

    // Interactions
    nodeGrps
      .on("click", function (_ev: MouseEvent, d: LayoutNode) {
        onMemberClick?.(d.id);
        panTo(d);
      })
      .on("keydown", function (ev: KeyboardEvent, d: LayoutNode) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onMemberClick?.(d.id); panTo(d); }
      })
      .on("mouseover", function (_ev: MouseEvent, d: LayoutNode) {
        d3.select(this).select(".node-circle")
          .attr("stroke", "#D97706").attr("stroke-width", 3.5);
      })
      .on("mouseout", function (_ev: MouseEvent) {
        d3.select(this).select(".node-circle")
          .attr("stroke", "#fff").attr("stroke-width", 2.5);
      });

    svg.on("click.bg", () => {});

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.06, 4])
      .on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);
    zoomBehRef.current = zoom;
    nodeGrpRef.current = nodeGrps as unknown as d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>;

    // Initial fit
    const w  = svgEl.clientWidth  || 900;
    const h  = svgEl.clientHeight || 640;
    const y1 = Math.min(...ys) - 60, y2 = Math.max(...ys) + 80;
    const k  = Math.min(w / (maxX - minX), h / (y2 - y1)) * 0.85;
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(w / 2 - k * (minX + maxX) / 2, h / 2 - k * (y1 + y2) / 2)
      .scale(k));

    return () => {
      svg.on(".zoom", null).on("click.bg", null);
      svg.selectAll("*").remove();
      nodeGrpRef.current = undefined;
      zoomBehRef.current = undefined;
    };
  }, [graph, layoutNodes, viewMode, onMemberClick, panTo, lang]);

  // Language update for D3 labels
  useEffect(() => {
    if (!nodeGrpRef.current || !layoutNodes.length || viewMode !== "map") return;
    nodeGrpRef.current.select<SVGTextElement>(".node-label")
      .text((d: LayoutNode) => shortLabel(d, lang));
    if (!svgRef.current) return;
    const sv = d3.select(svgRef.current);
    const genLabelsTa = ["முதல்","இரண்டாம்","மூன்றாம்","நான்காம்","ஐந்தாம்","ஆறாம்"];
    const genLabelsEn = ["1st Gen","2nd Gen","3rd Gen","4th Gen","5th Gen","6th Gen"];
    const maxGen = layoutNodes.reduce((m, n) => Math.max(m, n.generation), 0);
    for (let g = 0; g <= maxGen; g++) {
      sv.select(`.gen-lbl-${g}`).text(
        lang.startsWith("ta")
          ? (g < genLabelsTa.length ? genLabelsTa[g] : `தலை ${g + 1}`)
          : (g < genLabelsEn.length ? genLabelsEn[g] : `Gen ${g + 1}`),
      );
    }
  }, [lang, layoutNodes, viewMode]);

  // Highlight selected in D3 map
  useEffect(() => {
    if (!nodeGrpRef.current || viewMode !== "map") return;
    nodeGrpRef.current.select(".node-glow")
      .attr("opacity", (d: LayoutNode) => (d.id === selectedMemberId ? 1 : 0));
    nodeGrpRef.current.select(".node-circle")
      .attr("stroke", (d: LayoutNode) => (d.id === selectedMemberId ? "#D97706" : "#fff"))
      .attr("stroke-width", (d: LayoutNode) => (d.id === selectedMemberId ? 4 : 2.5));
  }, [selectedMemberId, viewMode]);

  // Pan to selected in D3 map
  useEffect(() => {
    if (!selectedMemberId || !layoutNodes.length || viewMode !== "map") return;
    const node = layoutNodes.find((n) => n.id === selectedMemberId);
    if (node) panTo(node);
  }, [selectedMemberId, layoutNodes, panTo, viewMode]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-[580px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-[400px] text-muted-foreground">
        <p className="text-sm">Could not load the family map.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          {lang.startsWith("ta") ? "மீண்டும் முயற்சி" : "Try again"}
        </Button>
      </div>
    );
  }

  const focalNode = focalId !== null ? graph?.nodes.find((n) => n.id === focalId) : null;
  const focusDisplayName = focalNode ? shortLabel(focalNode, lang) : "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* ── Top control bar ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border border-amber-300 overflow-hidden bg-amber-50/40 shrink-0">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-amber-700 text-white shadow-inner"
                : "text-amber-800 hover:bg-amber-100"
            }`}
            onClick={() => setViewMode("map")}
          >
            <Map className="h-3.5 w-3.5" />
            {lang.startsWith("ta") ? "முழு வரைபடம்" : "Full Map"}
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "focus"
                ? "bg-amber-700 text-white shadow-inner"
                : "text-amber-800 hover:bg-amber-100"
            }`}
            onClick={() => setViewMode("focus")}
          >
            <Target className="h-3.5 w-3.5" />
            {lang.startsWith("ta") ? "குவிய பார்வை" : "Focus View"}
          </button>
        </div>

        {/* Mode-specific controls */}
        {viewMode === "map" ? (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={lang.startsWith("ta") ? "உறுப்பினரை தேடு…" : "Find a member…"}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-44 h-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fitAll} className="h-9 gap-1.5 border-amber-300">
              <Maximize2 className="h-4 w-4" />
              {lang.startsWith("ta") ? "பொருத்து" : "Fit All"}
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-amber-300"
              onClick={() => setSearchTerm("")}>
              <RotateCcw className="h-4 w-4" />
              {lang.startsWith("ta") ? "அழி" : "Clear"}
            </Button>
          </>
        ) : (
          <>
            {/* Focal person picker */}
            <div className="relative">
              <UserCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={lang.startsWith("ta") ? "மையப் நபரைத் தேடு…" : "Choose focal person…"}
                value={focusSearch || (focusDropdown ? "" : focalNode?.fullName ?? "")}
                onChange={(e) => { setFocusSearch(e.target.value); setFocusDropdown(true); }}
                onFocus={() => { setFocusSearch(""); setFocusDropdown(true); }}
                onBlur={() => setTimeout(() => setFocusDropdown(false), 150)}
                className="pl-8 pr-7 w-52 h-9 text-sm"
              />
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              {focusDropdown && focusResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-52 overflow-y-auto border border-amber-200 rounded-lg bg-white shadow-lg z-50">
                  {focusResults.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3 py-2 cursor-pointer text-sm border-b border-amber-50 last:border-0 ${
                        n.id === focalId ? "bg-amber-50 font-semibold text-amber-800" : "hover:bg-amber-50/60"
                      }`}
                      onMouseDown={() => { setFocalId(n.id); setFocusSearch(""); setFocusDropdown(false); }}
                    >
                      <span className="font-medium">{n.fullName}</span>
                      {n.gender && (
                        <span className={`ml-1.5 text-xs ${n.gender === "Male" ? "text-blue-600" : "text-rose-600"}`}>
                          {n.gender}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current focal label */}
            {focalNode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-sm font-medium text-amber-900">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: genderPalette(focalNode.gender).bar }}
                />
                {focalNode.fullName}
              </div>
            )}
          </>
        )}

        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {layoutNodes.length} {lang.startsWith("ta") ? "பேர்" : "members"}
        </span>
      </div>

      {/* ── Canvas ── */}
      {viewMode === "map" ? (
        <div
          className="relative w-full rounded-xl border border-amber-200/70 overflow-hidden"
          style={{ height: "640px", background: "linear-gradient(155deg,#fdf9f1 0%,#fff9ed 100%)" }}
        >
          <svg ref={svgRef} className="w-full h-full" style={{ cursor: "grab" }} />

          {/* Map legend */}
          <div className="absolute bottom-3 left-3 bg-white/88 backdrop-blur-sm rounded-lg border border-amber-200/60 px-3 py-2 text-[11px] text-muted-foreground space-y-1.5 pointer-events-none select-none">
            <p className="font-semibold text-foreground text-[11px] mb-1">
              {lang.startsWith("ta") ? "குறியீடு" : "Legend"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: "url(#grd-m)", backgroundColor: PALETTE.Male.bar }} />
              <span>{lang.startsWith("ta") ? "ஆண்" : "Male"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: PALETTE.Female.bar }} />
              <span>{lang.startsWith("ta") ? "பெண்" : "Female"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-0 border-t-2 border-dashed" style={{ borderColor: "#D4A017" }} />
              <span>{lang.startsWith("ta") ? "திருமணம்" : "Married"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-0 border-t-[1.5px]" style={{ borderColor: "#C4A882" }} />
              <span>{lang.startsWith("ta") ? "பெற்றோர்-குழந்தை" : "Parent-child"}</span>
            </div>
          </div>

          <div className="absolute top-2 right-3 text-[10px] text-muted-foreground/55 pointer-events-none select-none">
            {lang.startsWith("ta") ? "ஸ்க்ரோல் = ஜூம் · இழு = நகர்" : "Scroll to zoom · drag to pan · click to select"}
          </div>
        </div>
      ) : (
        <div
          className="relative w-full rounded-xl border border-amber-200/70 overflow-hidden bg-[#FEFBF3]"
        >
          {/* Focus instructions */}
          <div className="absolute top-2 right-3 text-[10px] text-muted-foreground/50 pointer-events-none select-none z-10">
            {lang.startsWith("ta") ? "கிளிக் = மையம் மாற்று" : "Click any person to re-focus"}
          </div>

          {graph && focalId !== null && (
            <FocusView
              graph={graph}
              focalId={focalId}
              lang={lang}
              onMemberClick={(id) => {
                setFocalId(id);
                onMemberClick?.(id);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
