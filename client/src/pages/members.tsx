import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Member } from "@shared/schema";
import { getGenderColors } from "@/lib/color-utils";
import { SimpleMemberCard } from "@/components/simple-member-card";
import { useFormDataTransformation } from "@/lib/i18n-utils";

export default function Members() {
  console.log("Members component rendered at:", new Date().toISOString());
  const { t } = useTranslation();
  const { transformMemberData } = useFormDataTransformation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 20;

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: uniqueCities = [] } = useQuery({
    queryKey: ["/api/members/cities"],
  });

  const { data: uniqueStates = [] } = useQuery({
    queryKey: ["/api/members/states"],
  });

  console.log("Query data:", allMembers);
  console.log("Is loading:", isLoading);

  // Filter members based on search criteria
  const filteredMembers = Array.isArray(allMembers)
    ? allMembers.filter((member: Member) => {
        // Search term filter - search in name, email, phone
        const matchesSearch =
          !searchTerm ||
          searchTerm.trim() === "" ||
          member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone?.includes(searchTerm);

        // City filter
        const matchesCity =
          !selectedCity ||
          selectedCity === "" ||
          selectedCity === "all-cities" ||
          member.currentCity === selectedCity;

        // State filter
        const matchesState =
          !selectedState ||
          selectedState === "" ||
          selectedState === "all-states" ||
          member.currentState === selectedState;

        return matchesSearch && matchesCity && matchesState;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + membersPerPage,
  );

  // Debug logging removed for cleaner console

  // Unique cities are now fetched from API

  const handleSearch = () => {
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCity("");
    setSelectedState("");
    setCurrentPage(1);
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-saffron-400 to-temple-gold",
      "from-temple-crimson to-temple-red",
      "from-saffron-600 to-saffron-700",
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </Card>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-24" />
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <Card className="shadow-lg border border-temple-gold/20 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-temple-brown mb-4 sm:mb-6">
            {t("members.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <Input
                placeholder={t('members.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-12 text-base"
              />
            </div>
            <div>
              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  setSelectedCity(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={t("members.allCities")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">
                    {t("members.allCities")}
                  </SelectItem>
                  {Array.isArray(uniqueCities) && (uniqueCities as string[]).map((city: string) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={selectedState}
                onValueChange={(value) => {
                  setSelectedState(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={t("members.allStates")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">{t("members.allStates")}</SelectItem>
                  {Array.isArray(uniqueStates) && (uniqueStates as string[]).map((state: string) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="h-12 text-base border-saffron-200 text-saffron-700 hover:bg-saffron-50"
              >
                {t('common.clear')}
              </Button>
              <Button
                onClick={handleSearch}
                className="h-12 text-base bg-saffron-500 hover:bg-saffron-600 text-white font-medium"
              >
                <Search className="mr-2" size={16} />
                {t('common.search')}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {t("common.showing")} {filteredMembers.length} {t("common.of")}{" "}
            {Array.isArray(allMembers) ? allMembers.length : 0}{" "}
            {t("nav.members")}
          </div>
        </Card>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {t("members.noMembersFound")}
            </h3>
            <p className="text-gray-500">{t("members.adjustSearchCriteria")}</p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedMembers.map((member: Member, index: number) => {
                const colors = getGenderColors(member.gender);
                const transformedMember = transformMemberData(member);
                
                // Debug logging for profile pictures
                if (member.id === 36) {
                  console.log("Member 36 (Pechi Ammal) data:", {
                    id: member.id,
                    fullName: member.fullName,
                    hasProfilePicture: !!member.profilePicture,
                    profilePictureLength: member.profilePicture?.length || 0,
                    profilePicturePrefix: member.profilePicture?.substring(0, 50) || 'none'
                  });
                }
                return (
                  <div
                    key={member.id}
                    className={`${colors.background} ${colors.border} p-4 rounded-lg shadow border flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow`}
                    onClick={() => {
                      console.log("Navigating to member:", member.id);
                      window.location.href = `/member/${member.id}`;
                    }}
                  >
                    <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center overflow-hidden`}>
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={`${member.fullName} profile`}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            console.log(`Profile picture error for ${member.fullName} (ID: ${member.id}):`, e);
                          }}
                          onLoad={() => {
                            console.log(`Profile picture loaded for ${member.fullName} (ID: ${member.id})`);
                          }}
                        />
                      ) : (
                        <Users className={colors.iconColor} size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold hover:text-saffron-600 ${colors.text}`}>
                        {member.fullName} : {t('registry.form.fatherName', 'Father Name')} : {(member as Member).fatherName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {t('common.member', 'Member')} #{member.id} • {transformedMember.gender || t('common.unspecified', 'Unspecified')}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.currentCity}, {member.currentState}
                      </p>
                    </div>
                    <div className="text-gray-400">
                      <span className="text-xs">{t('common.clickToViewDetails', 'Click to view details')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center mt-8 space-y-2 sm:space-y-0">
                <div className="flex space-x-2 w-full sm:w-auto justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-12 px-4 text-base"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    <span className="hidden sm:inline">{t("common.previous")}</span>
                  </Button>

                  <div className="flex items-center px-4 py-2 text-sm sm:text-base text-gray-600">
                    {t("common.page")} {currentPage} {t("common.of")} {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-12 px-4 text-base"
                  >
                    <span className="hidden sm:inline">{t("common.next")}</span>
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}


      </div>
    </div>
  );
}
