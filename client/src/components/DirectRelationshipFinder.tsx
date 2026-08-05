/**
 * DirectRelationshipFinder
 * Pick two members and see their direct relationship (if one exists).
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { withHonorific } from "@/lib/honorific";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Users, GitMerge } from "lucide-react";
import type { Member, Relationship } from "@shared/schema";

interface Props {
  members: Member[];
  allRelationships: Array<Relationship & { relatedMember: Member }>;
}

interface DirectResult {
  type: "direct" | "none";
  /** The person who IS the relationship type (e.g. the Father) */
  subjectName: string;
  /** The person the type points at (e.g. the Son) */
  objectName: string;
  relationshipType?: string;
}

export function DirectRelationshipFinder({ members, allRelationships }: Props) {
  const { t } = useTranslation();
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
      setResult({
        type: "none",
        subjectName: withHonorific(fromMember.fullName, fromMember.gender, fromMember.maritalStatus),
        objectName: withHonorific(toMember.fullName, toMember.gender, toMember.maritalStatus),
      });
      return;
    }

    // Always show in stored direction: memberId IS [type] OF relatedMemberId
    const subjectMember = memberById.get(rel.memberId);
    const objectMember  = memberById.get(rel.relatedMemberId);
    const subjectName = withHonorific(
      subjectMember?.fullName ?? `#${rel.memberId}`,
      subjectMember?.gender,
      subjectMember?.maritalStatus,
    );
    const objectName = withHonorific(
      objectMember?.fullName ?? rel.relatedMember?.fullName ?? `#${rel.relatedMemberId}`,
      objectMember?.gender ?? rel.relatedMember?.gender,
      objectMember?.maritalStatus ?? rel.relatedMember?.maritalStatus,
    );

    setResult({
      type: "direct",
      subjectName,
      objectName,
      relationshipType: rel.relationshipType,
    });
  }

  const sorted = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-sm">
        {t("familyTree.selectMembersRelHint")}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("familyTree.member1")}</label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger>
              <SelectValue placeholder={t("familyTree.selectFirstMember")} />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {withHonorific(m.fullName, m.gender, m.maritalStatus)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("familyTree.member2")}</label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger>
              <SelectValue placeholder={t("familyTree.selectSecondMember")} />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {withHonorific(m.fullName, m.gender, m.maritalStatus)}
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
          {t("familyTree.checkRelationship")}
        </Button>
      </div>

      {/* No direct relationship */}
      {result?.type === "none" && (
        <Card className="p-6 text-center text-gray-500">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p>
            <strong>{result.subjectName}</strong> {t("familyTree.isOf")}{" "}
            <strong>{result.objectName}</strong>{" "}
            இடையே நேரடி உறவு பதிவு இல்லை.
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Use the <strong>Map Relation</strong> tab to see if they are connected indirectly.
          </p>
        </Card>
      )}

      {/* Direct relationship found */}
      {result?.type === "direct" && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Sentence display — unambiguous */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 text-base text-gray-800 max-w-lg">
              <span
                className="font-bold text-lg"
                style={{ color: "hsl(33,100%,38%)" }}
              >
                {result.subjectName}
              </span>
              <span className="text-gray-500 mx-2">is</span>
              <span
                className="font-bold text-lg px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: "hsl(0,80%,40%)" }}
              >
                {result.relationshipType}
              </span>
              <span className="text-gray-500 mx-2">of</span>
              <span
                className="font-bold text-lg"
                style={{ color: "hsl(33,100%,38%)" }}
              >
                {result.objectName}
              </span>
            </div>

            {/* Avatar row */}
            <div className="flex items-center gap-6 mt-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow"
                  style={{ backgroundColor: "hsl(33,100%,48%)" }}
                >
                  {result.subjectName.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-700 max-w-[80px] text-center leading-tight">
                  {result.subjectName}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <GitMerge size={22} className="text-orange-400" />
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "hsl(0,80%,40%)" }}
                >
                  {result.relationshipType}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow"
                  style={{ backgroundColor: "hsl(33,100%,48%)" }}
                >
                  {result.objectName.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-700 max-w-[80px] text-center leading-tight">
                  {result.objectName}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Initial prompt */}
      {result === null && (
        <Card className="p-6 text-center text-gray-400 border-dashed">
          {t("familyTree.selectMembersRelHint")}
        </Card>
      )}
    </div>
  );
}
