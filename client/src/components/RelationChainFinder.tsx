/**
 * RelationChainFinder
 * Pick two members and see the shortest connection chain between them.
 * Arrows show direction clearly: "Durairaj  ─is Father of─▶  Karuppa Pillai"
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  /** true = we travel in the stored direction (memberId → relatedMemberId) */
  isForward: boolean;
  /** id of the person who IS the relationship type (e.g. the Father) */
  subjectId: number;
  subjectName: string;
  /** id of the person the relationship points AT (e.g. the Son) */
  objectId: number;
  objectName: string;
}

interface ChainStep {
  memberId: number;
  memberName: string;
  /** Populated on all steps except the last */
  edge?: Edge;
}

function buildGraph(
  allRelationships: Array<Relationship & { relatedMember: Member }>,
  memberById: Map<number, string>,
): Map<number, Edge[]> {
  const graph = new Map<number, Edge[]>();

  const addEdge = (fromId: number, edge: Edge) => {
    if (!graph.has(fromId)) graph.set(fromId, []);
    graph.get(fromId)!.push(edge);
  };

  for (const rel of allRelationships) {
    const fromName = memberById.get(rel.memberId) ?? `#${rel.memberId}`;
    const toName = rel.relatedMember.fullName;

    // Forward: memberId → relatedMemberId
    addEdge(rel.memberId, {
      toId: rel.relatedMemberId,
      toName,
      relationshipType: rel.relationshipType,
      isForward: true,
      subjectId: rel.memberId,
      subjectName: fromName,
      objectId: rel.relatedMemberId,
      objectName: toName,
    });

    // Reverse: relatedMemberId → memberId (same stored meaning, opposite traversal)
    addEdge(rel.relatedMemberId, {
      toId: rel.memberId,
      toName: fromName,
      relationshipType: rel.relationshipType,
      isForward: false,
      subjectId: rel.memberId,
      subjectName: fromName,
      objectId: rel.relatedMemberId,
      objectName: toName,
    });
  }

  return graph;
}

function bfsPath(
  graph: Map<number, Edge[]>,
  startId: number,
  startName: string,
  endId: number,
): ChainStep[] | null {
  if (startId === endId) return [];

  const visited = new Set<number>();
  const queue: Array<[number, ChainStep[]]> = [
    [startId, [{ memberId: startId, memberName: startName }]],
  ];
  visited.add(startId);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const neighbours = graph.get(current) ?? [];

    for (const edge of neighbours) {
      if (visited.has(edge.toId)) continue;
      visited.add(edge.toId);

      // Attach edge to the current (last) step
      const newPath: ChainStep[] = [
        ...path.slice(0, -1),
        { ...path[path.length - 1], edge },
        { memberId: edge.toId, memberName: edge.toName },
      ];

      if (edge.toId === endId) return newPath;
      queue.push([edge.toId, newPath]);
    }
  }

  return null;
}

/** Build a human-readable label for an edge, making direction explicit. */
function edgeLabel(edge: Edge): { subject: string; type: string; object: string } {
  // The stored record always says: subjectName IS relationshipType OF objectName
  // e.g. "Durairaj is Father of Karuppa Pillai"
  return {
    subject: edge.subjectName,
    type: edge.relationshipType,
    object: edge.objectName,
  };
}

export function RelationChainFinder({ members, allRelationships }: Props) {
  const { t } = useTranslation();
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [chain, setChain] = useState<ChainStep[] | null | "none">(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m.fullName])),
    [members],
  );

  const graph = useMemo(
    () => buildGraph(allRelationships, memberById),
    [allRelationships, memberById],
  );

  function findChain() {
    const fId = parseInt(fromId);
    const tId = parseInt(toId);
    if (!fId || !tId || fId === tId) return;

    const startName = memberById.get(fId) ?? `#${fId}`;
    const result = bfsPath(graph, fId, startName, tId);
    setChain(result ?? "none");
  }

  const sorted = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        {t("familyTree.selectMembersHint")}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("familyTree.from")}</label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger>
              <SelectValue placeholder={t("familyTree.selectFirstMember")} />
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
          <label className="text-sm font-medium text-gray-700">{t("familyTree.to")}</label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger>
              <SelectValue placeholder={t("familyTree.selectSecondMember")} />
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
          className="text-white sm:w-auto w-full"
          style={{ backgroundColor: "hsl(37,100%,50%)" }}
        >
          <Link2 size={16} className="mr-2" />
          {t("familyTree.findChain")}
        </Button>
      </div>

      {/* No path */}
      {chain === "none" && (
        <Card className="p-6 text-center text-gray-500">
          {t("familyTree.noConnectionFound")}
        </Card>
      )}

      {/* Path found */}
      {Array.isArray(chain) && chain.length > 0 && (
        <Card className="p-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            {t("familyTree.connectionChain")} ({chain.length - 1} {chain.length === 2 ? "step" : "steps"})
          </h3>

          {/* Vertical step-by-step layout — unambiguous direction */}
          <div className="space-y-3">
            {chain.map((step, i) => {
              const isLast = i === chain.length - 1;
              const label = step.edge ? edgeLabel(step.edge) : null;

              return (
                <div key={i}>
                  {/* Member pill */}
                  <div className="flex items-center gap-3">
                    <div
                      className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md"
                      style={{ backgroundColor: "hsl(33,100%,48%)" }}
                    >
                      {step.memberName}
                    </div>
                    {/* step number badge */}
                    {i === 0 && (
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Start
                      </span>
                    )}
                    {isLast && (
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        End
                      </span>
                    )}
                  </div>

                  {/* Arrow + relationship sentence */}
                  {label && (
                    <div className="flex items-start gap-2 ml-4 mt-1 mb-1">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-300" />
                        <ArrowRight size={16} className="text-orange-400 rotate-90" />
                        <div className="w-px h-2 bg-gray-300" />
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 max-w-xs">
                        <span className="font-semibold text-orange-700">{label.subject}</span>
                        <span className="text-gray-500"> is </span>
                        <span className="font-semibold text-orange-700">{label.type}</span>
                        <span className="text-gray-500"> of </span>
                        <span className="font-semibold text-orange-700">{label.object}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Initial prompt */}
      {chain === null && (
        <Card className="p-6 text-center text-gray-400 border-dashed">
          {t("familyTree.selectMembersHint")}
        </Card>
      )}
    </div>
  );
}
