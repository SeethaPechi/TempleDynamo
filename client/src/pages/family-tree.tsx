import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Plus, Heart, UserPlus, TreePine } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Member, Relationship } from "@shared/schema";

const relationshipTypes = [
  "Spouse", "Parent", "Child", "Sibling", "Grandparent", "Grandchild", 
  "Uncle", "Aunt", "Cousin", "Nephew", "Niece", "In-law"
];

export default function FamilyTree() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState("");
  const [relatedMemberId, setRelatedMemberId] = useState<number | null>(null);

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: memberRelationships = [] } = useQuery({
    queryKey: ["/api/relationships", selectedMember?.id],
    enabled: !!selectedMember?.id,
  });

  // Search for members
  const searchMembers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/members/search?term=${encodeURIComponent(term)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        // Fallback to client-side search if API fails
        const filtered = (allMembers as Member[]).filter((member: Member) => 
          member.fullName.toLowerCase().includes(term.toLowerCase()) ||
          member.email.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      // Fallback to client-side search
      const filtered = (allMembers as Member[]).filter((member: Member) => 
        member.fullName.toLowerCase().includes(term.toLowerCase()) ||
        member.email.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: { memberId: number; relatedMemberId: number; relationshipType: string }) => {
      return apiRequest("/api/relationships", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      setIsAddRelationshipOpen(false);
      setRelationshipType("");
      setRelatedMemberId(null);
    },
  });

  const handleAddRelationship = () => {
    if (selectedMember && relatedMemberId && relationshipType) {
      addRelationshipMutation.mutate({
        memberId: selectedMember.id,
        relatedMemberId,
        relationshipType,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TreePine className="text-temple-brown mr-4" size={48} />
            <h1 className="text-4xl font-bold text-temple-brown">Family Tree</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore family connections and relationships within our temple community
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Member Search & Selection Panel */}
          <Card className="p-6 h-fit">
            <h2 className="text-xl font-semibold text-temple-brown mb-4 flex items-center">
              <Search className="mr-2" size={20} />
              Select Member
            </h2>
            
            <div className="space-y-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchMembers(e.target.value);
                }}
                className="w-full"
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((member: Member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMember?.id === member.id 
                          ? 'bg-saffron-100 border-saffron-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <h4 className="font-medium text-gray-900">{member.fullName}</h4>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-sm text-gray-500">{member.currentCity}, {member.currentState}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* All Members List (when no search) */}
              {!searchTerm && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">All Members:</h4>
                  {(allMembers as Member[]).map((member: Member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMember?.id === member.id 
                          ? 'bg-saffron-100 border-saffron-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <h4 className="font-medium text-gray-900">{member.fullName}</h4>
                      <p className="text-sm text-gray-500">{member.currentCity}, {member.currentState}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Member Details & Family Tree */}
          <div className="lg:col-span-2 space-y-6">
            {selectedMember ? (
              <>
                {/* Selected Member Details */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-saffron-500 rounded-full flex items-center justify-center">
                        <Users className="text-white" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-temple-brown">{selectedMember.fullName}</h2>
                        <p className="text-gray-600">{selectedMember.email}</p>
                        <p className="text-gray-600">{selectedMember.phone}</p>
                      </div>
                    </div>
                    
                    <Dialog open={isAddRelationshipOpen} onOpenChange={setIsAddRelationshipOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-saffron-500 hover:bg-saffron-600">
                          <Plus className="mr-2" size={16} />
                          Add Relationship
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Family Relationship</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Relationship Type</label>
                            <Select value={relationshipType} onValueChange={setRelationshipType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship..." />
                              </SelectTrigger>
                              <SelectContent>
                                {relationshipTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Related Member</label>
                            <Select value={relatedMemberId?.toString() || ""} onValueChange={(value) => setRelatedMemberId(Number(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select member..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(allMembers as Member[])
                                  .filter(m => m.id !== selectedMember.id)
                                  .map((member: Member) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                      {member.fullName}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={handleAddRelationship}
                            className="w-full bg-saffron-500 hover:bg-saffron-600"
                            disabled={!relationshipType || !relatedMemberId || addRelationshipMutation.isPending}
                          >
                            {addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Birth Information</h4>
                      <p className="text-gray-600">{selectedMember.birthCity}, {selectedMember.birthState}</p>
                      <p className="text-gray-600">{selectedMember.birthCountry}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Current Location</h4>
                      <p className="text-gray-600">{selectedMember.currentCity}, {selectedMember.currentState}</p>
                      <p className="text-gray-600">{selectedMember.currentCountry}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Parents</h4>
                      <p className="text-gray-600">Father: {selectedMember.fatherName}</p>
                      <p className="text-gray-600">Mother: {selectedMember.motherName}</p>
                    </div>
                  </div>
                </Card>

                {/* Family Relationships */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-4 flex items-center">
                    <Heart className="mr-2" size={20} />
                    Family Relationships
                  </h3>
                  
                  {memberRelationships.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {memberRelationships.map((relationship: any) => (
                        <div key={relationship.id} className="bg-gradient-to-r from-saffron-50 to-temple-gold-50 p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-saffron-500 rounded-full flex items-center justify-center">
                              <UserPlus className="text-white" size={16} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-temple-brown">{relationship.relatedMember.fullName}</h4>
                              <p className="text-sm text-gray-600">{relationship.relationshipType}</p>
                              <p className="text-xs text-gray-500">{relationship.relatedMember.currentCity}, {relationship.relatedMember.currentState}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Family className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-500">No family relationships added yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Click "Add Relationship" to connect family members.</p>
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Member</h3>
                <p className="text-gray-500">Choose a member from the search panel to view their family tree</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}