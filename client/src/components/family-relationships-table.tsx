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
                      <div className="w-10 h-10 bg-saffron-100 rounded-full flex items-center justify-center">
                        <Users className="text-saffron-600" size={16} />
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            console.log('Navigating to member:', relationship.relatedMember.id);
                            window.location.href = `/member/${relationship.relatedMember.id}`;
                          }}
                          className="font-bold text-temple-brown hover:text-saffron-600 transition-colors text-left underline hover:no-underline"
                        >
                          {relationship.relatedMember.fullName}
                        </button>
                        <p className="text-xs text-gray-500">Member #{relationship.relatedMember.id}</p>
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