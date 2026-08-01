import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersRolesTab } from "./admin/users-roles-tab";
import { RelationshipMapTab } from "./admin/relationship-map-tab";
import { RelationshipTypesTab } from "./admin/relationship-types-tab";
import { TempleMembersTab } from "./admin/temple-members-tab";
import { TempleAdminTab } from "./admin/temple-admin-tab";
import { OverviewDocTab } from "./admin/overview-doc-tab";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-temple-red rounded-lg flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-temple-brown">Admin Panel</h1>
          <p className="text-sm text-gray-500">System administration for Tamil Kovil</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="users" className="text-xs sm:text-sm">Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="relationship-map" className="text-xs sm:text-sm">Relationship Map</TabsTrigger>
          <TabsTrigger value="relationship" className="text-xs sm:text-sm">Relationship</TabsTrigger>
          <TabsTrigger value="temple-members" className="text-xs sm:text-sm">Temple Members</TabsTrigger>
          <TabsTrigger value="temple-admin" className="text-xs sm:text-sm">Temple Admin</TabsTrigger>
          <TabsTrigger value="overview-doc" className="text-xs sm:text-sm">App Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersRolesTab />
        </TabsContent>

        <TabsContent value="relationship-map">
          <RelationshipMapTab />
        </TabsContent>

        <TabsContent value="relationship">
          <RelationshipTypesTab />
        </TabsContent>

        <TabsContent value="temple-members">
          <TempleMembersTab />
        </TabsContent>

        <TabsContent value="temple-admin">
          <TempleAdminTab />
        </TabsContent>

        <TabsContent value="overview-doc">
          <OverviewDocTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
