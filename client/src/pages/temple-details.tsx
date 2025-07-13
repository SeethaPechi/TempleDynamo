import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Phone, 
  Globe, 
  Calendar, 
  Users, 
  Camera,
  ExternalLink,
  User,
  Mail,
  Heart,
  MapIcon,
  Eye,
  Edit,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { Temple, Member } from "@shared/schema";

export default function TempleDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [isShowingMembers, setIsShowingMembers] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  
  // Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  // Fetch temple details
  const { data: temple, isLoading: isLoadingTemple } = useQuery<Temple>({
    queryKey: ["/api/temples", id],
    queryFn: async () => {
      const response = await fetch(`/api/temples/${id}`);
      if (!response.ok) throw new Error("Failed to fetch temple");
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch all members to filter by temple
  const { data: allMembers = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // Filter members associated with this temple
  const templeMembers = allMembers.filter(member => 
    member.templeId === parseInt(id || "0")
  );

  if (isLoadingTemple) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-8">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              {t("temples.templeNotFound")}
            </h2>
            <p className="text-gray-500">
              The temple you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMembersClick = () => {
    setSelectedMembers(templeMembers);
    setIsShowingMembers(true);
  };

  const formatUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-temple-brown">
          {temple.templeName}
        </h1>
        <div className="flex items-center justify-center space-x-4 text-gray-600">
          <div className="flex items-center space-x-1">
            <MapPin size={16} />
            <span>{temple.city}, {temple.state}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={16} />
            <Button
              variant="link"
              onClick={handleMembersClick}
              className="p-0 h-auto text-saffron-600 hover:text-saffron-700 underline"
            >
              {templeMembers.length} {t("common.members")}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">{t("temples.information")}</TabsTrigger>
          <TabsTrigger value="members">{t("common.members")}</TabsTrigger>
          <TabsTrigger value="photos">{t("common.photos")}</TabsTrigger>
        </TabsList>

        {/* Temple Information */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Temple Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="text-saffron-600" size={20} />
                  <span>{t("temples.templeInformation")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.templeName")}</label>
                      <p className="text-lg font-medium text-gray-900">{temple.templeName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.deity")}</label>
                      <p className="text-gray-900">{temple.deity || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("temples.established")}</label>
                      <p className="text-gray-900">{temple.establishedYear || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("temples.description")}</label>
                      <p className="text-gray-900">{temple.description || "No description available"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Temple Image */}
                {temple.templeImage && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-500 block mb-2">Temple Image</label>
                    <div className="relative w-full max-w-md mx-auto">
                      <img
                        src={temple.templeImage}
                        alt={temple.templeName}
                        className="w-full h-64 object-cover rounded-lg border-2 border-saffron-200 shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="text-saffron-600" size={20} />
                  <span>{t("templeRegistry.locationInformation")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.country")}</label>
                      <p className="text-gray-900">{temple.country || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.state")}</label>
                      <p className="text-gray-900">{temple.state}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.village")}</label>
                      <p className="text-gray-900">{temple.village}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.nearestCity")}</label>
                      <p className="text-gray-900">{temple.nearestCity}</p>
                    </div>
                    {temple.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Address</label>
                        <p className="text-gray-900">
                          {temple.address}
                          {temple.zipCode && `, ${temple.zipCode}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="text-saffron-600" size={20} />
                  <span>{t("templeRegistry.contactInformation")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {temple.contactPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.contactPhone")}</label>
                        <p className="text-gray-900">{temple.contactPhone}</p>
                      </div>
                    )}
                    {temple.contactEmail && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t("templeRegistry.form.contactEmail")}</label>
                        <p className="text-gray-900">{temple.contactEmail}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {temple.websiteLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formatUrl(temple.websiteLink), "_blank")}
                        className="w-full justify-start"
                      >
                        <Globe className="mr-2" size={14} />
                        {t("temples.visitWebsite")}
                        <ExternalLink className="ml-auto" size={14} />
                      </Button>
                    )}
                    {temple.googleMapLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formatUrl(temple.googleMapLink), "_blank")}
                        className="w-full justify-start"
                      >
                        <MapIcon className="mr-2" size={14} />
                        {t("temples.viewOnMaps")}
                        <ExternalLink className="ml-auto" size={14} />
                      </Button>
                    )}
                    {temple.wikiLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formatUrl(temple.wikiLink), "_blank")}
                        className="w-full justify-start"
                      >
                        <Globe className="mr-2" size={14} />
                        {t("temples.viewWikipedia")}
                        <ExternalLink className="ml-auto" size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="text-saffron-600" size={20} />
                  <span>{t("temples.additionalDetails")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {temple.establishedYear && (
                    <div>
                      <label className="font-semibold text-gray-700">{t("temples.established")}:</label>
                      <p className="text-gray-600">{temple.establishedYear}</p>
                    </div>
                  )}
                  {temple.festivals && (
                    <div>
                      <label className="font-semibold text-gray-700">{t("temples.festivals")}:</label>
                      <p className="text-gray-600">{temple.festivals}</p>
                    </div>
                  )}
                  {temple.architecture && (
                    <div>
                      <label className="font-semibold text-gray-700">{t("temples.architecture")}:</label>
                      <p className="text-gray-600">{temple.architecture}</p>
                    </div>
                  )}
                  {temple.significance && (
                    <div>
                      <label className="font-semibold text-gray-700">{t("temples.significance")}:</label>
                      <p className="text-gray-600">{temple.significance}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Temple Members */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="text-saffron-600" size={20} />
                  <span>{t("temples.templeMembers")}</span>
                </div>
                <Badge variant="outline">
                  {templeMembers.length} {t("common.members")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templeMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{t("temples.noMembers")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templeMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-saffron-100 rounded-full flex items-center justify-center">
                            {member.profilePicture ? (
                              <img
                                src={member.profilePicture}
                                alt={member.fullName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="text-saffron-600" size={24} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {member.fullName}
                            </h4>
                            {member.email && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Mail size={12} />
                                <span className="truncate">{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Phone size={12} />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.maritalStatus && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Heart size={12} />
                                <span>{member.maritalStatus}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/member-details/${member.id}`, "_blank")}
                            className="flex-1"
                          >
                            <Eye className="mr-1" size={12} />
                            {t("common.view")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temple Photos */}
        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="text-saffron-600" size={20} />
                <span>{t("temples.templePhotos")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!temple.templePhotos || temple.templePhotos.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <Camera size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{t("temples.noPhotos")}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Photo Carousel */}
                  <div className="overflow-hidden rounded-lg" ref={emblaRef}>
                    <div className="flex">
                      {temple.templePhotos.map((photo, index) => (
                        <div key={index} className="flex-[0_0_100%] min-w-0 relative">
                          <div 
                            className="aspect-video cursor-pointer bg-gray-100"
                            onClick={() => setPreviewImage(photo)}
                          >
                            <img
                              src={photo}
                              alt={`Temple photo ${index + 1}`}
                              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="absolute top-4 left-4 text-sm"
                          >
                            {index + 1} / {temple.templePhotos.length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  {temple.templePhotos.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {/* Thumbnail Navigation */}
                  {temple.templePhotos.length > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      {temple.templePhotos.map((photo, index) => (
                        <button
                          key={index}
                          className="w-16 h-12 rounded-md overflow-hidden border-2 border-transparent hover:border-saffron-500 transition-colors"
                          onClick={() => emblaApi?.scrollTo(index)}
                        >
                          <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Members Modal */}
      <Dialog open={isShowingMembers} onOpenChange={setIsShowingMembers}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {temple.templeName} {t("common.members")} ({selectedMembers.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {selectedMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-saffron-100 rounded-full flex items-center justify-center">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="text-saffron-600" size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {member.fullName}
                        </h4>
                        {member.email && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Mail size={12} />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone size={12} />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin size={12} />
                          <span>{member.currentCity}, {member.currentState}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/member-details/${member.id}`, "_blank")}
                        className="w-full"
                      >
                        <Eye className="mr-1" size={12} />
                        {t("members.viewProfile")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage("")}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("temples.photoPreview")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewImage}
              alt="Temple photo preview"
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}