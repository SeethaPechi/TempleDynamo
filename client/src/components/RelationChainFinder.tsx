/**
 * RelationChainFinder
 * Pick two members and see the shortest connection chain between them.
 * e.g.  A --[Father]--> B --[Brother]--> C --[Son]--> D
 */
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Link2 } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

interface Props {
  members: Member[];
  allRelationships: Array<Relationship & { relatedMember: Member }>;
}

interface Edge {
  toId: number;
  toName: string;
  relationshipType: string;
}

interface ChainStep {
  memberId: number;
  memberName: string;
  relationshipType?: string; // label on the arrow *after* this node
}

// Build undirected adjacency map from all relationships
function buildGraph(
  allRelationships: Array<Relationship & { relatedMember: Member }>,
  members: Member[],
): Map<number, Edge[]> {
  const memberById = new Map(members.map((m) => [m.id, m.fullName]));
  const graph = new Map<number, Edge[]>();

  const addEdge = (from: number, to: number, type: string, toName: string) => {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({ toId: to, toName, relationshipType: type });
  };

  for (const rel of allRelationships) {
    addEdge(rel.memberId, rel.relatedMemberId, rel.relationshipType, rel.relatedMember.fullName);
    // reverse edge — label is the inverse; we just show the stored type for simplicity
    const fromName = memberById.get(rel.memberId) ?? `#${rel.memberId}`;
    addEdge(rel.relatedMemberId, rel.memberId, rel.relationshipType, fromName);
  }

  return graph;
}

// BFS — returns ordered list of steps or null if no path
function bfsPath(
  graph: Map<number, Edge[]>,
  startId: number,
  endId: number,
): ChainStep[] | null {
  if (startId === endId) return [];

  const visited = new Set<number>();
  // queue items: [currentId, path so far]
  const queue: Array<[number, ChainStep[]]> = [
    [startId, [{ memberId: startId, memberName: "" }]],
  ];
  visited.add(startId);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const neighbours = graph.get(current) ?? [];

    for (const edge of neighbours) {
      if (visited.has(edge.toId)) continue;
      visited.add(edge.toId);

      // Attach the relationship label to the *previous* step
      const newPath: ChainStep[] = [
        ...path.slice(0, -1),
        { ...path[path.length - 1], relationshipType: edge.relationshipType },
        { memberId: edge.toId, memberName: edge.toName },
      ];

      if (edge.toId === endId) return newPath;
      queue.push([edge.toId, newPath]);
    }
  }

  return null; // no path found
}

export function RelationChainFinder({ members, allRelationships }: Props) {
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [chain, setChain] = useState<ChainStep[] | null | "none">(null);

  const graph = useMemo(
    () => buildGraph(allRelationships, members),
    [allRelationships, members],
  );

  // Populate names on the start/end nodes
  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m.fullName])),
    [members],
  );

  function findChain() {
    const fId = parseInt(fromId);
    const tId = parseInt(toId);
    if (!fId || !tId || fId === tId) return;

    const result = bfsPath(graph, fId, tId);
    if (!result) {
      setChain("none");
      return;
    }

    // Fill in the start node name
    const filled = result.map((step) => ({
      ...step,
      memberName: step.memberName || memberById.get(step.memberId) || `#${step.memberId}`,
    }));
    setChain(filled);
  }

  const sorted = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        Select two members to find the shortest connection chain between them.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">From</label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger>
              <SelectValue placeholder="Select first member" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">To</label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger>
              <SelectValue placeholder="Select second member" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={findChain}
          disabled={!fromId || !toId || fromId === toId}
          className="bg-saffron-600 hover:bg-saffron-700 text-white sm:w-auto w-full"
          style={{ backgroundColor: "hsl(37,100%,50%)" }}
        >
          <Link2 size={16} className="mr-2" />
          Find Chain
        </Button>
      </div>

      {/* Result */}
      {chain === "none" && (
        <Card className="p-6 text-center text-gray-500">
          No connection found between these two members.
        </Card>
      )}

      {Array.isArray(chain) && chain.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Connection Chain ({chain.length - 1} step{chain.length !== 2 ? "s" : ""})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {chain.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Member bubble */}
                <div className="flex flex-col items-center">
                  <div
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow"
                    style={{ backgroundColor: "hsl(33,100%,50%)" }}
                  >
                    {step.memberName}
                  </div>
                </div>

                {/* Arrow + label */}
                {step.relationshipType && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-0.5">
                      {step.relationshipType}
                    </span>
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {chain === null && (
        <Card className="p-6 text-center text-gray-400 border-dashed">
          Select two members and click <strong>Find Chain</strong> to see how they are connected.
        </Card>
      )}
    </div>
  );
}
