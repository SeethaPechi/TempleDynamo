import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Locale mapping for date-fns (using English as fallback for Tamil)
const localeMap = {
  en: enUS,
  ta: enUS, // Using English locale as fallback for Tamil
};

// Utility function to get the current locale for date-fns
export const getDateLocale = (language: string) => {
  return localeMap[language as keyof typeof localeMap] || enUS;
};

// Format date based on current language
export const formatDate = (date: string | Date, formatStr: string = 'PPP', language: string = 'en') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: getDateLocale(language) });
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toString();
  }
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeDate = (date: string | Date, language: string = 'en') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (language === 'ta') {
      if (diffDays === 0) return 'இன்று';
      if (diffDays === 1) return '1 நாள் முன்பு';
      if (diffDays < 30) return `${diffDays} நாட்கள் முன்பு`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} மாதங்கள் முன்பு`;
      return `${Math.floor(diffDays / 365)} ஆண்டுகள் முன்பு`;
    } else {
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  } catch (error) {
    console.error('Relative date formatting error:', error);
    return date.toString();
  }
};

// Transform form field values based on language
export const useFormDataTransformation = () => {
  const { i18n, t } = useTranslation();
  
  const transformRelationshipType = (relationshipType: string) => {
    if (!relationshipType) return relationshipType;
    const key = relationshipType.toLowerCase().replace(/\s+/g, '');
    return t(`registry.form.relationships.${key}`, { defaultValue: relationshipType });
  };
  
  const transformGender = (gender: string) => {
    if (!gender) return gender;
    return t(`registry.form.genders.${gender.toLowerCase()}`, { defaultValue: gender });
  };
  
  const transformMaritalStatus = (maritalStatus: string) => {
    if (!maritalStatus) return maritalStatus;
    return t(`registry.form.maritalStatus.${maritalStatus.toLowerCase()}`, { defaultValue: maritalStatus });
  };
  
  const transformFormData = (data: any) => {
    if (!data) return data;
    
    const transformed = { ...data };
    const currentLang = i18n.language;
    
    // Transform gender values
    if (transformed.gender) {
      transformed.gender = t(`registry.form.genders.${transformed.gender.toLowerCase()}`);
    }
    
    // Transform marital status
    if (transformed.maritalStatus) {
      transformed.maritalStatus = t(`registry.form.maritalStatus.${transformed.maritalStatus.toLowerCase()}`);
    }
    
    // Transform relationship types
    if (transformed.relationshipType) {
      transformed.relationshipType = t(`registry.form.relationships.${transformed.relationshipType.toLowerCase().replace(' ', '')}`);
    }
    
    // Transform dates
    if (transformed.createdAt) {
      transformed.createdAt = formatDate(transformed.createdAt, 'PPP', currentLang);
    }
    
    if (transformed.birthDate) {
      transformed.birthDate = formatDate(transformed.birthDate, 'PPP', currentLang);
    }
    
    return transformed;
  };
  
  const transformMemberData = (member: any) => {
    if (!member) return member;
    
    return {
      ...member,
      gender: member.gender ? t(`registry.form.genders.${member.gender.toLowerCase()}`) : '',
      maritalStatus: member.maritalStatus ? t(`registry.form.maritalStatus.${member.maritalStatus.toLowerCase()}`) : '',
      createdAt: member.createdAt ? formatDate(member.createdAt, 'PPP', i18n.language) : '',
    };
  };
  
  const transformRelationshipData = (relationships: any[]) => {
    if (!relationships) return relationships;
    
    return relationships.map(rel => ({
      ...rel,
      relationshipType: transformRelationshipType(rel.relationshipType),
      createdAt: rel.createdAt ? formatDate(rel.createdAt, 'PPP', i18n.language) : '',
      relatedMember: transformMemberData(rel.relatedMember)
    }));
  };
  
  return {
    transformFormData,
    transformMemberData,
    transformRelationshipData,
    transformRelationshipType,
    transformGender,
    transformMaritalStatus,
    formatDate: (date: string | Date, formatStr?: string) => formatDate(date, formatStr, i18n.language),
    formatRelativeDate: (date: string | Date) => formatRelativeDate(date, i18n.language)
  };
};

// Hook for localized country/state/city names
export const useLocationTranslation = () => {
  const { t, i18n } = useTranslation();
  
  const translateLocation = (location: string, type: 'country' | 'state' | 'city') => {
    const key = `locations.${type}.${location.toLowerCase().replace(/\s+/g, '')}`;
    const translated = t(key);
    return translated !== key ? translated : location;
  };
  
  return { translateLocation };
};