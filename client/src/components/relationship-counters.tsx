import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Heart, Phone, Mail, MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import type { Member, Relationship } from "@shared/schema";

interface RelationshipCountersProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

interface RelationshipCount {
  type: string;
  count: number;
  members: Array<Relationship & { relatedMember: Member }>;
  color: string;
}

export function RelationshipCounters({ member, relationships, onMemberClick }: RelationshipCountersProps) {
  const { t } = useTranslation();
  const { transformRelationshipData, formatDate } = useFormDataTransformation();
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipCount | null>(null);

  // Transform relationships data for current language
  const localizedRelationships = transformRelationshipData(relationships || []);

  // Group relationships by type and count them
  const relationshipCounts = localizedRelationships.reduce((counts, rel) => {
    const type = rel.relationshipType;
    if (!counts[type]) {
      counts[type] = {
        type,
        count: 0,
        members: [],
        color: getRelationshipColor(type)
      };
    }
    counts[type].count++;
    counts[type].members.push(rel);
    return counts;
  }, {} as Record<string, RelationshipCount>);

  // Get color coding for relationship types
  function getRelationshipColor(relationship: string): string {
    const type = relationship.toLowerCase();
    if (['father', 'mother'].includes(type)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['wife', 'husband', 'spouse'].includes(type)) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (['brother', 'sister', 'elder brother', 'elder sister', 'younger brother', 'younger sister'].includes(type)) return 'bg-green-100 text-green-800 border-green-200';
    if (['son', 'daughter', 'child'].includes(type)) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (['paternal grandfather', 'paternal grandmother', 'maternal grandfather', 'maternal grandmother'].includes(type)) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (['uncle', 'aunt', 'cousin', 'paternal uncle', 'maternal uncle'].includes(type)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (['nephew', 'niece'].includes(type)) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (['grand son', 'grand daughter'].includes(type)) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (['father-in-law', 'mother-in-law', 'brother-in-law', 'sister-in-law'].includes(type)) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }

  const counters = Object.values(relationshipCounts).sort((a, b) => b.count - a.count);

  if (counters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Relationships</h3>
        <p className="text-gray-500">
          {member.fullName} doesn't have any family relationships added yet.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Heart className="mr-2 text-saffron-500" size={20} />
            Relationship Summary for {member.fullName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Count */}
          <div className="text-center p-4 bg-gradient-to-r from-saffron-100 to-gold-100 rounded-lg">
            <div className="text-3xl font-bold text-saffron-600">{relationships.length}</div>
            <div className="text-sm text-gray-600">Total Family Connections</div>
          </div>

          {/* Relationship Type Counters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {counters.map((relationshipCount) => (
              <div
                key={relationshipCount.type}
                className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${relationshipCount.color} hover:scale-105`}
                onClick={() => setSelectedRelationship(relationshipCount)}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{relationshipCount.count}</div>
                  <div className="text-xs font-medium leading-tight">
                    {relationshipCount.type}
                    {relationshipCount.count > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            Click on any counter to view members in that relationship
          </div>
        </CardContent>
      </Card>

      {/* Relationship Members Modal */}
      <Dialog open={!!selectedRelationship} onOpenChange={() => setSelectedRelationship(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedRelationship?.type} - {selectedRelationship?.count} Member{selectedRelationship?.count !== 1 ? 's' : ''}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedRelationship(null)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedRelationship?.members.map((rel) => (
              <Card 
                key={rel.id} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  onMemberClick?.(rel.relatedMember.id);
                  setSelectedRelationship(null);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-temple-brown text-lg">
                        {rel.relatedMember.fullName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        #{rel.relatedMember.id}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        {rel.relatedMember.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="mr-2" size={14} />
                            {rel.relatedMember.phone}
                          </div>
                        )}
                        {rel.relatedMember.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="mr-2" size={14} />
                            {rel.relatedMember.email}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="mr-2" size={14} />
                          {rel.relatedMember.currentCity}, {rel.relatedMember.currentState}
                        </div>
                        {rel.relatedMember.maritalStatus && (
                          <div className="flex items-center text-gray-600">
                            <Heart className="mr-2" size={14} />
                            {rel.relatedMember.maritalStatus}
                            {rel.relatedMember.spouseName && rel.relatedMember.maritalStatus === 'Married' && (
                              <span className="ml-1">- {rel.relatedMember.spouseName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-temple-brown">Relationship:</span> {rel.relatedMember.fullName} is the {rel.relationshipType.toLowerCase()} of {member.fullName}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}