/**
 * getRelationshipsFor — bidirectional Tamil-aware relationship resolver.
 *
 * A single stored row (member_id=M, type=T, related_member_id=R) means
 * "R is T of M".  This resolver returns relationships from BOTH directions
 * so that both M's page and R's page show the correct relative.
 *
 * Reverse labels are computed from relationship_types.reverse_when_male /
 * reverse_when_female, falling back to a static inline map for any type
 * not yet seeded.
 *
 * Elder/younger sibling labels are auto-refined when birth_year or
 * birth_order data is available on both members.
 */

import { db } from "./db";
import { relationships, members, relationshipTypes } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Member } from "@shared/schema";

export interface ResolvedRelationship {
  id: number;
  memberId: number;
  relatedMemberId: number;
  /** English slug — kept for backwards-compat (color maps, group filters, chain finder) */
  relationshipType: string;
  /** Human-readable English label from relationship_types.label_en (falls back to slug) */
  labelEn: string;
  /** Tamil label from relationship_types.label_ta (null when not set) */
  labelTa: string | null;
  /** Display label resolved for the requested lang ('en' → labelEn, 'ta' → labelTa ?? labelEn) */
  label: string;
  createdAt: Date | null;
  relatedMember: Member;
  /** True when this relationship was inferred via 2-hop traversal (not a directly stored row) */
  inferred?: boolean;
}

// ---------------------------------------------------------------------------
// Static fallback inverse map (used when DB reciprocal columns are not set)
// ---------------------------------------------------------------------------
function staticInverse(type: string, relativeGender: string | null | undefined): string {
  const M = relativeGender === "Male";
  const F = relativeGender === "Female";
  const map: Record<string, string> = {
    "Father":                   M ? "Son"              : F ? "Daughter"              : "Child",
    "Mother":                   M ? "Son"              : F ? "Daughter"              : "Child",
    "Son":                      M ? "Father"           : F ? "Mother"                : "Parent",
    "Daughter":                 M ? "Father"           : F ? "Mother"                : "Parent",
    "Step Father":              M ? "Step-Son"         : F ? "Step-Daughter"         : "Step-Child",
    "Step Mother":              M ? "Step-Son"         : F ? "Step-Daughter"         : "Step-Child",
    "Step-Son":                 M ? "Step Father"      : F ? "Step Mother"           : "Step-Parent",
    "Step-Daughter":            M ? "Step Father"      : F ? "Step Mother"           : "Step-Parent",
    "Husband":                  "Wife",
    "Wife":                     "Husband",
    "Elder Brother":            M ? "Younger Brother"  : F ? "Younger Sister"        : "Younger Sibling",
    "Younger Brother":          M ? "Elder Brother"    : F ? "Elder Sister"          : "Elder Sibling",
    "Elder Sister":             M ? "Younger Brother"  : F ? "Younger Sister"        : "Younger Sibling",
    "Younger Sister":           M ? "Elder Brother"    : F ? "Elder Sister"          : "Elder Sibling",
    "Step-Brother":             M ? "Step-Brother"     : F ? "Step-Sister"           : "Step-Sibling",
    "Step-Sister":              M ? "Step-Brother"     : F ? "Step-Sister"           : "Step-Sibling",
    "Father-in-Law":            M ? "Son-in-Law"       : F ? "Daughter-in-Law"       : "Child-in-Law",
    "Mother-in-Law":            M ? "Son-in-Law"       : F ? "Daughter-in-Law"       : "Child-in-Law",
    "Son-in-Law":               M ? "Father-in-Law"    : F ? "Mother-in-Law"         : "Parent-in-Law",
    "Daughter-in-Law":          M ? "Father-in-Law"    : F ? "Mother-in-Law"         : "Parent-in-Law",
    "Brother-in-Law":           M ? "Brother-in-Law"   : F ? "Sister-in-Law"         : "Sibling-in-Law",
    "Sister-in-Law":            M ? "Brother-in-Law"   : F ? "Sister-in-Law"         : "Sibling-in-Law",
    "Paternal Grandfather":     M ? "Grand Son"        : F ? "Grand Daugher"         : "Grandchild",
    "Paternal Grandmother":     M ? "Grand Son"        : F ? "Grand Daugher"         : "Grandchild",
    "Maternal Grandfather":     M ? "Grand Son"        : F ? "Grand Daugher"         : "Grandchild",
    "Maternal Grandmother":     M ? "Grand Son"        : F ? "Grand Daugher"         : "Grandchild",
    "Grand Son":                M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Daugher":            M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Son-Son Side":       M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Daughter-Son Side":  M ? "Paternal Grandfather" : F ? "Paternal Grandmother" : "Grandparent",
    "Grand Son-Daughter Side":  M ? "Maternal Grandfather" : F ? "Maternal Grandmother" : "Grandparent",
    "Grand Daughter-Daughter Side": M ? "Maternal Grandfather" : F ? "Maternal Grandmother" : "Grandparent",
    "Nephew":                   M ? "Uncle-Father Side" : F ? "Aunt-Father Side"     : "Uncle/Aunt",
    "Niece":                    M ? "Uncle-Father Side" : F ? "Aunt-Father Side"     : "Uncle/Aunt",
    "Paternal Uncle":           M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Paternal Aunt":            M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Uncle-Father Side":        M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Aunt-Father Side":         M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Uncle-Mother Side":        M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Aunt-Mother Side":         M ? "Nephew"           : F ? "Niece"                 : "Nephew/Niece",
    "Cousin Brother-Father Side": M ? "Cousin Brother-Father Side" : F ? "Cousin Sister-Father Side" : "Cousin",
    "Cousin Sister-Father Side":  M ? "Cousin Brother-Father Side" : F ? "Cousin Sister-Father Side" : "Cousin",
    "Cousin Brother-Mother Side": M ? "Cousin Brother-Mother Side" : F ? "Cousin Sister-Mother Side" : "Cousin",
    "Cousin Sister-Mother Side":  M ? "Cousin Brother-Mother Side" : F ? "Cousin Sister-Mother Side" : "Cousin",
  };
  return map[type] ?? type;
}

