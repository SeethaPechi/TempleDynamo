import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Member } from "@shared/schema";

interface MemberCardProps {
  member: Member;
  index: number;
  startIndex: number;
}

export function MemberCard({ member, index, startIndex }: MemberCardProps) {
  console.log('MemberCard rendering:', member);
  console.log('Member fullName:', member.fullName);
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
      <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="text-temple-brown" size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {member.fullName}
        </h3>
        <p className="text-saffron-100 text-sm">Member #{startIndex + index + 1}</p>
      </div>
    </Card>
  );
}