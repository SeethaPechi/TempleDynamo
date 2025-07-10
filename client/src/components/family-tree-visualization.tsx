import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Phone, Mail, MapPin, TreePine } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";
import { getGenderColors, getRelationshipColor } from "@/lib/color-utils";

interface FamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface FamilyNode {
  member: Member;
  relationship: string;
  generation: number;
  position: number;
}

export function FamilyTreeVisualization({ member, relationships, onMemberClick }: FamilyTreeProps) {
  // Organize relationships by generation and type
  const organizeByGeneration = (relationships: Array<Relationship & { relatedMember: Member }>) => {
    const generations: { [key: number]: FamilyNode[] } = {};
    
    relationships.forEach((rel) => {
      let generation = 0;
      let position = 0;
      
      // Determine generation based on relationship type
      switch (rel.relationshipType.toLowerCase()) {
        case 'grandfather':
        case 'grandmother':
          generation = -2;
          break;
        case 'father':
        case 'mother':
          generation = -1;
          position = rel.relationshipType.toLowerCase() === 'father' ? 0 : 1;
          break;
        case 'uncle':
        case 'aunt':
          generation = -1;
          position = 2;
          break;
        case 'spouse':
          generation = 0;
          position = 0;
          break;
        case 'brother':
        case 'sister':
          generation = 0;
          position = rel.relationshipType.toLowerCase() === 'brother' ? 1 : 2;
          break;
        case 'cousin':
          generation = 0;
          position = 3;
          break;
        case 'child':
          generation = 1;
          break;
        case 'nephew':
        case 'niece':
          generation = 1;
          position = 1;
          break;
        default:
          generation = 0;
          position = 999; // Other relationships
      }
      
      if (!generations[generation]) {
        generations[generation] = [];
      }
      
      generations[generation].push({
        member: rel.relatedMember,
        relationship: rel.relationshipType,
        generation,
        position
      });
    });
    
    // Sort each generation by position
    Object.keys(generations).forEach(gen => {
      generations[parseInt(gen)].sort((a, b) => a.position - b.position);
    });
    
    return generations;
  };

  const generations = organizeByGeneration(relationships);
  const generationKeys = Object.keys(generations).map(Number).sort((a, b) => a - b);

  const getGenerationTitle = (generation: number) => {
    switch (generation) {
      case -2: return "Grandparents";
      case -1: return "Parents & Aunts/Uncles";
      case 0: return "Spouse & Siblings";
      case 1: return "Children & Nephews/Nieces";
      case 2: return "Grandchildren";
      default: return "Extended Family";
    }
  };

  const getRelationshipColor = (relationship: string) => {
    const type = relationship.toLowerCase();
    if (['father', 'mother'].includes(type)) return 'bg-blue-100 text-blue-800';
    if (['spouse'].includes(type)) return 'bg-pink-100 text-pink-800';
    if (['brother', 'sister'].includes(type)) return 'bg-green-100 text-green-800';
    if (['child'].includes(type)) return 'bg-purple-100 text-purple-800';
    if (['grandfather', 'grandmother'].includes(type)) return 'bg-gray-100 text-gray-800';
    if (['uncle', 'aunt', 'cousin'].includes(type)) return 'bg-yellow-100 text-yellow-800';
    if (['nephew', 'niece'].includes(type)) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!relationships || relationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TreePine className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Family Connections</h3>
        <p className="text-gray-500">Add family relationships to see the family tree visualization</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Central Member */}
      <div className="flex justify-center mb-8">
        <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white max-w-lg">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.fullName} profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="text-saffron-500" size={36} />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{member.fullName}</h2>
            <p className="text-saffron-100 text-sm mb-2">Member #{member.id}</p>
            <div className="flex items-center justify-center text-saffron-100 text-sm mb-4">
              <MapPin className="mr-1" size={14} />
              {member.currentCity}, {member.currentState}
            </div>
            <div className="flex items-center justify-center text-saffron-100 text-sm">
              <Phone className="mr-1" size={12} />
              {member.phone}
            </div>
          </div>
        </Card>
      </div>

      {/* All Related Members Summary */}
      {relationships && relationships.length > 0 && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-temple-light to-saffron-50">
          <h3 className="text-xl font-semibold text-temple-brown mb-4 text-center">
            Family Connections for {member.fullName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationships.map((relationship) => (
              <div 
                key={relationship.id} 
                className={`p-4 rounded-lg border-l-4 border-saffron-500 hover:shadow-md transition-shadow cursor-pointer ${getGenderColors(relationship.relatedMember.gender).background}`}
                onClick={() => onMemberClick?.(relationship.relatedMember.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold text-lg ${getGenderColors(relationship.relatedMember.gender).text}`}>
                    {relationship.relatedMember.fullName}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className={getRelationshipColor(relationship.relationshipType)}
                  >
                    {relationship.relationshipType}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone className="mr-2" size={12} />
                    <span>{relationship.relatedMember.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2" size={12} />
                    <span className="truncate">{relationship.relatedMember.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2" size={12} />
                    <span>{relationship.relatedMember.currentCity}, {relationship.relatedMember.currentState}</span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-saffron-50 hover:bg-saffron-100 text-temple-brown border-saffron-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMemberClick?.(relationship.relatedMember.id);
                    }}
                  >
                    View Family Tree
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Family Generations */}
      <div className="space-y-8">
        {generationKeys.map((generation) => (
          <div key={generation} className="relative">
            {/* Generation Title */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-temple-brown bg-temple-light px-4 py-2 rounded-full inline-block">
                {getGenerationTitle(generation)}
              </h3>
            </div>

            {/* Connection Lines */}
            {generation !== 0 && (
              <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-8 bg-gray-300 -top-8"></div>
            )}

            {/* Family Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generations[generation].map((node, index) => (
                <Card 
                  key={node.member.id} 
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onMemberClick?.(node.member.id)}
                >
                  <div className="space-y-3">
                    {/* Member Avatar */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-saffron-200 to-gold-200 rounded-full flex items-center justify-center overflow-hidden">
                        {node.member.profilePicture ? (
                          <img
                            src={node.member.profilePicture}
                            alt={`${node.member.fullName} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="text-temple-brown" size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-temple-brown text-sm truncate">
                          {node.member.fullName}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRelationshipColor(node.relationship)}`}
                        >
                          {node.relationship}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Phone className="mr-1" size={10} />
                        <span className="truncate">{node.member.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="mr-1" size={10} />
                        <span className="truncate">{node.member.email}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-1" size={10} />
                        <span className="truncate">
                          {node.member.currentCity}, {node.member.currentState}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMemberClick?.(node.member.id);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Horizontal connection line for siblings */}
            {generation === 0 && generations[generation].length > 1 && (
              <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-gray-300 transform -translate-y-1/2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Family Statistics */}
      <Card className="p-6 bg-gradient-to-r from-temple-light to-saffron-50">
        <h3 className="text-lg font-semibold text-temple-brown mb-4 flex items-center">
          <Heart className="mr-2" size={20} />
          Family Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-saffron-600">
              {relationships.length}
            </div>
            <div className="text-sm text-gray-600">Total Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-gold">
              {generationKeys.length}
            </div>
            <div className="text-sm text-gray-600">Generations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-brown">
              {relationships.filter(r => ['Father', 'Mother'].includes(r.relationshipType)).length}
            </div>
            <div className="text-sm text-gray-600">Parents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-saffron-500">
              {relationships.filter(r => r.relationshipType === 'Child').length}
            </div>
            <div className="text-sm text-gray-600">Children</div>
          </div>
        </div>
      </Card>
    </div>
  );
}