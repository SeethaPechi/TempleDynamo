import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Heart,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Network,
} from "lucide-react";
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
  onMemberClick,
}: ComprehensiveFamilyDisplayProps) {
  // Get relationship color coding
  const getRelationshipColor = (relationship: string) => {
    const type = relationship.toLowerCase();
    if (["father", "mother"].includes(type))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (["spouse"].includes(type))
      return "bg-pink-100 text-pink-800 border-pink-200";
    if (["brother", "sister"].includes(type))
      return "bg-green-100 text-green-800 border-green-200";
    if (["child"].includes(type))
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (["grandfather", "grandmother"].includes(type))
      return "bg-gray-100 text-gray-800 border-gray-200";
    if (["uncle", "aunt", "cousin"].includes(type))
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (["nephew", "niece"].includes(type))
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Only show direct relationships - no extended connections to avoid circular issues
  const extendedConnections: ExtendedConnection[] = [];

  // Group relationships by type
  const groupedRelationships = relationships.reduce(
    (groups, rel) => {
      const type = rel.relationshipType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(rel);
      return groups;
    },
    {} as Record<string, Array<Relationship & { relatedMember: Member }>>,
  );

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
      --
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
                          <span className="font-medium">
                            {rel.relatedMember.phone}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="mr-2 text-saffron-500" size={14} />
                          <span className="truncate">
                            {rel.relatedMember.email}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 text-saffron-500" size={14} />
                          <span>
                            {rel.relatedMember.currentCity},{" "}
                            {rel.relatedMember.currentState}
                          </span>
                        </div>
                      </div>

                      {/* Relationship Context
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="font-medium">
                            {rel.relatedMember.fullName}
                          </span>
                          <ArrowRight className="mx-2" size={12} />
                          <span>
                            is the {rel.relationshipType.toLowerCase()} of
                          </span>
                          <ArrowRight className="mx-2" size={12} />
                          <span className="font-medium">{member.fullName}</span>
                        </div> 
                      </div>*/}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      --
      {/* Family Summary Stats */}
      <Card className="p-6 bg-gradient-to-r from-saffron-50 to-gold-50">
        <h3 className="text-lg font-semibold text-temple-brown mb-4">
          Family Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-saffron-600">
              {relationships.length}
            </div>
            <div className="text-sm text-gray-600">Direct Relations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-brown">
              {Object.keys(groupedRelationships).length}
            </div>
            <div className="text-sm text-gray-600">Relationship Types</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-temple-gold">
              {relationships.filter((r) =>
                ["Father", "Mother"].includes(r.relationshipType),
              ).length +
                relationships.filter((r) =>
                  ["Son", "Daughter"].includes(r.relationshipType),
                ).length}
            </div>
            <div className="text-sm text-gray-600">Family Members</div>
          </div>
        </div>
      </Card>
      {/* No Relationships State */}
      {relationships.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Family Relationships
          </h3>
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
