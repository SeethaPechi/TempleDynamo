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

  // Get unique color coding for each relationship type
  function getRelationshipColor(relationship: string): string {
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
  }

  // Get gender-based color for member cards
  function getMemberGenderColor(gender: string | null): string {
    if (gender === 'Male') return 'bg-blue-50 border-blue-200';
    if (gender === 'Female') return 'bg-pink-50 border-pink-200';
    return 'bg-gray-50 border-gray-200';
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