import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  Globe,
  Map,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import type { Temple } from "@shared/schema";

export default function Home() {
  const { t } = useTranslation();
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: temples = [] } = useQuery({
    queryKey: ["/api/temples"],
  });

  const totalMembers = (members as any[]).length;

  // Update page title when temple is selected
  useEffect(() => {
    if (selectedTemple) {
      document.title = `${selectedTemple.templeName} - Temple Dynamo`;
    } else {
      document.title = "Temple Dynamo - Hindu Temple Community Management";
    }
  }, [selectedTemple]);

  const handleTempleSelect = (templeId: string) => {
    if (templeId === "reset") {
      setSelectedTemple(null);
      return;
    }
    const temple = (temples as Temple[]).find(
      (t) => t.id.toString() === templeId,
    );
    setSelectedTemple(temple || null);
  };

  const openLink = (url: string) => {
    if (url && url.trim()) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50">
      {/* Temple Selection at Top - Always Visible */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-temple-gold/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Building className="text-temple-gold" size={20} />
            <span className="text-lg font-medium text-temple-brown">
              {t("home.selectTemple")}
            </span>
          </div>
          <Select onValueChange={handleTempleSelect}>
            <SelectTrigger className="w-full max-w-md mx-auto bg-white border-temple-gold focus:ring-temple-gold">
              <SelectValue placeholder={t("home.chooseTemple")} />
            </SelectTrigger>
            <SelectContent className="z-[100] max-h-64 overflow-auto">
              <SelectItem value="reset">{t("home.allTemples")}</SelectItem>
              {(temples as Temple[]).map((temple: Temple) => (
                <SelectItem key={temple.id} value={temple.id.toString()}>
                  {temple.templeName} - {temple.village}, {temple.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Temple Information Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {selectedTemple ? (
          <Card className="bg-white/95 border-temple-gold/30 shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temple Image */}
                <div className="flex justify-center">
                  {selectedTemple.templeImage ? (
                    <div className="relative w-full max-w-md mx-auto">
                      <img
                        src={selectedTemple.templeImage}
                        alt={selectedTemple.templeName}
                        className="w-full h-64 object-cover rounded-lg shadow-md border-2 border-temple-gold/20"
                        style={{ maxWidth: "400px" }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGN0VEIi8+CjxwYXRoIGQ9Ik0yMDAgNzVMMjUwIDEyNUgxNTBMMjAwIDc1WiIgZmlsbD0iI0Q5NzcwNiIvPgo8cmVjdCB4PSIxNzAiIHk9IjEyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Q5NzcwNiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNjAiIHI9IjE1IiBmaWxsPSIjRkJFRjNGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5MjQwMEQiPlRlbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-md h-64 bg-gradient-to-br from-saffron-100 to-gold-100 rounded-lg shadow-md flex items-center justify-center mx-auto border-2 border-temple-gold/20">
                      <div className="text-center">
                        <Building
                          className="mx-auto text-temple-gold mb-2"
                          size={48}
                        />
                        <p className="text-temple-brown font-medium">
                          Temple Image
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Temple Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-temple-brown mb-2">
                      {selectedTemple.templeName}
                    </h3>
                    {selectedTemple.deity && (
                      <p className="text-lg text-saffron-600 font-medium">
                        Deity: {selectedTemple.deity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-temple-brown">
                      <MapPin
                        className="mr-2 text-saffron-500"
                        size={16}
                      />
                      <span>
                        {selectedTemple.village},{" "}
                        {selectedTemple.nearestCity}
                      </span>
                    </div>
                    <div className="flex items-center text-temple-brown">
                      <Building
                        className="mr-2 text-saffron-500"
                        size={16}
                      />
                      <span>
                        {selectedTemple.state}, {selectedTemple.country}
                      </span>
                    </div>
                    {selectedTemple.establishedYear && (
                      <div className="flex items-center text-temple-brown">
                        <Calendar
                          className="mr-2 text-saffron-500"
                          size={16}
                        />
                        <span>
                          Established: {selectedTemple.establishedYear}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  {selectedTemple.contactPhone && (
                    <div className="flex items-center text-temple-brown">
                      <Phone
                        className="mr-2 text-saffron-500"
                        size={16}
                      />
                      <span>{selectedTemple.contactPhone}</span>
                    </div>
                  )}
                  {selectedTemple.contactEmail && (
                    <div className="flex items-center text-temple-brown">
                      <Mail className="mr-2 text-saffron-500" size={16} />
                      <span>{selectedTemple.contactEmail}</span>
                    </div>
                  )}

                  {/* Link Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedTemple.googleMapLink && (
                      <Button
                        onClick={() => openLink(selectedTemple.googleMapLink!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Map size={16} />
                        Google Maps
                        <ExternalLink size={14} />
                      </Button>
                    )}
                    {selectedTemple.websiteLink && (
                      <Button
                        onClick={() => openLink(selectedTemple.websiteLink!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Globe size={16} />
                        Website
                        <ExternalLink size={14} />
                      </Button>
                    )}
                    {selectedTemple.wikiLink && (
                      <Button
                        onClick={() => openLink(selectedTemple.wikiLink!)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Globe size={16} />
                        Wikipedia
                        <ExternalLink size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Registered Members Counter */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-saffron-50 to-gold-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-temple-brown">
                        {totalMembers}
                      </div>
                      <div className="text-sm text-gray-600">
                        Registered Members
                      </div>
                    </div>
                  </div>

                  {selectedTemple.description && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedTemple.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <Building className="mx-auto text-temple-gold mb-4" size={64} />
            <h2 className="text-3xl font-bold text-temple-brown mb-4">
              {t("home.title")}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 text-center">
                <Building className="mx-auto text-temple-gold mb-3" size={40} />
                <h3 className="font-semibold text-temple-brown mb-2">
                  {totalMembers} Members
                </h3>
                <p className="text-sm text-gray-600">
                  Registered community members
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Building className="mx-auto text-temple-gold mb-3" size={40} />
                <h3 className="font-semibold text-temple-brown mb-2">
                  {(temples as Temple[]).length} Temples
                </h3>
                <p className="text-sm text-gray-600">
                  Sacred places in our network
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Building className="mx-auto text-temple-gold mb-3" size={40} />
                <h3 className="font-semibold text-temple-brown mb-2">
                  Community United
                </h3>
                <p className="text-sm text-gray-600">
                  Connecting devotees worldwide
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}