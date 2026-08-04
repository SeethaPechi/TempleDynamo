import { useState } from "react";
import { withHonorific } from "@/lib/honorific";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Users2 } from "lucide-react";

type MemberWithTemple = {
  id: number; fullName: string; phone: string | null; email: string | null;
  birthCity: string; birthState: string; birthCountry: string;
  currentCity: string; currentState: string; currentCountry: string;
  fatherName: string; motherName: string; spouseName: string | null;
  maritalStatus: string; templeId: number | null; templeName: string | null;
};

export function TempleMembersTab() {
  const [search, setSearch] = useState("");
  const [templeFilter, setTempleFilter] = useState("all");

  const { data: members = [], isLoading, refetch } = useQuery<MemberWithTemple[]>({
    queryKey: ["/api/admin/temple-members"],
  });

  const temples = Array.from(new Set(members.filter(m => m.templeName).map(m => m.templeName!))).sort();

  const filtered = members.filter(m => {
    const matchSearch = !search || [m.fullName, m.email, m.phone, m.currentCity].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchTemple = templeFilter === "all" || (templeFilter === "__none__" ? !m.templeName : m.templeName === templeFilter);
    return matchSearch && matchTemple;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Users2 size={16} /> Temple Members</CardTitle>
              <CardDescription>All members with full details and temple affiliation — {filtered.length} of {members.length}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input className="pl-8 w-48 h-8 text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={templeFilter} onValueChange={setTempleFilter}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All temples" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All temples</SelectItem>
                  <SelectItem value="__none__">No temple</SelectItem>
                  {temples.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw size={13} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Birth City</TableHead>
                    <TableHead>Birth State</TableHead>
                    <TableHead>Birth Country</TableHead>
                    <TableHead>Current City</TableHead>
                    <TableHead>Current State</TableHead>
                    <TableHead>Current Country</TableHead>
                    <TableHead>Father</TableHead>
                    <TableHead>Mother</TableHead>
                    <TableHead>Spouse</TableHead>
                    <TableHead>Marital Status</TableHead>
                    <TableHead>Temple</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm whitespace-nowrap">{withHonorific(m.fullName, m.gender, m.maritalStatus)}</TableCell>
                      <TableCell className="text-xs text-gray-600 whitespace-nowrap">{m.phone ?? "—"}</TableCell>
                      <TableCell className="text-xs text-gray-600 whitespace-nowrap">{m.email ?? "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.birthCity}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.birthState}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.birthCountry}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.currentCity}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.currentState}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.currentCountry}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.fatherName}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.motherName}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{m.spouseName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{m.maritalStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {m.templeName
                          ? <Badge variant="secondary" className="text-xs">{m.templeName}</Badge>
                          : <span className="text-gray-300">—</span>}
                      </TableCell>
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
