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
import { useFormDataTransformation } from "@/lib/i18n-utils";

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
  const { transformRelationshipType } = useFormDataTransformation();
  // Get unique color coding for each relationship type
  const getRelationshipColor = (relationship: string) => {
    const type = relationship.toLowerCase().replace(/\s+/g, '');
    
    // Each relationship gets its own unique color
    const relationshipColors: Record<string, string> = {
      // Parents
      'father': 'bg-blue-600 text-white border-blue-700',
      'mother': 'bg-rose-500 text-white border-rose-600',
      
      // Grandparents
      'paternalgrandfather': 'bg-slate-800 text-white border-slate-900', // Dark blue
      'paternalgrandmother': 'bg-slate-600 text-white border-slate-700',
      'maternalgrandfather': 'bg-purple-800 text-white border-purple-900', // Velvet
      'maternalgrandmother': 'bg-purple-600 text-white border-purple-700',
      
      // Spouses
      'husband': 'bg-emerald-600 text-white border-emerald-700',
      'wife': 'bg-pink-600 text-white border-pink-700',
      'spouse': 'bg-teal-600 text-white border-teal-700',
      
      // Children
      'son': 'bg-indigo-600 text-white border-indigo-700',
      'daughter': 'bg-pink-500 text-white border-pink-600',
      'child': 'bg-purple-500 text-white border-purple-600',
      
      // Siblings
      'brother': 'bg-green-600 text-white border-green-700',
      'sister': 'bg-pink-400 text-white border-pink-500',
      'elderbrother': 'bg-green-700 text-white border-green-800',
      'eldersister': 'bg-pink-600 text-white border-pink-700',
      'youngerbrother': 'bg-green-500 text-white border-green-600',
      'youngersister': 'bg-pink-300 text-gray-800 border-pink-400',
      
      // Uncles and Aunts
      'paternaluncle': 'bg-orange-600 text-white border-orange-700',
      'paternalaunt': 'bg-orange-400 text-white border-orange-500',
      'maternaluncle': 'bg-amber-600 text-white border-amber-700',
      'maternalaunt': 'bg-amber-400 text-white border-amber-500',
      'uncle': 'bg-yellow-600 text-white border-yellow-700',
      'aunt': 'bg-yellow-400 text-gray-800 border-yellow-500',
      
      // Extended family
      'cousin': 'bg-lime-600 text-white border-lime-700',
      'nephew': 'bg-cyan-600 text-white border-cyan-700',
      'niece': 'bg-cyan-400 text-white border-cyan-500',
      'grandson': 'bg-violet-600 text-white border-violet-700',
      'granddaughter': 'bg-violet-400 text-white border-violet-500',
      
      // In-laws
      'fatherinlaw': 'bg-gray-700 text-white border-gray-800',
      'motherinlaw': 'bg-gray-500 text-white border-gray-600',
      'brotherinlaw': 'bg-stone-600 text-white border-stone-700',
      'sisterinlaw': 'bg-stone-400 text-white border-stone-500',
    };
    
    return relationshipColors[type] || 'bg-gray-400 text-white border-gray-500';
  };

  // Get gender-based colors for member cards
  const getMemberGenderColor = (gender: string | null) => {
    if (gender === 'Male') return 'bg-blue-50 border-blue-200 text-blue-900';
    if (gender === 'Female') return 'bg-pink-50 border-pink-200 text-pink-900';
    return 'bg-gray-50 border-gray-200 text-gray-900';
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
      {/* Main Member Header with Gender-Based Colors */}
      <Card className={`p-6 ${member.gender === 'Male' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                               member.gender === 'Female' ? 'bg-gradient-to-r from-pink-500 to-pink-600' : 
                               'bg-gradient-to-r from-saffron-500 to-gold-500'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${member.gender === 'Male' ? 'bg-blue-50' : 
                                          member.gender === 'Female' ? 'bg-pink-50' : 
                                          'bg-white'} rounded-full flex items-center justify-center`}>
              <Users className={`${member.gender === 'Male' ? 'text-blue-600' : 
                                  member.gender === 'Female' ? 'text-pink-600' : 
                                  'text-saffron-500'}`} size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.fullName}</h1>
              <p className={`${member.gender === 'Male' ? 'text-blue-100' : 
                             member.gender === 'Female' ? 'text-pink-100' : 
                             'text-saffron-100'}`}>
                Member #{member.id} • {member.gender || 'Unspecified'}
              </p>
              <div className={`flex items-center mt-2 ${member.gender === 'Male' ? 'text-blue-100' : 
                                                         member.gender === 'Female' ? 'text-pink-100' : 
                                                         'text-saffron-100'}`}>
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
                    {transformRelationshipType(type)}
                  </Badge>
                  <span className="text-sm text-gray-600">({rels.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rels.map((rel) => (
                    <div
                      key={rel.id}
                      className={`p-4 rounded-lg hover:shadow-md transition-all cursor-pointer border hover:border-saffron-300 ${getMemberGenderColor(rel.relatedMember.gender)}`}
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
