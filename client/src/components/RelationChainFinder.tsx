/**
 * RelationChainFinder
 * Pick two members and see the shortest connection chain between them.
 * Edge labels always read from the perspective of the CURRENT step person:
 *   "Durairaj is Son of Karuppa Pillai"  (not "Karuppa Pillai is Father of Durairaj")
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { withHonorific } from "@/lib/honorific";
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
  /**
   * true  = forward traversal: fromPerson IS the stored subject (memberId)
   * false = backward traversal: fromPerson IS the stored object (relatedMemberId)
   */
  isForward: boolean;
  subjectId: number;
  subjectName: string;
  subjectGender: string | null | undefined;
  objectId: number;
  objectName: string;
  objectGender: string | null | undefined;
}

interface ChainStep {
  memberId: number;
  memberName: string;
  edge?: Edge;
}

// ---------------------------------------------------------------------------
// Inverse relationship map — used when traversing an edge BACKWARDS
// (the "from" person is the stored *object*, not the stored *subject*)
// ---------------------------------------------------------------------------
function getInverseType(type: string, fromGender?: string | null): string {
  const M = fromGender === "Male";
  const F = fromGender === "Female";

  const map: Record<string, string> = {
    "Father":            M ? "Son"              : F ? "Daughter"        : "Child",
    "Mother":            M ? "Son"              : F ? "Daughter"        : "Child",
    "Son":               M ? "Father"           : F ? "Mother"          : "Parent",
    "Daughter":          M ? "Father"           : F ? "Mother"          : "Parent",
    "Husband":           "Wife",
    "Wife":              "Husband",
    "Elder Brother":     M ? "Younger Brother"  : F ? "Younger Sister"  : "Younger Sibling",
    "Younger Brother":   M ? "Elder Brother"    : F ? "Elder Sister"    : "Elder Sibling",
    "Elder Sister":      M ? "Younger Brother"  : F ? "Younger Sister"  : "Younger Sibling",
    "Younger Sister":    M ? "Elder Brother"    : F ? "Elder Sister"    : "Elder Sibling",
    "Brother-in-Law":    M ? "Brother-in-Law"   : F ? "Sister-in-Law"   : "Sibling-in-Law",
    "Sister-in-Law":     M ? "Brother-in-Law"   : F ? "Sister-in-Law"   : "Sibling-in-Law",
    "Father-in-Law":     M ? "Son-in-Law"       : F ? "Daughter-in-Law" : "Child-in-Law",
    "Mother-in-Law":     M ? "Son-in-Law"       : F ? "Daughter-in-Law" : "Child-in-Law",
    "Son-in-Law":        M ? "Father-in-Law"    : F ? "Mother-in-Law"   : "Parent-in-Law",
    "Daughter-in-Law":   M ? "Father-in-Law"    : F ? "Mother-in-Law"   : "Parent-in-Law",
    "Paternal Grandfather":   M ? "Grand Son"   : F ? "Grand Daugher"   : "Grandchild",
    "Paternal Grandmother":   M ? "Grand Son"   : F ? "Grand Daugher"   : "Grandchild",
    "Maternal Grandfather":   M ? "Grand Son"   : F ? "Grand Daugher"   : "Grandchild",
    "Maternal Grandmother":   M ? "Grand Son"   : F ? "Grand Daugher"   : "Grandchild",
    "Grand Son":         M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Daugher":     M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Son-Son Side":M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Paternal Uncle":    M ? "Nephew"           : F ? "Niece"           : "Nephew/Niece",
    "Paternal Aunt":     M ? "Nephew"           : F ? "Niece"           : "Nephew/Niece",
    "Aunt-Father Side":  M ? "Nephew"           : F ? "Niece"           : "Nephew/Niece",
  };

  return map[type] ?? type; // fall back to the stored type if unknown
}

