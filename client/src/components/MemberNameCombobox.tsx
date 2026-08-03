/**
 * MemberNameCombobox
 *
 * Searchable combobox for Father's Name, Mother's Name, and Spouse Name fields.
 * - Pulls options from the members registry
 * - "Don't Know" option when the person isn't in the system
 * - Disambiguation dialog when 2+ members share the same name
 * - Calls onSave immediately on selection (no blur needed)
 */
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Member } from "@shared/schema";

interface MemberNameComboboxProps {
  value: string;
  onChange: (name: string) => void;
  /** Called right after selection — use to trigger auto-save */
  onSave?: (name: string) => void;
  members: Member[];
  temples?: Array<{ id: number; templeName?: string; name?: string }>;
  placeholder?: string;
  disabled?: boolean;
  /** Exclude this member ID from the list (the member being edited) */
  currentMemberId?: number;
}

const DONT_KNOW_VALUE = "Don't Know";

export function MemberNameCombobox({
  value,
  onChange,
  onSave,
  members,
  temples = [],
  placeholder = "Search or select a member...",
  disabled = false,
  currentMemberId,
}: MemberNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [disambiguateCandidates, setDisambiguateCandidates] = useState<Member[]>([]);

  const templeById = useMemo(
    () =>
      new Map(
        temples.map((t) => [t.id, t.templeName ?? (t as any).name ?? "—"]),
      ),
    [temples],
  );

  const eligible = useMemo(
    () =>
      members
        .filter((m) => m.id !== currentMemberId)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members, currentMemberId],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return eligible.slice(0, 60);
    return eligible
      .filter((m) => m.fullName.toLowerCase().includes(term))
      .slice(0, 60);
  }, [eligible, search]);

  const isUnknown = value === DONT_KNOW_VALUE;
  const displayValue = isUnknown ? DONT_KNOW_VALUE : (value || "");

  function commit(name: string) {
    setOpen(false);
    setSearch("");
    onChange(name);
    onSave?.(name);
  }

  function handleSelect(name: string) {
    if (name === DONT_KNOW_VALUE) {
      commit(DONT_KNOW_VALUE);
      return;
    }

    // If 2+ members share this exact name, ask the user to disambiguate
    const matches = eligible.filter((m) => m.fullName === name);
    if (matches.length > 1) {
      setDisambiguateCandidates(matches);
      setOpen(false);
    } else {
      commit(name);
    }
  }

  function handleDisambiguate(member: Member) {
    setDisambiguateCandidates([]);
    commit(member.fullName);
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full h-10 sm:h-11 justify-between font-normal text-left",
              !displayValue && "text-muted-foreground",
            )}
          >
            <span className="truncate flex-1">
              {displayValue || (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type a name to search…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>No member found with that name.</CommandEmpty>

              {/* DON'T KNOW option */}
              <CommandGroup heading="Special">
                <CommandItem
                  value={DONT_KNOW_VALUE}
                  onSelect={() => handleSelect(DONT_KNOW_VALUE)}
                  className="text-gray-500"
                >
                  <HelpCircle className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                  <span>Don't Know</span>
                  {isUnknown && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Registry members */}
              <CommandGroup heading="Family Registry">
                {filtered.map((m) => {
                  const parentPrefix = m.gender === "Female" ? "d/o" : "s/o";
                  const isMarried =
                    m.maritalStatus === "Married" || m.maritalStatus === "Widowed";
                  const hint = [
                    m.fatherName && `${parentPrefix} ${m.fatherName}`,
                    isMarried && m.spouseName && `Sp. ${m.spouseName}`,
                    m.birthCity,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <CommandItem
                      key={m.id}
                      value={m.fullName}
                      onSelect={() => handleSelect(m.fullName)}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{m.fullName}</span>
                        {hint && (
                          <span className="text-[11px] text-gray-400 truncate">
                            {hint}
                          </span>
                        )}
                      </div>
                      {value === m.fullName && !isUnknown && (
                        <Check className="ml-2 h-4 w-4 shrink-0 text-green-600" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* ── Disambiguation dialog ── */}
      <Dialog
        open={disambiguateCandidates.length > 0}
        onOpenChange={(o) => {
          if (!o) setDisambiguateCandidates([]);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-temple-brown">
              Multiple Members Found
            </DialogTitle>
            <DialogDescription>
              {disambiguateCandidates.length} members share this name. Select
              the correct person to link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {disambiguateCandidates.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleDisambiguate(m)}
                className="w-full text-left border rounded-lg p-4 hover:border-orange-400 hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <div className="font-semibold text-temple-brown mb-2 text-base">
                  {m.fullName}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600">
                  {m.fatherName && (
                    <span>
                      <span className="font-medium text-gray-700">Father: </span>
                      {m.fatherName}
                    </span>
                  )}
                  {m.motherName && (
                    <span>
                      <span className="font-medium text-gray-700">Mother: </span>
                      {m.motherName}
                    </span>
                  )}
                  {m.spouseName && (
                    <span>
                      <span className="font-medium text-gray-700">Spouse: </span>
                      {m.spouseName}
                    </span>
                  )}
                  {m.birthCity && (
                    <span>
                      <span className="font-medium text-gray-700">Birthplace: </span>
                      {m.birthCity}
                      {m.birthState ? `, ${m.birthState}` : ""}
                    </span>
                  )}
                  {m.templeId && templeById.get(m.templeId) && (
                    <span className="col-span-2">
                      <span className="font-medium text-gray-700">Temple: </span>
                      {templeById.get(m.templeId)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
