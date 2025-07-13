import { useState, useEffect, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Upload,
  X,
  ExternalLink,
  Globe,
  Map,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Temple, Member } from "@shared/schema";
import { MemberListModal } from "@/components/member-list-modal";
import { PhotoUpload } from "@/components/photo-upload";

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
  { value: "CV", label: "Cape Verde" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
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
  { value: "SH", label: "Saint Helena" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
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
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
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
  { value: "VI", label: "U.S. Virgin Islands" },
  { value: "WF", label: "Wallis and Futuna" },
  { value: "EH", label: "Western Sahara" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

const getStatesForCountry = (countryCode: string) => {
  const statesByCountry: Record<
    string,
    Array<{ value: string; label: string }>
  > = {
    US: [
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
      { value: "WY", label: "Wyoming" },
    ],
    IN: [
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
      { value: "PY", label: "Puducherry" },
    ],
    CA: [
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
      { value: "YT", label: "Yukon" },
    ],
    AU: [
      { value: "ACT", label: "Australian Capital Territory" },
      { value: "NSW", label: "New South Wales" },
      { value: "NT", label: "Northern Territory" },
      { value: "QLD", label: "Queensland" },
      { value: "SA", label: "South Australia" },
      { value: "TAS", label: "Tasmania" },
      { value: "VIC", label: "Victoria" },
      { value: "WA", label: "Western Australia" },
    ],
    GB: [
      { value: "ENG", label: "England" },
      { value: "SCT", label: "Scotland" },
      { value: "WLS", label: "Wales" },
      { value: "NIR", label: "Northern Ireland" },
    ],
    DE: [
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
      { value: "TH", label: "Thuringia" },
    ],
  };

  return statesByCountry[countryCode] || [];
};

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
  templePhotos: z.array(z.string()).max(10, "Maximum 10 photos allowed").default([]),
  googleMapLink: z
    .string()
    .url("Please enter a valid Google Maps URL")
    .optional()
    .or(z.literal("")),
  websiteLink: z
    .string()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),
  wikiLink: z
    .string()
    .url("Please enter a valid Wikipedia URL")
    .optional()
    .or(z.literal("")),
});

