import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Heart, Calendar, HandHeart, Building, MapPin } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
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
  const totalFamilies = Math.ceil(totalMembers / 3.6); // Approximate families
  const annualEvents = 48;
  const volunteers = Math.ceil(totalMembers * 0.125);

  // Update page title when temple is selected
  useEffect(() => {
    if (selectedTemple) {
      document.title = `${selectedTemple.templeName} - Temple Dynamo`;
    } else {
      document.title = 'Temple Dynamo - Hindu Temple Community Management';
    }
  }, [selectedTemple]);

  const handleTempleSelect = (templeId: string) => {
    if (templeId === "reset") {
      setSelectedTemple(null);
      return;
    }
    const temple = (temples as Temple[]).find(t => t.id.toString() === templeId);
    setSelectedTemple(temple || null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1544181485-7bb30de57dd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-temple-brown/70 to-saffron-900/50"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              🕉️ {selectedTemple ? `Welcome to Our ${selectedTemple.templeName}` : t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-temple-cream mb-8">
              {selectedTemple ? (selectedTemple.description || "Experience the divine presence in our sacred temple where tradition meets spirituality.") : t('home.subtitle')}
            </p>

            {/* Temple Search Section */}
            <div className="mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Building className="text-temple-gold" size={20} />
                <span className="text-lg font-medium text-white">{t('home.selectTemple')}</span>
              </div>
              <Select onValueChange={handleTempleSelect}>
                <SelectTrigger className="w-full bg-white/90 border-temple-gold focus:ring-temple-gold">
                  <SelectValue placeholder={t('home.chooseTemple')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reset">{t('home.allTemples')}</SelectItem>
                  {(temples as Temple[]).map((temple: Temple) => (
                    <SelectItem key={temple.id} value={temple.id.toString()}>
                      {temple.templeName} - {temple.village}, {temple.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemple && (
              <div className="mb-8 max-w-4xl mx-auto">
                <Card className="bg-white/95 border-temple-gold/30 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Temple Image */}
                      <div className="flex justify-center">
                        {selectedTemple.templeImage ? (
                          <img 
                            src={selectedTemple.templeImage} 
                            alt={selectedTemple.templeName}
                            className="w-full max-w-md h-64 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGN0VEIi8+CjxwYXRoIGQ9Ik0yMDAgNzVMMjUwIDEyNUgxNTBMMjAwIDc1WiIgZmlsbD0iI0Q5NzcwNiIvPgo8cmVjdCB4PSIxNzAiIHk9IjEyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Q5NzcwNiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNjAiIHI9IjE1IiBmaWxsPSIjRkJFRjNGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5MjQwMEQiPlRlbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-full max-w-md h-64 bg-gradient-to-br from-saffron-100 to-gold-100 rounded-lg shadow-md flex items-center justify-center">
                            <div className="text-center">
                              <Building className="mx-auto text-temple-gold mb-2" size={48} />
                              <p className="text-temple-brown font-medium">Temple Image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Temple Information */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-temple-brown mb-2">{selectedTemple.templeName}</h3>
                          {selectedTemple.deity && (
                            <p className="text-lg text-saffron-600 font-medium">Deity: {selectedTemple.deity}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-temple-brown">
                            <MapPin className="mr-2 text-saffron-500" size={16} />
                            <span>{selectedTemple.village}, {selectedTemple.nearestCity}</span>
                          </div>
                          <div className="flex items-center text-temple-brown">
                            <Building className="mr-2 text-saffron-500" size={16} />
                            <span>{selectedTemple.state}, {selectedTemple.country}</span>
                          </div>
                          {selectedTemple.establishedYear && (
                            <div className="flex items-center text-temple-brown">
                              <Calendar className="mr-2 text-saffron-500" size={16} />
                              <span>Established: {selectedTemple.establishedYear}</span>
                            </div>
                          )}
                        </div>

                        {/* Registered Members Counter */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-saffron-50 to-gold-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-temple-brown">{totalMembers}</div>
                            <div className="text-sm text-gray-600">Registered Members</div>
                          </div>
                        </div>

                        {selectedTemple.contactPhone && (
                          <div className="flex items-center text-temple-brown">
                            <Bell className="mr-2 text-saffron-500" size={16} />
                            <span>{selectedTemple.contactPhone}</span>
                          </div>
                        )}
                        {selectedTemple.contactEmail && (
                          <div className="flex items-center text-temple-brown">
                            <Heart className="mr-2 text-saffron-500" size={16} />
                            <span>{selectedTemple.contactEmail}</span>
                          </div>
                        )}

                        {selectedTemple.description && (
                          <div className="mt-4">
                            <p className="text-gray-600 text-sm leading-relaxed">{selectedTemple.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Link href="/registry">
              <Button className="bg-temple-gold hover:bg-yellow-500 text-temple-brown font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg">
                {t('home.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Temple Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-temple-brown mb-6">{t('common.welcomeSacredSpace')}</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {t('common.spiritualBeacon')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-temple-brown">{t('common.dailyPuja')}</h3>
                  <p className="text-sm text-gray-600">{t('common.pujaTimings')}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-temple-brown">{t('common.specialEvents')}</h3>
                  <p className="text-sm text-gray-600">{t('common.festivalsGatherings')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <img 
              src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Temple architecture" 
              className="rounded-xl shadow-xl w-full h-80 object-cover border-4 border-temple-gold/30"
            />
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-temple-brown mb-4">{t('common.ourGrowingCommunity')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('common.strengthenBonds')}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{totalMembers.toLocaleString()}</h3>
            <p className="text-gray-600">{t('common.registeredMembers')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-crimson to-temple-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{totalFamilies}</h3>
            <p className="text-gray-600">{t('common.families')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-600 to-saffron-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{annualEvents}</h3>
            <p className="text-gray-600">{t('common.annualEvents')}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandHeart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{volunteers}</h3>
            <p className="text-gray-600">{t('common.volunteers')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
