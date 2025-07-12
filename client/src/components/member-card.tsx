import { Card } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import type { Member } from "@shared/schema";
import { useFormDataTransformation } from "@/lib/i18n-utils";
import { useTranslation } from "react-i18next";

interface MemberCardProps {
  member: Member;
  index: number;
  startIndex: number;
}

export function MemberCard({ member, index, startIndex }: MemberCardProps) {
  const { t } = useTranslation();
  const { transformGender } = useFormDataTransformation();
  
  // Force re-render with explicit member data extraction
  const memberName = String(member?.fullName || '');
  const memberNumber = startIndex + index + 1;
  const translatedGender = member?.gender ? transformGender(member.gender) : t('common.unspecified', 'Unspecified');
  
  // Get gender-based colors
  const getGenderColors = (gender: string | null) => {
    if (gender === 'Male') {
      return {
        gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        textLight: 'text-blue-100'
      };
    }
    if (gender === 'Female') {
      return {
        gradient: 'bg-gradient-to-r from-pink-500 to-pink-600',
        iconBg: 'bg-pink-50',
        iconColor: 'text-pink-600',
        textLight: 'text-pink-100'
      };
    }
    // Default temple colors for unspecified gender
    return {
      gradient: 'bg-gradient-to-r from-saffron-500 to-temple-gold',
      iconBg: 'bg-white',
      iconColor: 'text-temple-brown',
      textLight: 'text-saffron-100'
    };
  };

  const colors = getGenderColors(member?.gender);
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
      <div className={`${colors.gradient} p-6 text-center`}>
        <div className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden`}>
          {member?.profilePicture ? (
            <img
              src={member.profilePicture}
              alt={`${memberName} profile`}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className={colors.iconColor} size={24} />
          )}
        </div>
        <div className="text-lg font-bold text-white mb-2" style={{ 
          color: 'white', 
          fontSize: '18px', 
          fontWeight: 'bold',
          display: 'block',
          visibility: 'visible'
        }}>
          {memberName || 'Unknown Member'}
        </div>
        <p className={`${colors.textLight} text-sm`}>
          {t('common.member', 'Member')} #{memberNumber} • {translatedGender}
        </p>
      </div>
    </Card>
  );
}