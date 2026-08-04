import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import { Search, Maximize2, RotateCcw, Users } from "lucide-react";
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

interface FamilyMapProps {
  onMemberClick?: (id: number) => void;
  selectedMemberId?: number | null;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOT   = 135;  // horizontal px per node slot
const ROW_H  = 190;  // px between generation rows
const NODE_R = 20;   // node circle radius

// Gender-based fill colours
const MALE_COLOR    = "#4E7FA7";
const FEMALE_COLOR  = "#C1567D";
const UNKNOWN_COLOR = "#9a92ad";

function nodeColor(n: FamilyNode) {
  if (n.gender === "Male")   return MALE_COLOR;
  if (n.gender === "Female") return FEMALE_COLOR;
  return UNKNOWN_COLOR;
}

// Short display label (≤14 chars, no truncation mid-word where possible)
function shortLabel(n: FamilyNode, lang: string): string {
  if (lang.startsWith("ta") && n.fullNameTa) return n.fullNameTa.slice(0, 16);
  const parts = n.fullName.trim().split(/\s+/);
  // Drop trailing caste suffixes (Pillai, Ammal, etc.) if >1 word
  const name = parts.length > 1 ? parts[parts.length - 1].length <= 6
    ? `${parts.slice(0, -1).join(" ")}`
    : parts[0]
    : parts[0];
  return name.length > 14 ? name.slice(0, 13) + "…" : name;
}

// ── Layout algorithm ──────────────────────────────────────────────────────────
function computeLayout(nodes: FamilyNode[]): Map<number, { x: number; y: number }> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const positions = new Map<number, { x: number; y: number }>();

  const maxGen = nodes.reduce((m, n) => Math.max(m, n.generation), 0);
  const byGen: FamilyNode[][] = Array.from({ length: maxGen + 1 }, () => []);
  nodes.forEach((n) => byGen[n.generation].push(n));

