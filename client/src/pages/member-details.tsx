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
import { useToast } from "@/hooks/use-toast";
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
  const [isAddRelativeOpen, setIsAddRelativeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelative, setSelectedRelative] = useState<Member | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [selectedBirthCountry, setSelectedBirthCountry] = useState("");
  const [selectedCurrentCountry, setSelectedCurrentCountry] = useState("");
  const [isRelativesModalOpen, setIsRelativesModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<any>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState("");
  const [selectedRelatedMember, setSelectedRelatedMember] = useState<Member | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      const response = await apiRequest("PATCH", `/api/members/${memberId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/members/${memberId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      console.log("Auto-save successful");
      // Clear the success indicator after 2 seconds
      setTimeout(() => {
        // This will trigger a re-render to hide the success message
      }, 2000);
    },
    onError: (error) => {
      console.error("Auto-save failed:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/members/${memberId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      window.location.href = "/members";
    },
  });





  const onSubmit = (data: InsertMember) => {
    updateMutation.mutate(data);
  };

  // Auto-save function for individual fields
  const autoSave = React.useCallback((fieldName: keyof InsertMember, value: any) => {
    if (!member || updateMutation.isPending) return;
    
    const currentData = form.getValues();
    const updatedData = { ...currentData, [fieldName]: value };
    
    // Only save if the value has actually changed
    const memberData = member as Member;
    const currentValue = memberData[fieldName as keyof Member];
    
    if (currentValue !== value && value !== undefined && value !== null && value.toString().trim() !== "") {
      console.log(`Auto-saving ${fieldName}:`, value);
      updateMutation.mutate(updatedData);
    }
  }, [member, form, updateMutation]);

  const addRelationshipMutation = useMutation({
    mutationFn: async (data: { memberId: number; relatedMemberId: number; relationshipType: string }) => {
      return apiRequest("POST", "/api/relationships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${memberId}`] });
      setIsAddRelativeOpen(false);
      setSelectedRelative(null);
      setSelectedRelationship("");
      setSearchTerm("");
      toast({
        title: "Relationship Added",
        description: "Family relationship has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add relationship. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: number) => {
      return apiRequest("DELETE", `/api/relationships/${relationshipId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${memberId}`] });
      toast({
        title: "Relationship Removed",
        description: "Family relationship has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove relationship. Please try again.",
        variant: "destructive",
      });
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => window.location.href = "/members"}
                className="mr-3 sm:mr-4 text-temple-brown hover:text-saffron-600 p-2 sm:px-3"
              >
                <ArrowLeft className="mr-1 sm:mr-2" size={16} />
                <span className="hidden sm:inline">Back to Members</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-temple-brown">Member Details</h1>
            </div>
          </div>

          {/* Member Profile Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-saffron-500 to-gold-500 p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 break-words">{(member as Member).fullName}</h2>
                  <p className="text-saffron-100">Member #{(member as Member).id}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-temple-gold hover:bg-temple-gold/90 text-white border-temple-gold"
                    onClick={() => setIsAddRelativeOpen(true)}
                  >
                    <Plus className="mr-1 sm:mr-2" size={16} />
                    <span className="hidden sm:inline">Link Family Member</span>
                    <span className="sm:hidden">Link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-saffron-500 hover:bg-saffron-600 text-white border-saffron-500 w-full sm:w-auto"
                    onClick={() => setIsAddRelativeOpen(true)}
                  >
                    <Plus className="mr-1 sm:mr-2" size={16} />
                    <span className="hidden sm:inline">Link Family Member</span>
                    <span className="sm:hidden">Link</span>
                  </Button>
                  <Dialog open={isRelativesModalOpen} onOpenChange={setIsRelativesModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        <Users className="mr-1 sm:mr-2" size={16} />
                        <span className="hidden sm:inline">Manage Relatives</span>
                        <span className="sm:hidden">Relatives</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-4xl h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0">
                      <div className="sticky top-0 bg-white border-b p-4 sm:p-6 z-10">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl font-bold text-temple-brown">Manage Family Relationships</DialogTitle>
                        </DialogHeader>
                      </div>
                      
                      <div className="p-4 sm:p-6 space-y-6">
                        {/* Add New Relationship */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-base sm:text-lg font-semibold text-temple-brown mb-4">Add New Relationship</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Search Member</label>
                              <div className="relative">
                                <Input
                                  placeholder="Search by name, email, or phone..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="h-10 sm:h-11 pr-10"
                                />
                                <Search className="absolute right-3 top-2.5 sm:top-3 text-gray-400" size={16} />
                              </div>
                              {searchTerm && (
                                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md bg-white shadow-lg">
                                  {searchResults.map((member: Member) => (
                                    <button
                                      key={member.id}
                                      onClick={() => {
                                        setSelectedRelatedMember(member);
                                        setSearchTerm(member.fullName);
                                      }}
                                      className="w-full text-left px-3 py-3 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                                    >
                                      <div className="font-medium text-sm sm:text-base break-words">{member.fullName}</div>
                                      <div className="text-xs sm:text-sm text-gray-500 break-all">{member.email}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Type</label>
                                <Select value={selectedRelationshipType} onValueChange={setSelectedRelationshipType}>
                                  <SelectTrigger className="h-10 sm:h-11">
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
                                  className="w-full bg-saffron-500 hover:bg-saffron-600 h-10 sm:h-11"
                                >
                                  <Plus className="mr-1 sm:mr-2" size={16} />
                                  <span className="hidden sm:inline">{addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}</span>
                                  <span className="sm:hidden">{addRelationshipMutation.isPending ? "Adding..." : "Add"}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Existing Relationships */}
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-temple-brown mb-4">Current Family Relationships</h3>
                          {relationships && relationships.length > 0 ? (
                            <div className="space-y-3">
                              {relationships.map((relationship: any) => (
                                <div key={relationship.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white border rounded-lg gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm sm:text-base break-words">{relationship.relatedMember.fullName}</p>
                                    <p className="text-xs sm:text-sm text-gray-600">{relationship.relationshipType}</p>
                                    <p className="text-xs text-gray-500 break-all">{relationship.relatedMember.email}</p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.location.href = `/member/${relationship.relatedMember.id}`}
                                      className="w-full sm:w-auto h-9"
                                    >
                                      <span className="hidden sm:inline">View Details</span>
                                      <span className="sm:hidden">View</span>
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteRelationshipMutation.mutate(relationship.id)}
                                      disabled={deleteRelationshipMutation.isPending}
                                      className="w-full sm:w-auto h-9"
                                    >
                                      {deleteRelationshipMutation.isPending ? "Removing..." : "Remove"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                              <Heart className="mx-auto mb-4 text-gray-400" size={40} />
                              <p className="text-gray-500 text-sm sm:text-base">No family relationships added yet.</p>
                              <p className="text-xs sm:text-sm text-gray-400 mt-2">Use the form above to add family connections.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        <Edit className="mr-1 sm:mr-2" size={16} />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-4xl h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0">
                      <div className="sticky top-0 bg-white border-b p-4 sm:p-6 z-10">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl font-bold text-temple-brown">
                            Edit Member Details
                            {updateMutation.isPending && (
                              <span className="text-sm font-normal text-saffron-600 ml-2">• Auto-saving...</span>
                            )}
                            {updateMutation.isSuccess && !updateMutation.isPending && (
                              <span className="text-sm font-normal text-green-600 ml-2">• Saved</span>
                            )}
                          </DialogTitle>
                          <p className="text-xs text-gray-500 mt-1">Changes are saved automatically when you move to the next field</p>
                        </DialogHeader>
                      </div>
                      
                      <div className="p-4 sm:p-6">
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                              <h3 className="text-base sm:text-lg font-semibold text-temple-brown border-b pb-2">Personal Information</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Full Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('fullName', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Email *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="email" 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('email', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium">Phone Number *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        className="h-10 sm:h-11" 
                                        onBlur={(e) => {
                                          field.onBlur();
                                          autoSave('phone', e.target.value);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="fatherName"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Father's Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('fatherName', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="motherName"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Mother's Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('motherName', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="spouseName"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2 sm:col-span-2 lg:col-span-1">
                                      <FormLabel className="text-sm font-medium">Spouse Name</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('spouseName', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="maritalStatus"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium">Marital Status *</FormLabel>
                                    <Select 
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        autoSave('maritalStatus', value);
                                      }} 
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-10 sm:h-11">
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
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Birth Information */}
                            <div className="space-y-4">
                              <h3 className="text-base sm:text-lg font-medium text-temple-brown border-b pb-2">Birth Information</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="birthCountry"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Birth Country *</FormLabel>
                                      <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedBirthCountry(value);
                                        form.setValue("birthState", "");
                                        autoSave('birthCountry', value);
                                      }} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 sm:h-11">
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
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="birthState"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Birth State *</FormLabel>
                                      <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        autoSave('birthState', value);
                                      }} defaultValue={field.value} disabled={!selectedBirthCountry || !statesByCountry[selectedBirthCountry]}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 sm:h-11">
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
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="birthCity"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2 sm:col-span-2 lg:col-span-1">
                                      <FormLabel className="text-sm font-medium">Birth City *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('birthCity', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Current Location */}
                            <div className="space-y-4">
                              <h3 className="text-base sm:text-lg font-medium text-temple-brown border-b pb-2">Current Location</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="currentCountry"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Current Country *</FormLabel>
                                      <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedCurrentCountry(value);
                                        form.setValue("currentState", "");
                                        autoSave('currentCountry', value);
                                      }} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 sm:h-11">
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
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="currentState"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-medium">Current State *</FormLabel>
                                      <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        autoSave('currentState', value);
                                      }} defaultValue={field.value} disabled={!selectedCurrentCountry || !statesByCountry[selectedCurrentCountry]}>
                                        <FormControl>
                                          <SelectTrigger className="h-10 sm:h-11">
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
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="currentCity"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2 sm:col-span-2 lg:col-span-1">
                                      <FormLabel className="text-sm font-medium">Current City *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-10 sm:h-11" 
                                          onBlur={(e) => {
                                            field.onBlur();
                                            autoSave('currentCity', e.target.value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </form>
                        </Form>
                      </div>

                      {/* Sticky Close Button */}
                      <div className="sticky bottom-0 bg-white border-t p-4 sm:p-6">
                        <div className="flex justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditModalOpen(false)}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 h-10 sm:h-11"
                          >
                            Close
                          </Button>
                        </div>
                        {updateMutation.isPending && (
                          <div className="text-center mt-2">
                            <p className="text-sm text-saffron-600">Auto-saving changes...</p>
                          </div>
                        )}
                        {updateMutation.isSuccess && !updateMutation.isPending && (
                          <div className="text-center mt-2">
                            <p className="text-sm text-green-600">Changes saved successfully</p>
                          </div>
                        )}
                        {updateMutation.isError && (
                          <div className="text-center mt-2">
                            <p className="text-sm text-red-600">Failed to save changes. Please try again.</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                        <Trash2 className="mr-1 sm:mr-2" size={16} />
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
              <div className="space-y-2 text-white/90">
                <div className="flex items-start">
                  <Mail className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span className="break-all">{(member as Member).email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 flex-shrink-0" size={16} />
                  <span>{(member as Member).phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span className="break-words">{(member as Member).currentCity}, {(member as Member).currentState}, {(member as Member).currentCountry}</span>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 flex-shrink-0" size={16} />
                  <span>Marital Status: {(member as Member).maritalStatus}</span>
                </div>
                {(member as Member).spouseName && (
                  <div className="flex items-center">
                    <Heart className="mr-2 flex-shrink-0" size={16} />
                    <span className="break-words">Spouse: {(member as Member).spouseName}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-temple-brown mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Birth Information</h3>
                <p className="text-gray-600 text-sm sm:text-base break-words">{(member as Member).birthCity}</p>
                <p className="text-gray-600 text-sm sm:text-base break-words">{(member as Member).birthState}, {(member as Member).birthCountry}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Current Location</h3>
                <p className="text-gray-600 text-sm sm:text-base break-words">{(member as Member).currentCity}</p>
                <p className="text-gray-600 text-sm sm:text-base break-words">{(member as Member).currentState}, {(member as Member).currentCountry}</p>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <h3 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Family Information</h3>
                <p className="text-gray-600 text-sm sm:text-base break-words">Father: {(member as Member).fatherName}</p>
                <p className="text-gray-600 text-sm sm:text-base break-words">Mother: {(member as Member).motherName}</p>
                {(member as Member).spouseName && (
                  <p className="text-gray-600 text-sm sm:text-base break-words">Spouse: {(member as Member).spouseName}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Family Relationships */}
          <Card className="p-4 sm:p-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-temple-brown">Family Relationships</h2>
              <Button
                variant="outline"
                size="sm"
                className="bg-temple-gold hover:bg-temple-gold/90 text-white border-temple-gold w-full sm:w-auto"
                onClick={() => setIsAddRelativeOpen(true)}
              >
                <Plus className="mr-1 sm:mr-2" size={16} />
                <span className="hidden sm:inline">Add Relative</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
            {relationships && relationships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.map((relationship: any) => (
                  <div key={relationship.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-temple-brown text-sm sm:text-base break-words">{relationship.relatedMember.fullName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{relationship.relationshipType}</p>
                        <p className="text-xs text-gray-500 mt-1 break-all">{relationship.relatedMember.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/member/${relationship.relatedMember.id}`}
                          className="w-full sm:w-auto sm:flex-shrink-0"
                        >
                          <span className="hidden sm:inline">View Profile</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove ${relationship.relatedMember.fullName} from family relationships?`)) {
                              deleteRelationshipMutation.mutate(relationship.id);
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm">No family relationships added yet</p>
                <p className="text-xs mt-1">Click "Add Relative" to link family members</p>
              </div>
            )}
          </Card>

        {/* Add Relative Dialog */}
        <Dialog open={isAddRelativeOpen} onOpenChange={setIsAddRelativeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Link Family Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search for Family Member</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm.length > 2 && searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {searchResults.filter(m => m.id !== parseInt(memberId as string)).map((member: Member) => (
                      <div
                        key={member.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => {
                          setSelectedRelative(member);
                          setSearchTerm("");
                        }}
                      >
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRelative && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">Selected: {selectedRelative.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedRelative.email}</p>
                </div>
              )}

              <div className="space-y-4">
                <Select 
                  value={selectedRelationship} 
                  onValueChange={(value) => {
                    setSelectedRelationship(value);
                    // Auto-save when relationship is selected and member is already chosen
                    if (selectedRelative && value) {
                      addRelationshipMutation.mutate({
                        memberId: parseInt(memberId as string),
                        relatedMemberId: selectedRelative.id,
                        relationshipType: value
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedRelative && selectedRelationship && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    Will link {selectedRelative.fullName} as {selectedRelationship}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Son">Son</SelectItem>
                    <SelectItem value="Daughter">Daughter</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                    <SelectItem value="Husband">Husband</SelectItem>
                    <SelectItem value="Wife">Wife</SelectItem>
                    <SelectItem value="Grandfather">Grandfather</SelectItem>
                    <SelectItem value="Grandmother">Grandmother</SelectItem>
                    <SelectItem value="Uncle">Uncle</SelectItem>
                    <SelectItem value="Aunt">Aunt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddRelativeOpen(false);
                    setSelectedRelative(null);
                    setSelectedRelationship("");
                    setSearchTerm("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedRelative && selectedRelationship && memberId) {
                      addRelationshipMutation.mutate({
                        memberId: parseInt(memberId as string),
                        relatedMemberId: selectedRelative.id,
                        relationshipType: selectedRelationship,
                      });
                    }
                  }}
                  disabled={!selectedRelative || !selectedRelationship || addRelationshipMutation.isPending}
                  className="flex-1 bg-saffron-500 hover:bg-saffron-600"
                >
                  {addRelationshipMutation.isPending ? "Adding..." : "Add Relationship"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}