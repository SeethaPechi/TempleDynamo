import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Heart,
  X 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import type { Member } from "@shared/schema";
import { getMemberBackgroundColor, getMemberNameColor } from "@/lib/color-utils";

interface MemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  title: string;
  description?: string;
}

export function MemberListModal({ 
  isOpen, 
  onClose, 
  members, 
  title, 
  description 
}: MemberListModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-temple-brown flex items-center">
                <Users className="mr-2 text-saffron-500" size={24} />
                {title}
              </DialogTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex items-center space-x-4 mt-4 p-3 bg-gradient-to-r from-saffron-50 to-gold-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-temple-brown">
                {members.length}
              </div>
              <div className="text-xs text-gray-600">
                Total Members
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-saffron-600">
                {members.filter(m => m.gender === "Male").length}
              </div>
              <div className="text-xs text-gray-600">
                Male
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {members.filter(m => m.gender === "Female").length}
              </div>
              <div className="text-xs text-gray-600">
                Female
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-temple-gold">
                {members.filter(m => m.maritalStatus === "Married").length}
              </div>
              <div className="text-xs text-gray-600">
                Married
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-4">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Members Found
              </h3>
              <p className="text-gray-500">
                No members match the current criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {members.map((member, index) => (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-shadow border border-gray-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link href={`/member-details/${member.id}`}>
                          <h3 
                            className={`font-bold text-lg hover:underline cursor-pointer ${getMemberNameColor(member.gender)}`}
                          >
                            {member.fullName}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getMemberBackgroundColor(member.gender)}`}
                          >
                            <User className="mr-1" size={10} />
                            {member.gender || "Not specified"}
                          </Badge>
                          {member.maritalStatus && (
                            <Badge variant="outline" className="text-xs">
                              <Heart className="mr-1" size={10} />
                              {member.maritalStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-500">
                          #{member.id}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {member.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-2 text-gray-400" size={14} />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center">
                          <Mail className="mr-2 text-gray-400" size={14} />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="mr-2 text-gray-400" size={14} />
                        <span>{member.currentCity}, {member.currentState}</span>
                      </div>
                    </div>

                    {(member.fatherName || member.motherName || member.spouseName) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 space-y-1">
                          {member.fatherName && (
                            <div>Father: {member.fatherName}</div>
                          )}
                          {member.motherName && (
                            <div>Mother: {member.motherName}</div>
                          )}
                          {member.spouseName && (
                            <div>Spouse: {member.spouseName}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}