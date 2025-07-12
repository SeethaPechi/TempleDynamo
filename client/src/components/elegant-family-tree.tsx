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

  // Arrange family members in organized groups that fit within viewBox
  const arrangeFamilyNodes = (): FamilyNode[] => {
    const nodes: FamilyNode[] = [];
    const centerX = 500;
    const centerY = 350; // Move center down to allow more space for grandparents
    const spacing = 140; // Increased spacing between circles

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

    // Position grandparents at the top - grouped together
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
            position: { x: 200 + gpIndex * spacing, y: 80 },
            color: getRelationshipColor(gpType),
          });
          gpIndex++;
        });
      }
    });

    // Position parents above center - grouped together
    const parents = ["Father", "Mother", "Step Father", "Step Mother"];
    let parentIndex = 0;
    parents.forEach((parentType) => {
      if (groupedRelationships[parentType]) {
        groupedRelationships[parentType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: parentType,
            position: { x: 350 + parentIndex * spacing, y: 200 },
            color: getRelationshipColor(parentType),
          });
          parentIndex++;
        });
      }
    });

    // Position spouses directly to the right - with proper spacing for multiple spouses
    const spouses = ["Wife", "Husband"];
    let spouseIndex = 0;
    spouses.forEach((spouseType) => {
      if (groupedRelationships[spouseType]) {
        groupedRelationships[spouseType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: spouseType,
            position: {
              x: centerX + 180,
              y: centerY - 40 + spouseIndex * 80, // Space multiple spouses vertically
            },
            color: getRelationshipColor(spouseType),
          });
          spouseIndex++;
        });
      }
    });

    // Position siblings on the left side - grouped together
    const siblings = [
      "Elder Brother",
      "Elder Sister",
      "Younger Brother",
      "Younger Sister",
      "Step-Brother",
      "Step-Sister",
    ];
    let siblingIndex = 0;
    siblings.forEach((siblingType) => {
      if (groupedRelationships[siblingType]) {
        groupedRelationships[siblingType].forEach((rel) => {
          const row = Math.floor(siblingIndex / 2);
          const col = siblingIndex % 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: siblingType,
            position: {
              x: 150 - col * 120,
              y: centerY - 80 + row * 100,
            },
            color: getRelationshipColor(siblingType),
          });
          siblingIndex++;
        });
      }
    });

    // Position children below center - grouped together
    const children = ["Son", "Daughter", "Step-Son", "Step-Daughter"];
    let childIndex = 0;
    children.forEach((childType) => {
      if (groupedRelationships[childType]) {
        groupedRelationships[childType].forEach((rel) => {
          const totalChildren = children.reduce(
            (sum, type) => sum + (groupedRelationships[type] || []).length,
            0,
          );
          const startX = centerX - ((totalChildren - 1) * 130) / 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: childType,
            position: { x: startX + childIndex * 130, y: centerY + 140 },
            color: getRelationshipColor(childType),
          });
          childIndex++;
        });
      }
    });

    // Position in-laws with better organization and spacing
    const parentInLaws = ["Father-in-Law", "Mother-in-Law"];
    const siblingInLaws = ["Brother-in-Law", "Sister-in-Law"];
    const childInLaws = ["Son-in-Law", "Daughter-in-Law"];
    
    // Position parent in-laws on the upper right
    let parentInLawIndex = 0;
    parentInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: { 
              x: 800 + (parentInLawIndex % 2) * 120,
              y: 200 + Math.floor(parentInLawIndex / 2) * 100
            },
            color: getRelationshipColor(inLawType),
          });
          parentInLawIndex++;
        });
      }
    });
    
    // Position sibling in-laws on the middle right
    let siblingInLawIndex = 0;
    siblingInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: { 
              x: 800 + (siblingInLawIndex % 2) * 120,
              y: centerY - 40 + Math.floor(siblingInLawIndex / 2) * 100
            },
            color: getRelationshipColor(inLawType),
          });
          siblingInLawIndex++;
        });
      }
    });
    
    // Position child in-laws near the children area but with proper spacing
    let childInLawIndex = 0;
    childInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: { 
              x: 750 + (childInLawIndex % 3) * 120,
              y: centerY + 250 + Math.floor(childInLawIndex / 3) * 100
            },
            color: getRelationshipColor(inLawType),
          });
          childInLawIndex++;
        });
      }
    });

    // Position extended family at the bottom - grouped together
    const extendedFamily = ["Uncle", "Aunt", "Nephew", "Niece", "Cousin"];
    let extIndex = 0;
    extendedFamily.forEach((extType) => {
      if (groupedRelationships[extType]) {
        groupedRelationships[extType].forEach((rel) => {
          const row = Math.floor(extIndex / 4);
          const col = extIndex % 4;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: extType,
            position: { 
              x: 200 + col * 140, 
              y: centerY + 380 + row * 100 
            },
            color: getRelationshipColor(extType),
          });
          extIndex++;
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

      // Special bold line for spouse connections
      if (
        node.relationshipType === "Wife" ||
        node.relationshipType === "Husband"
      ) {
        connections.push(
          <line
            key={`spouse-line-${index}`}
            x1={centerNode.position.x}
            y1={centerNode.position.y}
            x2={node.position.x}
            y2={node.position.y}
            stroke="#EF4444"
            strokeWidth="6"
            opacity="0.8"
          />,
        );

        // Add heart symbol for spouse connections
        const midX = (centerNode.position.x + node.position.x) / 2;
        const midY = (centerNode.position.y + node.position.y) / 2;
        connections.push(
          <g key={`heart-${index}`}>
            <circle
              cx={midX}
              cy={midY}
              r="15"
              fill="#EF4444"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={midX}
              y={midY + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              ♥
            </text>
          </g>,
        );
      } else {
        // Regular dotted lines for other relationships
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
            opacity="0.6"
          />,
        );
      }
    });

    // Add secondary connections for in-laws to show family tree structure
    // For example: Daughter-in-Law connected to Son, Son-in-Law connected to Daughter
    familyNodes.forEach((node, index) => {
      if (node.relationshipType === "Daughter-in-Law") {
        // Find the son this daughter-in-law is married to by checking spouse names
        const sonNode = familyNodes.find(n => 
          n.relationshipType === "Son" && 
          (n.member.spouseName === node.member.fullName || 
           node.member.spouseName === n.member.fullName)
        );
        
        if (sonNode) {
          connections.push(
            <line
              key={`dil-connection-${index}`}
              x1={sonNode.position.x}
              y1={sonNode.position.y}
              x2={node.position.x}
              y2={node.position.y}
              stroke="#10B981"
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.7"
            />
          );
          // Add small marriage symbol
          const midX = (sonNode.position.x + node.position.x) / 2;
          const midY = (sonNode.position.y + node.position.y) / 2;
          connections.push(
            <circle
              key={`dil-marriage-${index}`}
              cx={midX}
              cy={midY}
              r="8"
              fill="#10B981"
              stroke="white"
              strokeWidth="2"
            />
          );
          connections.push(
            <text
              key={`dil-marriage-text-${index}`}
              x={midX}
              y={midY + 3}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              ♥
            </text>
          );
        }
      }
      
      if (node.relationshipType === "Son-in-Law") {
        // Find the daughter this son-in-law is married to by checking spouse names
        const daughterNode = familyNodes.find(n => 
          n.relationshipType === "Daughter" && 
          (n.member.spouseName === node.member.fullName || 
           node.member.spouseName === n.member.fullName)
        );
        
        if (daughterNode) {
          connections.push(
            <line
              key={`sil-connection-${index}`}
              x1={daughterNode.position.x}
              y1={daughterNode.position.y}
              x2={node.position.x}
              y2={node.position.y}
              stroke="#F59E0B"
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.7"
            />
          );
          // Add small marriage symbol
          const midX = (daughterNode.position.x + node.position.x) / 2;
          const midY = (daughterNode.position.y + node.position.y) / 2;
          connections.push(
            <circle
              key={`sil-marriage-${index}`}
              cx={midX}
              cy={midY}
              r="8"
              fill="#F59E0B"
              stroke="white"
              strokeWidth="2"
            />
          );
          connections.push(
            <text
              key={`sil-marriage-text-${index}`}
              x={midX}
              y={midY + 3}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              ♥
            </text>
          );
        }
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
    const radius = node.isCenter ? 45 : 35; // Larger circles for better text visibility
    const firstName = node.member.fullName?.trim()?.split(" ")[0] || "Unknown";

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

        {/* Member name - inside circle, upper half */}
        <text
          x={node.position.x}
          y={node.position.y - 5}
          textAnchor="middle"
          fill="white"
          fontSize={node.isCenter ? "12" : "10"}
          fontWeight="bold"
          stroke="#000"
          strokeWidth="0.2"
        >
          {firstName.length > 10
            ? firstName.substring(0, 10) + ".."
            : firstName}
        </text>

        {/* Relationship type - inside circle, lower half */}
        {!node.isCenter && (
          <text
            x={node.position.x}
            y={node.position.y + 12}
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontWeight="500"
            stroke="#000"
            strokeWidth="0.1"
          >
            {transformRelationshipType(node.relationshipType).length > 12
              ? transformRelationshipType(node.relationshipType).substring(
                  0,
                  12,
                ) + ".."
              : transformRelationshipType(node.relationshipType)}
          </text>
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
          {t("For ")} {transformMemberData(member).fullName}{" "}
          {t("familyTree.noRelationships")}
        </h3>
        <p className="text-gray-600">
          {t(
            "Select member menu option and add relationship by clicking Manage Relative button",
          )}
        </p>
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
          width="1200"
          height="800"
          viewBox="0 0 1200 800"
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

          {/* Horizontal Legend at bottom */}
          <g transform="translate(150, 550)">
            <rect
              x="0"
              y="0"
              width="700"
              height="40"
              fill="white"
              fillOpacity="0.95"
              stroke="#D1D5DB"
              rx="8"
              strokeWidth="2"
              filter="url(#dropshadow)"
            />
            <text x="15" y="20" fill="#374151" fontSize="14" fontWeight="bold">
              Legend:
            </text>

            {/* Self */}
            <circle
              cx="80"
              cy="15"
              r="8"
              fill="#DC2626"
              stroke="white"
              strokeWidth="2"
            />
            <text x="95" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Self
            </text>

            {/* Parents */}
            <circle
              cx="140"
              cy="15"
              r="8"
              fill="#4F46E5"
              stroke="white"
              strokeWidth="2"
            />
            <text x="155" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Parents
            </text>

            {/* Spouse */}
            <circle
              cx="220"
              cy="15"
              r="8"
              fill="#EF4444"
              stroke="white"
              strokeWidth="2"
            />
            <text x="235" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Spouse
            </text>

            {/* Children */}
            <circle
              cx="290"
              cy="15"
              r="8"
              fill="#10B981"
              stroke="white"
              strokeWidth="2"
            />
            <text x="305" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Children
            </text>

            {/* Siblings */}
            <circle
              cx="370"
              cy="15"
              r="8"
              fill="#F59E0B"
              stroke="white"
              strokeWidth="2"
            />
            <text x="385" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Siblings
            </text>

            {/* Extended */}
            <circle
              cx="450"
              cy="15"
              r="8"
              fill="#7C3AED"
              stroke="white"
              strokeWidth="2"
            />
            <text x="465" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Extended
            </text>

            {/* In-Laws */}
            <circle
              cx="530"
              cy="15"
              r="8"
              fill="#92400E"
              stroke="white"
              strokeWidth="2"
            />
            <text x="545" y="20" fill="#374151" fontSize="12" fontWeight="500">
              In-Laws
            </text>

            {/* Grandparents */}
            <circle
              cx="600"
              cy="15"
              r="8"
              fill="#6366F1"
              stroke="white"
              strokeWidth="2"
            />
            <text x="615" y="20" fill="#374151" fontSize="12" fontWeight="500">
              Grandparents
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
