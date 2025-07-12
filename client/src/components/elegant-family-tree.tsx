import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, User, Users } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";

interface ElegantFamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface FamilyNode {
  member: Member;
  relationshipType: string;
  position: { x: number; y: number };
  color: string;
  isCenter?: boolean;
}

export function ElegantFamilyTree({
  member,
  relationships,
  onMemberClick,
}: ElegantFamilyTreeProps) {
  const { t } = useTranslation();
  const { transformMemberData, transformRelationshipType } =
    useFormDataTransformation();

  // Color scheme for different relationships
  const getRelationshipColor = (relationshipType: string): string => {
    const colors: Record<string, string> = {
      // Parents
      Father: "#4F46E5", // Blue
      Mother: "#EC4899", // Pink
      "Step Father": "#5B21B6", // Purple
      "Step Mother": "#DB2777", // Dark Pink
      
      // Spouse
      Wife: "#EF4444", // Red
      Husband: "#3B82F6", // Blue
      
      // Children
      Son: "#10B981", // Green
      Daughter: "#F59E0B", // Amber
      "Step-Son": "#059669", // Dark Green
      "Step-Daughter": "#D97706", // Dark Amber
      
      // Siblings
      "Elder Brother": "#8B5CF6", // Purple
      "Elder Sister": "#F97316", // Orange
      "Younger Brother": "#06B6D4", // Cyan
      "Younger Sister": "#84CC16", // Lime
      "Step-Brother": "#7C3AED", // Dark Purple
      "Step-Sister": "#EA580C", // Dark Orange
      
      // Grandparents
      "Paternal Grandfather": "#1F2937", // Dark Gray
      "Paternal Grandmother": "#6B7280", // Gray
      "Maternal Grandfather": "#374151", // Medium Gray
      "Maternal Grandmother": "#9CA3AF", // Light Gray
      
      // Grandchildren
      "Grand Daughter -Son Side": "#14B8A6", // Teal
      "Grand Son-Son Side": "#0891B2", // Sky
      "Grand Daughter -Daughter Side": "#0D9488", // Dark Teal
      "Grand Son-Daughter Side": "#0E7490", // Dark Sky
      
      // In-Laws
      "Father-in-Law": "#7C2D12", // Brown
      "Mother-in-Law": "#92400E", // Light Brown
      "Brother-in-Law": "#A16207", // Yellow Brown
      "Sister-in-Law": "#B45309", // Orange Brown
      "Son-in-Law": "#C2410C", // Red Brown
      "Daughter-in-Law": "#DC2626", // Red
      
      // Extended Family
      Uncle: "#7E22CE", // Purple
      Aunt: "#A21CAF", // Magenta
      Nephew: "#BE185D", // Pink
      Niece: "#C2185B", // Dark Pink
      Cousin: "#1565C0", // Blue
      
      // Other Family Connections
      "Family Friend": "#6B7280", // Gray
      Godfather: "#4B5563", // Dark Gray
      Godmother: "#6B7280", // Gray
      Guardian: "#374151", // Medium Gray
    };
    return colors[relationshipType] || "#6B7280";
  };

  // Arrange family members in a compact tree structure that fits within viewBox
  const arrangeFamilyNodes = (): FamilyNode[] => {
    const nodes: FamilyNode[] = [];
    const centerX = 500;
    const centerY = 350;
    const baseSpacing = 140; // Reduced spacing to fit more members

    // Add the main member at the center
    nodes.push({
      member,
      relationshipType: "Self",
      position: { x: centerX, y: centerY },
      color: "#DC2626", // Red for self
      isCenter: true,
    });

    // Group relationships by type and position them
    const groupedRelationships = relationships.reduce(
      (acc, rel) => {
        const type = rel.relationshipType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(rel);
        return acc;
      },
      {} as Record<string, Array<Relationship & { relatedMember: Member }>>,
    );

    // Position grandparents at the top (compact layout)
    const grandparents = [
      "Paternal Grandfather",
      "Paternal Grandmother",
      "Maternal Grandfather",
      "Maternal Grandmother",
    ];
    let gpIndex = 0;
    grandparents.forEach((gpType) => {
      if (groupedRelationships[gpType]) {
        groupedRelationships[gpType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: gpType,
            position: { x: 200 + gpIndex * 200, y: 120 },
            color: getRelationshipColor(gpType),
          });
          gpIndex++;
        });
      }
    });

    // Position parents above center
    const parents = ["Father", "Mother"];
    let parentIndex = 0;
    parents.forEach((parentType) => {
      if (groupedRelationships[parentType]) {
        groupedRelationships[parentType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: parentType,
            position: { x: 350 + parentIndex * 200, y: 220 },
            color: getRelationshipColor(parentType),
          });
          parentIndex++;
        });
      }
    });

    // Position spouse next to center
    const spouses = ["Wife", "Husband"];
    spouses.forEach((spouseType) => {
      if (groupedRelationships[spouseType]) {
        groupedRelationships[spouseType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: spouseType,
            position: { x: centerX + 150, y: centerY },
            color: getRelationshipColor(spouseType),
          });
        });
      }
    });

    // Position siblings on the sides (more compact)
    const siblings = [
      "Elder Brother",
      "Elder Sister",
      "Younger Brother",
      "Younger Sister",
    ];
    let siblingIndex = 0;
    siblings.forEach((siblingType) => {
      if (groupedRelationships[siblingType]) {
        groupedRelationships[siblingType].forEach((rel) => {
          const isLeft = siblingIndex % 2 === 0;
          const verticalOffset = Math.floor(siblingIndex / 2) * 80;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: siblingType,
            position: {
              x: centerX + (isLeft ? -200 : 200),
              y: centerY - 30 + verticalOffset,
            },
            color: getRelationshipColor(siblingType),
          });
          siblingIndex++;
        });
      }
    });

    // Position children below center in a row
    const children = ["Son", "Daughter"];
    let childIndex = 0;
    children.forEach((childType) => {
      if (groupedRelationships[childType]) {
        groupedRelationships[childType].forEach((rel) => {
          // Calculate position to center children row
          const totalChildren =
            (groupedRelationships["Son"] || []).length +
            (groupedRelationships["Daughter"] || []).length;
          const startX = centerX - ((totalChildren - 1) * 100) / 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: childType,
            position: { x: startX + childIndex * 100, y: centerY + 150 },
            color: getRelationshipColor(childType),
          });
          childIndex++;
        });
      }
    });

    return nodes;
  };

  const familyNodes = arrangeFamilyNodes();

  // Render connection lines between related members
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    const centerNode = familyNodes.find((node) => node.isCenter);
    if (!centerNode) return connections;

    familyNodes.forEach((node, index) => {
      if (node.isCenter) return;

      // Draw line from center to each family member
      connections.push(
        <line
          key={`line-${index}`}
          x1={centerNode.position.x}
          y1={centerNode.position.y}
          x2={node.position.x}
          y2={node.position.y}
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />,
      );

      // Add heart symbol for spouse connections
      if (
        node.relationshipType === "Wife" ||
        node.relationshipType === "Husband"
      ) {
        const midX = (centerNode.position.x + node.position.x) / 2;
        const midY = (centerNode.position.y + node.position.y) / 2;
        connections.push(
          <g key={`heart-${index}`}>
            <circle cx={midX} cy={midY} r="15" fill="#EF4444" />
            <text
              x={midX}
              y={midY + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
            >
              ♥
            </text>
          </g>,
        );
      }
    });

    return connections;
  };

  // Render individual family member node with click to member details
  const renderMemberNode = (node: FamilyNode, index: number) => {
    const transformedMember = transformMemberData(node.member);
    const initials =
      node.member.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2) || "??";
    const radius = node.isCenter ? 40 : 30; // Optimized size for compact layout
    const firstName = node.member.fullName?.split(" ")[0] || "Unknown";

    return (
      <g
        key={`node-${index}`}
        className="cursor-pointer group"
        onClick={() => onMemberClick?.(node.member.id)}
      >
        {/* Member circle with enhanced styling */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={radius}
          fill={node.color}
          stroke="white"
          strokeWidth="3"
          className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          filter="url(#dropshadow)"
        />

        {/* Hover ring effect */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={radius + 8}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          strokeDasharray="5,5"
        />

        {/* Member initials with better contrast */}
        <text
          x={node.position.x}
          y={node.position.y + 5}
          textAnchor="middle"
          fill="white"
          fontSize={node.isCenter ? "16" : "12"}
          fontWeight="bold"
          stroke="#000"
          strokeWidth="0.3"
        >
          {initials}
        </text>

        {/* Compact name background */}
        <rect
          x={node.position.x - Math.min(firstName.length * 3.5, 30)}
          y={node.position.y + radius + 8}
          width={Math.min(firstName.length * 7, 60)}
          height="16"
          fill="white"
          fillOpacity="0.95"
          rx="8"
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Member name - truncated if needed */}
        <text
          x={node.position.x}
          y={node.position.y + radius + 20}
          textAnchor="middle"
          fill="#1F2937"
          fontSize="11"
          fontWeight="600"
        >
          {firstName.length > 8 ? firstName.substring(0, 8) + ".." : firstName}
        </text>

        {/* Relationship type with compact background */}
        {!node.isCenter && (
          <>
            <rect
              x={
                node.position.x -
                Math.min(
                  transformRelationshipType(node.relationshipType).length * 2.5,
                  25,
                )
              }
              y={node.position.y + radius + 28}
              width={Math.min(
                transformRelationshipType(node.relationshipType).length * 5,
                50,
              )}
              height="14"
              fill="rgba(107, 114, 128, 0.1)"
              rx="7"
              stroke="#D1D5DB"
              strokeWidth="0.5"
            />
            <text
              x={node.position.x}
              y={node.position.y + radius + 38}
              textAnchor="middle"
              fill="#4B5563"
              fontSize="9"
              fontWeight="500"
            >
              {transformRelationshipType(node.relationshipType).length > 10
                ? transformRelationshipType(node.relationshipType).substring(
                    0,
                    10,
                  ) + ".."
                : transformRelationshipType(node.relationshipType)}
            </text>
          </>
        )}

        {/* Edit icon for quick access */}
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <circle
            cx={node.position.x + radius - 8}
            cy={node.position.y - radius + 8}
            r="8"
            fill="#3B82F6"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={node.position.x + radius - 8}
            y={node.position.y - radius + 12}
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
          >
            ✎
          </text>
        </g>
      </g>
    );
  };

  if (relationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {t("familyTree.noRelationships")}
        </h3>
        <p className="text-gray-600">{t("familyTree.addRelationships")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">
          {transformMemberData(member).fullName}'s Family Tree
        </h2>
        <p className="text-center text-gray-600">
          {relationships.length} family connections
        </p>
      </div>

      <div className="w-full overflow-auto">
        <svg
          width="1000"
          height="700"
          viewBox="0 0 1000 700"
          className="mx-auto border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 max-w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Enhanced background and filters */}
          <defs>
            <pattern
              id="grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="1"
                opacity="0.2"
              />
            </pattern>
            <filter
              id="dropshadow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection lines */}
          {renderConnections()}

          {/* Family member nodes */}
          {familyNodes.map((node, index) => renderMemberNode(node, index))}

          {/* Enhanced Legend */}
          <g transform="translate(30, 30)">
            <rect
              x="0"
              y="0"
              width="200"
              height="140"
              fill="white"
              fillOpacity="0.95"
              stroke="#D1D5DB"
              rx="12"
              strokeWidth="2"
              filter="url(#dropshadow)"
            />
            <text x="15" y="25" fill="#374151" fontSize="16" fontWeight="bold">
              Legend
            </text>
            <circle
              cx="25"
              cy="45"
              r="10"
              fill="#DC2626"
              stroke="white"
              strokeWidth="2"
            />
            <text x="45" y="50" fill="#374151" fontSize="13" fontWeight="500">
              Self
            </text>
            <circle
              cx="25"
              cy="70"
              r="10"
              fill="#4F46E5"
              stroke="white"
              strokeWidth="2"
            />
            <text x="45" y="75" fill="#374151" fontSize="13" fontWeight="500">
              Parents
            </text>
            <circle
              cx="25"
              cy="95"
              r="10"
              fill="#EF4444"
              stroke="white"
              strokeWidth="2"
            />
            <text x="45" y="100" fill="#374151" fontSize="13" fontWeight="500">
              Spouse
            </text>
            <circle
              cx="25"
              cy="120"
              r="10"
              fill="#10B981"
              stroke="white"
              strokeWidth="2"
            />
            <text x="45" y="125" fill="#374151" fontSize="13" fontWeight="500">
              Children
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-6 flex justify-center gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center gap-2"
        >
          📄 Print Family Tree
        </Button>
        <Button
          onClick={() =>
            (window.location.href = `/member-details/${member.id}`)
          }
          className="flex items-center gap-2"
        >
          👤 View Full Details
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            (window.location.href = `/member-details/${member.id}#relationships`)
          }
          className="flex items-center gap-2"
        >
          ➕ Add Relationships
        </Button>
      </div>
    </Card>
  );
}
