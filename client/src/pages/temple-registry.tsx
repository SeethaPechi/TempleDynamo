import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, MapPin, Home, Calendar, Phone, Mail, Link as LinkIcon, Upload, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import type { Temple } from "@shared/schema";


const templeRegistrationSchema = z.object({
  templeName: z.string().min(2, "Temple name must be at least 2 characters"),
  deity: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  nearestCity: z.string().min(1, "Nearest city is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  linkedTemples: z.array(z.string()).default([]),
  establishedYear: z.number().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  description: z.string().optional(),
  templeImage: z.string().optional(),
});

type TempleRegistrationData = z.infer<typeof templeRegistrationSchema>;

const countries = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "UK", label: "United Kingdom" },
];

const statesByCountry = {
  "US": [
    { value: "AL", label: "Alabama" },
    { value: "CA", label: "California" },
    { value: "FL", label: "Florida" },
    { value: "NY", label: "New York" },
    { value: "TX", label: "Texas" },
    { value: "WA", label: "Washington" },
  ],
  "IN": [
    { value: "TN", label: "Tamil Nadu" },
    { value: "KA", label: "Karnataka" },
    { value: "AP", label: "Andhra Pradesh" },
    { value: "KL", label: "Kerala" },
    { value: "MH", label: "Maharashtra" },
    { value: "DL", label: "Delhi" },
  ],
  "CA": [
    { value: "ON", label: "Ontario" },
    { value: "BC", label: "British Columbia" },
    { value: "QC", label: "Quebec" },
    { value: "AB", label: "Alberta" },
  ],
  "AU": [
    { value: "NSW", label: "New South Wales" },
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
    { value: "WA", label: "Western Australia" },
  ],
  "UK": [
    { value: "ENG", label: "England" },
    { value: "SCT", label: "Scotland" },
    { value: "WLS", label: "Wales" },
    { value: "NIR", label: "Northern Ireland" },
  ],
};

export default function TempleRegistry() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedLinkedTemples, setSelectedLinkedTemples] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        form.setValue("templeImage", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm<TempleRegistrationData>({
    resolver: zodResolver(templeRegistrationSchema),
    defaultValues: {
      templeName: "",
      deity: "",
      village: "",
      nearestCity: "",
      state: "",
      country: "",
      linkedTemples: [],
      establishedYear: undefined,
      contactPhone: "",
      contactEmail: "",
      description: "",
      templeImage: "",
    },
  });

  // Get existing temples for linking
  const { data: existingTemples = [] } = useQuery({
    queryKey: ["/api/temples"],
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: TempleRegistrationData) => {
      const response = await apiRequest("POST", "/api/temples", {
        ...data,
        linkedTemples: selectedLinkedTemples,
        establishedYear: data.establishedYear || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      setShowSuccessModal(true);
      toast({
        title: t('common.success'),
        description: t('templeRegistry.success'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('templeRegistry.error'),
        variant: "destructive",
      });
    },
  });

  const handleLinkedTempleChange = (templeId: string, checked: boolean) => {
    if (checked) {
      setSelectedLinkedTemples([...selectedLinkedTemples, templeId]);
    } else {
      setSelectedLinkedTemples(selectedLinkedTemples.filter(id => id !== templeId));
    }
  };

  const onSubmit = (data: TempleRegistrationData) => {
    const transformedData = {
      ...data,
      linkedTemples: selectedLinkedTemples,
      templeImage: capturedImage || "",
    };
    registrationMutation.mutate(transformedData);
  };

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    form.setValue("templeImage", imageData);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setLocation("/temples");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl border border-temple-gold/20 overflow-hidden">
          <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">{t('templeRegistry.title')}</h2>
            <p className="text-saffron-100">{t('templeRegistry.subtitle')}</p>
          </div>

          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Temple Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <Building className="text-temple-gold mr-3" size={24} />
                    {t('templeRegistry.templeInformation')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="templeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.templeName')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('templeRegistry.form.templeNamePlaceholder')} 
                              {...field} 
                              onBlur={(e) => {
                                field.onBlur();
                                const draftData = JSON.parse(localStorage.getItem('temple-registry-draft') || '{}');
                                draftData.templeName = e.target.value;
                                localStorage.setItem('temple-registry-draft', JSON.stringify(draftData));
                              }}
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
                          <FormLabel>{t('templeRegistry.form.deity')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('templeRegistry.form.deityPlaceholder')} 
                              {...field} 
                              onBlur={(e) => {
                                field.onBlur();
                                const draftData = JSON.parse(localStorage.getItem('temple-registry-draft') || '{}');
                                draftData.deity = e.target.value;
                                localStorage.setItem('temple-registry-draft', JSON.stringify(draftData));
                              }}
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
                          <FormLabel>{t('templeRegistry.form.establishedYear')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1995"
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{t('templeRegistry.form.description')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('templeRegistry.form.descriptionPlaceholder')}
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
                      <FormLabel className="text-base font-medium">Temple Image</FormLabel>
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
                                  onClick={() => document.getElementById('temple-image-upload')?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </Button>
                                <input
                                  id="temple-image-upload"
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
                </div>

                {/* Location Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <MapPin className="text-temple-gold mr-3" size={24} />
                    {t('templeRegistry.locationInformation')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.country')}</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCountry(value);
                            form.setValue("state", "");

                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('templeRegistry.form.selectCountry')} />
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
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.state')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCountry || !statesByCountry[selectedCountry]}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedCountry ? t('templeRegistry.form.selectState') : "Select Country first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCountry && statesByCountry[selectedCountry] ? 
                                statesByCountry[selectedCountry].map((state) => (
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
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.village')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('templeRegistry.form.villagePlaceholder')} {...field} />
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
                          <FormLabel>{t('templeRegistry.form.nearestCity')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('templeRegistry.form.nearestCityPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <Phone className="text-temple-gold mr-3" size={24} />
                    {t('templeRegistry.contactInformation')}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.contactPhone')}</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('templeRegistry.form.contactEmail')}</FormLabel>
                          <FormControl>
                            <Input placeholder="temple@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Linked Temples */}
                {(existingTemples as Temple[]).length > 0 && (
                  <div className="border-l-4 border-temple-gold pl-6">
                    <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                      <LinkIcon className="text-temple-gold mr-3" size={24} />
                      {t('templeRegistry.linkedTemples')}
                    </h3>
                    <p className="text-gray-600 mb-4">{t('templeRegistry.linkedTemplesDesc')}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(existingTemples as Temple[]).map((temple: Temple) => (
                        <div key={temple.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`temple-${temple.id}`}
                            checked={selectedLinkedTemples.includes(temple.id.toString())}
                            onCheckedChange={(checked) => 
                              handleLinkedTempleChange(temple.id.toString(), checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`temple-${temple.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {temple.templeName} - {temple.village}, {temple.state}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/temples")}
                    className="px-8"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={registrationMutation.isPending}
                    className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-temple-gold/90 px-8"
                  >
                    {registrationMutation.isPending ? t('templeRegistry.registering') : t('templeRegistry.buttons.register')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600 mb-4">
                {t('templeRegistry.successTitle')}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t('templeRegistry.successMessage')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-6">
              <Button onClick={handleCloseModal} className="bg-gradient-to-r from-saffron-500 to-temple-gold">
                {t('templeRegistry.viewTemples')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </div>
  );
}