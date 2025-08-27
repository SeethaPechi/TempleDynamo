import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Heart,
  Calendar,
  HandHeart,
  Building,
  MapPin,
  Edit,
  Phone,
  Mail,
  Eye,
  UserPlus,
  LogIn,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, ChangeEvent } from "react";
import type { Temple, Member } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { MemberListModal } from "@/components/member-list-modal";
import { TemplePhotoCarousel } from "@/components/temple-photo-carousel";
import { TempleSpecificPhotoCarousel } from "@/components/temple-specific-photo-carousel";

const templeEditSchema = z.object({
  templeName: z.string().min(2, "Temple name must be at least 2 characters"),
  deity: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  nearestCity: z.string().min(1, "Nearest city is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  establishedYear: z.number().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  templeImage: z.string().optional(),
});

type TempleEditData = z.infer<typeof templeEditSchema>;

export default function Home() {
  const { t } = useTranslation();
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [memberListData, setMemberListData] = useState<{
    members: Member[];
    title: string;
    description?: string;
  }>({ members: [], title: "", description: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: temples = [] } = useQuery({
    queryKey: ["/api/temples"],
  });

  // Calculate temple-specific statistics
  const getTempleStatistics = () => {
    if (!selectedTemple) {
      // Show all members when no temple is selected
      const totalMembers = (members as any[]).length;
      return {
        totalMembers,
        totalFamilies: Math.ceil(totalMembers / 3.6),
        annualEvents: 48,
        volunteers: Math.ceil(totalMembers * 0.125),
      };
    } else {
      // Show only members with selected temple as Primary Temple
      const templeMembers = (members as any[]).filter(
        (member: any) => member.templeId === selectedTemple.id,
      );
      const templeMemberCount = templeMembers.length;
      return {
        totalMembers: templeMemberCount,
        totalFamilies: Math.ceil(templeMemberCount / 3.6),
        annualEvents: 48,
        volunteers: Math.ceil(templeMemberCount * 0.125),
      };
    }
  };

  const { totalMembers, totalFamilies, annualEvents, volunteers } =
    getTempleStatistics();

  // Get filtered members based on current selection
  const getFilteredMembers = () => {
    if (!selectedTemple) {
      return members as Member[];
    } else {
      return (members as Member[]).filter(
        (member) => member.templeId === selectedTemple.id,
      );
    }
  };

  // Handler functions for clickable counters
  const showAllMembers = () => {
    const filteredMembers = getFilteredMembers();
    setMemberListData({
      members: filteredMembers,
      title: selectedTemple
        ? `${selectedTemple.templeName} - All Members`
        : "All Registered Members",
      description: `Complete list of ${filteredMembers.length} registered community members`,
    });
    setIsMemberListOpen(true);
  };

  const showMarriedMembers = () => {
    const filteredMembers = getFilteredMembers().filter(
      (member) => member.maritalStatus === "Married",
    );
    setMemberListData({
      members: filteredMembers,
      title: selectedTemple
        ? `${selectedTemple.templeName} - Married Members`
        : "Married Members",
      description: `${filteredMembers.length} married community members and their families`,
    });
    setIsMemberListOpen(true);
  };

  const showActiveVolunteers = () => {
    const filteredMembers = getFilteredMembers().slice(
      0,
      Math.ceil(totalMembers * 0.125),
    );
    setMemberListData({
      members: filteredMembers,
      title: selectedTemple
        ? `${selectedTemple.templeName} - Active Volunteers`
        : "Active Volunteers",
      description: `Community volunteers contributing to temple activities and events`,
    });
    setIsMemberListOpen(true);
  };

  // Update page title when temple is selected
  useEffect(() => {
    if (selectedTemple) {
      document.title = `${selectedTemple.templeName} - Our Temple`;
    } else {
      document.title = "Gateway to your Kulatheivam";
    }
  }, [selectedTemple]);

  const form = useForm<TempleEditData>({
    resolver: zodResolver(templeEditSchema),
    defaultValues: {
      templeName: "",
      deity: "",
      village: "",
      nearestCity: "",
      state: "",
      country: "",
      establishedYear: undefined,
      contactPhone: "",
      contactEmail: "",
      description: "",
      templeImage: "",
    },
  });

  // Temple update mutation
  const updateTempleMutation = useMutation({
    mutationFn: async (data: TempleEditData) => {
      if (!selectedTemple) throw new Error("No temple selected");
      return await apiRequest("PUT", `/api/temples/${selectedTemple.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      setIsEditModalOpen(false);
      toast({
        title: "Temple Updated",
        description: "Temple details have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update temple details",
        variant: "destructive",
      });
    },
  });

  const handleTempleSelect = (templeId: string) => {
    if (templeId === "reset") {
      setSelectedTemple(null);
      return;
    }
    const temple = (temples as Temple[]).find(
      (t) => t.id.toString() === templeId,
    );
    setSelectedTemple(temple || null);
  };

  const handleEditTemple = () => {
    if (!selectedTemple) return;

    form.reset({
      templeName: selectedTemple.templeName,
      deity: selectedTemple.deity || "",
      village: selectedTemple.village,
      nearestCity: selectedTemple.nearestCity,
      state: selectedTemple.state,
      country: selectedTemple.country,
      establishedYear: selectedTemple.establishedYear || undefined,
      contactPhone: selectedTemple.contactPhone || "",
      contactEmail: selectedTemple.contactEmail || "",
      description: selectedTemple.description || "",
      templeImage: selectedTemple.templeImage || "",
    });

    setUploadedImage(selectedTemple.templeImage || null);
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;

        // Create canvas to resize image
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Calculate new dimensions (max 800px width/height)
          const maxSize = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedImage = canvas.toDataURL("image/jpeg", 0.8);

          setUploadedImage(compressedImage);
          form.setValue("templeImage", compressedImage);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: TempleEditData) => {
    if (!selectedTemple) return;
    updateTempleMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50">
      {/* Temple Selection at Top - Always Visible */}
      <div className="bg-white shadow-md sticky top-0 z-50 border-b border-temple-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Building className="text-temple-gold" size={24} />
            <span className="text-lg font-semibold text-temple-brown">
              {t("home.selectTemple")}
            </span>
            <div className="min-w-[300px]">
              <Select
                onValueChange={handleTempleSelect}
                value={selectedTemple?.id.toString() || "reset"}
              >
                <SelectTrigger className="w-full bg-white border-temple-gold focus:ring-temple-gold">
                  <SelectValue placeholder={t("home.chooseTemple")} />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 overflow-y-auto">
                  <SelectItem value="reset">{t("home.allTemples")}</SelectItem>
                  {(temples as Temple[]).map((temple: Temple) => (
                    <SelectItem key={temple.id} value={temple.id.toString()}>
                      {temple.templeName} - {temple.village}, {temple.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on Temple Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTemple ? (
          /* Selected Temple Information */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-temple-brown mb-4">
                🕉️ {selectedTemple.templeName}
              </h1>
              {selectedTemple.deity && (
                <p className="text-xl text-saffron-600 font-medium mb-2">
                  {t("temples.deity")}: {selectedTemple.deity}
                </p>
              )}
              <p className="text-lg text-gray-600 mb-6">
                {selectedTemple.description ||
                  t("home.defaultTempleDescription")}
              </p>
            </div>

            <Card className="bg-white shadow-xl border-temple-gold/30">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Temple Image */}
                  <div className="flex justify-center">
                    {selectedTemple.templeImage ? (
                      <div className="w-full max-w-lg">
                        <img
                          src={selectedTemple.templeImage}
                          alt={selectedTemple.templeName}
                          className="w-full h-80 object-cover rounded-lg shadow-lg border-2 border-temple-gold/20"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGN0VEIi8+CjxwYXRoIGQ9Ik0yMDAgNzVMMjUwIDEyNUgxNTBMMjAwIDc1WiIgZmlsbD0iI0Q5NzcwNiIvPgo8cmVjdCB4PSIxNzAiIHk9IjEyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Q5NzcwNiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNjAiIHI9IjE1IiBmaWxsPSIjRkJFRjNGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5MjQwMEQiPlRlbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-lg h-80 bg-gradient-to-br from-saffron-100 to-gold-100 rounded-lg shadow-lg flex items-center justify-center border-2 border-temple-gold/20">
                        <div className="text-center">
                          <Building
                            className="mx-auto text-temple-gold mb-4"
                            size={64}
                          />
                          <p className="text-temple-brown font-medium text-lg">
                            {t("temples.noImage")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Temple Details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="bg-gradient-to-r from-saffron-50 to-gold-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-105"
                        onClick={showAllMembers}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-temple-brown">
                            {totalMembers}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t("home.registeredMembers")}
                          </div>
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            {t("home.clickToViewMembers")}
                          </div>
                        </div>
                      </div>
                      <div
                        className="bg-gradient-to-r from-temple-cream to-saffron-50 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-105"
                        onClick={showMarriedMembers}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-temple-brown">
                            {totalFamilies}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t("home.families")}
                          </div>
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            {t("home.clickToViewFamilies")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-temple-brown">
                        <MapPin className="mr-3 text-saffron-500" size={20} />
                        <span className="text-lg">
                          {selectedTemple.village}, {selectedTemple.nearestCity}
                        </span>
                      </div>
                      <div className="flex items-center text-temple-brown">
                        <Building className="mr-3 text-saffron-500" size={20} />
                        <span className="text-lg">
                          {selectedTemple.state}, {selectedTemple.country}
                        </span>
                      </div>
                      {selectedTemple.establishedYear && (
                        <div className="flex items-center text-temple-brown">
                          <Calendar
                            className="mr-3 text-saffron-500"
                            size={20}
                          />
                          <span className="text-lg">
                            {t("temples.established")}:{" "}
                            {selectedTemple.establishedYear}
                          </span>
                        </div>
                      )}
                      {selectedTemple.contactPhone && (
                        <div className="flex items-center text-temple-brown">
                          <Phone className="mr-3 text-saffron-500" size={20} />
                          <span className="text-lg">
                            {selectedTemple.contactPhone}
                          </span>
                        </div>
                      )}
                      {selectedTemple.contactEmail && (
                        <div className="flex items-center text-temple-brown">
                          <Mail className="mr-3 text-saffron-500" size={20} />
                          <span className="text-lg">
                            {selectedTemple.contactEmail}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button
                        onClick={() =>
                          window.open(`/temple/${selectedTemple.id}`, "_blank")
                        }
                        className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Eye className="mr-2" size={20} />
                        {t("temples.viewDetails")}
                      </Button>
                      <Link href="/registry">
                        <Button className="w-full bg-temple-gold hover:bg-yellow-500 text-temple-brown font-semibold py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                          {t("home.joinCommunity")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Default Content When No Temple Selected */
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-temple-brown mb-4">
                🕉️ {t("home.title")}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                {t("home.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card
                className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                onClick={showAllMembers}
              >
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto text-temple-gold mb-4" size={48} />
                  <div className="text-3xl font-bold text-temple-brown">
                    {totalMembers}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("home.communityMembers")}
                  </div>
                  <div className="text-xs text-blue-600 mt-2 font-medium">
                    {t("home.clickToViewMembers")}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                onClick={showMarriedMembers}
              >
                <CardContent className="p-6 text-center">
                  <Heart className="mx-auto text-temple-gold mb-4" size={48} />
                  <div className="text-3xl font-bold text-temple-brown">
                    {totalFamilies}
                  </div>
                  <div className="text-sm text-gray-600">{t("home.families")}</div>
                  <div className="text-xs text-blue-600 mt-2 font-medium">
                    {t("home.clickToViewFamilies")}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar
                    className="mx-auto text-temple-gold mb-4"
                    size={48}
                  />
                  <div className="text-3xl font-bold text-temple-brown">
                    {annualEvents}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("home.activeTempleEvents")}
                  </div>
                </CardContent>
              </Card>
              {/* <Card
                className="bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                onClick={showActiveVolunteers}
              >
                <CardContent className="p-6 text-center">
                  <HandHeart
                    className="mx-auto text-temple-gold mb-4"
                    size={48}
                  /> */}
              {/* <div className="text-3xl font-bold text-temple-brown">
                    {volunteers}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("home.volunteers")}
                  </div>
                  <div className="text-xs text-blue-600 mt-2 font-medium">
                    {t("home.clickToViewVolunteers")}
                  </div> 
                </CardContent>
              </Card>*/}
            </div>

            <div className="pt-8">
              <Link href="/registry">
                <Button className="bg-temple-gold hover:bg-yellow-500 text-temple-brown font-semibold px-12 py-4 rounded-full text-lg transition-all transform hover:scale-105 shadow-lg">
                  {t("home.getStarted")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Temple Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-temple-brown mb-6">
              {selectedTemple
                ? `Welcome to Our ${selectedTemple.templeName}`
                : t("common.welcomeSacredSpace")}
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {selectedTemple
                ? selectedTemple.description || t("common.spiritualBeacon")
                : t("common.spiritualBeacon")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20"></Card>
              <Card className="bg-white/80 backdrop-blur border border-temple-gold/20"></Card>
            </div>
          </div>
          <div className="space-y-6">
            {/* Temple Photo Carousel */}
            {selectedTemple ? (
              <TempleSpecificPhotoCarousel
                temple={selectedTemple}
                className="w-full"
              />
            ) : (
              <TemplePhotoCarousel className="w-full" />
            )}
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-temple-brown mb-4">
            {t("common.ourGrowingCommunity")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("common.strengthenBonds")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-500 to-temple-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">
              {totalMembers.toLocaleString()}
            </h3>
            <p className="text-gray-600">{t("common.registeredMembers")}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-crimson to-temple-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">
              {totalFamilies}
            </h3>
            <p className="text-gray-600">{t("common.families")}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-saffron-600 to-saffron-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">
              {annualEvents}
            </h3>
            <p className="text-gray-600">{t("common.annualEvents")}</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-temple-gold to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandHeart className="text-white" size={32} />
            </div>
            <h3 className="text-3xl font-bold text-temple-brown">
              {volunteers}
            </h3>
            <p className="text-gray-600">{t("common.volunteers")}</p>
          </div>
        </div>
      </div>

      {/* Temple Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-temple-brown flex items-center">
              <Edit className="mr-3" size={24} />
              Edit Temple Information
            </DialogTitle>
            <DialogDescription>
              Update the temple information below. All changes will be saved to
              the temple registry.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="templeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temple Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sri Lakshmi Narasimha Temple"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Deity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Lord Narasimha, Goddess Lakshmi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village/Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Tirupati, Mylapore"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nearestCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nearest City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Chennai, Bangalore"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Tamil Nadu, Karnataka"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., India, United States"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="establishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Established Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1985"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., +1 (555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., temple@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Temple Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the temple, its history, and significance..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Temple Image Upload */}
                <div className="md:col-span-2">
                  <FormLabel className="text-base font-medium">
                    Temple Image
                  </FormLabel>
                  <div className="mt-2 space-y-4">
                    {uploadedImage ? (
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Temple"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setUploadedImage(null);
                            form.setValue("templeImage", "");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label className="cursor-pointer">
                            <Button
                              type="button"
                              className="bg-saffron-500 hover:bg-saffron-600"
                              onClick={() =>
                                document
                                  .getElementById("temple-image-edit-upload")
                                  ?.click()
                              }
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </Button>
                            <input
                              id="temple-image-edit-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Choose an image file for the temple
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTempleMutation.isPending}
                  className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-yellow-500"
                >
                  {updateTempleMutation.isPending
                    ? "Updating..."
                    : "Update Temple"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Member List Modal */}
      <MemberListModal
        isOpen={isMemberListOpen}
        onClose={() => setIsMemberListOpen(false)}
        members={memberListData.members}
        title={memberListData.title}
        description={memberListData.description}
      />
    </div>
  );
}
