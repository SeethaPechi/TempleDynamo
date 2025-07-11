import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  Heart,
  TreePine,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member, Temple } from "@shared/schema";
import { SimpleMemberCard } from "@/components/simple-member-card";
import { MemberListModal } from "@/components/member-list-modal";

export default function TempleMembers() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [memberListData, setMemberListData] = useState<{
    members: Member[];
    title: string;
    description?: string;
  }>({ members: [], title: "", description: "" });

  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: allTemples = [], isLoading: templesLoading } = useQuery({
    queryKey: ["/api/temples"],
  });

  // Group members by temple
  const membersByTemple = (allMembers as Member[]).reduce(
    (groups, member) => {
      const templeId = member.templeId || "unassigned";
      if (!groups[templeId]) {
        groups[templeId] = [];
      }
      groups[templeId].push(member);
      return groups;
    },
    {} as Record<string | number, Member[]>,
  );

  // Get temple info by ID
  const getTempleById = (id: number | string) => {
    if (id === "unassigned")
      return {
        id: "unassigned",
        templeName: "Unassigned Members",
        nearestCity: "",
        state: "",
      };
    return (allTemples as Temple[]).find((temple) => temple.id === Number(id));
  };

  // Filter members by location if selected
  const getFilteredMembers = (members: Member[]) => {
    if (!selectedLocation) return members;
    return members.filter(
      (member) =>
        `${member.currentCity}, ${member.currentState}` === selectedLocation,
    );
  };

  // Get location statistics for a temple
  const getLocationStats = (members: Member[]) => {
    const locationCounts = members.reduce(
      (counts, member) => {
        const location = `${member.currentCity}, ${member.currentState}`;
        counts[location] = (counts[location] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 locations
  };

  // Handler functions for showing member lists
  const showAllMembers = () => {
    setMemberListData({
      members: allMembers as Member[],
      title: "All Community Members",
      description: `Complete directory of ${(allMembers as Member[]).length} registered community members`,
    });
    setIsMemberListOpen(true);
  };

  const showTempleMembers = (temple: Temple) => {
    const templeMembers = membersByTemple[String(temple.id)] || [];
    setMemberListData({
      members: templeMembers,
      title: `${temple.templeName} - Members`,
      description: `${templeMembers.length} registered members associated with this temple`,
    });
    setIsMemberListOpen(true);
  };

  const showLocationMembers = (location: string, templeMembers: Member[]) => {
    const locationMembers = templeMembers.filter(
      member => `${member.currentCity}, ${member.currentState}` === location
    );
    setMemberListData({
      members: locationMembers,
      title: `Members in ${location}`,
      description: `${locationMembers.length} members currently residing in this location`,
    });
    setIsMemberListOpen(true);
  };

  // Search functionality
  const filteredMembers = selectedTemple
    ? getFilteredMembers(
        membersByTemple[String(selectedTemple.id)] || [],
      ).filter((member: Member) => {
        if (!searchTerm.trim()) return true;
        return (
          member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          member.phone?.includes(searchTerm)
        );
      })
    : [];

  if (membersLoading || templesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-temple-brown mb-4 flex items-center justify-center">
            <Building2 className="mr-3 text-saffron-500" size={40} />
            {t("Temple Members") || "Temple Members"}
          </h1>
          <p className="text-gray-600 text-lg">
            {t("Members grouped by their temple associations") ||
              "Explore community members grouped by their temple associations"}
          </p>
        </div>

        {!selectedTemple ? (
          // Temple Selection View
          <div className="space-y-6">
            {/* Overall Statistics */}
            <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Community Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div 
                    className="text-center cursor-pointer hover:bg-white/10 rounded-lg p-3 transition-colors"
                    onClick={showAllMembers}
                  >
                    <div className="text-3xl font-bold">
                      {(allMembers as Member[]).length}
                    </div>
                    <div className="text-saffron-100">Total Members</div>
                    <div className="text-xs text-saffron-200 mt-1">Click to view</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {(allTemples as Temple[]).length}
                    </div>
                    <div className="text-saffron-100">Active Temples</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {
                        new Set(
                          (allMembers as Member[]).map(
                            (m) => `${m.currentCity}, ${m.currentState}`,
                          ),
                        ).size
                      }
                    </div>
                    <div className="text-saffron-100">Locations</div>
                  </div>
                  <div 
                    className="text-center cursor-pointer hover:bg-white/10 rounded-lg p-3 transition-colors"
                    onClick={() => {
                      const unassignedMembers = membersByTemple["unassigned"] || [];
                      setMemberListData({
                        members: unassignedMembers,
                        title: "Unassigned Members",
                        description: `${unassignedMembers.length} members not yet associated with a specific temple`,
                      });
                      setIsMemberListOpen(true);
                    }}
                  >
                    <div className="text-3xl font-bold">
                      {membersByTemple["unassigned"]?.length || 0}
                    </div>
                    <div className="text-saffron-100">Unassigned</div>
                    <div className="text-xs text-saffron-200 mt-1">Click to view</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Temple Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Assigned Temples */}
              {(allTemples as Temple[]).map((temple) => {
                const members = membersByTemple[String(temple.id)] || [];
                const locationStats = getLocationStats(members);

                return (
                  <Card
                    key={temple.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-temple-gold"
                    onClick={() => setSelectedTemple(temple)}
                  >
                    <CardHeader className="bg-gradient-to-r from-saffron-100 to-gold-100">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TreePine
                            className="mr-2 text-saffron-600"
                            size={24}
                          />
                          <span className="text-temple-brown">
                            {temple.templeName}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-saffron-500 text-white cursor-pointer hover:bg-saffron-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            showTempleMembers(temple);
                          }}
                        >
                          <Users className="mr-1" size={12} />
                          {members.length} members
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-1" size={14} />
                          {temple.village},near {temple.nearestCity},{" "}
                          {temple.state}
                        </div>

                        {locationStats.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-temple-brown mb-2">
                              Top Locations:
                            </p>
                            <div className="space-y-1">
                              {locationStats
                                .slice(0, 3)
                                .map(([location, count]) => (
                                  <div
                                    key={location}
                                    className="flex justify-between text-xs cursor-pointer hover:bg-saffron-50 rounded px-2 py-1 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showLocationMembers(location, members);
                                    }}
                                  >
                                    <span className="text-gray-600">
                                      {location}
                                    </span>
                                    <span className="font-medium text-saffron-600">
                                      {count} members
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full bg-saffron-500 hover:bg-saffron-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemple(temple);
                          }}
                        >
                          View Members
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Unassigned Members */}
              {membersByTemple["unassigned"] &&
                membersByTemple["unassigned"].length > 0 && (
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-gray-400 border-dashed"
                    onClick={() =>
                      setSelectedTemple({
                        id: "unassigned",
                        templeName: "Unassigned Members",
                        nearestCity: "",
                        state: "",
                      } as any)
                    }
                  >
                    <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="mr-2 text-gray-600" size={24} />
                          <span className="text-gray-700">
                            Unassigned Members
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-gray-400 text-gray-600"
                        >
                          {membersByTemple["unassigned"].length} members
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Members who haven't been assigned to a specific temple
                        yet.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-gray-400 text-gray-600 hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemple({
                            id: "unassigned",
                            templeName: "Unassigned Members",
                          } as any);
                        }}
                      >
                        View Members
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        ) : (
          // Temple Member Details View
          <div className="space-y-6">
            {/* Back Button and Temple Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemple(null);
                  setSelectedLocation(null);
                  setSearchTerm("");
                }}
                className="flex items-center"
              >
                ← Back to Temples
              </Button>
            </div>

            {/* Temple Info Header */}
            <Card className="p-6 bg-gradient-to-r from-saffron-500 to-gold-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    {selectedTemple.templeName === "Unassigned Members" ? (
                      <Users className="text-gray-600" size={32} />
                    ) : (
                      <TreePine className="text-saffron-500" size={32} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedTemple.templeName}
                    </h2>
                    {selectedTemple.templeName !== "Unassigned Members" && (
                      <p className="text-saffron-100">
                        {getTempleById(selectedTemple.id)?.nearestCity},{" "}
                        {getTempleById(selectedTemple.id)?.state}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {filteredMembers.length}
                  </div>
                  <div className="text-saffron-100">
                    {selectedLocation
                      ? `Members in ${selectedLocation}`
                      : "Total Members"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Location Statistics */}
            {!selectedLocation && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-temple-brown mb-4">
                  Member Distribution by Location
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getLocationStats(
                    membersByTemple[String(selectedTemple.id)] || [],
                  ).map(([location, count]) => (
                    <div
                      key={location}
                      className="p-4 bg-saffron-50 rounded-lg cursor-pointer hover:bg-saffron-100 transition-colors border-2 hover:border-saffron-300"
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-saffron-600">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600">{location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Search */}
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <Input
                    placeholder="Search members by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {selectedLocation && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLocation(null)}
                    className="whitespace-nowrap"
                  >
                    Show All Locations
                  </Button>
                )}
              </div>
            </Card>

            {/* Members Grid */}
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member, index) => (
                  <Card
                    key={member.id}
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-saffron-300 border-2"
                    onClick={() => window.open(`/member-details/${member.id}`, '_blank')}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-temple-brown text-lg hover:text-saffron-600 transition-colors">
                          {member.fullName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          #{member.id}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Phone className="mr-2" size={14} />
                          {member.phone || "No phone"}
                        </div>
                        {member.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="mr-2" size={14} />
                            {member.email}
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <MapPin className="mr-2" size={14} />
                          {member.currentCity}, {member.currentState}
                        </div>
                        {member.maritalStatus && (
                          <div className="flex items-center text-gray-600">
                            <Heart className="mr-2" size={14} />
                            {member.maritalStatus}
                            {member.spouseName &&
                              member.maritalStatus === "Married" && (
                                <span className="ml-1">
                                  - {member.spouseName}
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-saffron-500 hover:bg-saffron-600 text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/member-details/${member.id}`, '_blank');
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs border-saffron-500 text-saffron-600 hover:bg-saffron-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/family-tree?member=${member.id}`, '_blank');
                          }}
                        >
                          Family Tree
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Users className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Members Found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No members match your search criteria."
                    : selectedLocation
                      ? `No members found in ${selectedLocation}.`
                      : "This temple doesn't have any members yet."}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Member List Modal */}
        <MemberListModal
          isOpen={isMemberListOpen}
          onClose={() => setIsMemberListOpen(false)}
          members={memberListData.members}
          title={memberListData.title}
          description={memberListData.description}
        />
      </div>
    </div>
  );
}