type TempleEditData = z.infer<typeof templeEditSchema>;

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
  const [templePhotos, setTemplePhotos] = useState<string[]>([]);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [memberListData, setMemberListData] = useState<{
    members: Member[];
    title: string;
    description?: string;
  }>({ members: [], title: "", description: "" });
  const templesPerPage = 9;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableStates = selectedCountry
    ? getStatesForCountry(selectedCountry)
    : [];

  const { data: allTemples = [], isLoading } = useQuery({
    queryKey: ["/api/temples"],
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  // Get member count for a specific temple
  const getTempleMembers = (templeId: number) => {
    return (allMembers as Member[]).filter(member => member.templeId === templeId);
  };

  // Show temple members in modal
  const showTempleMembers = (temple: Temple) => {
    const templeMembers = getTempleMembers(temple.id);
    setMemberListData({
      members: templeMembers,
      title: `${temple.templeName} - Members`,
      description: `${templeMembers.length} registered members associated with this temple`,
    });
    setIsMemberListOpen(true);
  };

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
      templePhotos: [],
      googleMapLink: "",
      websiteLink: "",
      wikiLink: "",
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
        title: t("temples.updateSuccess"),
        description: t("temples.updateSuccessDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("temples.updateError"),
        description: error.message || t("temples.updateErrorDesc"),
        variant: "destructive",
      });
    },
  });

  // Silent update mutation for photo uploads (doesn't close modal)
  const silentUpdateMutation = useMutation({
    mutationFn: async (data: TempleEditData) => {
      if (!selectedTemple) throw new Error("No temple selected");
      return await apiRequest("PUT", `/api/temples/${selectedTemple.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      // Don't show toast or close modal for silent updates
    },
    onError: (error: any) => {
      toast({
        title: t("temples.updateError"),
        description: error.message || t("temples.updateErrorDesc"),
        variant: "destructive",
      });
    },
  });

  // Temple delete mutation
  const deleteTempleMutation = useMutation({
    mutationFn: async (templeId: number) => {
      return await apiRequest("DELETE", `/api/temples/${templeId}`);
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
      queryClient.refetchQueries({ queryKey: ["/api/temples"] });
      queryClient.removeQueries({ queryKey: ["/api/temples"] });

      setIsDeleteModalOpen(false);
      setSelectedTemple(null);

      toast({
        title: t("temples.deleteSuccess"),
        description: t("temples.deleteSuccessDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("temples.deleteError"),
        description: error.message || t("temples.deleteErrorDesc"),
        variant: "destructive",
      });
    },
  });

  // Auto-save helper function (localStorage only)
  const autoSaveFormData = () => {
    if (selectedTemple) {
      const formData = form.getValues();
      localStorage.setItem(
        `temple_edit_${selectedTemple.id}`,
        JSON.stringify(formData),
      );
    }
  };

  // Auto-submit when modal closes
  const handleModalClose = (open: boolean) => {
    if (!open && selectedTemple && isEditModalOpen) {
      const formData = form.getValues();
      const savedData = localStorage.getItem(
        `temple_edit_${selectedTemple.id}`,
      );
      const templeId = selectedTemple.id;

      // Only submit if there are changes and valid data
      if (savedData && templeId) {
        try {
          // Create a dedicated mutation call with temple ID captured
          apiRequest("PUT", `/api/temples/${templeId}`, formData)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/temples"] });
            })
            .catch((error) => {
              console.error("Auto-submit error:", error);
            });
        } catch (error) {
          console.error("Error during auto-submit:", error);
        }
      }
    }
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedTemple(null);
    }
  };

  // Load saved form data when modal opens
  useEffect(() => {
    if (isEditModalOpen && selectedTemple) {
      const savedData = localStorage.getItem(
        `temple_edit_${selectedTemple.id}`,
      );
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          form.reset(parsedData);
          setUploadedImage(parsedData.templeImage || null);
          setTemplePhotos(parsedData.templePhotos || []);
        } catch (error) {
          console.error("Error loading saved form data:", error);
        }
      } else {
        form.reset({
          templeName: selectedTemple.templeName || "",
          deity: selectedTemple.deity || "",
          village: selectedTemple.village || "",
          nearestCity: selectedTemple.nearestCity || "",
          state: selectedTemple.state || "",
          country: selectedTemple.country || "",
          establishedYear: selectedTemple.establishedYear || 0,
          contactPhone: selectedTemple.contactPhone || "",
          contactEmail: selectedTemple.contactEmail || "",
          description: selectedTemple.description || "",
          templeImage: selectedTemple.templeImage || "",
          templePhotos: selectedTemple.templePhotos || [],
          googleMapLink: selectedTemple.googleMapLink || "",
          websiteLink: selectedTemple.websiteLink || "",
          wikiLink: selectedTemple.wikiLink || "",
        });
      }
    }
  }, [isEditModalOpen, selectedTemple, form]);

  // Clear saved data on successful update
  useEffect(() => {
    if (!isEditModalOpen && selectedTemple) {
      localStorage.removeItem(`temple_edit_${selectedTemple.id}`);
    }
  }, [isEditModalOpen, selectedTemple]);

  // Handler functions
  const handleEditTemple = (temple: Temple) => {
    setSelectedTemple(temple);
    form.reset({
      templeName: temple.templeName,
      deity: temple.deity || "",
      village: temple.village,
      nearestCity: temple.nearestCity,
      state: temple.state,
      country: temple.country,
      establishedYear: temple.establishedYear || undefined,
      contactPhone: temple.contactPhone || "",
      contactEmail: temple.contactEmail || "",
      description: temple.description || "",
      templeImage: temple.templeImage || "",
      templePhotos: temple.templePhotos || [],
      googleMapLink: temple.googleMapLink || "",
      websiteLink: temple.websiteLink || "",
      wikiLink: temple.wikiLink || "",
    });
    setUploadedImage(temple.templeImage || null);
    setTemplePhotos(temple.templePhotos || []);
    setIsEditModalOpen(true);
  };

  const handleDeleteTemple = (temple: Temple) => {
    setSelectedTemple(temple);
    setIsDeleteModalOpen(true);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: t("temples.imageSizeError"),
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

  // Temple photo handlers
  const handleTempleImageChange = (newImage: string) => {
    setUploadedImage(newImage);
    form.setValue("templeImage", newImage);
    
    // Auto-save to database immediately using silent mutation
    if (selectedTemple) {
      const formData = form.getValues();
      const updatedData = { ...formData, templeImage: newImage };
      silentUpdateMutation.mutate(updatedData);
    }
  };

  const handleTemplePhotosChange = (newPhotos: string[]) => {
    setTemplePhotos(newPhotos);
    form.setValue("templePhotos", newPhotos);
    
    // Auto-save to database immediately using silent mutation
    if (selectedTemple) {
      const formData = form.getValues();
      const updatedData = { ...formData, templePhotos: newPhotos };
      silentUpdateMutation.mutate(updatedData);
    }
  };

  const onSubmit = (data: TempleEditData) => {
    if (!selectedTemple) return;
    updateTempleMutation.mutate(data);
  };

  // Filter temples based on search criteria
  const filteredTemples = (allTemples as Temple[]).filter((temple: Temple) => {
    const matchesSearch =
      !searchTerm ||
      temple.templeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.nearestCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (temple.deity &&
        temple.deity.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesState =
      !selectedState ||
      selectedState === "all-states" ||
      temple.state === selectedState;
    const matchesCountry =
      !selectedCountry ||
      selectedCountry === "all-countries" ||
      temple.country === selectedCountry;

    return matchesSearch && matchesState && matchesCountry;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTemples.length / templesPerPage);
  const startIndex = (currentPage - 1) * templesPerPage;
  const paginatedTemples = filteredTemples.slice(
    startIndex,
    startIndex + templesPerPage,
  );

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      "from-saffron-400 to-temple-gold",
      "from-temple-crimson to-temple-red",
      "from-saffron-600 to-saffron-700",
    ];
    return gradients[index % gradients.length];
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
            <h1 className="text-3xl font-bold text-temple-brown">
              {t("temples.title")}
            </h1>
            <p className="text-gray-600 mt-2">{t("temples.subtitle")}</p>
          </div>
          <Link href="/temple-registry">
            <Button className="bg-gradient-to-r from-saffron-500 to-temple-gold hover:from-saffron-600 hover:to-temple-gold/90">
              <Plus className="mr-2" size={16} />
              {t("temples.addTemple")}
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border border-temple-gold/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-temple-brown mb-6">
            {t("temples.searchAndFilter")}
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder={t("temples.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder={t("temples.allStates")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">
                    {t("temples.allStates")}
                  </SelectItem>
                  {availableStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("temples.allCountries")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-countries">
                    {t("temples.allCountries")}
                  </SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={handleSearch}
                className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-medium"
              >
                <Search className="mr-2" size={16} />
                {t("common.search")}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {t("common.showing")} {filteredTemples.length} {t("common.of")}{" "}
            {(allTemples as Temple[]).length} {t("temples.templesLower")}
          </div>
        </Card>

        {/* Temples Grid */}
        {filteredTemples.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {t("temples.noTemplesFound")}
            </h3>
            <p className="text-gray-500">{t("temples.adjustSearchCriteria")}</p>
            <Link href="/temple-registry">
              <Button className="mt-4 bg-gradient-to-r from-saffron-500 to-temple-gold">
                <Plus className="mr-2" size={16} />
                {t("temples.registerFirstTemple")}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTemples.map((temple: Temple, index: number) => (
              <Card
                key={temple.id}
                className="overflow-hidden hover:shadow-xl transition-shadow border border-temple-gold/20"
              >
                <div
                  className={`bg-gradient-to-r ${getGradientColor(index)} p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Building className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-600 text-sm">
                          {temple.templeName}
                        </h3>
                        {temple.deity && (
                          <p className="text-gray-600 text-sm">{temple.deity}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      onClick={(e) => {
                        e.stopPropagation();
                        showTempleMembers(temple);
                      }}
                      className="bg-white/90 text-gray-700 hover:bg-white cursor-pointer transition-colors"
                    >
                      <Users className="mr-1" size={12} />
                      {getTempleMembers(temple.id).length} members
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">
                        {temple.village}, {temple.nearestCity}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="text-gray-400" size={16} />
                      <span className="text-gray-600 text-sm">
                        {temple.state}, {temple.country}
                      </span>
                    </div>
                    {temple.establishedYear && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">
                          {t("temples.established")} {temple.establishedYear}
                        </span>
                      </div>
                    )}
                    {temple.contactPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm">
                          {temple.contactPhone}
                        </span>
                      </div>
                    )}
                    {temple.contactEmail && (
                      <div className="flex items-center space-x-3">
                        <Mail className="text-gray-400" size={16} />
                        <span className="text-gray-600 text-sm truncate">
                          {temple.contactEmail}
                        </span>
                      </div>
                    )}
                  </div>

                  {temple.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {temple.description}
                      </p>
                    </div>
                  )}

                  {temple.linkedTemples && temple.linkedTemples.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Building className="text-gray-400" size={14} />
                        <span className="text-sm text-gray-500">
                          {t("temples.linkedTemples")}:{" "}
                          {temple.linkedTemples.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* External Links */}
                  {(temple.googleMapLink ||
                    temple.websiteLink ||
                    temple.wikiLink) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {temple.googleMapLink && (
                          <Button
                            onClick={() =>
                              window.open(temple.googleMapLink!, "_blank")
                            }
                            variant="outline"
                            size="sm"
                            className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Map className="mr-1" size={12} />
                            {t("temples.openMap")}
                          </Button>
                        )}
                        {temple.websiteLink && (
                          <Button
                            onClick={() =>
                              window.open(temple.websiteLink!, "_blank")
                            }
                            variant="outline"
                            size="sm"
                            className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Globe className="mr-1" size={12} />
                            {t("temples.openWebsite")}
                          </Button>
                        )}
                        {temple.wikiLink && (
                          <Button
                            onClick={() =>
                              window.open(temple.wikiLink!, "_blank")
                            }
                            variant="outline"
                            size="sm"
                            className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <ExternalLink className="mr-1" size={12} />
                            {t("temples.openWiki")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-2">
                    <Button
                      onClick={() => handleEditTemple(temple)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-temple-gold text-temple-brown hover:bg-temple-gold/10"
                    >
                      <Edit className="mr-2" size={14} />
                      {t("common.edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteTemple(temple)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2" size={14} />
                      {t("common.delete")}
                    </Button>
                  </div>
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
              {t("common.previous")}
            </Button>
            <span className="text-sm text-gray-600">
              {t("common.page")} {currentPage} {t("common.of")} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              {t("common.next")}
            </Button>
          </div>
        )}

        {/* Edit Temple Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("temples.editTemple")}</DialogTitle>
              <DialogDescription>
                {t("temples.editTempleDesc")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="templeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("temples.templeName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.templeNamePlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
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
                        <FormLabel>{t("temples.deity")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.deityPlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("temples.village")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.villagePlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
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
                        <FormLabel>{t("temples.nearestCity")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.nearestCityPlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("temples.country")}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            autoSaveFormData();
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("temples.selectCountry")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {countries.map((country) => (
                              <SelectItem
                                key={country.value}
                                value={country.value}
                              >
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
                        <FormLabel>{t("temples.state")}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            autoSaveFormData();
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("temples.selectState")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getStatesForCountry(form.watch("country")).map(
                              (state) => (
                                <SelectItem
                                  key={state.value}
                                  value={state.value}
                                >
                                  {state.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="establishedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("temples.establishedYear")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t(
                              "temples.establishedYearPlaceholder",
                            )}
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
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
                        <FormLabel>{t("temples.contactPhone")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.contactPhonePlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
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
                      <FormLabel>{t("temples.contactEmail")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("temples.contactEmailPlaceholder")}
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            autoSaveFormData();
                          }}
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
                      <FormLabel>{t("temples.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("temples.descriptionPlaceholder")}
                          className="resize-none"
                          rows={4}
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            autoSaveFormData();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* External Links Section */}
                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-temple-brown">
                    {t("temples.externalLinks")}
                  </h3>

                  <FormField
                    control={form.control}
                    name="googleMapLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("temples.googleMapLink")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.googleMapPlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
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
                        <FormLabel>{t("temples.websiteLink")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.websitePlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
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
                        <FormLabel>{t("temples.wikiLink")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("temples.wikiPlaceholder")}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              autoSaveFormData();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Temple Photo Upload */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-temple-brown border-b pb-2">
                    Temple Photos
                  </h3>
                  <PhotoUpload
                    photos={templePhotos}
                    onPhotosChange={handleTemplePhotosChange}
                    allowProfilePicture={true}
                    profilePicture={uploadedImage || ""}
                    onProfilePictureChange={handleTempleImageChange}
                    title="Main Temple Image"
                    description="Upload main temple image and additional photos"
                    maxPhotos={10}
                  />
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
                    disabled={updateTempleMutation.isPending}
                    className="bg-temple-gold hover:bg-temple-gold/90"
                  >
                    {updateTempleMutation.isPending
                      ? t("common.updating")
                      : t("common.update")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("temples.deleteTemple")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("temples.deleteConfirmation", {
                  templeName: selectedTemple?.templeName,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  selectedTemple &&
                  deleteTempleMutation.mutate(selectedTemple.id)
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteTempleMutation.isPending
                  ? t("common.deleting")
                  : t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Member List Modal */}
        <MemberListModal
          isOpen={isMemberListOpen}
          onClose={() => setIsMemberListOpen(false)}
          members={memberListData.members}
          title={memberListData.title}
          description={memberListData.description}
        />
      </div>
    </div>
  );
}
