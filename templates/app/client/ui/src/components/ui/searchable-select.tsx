import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
  description?: string;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
};

type ListOption = SearchableSelectOption & { isAllOption?: boolean };

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allowAll = true,
  allLabel = 'All',
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const popoverContentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = React.useId();

  const selectedOption = React.useMemo(
    () => options.find(option => option.value === value),
    [options, value]
  );

  const selectedLabel = React.useMemo(() => {
    if (!value) {
      return null;
    }
    return selectedOption?.label ?? value;
  }, [selectedOption, value]);

  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter(option => {
      const searchable = [option.label, option.value, option.searchText, option.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [options, search]);

  const listOptions = React.useMemo<ListOption[]>(() => {
    const items: ListOption[] = [];
    if (allowAll) {
      items.push({ value: '', label: allLabel, isAllOption: true });
    }
    items.push(...filteredOptions);
    return items;
  }, [allowAll, allLabel, filteredOptions]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
    }
  };

  const closeAndReset = React.useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  const shouldIgnoreScroll = React.useCallback((target: EventTarget | null) => {
    if (!(target instanceof Node)) {
      return true;
    }

    if (popoverContentRef.current?.contains(target)) {
      return true;
    }

    const trigger = triggerRef.current;
    if (!trigger) {
      return true;
    }

    // Only react to scroll on ancestors of the trigger. Unrelated containers
    // (e.g. the main table list) can emit scroll events during layout updates.
    if (!target.contains(trigger)) {
      return true;
    }

    return false;
  }, []);

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue);
    closeAndReset();
  };

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const focusSearchInput = () => {
    searchInputRef.current?.focus();
  };

  React.useEffect(() => {
    if (!open) {
      return;
    }
    optionRefs.current = [];
    const frame = window.requestAnimationFrame(() => {
      focusSearchInput();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, listOptions.length]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleScroll = (event: Event) => {
      if (shouldIgnoreScroll(event.target)) {
        return;
      }
      closeAndReset();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, closeAndReset, shouldIgnoreScroll]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (listOptions.length > 0) {
        focusOption(0);
      }
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      if (listOptions.length === 0) {
        return;
      }
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndReset();
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = listOptions.length - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < lastIndex) {
        focusOption(index + 1);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        focusSearchInput();
      } else {
        focusOption(index - 1);
      }
      return;
    }

    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      if (index === 0) {
        focusSearchInput();
      } else {
        focusOption(index - 1);
      }
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      if (index < lastIndex) {
        event.preventDefault();
        focusOption(index + 1);
      } else {
        closeAndReset();
      }
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusOption(lastIndex);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndReset();
    }
  };

  const handleListboxWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();

    const listbox = event.currentTarget;
    if (listbox.scrollHeight <= listbox.clientHeight) {
      return;
    }

    event.preventDefault();
    listbox.scrollTop += event.deltaY;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={open}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={disabled}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'h-10 w-full justify-between px-3 py-2 font-normal [&>span]:line-clamp-1',
            !selectedLabel && 'text-muted-foreground',
            className
          )}
        >
          <span
            className="truncate"
            title={
              selectedOption?.searchText ??
              selectedOption?.description ??
              selectedLabel ??
              undefined
            }
          >
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverContentRef}
        align="start"
        className="pointer-events-auto p-0"
        onWheel={event => event.stopPropagation()}
        onTouchMove={event => event.stopPropagation()}
        onOpenAutoFocus={event => {
          event.preventDefault();
          focusSearchInput();
        }}
      >
        <div className="border-b p-2">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            className="h-8"
            role="searchbox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-label={searchPlaceholder}
          />
        </div>
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="max-h-60 overflow-y-auto overscroll-contain p-1"
          onWheel={handleListboxWheel}
        >
          {listOptions.map((option, index) => {
            const isSelected = option.isAllOption ? !value : value === option.value;

            return (
              <button
                key={option.isAllOption ? '__all__' : option.value}
                ref={element => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm outline-none transition-colors',
                  'focus-visible:bg-accent focus-visible:text-accent-foreground'
                )}
                onClick={() => handleSelect(option.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(option.value);
                    return;
                  }
                  handleOptionKeyDown(event, index);
                }}
              >
                <span
                  className="min-w-0 flex-1"
                  title={option.searchText ?? option.description ?? option.label}
                >
                  {option.isAllOption ? (
                    <span className="block truncate">{option.label}</span>
                  ) : (
                    <>
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </>
                  )}
                </span>
                <Check
                  className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                  aria-hidden="true"
                />
              </button>
            );
          })}
          {listOptions.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground" role="status">
              {emptyMessage}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
