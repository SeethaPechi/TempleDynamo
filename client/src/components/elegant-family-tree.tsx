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

export function ElegantFamilyTree({ member, relationships, onMemberClick }: ElegantFamilyTreeProps) {
  const { t } = useTranslation();
  const { transformMemberData, transformRelationshipType } = useFormDataTransformation();

  // Color scheme for different relationships
  const getRelationshipColor = (relationshipType: string): string => {
    const colors: Record<string, string> = {
      'Father': '#4F46E5', // Blue
      'Mother': '#EC4899', // Pink
      'Son': '#10B981', // Green
      'Daughter': '#F59E0B', // Amber
      'Wife': '#EF4444', // Red
      'Husband': '#3B82F6', // Blue
      'Elder Brother': '#8B5CF6', // Purple
      'Elder Sister': '#F97316', // Orange
      'Younger Brother': '#06B6D4', // Cyan
      'Younger Sister': '#84CC16', // Lime
      'Paternal Grandfather': '#1F2937', // Gray
      'Paternal Grandmother': '#6B7280', // Gray
      'Maternal Grandfather': '#374151', // Gray
      'Maternal Grandmother': '#9CA3AF', // Gray
    };
    return colors[relationshipType] || '#6B7280';
  };

  // Arrange family members in a tree-like structure with better spacing
  const arrangeFamilyNodes = (): FamilyNode[] => {
    const nodes: FamilyNode[] = [];
    const centerX = 500;
    const centerY = 350;
    const spacing = 180; // Increased spacing between nodes

    // Add the main member at the center
    nodes.push({
      member,
      relationshipType: 'Self',
      position: { x: centerX, y: centerY },
      color: '#DC2626', // Red for self
      isCenter: true
    });

    // Group relationships by type and position them
    const groupedRelationships = relationships.reduce((acc, rel) => {
      const type = rel.relationshipType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(rel);
      return acc;
    }, {} as Record<string, Array<Relationship & { relatedMember: Member }>>);

    // Position grandparents at the top with wider spacing
    const grandparents = ['Paternal Grandfather', 'Paternal Grandmother', 'Maternal Grandfather', 'Maternal Grandmother'];
    let gpIndex = 0;
    grandparents.forEach(gpType => {
      if (groupedRelationships[gpType]) {
        groupedRelationships[gpType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: gpType,
            position: { x: centerX - 270 + (gpIndex * spacing), y: centerY - 250 },
            color: getRelationshipColor(gpType)
          });
          gpIndex++;
        });
      }
    });

    // Position parents above center with better spacing
    const parents = ['Father', 'Mother'];
    let parentIndex = 0;
    parents.forEach(parentType => {
      if (groupedRelationships[parentType]) {
        groupedRelationships[parentType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: parentType,
            position: { x: centerX - 120 + (parentIndex * 240), y: centerY - 150 },
            color: getRelationshipColor(parentType)
          });
          parentIndex++;
        });
      }
    });

    // Position spouse next to center with more spacing
    const spouses = ['Wife', 'Husband'];
    spouses.forEach(spouseType => {
      if (groupedRelationships[spouseType]) {
        groupedRelationships[spouseType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: spouseType,
            position: { x: centerX + 200, y: centerY },
            color: getRelationshipColor(spouseType)
          });
        });
      }
    });

    // Position siblings on the sides with vertical spacing
    const siblings = ['Elder Brother', 'Elder Sister', 'Younger Brother', 'Younger Sister'];
    let siblingIndex = 0;
    siblings.forEach(siblingType => {
      if (groupedRelationships[siblingType]) {
        groupedRelationships[siblingType].forEach(rel => {
          const isLeft = siblingIndex % 2 === 0;
          const verticalOffset = Math.floor(siblingIndex / 2) * 100;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: siblingType,
            position: { 
              x: centerX + (isLeft ? -280 : 280), 
              y: centerY - 50 + verticalOffset
            },
            color: getRelationshipColor(siblingType)
          });
          siblingIndex++;
        });
      }
    });

    // Position children below center with wider spacing
    const children = ['Son', 'Daughter'];
    let childIndex = 0;
    children.forEach(childType => {
      if (groupedRelationships[childType]) {
        groupedRelationships[childType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: childType,
            position: { x: centerX - 150 + (childIndex * 150), y: centerY + 150 },
            color: getRelationshipColor(childType)
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
    const centerNode = familyNodes.find(node => node.isCenter);
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
        />
      );

      // Add heart symbol for spouse connections
      if (node.relationshipType === 'Wife' || node.relationshipType === 'Husband') {
        const midX = (centerNode.position.x + node.position.x) / 2;
        const midY = (centerNode.position.y + node.position.y) / 2;
        connections.push(
          <g key={`heart-${index}`}>
            <circle cx={midX} cy={midY} r="15" fill="#EF4444" />
            <text x={midX} y={midY + 5} textAnchor="middle" fill="white" fontSize="12">♥</text>
          </g>
        );
      }
    });

    return connections;
  };

  // Render individual family member node with better text visibility
  const renderMemberNode = (node: FamilyNode, index: number) => {
    const transformedMember = transformMemberData(node.member);
    const initials = node.member.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
    const radius = node.isCenter ? 45 : 35; // Increased radius for better visibility
    const firstName = node.member.fullName?.split(' ')[0] || 'Unknown';

    return (
      <g key={`node-${index}`} className="cursor-pointer" onClick={() => onMemberClick?.(node.member.id)}>
        {/* Member circle with enhanced styling */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={radius}
          fill={node.color}
          stroke="white"
          strokeWidth="4"
          className="drop-shadow-lg hover:stroke-yellow-400 transition-all duration-300 hover:r-40"
          filter="url(#dropshadow)"
        />
        
        {/* Member initials with better contrast */}
        <text
          x={node.position.x}
          y={node.position.y + 6}
          textAnchor="middle"
          fill="white"
          fontSize={node.isCenter ? "18" : "14"}
          fontWeight="bold"
          stroke="#000"
          strokeWidth="0.5"
        >
          {initials}
        </text>

        {/* White background for name text */}
        <rect
          x={node.position.x - firstName.length * 4}
          y={node.position.y + radius + 10}
          width={firstName.length * 8}
          height="20"
          fill="white"
          fillOpacity="0.9"
          rx="10"
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Member name with better visibility */}
        <text
          x={node.position.x}
          y={node.position.y + radius + 25}
          textAnchor="middle"
          fill="#1F2937"
          fontSize="13"
          fontWeight="600"
        >
          {firstName}
        </text>

        {/* Relationship type with background */}
        {!node.isCenter && (
          <>
            <rect
              x={node.position.x - transformRelationshipType(node.relationshipType).length * 3}
              y={node.position.y + radius + 35}
              width={transformRelationshipType(node.relationshipType).length * 6}
              height="16"
              fill="rgba(107, 114, 128, 0.1)"
              rx="8"
              stroke="#D1D5DB"
              strokeWidth="0.5"
            />
            <text
              x={node.position.x}
              y={node.position.y + radius + 47}
              textAnchor="middle"
              fill="#4B5563"
              fontSize="11"
              fontWeight="500"
            >
              {transformRelationshipType(node.relationshipType)}
            </text>
          </>
        )}
      </g>
    );
  };

  if (relationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">{t("familyTree.noRelationships")}</h3>
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
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1" opacity="0.2"/>
            </pattern>
            <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection lines */}
          {renderConnections()}

          {/* Family member nodes */}
          {familyNodes.map((node, index) => renderMemberNode(node, index))}

          {/* Enhanced Legend */}
          <g transform="translate(30, 30)">
            <rect x="0" y="0" width="200" height="140" fill="white" fillOpacity="0.95" stroke="#D1D5DB" rx="12" strokeWidth="2" filter="url(#dropshadow)" />
            <text x="15" y="25" fill="#374151" fontSize="16" fontWeight="bold">Legend</text>
            <circle cx="25" cy="45" r="10" fill="#DC2626" stroke="white" strokeWidth="2" />
            <text x="45" y="50" fill="#374151" fontSize="13" fontWeight="500">Self</text>
            <circle cx="25" cy="70" r="10" fill="#4F46E5" stroke="white" strokeWidth="2" />
            <text x="45" y="75" fill="#374151" fontSize="13" fontWeight="500">Parents</text>
            <circle cx="25" cy="95" r="10" fill="#EF4444" stroke="white" strokeWidth="2" />
            <text x="45" y="100" fill="#374151" fontSize="13" fontWeight="500">Spouse</text>
            <circle cx="25" cy="120" r="10" fill="#10B981" stroke="white" strokeWidth="2" />
            <text x="45" y="125" fill="#374151" fontSize="13" fontWeight="500">Children</text>
          </g>
        </svg>
      </div>

      <div className="mt-6 text-center">
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          className="mr-4"
        >
          Print Family Tree
        </Button>
        <Button 
          onClick={() => onMemberClick?.(member.id)}
        >
          View Full Details
        </Button>
      </div>
    </Card>
  );
}