import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Phone, MapPin, Users, Eye, TreePine, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import type { Member } from "@shared/schema";

const states = [
  { value: "AL", label: "Alabama" },
  { value: "CA", label: "California" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
];

export default function Members() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 20;

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  // Filter members based on search criteria
  const filteredMembers = (allMembers as Member[]).filter((member: Member) => {
    const matchesSearch = !searchTerm || 
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    
    const matchesCity = !selectedCity || selectedCity === "all-cities" || member.currentCity.toLowerCase().includes(selectedCity.toLowerCase());
    const matchesState = !selectedState || selectedState === "all-states" || member.currentState === selectedState;
    
    return matchesSearch && matchesCity && matchesState;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + membersPerPage);

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set((allMembers as Member[]).map((member: Member) => member.currentCity)));

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
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
        <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-temple-brown mb-6">{t('members.title')}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={t('members.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder={t('members.allCities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">{t('members.allCities')}</SelectItem>
                  {uniqueCities.map((city: string) => (
                    <SelectItem key={city} value={city.toLowerCase()}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={handleSearch}
                className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-medium"
              >
                <Search className="mr-2" size={16} />
                {t('common.search')}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {t('common.showing')} {filteredMembers.length} {t('common.of')} {(allMembers as Member[]).length} {t('nav.members')}
          </div>
        </Card>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('common.noMembersFound')}</h3>
            <p className="text-gray-500">{t('common.adjustSearchCriteria')}</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMembers.map((member: Member, index: number) => (
              <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
                <div className={`bg-gradient-to-r ${getGradientColor(index)} p-4`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{member.fullName}</h3>
                      <p className="text-white/80 text-sm">{member.currentCity}, {member.currentState}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{member.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{member.birthCity}, {member.birthState}, {member.birthCountry}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{t('common.parents')}:</span>
                      <span className="text-sm font-medium text-temple-brown truncate ml-2">
                        {member.fatherName} & {member.motherName}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-saffron-700 border-saffron-200 hover:bg-saffron-50"
                      size="sm"
                    >
                      <Eye className="mr-1" size={14} />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-temple-brown border-temple-gold/30 hover:bg-temple-gold/10"
                      size="sm"
                    >
                      <TreePine className="mr-1" size={14} />
                      Family
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                <ChevronLeft size={16} />
              </Button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === currentPage;
                const isVisible = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!isVisible) {
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    variant={isCurrentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 ${
                      isCurrentPage 
                        ? "bg-saffron-500 text-white hover:bg-saffron-600" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
