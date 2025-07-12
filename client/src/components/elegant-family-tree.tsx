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

  // Arrange family members in a tree-like structure
  const arrangeFamilyNodes = (): FamilyNode[] => {
    const nodes: FamilyNode[] = [];
    const centerX = 400;
    const centerY = 300;

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

    // Position grandparents at the top
    const grandparents = ['Paternal Grandfather', 'Paternal Grandmother', 'Maternal Grandfather', 'Maternal Grandmother'];
    let gpIndex = 0;
    grandparents.forEach(gpType => {
      if (groupedRelationships[gpType]) {
        groupedRelationships[gpType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: gpType,
            position: { x: centerX - 150 + (gpIndex * 100), y: centerY - 200 },
            color: getRelationshipColor(gpType)
          });
          gpIndex++;
        });
      }
    });

    // Position parents above center
    const parents = ['Father', 'Mother'];
    let parentIndex = 0;
    parents.forEach(parentType => {
      if (groupedRelationships[parentType]) {
        groupedRelationships[parentType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: parentType,
            position: { x: centerX - 100 + (parentIndex * 200), y: centerY - 120 },
            color: getRelationshipColor(parentType)
          });
          parentIndex++;
        });
      }
    });

    // Position spouse next to center
    const spouses = ['Wife', 'Husband'];
    spouses.forEach(spouseType => {
      if (groupedRelationships[spouseType]) {
        groupedRelationships[spouseType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: spouseType,
            position: { x: centerX + 150, y: centerY },
            color: getRelationshipColor(spouseType)
          });
        });
      }
    });

    // Position siblings on the sides
    const siblings = ['Elder Brother', 'Elder Sister', 'Younger Brother', 'Younger Sister'];
    let siblingIndex = 0;
    siblings.forEach(siblingType => {
      if (groupedRelationships[siblingType]) {
        groupedRelationships[siblingType].forEach(rel => {
          const isLeft = siblingIndex % 2 === 0;
          nodes.push({
            member: rel.relatedMember,
            relationshipType: siblingType,
            position: { 
              x: centerX + (isLeft ? -200 : 200), 
              y: centerY + (Math.floor(siblingIndex / 2) * 60) 
            },
            color: getRelationshipColor(siblingType)
          });
          siblingIndex++;
        });
      }
    });

    // Position children below center
    const children = ['Son', 'Daughter'];
    let childIndex = 0;
    children.forEach(childType => {
      if (groupedRelationships[childType]) {
        groupedRelationships[childType].forEach(rel => {
          nodes.push({
            member: rel.relatedMember,
            relationshipType: childType,
            position: { x: centerX - 100 + (childIndex * 80), y: centerY + 120 },
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

  // Render individual family member node
  const renderMemberNode = (node: FamilyNode, index: number) => {
    const transformedMember = transformMemberData(node.member);
    const initials = node.member.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
    const radius = node.isCenter ? 40 : 30;

    return (
      <g key={`node-${index}`} className="cursor-pointer" onClick={() => onMemberClick?.(node.member.id)}>
        {/* Member circle */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={radius}
          fill={node.color}
          stroke="white"
          strokeWidth="3"
          className="drop-shadow-lg hover:stroke-yellow-400 transition-colors"
        />
        
        {/* Member initials */}
        <text
          x={node.position.x}
          y={node.position.y + 5}
          textAnchor="middle"
          fill="white"
          fontSize={node.isCenter ? "16" : "12"}
          fontWeight="bold"
        >
          {initials}
        </text>

        {/* Member name below circle */}
        <text
          x={node.position.x}
          y={node.position.y + radius + 20}
          textAnchor="middle"
          fill="#374151"
          fontSize="12"
          fontWeight="500"
        >
          {node.member.fullName?.split(' ')[0] || 'Unknown'}
        </text>

        {/* Relationship type */}
        {!node.isCenter && (
          <text
            x={node.position.x}
            y={node.position.y + radius + 35}
            textAnchor="middle"
            fill="#6B7280"
            fontSize="10"
          >
            {transformRelationshipType(node.relationshipType)}
          </text>
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
        <svg width="800" height="600" className="mx-auto border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Background pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection lines */}
          {renderConnections()}

          {/* Family member nodes */}
          {familyNodes.map((node, index) => renderMemberNode(node, index))}

          {/* Legend */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="180" height="120" fill="white" fillOpacity="0.9" stroke="#D1D5DB" rx="8" />
            <text x="10" y="20" fill="#374151" fontSize="14" fontWeight="bold">Legend</text>
            <circle cx="20" cy="40" r="8" fill="#DC2626" />
            <text x="35" y="45" fill="#374151" fontSize="12">Self</text>
            <circle cx="20" cy="60" r="8" fill="#4F46E5" />
            <text x="35" y="65" fill="#374151" fontSize="12">Parents</text>
            <circle cx="20" cy="80" r="8" fill="#EF4444" />
            <text x="35" y="85" fill="#374151" fontSize="12">Spouse</text>
            <circle cx="20" cy="100" r="8" fill="#10B981" />
            <text x="35" y="105" fill="#374151" fontSize="12">Children</text>
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