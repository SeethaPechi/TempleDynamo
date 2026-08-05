import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Phone, Mail, MapPin, TreePine } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member, Relationship } from "@shared/schema";
import { getGenderColors, getRelationshipColor } from "@/lib/color-utils";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import { withHonorific } from "@/lib/honorific";

interface FamilyTreeProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

export function FamilyTreeVisualization({
  member,
  relationships,
  onMemberClick,
}: FamilyTreeProps) {
  const { t } = useTranslation();
  const { transformRelationshipType, transformMemberData } =
    useFormDataTransformation();

  const groupNameKeyMap: Record<string, string> = {
    "Parents": "familyTree.groups.parents",
    "Spouse": "familyTree.groups.spouse",
    "Children": "familyTree.groups.children",
    "Siblings": "familyTree.groups.siblings",
    "Grand Parents": "familyTree.groups.grandParents",
    "Grand Children": "familyTree.groups.grandChildren",
    "In-Laws": "familyTree.groups.inLaws",
    "Cousins": "familyTree.groups.cousins",
    "Aunts & Uncles": "familyTree.groups.auntsUncles",
    "Other Family Connections": "familyTree.groups.otherConnections",
  };
  const translateGroupName = (name: string) =>
    groupNameKeyMap[name] ? t(groupNameKeyMap[name]) : name;

  // Organize relationships by the 10 family groups
  const organizeByGroups = (
    relationships: Array<Relationship & { relatedMember: Member }>,
  ) => {
    const relationshipGroups = [
      {
        name: "Parents",
        types: ["Father", "Mother", "Step Father", "Step Mother"],
      },
      { name: "Spouse", types: ["Wife", "Husband"] },
      {
        name: "Children",
        types: ["Son", "Daughter", "Step-Son", "Step-Daughter"],
      },
      {
        name: "Siblings",
        types: [
          "Elder Brother",
          "Elder Sister",
          "Younger Brother",
          "Younger Sister",
          "Step-Brother",
          "Step-Sister",
        ],
      },
      {
        name: "Grand Parents",
        types: [
          "Paternal Grandfather",
          "Paternal Grandmother",
          "Maternal Grandfather",
          "Maternal Grandmother",
        ],
      },
      {
        name: "Grand Children",
        types: [
          "Grand Daughter -Son Side",
          "Grand Son-Son Side",
          "Grand Daughter -Daughter Side",
          "Grand Son-Daughter Side",
        ],
      },
      {
        name: "In-Laws",
        types: [
          "Mother-in-Law",
          "Father-in-Law",
          "Brother-in-Law",
          "Sister-in-Law",
          "Son-in-Law",
          "Daughter-in-Law",
        ],
      },
      {
        name: "Cousins",
        types: [
          "Cousin Brother-Father Side",
          "Cousin Sister-Father Side",
          "Cousin Brother-Mother Side",
          "Cousin Sister-Mother Side",
        ],
      },
      {
        name: "Aunts & Uncles",
        types: [
          "Aunt-Father Side",
          "Uncle-Father Side",
          "Aunt-Mother Side",
          "Uncle-Mother Side",
        ],
      },
      { name: "Other Family Connections", types: ["Nephew", "Niece"] },
    ];

    const groups: {
      [key: string]: {
        members: Array<Relationship & { relatedMember: Member }>;
        color: string;
      };
    } = {};

    relationshipGroups.forEach((group, index) => {
      const groupMembers = relationships.filter((rel) =>
        group.types.includes(rel.relationshipType),
      );
      if (groupMembers.length > 0) {
        // Sort Children and Siblings by birth order ascending (eldest first), nulls last
        const sortedMembers = (group.name === "Children" || group.name === "Siblings")
          ? [...groupMembers].sort((a, b) => {
              const ao = (a.relatedMember as any).birthOrder ?? Infinity;
              const bo = (b.relatedMember as any).birthOrder ?? Infinity;
              return ao - bo;
            })
          : groupMembers;
        groups[group.name] = {
          members: sortedMembers,
          color: `hsl(${(index * 36) % 360}, 70%, 85%)`,
        };
      }
    });

    // Add ungrouped relationships to "Other Family Connections"
    const ungroupedRelationships = relationships.filter((rel) => {
      return !relationshipGroups.some((group) =>
        group.types.includes(rel.relationshipType),
      );
    });

    if (ungroupedRelationships.length > 0) {
      if (!groups["Other Family Connections"]) {
        groups["Other Family Connections"] = {
          members: [],
          color: "hsl(0, 0%, 85%)",
        };
      }
      groups["Other Family Connections"].members.push(
        ...ungroupedRelationships,
      );
    }

    return groups;
  };

  const familyGroups = organizeByGroups(relationships);
  const groupNames = Object.keys(familyGroups);

  if (!relationships || relationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="mx-auto mb-4 text-gray-400" size={64} />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          {t("familyTree.noConnections")}
        </h3>
        <p className="text-gray-500">
          {t("familyTree.noConnectionsDesc")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Profile Card */}
      <div className="flex justify-center mb-8">
        <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-black text-center max-w-md">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto overflow-hidden">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={`${member.fullName} profile`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Users className="text-saffron-500" size={36} />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{withHonorific(member.fullName, member.gender, member.maritalStatus)}</h2>
            <p className="text-saffron-100 text-sm mb-2">
              {t("common.member", "Member")} #{member.id}
            </p>
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

      {/* Family Groups */}
      <div className="space-y-8">
        {groupNames.map((groupName) => (
          <div key={groupName} className="relative">
            {/* Group Title */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-temple-brown bg-temple-light px-4 py-2 rounded-full inline-block">
                {translateGroupName(groupName)}
              </h3>
            </div>

            {/* Family Members in this group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {familyGroups[groupName].members.map((relationship) => {
                const birthOrder = (relationship.relatedMember as any).birthOrder as number | null | undefined;
                const showBirthOrder = (groupName === "Children" || groupName === "Siblings") && birthOrder != null;
                return (
                <Card
                  key={relationship.id}
                  className={`p-4 hover:shadow-lg transition-shadow cursor-pointer ${getGenderColors(relationship.relatedMember.gender).background}`}
                  onClick={() => onMemberClick?.(relationship.relatedMember.id)}
                >
                  <div className="space-y-3">
                    {/* Member Avatar */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative">
                        {showBirthOrder && (
                          <span className="absolute -top-1 -right-1 z-10 text-[10px] font-bold text-white bg-green-600 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            {birthOrder}
                          </span>
                        )}
                      <div className="w-12 h-12 bg-gradient-to-br from-saffron-200 to-gold-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {relationship.relatedMember.profilePicture ? (
                          <img
                            src={relationship.relatedMember.profilePicture}
                            alt={`${relationship.relatedMember.fullName} profile`}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Users className="text-temple-brown" size={20} />
                        )}
                      </div>
                      </div>
                      <div className="w-full">
                        <h4
                          className={`font-semibold text-sm break-words leading-tight ${getGenderColors(relationship.relatedMember.gender).text}`}
                        >
                          {withHonorific(relationship.relatedMember.fullName, relationship.relatedMember.gender, relationship.relatedMember.maritalStatus)}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={`text-xs mt-1 ${getRelationshipColor(relationship.relationshipType)}`}
                        >
                          {transformRelationshipType(
                            relationship.relationshipType,
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {relationship.relatedMember.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-1" size={10} />
                          <span className="truncate">
                            {relationship.relatedMember.phone}
                          </span>
                        </div>
                      )}
                      {relationship.relatedMember.email && (
                        <div className="flex items-center">
                          <Mail className="mr-1" size={10} />
                          <span className="truncate">
                            {relationship.relatedMember.email}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="mr-1" size={10} />
                        <span className="truncate">
                          {relationship.relatedMember.currentCity},{" "}
                          {relationship.relatedMember.currentState}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-saffron-50 hover:bg-saffron-100 text-temple-brown border-saffron-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMemberClick?.(relationship.relatedMember.id);
                      }}
                    >
                      {t("familyTree.viewFamilyTree", "View Family Tree")}
                    </Button>
                  </div>
                </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
