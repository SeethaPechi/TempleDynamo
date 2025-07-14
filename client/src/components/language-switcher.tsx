import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

export function LanguageSwitcher() {
  return (
    <Button variant="outline" size="sm" className="gap-2 bg-white border-saffron-300 text-temple-brown hover:bg-saffron-50">
      <Languages className="h-4 w-4" />
      <span className="font-medium">English</span>
    </Button>
  );
}