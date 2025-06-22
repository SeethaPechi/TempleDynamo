import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, ArrowLeft, MapPin, Phone, Mail, Heart, Edit, Trash2, Save, Plus, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Member, Relationship, InsertMember } from "@shared/schema";
import { insertMemberSchema } from "@shared/schema";

const countries = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

const statesByCountry: Record<string, Array<{ value: string; label: string }>> = {
  US: [
    { value: "TX", label: "Texas" },
    { value: "CA", label: "California" },
    { value: "NY", label: "New York" },
    { value: "FL", label: "Florida" },
  ],
  IN: [
    { value: "TN", label: "Tamil Nadu" },
    { value: "KA", label: "Karnataka" },
    { value: "MH", label: "Maharashtra" },
    { value: "DL", label: "Delhi" },
  ],
};

export default function MemberDetails() {
  const [, params] = useRoute("/member/:id");
  const memberId = params?.id ? parseInt(params.id) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBirthCountry, setSelectedBirthCountry] = useState("");
  const [selectedCurrentCountry, setSelectedCurrentCountry] = useState("");
  const [isRelativesModalOpen, setIsRelativesModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelationshipType, setSelectedRelationshipType] = useState("");
  const [selectedRelatedMember, setSelectedRelatedMember] = useState<Member | null>(null);
  const queryClient = useQueryClient();

  const relationshipTypes = [
    "Father", "Mother", "Spouse", "Child", "Brother", "Sister", 
    "Uncle", "Aunt", "Cousin", "Grandfather", "Grandmother", "Other"
  ];

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: [`/api/members/${memberId}`],
    enabled: !!memberId,
  });

  const { data: relationships = [] } = useQuery({
    queryKey: [`/api/relationships/${memberId}`],
    enabled: !!memberId,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  // Filter members for search
  const searchResults = (allMembers as Member[]).filter((member: Member) =>
    member.id !== memberId && // Don't include the current member
    (member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     member.phone.includes(searchTerm))
  ).slice(0, 10);

  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      birthCity: "",
      birthState: "",
      birthCountry: "",
      currentCity: "",
      currentState: "",
      currentCountry: "",
      fatherName: "",
      motherName: "",
      spouseName: "",
      maritalStatus: "Single",
    },
  });

  // Update form when member data loads
  React.useEffect(() => {
    if (member) {
      const memberData = member as Member;
      form.reset({
        fullName: memberData.fullName,
        phone: memberData.phone,
        email: memberData.email,
        birthCity: memberData.birthCity,
        birthState: memberData.birthState,
        birthCountry: memberData.birthCountry,
        currentCity: memberData.currentCity,
        currentState: memberData.currentState,
        currentCountry: memberData.currentCountry,
        fatherName: memberData.fatherName,
        motherName: memberData.motherName,
        spouseName: memberData.spouseName || "",
        maritalStatus: memberData.maritalStatus,
      });
      setSelectedBirthCountry(memberData.birthCountry);
      setSelectedCurrentCountry(memberData.currentCountry);
    }
  }, [member, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      return apiRequest(`/api/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/members/${memberId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/members/${memberId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      window.location.href = "/members";
    },
  });

  const onSubmit = (data: InsertMember) => {
    updateMutation.mutate(data);
  };

  const addRelationshipMutation = useMutation({
    mutationFn: async (relationshipData: any) => {
      return apiRequest("/api/relationships", {
        method: "POST",
        body: JSON.stringify(relationshipData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${memberId}`] });
      setSelectedRelatedMember(null);
      setSelectedRelationshipType("");
      setSearchTerm("");
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: number) => {
      return apiRequest(`/api/relationships/${relationshipId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${memberId}`] });
    },
  });

  const handleAddRelationship = () => {
    if (selectedRelatedMember && selectedRelationshipType) {
      addRelationshipMutation.mutate({
        memberId: memberId,
        relatedMemberId: selectedRelatedMember.id,
        relationshipType: selectedRelationshipType,
      });
    }
  };

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-temple-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-saffron-500 mx-auto"></div>
          <p className="mt-4 text-temple-brown">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-temple-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-temple-brown mb-4">Member Not Found</h1>
          <p className="text-gray-600 mb-4">The member you're looking for doesn't exist.</p>
          <Button onClick={() => window.location.href = "/members"} className="bg-saffron-500 hover:bg-saffron-600">
            <ArrowLeft className="mr-2" size={16} />
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-light">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/members"}
                className="mr-4 text-temple-brown hover:text-saffron-600"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Members
              </Button>
              <h1 className="text-3xl font-bold text-temple-brown">Member Details</h1>
            </div>
          </div>

          {/* Member Profile Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-saffron-500 to-gold-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{(member as Member).fullName}</h2>
                  <p className="text-saffron-100">Member #{(member as Member).id}</p>
                </div>
                <div className="flex space-x-3">
                  <Dialog open={isRelativesModalOpen} onOpenChange={setIsRelativesModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">
                        <Users className="mr-2" size={16} />
                        Manage Relatives
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-temple-brown">Manage Family Relationships</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Add New Relationship */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-temple-brown mb-4">Add New Relationship</h3>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Search Member</label>
                              <div className="relative">
                                <Input
                                  placeholder="Search by name, email, or phone..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute right-3 top-3 text-gray-400" size={16} />
                              </div>
                              {searchTerm && (
                                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white">
                                  {searchResults.map((member: Member) => (
                                    <button
                                      key={member.id}
                                      onClick={() => {
                                        setSelectedRelatedMember(member);
                                        setSearchTerm(member.fullName);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                                    >
                                      <div className="font-medium">{member.fullName}</div>
                                      <div className="text-sm text-gray-500">{member.email}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                              <Select value={selectedRelationshipType} onValueChange={setSelectedRelationshipType}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                  {relationshipTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <Button
                                onClick={handleAddRelationship}
                                disabled={!selectedRelatedMember || !selectedRelationshipType || addRelationshipMutation.isPending}
                                className="w-full bg-saffron-500 hover:bg-saffron-600"
                              >
                                <Plus className="mr-2" size={16} />
                                {addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Existing Relationships */}
                        <div>
                          <h3 className="font-semibold text-temple-brown mb-4">Current Family Relationships</h3>
                          {relationships && relationships.length > 0 ? (
                            <div className="space-y-3">
                              {relationships.map((relationship: any) => (
                                <div key={relationship.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                  <div>
                                    <p className="font-medium">{relationship.relatedMember.fullName}</p>
                                    <p className="text-sm text-gray-600">{relationship.relationshipType}</p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.location.href = `/member/${relationship.relatedMember.id}`}
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteRelationshipMutation.mutate(relationship.id)}
                                      disabled={deleteRelationshipMutation.isPending}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <Heart className="mx-auto mb-4 text-gray-400" size={48} />
                              <p className="text-gray-500">No family relationships added yet.</p>
                              <p className="text-sm text-gray-400 mt-2">Use the form above to add family connections.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">
                        <Edit className="mr-2" size={16} />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-temple-brown">Edit Member Details</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          {/* Personal Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-temple-brown border-b pb-2">Personal Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="fatherName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Father's Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="motherName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mother's Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="spouseName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Spouse Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="maritalStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Marital Status *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select marital status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Single">Single</SelectItem>
                                      <SelectItem value="Married">Married</SelectItem>
                                      <SelectItem value="Divorced">Divorced</SelectItem>
                                      <SelectItem value="Widowed">Widowed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Birth Information</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="birthCountry"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Birth Country *</FormLabel>
                                    <Select onValueChange={(value) => {
                                      field.onChange(value);
                                      setSelectedBirthCountry(value);
                                      form.setValue("birthState", "");
                                    }} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {countries.map((country) => (
                                          <SelectItem key={country.value} value={country.value}>
                                            {country.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="birthState"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Birth State *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBirthCountry || !statesByCountry[selectedBirthCountry]}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={selectedBirthCountry ? "Select State" : "Select Country first"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {selectedBirthCountry && statesByCountry[selectedBirthCountry] ? 
                                          statesByCountry[selectedBirthCountry].map((state) => (
                                            <SelectItem key={state.value} value={state.value}>
                                              {state.label}
                                            </SelectItem>
                                          )) : 
                                          <SelectItem value="none" disabled>No states available</SelectItem>
                                        }
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="birthCity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Birth City *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Current Location</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="currentCountry"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Country *</FormLabel>
                                    <Select onValueChange={(value) => {
                                      field.onChange(value);
                                      setSelectedCurrentCountry(value);
                                      form.setValue("currentState", "");
                                    }} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {countries.map((country) => (
                                          <SelectItem key={country.value} value={country.value}>
                                            {country.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="currentState"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current State *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCurrentCountry || !statesByCountry[selectedCurrentCountry]}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={selectedCurrentCountry ? "Select State" : "Select Country first"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {selectedCurrentCountry && statesByCountry[selectedCurrentCountry] ? 
                                          statesByCountry[selectedCurrentCountry].map((state) => (
                                            <SelectItem key={state.value} value={state.value}>
                                              {state.label}
                                            </SelectItem>
                                          )) : 
                                          <SelectItem value="none" disabled>No states available</SelectItem>
                                        }
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="currentCity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current City *</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-white pb-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEditModalOpen(false)}
                              className="px-6 py-2"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateMutation.isPending} 
                              className="bg-saffron-500 hover:bg-saffron-600 text-white px-6 py-2"
                            >
                              <Save className="mr-2" size={16} />
                              {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2" size={16} />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {(member as Member).fullName}? This action cannot be undone and will also remove all family relationships.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete Member"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="mr-2" size={16} />
                  {(member as Member).email}
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="mr-2" size={16} />
                  {(member as Member).phone}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2" size={16} />
                  {(member as Member).currentCity}, {(member as Member).currentState}, {(member as Member).currentCountry}
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="mr-2" size={16} />
                  Marital Status: {(member as Member).maritalStatus}
                </div>
                {(member as Member).spouseName && (
                  <div className="flex items-center text-gray-600">
                    <Heart className="mr-2" size={16} />
                    Spouse: {(member as Member).spouseName}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-temple-brown mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Birth Information</h3>
                <p className="text-gray-600">{(member as Member).birthCity}</p>
                <p className="text-gray-600">{(member as Member).birthState}, {(member as Member).birthCountry}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Current Location</h3>
                <p className="text-gray-600">{(member as Member).currentCity}</p>
                <p className="text-gray-600">{(member as Member).currentState}, {(member as Member).currentCountry}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Family Information</h3>
                <p className="text-gray-600">Father: {(member as Member).fatherName}</p>
                <p className="text-gray-600">Mother: {(member as Member).motherName}</p>
                {(member as Member).spouseName && (
                  <p className="text-gray-600">Spouse: {(member as Member).spouseName}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Family Relationships */}
          {relationships && relationships.length > 0 && (
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold text-temple-brown mb-4">Family Relationships</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relationships.map((relationship: any) => (
                  <div key={relationship.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-temple-brown">{relationship.relatedMember.fullName}</h3>
                        <p className="text-sm text-gray-600">{relationship.relationshipType}</p>
                        <p className="text-xs text-gray-500 mt-1">{relationship.relatedMember.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/member/${relationship.relatedMember.id}`}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}