// ---------------------------------------------------------------------------
// Load relationship type metadata from DB (small table, one query per call)
// Returns a map keyed by the English name/slug.
// ---------------------------------------------------------------------------
interface RtMeta {
  male: string | null;
  female: string | null;
  labelEn: string;
  labelTa: string | null;
}
type RtMap = Map<string, RtMeta>;

async function loadRtMap(): Promise<RtMap> {
  const rows = await db
    .select({
      name: relationshipTypes.name,
      labelEn: relationshipTypes.labelEn,
      labelTa: relationshipTypes.labelTa,
      reverseWhenMale: relationshipTypes.reverseWhenMale,
      reverseWhenFemale: relationshipTypes.reverseWhenFemale,
    })
    .from(relationshipTypes);

  const map: RtMap = new Map();
  for (const row of rows) {
    map.set(row.name, {
      male: row.reverseWhenMale ?? null,
      female: row.reverseWhenFemale ?? null,
      labelEn: row.labelEn,
      labelTa: row.labelTa ?? null,
    });
  }
  return map;
}

/** Resolve display labels for a given slug using the rt map and lang. */
function resolveLabels(
  slug: string,
  rtMap: RtMap,
  lang: string,
): { labelEn: string; labelTa: string | null; label: string } {
  const meta = rtMap.get(slug);
  const labelEn = meta?.labelEn ?? slug;
  const labelTa = meta?.labelTa ?? null;
  const label = lang === "ta" ? (labelTa ?? labelEn) : labelEn;
  return { labelEn, labelTa, label };
}