  for (let g = 0; g <= maxGen; g++) {
    const members = byGen[g];
    if (!members.length) continue;

    // Sort by average parent X so children appear under parents
    const sorted =
      g === 0
        ? [...members].sort((a, b) => a.fullName.localeCompare(b.fullName))
        : [...members].sort((a, b) => {
            const avgParentX = (n: FamilyNode) => {
              const pxs = n.parentIds
                .map((pid) => positions.get(pid)?.x)
                .filter((x): x is number => x !== undefined);
              return pxs.length
                ? pxs.reduce((s, x) => s + x, 0) / pxs.length
                : 99_999;
            };
            return avgParentX(a) - avgParentX(b);
          });

    // Group each member with their spouses (placed adjacent)
    const placed = new Set<number>();
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

// ── Component ─────────────────────────────────────────────────────────────────
export function FamilyMap({ onMemberClick, selectedMemberId }: FamilyMapProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const svgRef       = useRef<SVGSVGElement>(null);
  const zoomBehRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const nodeGrpRef   = useRef<d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>>();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [hoveredId,     setHoveredId]     = useState<number | null>(null);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const { data: graph, isLoading, error } = useQuery<FamilyGraph>({
    queryKey: ["/api/family-graph"],
    queryFn: async () => {
      const res = await fetch("/api/family-graph", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch family graph");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Compute layout ──────────────────────────────────────────────────────────
  const layoutNodes = useMemo<LayoutNode[]>(() => {
    if (!graph) return [];
    const positions = computeLayout(graph.nodes);
    return graph.nodes.map((n) => ({
      ...n,
      x: positions.get(n.id)?.x ?? 0,
      y: positions.get(n.id)?.y ?? 0,
    }));
  }, [graph]);

  // ── Pan-to helper (used by click + search + selectedMemberId effect) ────────
  const panTo = useCallback(
    (node: LayoutNode, zoom?: number) => {
      const svgEl = svgRef.current;
      if (!svgEl || !zoomBehRef.current) return;
      const w = svgEl.clientWidth;
      const h = svgEl.clientHeight;
      const k = zoom ?? Math.max(0.8, d3.zoomTransform(svgEl).k);
      d3.select(svgEl)
        .transition()
        .duration(550)
        .ease(d3.easeCubicInOut)
        .call(
          zoomBehRef.current.transform,
          d3.zoomIdentity.translate(w / 2 - k * node.x, h / 3 - k * node.y).scale(k),
        );
    },
    [],
  );

  // ── Fit-all helper ──────────────────────────────────────────────────────────
  const fitAll = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !zoomBehRef.current || !layoutNodes.length) return;
    const xs  = layoutNodes.map((n) => n.x);
    const ys  = layoutNodes.map((n) => n.y);
    const minX = Math.min(...xs) - 80,  maxX = Math.max(...xs) + 80;
    const minY = Math.min(...ys) - 60,  maxY = Math.max(...ys) + 80;
    const w = svgEl.clientWidth, h = svgEl.clientHeight;
    const k = Math.min(w / (maxX - minX), h / (maxY - minY)) * 0.85;
    d3.select(svgEl)
      .transition()
      .duration(550)
      .ease(d3.easeCubicInOut)
      .call(
        zoomBehRef.current.transform,
        d3.zoomIdentity
          .translate(w / 2 - k * (minX + maxX) / 2, h / 2 - k * (minY + maxY) / 2)
          .scale(k),
      );
  }, [layoutNodes]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (!term.trim() || !layoutNodes.length) return;
      const q = term.toLowerCase();
      const hit = layoutNodes.find(
        (n) =>
          n.fullName.toLowerCase().includes(q) ||
          (n.fullNameTa && n.fullNameTa.includes(term)),
      );
      if (hit) panTo(hit);
    },
    [layoutNodes, panTo],
  );

  // ── Main D3 init — runs once when data is ready ─────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !graph || !layoutNodes.length) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const container = svg.append("g").attr("class", "map-root");
    const gBands    = container.append("g").attr("class", "gen-bands");
    const gLinks    = container.append("g").attr("class", "pc-links");
    const gSpouse   = container.append("g").attr("class", "sp-links");
    const gNodes    = container.append("g").attr("class", "nodes");

    const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

    const xs   = layoutNodes.map((n) => n.x);
    const ys   = layoutNodes.map((n) => n.y);
    const minX = Math.min(...xs) - 80, maxX = Math.max(...xs) + 80;
    const maxGen = layoutNodes.reduce((m, n) => Math.max(m, n.generation), 0);

    // Generation band labels
    const genLabelsEn = [
      "1st Generation", "2nd Generation", "3rd Generation",
      "4th Generation",  "5th Generation",  "6th Generation",
    ];
    const genLabelsTa = [
      "முதல் தலைமுறை", "இரண்டாம் தலைமுறை", "மூன்றாம் தலைமுறை",
      "நான்காம் தலைமுறை", "ஐந்தாம் தலைமுறை", "ஆறாம் தலைமுறை",
    ];

    for (let g = 0; g <= maxGen; g++) {
      const bandY = g * ROW_H - ROW_H * 0.38;
      gBands
        .append("line")
        .attr("x1", minX).attr("x2", maxX)
        .attr("y1", bandY).attr("y2", bandY)
        .attr("stroke", "#ddd0bc").attr("stroke-width", 1);
      gBands
        .append("text")
        .attr("class", `gen-lbl gen-lbl-${g}`)
        .attr("x", minX + 8).attr("y", bandY + 15)
        .attr("font-size", "11px")
        .attr("font-family", "system-ui,sans-serif")
        .attr("fill", "#a89070")
        .text(g < genLabelsEn.length ? genLabelsEn[g] : `Gen ${g + 1}`);
    }

    // Parent-child curved links
    const pcEdges = (graph.edges ?? []).filter((e) => e.type === "parent-child");
    gLinks
      .selectAll("path")
      .data(pcEdges)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "#c8b89a")
      .attr("stroke-width", 1.6)
      .attr("d", (e) => {
        const s = nodeMap.get(e.sourceId), t = nodeMap.get(e.targetId);
        if (!s || !t) return "";
        const mid = (s.y + t.y) / 2;
        return `M ${s.x} ${s.y + NODE_R} C ${s.x} ${mid}, ${t.x} ${mid}, ${t.x} ${t.y - NODE_R}`;
      });

    // Spouse dashed links
    const spEdges = (graph.edges ?? []).filter((e) => e.type === "spouse");
    gSpouse
      .selectAll("line")
      .data(spEdges)
      .join("line")
      .attr("stroke", "#E3B23C")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 3")
      .attr("opacity", 0.75)
      .attr("x1", (e) => (nodeMap.get(e.sourceId)?.x ?? 0) + NODE_R + 2)
      .attr("y1", (e) => nodeMap.get(e.sourceId)?.y ?? 0)
      .attr("x2", (e) => (nodeMap.get(e.targetId)?.x ?? 0) - NODE_R - 2)
      .attr("y2", (e) => nodeMap.get(e.targetId)?.y ?? 0);

    // Node groups
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

    // Shadow / glow circle (for selected highlight)
    nodeGrps
      .append("circle")
      .attr("class", "node-glow")
      .attr("r", NODE_R + 5)
      .attr("fill", "none")
      .attr("stroke", "#C1272D")
      .attr("stroke-width", 3)
      .attr("opacity", 0);

    // Main filled circle
    nodeGrps
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", NODE_R)
      .attr("fill", (d) => nodeColor(d))
      .attr("stroke", (d) => nodeColor(d))
      .attr("stroke-width", 2.5);

    // Initials text
    nodeGrps
      .append("text")
      .attr("class", "node-init")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "system-ui,sans-serif")
      .attr("font-weight", "700")
      .attr("font-size", "11px")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .text((d) => {
        const parts = d.fullName.trim().split(/\s+/);
        return parts[parts.length - 1].slice(0, 2).toUpperCase();
      });

