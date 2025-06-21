import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface SimpleMemberCardProps {
  fullName: string;
  memberNumber: number;
}

export function SimpleMemberCard({ fullName, memberNumber }: SimpleMemberCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
      <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="text-temple-brown" size={24} />
        </div>
        <div style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          {fullName}
        </div>
        <p className="text-saffron-100 text-sm">Member #{memberNumber}</p>
      </div>
    </Card>
  );
}