// ---------------------------------------------------------------------------
// Age/order helpers for elder/younger sibling refinement
// ---------------------------------------------------------------------------
function ageRelation(
  subjectBirthOrder: number | null | undefined,
  subjectDateOfBirth: string | null | undefined,
  subjectBirthYear: number | null | undefined,
  relativeBirthOrder: number | null | undefined,
  relativeDateOfBirth: string | null | undefined,
  relativeBirthYear: number | null | undefined,
): "elder" | "younger" | null {
  // Priority 1: birth_order (explicit admin-set ordering; lower = elder)
  if (subjectBirthOrder != null && relativeBirthOrder != null && subjectBirthOrder !== relativeBirthOrder) {
    return relativeBirthOrder < subjectBirthOrder ? "elder" : "younger";
  }
  // Priority 2: date_of_birth (most precise when full date is known)
  if (subjectDateOfBirth && relativeDateOfBirth && subjectDateOfBirth !== relativeDateOfBirth) {
    return relativeDateOfBirth < subjectDateOfBirth ? "elder" : "younger";
  }
  // Priority 3: birth_year fallback
  if (subjectBirthYear != null && relativeBirthYear != null && subjectBirthYear !== relativeBirthYear) {
    return relativeBirthYear < subjectBirthYear ? "elder" : "younger";
  }
  return null;
}

function refineSiblingSlug(
  slug: string,
  relation: "elder" | "younger" | null,
  relativeGender: string | null | undefined,
): string {
  if (!relation) return slug;
  const isBro = relativeGender === "Male";
  const isSis = relativeGender === "Female";
  if (relation === "elder")   return isBro ? "Elder Brother"   : isSis ? "Elder Sister"   : slug;
  if (relation === "younger") return isBro ? "Younger Brother" : isSis ? "Younger Sister" : slug;
  return slug;
}

const SIBLING_TYPES = new Set([
  "Elder Brother", "Younger Brother", "Elder Sister", "Younger Sister",
  "Brother", "Sister",
]);

// ---------------------------------------------------------------------------
// 2-hop inference helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the direct 1-hop relationships of a given member from both
 * forward and reverse edges. Returns lightweight rows (type + relative member).
 */
async function directRelsOf(
  memberId: number,
  rtMap: RtMap,
): Promise<Array<{ id: number; type: string; relative: Member }>> {
  const fwd = await db
    .select({
      id: relationships.id,
      type: relationships.relationshipType,
      relative: members,
    })
    .from(relationships)
    .innerJoin(members, eq(members.id, relationships.relatedMemberId))
    .where(eq(relationships.memberId, memberId));

  const rev = await db
    .select({
      id: relationships.id,
      type: relationships.relationshipType,
      relative: members,
    })
    .from(relationships)
    .innerJoin(members, eq(members.id, relationships.memberId))
    .where(eq(relationships.relatedMemberId, memberId));

  const out: Array<{ id: number; type: string; relative: Member }> = [];
  for (const r of fwd) {
    out.push({ id: r.id, type: r.type, relative: r.relative as Member });
  }
  for (const r of rev) {
    // resolve the reciprocal label (we just need the effective type slug)
    const rtEntry = rtMap.get(r.type);
    const relGender = (r.relative as Member).gender;
    const slug =
      rtEntry
        ? (relGender === "Female" ? rtEntry.female : rtEntry.male) ?? staticInverse(r.type, relGender)
        : staticInverse(r.type, relGender);
    out.push({ id: r.id, type: slug, relative: r.relative as Member });
  }
  return out;
}

/**
 * 2-hop inference rules:
 *   Spouse's Father/Mother    → Father-in-Law / Mother-in-Law
 *   Father's Father/Mother    → Paternal Grandfather / Paternal Grandmother
 *   Mother's Father/Mother    → Maternal Grandfather / Maternal Grandmother
 *   Son's Son/Daughter        → Grand Son / Grand Daugher
 *   Daughter's Son/Daughter   → Grand Son-Daughter Side / Grand Daughter -Daughter Side
 *
 * Returns inferred entries using the 2nd-hop DB row id, deduped against
 * already-seen member IDs.
 */
