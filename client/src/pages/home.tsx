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
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import type { Temple } from "@shared/schema";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: temples = [] } = useQuery({
    queryKey: ["/api/temples"],
  });

  const totalMembers = (members as any[]).length;
  const totalFamilies = Math.ceil(totalMembers / 3.6);
  const annualEvents = 48;
  const volunteers = Math.ceil(totalMembers * 0.125);

  useEffect(() => {
    if (selectedTemple) {
      document.title = `${selectedTemple.templeName} - Temple Dynamo`;
    } else {
      document.title = "Temple Dynamo - Hindu Temple Community Management";
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

  const deleteTempleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemple) throw new Error("No temple selected");
      return await apiRequest("DELETE", `/api/temples/${selectedTemple.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      setIsDeleteModalOpen(false);
      setSelectedTemple(null);
      toast({
        title: "Temple Deleted",
        description: "Temple has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete temple",
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

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
      {/* Temple Selection - Always on Top */}
      <div className="relative z-50 bg-gradient-to-r from-temple-brown to-saffron-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building className="text-temple-gold" size={24} />
            <span className="text-xl font-semibold text-white">
              {t("home.selectTemple")}
            </span>
          </div>
          <div className="max-w-md mx-auto">
            <Select onValueChange={handleTempleSelect}>
              <SelectTrigger className="w-full bg-white/95 border-temple-gold focus:ring-temple-gold h-12 text-lg">
                <SelectValue placeholder={t("home.chooseTemple")} />
              </SelectTrigger>
              <SelectContent className="z-[60]">
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

      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-saffron-100 to-temple-cream py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-temple-brown mb-4">
            🕉️{" "}
            {selectedTemple
              ? `${t("home.welcomeTo")} ${selectedTemple.templeName}`
              : t("home.title")}
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            {selectedTemple
              ? selectedTemple.description ||
                t("home.templeDescription")
              : t("home.subtitle")}
          </p>
          
          <Link href="/registry">
            <Button className="bg-temple-gold hover:bg-yellow-500 text-temple-brown font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg">
              {t("home.getStarted")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Temple Information Display */}
      {selectedTemple && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="bg-white/95 border-temple-gold/30 shadow-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Temple Image */}
                <div className="flex justify-center">
                  {selectedTemple.templeImage ? (
                    <div className="relative w-full max-w-md mx-auto">
                      <img
                        src={selectedTemple.templeImage}
                        alt={selectedTemple.templeName}
                        className="w-full h-64 object-cover rounded-lg shadow-md border-2 border-temple-gold/20"
                        style={{ maxWidth: "400px" }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGN0VEIi8+CjxwYXRoIGQ9Ik0yMDAgNzVMMjUwIDEyNUgxNTBMMjAwIDc1WiIgZmlsbD0iI0Q5NzcwNiIvPgo8cmVjdCB4PSIxNzAiIHk9IjEyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Q5NzcwNiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNjAiIHI9IjE1IiBmaWxsPSIjRkJFRjNGIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5MjQwMEQiPlRlbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-md h-64 bg-gradient-to-br from-saffron-100 to-gold-100 rounded-lg shadow-md flex items-center justify-center mx-auto border-2 border-temple-gold/20">
                      <div className="text-center">
                        <Building
                          className="mx-auto text-temple-gold mb-2"
                          size={48}
                        />
                        <p className="text-temple-brown font-medium">
                          {t("temple.templeImage")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Temple Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl font-bold text-temple-brown mb-2">
                      {selectedTemple.templeName}
                    </h3>
                    {selectedTemple.deity && (
                      <p className="text-xl text-saffron-600 font-medium">
                        {t("temple.deity")}: {selectedTemple.deity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-temple-brown">
                      <MapPin className="mr-3 text-saffron-500" size={18} />
                      <span className="text-lg">
                        {selectedTemple.village}, {selectedTemple.nearestCity}
                      </span>
                    </div>
                    <div className="flex items-center text-temple-brown">
                      <Building className="mr-3 text-saffron-500" size={18} />
                      <span className="text-lg">
                        {selectedTemple.state}, {selectedTemple.country}
                      </span>
                    </div>
                    {selectedTemple.establishedYear && (
                      <div className="flex items-center text-temple-brown">
                        <Calendar className="mr-3 text-saffron-500" size={18} />
                        <span className="text-lg">
                          {t("temple.established")}: {selectedTemple.establishedYear}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  {(selectedTemple.contactPhone || selectedTemple.contactEmail) && (
                    <div className="space-y-3">
                      {selectedTemple.contactPhone && (
                        <div className="flex items-center text-temple-brown">
                          <Phone className="mr-3 text-saffron-500" size={18} />
                          <span className="text-lg">{selectedTemple.contactPhone}</span>
                        </div>
                      )}
                      {selectedTemple.contactEmail && (
                        <div className="flex items-center text-temple-brown">
                          <Mail className="mr-3 text-saffron-500" size={18} />
                          <span className="text-lg">{selectedTemple.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {selectedTemple.description && (
                    <div className="bg-gradient-to-r from-saffron-50 to-gold-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedTemple.description}
                      </p>
                    </div>
                  )}

                  {/* Registered Members Counter */}
                  <div className="bg-gradient-to-r from-temple-gold/10 to-saffron-100 rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-temple-brown mb-2">
                        {totalMembers}
                      </div>
                      <div className="text-lg text-gray-600">
                        {t("temple.registeredMembers")}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleEditTemple}
                      className="flex-1 bg-temple-gold hover:bg-temple-gold/90 text-white"
                    >
                      <Edit className="mr-2" size={16} />
                      {t("temple.editTemple")}
                    </Button>
                    <Button
                      onClick={() => setIsDeleteModalOpen(true)}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2" size={16} />
                      {t("temple.deleteTemple")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              {t("temple.editTempleInfo")}
            </DialogTitle>
            <DialogDescription>
              {t("temple.editDescription")}
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
                      <FormLabel>{t("temple.templeName")}</FormLabel>
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
                      <FormLabel>{t("temple.mainDeity")}</FormLabel>
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
                      <FormLabel>{t("temple.village")}</FormLabel>
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
                      <FormLabel>{t("temple.nearestCity")}</FormLabel>
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
                      <FormLabel>{t("temple.state")}</FormLabel>
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
                      <FormLabel>{t("temple.country")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., India, USA"
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
                      <FormLabel>{t("temple.establishedYear")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1998"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                      <FormLabel>{t("temple.contactPhone")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., +91 9876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("temple.contactEmail")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
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
                  <FormItem>
                    <FormLabel>{t("temple.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("temple.descriptionPlaceholder")}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  {t("temple.templeImage")}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="temple-image-upload"
                  />
                  <label
                    htmlFor="temple-image-upload"
                    className="cursor-pointer flex items-center px-4 py-2 bg-temple-gold text-white rounded-md hover:bg-temple-gold/90"
                  >
                    <Upload className="mr-2" size={16} />
                    {t("temple.uploadImage")}
                  </label>
                  {uploadedImage && (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          form.setValue("templeImage", "");
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="bg-temple-gold hover:bg-temple-gold/90"
                  disabled={updateTempleMutation.isPending}
                >
                  {updateTempleMutation.isPending ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("temple.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("temple.deleteConfirmDescription", { templeName: selectedTemple?.templeName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTempleMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTempleMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}