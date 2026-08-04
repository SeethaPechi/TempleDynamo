import React from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import { useLocation } from "wouter";

interface ElegantFamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

// ─── Node colours ────────────────────────────────────────────────────────────
const COLORS = {
  center: { bg: "bg-amber-500", border: "border-amber-600", text: "text-white", badge: "bg-amber-700 text-white" },
  ownParents: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", badge: "bg-blue-400 text-white" },
  inLaws: { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-900", badge: "bg-pink-400 text-white" },
  spouse: { bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-900", badge: "bg-rose-400 text-white" },
  children: { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", badge: "bg-green-400 text-white" },
  grandchildren: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", badge: "bg-emerald-400 text-white" },
  grandparents: { bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-900", badge: "bg-violet-400 text-white" },
};

// ─── Single member card ───────────────────────────────────────────────────────
interface NodeCardProps {
  member: Member;
  relationshipType: string;
  colorScheme: typeof COLORS[keyof typeof COLORS];
  isCenter?: boolean;
  onMemberClick?: (id: number) => void;
  displayRelType?: string;
}

function NodeCard({ member, relationshipType, colorScheme, isCenter, onMemberClick, displayRelType }: NodeCardProps) {
  const [, setLocation] = useLocation();
  const firstName = (member.fullName || "?").split(" ")[0];
  const initials = (member.fullName || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleClick = () => {
    if (onMemberClick) {
      onMemberClick(member.id);
    } else {
      setLocation(`/member/${member.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex flex-col items-center cursor-pointer group select-none
        transition-transform duration-150 hover:-translate-y-1
        ${isCenter ? "w-28 sm:w-32" : "w-24 sm:w-28"}
      `}
    >
      {/* Avatar circle */}
      <div
        className={`
          flex items-center justify-center rounded-full overflow-hidden
          border-4 shadow-md group-hover:shadow-xl transition-shadow
          ${colorScheme.border} ${colorScheme.bg}
          ${isCenter ? "w-16 h-16 sm:w-20 sm:h-20" : "w-12 h-12 sm:w-14 sm:h-14"}
        `}
      >
        {member.profilePicture ? (
          <img src={member.profilePicture} alt={member.fullName} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-bold ${colorScheme.text} ${isCenter ? "text-lg" : "text-sm"}`}>
            {isCenter ? "★" : initials}
          </span>
        )}
      </div>

      {/* Name */}
      <p className={`mt-1 font-semibold text-center leading-tight ${colorScheme.text} ${isCenter ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
        {firstName}
      </p>

      {/* Relationship badge */}
      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-center leading-tight ${colorScheme.badge} ${isCenter ? "text-xs" : "text-[10px]"}`}>
        {displayRelType || relationshipType}
      </span>
    </div>
  );
}

// ─── Vertical connector line ──────────────────────────────────────────────────
function VConnector({ color = "border-gray-300" }: { color?: string }) {
  return <div className={`w-0.5 h-6 sm:h-8 border-l-2 ${color} mx-auto`} />;
}

// ─── Horizontal bracket connecting multiple siblings/nodes ────────────────────
function HBracket({ count, color = "border-gray-300" }: { count: number; color?: string }) {
  if (count <= 1) return null;
  return (
    <div className={`h-3 border-t-2 border-l-2 border-r-2 rounded-t-sm ${color} mx-auto`} style={{ width: "80%" }} />
  );
}

// ─── Row of nodes ─────────────────────────────────────────────────────────────
function NodeRow({ nodes, gap = "gap-3 sm:gap-6" }: { nodes: React.ReactNode[]; gap?: string }) {
  return (
    <div className={`flex flex-wrap justify-center items-end ${gap}`}>
      {nodes}
    </div>
  );
}

// ─── Section divider with label ───────────────────────────────────────────────
function GenerationLabel({ label, colorClass = "text-gray-500" }: { label: string; colorClass?: string }) {
  return (
    <p className={`text-center text-[10px] sm:text-xs font-medium uppercase tracking-widest mb-1 ${colorClass}`}>
      {label}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ElegantFamilyTree({ member, relationships, onMemberClick }: ElegantFamilyTreeProps) {
  const { t } = useTranslation();
  const { transformRelationshipType } = useFormDataTransformation();

  // Helper to find all members of certain relationship types
  const byType = (...types: string[]) =>
    relationships.filter((r) => types.includes(r.relationshipType));

  // Own parents
  const fathers = byType("Father", "Step Father");
  const mothers = byType("Mother", "Step Mother");

  // Spouse(s)
  const spouses = byType("Wife", "Husband");

  // In-laws (spouse's parents)
  const filMembers = byType("Father-in-Law");
  const milMembers = byType("Mother-in-Law");

  // Grandparents (own)
  const patGF = byType("Paternal Grandfather");
  const patGM = byType("Paternal Grandmother");
  const matGF = byType("Maternal Grandfather");
  const matGM = byType("Maternal Grandmother");
  const ownGrandparents = [...patGF, ...patGM, ...matGF, ...matGM];

  // Children
  const sons = byType("Son", "Step-Son");
  const daughters = byType("Daughter", "Step-Daughter");
  const children = [...sons, ...daughters];

  // Grandchildren — covers all known variants (including DB typo "Grand Daugher")
  const grandChildren = byType(
    "Grand Son",
    "Grand Daugher",       // DB typo — keep as-is to match stored data
    "Grand Daughter",
    "Grand Son-Son Side",
    "Grand Daughter -Son Side",
    "Grand Son-Daughter Side",
    "Grand Daughter -Daughter Side",
  );

  // Helper to render a relationship-type label for display.
  // For Husband/Wife, derive from the related member's gender so the badge
  // is always correct even if the stored relationship_type is stale.
  const relLabel = (rel: Relationship & { relatedMember: Member }) => {
    if (rel.relationshipType === "Husband" || rel.relationshipType === "Wife") {
      const g = rel.relatedMember?.gender;
      if (g === "Male") return transformRelationshipType("Husband");
      if (g === "Female") return transformRelationshipType("Wife");
    }
    return transformRelationshipType(rel.relationshipType);
  };

  // ── No data state ──────────────────────────────────────────────────────────
  if (relationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {member.fullName} — {t("familyTree.noRelationships", "No relationships yet")}
        </h3>
        <p className="text-gray-500 text-sm">
          {t("Select member menu option and add relationship by clicking Manage Relative button")}
        </p>
      </Card>
    );
  }

  // ── Section: grandparents (own) ────────────────────────────────────────────
  const showGrandparents = ownGrandparents.length > 0;

  // ── Section: parents left, in-laws right ──────────────────────────────────
  const ownParents = [...fathers, ...mothers];
  const inLawParents = [...filMembers, ...milMembers];
  const showParentsRow = ownParents.length > 0 || inLawParents.length > 0;

  // ── Section: spouse ────────────────────────────────────────────────────────
  const showSpouseRow = spouses.length > 0;

  // ── Section: children ─────────────────────────────────────────────────────
  const showChildrenRow = children.length > 0;

  // ── Section: grandchildren ─────────────────────────────────────────────────
  const showGrandchildrenRow = grandChildren.length > 0;

  return (
    <Card className="p-4 sm:p-6 overflow-x-auto">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
        {member.fullName}&apos;s Family Tree
      </h2>
      <p className="text-center text-gray-500 text-sm mb-6">
        {relationships.length} family connections
      </p>

      <div className="min-w-[320px] flex flex-col items-center space-y-0">

        {/* ── ROW 0: Own Grandparents (optional) ─────────────────────────── */}
        {showGrandparents && (
          <>
            <GenerationLabel label="Grandparents" colorClass="text-violet-500" />
            <NodeRow
              nodes={ownGrandparents.map((rel) => (
                <NodeCard
                  key={rel.id}
                  member={rel.relatedMember}
                  relationshipType={rel.relationshipType}
                  displayRelType={relLabel(rel)}
                  colorScheme={COLORS.grandparents}
                  onMemberClick={onMemberClick}
                />
              ))}
            />
            <VConnector color="border-violet-300" />
          </>
        )}

        {/* ── ROW 1: Own Parents (left) + In-laws (right) ─────────────────── */}
        {showParentsRow && (
          <>
            <GenerationLabel label="Parents &amp; In-Laws" colorClass="text-blue-500" />
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
              {/* Own parents cluster */}
              {ownParents.length > 0 && (
                <div className="flex flex-col items-center">
                  <NodeRow
                    nodes={ownParents.map((rel) => (
                      <NodeCard
                        key={rel.id}
                        member={rel.relatedMember}
                        relationshipType={rel.relationshipType}
                        displayRelType={relLabel(rel)}
                        colorScheme={COLORS.ownParents}
                        onMemberClick={onMemberClick}
                      />
                    ))}
                    gap="gap-3 sm:gap-4"
                  />
                  {ownParents.length > 1 && (
                    <div className="w-3/4 h-3 border-t-2 border-blue-300 mt-1" />
                  )}
                </div>
              )}

              {/* In-laws cluster */}
              {inLawParents.length > 0 && (
                <div className="flex flex-col items-center">
                  <NodeRow
                    nodes={inLawParents.map((rel) => (
                      <NodeCard
                        key={rel.id}
                        member={rel.relatedMember}
                        relationshipType={rel.relationshipType}
                        displayRelType={relLabel(rel)}
                        colorScheme={COLORS.inLaws}
                        onMemberClick={onMemberClick}
                      />
                    ))}
                    gap="gap-3 sm:gap-4"
                  />
                  {inLawParents.length > 1 && (
                    <div className="w-3/4 h-3 border-t-2 border-pink-300 mt-1" />
                  )}
                </div>
              )}
            </div>
            <VConnector color="border-gray-300" />
          </>
        )}

        {/* ── ROW 2: Member ★ + Spouse ─────────────────────────────────────── */}
        <GenerationLabel label="You &amp; Spouse" colorClass="text-amber-600" />
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
          {/* Member node */}
          <NodeCard
            member={member}
            relationshipType="Self"
            displayRelType="You ★"
            colorScheme={COLORS.center}
            isCenter
            onMemberClick={onMemberClick}
          />

          {/* Heart connector(s) between member and each spouse */}
          {spouses.map((rel, idx) => (
            <React.Fragment key={rel.id}>
              <div className="flex flex-col items-center">
                <span className="text-rose-500 text-xl sm:text-2xl leading-none">♥</span>
                <div className="w-6 h-0.5 bg-rose-400 mt-0.5" />
              </div>
              <div className="flex flex-col items-center">
                {spouses.length > 1 && (
                  <span className="text-[9px] font-semibold text-rose-500 uppercase tracking-wide mb-0.5">
                    {idx === 0 ? "1st Marriage" : `${idx + 1}${idx === 1 ? "nd" : idx === 2 ? "rd" : "th"} Marriage`}
                  </span>
                )}
                <NodeCard
                  member={rel.relatedMember}
                  relationshipType={rel.relationshipType}
                  displayRelType={relLabel(rel)}
                  colorScheme={COLORS.spouse}
                  onMemberClick={onMemberClick}
                />
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── ROW 3: Children ──────────────────────────────────────────────── */}
        {showChildrenRow && (
          <>
            <VConnector color="border-green-400" />
            <GenerationLabel label="Children" colorClass="text-green-600" />
            <div className="relative flex flex-col items-center w-full">
              {children.length > 1 && (
                <div
                  className="border-t-2 border-green-300 mb-0"
                  style={{ width: `${Math.min(children.length * 90, 600)}px`, maxWidth: "90%" }}
                />
              )}
              <NodeRow
                nodes={children.map((rel) => (
                  <NodeCard
                    key={rel.id}
                    member={rel.relatedMember}
                    relationshipType={rel.relationshipType}
                    displayRelType={relLabel(rel)}
                    colorScheme={COLORS.children}
                    onMemberClick={onMemberClick}
                  />
                ))}
              />
            </div>
          </>
        )}

        {/* ── ROW 4: Grandchildren ─────────────────────────────────────────── */}
        {showGrandchildrenRow && (
          <>
            <VConnector color="border-emerald-400" />
            <GenerationLabel label="Grandchildren" colorClass="text-emerald-600" />
            <div className="relative flex flex-col items-center w-full">
              {grandChildren.length > 1 && (
                <div
                  className="border-t-2 border-emerald-300 mb-0"
                  style={{ width: `${Math.min(grandChildren.length * 80, 600)}px`, maxWidth: "90%" }}
                />
              )}
              <NodeRow
                nodes={grandChildren.map((rel) => (
                  <NodeCard
                    key={rel.id}
                    member={rel.relatedMember}
                    relationshipType={rel.relationshipType}
                    displayRelType={relLabel(rel)}
                    colorScheme={COLORS.grandchildren}
                    onMemberClick={onMemberClick}
                  />
                ))}
              />
            </div>
          </>
        )}

        {/* ── Colour legend ───────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-gray-600">
          {[
            { color: "bg-violet-300", label: "Grandparents" },
            { color: "bg-blue-300", label: "Parents" },
            { color: "bg-pink-300", label: "In-Laws" },
            { color: "bg-amber-400", label: "You" },
            { color: "bg-rose-300", label: "Spouse" },
            { color: "bg-green-300", label: "Children" },
            { color: "bg-emerald-200", label: "Grandchildren" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full ${color} inline-block`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