// ---------------------------------------------------------------------------
// Graph builder
// ---------------------------------------------------------------------------
function buildGraph(
  allRelationships: Array<Relationship & { relatedMember: Member }>,
  memberById: Map<number, Member>,
): Map<number, Edge[]> {
  const graph = new Map<number, Edge[]>();

  const add = (fromId: number, edge: Edge) => {
    if (!graph.has(fromId)) graph.set(fromId, []);
    graph.get(fromId)!.push(edge);
  };

  for (const rel of allRelationships) {
    const subject = memberById.get(rel.memberId);
    const object  = memberById.get(rel.relatedMemberId);

    const subjectName   = withHonorific(subject?.fullName ?? `#${rel.memberId}`, subject?.gender, subject?.maritalStatus);
    const objectName    = withHonorific(rel.relatedMember.fullName, rel.relatedMember.gender, rel.relatedMember.maritalStatus);
    const subjectGender = subject?.gender;
    const objectGender  = object?.gender ?? rel.relatedMember.gender;

    // Forward: memberId → relatedMemberId
    add(rel.memberId, {
      toId: rel.relatedMemberId,
      toName: objectName,
      relationshipType: rel.relationshipType,
      isForward: true,
      subjectId: rel.memberId,     subjectName,   subjectGender,
      objectId:  rel.relatedMemberId, objectName, objectGender,
    });

    // Reverse: relatedMemberId → memberId
    add(rel.relatedMemberId, {
      toId: rel.memberId,
      toName: subjectName,
      relationshipType: rel.relationshipType,
      isForward: false,
      subjectId: rel.memberId,     subjectName,   subjectGender,
      objectId:  rel.relatedMemberId, objectName, objectGender,
    });
  }

  return graph;
}

