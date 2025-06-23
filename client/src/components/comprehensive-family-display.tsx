import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Phone, Mail, MapPin, ArrowRight, Network } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

interface ComprehensiveFamilyDisplayProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  allMembers: Member[];
  allRelationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface ExtendedConnection {
  member: Member;
  directRelationship: string;
  connectionPath: string[];
  distance: number;
}

export function ComprehensiveFamilyDisplay({ 
  member, 
  relationships, 
  allMembers, 
  allRelationships, 
  onMemberClick 
}: ComprehensiveFamilyDisplayProps) {
  
  // Get relationship color coding
  const getRelationshipColor = (relationship: string) => {
    const type = relationship.toLowerCase();
    if (['father', 'mother'].includes(type)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['spouse'].includes(type)) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (['brother', 'sister'].includes(type)) return 'bg-green-100 text-green-800 border-green-200';
    if (['child'].includes(type)) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (['grandfather', 'grandmother'].includes(type)) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (['uncle', 'aunt', 'cousin'].includes(type)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (['nephew', 'niece'].includes(type)) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Find extended family connections (indirect relationships)
  const findExtendedConnections = () => {
    const extendedConnections: ExtendedConnection[] = [];
    const visited = new Set<number>();
    visited.add(member.id);

    // Add direct relationships first
    relationships.forEach(rel => {
      visited.add(rel.relatedMember.id);
    });

    // Find second-degree connections
    relationships.forEach(directRel => {
      const relatedMemberRelationships = allRelationships.filter(
        rel => rel.memberId === directRel.relatedMember.id && !visited.has(rel.relatedMember.id)
      );

      relatedMemberRelationships.forEach(indirectRel => {
        if (!visited.has(indirectRel.relatedMember.id)) {
          const connectionPath = [
            `${directRel.relationshipType} of ${member.fullName}`,
            `${indirectRel.relationshipType} of ${directRel.relatedMember.fullName}`
          ];

          extendedConnections.push({
            member: indirectRel.relatedMember,
            directRelationship: `${indirectRel.relationshipType} of ${directRel.relationshipType}`,
            connectionPath,
            distance: 2
          });
          visited.add(indirectRel.relatedMember.id);
        }
      });
    });

    return extendedConnections.slice(0, 10); // Limit to 10 extended connections
  };

  const extendedConnections = findExtendedConnections();

  // Group relationships by type
  const groupedRelationships = relationships.reduce((groups, rel) => {
    const type = rel.relationshipType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(rel);
    return groups;
  }, {} as Record<string, Array<Relationship & { relatedMember: Member }>>);

  return (
    <div className="space-y-6">
      {/* Main Member Header */}
      <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Users className="text-saffron-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.fullName}</h1>
              <p className="text-saffron-100">Member #{member.id}</p>
              <div className="flex items-center mt-2 text-saffron-100">
                <MapPin className="mr-1" size={14} />
                {member.currentCity}, {member.currentState}
              </div>
            </div>
          </div>
          <div className="text-right text-saffron-100">
            <div className="text-3xl font-bold">{relationships.length}</div>
            <div className="text-sm">Family Connections</div>
          </div>
        </div>
      </Card>

      {/* Direct Family Relationships */}
      {relationships.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
            <Heart className="mr-2" size={20} />
            Direct Family Relationships
          </h2>

          {/* Grouped by Relationship Type */}
          <div className="space-y-6">
            {Object.entries(groupedRelationships).map(([type, rels]) => (
              <div key={type} className="border-l-4 border-saffron-500 pl-4">
                <h3 className="font-semibold text-temple-brown mb-3 flex items-center">
                  <Badge className={`mr-2 ${getRelationshipColor(type)}`}>
                    {type}
                  </Badge>
                  <span className="text-sm text-gray-600">({rels.length})</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rels.map((rel) => (
                    <div 
                      key={rel.id}
                      className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all cursor-pointer border hover:border-saffron-300"
                      onClick={() => onMemberClick?.(rel.relatedMember.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-temple-brown text-lg hover:text-saffron-600 transition-colors">
                          {rel.relatedMember.fullName}
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMemberClick?.(rel.relatedMember.id);
                          }}
                        >
                          View Tree
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="mr-2 text-saffron-500" size={14} />
                          <span className="font-medium">{rel.relatedMember.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="mr-2 text-saffron-500" size={14} />
                          <span className="truncate">{rel.relatedMember.email}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 text-saffron-500" size={14} />
                          <span>{rel.relatedMember.currentCity}, {rel.relatedMember.currentState}</span>
                        </div>
                      </div>

                      {/* Relationship Context */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="font-medium">{rel.relatedMember.fullName}</span>
                          <ArrowRight className="mx-2" size={12} />
                          <span>is the {rel.relationshipType.toLowerCase()} of</span>
                          <ArrowRight className="mx-2" size={12} />
                          <span className="font-medium">{member.fullName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Extended Family Network */}
      {extendedConnections.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-temple-light to-saffron-50">
          <h2 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
            <Network className="mr-2" size={20} />
            Extended Family Network
            <Badge variant="secondary" className="ml-2 bg-saffron-100 text-saffron-800">
              {extendedConnections.length} connections
            </Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extendedConnections.map((connection, index) => (
              <div 
                key={index}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-temple-gold"
                onClick={() => onMemberClick?.(connection.member.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-temple-brown">
                    {connection.member.fullName}
                  </h4>
                  <Badge variant="outline" className="text-xs bg-temple-gold-50 text-temple-gold border-temple-gold">
                    2nd degree
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <div className="font-medium text-temple-brown mb-1">Connection:</div>
                  <div className="text-xs leading-relaxed">
                    {connection.connectionPath.join(' → ')}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="mr-1" size={10} />
                    <span>{connection.member.currentCity}, {connection.member.currentState}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs bg-temple-light hover:bg-temple-gold-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMemberClick?.(connection.member.id);
                    }}
                  >
                    Explore Connection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Family Summary Stats */}
      <Card className="p-6 bg-gradient-to-r from-saffron-50 to-gold-50">
        <h3 className="text-lg font-semibold text-temple-brown mb-4">Family Network Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-saffron-600">{relationships.length}</div>
            <div className="text-sm text-gray-600">Direct Relations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-gold">{extendedConnections.length}</div>
            <div className="text-sm text-gray-600">Extended Network</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-brown">
              {Object.keys(groupedRelationships).length}
            </div>
            <div className="text-sm text-gray-600">Relationship Types</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-saffron-500">
              {relationships.length + extendedConnections.length}
            </div>
            <div className="text-sm text-gray-600">Total Connections</div>
          </div>
        </div>
      </Card>

      {/* No Relationships State */}
      {relationships.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Family Relationships</h3>
          <p className="text-gray-500 mb-4">
            {member.fullName} doesn't have any family relationships added yet.
          </p>
          <p className="text-sm text-gray-400">
            Add family connections to see the complete family network.
          </p>
        </Card>
      )}
    </div>
  );
}