import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Plus,
  Heart,
  UserPlus,
  TreePine,
  Network,
  BarChart3,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FamilyTreeVisualization } from "@/components/family-tree-visualization";
import { ElegantFamilyTree } from "@/components/elegant-family-tree";
import { FamilyNetworkAnalysis } from "@/components/family-network-analysis";
import { getGenderColors } from "@/lib/color-utils";
import { ComprehensiveFamilyDisplay } from "@/components/comprehensive-family-display";
import { FamilyRelationshipsTable } from "@/components/family-relationships-table";
import { RelationshipCounters } from "@/components/relationship-counters";
import { FamilyStoryExport } from "@/components/family-story-export";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import type { Member, Relationship } from "@shared/schema";

const relationshipTypes = [
  "Father",
  "Mother",
  "Wife",
  "Husband",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Step-Brother",
  "Step-Sister",
  "Paternal Grandfather",
  "Paternal Grandmother",
  "Maternal Grandfather",
  "Maternal Grandmother",
  "Grand Daugher",
  "Grand Son",
  "Nephew",
  "Niece",
  "Mother-in-Law",
  "Father-in-Law",
  "Brother-in-Law",
  "Sister-in-Law",
  "Aunt",
  "Uncle",
  "Cousin",
  "Other",
];

// Helper function to check if member profile is incomplete
const isProfileIncomplete = (member: Member, relationships: Array<Relationship & { relatedMember: Member }>) => {
  // Check for missing critical information
  const hasEmptyFields = !member.email || !member.phone || !member.currentCity || !member.currentState;
  const hasNoRelationships = relationships.length === 0;
  const hasMinimalInfo = !member.fatherName && !member.motherName && !member.spouseName;
  
  return hasEmptyFields || hasNoRelationships || hasMinimalInfo;
};

