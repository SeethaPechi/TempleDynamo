import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, Users, FileText, ExternalLink, CheckCircle } from "lucide-react";
import type { Member } from "@shared/schema";

interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
}

export default function WhatsApp() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [generatedUrls, setGeneratedUrls] = useState<Array<{ phoneNumber: string; url: string }>>([]);
  const { toast } = useToast();

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: templates = [] } = useQuery<WhatsAppTemplate[]>({
    queryKey: ["/api/whatsapp/templates"],
  });

  const processTemplateMutation = useMutation({
    mutationFn: async ({ templateId, variables }: { templateId: string; variables: Record<string, string> }) => {
      const response = await apiRequest("POST", "/api/whatsapp/process-template", { templateId, variables });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage(data.message);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process template",
        variant: "destructive",
      });
    },
  });

  const generateUrlsMutation = useMutation({
    mutationFn: async ({ phoneNumbers, message }: { phoneNumbers: string[]; message: string }) => {
      const response = await apiRequest("POST", "/api/whatsapp/broadcast-urls", { phoneNumbers, message });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedUrls(data.urls);
      toast({
        title: "Success",
        description: `Generated WhatsApp links for ${data.urls.length} members`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate WhatsApp links",
        variant: "destructive",
      });
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Extract variables from template
      const variableMatches = template.template.match(/\{([^}]+)\}/g);
      const variables: Record<string, string> = {};
      if (variableMatches) {
        variableMatches.forEach(match => {
          const varName = match.slice(1, -1);
          variables[varName] = '';
        });
      }
      setTemplateVariables(variables);
    }
  };

  const handleProcessTemplate = () => {
    if (selectedTemplate && Object.keys(templateVariables).length > 0) {
      processTemplateMutation.mutate({ templateId: selectedTemplate, variables: templateVariables });
    }
  };

  const handleMemberSelection = (memberId: number, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleGenerateLinks = () => {
    if (selectedMembers.length === 0 || !message.trim()) {
      toast({
        title: "Error",
        description: "Please select members and enter a message",
        variant: "destructive",
      });
      return;
    }

    const selectedMemberData = members.filter(m => selectedMembers.includes(m.id));
    const phoneNumbers = selectedMemberData.map(m => m.phone);
    generateUrlsMutation.mutate({ phoneNumbers, message });
  };

  const handleOpenAll = () => {
    generatedUrls.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.url, '_blank');
      }, index * 500); // Stagger opening to avoid popup blocking
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-temple-brown mb-2 flex items-center">
            <MessageSquare className="text-temple-gold mr-3" size={32} />
            WhatsApp Messaging
          </h1>
          <p className="text-gray-600">Send announcements and updates to temple community members</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Message Composition */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="text-saffron-600 mr-2" size={20} />
                  Message Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Select Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && selectedTemplate !== "custom" && Object.keys(templateVariables).length > 0 && (
                  <div className="space-y-3">
                    <Label>Template Variables</Label>
                    {Object.keys(templateVariables).map((varName) => (
                      <div key={varName}>
                        <Label htmlFor={varName} className="text-sm capitalize">
                          {varName.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Input
                          id={varName}
                          value={templateVariables[varName]}
                          onChange={(e) => setTemplateVariables({
                            ...templateVariables,
                            [varName]: e.target.value
                          })}
                          placeholder={`Enter ${varName}`}
                        />
                      </div>
                    ))}
                    <Button 
                      onClick={handleProcessTemplate}
                      disabled={processTemplateMutation.isPending}
                      className="w-full"
                    >
                      Generate Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={8}
                  className="resize-none"
                />
                <div className="mt-2 text-sm text-gray-500">
                  Characters: {message.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="text-temple-crimson mr-2" size={20} />
                    Select Recipients
                  </span>
                  <span className="text-sm font-normal text-gray-600">
                    {selectedMembers.length} of {members.length} selected
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedMembers.length === members.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Select All Members
                    </Label>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberSelection(member.id, checked as boolean)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`member-${member.id}`} className="font-medium cursor-pointer">
                            {member.fullName}
                          </Label>
                          <p className="text-sm text-gray-500 truncate">{member.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate WhatsApp Links</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateLinks}
                  disabled={generateUrlsMutation.isPending || selectedMembers.length === 0 || !message.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Send className="mr-2" size={20} />
                  Generate WhatsApp Links
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Links */}
        {generatedUrls.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2" size={20} />
                  Generated WhatsApp Links
                </span>
                <Button
                  onClick={handleOpenAll}
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <ExternalLink className="mr-2" size={16} />
                  Open All Links
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedUrls.map((item, index) => {
                  const member = members.find(m => m.phone === item.phoneNumber);
                  return (
                    <Card key={index} className="border border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {member?.fullName || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">{item.phoneNumber}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.open(item.url, '_blank')}
                            className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Instructions:</strong> Click on individual links or use "Open All Links" to open WhatsApp with pre-filled messages. 
                  Each link will open WhatsApp Web or the WhatsApp app with the message ready to send.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}