async function inferTwoHop(
  directResults: ResolvedRelationship[],
  rtMap: RtMap,
  lang: string,
  seenMemberIds: Set<number>,
): Promise<ResolvedRelationship[]> {
  const inferred: ResolvedRelationship[] = [];
  const seenInferred = new Set<string>(); // `memberId:slug`

  const addInferred = (hopId: number, hopMemberId: number, slug: string, relative: Member) => {
    const key = `${relative.id}:${slug}`;
    if (seenMemberIds.has(relative.id)) return; // already a direct relative
    if (seenInferred.has(key)) return;
    seenInferred.add(key);
    const { labelEn, labelTa, label } = resolveLabels(slug, rtMap, lang);
    inferred.push({
      id: hopId,
      memberId: hopMemberId,
      relatedMemberId: relative.id,
      relationshipType: slug,
      labelEn,
      labelTa,
      label,
      createdAt: null,
      relatedMember: relative,
      inferred: true,
    });
  };

  for (const direct of directResults) {
    const directType = direct.relationshipType;
    const firstHopId = direct.relatedMemberId;

    // Which 2nd-hop parent types to follow?
    const isSpouse   = directType === "Husband" || directType === "Wife";
    const isFather   = directType === "Father"  || directType === "Step Father";
    const isMother   = directType === "Mother"  || directType === "Step Mother";
    const isSon      = directType === "Son"     || directType === "Step-Son";
    const isDaughter = directType === "Daughter"|| directType === "Step-Daughter";

    if (!isSpouse && !isFather && !isMother && !isSon && !isDaughter) continue;

    const hop2 = await directRelsOf(firstHopId, rtMap);

    for (const h of hop2) {
      if (h.relative.id === direct.memberId) continue; // avoid circular back to subject

      if (isSpouse) {
        if (h.type === "Father" || h.type === "Step Father") {
          addInferred(h.id, firstHopId, "Father-in-Law", h.relative);
        } else if (h.type === "Mother" || h.type === "Step Mother") {
          addInferred(h.id, firstHopId, "Mother-in-Law", h.relative);
        }
      }

      if (isFather) {
        if (h.type === "Father" || h.type === "Step Father") {
          addInferred(h.id, firstHopId, "Paternal Grandfather", h.relative);
        } else if (h.type === "Mother" || h.type === "Step Mother") {
          addInferred(h.id, firstHopId, "Paternal Grandmother", h.relative);
        }
      }

      if (isMother) {
        if (h.type === "Father" || h.type === "Step Father") {
          addInferred(h.id, firstHopId, "Maternal Grandfather", h.relative);
        } else if (h.type === "Mother" || h.type === "Step Mother") {
          addInferred(h.id, firstHopId, "Maternal Grandmother", h.relative);
        }
      }

      if (isSon) {
        if (h.type === "Son" || h.type === "Step-Son") {
          addInferred(h.id, firstHopId, "Grand Son-Son Side", h.relative);
        } else if (h.type === "Daughter" || h.type === "Step-Daughter") {
          addInferred(h.id, firstHopId, "Grand Daughter -Son Side", h.relative);
        }
      }

      if (isDaughter) {
        if (h.type === "Son" || h.type === "Step-Son") {
          addInferred(h.id, firstHopId, "Grand Son-Daughter Side", h.relative);
        } else if (h.type === "Daughter" || h.type === "Step-Daughter") {
          addInferred(h.id, firstHopId, "Grand Daughter -Daughter Side", h.relative);
        }
      }
    }
  }

  return inferred;
}

