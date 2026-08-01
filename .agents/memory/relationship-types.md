---
name: Relationship Types Lookup Table
description: relationship_types table and its relationship to the relationships table
---

## Design
- `relationship_types` table: id, name (slug), label_en, label_ta, category, created_at
- `relationships.relationship_type` is a plain TEXT column — NOT a FK to relationship_types
- 23 types seeded (father, mother, son, daughter, husband, wife, brother, sister + extended + in-law)
- Categories: `immediate`, `extended`, `in-law`

**Why not FK:** The relationship_types table was added after existing relationship data was already present. Making relationship_type a FK would require migrating all existing free-text values, which is a data migration task not yet done.

**How to apply:** When adding relationship records, use slugs from relationship_types.name as the value for relationship_type. The lookup table is managed via admin > Relationship tab. Existing records keep their free-text value even if a type is deleted.

## Admin management
- Admin > Relationship tab: full CRUD for relationship_types
- Uses GET/POST/PUT/DELETE /api/admin/relationship-types (system_admin only)
- Label shown in family tree UI uses translateGroupName() which maps group names, not individual type slugs
