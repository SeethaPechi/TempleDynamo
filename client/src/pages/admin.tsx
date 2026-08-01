import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Search, RefreshCw, Crown, Building2, User } from "lucide-react";
import { useLocation } from "wouter";

type UserWithRole = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  role: string;
  isActive: string;
  createdAt: string;
};

type RoleInfo = {
  name: string;
  label: string;
  description: string;
};

const ROLES: RoleInfo[] = [
  { name: "system_admin", label: "System Admin", description: "Full access including admin panel and user management" },
  { name: "temple_admin", label: "Temple Admin", description: "Can manage temple details and view temple members" },
  { name: "user",         label: "Regular User", description: "Default role for all community members" },
];

function roleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (role === "system_admin") return "destructive";
  if (role === "temple_admin") return "default";
  return "secondary";
}

function RoleIcon({ role }: { role: string }) {
  if (role === "system_admin") return <Crown size={14} className="inline mr-1 text-red-600" />;
  if (role === "temple_admin") return <Building2 size={14} className="inline mr-1 text-blue-600" />;
  return <User size={14} className="inline mr-1 text-gray-500" />;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Guard: only system_admin can access
  if (user && (user as any).role !== "system_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Shield size={48} className="mx-auto text-red-400 mb-2" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view the Admin Panel.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")} variant="outline">Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users = [], isLoading, refetch } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) =>
      apiRequest("PUT", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated", description: `User role changed to ${vars.role}` });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    system_admin: users.filter((u) => u.role === "system_admin").length,
    temple_admin: users.filter((u) => u.role === "temple_admin").length,
    user: users.filter((u) => u.role === "user").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-temple-red rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-temple-brown">Admin Panel</h1>
            <p className="text-sm text-gray-500">Manage users and roles</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {ROLES.map((r) => (
          <Card key={r.name} className="border-l-4" style={{ borderLeftColor: r.name === "system_admin" ? "#dc2626" : r.name === "temple_admin" ? "#2563eb" : "#6b7280" }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{r.label}</p>
                  <p className="text-3xl font-bold text-temple-brown">{roleCounts[r.name as keyof typeof roleCounts] ?? 0}</p>
                </div>
                <RoleIcon role={r.name} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} /> All Users
              </CardTitle>
              <CardDescription>{filtered.length} of {users.length} users shown</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-8 w-52"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500 mx-auto mb-3" />
              <p className="text-gray-500">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No users match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs text-gray-400">{u.id}</TableCell>
                      <TableCell className="font-medium">
                        {u.firstName} {u.lastName}
                        {u.email === (user as any)?.email && (
                          <span className="ml-2 text-xs text-saffron-600">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">{u.countryCode} {u.phone}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)}>
                          <RoleIcon role={u.role} />
                          {ROLES.find((r) => r.name === u.role)?.label ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(newRole) => {
                            if (newRole !== u.role) {
                              updateRoleMutation.mutate({ userId: u.id, role: newRole });
                            }
                          }}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r.name} value={r.name} className="text-xs">
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive === "true" ? "outline" : "secondary"} className="text-xs">
                          {u.isActive === "true" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Role Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLES.map((r) => (
              <div key={r.name} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <RoleIcon role={r.name} />
                <div>
                  <p className="font-semibold text-sm text-temple-brown">{r.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