// ---------------------------------------------------------------------------
// Public resolver
// ---------------------------------------------------------------------------
export async function getRelationshipsFor(
  memberId: number,
  lang: string = "en",
): Promise<ResolvedRelationship[]> {
  // Load the subject member (needed for age comparison)
  const [subject] = await db.select().from(members).where(eq(members.id, memberId));
  if (!subject) return [];

  const rtMap = await loadRtMap();

  // ── Forward edges: our member is the stored subject (member_id = memberId) ─
  // "relatedMemberId is type of memberId"
  const fwdRows = await db
    .select({
      id: relationships.id,
      storedMemberId: relationships.memberId,
      storedRelatedMemberId: relationships.relatedMemberId,
      relationshipType: relationships.relationshipType,
      createdAt: relationships.createdAt,
      relative: members,
    })
    .from(relationships)
    .innerJoin(members, eq(members.id, relationships.relatedMemberId))
    .where(eq(relationships.memberId, memberId));

  // ── Reverse edges: our member is the stored object (related_member_id = memberId) ─
  // "memberId is type of storedMemberId" → storedMemberId is inverse(type) of memberId
  const revRows = await db
    .select({
      id: relationships.id,
      storedMemberId: relationships.memberId,
      storedRelatedMemberId: relationships.relatedMemberId,
      relationshipType: relationships.relationshipType,
      createdAt: relationships.createdAt,
      relative: members,
    })
    .from(relationships)
    .innerJoin(members, eq(members.id, relationships.memberId))
    .where(eq(relationships.relatedMemberId, memberId));

  const results: ResolvedRelationship[] = [];
  const seen = new Set<string>(); // dedup key: `relativeId:slug`

  // Process forward rows
  for (const row of fwdRows) {
    const relative = row.relative as Member;
    let slug = row.relationshipType;

    if (SIBLING_TYPES.has(slug)) {
      const rel = ageRelation(
        subject.birthOrder, subject.dateOfBirth, subject.birthYear,
        relative.birthOrder, relative.dateOfBirth, relative.birthYear,
      );
      slug = refineSiblingSlug(slug, rel, relative.gender);
    }

    const key = `${relative.id}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { labelEn, labelTa, label } = resolveLabels(slug, rtMap, lang);
    results.push({
      id: row.id,
      memberId,
      relatedMemberId: relative.id,
      relationshipType: slug,
      labelEn,
      labelTa,
      label,
      createdAt: row.createdAt,
      relatedMember: relative,
    });
  }

  // Process reverse rows — compute reciprocal label keyed on relative's gender
  for (const row of revRows) {
    const relative = row.relative as Member;
    const storedType = row.relationshipType;

    // The reciprocal of T depends on the gender of M (the relative here)
    const rtEntry = rtMap.get(storedType);
    let slug: string;
    if (rtEntry) {
      slug = (relative.gender === "Female" ? rtEntry.female : rtEntry.male) ?? staticInverse(storedType, relative.gender);
    } else {
      slug = staticInverse(storedType, relative.gender);
    }

    if (SIBLING_TYPES.has(slug) || SIBLING_TYPES.has(storedType)) {
      const rel = ageRelation(
        subject.birthOrder, subject.dateOfBirth, subject.birthYear,
        relative.birthOrder, relative.dateOfBirth, relative.birthYear,
      );
      slug = refineSiblingSlug(slug, rel, relative.gender);
    }

    const key = `${relative.id}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { labelEn, labelTa, label } = resolveLabels(slug, rtMap, lang);
    results.push({
      id: row.id,
      memberId,
      relatedMemberId: relative.id,
      relationshipType: slug,
      labelEn,
      labelTa,
      label,
      createdAt: row.createdAt,
      relatedMember: relative,
    });
  }

  // ── 2-hop inference: in-laws, grandparents, grandchildren ─────────────────
  const seenMemberIds = new Set(results.map(r => r.relatedMemberId));
  const inferred = await inferTwoHop(results, rtMap, lang, seenMemberIds);
  results.push(...inferred);

  return results;
}
