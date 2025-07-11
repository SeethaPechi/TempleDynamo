import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

interface ElegantFamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface TreeNode {
  member: Member;
  relationship: string;
  generation: number;
  position: number;
  x: number;
  y: number;
}

export function ElegantFamilyTree({ member, relationships, onMemberClick }: ElegantFamilyTreeProps) {
  // Organize family members by generation and position
  const organizeTree = () => {
    const nodes: TreeNode[] = [];
    const centerX = 500; // Center of the tree
    const centerY = 300; // Center Y position for main member
    const generationHeight = 180; // Vertical spacing between generations
    const siblingSpacing = 180; // Horizontal spacing between siblings

    // Debug: Log all relationships
    console.log(`Organizing tree for ${member.fullName}:`, relationships);

    // Add the main member at center
    nodes.push({
      member,
      relationship: "Self",
      generation: 0,
      position: 0,
      x: centerX,
      y: centerY
    });

    // Organize relationships by generation
    const generations: { [key: number]: Array<Relationship & { relatedMember: Member }> } = {};
    
    relationships.forEach((rel) => {
      let generation = 0;
      
      const relType = rel.relationshipType.toLowerCase();
      
      // More comprehensive relationship mapping
      if (relType.includes('grandfather') || relType.includes('grandmother')) {
        generation = -2;
      } else if (relType === 'father' || relType === 'mother') {
        generation = -1;
      } else if (relType.includes('uncle') || relType.includes('aunt')) {
        generation = -1; // Same generation as parents
      } else if (relType === 'son' || relType === 'daughter') {
        generation = 1;
      } else if (relType.includes('grand') && (relType.includes('son') || relType.includes('daughter'))) {
        generation = 2;
      } else if (relType.includes('brother') || relType.includes('sister') || 
                 relType === 'wife' || relType === 'husband' || relType.includes('cousin')) {
        generation = 0;
      } else if (relType.includes('nephew') || relType.includes('niece')) {
        generation = 1;
      } else {
        // For any unmatched relationships, put them at same generation
        generation = 0;
        console.log(`Unmatched relationship type: ${rel.relationshipType}, placing at generation 0`);
      }
      
      if (!generations[generation]) {
        generations[generation] = [];
      }
      generations[generation].push(rel);
    });

    console.log('Organized by generations:', generations);

    // Position each generation
    Object.entries(generations).forEach(([gen, rels]) => {
      const generation = parseInt(gen);
      const y = centerY - (generation * generationHeight);
      
      // Adjust spacing based on number of members
      const spacing = rels.length > 4 ? 150 : siblingSpacing;
      const totalWidth = (rels.length - 1) * spacing;
      const startX = centerX - totalWidth / 2;

      rels.forEach((rel, index) => {
        nodes.push({
          member: rel.relatedMember,
          relationship: rel.relationshipType,
          generation,
          position: index,
          x: startX + (index * spacing),
          y
        });
      });
    });

    console.log(`Created ${nodes.length} nodes (including self):`);
    console.log(nodes.map(n => `${n.member.fullName} - ${n.relationship} (Gen: ${n.generation})`));

    return nodes;
  };

  const treeNodes = organizeTree();
  const viewBoxWidth = 1200;
  const viewBoxHeight = 900;

  // Generate connecting lines
  const generateConnections = () => {
    const connections: JSX.Element[] = [];
    const centerNode = treeNodes.find(n => n.relationship === "Self");
    if (!centerNode) return connections;

    treeNodes.forEach((node, index) => {
      if (node.relationship === "Self") return;

      // Connect to center member
      const pathId = `connection-${index}`;
      let path = "";

      if (node.generation === -1) {
        // Parents connect from above
        path = `M ${centerNode.x} ${centerNode.y - 40} L ${centerNode.x} ${centerNode.y - 80} L ${node.x} ${node.y + 80} L ${node.x} ${node.y + 40}`;
      } else if (node.generation === 0 && node.relationship.toLowerCase().includes('wife') || node.relationship.toLowerCase().includes('husband')) {
        // Spouse connects horizontally
        path = `M ${centerNode.x + 40} ${centerNode.y} L ${node.x - 40} ${node.y}`;
      } else if (node.generation === 0) {
        // Siblings connect at same level
        path = `M ${centerNode.x} ${centerNode.y - 40} L ${centerNode.x} ${centerNode.y - 60} L ${node.x} ${node.y - 60} L ${node.x} ${node.y - 40}`;
      } else if (node.generation === 1) {
        // Children connect from below
        path = `M ${centerNode.x} ${centerNode.y + 40} L ${centerNode.x} ${centerNode.y + 80} L ${node.x} ${node.y - 80} L ${node.x} ${node.y - 40}`;
      }

      if (path) {
        connections.push(
          <path
            key={pathId}
            d={path}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        );
      }
    });

    return connections;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-amber-300 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-2 border-yellow-300 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-amber-400 rounded-full"></div>
      </div>

      {/* Title */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-serif text-amber-800 mb-2">Our Family Tree</h1>
        <p className="text-lg text-amber-600">Generations Connected</p>
      </div>

      {/* SVG Tree Container */}
      <div className="flex justify-center px-4">
        <svg 
          width="100%" 
          height={viewBoxHeight} 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="border border-amber-200 rounded-lg bg-white/20 backdrop-blur-sm max-w-6xl"
        >
          {/* Connection Lines */}
          <g className="connections">
            {generateConnections()}
          </g>

          {/* Family Members */}
          <g className="members">
            {treeNodes.map((node, index) => (
              <g key={`node-${index}`} className="family-member">
                {/* Profile Picture Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="40"
                  fill="white"
                  stroke={node.relationship === "Self" ? "#D4AF37" : "#E5C07B"}
                  strokeWidth={node.relationship === "Self" ? "4" : "2"}
                  className="cursor-pointer hover:stroke-amber-500 transition-colors"
                  onClick={() => onMemberClick?.(node.member.id)}
                />
                
                {/* Profile Picture */}
                {node.member.profilePicture ? (
                  <foreignObject
                    x={node.x - 35}
                    y={node.y - 35}
                    width="70"
                    height="70"
                    className="cursor-pointer"
                    onClick={() => onMemberClick?.(node.member.id)}
                  >
                    <img
                      src={node.member.profilePicture}
                      alt={node.member.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </foreignObject>
                ) : (
                  <foreignObject
                    x={node.x - 20}
                    y={node.y - 20}
                    width="40"
                    height="40"
                    className="cursor-pointer"
                    onClick={() => onMemberClick?.(node.member.id)}
                  >
                    <Users className="w-full h-full text-amber-600" />
                  </foreignObject>
                )}

                {/* Name Label */}
                <rect
                  x={node.x - 80}
                  y={node.y + 55}
                  width="160"
                  height="35"
                  rx="17.5"
                  fill="white"
                  stroke="#E5C07B"
                  strokeWidth="1"
                />
                <text
                  x={node.x}
                  y={node.y + 70}
                  textAnchor="middle"
                  className="text-sm font-medium"
                  style={{ fill: '#92400e' }}
                >
                  {node.member.fullName}
                </text>
                <text
                  x={node.x}
                  y={node.y + 83}
                  textAnchor="middle"
                  className="text-xs"
                  style={{ fill: '#d97706' }}
                >
                  {node.relationship}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-2">Legend</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border-2 border-amber-500"></div>
            <span>Selected Member</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border border-amber-300"></div>
            <span>Family Member</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-1 bg-amber-400" style={{ background: "repeating-linear-gradient(to right, #D4AF37 0, #D4AF37 5px, transparent 5px, transparent 10px)" }}></div>
            <span>Family Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}