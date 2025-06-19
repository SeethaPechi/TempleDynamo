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
            <h2 className="text-4xl font-bold text-temple-brown mb-6">Welcome to Our Sacred Space</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Sri Lakshmi Temple serves as a spiritual beacon for our community, fostering devotion, cultural preservation, and unity among devotees. Our temple stands as a testament to divine grace and communal harmony.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-temple-brown">Daily Puja</h3>
                  <p className="text-sm text-gray-600">6:00 AM - 12:00 PM<br />5:00 PM - 9:00 PM</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-temple-brown">Special Events</h3>
                  <p className="text-sm text-gray-600">Festivals & Celebrations<br />Community Gatherings</p>
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
            Temple Announcements
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-4">
                <h3 className="font-semibold text-white">Diwali Celebrations</h3>
                <p className="text-saffron-100 text-sm">October 24, 2024</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">Join us for grand Diwali celebrations with special pujas, cultural programs, and community feast. Registration required.</p>
                <Button variant="link" className="mt-4 text-saffron-600 font-medium hover:text-saffron-800 p-0">
                  Read More →
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-temple-crimson to-temple-red p-4">
                <h3 className="font-semibold text-white">Volunteer Drive</h3>
                <p className="text-red-100 text-sm">Ongoing</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">We are seeking volunteers for temple maintenance, event organization, and community outreach programs.</p>
                <Button variant="link" className="mt-4 text-temple-crimson font-medium hover:text-temple-red p-0">
                  Join Us →
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
              <div className="bg-gradient-to-r from-saffron-600 to-saffron-700 p-4">
                <h3 className="font-semibold text-white">Sanskrit Classes</h3>
                <p className="text-saffron-100 text-sm">Starting November 1</p>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-700">Learn classical Sanskrit with our experienced scholars. Classes for beginners and intermediate students.</p>
                <Button variant="link" className="mt-4 text-saffron-600 font-medium hover:text-saffron-800 p-0">
                  Enroll Now →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-temple-brown mb-4">Our Growing Community</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Together we strengthen our bonds through faith, tradition, and shared values</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{totalMembers.toLocaleString()}</h3>
            <p className="text-gray-600">Registered Members</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-crimson to-temple-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{totalFamilies}</h3>
            <p className="text-gray-600">Families</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-600 to-saffron-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{annualEvents}</h3>
            <p className="text-gray-600">Annual Events</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandHeart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">{volunteers}</h3>
            <p className="text-gray-600">Volunteers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
