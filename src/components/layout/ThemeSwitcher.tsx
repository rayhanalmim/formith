import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const { language } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card min-w-[120px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer ${theme === 'light' ? 'bg-primary/20 text-primary' : ''}`}
        >
          <Sun className="h-4 w-4 me-2" />
          {language === 'ar' ? 'فاتح' : 'Light'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer ${theme === 'dark' ? 'bg-primary/20 text-primary' : ''}`}
        >
          <Moon className="h-4 w-4 me-2" />
          {language === 'ar' ? 'داكن' : 'Dark'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
