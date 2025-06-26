import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { 
  Search, 
  Building, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Globe,
  Map,
  Upload,
  X
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Temple, InsertTemple } from "@shared/schema";

// Comprehensive countries list
const countries = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AS", label: "American Samoa" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AI", label: "Anguilla" },
  { value: "AQ", label: "Antarctica" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AW", label: "Aruba" },
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
  { value: "BM", label: "Bermuda" },
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
  { value: "KY", label: "Cayman Islands" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
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
  { value: "FK", label: "Falkland Islands" },
  { value: "FO", label: "Faroe Islands" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GF", label: "French Guiana" },
  { value: "PF", label: "French Polynesia" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GI", label: "Gibraltar" },
  { value: "GR", label: "Greece" },
  { value: "GL", label: "Greenland" },
  { value: "GD", label: "Grenada" },
  { value: "GP", label: "Guadeloupe" },
  { value: "GU", label: "Guam" },
  { value: "GT", label: "Guatemala" },
  { value: "GG", label: "Guernsey" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IM", label: "Isle of Man" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JE", label: "Jersey" },
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
  { value: "MO", label: "Macao" },
  { value: "MK", label: "Macedonia" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MQ", label: "Martinique" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "YT", label: "Mayotte" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MS", label: "Montserrat" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NC", label: "New Caledonia" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NU", label: "Niue" },
  { value: "NF", label: "Norfolk Island" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PN", label: "Pitcairn" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "RE", label: "Réunion" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "BL", label: "Saint Barthélemy" },
  { value: "SH", label: "Saint Helena" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "MF", label: "Saint Martin" },
  { value: "PM", label: "Saint Pierre and Miquelon" },
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
  { value: "SX", label: "Sint Maarten" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "GS", label: "South Georgia" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SJ", label: "Svalbard and Jan Mayen" },
  { value: "SZ", label: "Swaziland" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TK", label: "Tokelau" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TC", label: "Turks and Caicos Islands" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "VG", label: "British Virgin Islands" },
  { value: "VI", label: "US Virgin Islands" },
  { value: "WF", label: "Wallis and Futuna" },
  { value: "EH", label: "Western Sahara" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" }
];

// Comprehensive states list
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
    { value: "WB", label: "West Bengal" },
    { value: "AN", label: "Andaman and Nicobar Islands" },
    { value: "CH", label: "Chandigarh" },
    { value: "DN", label: "Dadra and Nagar Haveli" },
    { value: "DD", label: "Daman and Diu" },
    { value: "DL", label: "Delhi" },
    { value: "JK", label: "Jammu and Kashmir" },
    { value: "LA", label: "Ladakh" },
    { value: "LD", label: "Lakshadweep" },
    { value: "PY", label: "Puducherry" }
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

const templeSchema = z.object({
  templeName: z.string().min(2, "Temple name must be at least 2 characters"),
  deity: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  nearestCity: z.string().min(1, "Nearest city is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  linkedTemples: z.array(z.string()).default([]),
  establishedYear: z.number().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  templeImage: z.string().optional(),
  googleMapLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  websiteLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  wikiLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type TempleFormData = z.infer<typeof templeSchema>;

export default function Temples() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const templesPerPage = 9;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allTemples = [], isLoading } = useQuery({
    queryKey: ["/api/temples"],
  });

  const form = useForm<TempleFormData>({
    resolver: zodResolver(templeSchema),
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
      googleMapLink: "",
      websiteLink: "",
      wikiLink: "",
    },
  });

  // Auto-save functionality
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('templeEditDraft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem('templeEditDraft');
    if (draft && !selectedTemple) {
      try {
        const parsedDraft = JSON.parse(draft);
        form.reset(parsedDraft);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [form, selectedTemple]);

  // Auto-save on blur for all fields
  const handleFieldBlur = () => {
    const currentValues = form.getValues();
    localStorage.setItem('templeEditDraft', JSON.stringify(currentValues));
  };

  // Update temple mutation
  const updateTempleMutation = useMutation({
    mutationFn: async (data: TempleFormData) => {
      if (!selectedTemple) throw new Error("No temple selected");
      return await apiRequest("PUT", `/api/temples/${selectedTemple.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      setIsEditModalOpen(false);
      localStorage.removeItem('templeEditDraft');
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

  // Delete temple mutation
  const deleteTempleMutation = useMutation({
    mutationFn: async (templeId: number) => {
      return await apiRequest("DELETE", `/api/temples/${templeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      setIsDeleteModalOpen(false);
      setSelectedTemple(null);
      toast({
        title: "Temple Deleted",
        description: "Temple has been successfully deleted.",
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

  // Filter temples based on search criteria
  const filteredTemples = (allTemples as Temple[]).filter((temple: Temple) => {
    const matchesSearch = !searchTerm || 
      temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (temple.deity && temple.deity.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesState = !selectedState || selectedState === "all-states" || temple.state === selectedState;
    const matchesCountry = !selectedCountry || selectedCountry === "all-countries" || temple.country === selectedCountry;
    
    return matchesSearch && matchesState && matchesCountry;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTemples.length / templesPerPage);
  const startIndex = (currentPage - 1) * templesPerPage;
  const paginatedTemples = filteredTemples.slice(startIndex, startIndex + templesPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleEditTemple = (temple: Temple) => {
    setSelectedTemple(temple);
    form.reset({
      templeName: temple.templeName,
      deity: temple.deity || "",
      village: temple.village,
      nearestCity: temple.nearestCity,
      state: temple.state,
      country: temple.country,
      linkedTemples: temple.linkedTemples || [],
      establishedYear: temple.establishedYear || undefined,
      contactPhone: temple.contactPhone || "",
      contactEmail: temple.contactEmail || "",
      description: temple.description || "",
      templeImage: temple.templeImage || "",
      googleMapLink: temple.googleMapLink || "",
      websiteLink: temple.websiteLink || "",
      wikiLink: temple.wikiLink || "",
    });
    setUploadedImage(temple.templeImage || null);
    setIsEditModalOpen(true);
  };

  const handleDeleteTemple = (temple: Temple) => {
    setSelectedTemple(temple);
    setIsDeleteModalOpen(true);
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

  const openLink = (url: string) => {
    if (url && url.trim()) {
      window.open(url, '_blank');
    }
  };

  const onSubmit = (data: TempleFormData) => {
    updateTempleMutation.mutate(data);
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-saffron-400 to-temple-gold",
      "from-temple-crimson to-temple-red",
      "from-saffron-600 to-saffron-700",
    ];
    return gradients[index % gradients.length];
  };

  const getAvailableStates = (country: string) => {
    return statesByCountry[country] || [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </Card>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-24" />
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-temple-brown">{t('temples.title')}</h1>
            <p className="text-gray-600 mt-2">{t('temples.subtitle')}</p>
          </div>
          <Link href="/temple-registry">
            <Button className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-temple-gold/90">
              <Plus className="mr-2" size={16} />
              {t('temples.addTemple')}
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-temple-brown mb-6">{t('temples.searchAndFilter')}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={t('temples.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder={t('temples.allCountries')} />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  <SelectItem value="all-countries">{t('temples.allCountries')}</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder={t('temples.allStates')} />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  <SelectItem value="all-states">{t('temples.allStates')}</SelectItem>
                  {selectedCountry && selectedCountry !== "all-countries" && 
                    getAvailableStates(selectedCountry).map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={handleSearch}
                className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-medium"
              >
                <Search className="mr-2" size={16} />
                {t('common.search')}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {t('common.showing')} {filteredTemples.length} {t('common.of')} {(allTemples as Temple[]).length} {t('temples.templesLower')}
          </div>
        </Card>

        {/* Temples Grid */}
        {filteredTemples.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('temples.noTemplesFound')}</h3>
            <p className="text-gray-500">{t('temples.adjustSearchCriteria')}</p>
            <Link href="/temple-registry">
              <Button className="mt-4 bg-gradient-to-r from-saffron-500 to-temple-gold">
                <Plus className="mr-2" size={16} />
                {t('temples.registerFirstTemple')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTemples.map((temple: Temple, index: number) => (
              <Card key={temple.id} className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20">
                <div className={`bg-gradient-to-r ${getGradientColor(index)} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Building className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{temple.templeName}</h3>
                        {temple.deity && <p className="text-white/80 text-sm">{temple.deity}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEditTemple(temple)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteTemple(temple)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{temple.village}, {temple.nearestCity}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">{temple.state}, {countries.find(c => c.value === temple.country)?.label || temple.country}</span>
                    </div>
                    {temple.establishedYear && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">{t('temples.established')} {temple.establishedYear}</span>
                      </div>
                    )}
                    {temple.contactPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">{temple.contactPhone}</span>
                      </div>
                    )}
                    {temple.contactEmail && (
                      <div className="flex items-center space-x-3">
                        <Mail className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm truncate">{temple.contactEmail}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Link Buttons */}
                  {(temple.googleMapLink || temple.websiteLink || temple.wikiLink) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {temple.googleMapLink && (
                        <Button
                          onClick={() => openLink(temple.googleMapLink!)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Map size={14} />
                          Maps
                          <ExternalLink size={12} />
                        </Button>
                      )}
                      {temple.websiteLink && (
                        <Button
                          onClick={() => openLink(temple.websiteLink!)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Globe size={14} />
                          Website
                          <ExternalLink size={12} />
                        </Button>
                      )}
                      {temple.wikiLink && (
                        <Button
                          onClick={() => openLink(temple.wikiLink!)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Globe size={14} />
                          Wiki
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {temple.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">{temple.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Temple Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Temple Details</DialogTitle>
            <DialogDescription>
              Update temple information and settings. Changes are auto-saved as you type.
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
                      <FormLabel>Temple Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter temple name"
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
                      <FormLabel>Deity</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter main deity"
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
                      <FormLabel>Village *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter village name"
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
                      <FormLabel>Nearest City *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter nearest city"
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
                      <FormLabel>Country *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("state", "");
                          handleFieldBlur();
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64 overflow-auto">
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
                      <FormLabel>State *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleFieldBlur();
                        }}
                        defaultValue={field.value}
                        disabled={!form.watch("country")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64 overflow-auto">
                          {getAvailableStates(form.watch("country")).map((state) => (
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
                  name="establishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Established Year</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : undefined);
                            handleFieldBlur();
                          }}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter year"
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
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter phone number"
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
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="Enter email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleMapLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps Link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="https://maps.google.com/..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="websiteLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="https://temple-website.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wikiLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wikipedia Link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleFieldBlur();
                          }}
                          placeholder="https://en.wikipedia.org/..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          handleFieldBlur();
                        }}
                        placeholder="Enter temple description..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Temple Image Upload */}
              <div className="space-y-4">
                <Label>Temple Image</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('temple-image-upload')?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload size={16} />
                    <span>Upload Image</span>
                  </Button>
                  <input
                    id="temple-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedImage(null);
                        form.setValue("templeImage", "");
                      }}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                {uploadedImage && (
                  <div className="mt-4">
                    <img
                      src={uploadedImage}
                      alt="Temple preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
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
                  className="bg-temple-gold hover:bg-temple-gold/90"
                >
                  {updateTempleMutation.isPending ? "Updating..." : "Update Temple"}
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
            <AlertDialogTitle>Delete Temple</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemple?.templeName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTemple && deleteTempleMutation.mutate(selectedTemple.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteTempleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}