    // Name label below node
    nodeGrps
      .append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("y", NODE_R + 15)
      .attr("font-family", "system-ui,sans-serif")
      .attr("font-size", "10.5px")
      .attr("fill", "#5a4530")
      .attr("pointer-events", "none")
      .text((d) => shortLabel(d, lang));

    // ── Interactions ──────────────────────────────────────────────────────────
    nodeGrps
      .on("click", function (event: MouseEvent, d: LayoutNode) {
        event.stopPropagation();
        onMemberClick?.(d.id);
        panTo(d);
      })
      .on("keydown", function (event: KeyboardEvent, d: LayoutNode) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onMemberClick?.(d.id);
          panTo(d);
        }
      })
      .on("mouseover", function (_event: MouseEvent, d: LayoutNode) {
        setHoveredId(d.id);
        d3.select(this)
          .select(".node-circle")
          .attr("stroke", "#C1272D")
          .attr("stroke-width", 3.5);
      })
      .on("mouseout", function (_event: MouseEvent, d: LayoutNode) {
        setHoveredId(null);
        d3.select(this)
          .select(".node-circle")
          .attr("stroke", nodeColor(d))
          .attr("stroke-width", 2.5);
      });

    // Click on canvas background → deselect hover
    svg.on("click", () => setHoveredId(null));

    // ── Zoom / pan ────────────────────────────────────────────────────────────
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 3.5])
      .on("zoom", (e) => container.attr("transform", e.transform));

    svg.call(zoom);
    zoomBehRef.current = zoom;

    // Store node groups ref for language / selection updates
    nodeGrpRef.current = nodeGrps as unknown as d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>;

    // Initial fit
    const w = svgEl.clientWidth  || 900;
    const h = svgEl.clientHeight || 600;
    const minY2 = Math.min(...ys) - 60, maxY2 = Math.max(...ys) + 80;
    const k = Math.min(w / (maxX - minX), h / (maxY2 - minY2)) * 0.85;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(w / 2 - k * (minX + maxX) / 2, h / 2 - k * (minY2 + maxY2) / 2)
        .scale(k),
    );

    return () => {
      svg.on(".zoom", null).on("click", null);
      svg.selectAll("*").remove();
      nodeGrpRef.current = undefined;
      zoomBehRef.current = undefined;
    };
  }, [graph, layoutNodes, onMemberClick, panTo]);

  // ── Language toggle: update labels without full D3 re-init ────────────────
  useEffect(() => {
    if (!nodeGrpRef.current || !layoutNodes.length) return;
    nodeGrpRef.current
      .select<SVGTextElement>(".node-label")
      .text((d: LayoutNode) => shortLabel(d, lang));

    // Update gen-band labels (if in Tamil)
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const genLabelsTa = [
      "முதல் தலைமுறை", "இரண்டாம் தலைமுறை", "மூன்றாம் தலைமுறை",
      "நான்காம் தலைமுறை", "ஐந்தாம் தலைமுறை", "ஆறாம் தலைமுறை",
    ];
    const genLabelsEn = [
      "1st Generation", "2nd Generation", "3rd Generation",
      "4th Generation",  "5th Generation",  "6th Generation",
    ];
    const maxGen = layoutNodes.reduce((m, n) => Math.max(m, n.generation), 0);
    for (let g = 0; g <= maxGen; g++) {
      svg.select(`.gen-lbl-${g}`).text(
        lang.startsWith("ta")
          ? (g < genLabelsTa.length ? genLabelsTa[g] : `தலைமுறை ${g + 1}`)
          : (g < genLabelsEn.length ? genLabelsEn[g] : `Gen ${g + 1}`),
      );
    }
  }, [lang, layoutNodes]);

  // ── Highlight selected member ─────────────────────────────────────────────
  useEffect(() => {
    if (!nodeGrpRef.current) return;
    nodeGrpRef.current
      .select(".node-glow")
      .attr("opacity", (d: LayoutNode) => (d.id === selectedMemberId ? 1 : 0));
    nodeGrpRef.current
      .select(".node-circle")
      .attr("stroke", (d: LayoutNode) =>
        d.id === selectedMemberId ? "#C1272D" : nodeColor(d),
      )
      .attr("stroke-width", (d: LayoutNode) =>
        d.id === selectedMemberId ? 4 : 2.5,
      );
  }, [selectedMemberId]);

  // ── Pan to selected member when it changes from outside ───────────────────
  useEffect(() => {
    if (!selectedMemberId || !layoutNodes.length) return;
    const node = layoutNodes.find((n) => n.id === selectedMemberId);
    if (node) panTo(node);
  }, [selectedMemberId, layoutNodes, panTo]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-[620px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>Could not load family graph. Please refresh.</p>
      </div>
    );
  }

  const memberCount = layoutNodes.length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Top controls bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={lang.startsWith("ta") ? "உறுப்பினரை தேடு…" : "Find a member…"}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 w-48 h-9 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fitAll} className="h-9 gap-1">
          <Maximize2 className="h-4 w-4" />
          {lang.startsWith("ta") ? "பொருத்து" : "Fit All"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={() => { setSearchTerm(""); }}
        >
          <RotateCcw className="h-4 w-4" />
          {lang.startsWith("ta") ? "அழி" : "Clear"}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {memberCount} {lang.startsWith("ta") ? "உறுப்பினர்கள்" : "members"}
        </span>
      </div>

      {/* ── Canvas ── */}
      <div
        className="relative w-full rounded-xl border border-amber-200/60 overflow-hidden"
        style={{ height: "640px", background: "linear-gradient(160deg,#fdf8f0 0%,#fff8ed 100%)" }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: "grab" }}
        />

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 bg-white/85 backdrop-blur-sm rounded-lg border border-amber-200/50 px-3 py-2 text-[11px] text-muted-foreground space-y-1 pointer-events-none select-none">
          <p className="font-semibold text-foreground text-xs mb-1.5">
            {lang.startsWith("ta") ? "குல வரிசை" : "How to read"}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#4E7FA7]" />
            <span>{lang.startsWith("ta") ? "ஆண்" : "Male"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#C1567D]" />
            <span>{lang.startsWith("ta") ? "பெண்" : "Female"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0 border-t-2 border-dashed border-[#E3B23C]" style={{ width: "14px" }} />
            <span>{lang.startsWith("ta") ? "திருமணம்" : "Marriage"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0 border-t-[1.5px] border-[#c8b89a]" style={{ width: "14px" }} />
            <span>{lang.startsWith("ta") ? "பெற்றோர்-குழந்தை" : "Parent-child"}</span>
          </div>
        </div>

        {/* Hint */}
        <div className="absolute top-2 left-2 text-[10px] text-muted-foreground/60 pointer-events-none select-none">
          {lang.startsWith("ta") ? "ஸ்க்ரோல் = ஜூம் • இழு = நகர்" : "Scroll to zoom · drag to pan · click a node"}
        </div>
      </div>
    </div>
  );
}
