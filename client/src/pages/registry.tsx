import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  User,
  MapPin,
  Home,
  Users,
  Link as LinkIcon,
  Search,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { insertMemberSchema } from "@shared/schema";
import type { Member } from "@shared/schema";
import { PhotoUpload } from "@/components/photo-upload";

const registrationSchema = insertMemberSchema.extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  email: z
    .union([
      z.string().email("Please enter a valid email address"),
      z.literal(""),
    ])
    .optional(),
  selectedTemple: z.string().optional(),
  birthCity: z.string().min(1, "Birth city is required"),
  birthState: z.string().min(1, "Birth state is required"),
  birthCountry: z.string().min(1, "Birth country is required"),
  currentCity: z.string().min(1, "Current city is required"),
  currentState: z.string().min(1, "Current state is required"),
  currentCountry: z.string().min(1, "Current country is required"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  motherName: z.string().min(2, "Mother's name must be at least 2 characters"),
  spouseName: z.string().optional(),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  linkedRelatives: z
    .array(
      z.object({
        memberId: z.number(),
        relationshipType: z.string(),
      }),
    )
    .optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

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
    { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu" },
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
    { value: "NSW", label: "New South Wales" },
    { value: "QLD", label: "Queensland" },
    { value: "SA", label: "South Australia" },
    { value: "TAS", label: "Tasmania" },
    { value: "VIC", label: "Victoria" },
    { value: "WA", label: "Western Australia" },
    { value: "ACT", label: "Australian Capital Territory" },
    { value: "NT", label: "Northern Territory" },
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

const relationships = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Step Father", label: "Step Father" },
  { value: "Step Mother", label: "Step Mother" },
  { value: "Wife", label: "Wife" },
  { value: "Husband", label: "Husband" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Elder Brother", label: "Elder Brother" },
  { value: "Elder Sister", label: "Elder Sister" },
  { value: "Younger Brother", label: "Younger Brother" },
  { value: "Younger Sister", label: "Younger Sister" },
  { value: "Step-Brother", label: "Step-Brother" },
  { value: "Step-Sister", label: "Step-Sister" },
  { value: "Paternal Grandfather", label: "Paternal Grandfather" },
  { value: "Paternal Grandmother", label: "Paternal Grandmother" },
  { value: "Maternal Grandfather", label: "Maternal Grandfather" },
  { value: "Maternal Grandmother", label: "Maternal Grandmother" },
  { value: "Grand Daugher-Son Side", label: "Grand Daugher-Son Side" },
  { value: "Grand Son-Son Side", label: "Grand Son-Son Side" },
  {value: "Grand Daugher-Daughter Side",
    label: "Grand Daugher-Daughter Side",
  },
  { value: "Grand Son-Daughter Side", label: "Grand Son-Daughter Side" },
  { value: "Nephew", label: "Nephew" },
  { value: "Niece", label: "Niece" },
  { value: "Mother-in-Law", label: "Mother-in-Law" },
  { value: "Father-in-Law", label: "Father-in-Law" },
  { value: "Brother-in-Law", label: "Brother-in-Law" },
  { value: "Sister-in-Law", label: "Father-in-Law" },
  { value: "Aunt", label: "Aunt" },
  { value: "Uncle", label: "Uncle" },
  { value: "Cousin Brother-Father Side", label: "Cousin Brother-Father Side" },
  { value: "Cousin Sister-Father Side", label: "Cousin Sister-Father Side" },
  { value: "Cousin Brother-Mother Side", label: "Cousin Brother-Mother Side" },
  { value: "Cousin Sister-Mother Side", label: "Cousin Sister-Mother Side" },
  { value: "Other", label: "Other" },
];

export default function Registry() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelative, setSelectedRelative] = useState<Member | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [linkedRelatives, setLinkedRelatives] = useState<
    Array<{ member: Member; relationship: string }>
  >([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState("");
  const [selectedBirthCountry, setSelectedBirthCountry] = useState("");
  const [selectedCurrentCountry, setSelectedCurrentCountry] = useState("");
  const [selectedTemple, setSelectedTemple] = useState("");
  const [memberPhotos, setMemberPhotos] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch temples for dropdown
  const { data: temples = [] } = useQuery<any[]>({
    queryKey: ["/api/temples"],
  });

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      gender: undefined,
      birthCity: "",
      birthState: "",
      birthCountry: "",
      currentCity: "",
      currentState: "",
      currentCountry: "",
      fatherName: "",
      motherName: "",
      spouseName: "",
      maritalStatus: "Single" as const,
    },
  });

  // Search members for relationship linking
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/members/search", { term: searchTerm }],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await fetch(
        `/api/members/search?term=${encodeURIComponent(searchTerm)}`,
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchTerm.length > 2,
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      // Include temple selection and photos
      const memberData = {
        ...data,
        templeId:
          selectedTemple && selectedTemple !== "none"
            ? parseInt(selectedTemple)
            : null,
        profilePicture: profilePicture || undefined,
        photos: memberPhotos,
      };
      delete memberData.selectedTemple; // Remove from the payload
      const response = await apiRequest("POST", "/api/members", memberData);
      return response;
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
      
      // Clear localStorage draft data
      localStorage.removeItem("registry-form-draft");
      
      // Reset all form fields and state
      form.reset({
        fullName: "",
        phone: "",
        email: "",
        gender: undefined,
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
        selectedTemple: "",
        linkedRelatives: []
      });
      
      // Reset all state variables
      setLinkedRelatives([]);
      setSearchTerm("");
      setSelectedRelative(null);
      setSelectedRelationship("");
      setSelectedMaritalStatus("");
      setSelectedBirthCountry("");
      setSelectedCurrentCountry("");
      setSelectedTemple("");
      setMemberPhotos([]);
      setProfilePicture("");
      
      // Show success toast
      toast({
        title: "Registration Successful!",
        description: "Member has been registered and form has been cleared for next entry.",
        variant: "default",
      });
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
      // Check if this relationship already exists
      const exists = linkedRelatives.some(
        (rel) => rel.member.id === selectedRelative.id,
      );
      if (!exists) {
        setLinkedRelatives([
          ...linkedRelatives,
          { member: selectedRelative, relationship: selectedRelationship },
        ]);
        setSelectedRelative(null);
        setSelectedRelationship("");
        setSearchTerm("");
        toast({
          title: "Relative Added",
          description: `${selectedRelative.fullName} added as ${selectedRelationship}`,
        });
      } else {
        toast({
          title: "Already Added",
          description:
            "This family member is already in your relationships list.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveRelationship = (index: number) => {
    const removedMember = linkedRelatives[index];
    setLinkedRelatives(linkedRelatives.filter((_, i) => i !== index));
    if (removedMember) {
      toast({
        title: "Relative Removed",
        description: `${removedMember.member.fullName} removed from relationships`,
      });
    }
    handleAutoSave();
  };

  const onSubmit = (data: RegistrationData) => {
    // Clear autosave data before submitting
    localStorage.removeItem("registry-form-draft");
    registrationMutation.mutate(data);
  };

  // Auto-save functionality
  const handleAutoSave = () => {
    const formData = form.getValues();
    localStorage.setItem(
      "registry-form-draft",
      JSON.stringify({
        ...formData,
        linkedRelatives,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  // Load draft data on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("registry-form-draft");
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Only restore if less than 24 hours old
        const draftAge =
          new Date().getTime() - new Date(draftData.timestamp).getTime();
        if (draftAge < 24 * 60 * 60 * 1000) {
          form.reset(draftData);
          setLinkedRelatives(draftData.linkedRelatives || []);
          setSelectedMaritalStatus(draftData.maritalStatus || "");
          setSelectedBirthCountry(draftData.birthCountry || "");
          setSelectedCurrentCountry(draftData.currentCountry || "");
          setSelectedTemple(draftData.selectedTemple || "");
          toast({
            title: "Draft Restored",
            description: "Your previously saved form data has been restored.",
          });
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, [form, toast]);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setLocation("/");
  };

  // Auto-populate family relationships based on selected member
  const autoPopulateRelationships = (member: Member) => {
    console.log("Auto-populating relationships for:", member.fullName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl border border-temple-gold/20 overflow-hidden">
          <div className="bg-gradient-to-r from-saffron-500 to-temple-gold p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              {t("common.communityRegistry")}
            </h2>
            <p className="text-saffron-100">{t("common.joinTempleFamily")}</p>
          </div>

          <CardContent className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Personal Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <User className="text-temple-gold mr-3" size={24} />
                    {t("common.personalInformation")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                              onBlur={() => {
                                handleAutoSave();
                              }}
                            />
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
                          <FormLabel>Phone Number(Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              onBlur={() => {
                                handleAutoSave();
                              }}
                            />
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
                          <FormLabel>Email Address(Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@example.com (optional)"
                              {...field}
                              value={field.value || ""}
                              onBlur={() => {
                                handleAutoSave();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleAutoSave();
                            }}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
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
                      name="birthCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedBirthCountry(value);
                              form.setValue("birthState", "");
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                      name="birthState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              !selectedBirthCountry ||
                              !statesByCountry[selectedBirthCountry]
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedBirthCountry
                                      ? "Select State"
                                      : "Select Country first"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedBirthCountry &&
                              statesByCountry[selectedBirthCountry] ? (
                                statesByCountry[selectedBirthCountry].map(
                                  (state) => (
                                    <SelectItem
                                      key={state.value}
                                      value={state.value}
                                    >
                                      {state.label}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="none" disabled>
                                  No states available
                                </SelectItem>
                              )}
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
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Birth city" {...field} />
                          </FormControl>
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
                      name="currentCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCurrentCountry(value);
                              form.setValue("currentState", "");
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                      name="currentState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={
                              !selectedCurrentCountry ||
                              !statesByCountry[selectedCurrentCountry]
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedCurrentCountry
                                      ? "Select State"
                                      : "Select Country first"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCurrentCountry &&
                              statesByCountry[selectedCurrentCountry] ? (
                                statesByCountry[selectedCurrentCountry].map(
                                  (state) => (
                                    <SelectItem
                                      key={state.value}
                                      value={state.value}
                                    >
                                      {state.label}
                                    </SelectItem>
                                  ),
                                )
                              ) : (
                                <SelectItem value="none" disabled>
                                  No states available
                                </SelectItem>
                              )}
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
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Current city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Family Information */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <Users className="text-temple-gold mr-3" size={24} />
                    Family Information
                  </h3>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Father's full name"
                              {...field}
                            />
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
                            <Input
                              placeholder="Mother's full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedMaritalStatus(value);
                              if (value !== "Married") {
                                form.setValue("spouseName", "");
                              }
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <FormField
                      control={form.control}
                      name="spouseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spouse Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Spouse's full name"
                              {...field}
                              disabled={selectedMaritalStatus !== "Married"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="selectedTemple"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Temple (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedTemple(value);
                              handleAutoSave();
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose your temple" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                No temple selected
                              </SelectItem>
                              {temples.map((temple: any) => (
                                <SelectItem
                                  key={temple.id}
                                  value={temple.id.toString()}
                                >
                                  {temple.templeName} - {temple.village},{" "}
                                  {temple.state}
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

                {/* Photo Upload Section */}
                <div className="border-l-4 border-temple-gold pl-6">
                  <PhotoUpload
                    photos={memberPhotos}
                    onPhotosChange={setMemberPhotos}
                    allowProfilePicture={true}
                    profilePicture={profilePicture}
                    onProfilePictureChange={setProfilePicture}
                    title="Member Photos"
                    description="Upload profile picture and additional photos for this member"
                    maxPhotos={5}
                  />
                </div>

                {/* Family Relationships 
                <div className="border-l-4 border-temple-crimson pl-6">
                  <h3 className="text-xl font-semibold text-temple-brown mb-6 flex items-center">
                    <LinkIcon className="text-temple-crimson mr-3" size={24} />
                    Family Relationships
                  </h3>*/}

                {/* Auto-populate notice 
                  {selectedMember && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>{selectedMember.fullName}</strong> selected.
                        Family relationships will be auto-populated when this
                        member is added.
                      </p>
                    </div>
                  )}
                  <Card className="bg-saffron-50 border border-saffron-200">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Relative
                          </Label>
                          <div className="relative">
                            <Input
                              placeholder="Type name to search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pr-10"
                            />
                            <Search
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              size={16}
                            />
                          </div>
                          {searchResults.length > 0 &&
                            searchTerm.length > 2 && (
                              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {searchResults.map((member: Member) => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedRelative(member);
                                      setSelectedMember(member); // Set for auto-population
                                      setSearchTerm(member.fullName);
                                      // Auto-populate family relationships
                                      autoPopulateRelationships(member);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-saffron-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                  >
                                    <div className="font-bold text-temple-brown text-lg">
                                      {member.fullName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {member.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {member.currentCity},{" "}
                                      {member.currentState}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Relationship
                          </Label>
                          <Select
                            value={selectedRelationship}
                            onValueChange={setSelectedRelationship}
                          >
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
                        <h4 className="font-medium text-gray-700 mb-3">
                          Linked Relatives:
                        </h4>
                        <div className="space-y-2">
                          {linkedRelatives.length === 0 ? (
                            <div className="flex items-center justify-between bg-white p-3 rounded border">
                              <span className="text-gray-700">
                                No relatives linked yet
                              </span>
                            </div>
                          ) : (
                            linkedRelatives.map((rel, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white p-3 rounded border"
                              >
                                <div>
                                  <span className="font-medium">
                                    {rel.member.fullName}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({rel.relationship})
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveRelationship(index)
                                  }
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
                */}
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
              Welcome to our temple community. Your profile has been created
              successfully.
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
