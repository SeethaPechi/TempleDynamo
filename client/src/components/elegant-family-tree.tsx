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

  // Get gender-based color scheme for relationships
  const getRelationshipColor = (
    relationshipType: string,
    member: Member,
  ): string => {
    const gender = member.gender?.toLowerCase();

    // Colors based on user requirements
    const maleColor = "#3B82F6"; // Blue
    const femaleColor = "#EC4899"; // Pink

    // Father and Mother - Square shape
    if (relationshipType === "Father") return maleColor;
    if (relationshipType === "Mother") return femaleColor;
    if (relationshipType === "Step Father") return maleColor;
    if (relationshipType === "Step Mother") return femaleColor;

    // Spouse - Heart shape
    if (relationshipType === "Wife") return femaleColor;
    if (relationshipType === "Husband") return maleColor;

    // Sons and Daughters - Diamond shape
    if (relationshipType === "Son") return maleColor;
    if (relationshipType === "Daughter") return femaleColor;
    if (relationshipType === "Step-Son") return maleColor;
    if (relationshipType === "Step-Daughter") return femaleColor;

    // Brothers and Sisters - Pentagon shape
    if (relationshipType === "Elder Brother") return maleColor;
    if (relationshipType === "Elder Sister") return femaleColor;
    if (relationshipType === "Younger Brother") return maleColor;
    if (relationshipType === "Younger Sister") return femaleColor;
    if (relationshipType === "Step-Brother") return maleColor;
    if (relationshipType === "Step-Sister") return femaleColor;

    // Other relationships - use gender-based colors or fallback
    if (gender === "male") return maleColor;
    if (gender === "female") return femaleColor;

    // Fallback colors for relationships without gender info
    return "#6B7280"; // Gray
  };

  // Get shape type for relationship
  const getRelationshipShape = (relationshipType: string): string => {
    // Father and Mother - Square
    if (
      ["Father", "Mother", "Step Father", "Step Mother"].includes(
        relationshipType,
      )
    ) {
      return "square";
    }

    // Spouse - Heart
    if (["Wife", "Husband"].includes(relationshipType)) {
      return "heart";
    }

    // Sons and Daughters - Diamond
    if (
      ["Son", "Daughter", "Step-Son", "Step-Daughter"].includes(
        relationshipType,
      )
    ) {
      return "diamond";
    }

    // Brothers and Sisters - Pentagon
    if (
      [
        "Elder Brother",
        "Elder Sister",
        "Younger Brother",
        "Younger Sister",
        "Step-Brother",
        "Step-Sister",
      ].includes(relationshipType)
    ) {
      return "pentagon";
    }

    // Default circle for other relationships
    return "circle";
  };

  // Arrange family members in organized groups with guaranteed no overlapping
  const arrangeFamilyNodes = (): FamilyNode[] => {
    const nodes: FamilyNode[] = [];
    const centerX = 800; // Center the tree horizontally
    const centerY = 450; // Center vertically
    const minSpacing = 280; // Further increased spacing to prevent overlapping
    const circleRadius = 45; // Account for circle size

    // Add the main member at the center with gender-based color
    nodes.push({
      member,
      relationshipType: "Self",
      position: { x: centerX, y: centerY },
      color: member.gender?.toLowerCase() === "male" ? "#3B82F6" : "#EC4899", // Blue for male, Pink for female
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

    // Define positioning zones to avoid overlaps with increased spacing
    const zones = {
      top: { y: 120, startX: centerX, spacing: minSpacing },
      upperLevel: { y: 250, startX: centerX, spacing: minSpacing },
      leftSide: { x: 250, startY: centerY - 200, spacing: 200 },
      rightSide: { x: centerX + 350, startY: centerY - 200, spacing: 220 },
      bottomLevel: { y: centerY + 200, startX: centerX, spacing: minSpacing },
      lowerLevel: { y: centerY + 350, startX: centerX, spacing: minSpacing },
    };

    // Position grandparents at the top - properly spaced
    const grandparents = [
      "Paternal Grandfather",
      "Paternal Grandmother",
      "Maternal Grandfather",
      "Maternal Grandmother",
    ];
    let gpCount = 0;
    grandparents.forEach((gpType) => {
      if (groupedRelationships[gpType]) {
        groupedRelationships[gpType].forEach((rel) => {
          const totalGP = grandparents.reduce(
            (sum, type) => sum + (groupedRelationships[type] || []).length,
            0,
          );
          const startX = centerX - ((totalGP - 1) * minSpacing) / 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: gpType,
            position: { x: startX + gpCount * minSpacing, y: zones.top.y },
            color: getRelationshipColor(gpType, rel.relatedMember),
          });
          gpCount++;
        });
      }
    });

    // Position parents above center - properly spaced
    const parents = ["Father", "Mother", "Step Father", "Step Mother"];
    let parentCount = 0;
    parents.forEach((parentType) => {
      if (groupedRelationships[parentType]) {
        groupedRelationships[parentType].forEach((rel) => {
          const totalParents = parents.reduce(
            (sum, type) => sum + (groupedRelationships[type] || []).length,
            0,
          );
          const startX = centerX - ((totalParents - 1) * minSpacing) / 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: parentType,
            position: {
              x: startX + parentCount * minSpacing,
              y: zones.upperLevel.y,
            },
            color: getRelationshipColor(parentType, rel.relatedMember),
          });
          parentCount++;
        });
      }
    });

    // Position spouses on right side with vertical spacing
    const spouses = ["Wife", "Husband"];
    let spouseCount = 0;
    spouses.forEach((spouseType) => {
      if (groupedRelationships[spouseType]) {
        groupedRelationships[spouseType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: spouseType,
            position: {
              x: zones.rightSide.x,
              y: zones.rightSide.startY + spouseCount * zones.rightSide.spacing,
            },
            color: getRelationshipColor(spouseType, rel.relatedMember),
          });
          spouseCount++;
        });
      }
    });

    // Position siblings on left side with vertical spacing
    const siblings = [
      "Elder Brother",
      "Elder Sister",
      "Younger Brother",
      "Younger Sister",
      "Step-Brother",
      "Step-Sister",
    ];
    let siblingCount = 0;
    siblings.forEach((siblingType) => {
      if (groupedRelationships[siblingType]) {
        groupedRelationships[siblingType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: siblingType,
            position: {
              x: zones.leftSide.x,
              y: zones.leftSide.startY + siblingCount * zones.leftSide.spacing,
            },
            color: getRelationshipColor(siblingType, rel.relatedMember),
          });
          siblingCount++;
        });
      }
    });

    // Position children below center - properly spaced
    const children = ["Son", "Daughter", "Step-Son", "Step-Daughter"];
    let childCount = 0;
    children.forEach((childType) => {
      if (groupedRelationships[childType]) {
        groupedRelationships[childType].forEach((rel) => {
          const totalChildren = children.reduce(
            (sum, type) => sum + (groupedRelationships[type] || []).length,
            0,
          );
          const startX = centerX - ((totalChildren - 1) * minSpacing) / 2;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: childType,
            position: {
              x: startX + childCount * minSpacing,
              y: zones.bottomLevel.y,
            },
            color: getRelationshipColor(childType, rel.relatedMember),
          });
          childCount++;
        });
      }
    });

    // Position in-laws with better organization and spacing
    const parentInLaws = ["Father-in-Law", "Mother-in-Law"];
    const siblingInLaws = ["Brother-in-Law", "Sister-in-Law"];
    const childInLaws = ["Son-in-Law", "Daughter-in-Law"];

    // Position parent in-laws on the upper right with better spacing
    let parentInLawIndex = 0;
    parentInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: {
              x: 1200 + (parentInLawIndex % 2) * 180,
              y: 180 + Math.floor(parentInLawIndex / 2) * 160,
            },
            color: getRelationshipColor(inLawType, rel.relatedMember),
          });
          parentInLawIndex++;
        });
      }
    });

    // Position sibling in-laws on the middle right with better spacing
    let siblingInLawIndex = 0;
    siblingInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: {
              x: 1200 + (siblingInLawIndex % 2) * 180,
              y: centerY - 50 + Math.floor(siblingInLawIndex / 2) * 160,
            },
            color: getRelationshipColor(inLawType, rel.relatedMember),
          });
          siblingInLawIndex++;
        });
      }
    });

    // Position child in-laws near the children area with better spacing
    let childInLawIndex = 0;
    childInLaws.forEach((inLawType) => {
      if (groupedRelationships[inLawType]) {
        groupedRelationships[inLawType].forEach((rel) => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: inLawType,
            position: {
              x: 950 + (childInLawIndex % 3) * 160,
              y: centerY + 300 + Math.floor(childInLawIndex / 3) * 140,
            },
            color: getRelationshipColor(inLawType, rel.relatedMember),
          });
          childInLawIndex++;
        });
      }
    });

    // Position extended family at the bottom with better spacing
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
              x: 250 + col * 180,
              y: centerY + 450 + row * 120,
            },
            color: getRelationshipColor(extType, rel.relatedMember),
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
        const sonNode = familyNodes.find(
          (n) =>
            n.relationshipType === "Son" &&
            (n.member.spouseName === node.member.fullName ||
              node.member.spouseName === n.member.fullName),
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
            />,
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
            />,
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
            </text>,
          );
        }
      }

      if (node.relationshipType === "Son-in-Law") {
        // Find the daughter this son-in-law is married to by checking spouse names
        const daughterNode = familyNodes.find(
          (n) =>
            n.relationshipType === "Daughter" &&
            (n.member.spouseName === node.member.fullName ||
              node.member.spouseName === n.member.fullName),
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
            />,
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
            />,
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
            </text>,
          );
        }
      }
    });

    return connections;
  };

  // Render shape based on relationship type
  const renderShape = (node: FamilyNode, radius: number) => {
    const shape = getRelationshipShape(node.relationshipType);
    const { x, y } = node.position;

    switch (shape) {
      case "heart":
        // Heart shape for spouses - made larger and more visible
        const heartSize = radius * 5;
        return (
          <path
            d={`M${x},${y + heartSize * 0.3} 
                C${x},${y - heartSize * 0.1} ${x - heartSize * 0.6},${y - heartSize * 0.4} ${x - heartSize * 0.3},${y - heartSize * 0.2}
                C${x - heartSize * 0.1},${y - heartSize * 0.4} ${x},${y - heartSize * 0.4} ${x},${y - heartSize * 0.2}
                C${x},${y - heartSize * 0.4} ${x + heartSize * 0.1},${y - heartSize * 0.4} ${x + heartSize * 0.3},${y - heartSize * 0.2}
                C${x + heartSize * 0.6},${y - heartSize * 0.4} ${x},${y - heartSize * 0.1} ${x},${y + heartSize * 0.3} Z`}
            fill={node.color}
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          />
        );

      case "square":
        // Square shape for parents
        const squareSize = radius * 1.4;
        return (
          <rect
            x={x - squareSize / 2}
            y={y - squareSize / 2}
            width={squareSize}
            height={squareSize}
            fill={node.color}
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          />
        );

      case "diamond":
        // Diamond shape for children
        const diamondSize = radius * 1.2;
        return (
          <path
            d={`M${x},${y - diamondSize} 
                L${x + diamondSize},${y} 
                L${x},${y + diamondSize} 
                L${x - diamondSize},${y} Z`}
            fill={node.color}
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          />
        );

      case "pentagon":
        // Pentagon shape for siblings
        const pentagonRadius = radius * 1.1;
        const points = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          points.push(
            `${x + pentagonRadius * Math.cos(angle)},${y + pentagonRadius * Math.sin(angle)}`,
          );
        }
        return (
          <polygon
            points={points.join(" ")}
            fill={node.color}
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          />
        );

      default:
        // Default circle for other relationships
        return (
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={node.color}
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300"
          />
        );
    }
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
        {/* Member shape with enhanced styling */}
        {renderShape(node, radius)}

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

        {/* Member name - positioned outside/below the shape */}
        {(() => {
          const words = firstName.split(' ');
          const maxCharsPerLine = 12;
          const lines: string[] = [];
          let currentLine = '';
          
          words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
              currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word.length > maxCharsPerLine ? word.substring(0, maxCharsPerLine - 2) + '..' : word;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          const startY = node.position.y + radius + 15; // Position below the shape
          
          return lines.map((line, i) => (
            <text
              key={`name-${i}`}
              x={node.position.x}
              y={startY + (i * 14)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize={node.isCenter ? "14" : "12"}
              fontWeight="bold"
              stroke="white"
              strokeWidth="0.5"
            >
              {line}
            </text>
          ));
        })()}

        {/* Relationship type - centered inside the shape in black */}
        {!node.isCenter && (() => {
          const relText = transformRelationshipType(node.relationshipType);
          const words = relText.split(' ');
          const maxCharsPerLine = 8;
          const lines: string[] = [];
          let currentLine = '';
          
          words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
              currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word.length > maxCharsPerLine ? word.substring(0, maxCharsPerLine - 2) + '..' : word;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          const startY = node.position.y - (lines.length * 5);
          
          return lines.map((line, i) => (
            <text
              key={`rel-${i}`}
              x={node.position.x}
              y={startY + (i * 11)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              fontSize="10"
              fontWeight="600"
              stroke="white"
              strokeWidth="0.3"
            >
              {line}
            </text>
          ));
        })()}

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
    <Card className="p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
          {transformMemberData(member).fullName}'s Family Tree
        </h2>
        <p className="text-center text-gray-600 text-sm sm:text-base">
          {relationships.length} family connections
        </p>
      </div>

      <div className="w-full overflow-auto">
        <svg
          width="100%"
          height="700"
          viewBox="0 0 1800 1000"
          className="mx-auto border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 w-full h-auto min-h-[500px] sm:min-h-[700px]"
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

          {/* Horizontal Legend at top */}
          <g transform="translate(250, 20)">
            <rect
              x="0"
              y="0"
              width="900"
              height="50"
              fill="white"
              fillOpacity="0.95"
              stroke="#D1D5DB"
              rx="8"
              strokeWidth="2"
              filter="url(#dropshadow)"
            />
            <text x="15" y="25" fill="#374151" fontSize="14" fontWeight="bold">
              Legend:
            </text>

            {/* Self */}
            <circle
              cx="80"
              cy="25"
              r="8"
              fill="#DC2626"
              stroke="white"
              strokeWidth="2"
            />
            <text x="95" y="30" fill="#374151" fontSize="12" fontWeight="500">
              Self
            </text>

            {/* Parents */}
            <circle
              cx="140"
              cy="25"
              r="8"
              fill="#4F46E5"
              stroke="white"
              strokeWidth="2"
            />
            <text x="155" y="30" fill="#374151" fontSize="12" fontWeight="500">
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
