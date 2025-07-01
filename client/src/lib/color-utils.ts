// Comprehensive color coding system for temple family management app

export interface ColorScheme {
  gradient: string;
  background: string;
  border: string;
  text: string;
  iconBg: string;
  iconColor: string;
  textLight: string;
}

// Gender-based color schemes for members
export const getGenderColors = (gender: string | null): ColorScheme => {
  if (gender === 'Male') {
    return {
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textLight: 'text-blue-100'
    };
  }
  
  if (gender === 'Female') {
    return {
      gradient: 'bg-gradient-to-r from-pink-500 to-pink-600',
      background: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-900',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      textLight: 'text-pink-100'
    };
  }
  
  // Default temple colors for unspecified gender
  return {
    gradient: 'bg-gradient-to-r from-saffron-500 to-temple-gold',
    background: 'bg-saffron-50',
    border: 'border-temple-gold/20',
    text: 'text-temple-brown',
    iconBg: 'bg-white',
    iconColor: 'text-temple-brown',
    textLight: 'text-saffron-100'
  };
};

// Unique colors for each relationship type
export const getRelationshipColor = (relationship: string): string => {
  const type = relationship.toLowerCase().replace(/\s+/g, '');
  
  const relationshipColors: Record<string, string> = {
    // Parents
    'father': 'bg-blue-600 text-white border-blue-700',
    'mother': 'bg-rose-500 text-white border-rose-600',
    
    // Grandparents
    'paternalgrandfather': 'bg-slate-800 text-white border-slate-900', // Dark blue
    'paternalgrandmother': 'bg-slate-600 text-white border-slate-700',
    'maternalgrandfather': 'bg-purple-800 text-white border-purple-900', // Velvet
    'maternalgrandmother': 'bg-purple-600 text-white border-purple-700',
    
    // Spouses
    'husband': 'bg-emerald-600 text-white border-emerald-700',
    'wife': 'bg-pink-600 text-white border-pink-700',
    'spouse': 'bg-teal-600 text-white border-teal-700',
    
    // Children
    'son': 'bg-indigo-600 text-white border-indigo-700',
    'daughter': 'bg-pink-500 text-white border-pink-600',
    'child': 'bg-purple-500 text-white border-purple-600',
    
    // Siblings
    'brother': 'bg-green-600 text-white border-green-700',
    'sister': 'bg-pink-400 text-white border-pink-500',
    'elderbrother': 'bg-green-700 text-white border-green-800',
    'eldersister': 'bg-pink-600 text-white border-pink-700',
    'youngerbrother': 'bg-green-500 text-white border-green-600',
    'youngersister': 'bg-pink-300 text-gray-800 border-pink-400',
    
    // Uncles and Aunts
    'paternaluncle': 'bg-orange-600 text-white border-orange-700',
    'paternalaunt': 'bg-orange-400 text-white border-orange-500',
    'maternaluncle': 'bg-amber-600 text-white border-amber-700',
    'maternalaunt': 'bg-amber-400 text-white border-amber-500',
    'uncle': 'bg-yellow-600 text-white border-yellow-700',
    'aunt': 'bg-yellow-400 text-gray-800 border-yellow-500',
    
    // Extended family
    'cousin': 'bg-lime-600 text-white border-lime-700',
    'nephew': 'bg-cyan-600 text-white border-cyan-700',
    'niece': 'bg-cyan-400 text-white border-cyan-500',
    'grandson': 'bg-violet-600 text-white border-violet-700',
    'granddaughter': 'bg-violet-400 text-white border-violet-500',
    
    // In-laws
    'fatherinlaw': 'bg-gray-700 text-white border-gray-800',
    'motherinlaw': 'bg-gray-500 text-white border-gray-600',
    'brotherinlaw': 'bg-stone-600 text-white border-stone-700',
    'sisterinlaw': 'bg-stone-400 text-white border-stone-500',
  };
  
  return relationshipColors[type] || 'bg-gray-400 text-white border-gray-500';
};

// Gender-based text colors for member names
export const getMemberNameColor = (gender: string | null): string => {
  if (gender === 'Male') return 'text-blue-700 font-semibold';
  if (gender === 'Female') return 'text-pink-700 font-semibold';
  return 'text-gray-700 font-semibold';
};

// Get member card background based on gender
export const getMemberBackgroundColor = (gender: string | null): string => {
  if (gender === 'Male') return 'bg-blue-50 border-blue-200 text-blue-900';
  if (gender === 'Female') return 'bg-pink-50 border-pink-200 text-pink-900';
  return 'bg-gray-50 border-gray-200 text-gray-900';
};