export default function FamilyTree() {
  const { t } = useTranslation();
  const { transformMemberData } = useFormDataTransformation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState("");
  const [relatedMemberId, setRelatedMemberId] = useState<number | null>(null);

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  // Handle URL parameters for direct member selection
  useEffect(() => {
    if (location && allMembers.length > 0) {
      const urlParams = new URLSearchParams(location.split("?")[1]);
      const memberId = urlParams.get("member");
      if (memberId && !selectedMember) {
        const member = (allMembers as Member[]).find(
          (m) => m.id === parseInt(memberId),
        );
        if (member) {
          setSelectedMember(member);
        }
      }
    }
  }, [location, allMembers, selectedMember]);

  const { data: memberRelationships = [], isLoading: relationshipsLoading } =
    useQuery<Array<Relationship & { relatedMember: Member }>>({
      queryKey: ["/api/relationships", selectedMember?.id],
      enabled: !!selectedMember?.id,
    });

  const { data: allRelationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
    queryFn: async () => {
      const response = await fetch("/api/relationships");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Filter relationships to show only those belonging to the selected member
  const filteredMemberRelationships = selectedMember
    ? (
        memberRelationships as Array<Relationship & { relatedMember: Member }>
      ).filter((rel) => rel.memberId === selectedMember.id)
    : [];

  console.log("Selected member:", selectedMember?.fullName);
  console.log("All relationships for member:", memberRelationships);
  console.log("Filtered relationships:", filteredMemberRelationships);

  // Check for incomplete profiles and redirect to member details
  useEffect(() => {
    if (selectedMember && filteredMemberRelationships) {
      const isIncomplete = isProfileIncomplete(selectedMember, filteredMemberRelationships);
      if (isIncomplete) {
        // Show toast with helpful message
        toast({
          title: "Profile Incomplete",
          description: `${selectedMember.fullName}'s profile needs more information. Redirecting to complete details...`,
          duration: 3000,
        });
        
        // Redirect to member details page after a short delay
        setTimeout(() => {
          navigate(`/member-details/${selectedMember.id}?from=family-tree&incomplete=true`);
        }, 2000);
      }
    }
  }, [selectedMember, filteredMemberRelationships, navigate, toast]);

  // Search for members
  const searchMembers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/members/search?term=${encodeURIComponent(term)}`,
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        // Fallback to client-side search if API fails
        const filtered = (allMembers as Member[]).filter(
          (member: Member) =>
            member.fullName.toLowerCase().includes(term.toLowerCase()) ||
            (member.email &&
              member.email.toLowerCase().includes(term.toLowerCase())),
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      // Fallback to client-side search
      const filtered = (allMembers as Member[]).filter(
        (member: Member) =>
          member.fullName.toLowerCase().includes(term.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(term.toLowerCase())),
      );
      setSearchResults(filtered);
    }
  };

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: {
      memberId: number;
      relatedMemberId: number;
      relationshipType: string;
    }) => {
      return apiRequest("POST", "/api/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/relationships", selectedMember?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships"] });
      setIsAddRelationshipOpen(false);
      setRelationshipType("");
      setRelatedMemberId(null);
      toast({
        title: "Relationship Added",
        description: "Family relationship has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add relationship. Please try again.",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saffron-500 mx-auto"></div>
          <p className="mt-4 text-temple-brown">Loading family tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TreePine className="text-temple-brown mr-4" size={48} />
            <h1 className="text-4xl font-bold text-temple-brown">
              {t("familyTree.title")}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("familyTree.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="elegant" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-6 w-full max-w-6xl h-auto py-2">
              <TabsTrigger
                value="explorer"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <Search size={14} />
                <span className="text-center leading-tight">
                  {t("familyTree.selectMember")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="elegant"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <TreePine size={14} />
                <span className="text-center leading-tight">Family Branch</span>
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <Users size={14} />
                <span className="text-center leading-tight">
                  {t("familyTree.directRelationships")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="comprehensive"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <Heart size={14} />
                <span className="text-center leading-tight">
                  {t("familyTree.allRelations")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="network"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <Network size={14} />
                <span className="text-center leading-tight">
                  {t("familyTree.familyNetworkAnalysis")}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="counters"
                className="flex flex-col items-center gap-1 text-xs px-1 py-2 min-h-[3rem]"
              >
                <BarChart3 size={14} />
                <span className="text-center leading-tight">
                  Relationship Counters
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="elegant" className="space-y-8">
            {selectedMember && filteredMemberRelationships ? (
              <div className="min-h-screen">
                <ElegantFamilyTree
                  member={selectedMember}
                  relationships={filteredMemberRelationships}
                  onMemberClick={(memberId) => {
                    const clickedMember = allMembers?.find(
                      (m: Member) => m.id === memberId,
                    );
                    if (clickedMember) {
                      setSelectedMember(clickedMember);
                    }
                  }}
                />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <TreePine className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a family member to view their elegant family tree
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="explorer" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Search Panel */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-temple-brown mb-4">
                    {t("familyTree.searchMember")}
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t("familyTree.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          searchMembers(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((member: Member) => {
                          const colors = getGenderColors(member.gender);
                          const transformedMember = transformMemberData(member);
                          return (
                            <div
                              key={member.id}
                              onClick={() => setSelectedMember(member)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${colors.background} ${colors.border} border ${
                                selectedMember?.id === member.id
                                  ? "ring-2 ring-saffron-400"
                                  : "hover:shadow-md"
                              }`}
                            >
                              <h4 className={`font-medium ${colors.text}`}>
                                {member.fullName}{" "}
                                {transformedMember.gender &&
                                  `• ${transformedMember.gender}`}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.currentCity}, {member.currentState}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {searchTerm && searchResults.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t("familyTree.memberNotFound")}
                      </p>
                    )}

                    {!searchTerm && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-500 mb-3">
                          {t("common.allMembers", "All Members")}:
                        </p>
                        {(allMembers as Member[]).map((member: Member) => {
                          const colors = getGenderColors(member.gender);
                          const transformedMember = transformMemberData(member);
                          return (
                            <div
                              key={member.id}
                              onClick={() => setSelectedMember(member)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${colors.background} ${colors.border} border ${
                                selectedMember?.id === member.id
                                  ? "ring-2 ring-saffron-400"
                                  : "hover:shadow-md"
                              }`}
                            >
                              <h4 className={`font-medium ${colors.text}`}>
                                {member.fullName}{" "}
                                {transformedMember.gender &&
                                  `• ${transformedMember.gender}`}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.currentCity}, {member.currentState}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Member Details & Family Tree */}
              <div className="lg:col-span-2 space-y-6">
                {selectedMember ? (
                  <>
                    <FamilyTreeVisualization
                      member={selectedMember}
                      relationships={filteredMemberRelationships}
                      onMemberClick={(memberId) => {
                        const member = (allMembers as Member[]).find(
                          (m) => m.id === memberId,
                        );
                        if (member) setSelectedMember(member);
                      }}
                    />

                    {/* Add Relationship Button */}
                    <div className="flex justify-center">
                      <Dialog
                        open={isAddRelationshipOpen}
                        onOpenChange={setIsAddRelationshipOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="bg-saffron-500 hover:bg-saffron-600">
                            <Plus className="mr-2" size={16} />
                            Add New Relationship
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>

                    {/* Family Story Export */}
                    {selectedMember &&
                      filteredMemberRelationships &&
                      filteredMemberRelationships.length > 0 && (
                        <div className="flex justify-center">
                          <FamilyStoryExport
                            member={selectedMember}
                            relationships={filteredMemberRelationships}
                          />
                        </div>
                      )}
                  </>
                ) : (
                  <Card className="p-12 text-center">
                    <Users className="mx-auto mb-4 text-gray-400" size={64} />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Select a Member
                    </h3>
                    <p className="text-gray-500">
                      Choose a member from the search panel to view their family
                      tree
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            {selectedMember ? (
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Users className="text-saffron-500" size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedMember.fullName}
                        </h2>
                        <p className="text-saffron-100 text-sm">
                          Family Relationships
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {filteredMemberRelationships.length}
                      </div>
                      <div className="text-saffron-100 text-sm">
                        Connections
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Family Story Export Button */}
                <div className="flex justify-center">
                  <FamilyStoryExport
                    member={selectedMember}
                    relationships={filteredMemberRelationships}
                  />
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a member from the search panel to view their family
                  tree
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            {selectedMember ? (
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Users className="text-saffron-500" size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedMember.fullName}
                        </h2>
                        <p className="text-saffron-100 text-sm">
                          Family Relationships
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {filteredMemberRelationships.length}
                      </div>
                      <div className="text-saffron-100 text-sm">
                        Connections
                      </div>
                    </div>
                  </div>
                </Card>

                {relationshipsLoading ? (
                  <Card className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">
                      Loading family relationships...
                    </p>
                  </Card>
                ) : filteredMemberRelationships &&
                  filteredMemberRelationships.length > 0 ? (
                  <Card className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-temple-brown">
                        Family Relationships for {selectedMember.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Click on any name to view their detailed profile
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-saffron-50 border-b">
                            <th className="text-left p-4 font-semibold text-temple-brown">
                              Member Name
                            </th>
                            <th className="text-left p-4 font-semibold text-temple-brown">
                              Relationship
                            </th>
                            <th className="text-left p-4 font-semibold text-temple-brown">
                              Related Name
                            </th>
                            <th className="text-left p-4 font-semibold text-temple-brown">
                              Contact
                            </th>
                            <th className="text-left p-4 font-semibold text-temple-brown">
                              Location
                            </th>
                            <th className="text-center p-4 font-semibold text-temple-brown">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMemberRelationships.map(
                            (relationship: any) => (
                              <tr
                                key={relationship.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-saffron-100 rounded-full flex items-center justify-center">
                                      <Users
                                        className="text-saffron-600"
                                        size={16}
                                      />
                                    </div>
                                    <div>
                                      <button
                                        onClick={() => {
                                          const member = (
                                            allMembers as Member[]
                                          ).find(
                                            (m) =>
                                              m.id ===
                                              relationship.relatedMember.id,
                                          );
                                          if (member) setSelectedMember(member);
                                        }}
                                        className="font-bold text-temple-brown hover:text-saffron-600 transition-colors text-left underline hover:no-underline"
                                      >
                                        {relationship.relatedMember.fullName}
                                      </button>
                                      <p className="text-xs text-gray-500">
                                        Member #{relationship.relatedMember.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {relationship.relationshipType}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">
                                      {relationship.relatedMember.fullName}
                                    </span>{" "}
                                    is the{" "}
                                    <span className="text-temple-brown font-medium">
                                      {relationship.relationshipType.toLowerCase()}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium">
                                      {selectedMember.fullName}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">
                                      {relationship.relatedMember.phone}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate max-w-[200px]">
                                      {relationship.relatedMember.email}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="text-sm text-gray-600">
                                    {relationship.relatedMember.currentCity},{" "}
                                    {relationship.relatedMember.currentState}
                                  </div>
                                </td>

                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => {
                                      const member = (
                                        allMembers as Member[]
                                      ).find(
                                        (m) =>
                                          m.id ===
                                          relationship.relatedMember.id,
                                      );
                                      if (member) setSelectedMember(member);
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-saffron-200 text-sm font-medium rounded-md text-temple-brown bg-saffron-50 hover:bg-saffron-100 transition-colors"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-4 bg-gradient-to-r from-temple-light to-saffron-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-temple-brown">
                            {filteredMemberRelationships.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Relationships
                          </div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-saffron-600">
                            {
                              new Set(
                                filteredMemberRelationships.map(
                                  (r: any) => r.relationshipType,
                                ),
                              ).size
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            Relationship Types
                          </div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-temple-gold">
                            {
                              new Set(
                                filteredMemberRelationships.map(
                                  (r: any) =>
                                    `${r.relatedMember.currentCity}, ${r.relatedMember.currentState}`,
                                ),
                              ).size
                            }
                          </div>
                          <div className="text-sm text-gray-600">Locations</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Family Connections
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {selectedMember.fullName} doesn't have any family
                      relationships added yet.
                    </p>
                    <p className="text-sm text-gray-400">
                      Add family connections to see the relationship table.
                    </p>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a member to view their family relationships in table
                  format
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-6">
            {selectedMember ? (
              <ComprehensiveFamilyDisplay
                member={selectedMember}
                relationships={memberRelationships}
                allMembers={allMembers as Member[]}
                allRelationships={allRelationships}
                onMemberClick={(memberId) => {
                  const member = (allMembers as Member[]).find(
                    (m) => m.id === memberId,
                  );
                  if (member) setSelectedMember(member);
                }}
              />
            ) : (
              <Card className="p-12 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a member to view all their family relationships and
                  connections
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="counters" className="space-y-6">
            {selectedMember ? (
              <RelationshipCounters
                member={selectedMember}
                relationships={filteredMemberRelationships}
                onMemberClick={(memberId) => {
                  const member = (allMembers as Member[]).find(
                    (m) => m.id === memberId,
                  );
                  if (member) setSelectedMember(member);
                }}
              />
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Member
                </h3>
                <p className="text-gray-500">
                  Choose a member to view their relationship statistics and
                  counters
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <FamilyNetworkAnalysis
              allMembers={allMembers as Member[]}
              allRelationships={allRelationships}
              onMemberClick={(memberId) => {
                const member = (allMembers as Member[]).find(
                  (m) => m.id === memberId,
                );
                if (member) {
                  setSelectedMember(member);
                  // Switch to explorer tab to show the selected member
                  const explorerTab = document.querySelector(
                    '[value="explorer"]',
                  ) as HTMLElement;
                  if (explorerTab) explorerTab.click();
                }
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Relationship Statistics */}
              <Card className="p-6 col-span-full">
                <h3 className="text-xl font-semibold text-temple-brown mb-6">
                  Family Network Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-saffron-50 rounded-lg">
                    <Users
                      className="mx-auto mb-2 text-saffron-600"
                      size={24}
                    />
                    <div className="text-2xl font-bold text-temple-brown">
                      {(allMembers as Member[]).length}
                    </div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="text-center p-4 bg-temple-light rounded-lg">
                    <Heart
                      className="mx-auto mb-2 text-temple-brown"
                      size={24}
                    />
                    <div className="text-2xl font-bold text-temple-brown">
                      {allRelationships.length}
                    </div>
                    <div className="text-sm text-gray-600">Relationships</div>
                  </div>
                  <div className="text-center p-4 bg-gold-50 rounded-lg">
                    <Network
                      className="mx-auto mb-2 text-temple-gold"
                      size={24}
                    />
                    <div className="text-2xl font-bold text-temple-brown">
                      {Math.round(
                        (allRelationships.length /
                          Math.max((allMembers as Member[]).length, 1)) *
                          100,
                      ) / 100}
                    </div>
                    <div className="text-sm text-gray-600">Avg Connections</div>
                  </div>
                  <div className="text-center p-4 bg-temple-gold-50 rounded-lg">
                    <TreePine
                      className="mx-auto mb-2 text-saffron-500"
                      size={24}
                    />
                    <div className="text-2xl font-bold text-temple-brown">
                      {
                        new Set(
                          (
                            allRelationships as Array<
                              Relationship & { relatedMember: Member }
                            >
                          ).map(
                            (r: Relationship & { relatedMember: Member }) =>
                              r.relationshipType,
                          ),
                        ).size
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      Relationship Types
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Relationship Dialog */}
        <Dialog
          open={isAddRelationshipOpen}
          onOpenChange={setIsAddRelationshipOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Family Member
                </label>
                <Select
                  value={relatedMemberId?.toString() || ""}
                  onValueChange={(value) => setRelatedMemberId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allMembers as Member[])
                      .filter(
                        (m: Member) =>
                          selectedMember && m.id !== selectedMember.id,
                      )
                      .map((member: Member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id.toString()}
                        >
                          {member.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Relationship Type
                </label>
                <Select
                  value={relationshipType}
                  onValueChange={setRelationshipType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddRelationship}
                className="w-full bg-saffron-500 hover:bg-saffron-600"
                disabled={
                  !relatedMemberId ||
                  !relationshipType ||
                  addRelationshipMutation.isPending
                }
              >
                {addRelationshipMutation.isPending
                  ? "Adding..."
                  : "Add Relationship"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
