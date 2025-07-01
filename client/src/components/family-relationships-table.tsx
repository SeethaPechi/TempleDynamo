import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import type { Member, Relationship } from "@shared/schema";

interface FamilyRelationshipsTableProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
  onMemberClick?: (memberId: number) => void;
}

export function FamilyRelationshipsTable({ 
  member, 
  relationships, 
  onMemberClick 
}: FamilyRelationshipsTableProps) {
  const { t } = useTranslation();
  const { transformRelationshipData, transformRelationshipType, formatDate } = useFormDataTransformation();

  // Transform relationships data for current language
  const localizedRelationships = transformRelationshipData(relationships || []);
  
  console.log('FamilyRelationshipsTable rendered with:', { member: member.fullName, relationshipsCount: localizedRelationships?.length || 0, localizedRelationships });

  // Debug: Check if relationships data is properly formatted
  useEffect(() => {
    if (localizedRelationships && localizedRelationships.length > 0) {
      console.log('First localized relationship:', localizedRelationships[0]);
      console.log('Related member structure:', localizedRelationships[0]?.relatedMember);
    }
  }, [localizedRelationships]);
  
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

  // Get gender-based colors for member names
  const getMemberGenderColor = (gender: string | null) => {
    if (gender === 'Male') return 'text-blue-700 font-semibold';
    if (gender === 'Female') return 'text-pink-700 font-semibold';
    return 'text-gray-700 font-semibold';
  };

  if (!localizedRelationships || localizedRelationships.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('familyTree.noConnections')}</h3>
        <p className="text-gray-500 mb-4">
          {member.fullName} {t('familyTree.noConnectionsDesc')}
        </p>
        <p className="text-sm text-gray-400">
          {t('familyTree.addConnectionsDesc')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Users className="text-saffron-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{member.fullName}</h2>
              <p className="text-saffron-100 text-sm">Family Relationships</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{localizedRelationships.length}</div>
            <div className="text-saffron-100 text-sm">Connections</div>
          </div>
        </div>
      </Card>

      {/* Relationships Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-temple-brown">
            Family Relationships for {member.fullName}
          </h3>
          <p className="text-sm text-gray-600">
            Click on any name to view their detailed profile and family tree
          </p>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-saffron-50">
                <TableHead className="font-semibold text-temple-brown">Member Name</TableHead>
                <TableHead className="font-semibold text-temple-brown">Relationship</TableHead>
                <TableHead className="font-semibold text-temple-brown">Contact</TableHead>
                <TableHead className="font-semibold text-temple-brown">Location</TableHead>
                <TableHead className="font-semibold text-temple-brown text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localizedRelationships.map((relationship) => (
                <TableRow key={relationship.id} className="hover:bg-gray-50">
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        relationship.relatedMember.gender === 'Male' ? 'bg-blue-100' :
                        relationship.relatedMember.gender === 'Female' ? 'bg-pink-100' : 'bg-saffron-100'
                      }`}>
                        <Users className={`${
                          relationship.relatedMember.gender === 'Male' ? 'text-blue-600' :
                          relationship.relatedMember.gender === 'Female' ? 'text-pink-600' : 'text-saffron-600'
                        }`} size={16} />
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            console.log('Navigating to member:', relationship.relatedMember.id);
                            window.location.href = `/member/${relationship.relatedMember.id}`;
                          }}
                          className={`font-bold hover:text-saffron-600 transition-colors text-left underline hover:no-underline ${getMemberGenderColor(relationship.relatedMember.gender)}`}
                        >
                          {relationship.relatedMember.fullName}
                        </button>
                        <p className="text-xs text-gray-500">
                          Member #{relationship.relatedMember.id} • {relationship.relatedMember.gender || 'Unspecified'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getRelationshipColor(relationship.relationshipType)}`}
                      >
                        {transformRelationshipType(relationship.relationshipType)}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {relationship.relatedMember.fullName} is the{' '}
                        <span className="font-medium">{relationship.relationshipType.toLowerCase()}</span>{' '}
                        of {member.fullName}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 text-saffron-500" size={12} />
                        <span className="font-medium">{relationship.relatedMember.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 text-saffron-500" size={12} />
                        <span className="text-gray-600 truncate max-w-[200px]">
                          {relationship.relatedMember.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 text-saffron-500" size={12} />
                      <span className="text-gray-600">
                        {relationship.relatedMember.currentCity}, {relationship.relatedMember.currentState}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Navigating to member details:', relationship.relatedMember.id);
                          window.location.href = `/member/${relationship.relatedMember.id}`;
                        }}
                        className="bg-saffron-50 hover:bg-saffron-100 text-temple-brown border-saffron-200"
                      >
                        <ExternalLink className="mr-1" size={12} />
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 p-4 bg-gradient-to-r from-temple-light to-saffron-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-temple-brown">{relationships.length}</div>
              <div className="text-sm text-gray-600">Total Relationships</div>
            </div>
            <div>
              <div className="text-xl font-bold text-saffron-600">
                {new Set(relationships.map(r => r.relationshipType)).size}
              </div>
              <div className="text-sm text-gray-600">Relationship Types</div>
            </div>
            <div>
              <div className="text-xl font-bold text-temple-gold">
                {new Set(relationships.map(r => `${r.relatedMember.currentCity}, ${r.relatedMember.currentState}`)).size}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}