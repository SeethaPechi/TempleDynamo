import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building, MapPin, Calendar, Phone, Mail, Plus, Link as LinkIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "wouter";
import type { Temple } from "@shared/schema";

const states = [
  { value: "AL", label: "Alabama" },
  { value: "CA", label: "California" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "KA", label: "Karnataka" },
  { value: "AP", label: "Andhra Pradesh" },
  { value: "KL", label: "Kerala" },
];

const countries = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

export default function Temples() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const templesPerPage = 9;

  const { data: allTemples = [], isLoading } = useQuery({
    queryKey: ["/api/temples"],
  });

  // Filter temples based on search criteria
  const filteredTemples = (allTemples as Temple[]).filter((temple: Temple) => {
    const matchesSearch = !searchTerm || 
      temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesState = !selectedState || selectedState === "all-states" || temple.state === selectedState;
    const matchesCountry = !selectedCountry || selectedCountry === "all-countries" || temple.country === selectedCountry;
    
    return matchesSearch && matchesState && matchesCountry;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTemples.length / templesPerPage);
  const startIndex = (currentPage - 1) * templesPerPage;
  const paginatedTemples = filteredTemples.slice(startIndex, startIndex + templesPerPage);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-temple-brown">{t('temples.title')}</h1>
            <p className="text-gray-600 mt-2">{t('temples.subtitle')}</p>
          </div>
          <Link href="/temple-registry">
            <Button className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-temple-gold/90">
              <Plus className="mr-2" size={16} />
              {t('temples.addTemple')}
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-temple-brown mb-6">{t('temples.searchAndFilter')}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={t('temples.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder={t('temples.allStates')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">{t('temples.allStates')}</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder={t('temples.allCountries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-countries">{t('temples.allCountries')}</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
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
            {t('common.showing')} {filteredTemples.length} {t('common.of')} {(allTemples as Temple[]).length} {t('temples.templesLower')}
          </div>
        </Card>

        {/* Temples Grid */}
        {filteredTemples.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('temples.noTemplesFound')}</h3>
            <p className="text-gray-500">{t('temples.adjustSearchCriteria')}</p>
            <Link href="/temple-registry">
              <Button className="mt-4 bg-gradient-to-r from-saffron-500 to-temple-gold">
                <Plus className="mr-2" size={16} />
                {t('temples.registerFirstTemple')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTemples.map((temple: Temple, index: number) => (
              <Card key={temple.id} className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
                <div className={`bg-gradient-to-r ${getGradientColor(index)} p-4`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Building className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{temple.templeName}</h3>
                      {temple.deity && <p className="text-white/80 text-sm">{temple.deity}</p>}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{temple.village}, {temple.nearestCity}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{temple.state}, {temple.country}</span>
                    </div>
                    {temple.establishedYear && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">{t('temples.established')} {temple.establishedYear}</span>
                      </div>
                    )}
                    {temple.contactPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">{temple.contactPhone}</span>
                      </div>
                    )}
                    {temple.contactEmail && (
                      <div className="flex items-center space-x-3">
                        <Mail className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm truncate">{temple.contactEmail}</span>
                      </div>
                    )}
                  </div>
                  
                  {temple.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">{temple.description}</p>
                    </div>
                  )}

                  {temple.linkedTemples && temple.linkedTemples.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <LinkIcon className="text-gray-400" size={14} />
                        <span className="text-sm text-gray-500">{t('temples.linkedTemples')}: {temple.linkedTemples.length}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}