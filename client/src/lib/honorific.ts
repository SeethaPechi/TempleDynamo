/**
 * Returns the appropriate honorific prefix based on gender and marital status.
 *  - Male              → "Mr."
 *  - Female + Single   → "Miss"
 *  - Female + other    → "Mrs."  (Married / Widowed / Divorced / unknown)
 *  - No gender         → ""
 */
export function getHonorific(
  gender: string | null | undefined,
  maritalStatus: string | null | undefined,
): string {
  if (gender === "Male") return "Mr.";
  if (gender === "Female") {
    return maritalStatus === "Single" ? "Miss" : "Mrs.";
  }
  return "";
}

/**
 * Prepends the correct honorific to a member's full name.
 * Returns the plain name when gender is unknown.
 */
export function withHonorific(
  fullName: string,
  gender: string | null | undefined,
  maritalStatus: string | null | undefined,
): string {
  const prefix = getHonorific(gender, maritalStatus);
  return prefix ? `${prefix} ${fullName}` : fullName;
}