// ---------------------------------------------------------------------------
// BFS
// ---------------------------------------------------------------------------
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
    for (const edge of graph.get(current) ?? []) {
      if (visited.has(edge.toId)) continue;
      visited.add(edge.toId);

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

// ---------------------------------------------------------------------------
// Label helper — always reads from the perspective of the FROM person
//
// DB semantics: (member, type, related) means "member's [type] is related"
//   i.e. the related person IS [type] OF the member.
//
// Forward  (BFS walks member → related):
//   from=member, to=related
//   The type tells us what "related" is to "member", so from the member's
//   perspective we need the INVERSE: "member is [inverse(type)] of related"
//
// Backward (BFS walks related → member):
//   from=related, to=member
//   The type directly says what "related" is to "member", so no inversion:
//   "related is [type] of member"
// ---------------------------------------------------------------------------
function edgeLabel(edge: Edge): { subject: string; relType: string; object: string } {
  if (edge.isForward) {
    // FROM = member (subject). Type describes "what related IS to member",
    // so invert to express from the member's own perspective.
    const fromGender = edge.subjectGender;
    return {
      subject: edge.subjectName,
      relType: getInverseType(edge.relationshipType, fromGender),
      object:  edge.objectName,
    };
  } else {
    // FROM = related (object). Type directly describes "what from-person IS to to-person".
    // No inversion needed.
    return {
      subject: edge.objectName,
      relType: edge.relationshipType,
      object:  edge.subjectName,
    };
  }
}

// ---------------------------------------------------------------------------
// Via-note helper — finds the intermediate person for multi-hop relationships
// so the chain can show "(via [name])" for grandparent and in-law steps.
//
// DB semantics reminder: (member_id=M, type=T, related_member_id=R) means
// "R is T of M". So r.relatedMember is always the R side.
// ---------------------------------------------------------------------------
function getViaNote(
  edge: Edge,
  allRelationships: Array<Relationship & { relatedMember: Member }>,
  memberById: Map<number, Member>,
): { id: number; name: string } | null {
  const { relationshipType, subjectId, objectId } = edge;

  // ---- Shared lookup helpers -------------------------------------------

  /** Spouses of `id` — returns {id, name} for each Wife/Husband row. */
  const spousesOf = (id: number) =>
    allRelationships
      .filter(r => r.memberId === id &&
        (r.relationshipType === "Wife" || r.relationshipType === "Husband"))
      .map(r => ({ id: r.relatedMemberId, name: r.relatedMember.fullName }));

  /**
   * True when `childId` is a child of `parentId`, checked in both
   * storage directions:
   *   Dir-1: (member=child, type=Father|Mother, related=parent)
   *   Dir-2: (member=parent, type=Son|Daughter, related=child)
   */
  const isChildOf = (childId: number, parentId: number): boolean =>
    allRelationships.some(r =>
      r.memberId === childId &&
      (r.relationshipType === "Father" || r.relationshipType === "Mother") &&
      r.relatedMemberId === parentId
    ) ||
    allRelationships.some(r =>
      r.memberId === parentId &&
      (r.relationshipType === "Son" || r.relationshipType === "Daughter") &&
      r.relatedMemberId === childId
    );

  /**
   * True when `aId` and `bId` are siblings, checked in both directions.
   */
  const sibTypes = ["Elder Brother", "Younger Brother", "Elder Sister", "Younger Sister"];
  const isSiblingOf = (aId: number, bId: number): boolean =>
    allRelationships.some(r =>
      r.memberId === aId && sibTypes.includes(r.relationshipType) && r.relatedMemberId === bId
    ) ||
    allRelationships.some(r =>
      r.memberId === bId && sibTypes.includes(r.relationshipType) && r.relatedMemberId === aId
    );

  /**
   * Returns the name of a child of `parentId` who is also a spouse of
   * `spouseOfId`. Scans BOTH storage directions for the parent→child edge:
   *
   *   Dir-1: (member=parentId, type=Son|Daughter, related=child)
   *          → child id = r.relatedMemberId, name from r.relatedMember
   *   Dir-2: (member=child, type=Father|Mother, related=parentId)
   *          → child id = r.memberId, name from memberById
   *
   * Then checks spouse relationship in both directions.
   */
  const connectingChildSpouse = (parentId: number, spouseOfId: number): { id: number; name: string } | null => {
    // Dir-1: parent has Son/Daughter → child rows
    const dir1 = allRelationships
      .filter(r =>
        r.memberId === parentId &&
        (r.relationshipType === "Son" || r.relationshipType === "Daughter"))
      .map(r => ({ id: r.relatedMemberId, name: r.relatedMember.fullName }));

    // Dir-2: child has Father/Mother = parent rows
    // memberId is the child; use memberById for the child's name
    const dir2 = allRelationships
      .filter(r =>
        r.relatedMemberId === parentId &&
        (r.relationshipType === "Father" || r.relationshipType === "Mother"))
      .map(r => ({
        id: r.memberId,
        name: memberById.get(r.memberId)?.fullName ?? `#${r.memberId}`,
      }));

    // Merge, dedup by id
    const seen = new Set<number>();
    const children: { id: number; name: string }[] = [];
    for (const c of [...dir1, ...dir2]) {
      if (!seen.has(c.id)) { seen.add(c.id); children.push(c); }
    }

    // For each child, check spouse relationship in both directions
    for (const child of children) {
      const isSpouseOfTarget =
        allRelationships.some(r =>
          r.memberId === child.id &&
          (r.relationshipType === "Wife" || r.relationshipType === "Husband") &&
          r.relatedMemberId === spouseOfId
        ) ||
        allRelationships.some(r =>
          r.memberId === spouseOfId &&
          (r.relationshipType === "Wife" || r.relationshipType === "Husband") &&
          r.relatedMemberId === child.id
        );
      if (isSpouseOfTarget) return child;
    }

    // Final fallback: spouseOfId's spouses who are children of parentId
    for (const sp of spousesOf(spouseOfId)) {
      if (isChildOf(sp.id, parentId)) return sp;
    }

    return null;
  };

  // ---- Grandparent types: subjectId = grandchild, objectId = grandparent --
  const grandparentTypes = [
    "Paternal Grandfather", "Paternal Grandmother",
    "Maternal Grandfather", "Maternal Grandmother",
  ];
  if (grandparentTypes.includes(relationshipType)) {
    const parentType = relationshipType.startsWith("Paternal") ? "Father" : "Mother";
    const parentRel = allRelationships.find(
      r => r.memberId === subjectId && r.relationshipType === parentType
    );
    if (parentRel) return { id: parentRel.relatedMemberId, name: parentRel.relatedMember.fullName };
  }

  // ---- Grandchild types: subjectId = grandparent, objectId = grandchild --
  const grandchildTypes = ["Grand Son", "Grand Daugher", "Grand Son-Son Side"];
  if (grandchildTypes.includes(relationshipType)) {
    const parentRel = allRelationships.find(
      r => r.memberId === objectId && r.relationshipType === "Father"
    );
    if (parentRel) return { id: parentRel.relatedMemberId, name: parentRel.relatedMember.fullName };
  }

  // ---- Brother-in-Law / Sister-in-Law ------------------------------------
  if (relationshipType === "Brother-in-Law" || relationshipType === "Sister-in-Law") {
    // Case 1: subjectId's spouse who is sibling of objectId
    for (const sp of spousesOf(subjectId)) {
      if (isSiblingOf(sp.id, objectId)) return sp;
    }
    // Case 2: objectId's spouse who is sibling of subjectId
    for (const sp of spousesOf(objectId)) {
      if (isSiblingOf(sp.id, subjectId)) return sp;
    }
  }

  // ---- Father-in-Law / Mother-in-Law -------------------------------------
  // "objectId is Father/Mother-in-Law of subjectId"
  // → connecting person = child of objectId who married subjectId
  if (["Father-in-Law", "Mother-in-Law"].includes(relationshipType)) {
    const person = connectingChildSpouse(objectId, subjectId);
    if (person) return person;
  }

  // ---- Son-in-Law / Daughter-in-Law --------------------------------------
  // "objectId is Son/Daughter-in-Law of subjectId"
  // → connecting person = child of subjectId who married objectId
  if (["Son-in-Law", "Daughter-in-Law"].includes(relationshipType)) {
    const person = connectingChildSpouse(subjectId, objectId);
    if (person) return person;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RelationChainFinder({ members, allRelationships }: Props) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [chain, setChain] = useState<ChainStep[] | null | "none">(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
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

    const startName = memberById.get(fId)?.fullName ?? `#${fId}`;
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
                  {withHonorific(m.fullName, m.gender, m.maritalStatus)}
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
                  {withHonorific(m.fullName, m.gender, m.maritalStatus)}
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

      {chain === "none" && (
        <Card className="p-6 text-center text-gray-500">
          {t("familyTree.noConnectionFound")}
        </Card>
      )}

      {Array.isArray(chain) && chain.length > 0 && (
        <Card className="p-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            {t("familyTree.connectionChain")} ({chain.length - 1}{" "}
            {chain.length === 2 ? "step" : "steps"})
          </h3>

          <div className="space-y-3">
            {chain.map((step, i) => {
              const isLast = i === chain.length - 1;
              const label = step.edge ? edgeLabel(step.edge) : null;
              const via = step.edge ? getViaNote(step.edge, allRelationships, memberById) : null;

              return (
                <div key={i}>
                  {/* ── Main chain node ── */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLocation(`/member/${step.memberId}`)}
                      className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                      style={{ backgroundColor: "hsl(33,100%,48%)" }}
                    >
                      {step.memberName}
                    </button>
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

                  {/* ── Edge label + optional connecting-member node ── */}
                  {label && (
                    <div className="flex items-start gap-2 ml-4 mt-1 mb-1">
                      <div className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-300" />
                        <ArrowRight size={16} className="text-orange-400 rotate-90" />
                        <div className="w-px h-2 bg-gray-300" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* Relationship label card */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 max-w-xs">
                          <span className="font-semibold text-orange-700">{label.subject}</span>
                          <span className="text-gray-500"> is </span>
                          <span className="font-semibold text-orange-700">{label.relType}</span>
                          <span className="text-gray-500"> of </span>
                          <span className="font-semibold text-orange-700">{label.object}</span>
                        </div>

                        {/* Connecting member — clickable pill that opens their profile */}
                        {via && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setLocation(`/member/${via.id}`)}
                              className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold text-amber-900 shadow-sm border border-amber-400 hover:border-amber-500 hover:bg-amber-200 active:scale-95 transition-all cursor-pointer"
                              style={{ backgroundColor: "hsl(45,100%,88%)" }}
                            >
                              {via.name}
                            </button>
                            <span className="text-[11px] text-amber-700 font-medium">
                              (connecting member)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {chain === null && (
        <Card className="p-6 text-center text-gray-400 border-dashed">
          {t("familyTree.selectMembersHint")}
        </Card>
      )}
    </div>
  );
}
