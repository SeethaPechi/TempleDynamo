import { useState, ChangeEvent } from "react";
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
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CV", label: "Cape Verde" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo (Democratic Republic)" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "North Korea" },
  { value: "KR", label: "South Korea" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MK", label: "North Macedonia" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "São Tomé and Príncipe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SZ", label: "Eswatini" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

const statesByCountry: Record<string, Array<{ value: string; label: string }>> = {
  "US": [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" }
  ],
  "IN": [
    { value: "AP", label: "Andhra Pradesh" },
    { value: "AR", label: "Arunachal Pradesh" },
    { value: "AS", label: "Assam" },
    { value: "BR", label: "Bihar" },
    { value: "CT", label: "Chhattisgarh" },
    { value: "DL", label: "Delhi" },
    { value: "GA", label: "Goa" },
    { value: "GJ", label: "Gujarat" },
    { value: "HR", label: "Haryana" },
    { value: "HP", label: "Himachal Pradesh" },
    { value: "JH", label: "Jharkhand" },
    { value: "KA", label: "Karnataka" },
    { value: "KL", label: "Kerala" },
    { value: "MP", label: "Madhya Pradesh" },
    { value: "MH", label: "Maharashtra" },
    { value: "MN", label: "Manipur" },
    { value: "ML", label: "Meghalaya" },
    { value: "MZ", label: "Mizoram" },
    { value: "NL", label: "Nagaland" },
    { value: "OR", label: "Odisha" },
    { value: "PB", label: "Punjab" },
    { value: "RJ", label: "Rajasthan" },
    { value: "SK", label: "Sikkim" },
    { value: "TN", label: "Tamil Nadu" },
    { value: "TG", label: "Telangana" },
    { value: "TR", label: "Tripura" },
    { value: "UP", label: "Uttar Pradesh" },
    { value: "UT", label: "Uttarakhand" },
    { value: "WB", label: "West Bengal" }
  ],
  "CA": [
    { value: "AB", label: "Alberta" },
    { value: "BC", label: "British Columbia" },
    { value: "MB", label: "Manitoba" },
    { value: "NB", label: "New Brunswick" },
    { value: "NL", label: "Newfoundland and Labrador" },
    { value: "NS", label: "Nova Scotia" },
    { value: "ON", label: "Ontario" },
    { value: "PE", label: "Prince Edward Island" },
    { value: "QC", label: "Quebec" },
    { value: "SK", label: "Saskatchewan" },
    { value: "NT", label: "Northwest Territories" },
    { value: "NU", label: "Nunavut" },
    { value: "YT", label: "Yukon" }
  ],
  "AU": [
    { value: "NSW", label: "New South Wales" },
    { value: "QLD", label: "Queensland" },
    { value: "SA", label: "South Australia" },
    { value: "TAS", label: "Tasmania" },
    { value: "VIC", label: "Victoria" },
    { value: "WA", label: "Western Australia" },
    { value: "ACT", label: "Australian Capital Territory" },
    { value: "NT", label: "Northern Territory" }
  ],
  "GB": [
    { value: "ENG", label: "England" },
    { value: "SCT", label: "Scotland" },
    { value: "WLS", label: "Wales" },
    { value: "NIR", label: "Northern Ireland" }
  ],
  "DE": [
    { value: "BW", label: "Baden-Württemberg" },
    { value: "BY", label: "Bavaria" },
    { value: "BE", label: "Berlin" },
    { value: "BB", label: "Brandenburg" },
    { value: "HB", label: "Bremen" },
    { value: "HH", label: "Hamburg" },
    { value: "HE", label: "Hesse" },
    { value: "MV", label: "Mecklenburg-Vorpommern" },
    { value: "NI", label: "Lower Saxony" },
    { value: "NW", label: "North Rhine-Westphalia" },
    { value: "RP", label: "Rhineland-Palatinate" },
    { value: "SL", label: "Saarland" },
    { value: "SN", label: "Saxony" },
    { value: "ST", label: "Saxony-Anhalt" },
    { value: "SH", label: "Schleswig-Holstein" },
    { value: "TH", label: "Thuringia" }
  ]
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
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
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
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          setUploadedImage(compressedImage);
          form.setValue("templeImage", compressedImage);
        };
        img.src = imageData;
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
      templeImage: uploadedImage || "",
    };
    registrationMutation.mutate(transformedData);
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