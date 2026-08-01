import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, GitBranch } from "lucide-react";

type RelationshipMapRow = {
  id: number;
  memberId: number;
  memberName: string;
  relatedMemberId: number;
  relatedMemberName: string;
  relationshipType: string;
};

export function RelationshipMapTab() {
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading, refetch } = useQuery<RelationshipMapRow[]>({
    queryKey: ["/api/admin/relationship-map"],
  });

  const filtered = rows.filter(r =>
    !search ||
    r.memberName.toLowerCase().includes(search.toLowerCase()) ||
    r.relatedMemberName.toLowerCase().includes(search.toLowerCase()) ||
    r.relationshipType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><GitBranch size={16} /> Relationship Map</CardTitle>
              <CardDescription>All family relationships recorded in the system — {filtered.length} of {rows.length}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input className="pl-8 w-52 h-8 text-sm" placeholder="Search name or type…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw size={13} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No relationships found{search ? " for this search" : ""}.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Related Member</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-gray-400">{r.id}</TableCell>
                      <TableCell className="font-medium text-sm">{r.memberName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{r.relationshipType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.relatedMemberName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
