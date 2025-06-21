import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, MapPin, Phone, Mail, Heart } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

export default function MemberDetails() {
  const [, params] = useRoute("/member/:id");
  const memberId = params?.id ? parseInt(params.id) : null;

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: [`/api/members/${memberId}`],
    enabled: !!memberId,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: [`/api/relationships/${memberId}`],
    enabled: !!memberId,
  });

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-gray-600">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Member Not Found</h2>
          <p className="text-gray-500">The requested member could not be found.</p>
          <Button onClick={() => window.history.back()} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-temple-gold-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Members
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Member Profile */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-saffron-500 to-temple-gold rounded-full flex items-center justify-center">
                  <Users className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-temple-brown mb-2">{(member as Member).fullName}</h1>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Mail className="mr-2" size={16} />
                      {(member as Member).email}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="mr-2" size={16} />
                      {(member as Member).phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="mr-2" size={16} />
                      {(member as Member).currentCity}, {(member as Member).currentState}, {(member as Member).currentCountry}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-temple-brown mb-4">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Birth Information</h3>
                  <p className="text-gray-600">{(member as Member).birthCity}</p>
                  <p className="text-gray-600">{(member as Member).birthState}, {(member as Member).birthCountry}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Current Location</h3>
                  <p className="text-gray-600">{(member as Member).currentCity}</p>
                  <p className="text-gray-600">{(member as Member).currentState}, {(member as Member).currentCountry}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Parents</h3>
                  <p className="text-gray-600">Father: {(member as Member).fatherName}</p>
                  <p className="text-gray-600">Mother: {(member as Member).motherName}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Family Relationships */}
          <div>
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-temple-brown mb-4 flex items-center">
                <Heart className="mr-2" size={20} />
                Family Relationships
              </h3>
              
              {relationships.length > 0 ? (
                <div className="space-y-3">
                  {relationships.map((relationship: any) => (
                    <div key={relationship.id} className="bg-gradient-to-r from-saffron-50 to-temple-gold-50 p-3 rounded-lg border">
                      <h4 className="font-medium text-temple-brown">{relationship.relatedMember.fullName}</h4>
                      <p className="text-sm text-gray-600">{relationship.relationshipType}</p>
                      <p className="text-xs text-gray-500">{relationship.relatedMember.currentCity}, {relationship.relatedMember.currentState}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-gray-500 text-sm">No family relationships recorded</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}