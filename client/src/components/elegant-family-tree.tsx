import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import type { Member, Relationship } from "@shared/schema";

interface ElegantFamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface RelationshipGroup {
  name: string;
  priority: number;
  relationships: string[];
  members: Array<Relationship & { relatedMember: Member }>;
  color: string;
}

export function ElegantFamilyTree({ member, relationships, onMemberClick }: ElegantFamilyTreeProps) {
  console.log(`ElegantFamilyTree: Rendering for member ${member.fullName} with ${relationships.length} relationships`);
  
  const { t } = useTranslation();
  const { transformMemberData, transformRelationshipType } = useFormDataTransformation();
  
  // Define relationship groups with hierarchy and colors
  const relationshipGroups: RelationshipGroup[] = [
    {
      name: "Grand Parents",
      priority: 1,
      relationships: ['Paternal Grandfather', 'Paternal Grandmother', 'Maternal Grandfather', 'Maternal Grandmother'],
      members: [],
      color: "bg-purple-100 border-purple-300"
    },
    {
      name: "Parents",
      priority: 2,
      relationships: ['Father', 'Mother', 'Step Father', 'Step Mother'],
      members: [],
      color: "bg-blue-100 border-blue-300"
    },
    {
      name: "Spouse",
      priority: 3,
      relationships: ['Wife', 'Husband'],
      members: [],
      color: "bg-pink-100 border-pink-300"
    },
    {
      name: "Children",
      priority: 4,
      relationships: ['Son', 'Daughter', 'Step-Son', 'Step-Daughter'],
      members: [],
      color: "bg-green-100 border-green-300"
    },
    {
      name: "Siblings",
      priority: 5,
      relationships: ['Elder Brother', 'Elder Sister', 'Younger Brother', 'Younger Sister', 'Step-Brother', 'Step-Sister'],
      members: [],
      color: "bg-yellow-100 border-yellow-300"
    },
    {
      name: "Grand Children",
      priority: 6,
      relationships: ['Grand Daughter -Son Side', 'Grand Son-Son Side', 'Grand Daughter -Daughter Side', 'Grand Son-Daughter Side'],
      members: [],
      color: "bg-teal-100 border-teal-300"
    },
    {
      name: "In-Laws",
      priority: 7,
      relationships: ['Mother-in-Law', 'Father-in-Law', 'Brother-in-Law', 'Sister-in-Law', 'Son-in-Law', 'Daughter-in-Law'],
      members: [],
      color: "bg-indigo-100 border-indigo-300"
    },
    {
      name: "Aunts & Uncles",
      priority: 8,
      relationships: ['Aunt-Father Side', 'Uncle-Father Side', 'Aunt-Mother Side', 'Uncle-Mother Side'],
      members: [],
      color: "bg-orange-100 border-orange-300"
    },
    {
      name: "Cousins",
      priority: 9,
      relationships: ['Cousin Brother-Father Side', 'Cousin Sister-Father Side', 'Cousin Brother-Mother Side', 'Cousin Sister-Mother Side'],
      members: [],
      color: "bg-red-100 border-red-300"
    },
    {
      name: "Other Family Connections",
      priority: 10,
      relationships: ['Nephew', 'Niece'],
      members: [],
      color: "bg-gray-100 border-gray-300"
    }
  ];

  // Organize relationships into groups
  relationships.forEach(rel => {
    let assigned = false;
    relationshipGroups.forEach(group => {
      if (group.relationships.includes(rel.relationshipType)) {
        group.members.push(rel);
        assigned = true;
      }
    });
    
    // If relationship type not found in predefined groups, add to "Other Family Connections"
    if (!assigned) {
      console.log(`Unknown relationship type: ${rel.relationshipType}, adding to Other Family Connections`);
      relationshipGroups[9].members.push(rel);
    }
  });

  // Filter out empty groups and sort by priority
  const activeGroups = relationshipGroups
    .filter(group => group.members.length > 0)
    .sort((a, b) => a.priority - b.priority);
  
  console.log('Organized relationship groups:', activeGroups.map(g => ({ name: g.name, count: g.members.length })));

  const renderMemberCard = (rel: Relationship & { relatedMember: Member }, isCenter: boolean = false) => {
    const memberToShow = isCenter ? member : rel.relatedMember;
    const transformedMember = transformMemberData(memberToShow);
    const hasProfilePicture = memberToShow.profilePicture && memberToShow.profilePicture.length > 0;
    
    return (
      <div 
        key={isCenter ? `center-${memberToShow.id}` : `member-${rel.id}`}
        className={`flex flex-col items-center ${isCenter ? 'mx-4' : 'mx-2'} ${onMemberClick ? 'cursor-pointer' : ''}`}
        onClick={() => !isCenter && onMemberClick?.(rel.relatedMemberId)}
      >
        {/* Profile Picture Circle */}
        <div className={`relative ${isCenter ? 'w-20 h-20 mb-3' : 'w-16 h-16 mb-2'}`}>
          <div className={`w-full h-full rounded-full border-4 ${isCenter ? 'border-saffron-500 bg-saffron-50' : 'border-temple-gold bg-temple-cream'} flex items-center justify-center overflow-hidden`}>
            {hasProfilePicture ? (
              <img 
                src={memberToShow.profilePicture} 
                alt={memberToShow.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className={`${isCenter ? 'w-10 h-10' : 'w-8 h-8'} text-temple-brown`} />
            )}
          </div>
          
          {/* Gender indicator for non-center members */}
          {!isCenter && (
            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${
              memberToShow.gender === 'Male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
            }`}>
              {memberToShow.gender === 'Male' ? 'ஆ' : 'பெ'}
            </div>
          )}
        </div>
        
        {/* Name */}
        <div className={`text-center ${isCenter ? 'max-w-32' : 'max-w-24'}`}>
          <p className={`${isCenter ? 'text-base font-bold' : 'text-sm font-medium'} text-temple-brown leading-tight`}>
            {memberToShow.fullName}
          </p>
          {!isCenter && (
            <p className="text-xs text-temple-gold mt-1">
              {transformRelationshipType(rel.relationshipType)}
            </p>
          )}
          {isCenter && (
            <p className="text-sm text-saffron-600 font-medium mt-1">
              {t('common.self', 'Self')}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderConnectionLines = (groupIndex: number, memberCount: number) => {
    if (memberCount <= 1) return null;
    
    return (
      <div className="flex justify-center my-2">
        <svg width="300" height="40" className="overflow-visible">
          {/* Horizontal line connecting all members */}
          <line 
            x1="50" 
            y1="20" 
            x2="250" 
            y2="20" 
            stroke="#D4AF37" 
            strokeWidth="2"
            className="opacity-60"
          />
          {/* Individual connection points */}
          {Array.from({ length: memberCount }).map((_, index) => (
            <circle 
              key={index}
              cx={50 + (200 / Math.max(1, memberCount - 1)) * index}
              cy="20"
              r="4"
              fill="#D4AF37"
              className="opacity-80"
            />
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-temple-cream to-saffron-50 rounded-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-temple-brown mb-2" style={{ fontFamily: 'serif' }}>
          Family Tree
        </h2>
        <p className="text-lg text-temple-gold">
          Centered on {member.fullName}
        </p>
        <div className="w-24 h-1 bg-saffron-500 mx-auto mt-4 rounded"></div>
      </div>

      {/* Family Tree Structure */}
      <div className="space-y-8">
        {activeGroups.map((group, groupIndex) => (
          <Card key={group.name} className={`p-6 ${group.color} shadow-md`}>
            {/* Group Header */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-temple-brown mb-2">
                {group.name}
              </h3>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-0.5 bg-temple-gold rounded"></div>
                <Heart className="w-4 h-4 text-temple-gold" />
                <div className="w-8 h-0.5 bg-temple-gold rounded"></div>
              </div>
            </div>

            {/* Connection Lines */}
            {renderConnectionLines(groupIndex, group.members.length)}

            {/* Special layout for Spouse group with Self in center */}
            {group.name === "Spouse" && group.members.length > 0 ? (
              <div className="flex justify-center items-center">
                <div className="flex items-center">
                  {renderMemberCard(group.members[0])}
                  <Heart className="w-6 h-6 text-red-500 mx-4" />
                  <div className="flex flex-col items-center mx-2">
                    <div className="relative w-20 h-20 mb-3">
                      <div className="w-full h-full rounded-full border-4 border-saffron-500 bg-saffron-50 flex items-center justify-center overflow-hidden">
                        {member.profilePicture ? (
                          <img 
                            src={member.profilePicture} 
                            alt={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-10 h-10 text-temple-brown" />
                        )}
                      </div>
                    </div>
                    <div className="text-center max-w-32">
                      <p className="text-base font-bold text-temple-brown leading-tight">
                        {member.fullName}
                      </p>
                      <p className="text-sm text-saffron-600 font-medium mt-1">
                        Self
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular layout for all other groups */
              <div className="flex flex-wrap justify-center items-center gap-4">
                {group.members.map((rel) => renderMemberCard(rel))}
              </div>
            )}
          </Card>
        ))}

        {/* Center Self Card if no relationships */}
        {activeGroups.length === 0 && (
          <Card className="p-8 bg-saffron-50 border-saffron-300 shadow-md">
            <div className="text-center">
              <h3 className="text-xl font-bold text-temple-brown mb-4">Family Tree</h3>
              <div className="flex justify-center">
                {renderMemberCard({ relatedMember: member } as any, true)}
              </div>
              <p className="text-temple-gold mt-4">
                No family relationships recorded yet.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-temple-brown mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Male</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pink-500"></div>
            <span>Female</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Marriage</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-temple-gold"></div>
            <span>Family Line</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-saffron-500 rounded-full bg-saffron-50"></div>
            <span>Selected Member</span>
          </div>
        </div>
      </div>

      {/* Family Statistics */}
      <div className="mt-6 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-saffron-600">{relationships.length}</div>
            <div className="text-sm text-temple-brown">Total Connections</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-temple-gold">{activeGroups.length}</div>
            <div className="text-sm text-temple-brown">Relationship Types</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-temple-red">
              {relationships.filter(r => r.relatedMember.gender === 'Male').length}
            </div>
            <div className="text-sm text-temple-brown">Male Relatives</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-temple-crimson">
              {relationships.filter(r => r.relatedMember.gender === 'Female').length}
            </div>
            <div className="text-sm text-temple-brown">Female Relatives</div>
          </div>
        </div>
      </div>
    </div>
  );
}