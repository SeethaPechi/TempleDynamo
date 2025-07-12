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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { transformRelationshipType, transformMemberData } = useFormDataTransformation();
  // Get unique color coding for each relationship group
  const getRelationshipColor = (groupName: string) => {
    const groupColors: Record<string, string> = {
      'Parents': 'bg-blue-600 text-white border-blue-700',
      'Spouse': 'bg-pink-600 text-white border-pink-700',
      'Children': 'bg-green-600 text-white border-green-700',
      'Siblings': 'bg-yellow-600 text-white border-yellow-700',
      'Grand Parents': 'bg-purple-600 text-white border-purple-700',
      'Grand Children': 'bg-teal-600 text-white border-teal-700',
      'In-Laws': 'bg-indigo-600 text-white border-indigo-700',
      'Cousins': 'bg-red-600 text-white border-red-700',
      'Aunts & Uncles': 'bg-orange-600 text-white border-orange-700',
      'Other Family Connections': 'bg-gray-600 text-white border-gray-700',
    };
    
    return groupColors[groupName] || 'bg-gray-400 text-white border-gray-500';
  };

  // Get gender-based colors for member cards
  const getMemberGenderColor = (gender: string | null) => {
    if (gender === 'Male') return 'bg-blue-50 border-blue-200 text-blue-900';
    if (gender === 'Female') return 'bg-pink-50 border-pink-200 text-pink-900';
    return 'bg-gray-50 border-gray-200 text-gray-900';
  };

  // Only show direct relationships - no extended connections to avoid circular issues
  const extendedConnections: ExtendedConnection[] = [];

  // Define relationship groups with new hierarchy
  const relationshipGroups = [
    { name: "Parents", types: ["Father", "Mother", "Step Father", "Step Mother"] },
    { name: "Spouse", types: ["Wife", "Husband"] },
    { name: "Children", types: ["Son", "Daughter", "Step-Son", "Step-Daughter"] },
    { name: "Siblings", types: ["Elder Brother", "Elder Sister", "Younger Brother", "Younger Sister", "Step-Brother", "Step-Sister"] },
    { name: "Grand Parents", types: ["Paternal Grandfather", "Paternal Grandmother", "Maternal Grandfather", "Maternal Grandmother"] },
    { name: "Grand Children", types: ["Grand Daughter -Son Side", "Grand Son-Son Side", "Grand Daughter -Daughter Side", "Grand Son-Daughter Side"] },
    { name: "In-Laws", types: ["Mother-in-Law", "Father-in-Law", "Brother-in-Law", "Sister-in-Law", "Son-in-Law", "Daughter-in-Law"] },
    { name: "Cousins", types: ["Cousin Brother-Father Side", "Cousin Sister-Father Side", "Cousin Brother-Mother Side", "Cousin Sister-Mother Side"] },
    { name: "Aunts & Uncles", types: ["Aunt-Father Side", "Uncle-Father Side", "Aunt-Mother Side", "Uncle-Mother Side"] },
    { name: "Other Family Connections", types: ["Nephew", "Niece"] }
  ];

  // Group relationships by the new structure
  const groupedRelationships = relationshipGroups.reduce((acc, group) => {
    const groupMembers = relationships.filter(rel => group.types.includes(rel.relationshipType));
    if (groupMembers.length > 0) {
      acc[group.name] = groupMembers;
    }
    return acc;
  }, {} as Record<string, Array<Relationship & { relatedMember: Member }>>);

  // Add any ungrouped relationships to "Other Family Connections"
  const ungroupedRelationships = relationships.filter(rel => {
    return !relationshipGroups.some(group => group.types.includes(rel.relationshipType));
  });
  
  if (ungroupedRelationships.length > 0) {
    if (!groupedRelationships["Other Family Connections"]) {
      groupedRelationships["Other Family Connections"] = [];
    }
    groupedRelationships["Other Family Connections"].push(...ungroupedRelationships);
  }

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
                                          'bg-white'} rounded-full flex items-center justify-center overflow-hidden`}>
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.fullName} profile`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Users className={`${member.gender === 'Male' ? 'text-blue-600' : 
                                    member.gender === 'Female' ? 'text-pink-600' : 
                                    'text-saffron-500'}`} size={32} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.fullName}</h1>
              <p className={`${member.gender === 'Male' ? 'text-blue-100' : 
                             member.gender === 'Female' ? 'text-pink-100' : 
                             'text-saffron-100'}`}>
                {t('common.member', 'Member')} #{member.id} • {transformMemberData(member).gender || t('common.unspecified', 'Unspecified')}
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
            <div className="text-sm">{t('familyTree.familyConnections', 'Family Connections')}</div>
          </div>
        </div>
      </Card>
      --
      {/* Direct Family Relationships */}
      {relationships.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
            <Heart className="mr-2" size={20} />
            {t('familyTree.directRelationships', 'Direct Family Relationships')}
          </h2>

          {/* Grouped by New Relationship Categories */}
          <div className="space-y-6">
            {Object.entries(groupedRelationships).map(([groupName, rels]) => (
              <div key={groupName} className="border-l-4 border-saffron-500 pl-4">
                <h3 className="font-semibold text-temple-brown mb-3 flex items-center">
                  <Badge className={`mr-2 ${getRelationshipColor(groupName)}`}>
                    {groupName}
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
                            {rel.relatedMember.phone || 'Not provided'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="mr-2 text-saffron-500" size={14} />
                          <span className="truncate">
                            {rel.relatedMember.email || 'Not provided'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Badge className="text-xs bg-saffron-500 text-white">
                            {transformRelationshipType(rel.relationshipType)}
                          </Badge>
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
