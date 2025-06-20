import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Member } from "@shared/schema";

interface MemberCardProps {
  member: Member;
  index: number;
  startIndex: number;
}

export function MemberCard({ member, index, startIndex }: MemberCardProps) {
  // Force re-render with explicit member data extraction
  const memberName = String(member?.fullName || '');
  const memberNumber = startIndex + index + 1;
  
  console.log('MemberCard rendering member:', member);
  console.log('Extracted name:', memberName);
  console.log('Member number:', memberNumber);
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
      <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="text-temple-brown" size={24} />
        </div>
        <div className="text-lg font-bold text-white mb-2">
          {memberName || 'Unknown Member'}
        </div>
        <p className="text-saffron-100 text-sm">Member #{memberNumber}</p>
      </div>
    </Card>
  );
}