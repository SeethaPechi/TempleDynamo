/**
 * DirectRelationshipFinder
 * Pick two members and see their direct relationship (if one exists).
 */
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

interface Props {
  members: Member[];
  allRelationships: Array<Relationship & { relatedMember: Member }>;
}

interface DirectResult {
  type: "direct" | "none";
  fromName: string;
  toName: string;
  /** The relationship label as stored (e.g. "Father") */
  relationshipType?: string;
}

export function DirectRelationshipFinder({ members, allRelationships }: Props) {
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [result, setResult] = useState<DirectResult | null>(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  function checkRelationship() {
    const fId = parseInt(fromId);
    const tId = parseInt(toId);
    if (!fId || !tId || fId === tId) return;

    const fromMember = memberById.get(fId);
    const toMember = memberById.get(tId);
    if (!fromMember || !toMember) return;

    // Look for a direct edge in either direction
    const forward = allRelationships.find(
      (r) => r.memberId === fId && r.relatedMemberId === tId,
    );
    const reverse = allRelationships.find(
      (r) => r.memberId === tId && r.relatedMemberId === fId,
    );

    const rel = forward ?? reverse;

    if (!rel) {
      setResult({ type: "none", fromName: fromMember.fullName, toName: toMember.fullName });
      return;
    }

    // If the stored record goes from->to, keep it as-is.
    // If it goes to->from, swap so the label reads naturally.
    const [labelFrom, labelTo] =
      rel.memberId === fId
        ? [fromMember.fullName, toMember.fullName]
        : [toMember.fullName, fromMember.fullName];

    setResult({
      type: "direct",
      fromName: labelFrom,
      toName: labelTo,
      relationshipType: rel.relationshipType,
    });
  }

  const sorted = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        Select two members to see if they have a direct relationship recorded.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">Member 1</label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger>
              <SelectValue placeholder="Select first member" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">Member 2</label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger>
              <SelectValue placeholder="Select second member" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={checkRelationship}
          disabled={!fromId || !toId || fromId === toId}
          className="text-white sm:w-auto w-full"
          style={{ backgroundColor: "hsl(37,100%,50%)" }}
        >
          <Heart size={16} className="mr-2" />
          Check
        </Button>
      </div>

      {/* Result */}
      {result?.type === "none" && (
        <Card className="p-6 text-center text-gray-500">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p>
            <strong>{result.fromName}</strong> and <strong>{result.toName}</strong> have no
            direct relationship recorded.
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Use the Map Relation tab to see if they are connected indirectly.
          </p>
        </Card>
      )}

      {result?.type === "direct" && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            {/* Member 1 */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow"
                style={{ backgroundColor: "hsl(33,100%,50%)" }}
              >
                {result.fromName.charAt(0)}
              </div>
              <span className="font-semibold text-gray-800">{result.fromName}</span>
            </div>

            {/* Relationship badge */}
            <div className="flex flex-col items-center gap-1 px-4">
              <Heart size={18} className="text-rose-400" />
              <span
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow"
                style={{ backgroundColor: "hsl(0,100%,35%)" }}
              >
                {result.relationshipType}
              </span>
              <span className="text-xs text-gray-400">of</span>
            </div>

            {/* Member 2 */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow"
                style={{ backgroundColor: "hsl(33,100%,50%)" }}
              >
                {result.toName.charAt(0)}
              </div>
              <span className="font-semibold text-gray-800">{result.toName}</span>
            </div>
          </div>
        </Card>
      )}

      {result === null && (
        <Card className="p-6 text-center text-gray-400 border-dashed">
          Select two members and click <strong>Check</strong> to see their relationship.
        </Card>
      )}
    </div>
  );
}
