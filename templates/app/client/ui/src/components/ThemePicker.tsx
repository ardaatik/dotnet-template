import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { Check, Palette } from 'lucide-react';
import { useMemo, useState } from 'react';

function ThemeSwatches({
  background,
  primary,
  accent,
}: {
  background: string;
  primary: string;
  accent: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {[background, primary, accent].map((color, index) => (
        <span
          key={index}
          className="size-3 rounded-full border border-border/60"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ThemePicker() {
  const { palette, setPalette, palettes } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPalettes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return palettes;
    }

    return palettes.filter(entry => entry.theme.toLowerCase().includes(query));
  }, [palettes, search]);

  const handleSelect = (name: string) => {
    setPalette(name);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearch('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg"
          aria-label="Choose theme palette"
          title={`Theme: ${palette}`}
        >
          <Palette className="size-[1.2rem]" />
          <span className="sr-only">Choose theme palette</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search themes..."
            aria-label="Search themes"
            className="h-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filteredPalettes.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No themes found.</p>
          ) : (
            filteredPalettes.map(entry => {
              const isSelected = entry.theme === palette;

              return (
                <button
                  key={entry.theme}
                  type="button"
                  onClick={() => handleSelect(entry.theme)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                >
                  <ThemeSwatches
                    background={entry.variables['--background'] ?? 'transparent'}
                    primary={entry.variables['--primary'] ?? 'transparent'}
                    accent={entry.variables['--accent'] ?? 'transparent'}
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.theme}</span>
                  {isSelected ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
