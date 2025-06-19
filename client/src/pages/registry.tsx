import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, MapPin, Home, Users, Link as LinkIcon, Search, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import type { Member } from "@shared/schema";

const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  birthCity: z.string().min(1, "Birth city is required"),
  birthState: z.string().min(1, "Birth state is required"),
  birthCountry: z.string().min(1, "Birth country is required"),
  currentCity: z.string().min(1, "Current city is required"),
  currentState: z.string().min(1, "Current state is required"),
  currentCountry: z.string().min(1, "Current country is required"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  motherName: z.string().min(2, "Mother's name must be at least 2 characters"),
});

type RegistrationData = z.infer<typeof registrationSchema>;

const states = [
  { value: "AL", label: "Alabama" },
  { value: "CA", label: "California" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
];

const countries = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

const relationships = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "grandparent", label: "Grandparent" },
  { value: "grandchild", label: "Grandchild" },
  { value: "aunt", label: "Aunt" },
  { value: "uncle", label: "Uncle" },
  { value: "cousin", label: "Cousin" },
  { value: "other", label: "Other" },
];

export default function Registry() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelative, setSelectedRelative] = useState<Member | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [linkedRelatives, setLinkedRelatives] = useState<Array<{ member: Member; relationship: string }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
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
    },
  });

  // Search members for relationship linking
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/members/search", searchTerm],
    enabled: searchTerm.length > 2,
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await apiRequest("POST", "/api/members", data);
      return response.json();
    },
    onSuccess: async (newMember) => {
      // Create relationships
      for (const { member, relationship } of linkedRelatives) {
        await apiRequest("POST", "/api/relationships", {
          memberId: newMember.id,
          relatedMemberId: member.id,
          relationshipType: relationship,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setShowSuccessModal(true);
      form.reset();
      setLinkedRelatives([]);
      setSearchTerm("");
      setSelectedRelative(null);
      setSelectedRelationship("");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register member",
        variant: "destructive",
      });
    },
  });

  const handleAddRelationship = () => {
    if (selectedRelative && selectedRelationship) {
      const existingIndex = linkedRelatives.findIndex(rel => rel.member.id === selectedRelative.id);
      if (existingIndex >= 0) {
        const updated = [...linkedRelatives];
        updated[existingIndex] = { member: selectedRelative, relationship: selectedRelationship };
        setLinkedRelatives(updated);
      } else {
        setLinkedRelatives([...linkedRelatives, { member: selectedRelative, relationship: selectedRelationship }]);
      }
      setSelectedRelative(null);
      setSelectedRelationship("");
      setSearchTerm("");
    }
  };

  const handleRemoveRelationship = (memberId: number) => {
    setLinkedRelatives(linkedRelatives.filter(rel => rel.member.id !== memberId));
  };

  const onSubmit = (data: RegistrationData) => {
    registrationMutation.mutate(data);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl border border-temple-gold/20 overflow-hidden">
          <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Community Registry</h2>
            <p className="text-saffron-100">Join our temple family and connect with devotees</p>
          </div>

          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <User className="text-temple-gold mr-3" size={24} />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Birth Location */}
                <div className="border-l-4 border-temple-crimson pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <MapPin className="text-temple-crimson mr-3" size={24} />
                    Place of Birth
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="birthCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Birth city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
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
                      name="birthCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </div>
                </div>

                {/* Current Residence */}
                <div className="border-l-4 border-saffron-500 pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <Home className="text-saffron-500 mr-3" size={24} />
                    Current Place of Stay
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="currentCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Current city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
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
                      name="currentCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </div>
                </div>

                {/* Parent Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <Users className="text-temple-gold mr-3" size={24} />
                    Parent Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Father's full name" {...field} />
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
                            <Input placeholder="Mother's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Family Relationships */}
                <div className="border-l-4 border-temple-crimson pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <LinkIcon className="text-temple-crimson mr-3" size={24} />
                    Link Family Member
                  </h3>
                  <Card className="bg-saffron-50 border border-saffron-200">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">Search Relative</Label>
                          <div className="relative">
                            <Input
                              placeholder="Type name to search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          </div>
                          {searchResults.length > 0 && searchTerm.length > 2 && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {searchResults.map((member: Member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRelative(member);
                                    setSearchTerm(member.fullName);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium">{member.fullName}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">Relationship</Label>
                          <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {relationships.map((rel) => (
                                <SelectItem key={rel.value} value={rel.value}>
                                  {rel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={handleAddRelationship}
                          disabled={!selectedRelative || !selectedRelationship}
                          className="bg-saffron-500 hover:bg-saffron-600"
                        >
                          Add Relationship
                        </Button>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-700 mb-3">Linked Relatives:</h4>
                        <div className="space-y-2">
                          {linkedRelatives.length === 0 ? (
                            <div className="flex items-center justify-between bg-white p-3 rounded border">
                              <span className="text-gray-700">No relatives linked yet</span>
                            </div>
                          ) : (
                            linkedRelatives.map((rel, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                                <div>
                                  <span className="font-medium">{rel.member.fullName}</span>
                                  <span className="text-gray-500 ml-2">({rel.relationship})</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRelationship(rel.member.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={16} />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <Button
                    type="submit"
                    disabled={registrationMutation.isPending}
                    className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-yellow-500 text-white font-semibold px-12 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    {registrationMutation.isPending ? (
                      "Registering..."
                    ) : (
                      <>
                        <User className="mr-2" size={20} />
                        Register Member
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <DialogTitle className="text-xl font-semibold text-temple-brown">
              Registration Successful!
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Welcome to our temple community. Your profile has been created successfully.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={handleCloseModal}
            className="bg-saffron-500 hover:bg-saffron-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
