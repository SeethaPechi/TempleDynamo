import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, Users, Heart, Calendar, HandHeart } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const totalMembers = (members as any[]).length;
  const totalFamilies = Math.ceil(totalMembers / 3.6); // Approximate families
  const annualEvents = 48;
  const volunteers = Math.ceil(totalMembers * 0.125);

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
              🕉️ {t('home.title')}
            </h1>
            <p className="text-xl md:text-2xl text-temple-cream mb-8">
              {t('home.subtitle')}
            </p>
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

      {/* Announcements */}
      <div className="bg-white/60 backdrop-blur py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-temple-brown text-center mb-12 flex items-center justify-center">
            <Bell className="text-temple-gold mr-3" size={32} />
            {t('common.templeAnnouncements')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-4">
                <h3 className="font-semibold text-white">{t('common.divaliCelebrations')}</h3>
                <p className="text-saffron-100 text-sm">{t('common.divaliDate')}</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">{t('common.divaliDesc')}</p>
                <Button variant="link" className="mt-4 text-saffron-600 font-medium hover:text-saffron-800 p-0">
                  {t('common.readMore')}
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-temple-crimson to-temple-red p-4">
                <h3 className="font-semibold text-white">{t('common.volunteerDrive')}</h3>
                <p className="text-red-100 text-sm">{t('common.ongoing')}</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">{t('common.volunteerDesc')}</p>
                <Button variant="link" className="mt-4 text-temple-crimson font-medium hover:text-temple-red p-0">
                  {t('common.joinUs')}
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-saffron-600 to-saffron-700 p-4">
                <h3 className="font-semibold text-white">{t('common.sanskritClasses')}</h3>
                <p className="text-saffron-100 text-sm">{t('common.startingNov')}</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">{t('common.sanskritDesc')}</p>
                <Button variant="link" className="mt-4 text-saffron-600 font-medium hover:text-saffron-800 p-0">
                  {t('common.enrollNow')}
                </Button>
              </CardContent>
            </Card>
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
