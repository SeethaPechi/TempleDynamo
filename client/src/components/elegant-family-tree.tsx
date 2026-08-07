import React from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import { useLocation } from "wouter";
import { withHonorific } from "@/lib/honorific";

interface ElegantFamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

// ─── Node colours ────────────────────────────────────────────────────────────
const COLORS = {
  center:  { bg: "bg-amber-500",  border: "border-amber-600",  text: "text-white",       badge: "bg-amber-700 text-white" },
  male:    { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-900",    badge: "bg-blue-500 text-white" },
  female:  { bg: "bg-pink-100",   border: "border-pink-400",   text: "text-pink-900",    badge: "bg-pink-500 text-white" },
  neutral: { bg: "bg-gray-100",   border: "border-gray-400",   text: "text-gray-700",    badge: "bg-gray-400 text-white" },
};

/** Pick male/female/neutral scheme from a member's gender */
function genderScheme(gender: string | null | undefined): typeof COLORS[keyof typeof COLORS] {
  if (gender === "Female") return COLORS.female;
  if (gender === "Male")   return COLORS.male;
  return COLORS.neutral;
}

// ─── Single member card ───────────────────────────────────────────────────────
interface NodeCardProps {
  member: Member;
  relationshipType: string;
  colorScheme: typeof COLORS[keyof typeof COLORS];
  isCenter?: boolean;
  onMemberClick?: (id: number) => void;
  displayRelType?: string;
  birthOrder?: number | null;
}

function NodeCard({ member, relationshipType, colorScheme, isCenter, onMemberClick, displayRelType, birthOrder }: NodeCardProps) {
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
      {/* Birth-order number (shown only when provided) */}
      {birthOrder != null && (
        <span className="mb-0.5 text-[10px] font-bold text-white bg-green-600 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          {birthOrder}
        </span>
      )}

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

  // Siblings — sorted oldest to youngest (lower birthOrder = elder; nulls last)
  const siblings = byType(
    "Elder Brother", "Elder Sister",
    "Younger Brother", "Younger Sister",
    "Step-Brother", "Step-Sister",
  ).sort((a, b) => {
    const ao = (a.relatedMember as any).birthOrder ?? Infinity;
    const bo = (b.relatedMember as any).birthOrder ?? Infinity;
    return ao - bo;
  });

  // Children — sorted oldest to youngest
  const sons = byType("Son", "Step-Son");
  const daughters = byType("Daughter", "Step-Daughter");
  const children = [...sons, ...daughters].sort((a, b) => {
    const ao = (a.relatedMember as any).birthOrder ?? Infinity;
    const bo = (b.relatedMember as any).birthOrder ?? Infinity;
    return ao - bo;
  });

  // Grandchildren — sorted oldest to youngest
  const grandChildren = byType(
    "Grand Son",
    "Grand Daugher",       // DB typo — keep as-is to match stored data
    "Grand Daughter",
    "Grand Son-Son Side",
    "Grand Daughter -Son Side",
    "Grand Son-Daughter Side",
    "Grand Daughter -Daughter Side",
  ).sort((a, b) => {
    const ao = (a.relatedMember as any).birthOrder ?? Infinity;
    const bo = (b.relatedMember as any).birthOrder ?? Infinity;
    return ao - bo;
  });

  // Helper to render a relationship-type label for display.
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
          {withHonorific(member.fullName, member.gender, member.maritalStatus)} — {t("familyTree.noRelationships", "No relationships yet")}
        </h3>
        <p className="text-gray-500 text-sm">
          {t("Select member menu option and add relationship by clicking Manage Relative button")}
        </p>
      </Card>
    );
  }

  // ── Visibility flags ───────────────────────────────────────────────────────
  const showGrandparents   = ownGrandparents.length > 0;
  const ownParents         = [...fathers, ...mothers];
  const inLawParents       = [...filMembers, ...milMembers];
  const showParentsRow     = ownParents.length > 0 || inLawParents.length > 0;
  const showSiblingsRow    = siblings.length > 0;
  const showChildrenRow    = children.length > 0;
  const showGrandchildrenRow = grandChildren.length > 0;

  return (
    <Card className="p-4 sm:p-6 overflow-x-auto">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
        {withHonorific(member.fullName, member.gender, member.maritalStatus)}&apos;s Family Tree
      </h2>
      <p className="text-center text-gray-500 text-sm mb-6">
        {relationships.length} family connections
      </p>

      <div className="min-w-[320px] flex flex-col items-center space-y-0">

        {/* ── ROW 0: Own Grandparents ─────────────────────────────────────── */}
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
                  colorScheme={genderScheme(rel.relatedMember.gender)}
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
                        colorScheme={genderScheme(rel.relatedMember.gender)}
                        onMemberClick={onMemberClick}
                      />
                    ))}
                    gap="gap-3 sm:gap-4"
                  />
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
                        colorScheme={genderScheme(rel.relatedMember.gender)}
                        onMemberClick={onMemberClick}
                      />
                    ))}
                    gap="gap-3 sm:gap-4"
                  />
                </div>
              )}
            </div>
            <VConnector color="border-gray-300" />
          </>
        )}

        {/* ── ROW 2: [Siblings adjacent] | [Focused Member ★] [♥ Spouses] ── */}
        <GenerationLabel label="Focused Member &amp; Spouse" colorClass="text-amber-600" />
        <div className="flex flex-wrap justify-center items-start gap-3 sm:gap-5 w-full">

          {/* Siblings cluster — sits left of / adjacent to the focused member */}
          {showSiblingsRow && (
            <>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-yellow-700 mb-1 border-b border-dashed border-yellow-400 pb-0.5">
                  Siblings
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {siblings.map((rel, idx) => (
                    <NodeCard
                      key={rel.id}
                      member={rel.relatedMember}
                      relationshipType={rel.relationshipType}
                      displayRelType={relLabel(rel)}
                      colorScheme={genderScheme(rel.relatedMember.gender)}
                      onMemberClick={onMemberClick}
                      birthOrder={idx + 1}
                    />
                  ))}
                </div>
              </div>
              {/* Dashed vertical divider */}
              <div className="self-stretch flex items-center py-2">
                <div className="h-full border-l-2 border-dashed border-yellow-300 mx-1 min-h-[60px]" />
              </div>
            </>
          )}

          {/* Focused member + spouses */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
            <NodeCard
              member={member}
              relationshipType="Self"
              displayRelType="Focused Member ★"
              colorScheme={COLORS.center}
              isCenter
              onMemberClick={onMemberClick}
            />

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
                    colorScheme={genderScheme(rel.relatedMember.gender)}
                    onMemberClick={onMemberClick}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
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
                nodes={children.map((rel, idx) => (
                  <NodeCard
                    key={rel.id}
                    member={rel.relatedMember}
                    relationshipType={rel.relationshipType}
                    displayRelType={relLabel(rel)}
                    colorScheme={genderScheme(rel.relatedMember.gender)}
                    onMemberClick={onMemberClick}
                    birthOrder={idx + 1}
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
                    colorScheme={genderScheme(rel.relatedMember.gender)}
                    onMemberClick={onMemberClick}
                    birthOrder={(rel.relatedMember as any).birthOrder}
                  />
                ))}
              />
            </div>
          </>
        )}

        {/* ── Colour legend ───────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-gray-600">
          {[
            { color: "bg-amber-400",  label: "Focused Member" },
            { color: "bg-blue-300",   label: "Male" },
            { color: "bg-pink-300",   label: "Female" },
            { color: "bg-gray-200",   label: "Unknown Gender" },
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
