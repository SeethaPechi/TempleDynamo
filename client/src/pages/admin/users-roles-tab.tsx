import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, RefreshCw, Crown, Building2, User } from "lucide-react";

type UserWithRole = {
  id: number; firstName: string; lastName: string; email: string;
  phone: string; countryCode: string; role: string; isActive: string; createdAt: string;
};

export const ROLES = [
  { name: "system_admin", label: "System Admin", description: "Full access including admin panel and user management" },
  { name: "temple_admin", label: "Temple Admin", description: "Can manage temple details and view temple members" },
  { name: "user",         label: "Regular User", description: "Default role for all community members" },
];

export function roleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (role === "system_admin") return "destructive";
  if (role === "temple_admin") return "default";
  return "secondary";
}

export function RoleIcon({ role }: { role: string }) {
  if (role === "system_admin") return <Crown size={14} className="inline mr-1 text-red-600" />;
  if (role === "temple_admin") return <Building2 size={14} className="inline mr-1 text-blue-600" />;
  return <User size={14} className="inline mr-1 text-gray-500" />;
}

export function UsersRolesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users = [], isLoading, refetch } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) =>
      apiRequest("PUT", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated", description: `Role changed to ${ROLES.find(r => r.name === vars.role)?.label}` });
    },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = {
    system_admin: users.filter(u => u.role === "system_admin").length,
    temple_admin: users.filter(u => u.role === "temple_admin").length,
    user: users.filter(u => u.role === "user").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map(r => (
          <Card key={r.name} className="border-l-4" style={{ borderLeftColor: r.name === "system_admin" ? "#dc2626" : r.name === "temple_admin" ? "#2563eb" : "#6b7280" }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{r.label}</p>
                  <p className="text-3xl font-bold text-temple-brown">{roleCounts[r.name as keyof typeof roleCounts]}</p>
                </div>
                <RoleIcon role={r.name} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Users size={16} /> All Users</CardTitle>
              <CardDescription>{filtered.length} of {users.length} users</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input className="pl-8 w-48 h-8 text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw size={13} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Change Role</TableHead>
                    <TableHead>Status</TableHead><TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs text-gray-400">{u.id}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {u.firstName} {u.lastName}
                        {u.email === (user as any)?.email && <span className="ml-1 text-xs text-saffron-500">(you)</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{u.email}</TableCell>
                      <TableCell className="text-xs text-gray-600">{u.countryCode} {u.phone}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)} className="text-xs">
                          <RoleIcon role={u.role} />
                          {ROLES.find(r => r.name === u.role)?.label ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={role => role !== u.role && updateRoleMutation.mutate({ userId: u.id, role })} disabled={updateRoleMutation.isPending}>
                          <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROLES.map(r => <SelectItem key={r.name} value={r.name} className="text-xs">{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive === "true" ? "outline" : "secondary"} className="text-xs">
                          {u.isActive === "true" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role legend */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Role Definitions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROLES.map(r => (
              <div key={r.name} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                <RoleIcon role={r.name} />
                <div><p className="font-semibold text-sm text-temple-brown">{r.label}</p><p className="text-xs text-gray-500 mt-0.5">{r.description}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
