import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Building2, UserCheck } from "lucide-react";

type TempleWithAdmin = {
  id: number; templeName: string; deity: string | null; nearestCity: string; state: string; country: string;
  templeAdminId: number | null;
  adminUser: { id: number; firstName: string; lastName: string; email: string } | null;
};

type TempleAdminUser = {
  id: number; firstName: string; lastName: string; email: string; role: string;
};

export function TempleAdminTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: temples = [], isLoading: templesLoading, refetch } = useQuery<TempleWithAdmin[]>({
    queryKey: ["/api/admin/temple-admins"],
  });

  const { data: allUsers = [] } = useQuery<TempleAdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  // Only show users with temple_admin role in the dropdown
  const templeAdmins = allUsers.filter(u => u.role === "temple_admin");

  const updateMutation = useMutation({
    mutationFn: async ({ templeId, adminUserId }: { templeId: number; adminUserId: number | null }) =>
      apiRequest("PUT", `/api/admin/temple-admins/${templeId}`, { adminUserId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/temple-admins"] });
      const admin = templeAdmins.find(u => u.id === vars.adminUserId);
      toast({
        title: "Temple admin updated",
        description: admin ? `Assigned to ${admin.firstName} ${admin.lastName}` : "Admin cleared",
      });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {templeAdmins.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>No Temple Admin users found.</strong> Go to the <em>Users &amp; Roles</em> tab and assign the <em>Temple Admin</em> role to one or more users first, then return here to assign them to temples.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Building2 size={16} /> Temple Admin Assignments</CardTitle>
              <CardDescription>
                Assign a Temple Admin user to manage each temple.
                Only users with the <Badge variant="default" className="text-xs mx-1">Temple Admin</Badge> role appear in the dropdown.
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw size={13} /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {templesLoading ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" /></div>
          ) : temples.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No temples registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temple Name</TableHead>
                    <TableHead>Deity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Current Admin</TableHead>
                    <TableHead>Assign Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {temples.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.templeName}</TableCell>
                      <TableCell className="text-xs text-gray-500">{t.deity ?? "—"}</TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{t.nearestCity}, {t.state}, {t.country}</TableCell>
                      <TableCell>
                        {t.adminUser ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={13} className="text-green-600" />
                            <span className="text-xs font-medium">{t.adminUser.firstName} {t.adminUser.lastName}</span>
                            <span className="text-xs text-gray-400">({t.adminUser.email})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No admin assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={t.templeAdminId?.toString() ?? "__none__"}
                          onValueChange={val => {
                            const adminUserId = val === "__none__" ? null : parseInt(val);
                            updateMutation.mutate({ templeId: t.id, adminUserId });
                          }}
                          disabled={updateMutation.isPending}
                        >
                          <SelectTrigger className="w-48 h-8 text-xs">
                            <SelectValue placeholder="Select admin…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs text-gray-400 italic">— No admin —</SelectItem>
                            {templeAdmins.map(u => (
                              <SelectItem key={u.id} value={u.id.toString()} className="text-xs">
                                {u.firstName} {u.lastName} ({u.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
