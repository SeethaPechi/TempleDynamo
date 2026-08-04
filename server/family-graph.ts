import { storage } from "./storage";

export interface FamilyNode {
  id: number;
  fullName: string;
  fullNameTa: string | null;
  gender: string | null;
  parentIds: number[];
  spouseIds: number[];
  generation: number;
}

export interface FamilyEdge {
  sourceId: number;
  targetId: number;
  type: "parent-child" | "spouse";
}

export interface FamilyGraph {
  nodes: FamilyNode[];
  edges: FamilyEdge[];
}

// Direct parent/child relationship types only (no grandparents — they skip a gen)
const PARENT_TYPES = new Set(["Father", "Mother", "Step Father", "Step Mother"]);
const CHILD_TYPES = new Set(["Son", "Daughter", "Step-Son", "Step-Daughter"]);
const SPOUSE_TYPES = new Set(["Wife", "Husband"]);

export async function buildFamilyGraph(): Promise<FamilyGraph> {
  const [allMembers, allRelationships] = await Promise.all([
    storage.getAllMembers(),
    storage.getAllRelationships(),
  ]);

  const memberIds = new Set(allMembers.map((m) => m.id));

  // Build adjacency maps
  const parentIdMap = new Map<number, Set<number>>(); // childId → parentIds
  const childIdMap  = new Map<number, Set<number>>(); // parentId → childIds
  const spouseIdMap = new Map<number, Set<number>>(); // memberId → spouseIds

  allMembers.forEach((m) => {
    parentIdMap.set(m.id, new Set());
    childIdMap.set(m.id, new Set());
    spouseIdMap.set(m.id, new Set());
  });

  for (const rel of allRelationships) {
    const from = rel.memberId;
    // relatedMember is the full joined object; fall back to relatedMemberId
    const to = (rel as any).relatedMember?.id ?? rel.relatedMemberId;
    const type = rel.relationshipType;

    if (!memberIds.has(from) || !memberIds.has(to) || from === to) continue;

    if (PARENT_TYPES.has(type)) {
      // "from" declares "to" as their parent
      parentIdMap.get(from)?.add(to);
      childIdMap.get(to)?.add(from);
    } else if (CHILD_TYPES.has(type)) {
      // "from" declares "to" as their child
      childIdMap.get(from)?.add(to);
      parentIdMap.get(to)?.add(from);
    } else if (SPOUSE_TYPES.has(type)) {
      spouseIdMap.get(from)?.add(to);
      spouseIdMap.get(to)?.add(from);
    }
  }

  // ── BFS generation assignment ─────────────────────────────────────────────
  const generation = new Map<number, number>();
  const queue: Array<{ id: number; gen: number }> = [];

  // Seed: members who have children but no parents in the DB → true roots
  allMembers.forEach((m) => {
    if (parentIdMap.get(m.id)!.size === 0 && childIdMap.get(m.id)!.size > 0) {
      generation.set(m.id, 0);
      queue.push({ id: m.id, gen: 0 });
    }
  });

  let qi = 0;
  while (qi < queue.length) {
    const { id: cur, gen: g } = queue[qi++];

    // Spouses share the same generation
    spouseIdMap.get(cur)?.forEach((sid) => {
      if (!generation.has(sid)) {
        generation.set(sid, g);
        queue.push({ id: sid, gen: g });
      }
    });

    // Children are one generation deeper
    childIdMap.get(cur)?.forEach((cid) => {
      if (!generation.has(cid)) {
        generation.set(cid, g + 1);
        queue.push({ id: cid, gen: g + 1 });
      }
    });
  }

  // Second pass: married-in members with no children may still be unassigned —
  // inherit from their spouse
  let changed = true;
  while (changed) {
    changed = false;
    allMembers.forEach((m) => {
      if (generation.has(m.id)) return;
      for (const sid of spouseIdMap.get(m.id) ?? []) {
        if (generation.has(sid)) {
          generation.set(m.id, generation.get(sid)!);
          changed = true;
          break;
        }
      }
    });
  }

  // Remaining (fully disconnected) → generation 0
  allMembers.forEach((m) => {
    if (!generation.has(m.id)) generation.set(m.id, 0);
  });

  // ── Build nodes ───────────────────────────────────────────────────────────
  const nodes: FamilyNode[] = allMembers.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    fullNameTa: (m as any).fullNameTa ?? null,
    gender: m.gender ?? null,
    parentIds: [...(parentIdMap.get(m.id) ?? [])],
    spouseIds: [...(spouseIdMap.get(m.id) ?? [])],
    generation: generation.get(m.id) ?? 0,
  }));

  // ── Build edges (deduped) ─────────────────────────────────────────────────
  const edgeSet = new Set<string>();
  const edges: FamilyEdge[] = [];

  nodes.forEach((node) => {
    node.parentIds.forEach((pid) => {
      if (!memberIds.has(pid)) return;
      const key = `pc:${pid}→${node.id}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ sourceId: pid, targetId: node.id, type: "parent-child" });
      }
    });

    node.spouseIds.forEach((sid) => {
      if (!memberIds.has(sid)) return;
      const key = `sp:${[node.id, sid].sort((a, b) => a - b).join("—")}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ sourceId: node.id, targetId: sid, type: "spouse" });
      }
    });
  });

  return { nodes, edges };
}
