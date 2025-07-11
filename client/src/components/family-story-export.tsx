import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Copy, Share2, Users, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Member, Relationship } from "@shared/schema";

interface FamilyStoryExportProps {
  member: Member;
  relationships: Array<Relationship & { relatedMember: Member }>;
}

export function FamilyStoryExport({ member, relationships }: FamilyStoryExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<string>("");
  const { toast } = useToast();

  const generateFamilyStory = async () => {
    setIsGenerating(true);
    
    try {
      // Group relationships by type
      const relationshipGroups = [
        { name: "Parents", types: ["Father", "Mother", "Step Father", "Step Mother"] },
        { name: "Spouse", types: ["Wife", "Husband"] },
        { name: "Children", types: ["Son", "Daughter", "Step-Son", "Step-Daughter"] },
        { name: "Siblings", types: ["Elder Brother", "Elder Sister", "Younger Brother", "Younger Sister", "Step-Brother", "Step-Sister"] },
        { name: "Grand Parents", types: ["Paternal Grandfather", "Paternal Grandmother", "Maternal Grandfather", "Maternal Grandmother"] },
        { name: "Grand Children", types: ["Grand Daughter -Son Side", "Grand Son-Son Side", "Grand Daughter -Daughter Side", "Grand Son-Daughter Side"] },
        { name: "In-Laws", types: ["Mother-in-Law", "Father-in-Law", "Brother-in-Law", "Sister-in-Law", "Son-in-Law", "Daughter-in-Law"] },
        { name: "Cousins", types: ["Cousin Brother-Father Side", "Cousin Sister-Father Side", "Cousin Brother-Mother Side", "Cousin Sister-Mother Side"] },
        { name: "Aunts & Uncles", types: ["Aunt-Father Side", "Uncle-Father Side", "Aunt-Mother Side", "Uncle-Mother Side"] },
        { name: "Other Family Connections", types: ["Nephew", "Niece"] }
      ];

      const groups: { [key: string]: Array<Relationship & { relatedMember: Member }> } = {};
      
      relationshipGroups.forEach(group => {
        const groupMembers = relationships.filter(rel => group.types.includes(rel.relationshipType));
        if (groupMembers.length > 0) {
          groups[group.name] = groupMembers;
        }
      });

      // Generate story content
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let story = `# Family Story of ${member.fullName}\n\n`;
      story += `*Generated on ${currentDate}*\n\n`;
      
      story += `## Personal Information\n`;
      story += `**Full Name:** ${member.fullName}\n`;
      story += `**Gender:** ${member.gender || 'Not specified'}\n`;
      story += `**Marital Status:** ${member.maritalStatus || 'Not specified'}\n`;
      story += `**Birth Place:** ${member.birthCity}, ${member.birthState}, ${member.birthCountry}\n`;
      story += `**Current Location:** ${member.currentCity}, ${member.currentState}, ${member.currentCountry}\n`;
      
      if (member.phone) story += `**Phone:** ${member.phone}\n`;
      if (member.email) story += `**Email:** ${member.email}\n`;
      if (member.fatherName) story += `**Father's Name:** ${member.fatherName}\n`;
      if (member.motherName) story += `**Mother's Name:** ${member.motherName}\n`;
      if (member.spouseName) story += `**Spouse's Name:** ${member.spouseName}\n`;
      
      story += `\n## Family Connections\n\n`;
      story += `${member.fullName} has ${relationships.length} family connection${relationships.length === 1 ? '' : 's'} recorded in our family registry.\n\n`;

      // Add each relationship group
      Object.entries(groups).forEach(([groupName, groupMembers]) => {
        story += `### ${groupName}\n\n`;
        
        groupMembers.forEach(rel => {
          const relatedMember = rel.relatedMember;
          story += `**${relatedMember.fullName}** *(${rel.relationshipType})*\n`;
          
          if (relatedMember.currentCity && relatedMember.currentState) {
            story += `- Location: ${relatedMember.currentCity}, ${relatedMember.currentState}\n`;
          }
          
          if (relatedMember.phone) {
            story += `- Phone: ${relatedMember.phone}\n`;
          }
          
          if (relatedMember.email) {
            story += `- Email: ${relatedMember.email}\n`;
          }
          
          if (relatedMember.maritalStatus) {
            story += `- Marital Status: ${relatedMember.maritalStatus}\n`;
          }
          
          if (relatedMember.spouseName) {
            story += `- Spouse: ${relatedMember.spouseName}\n`;
          }
          
          story += `\n`;
        });
      });

      // Add family statistics
      story += `## Family Statistics\n\n`;
      story += `- **Total Family Members:** ${relationships.length}\n`;
      story += `- **Relationship Types:** ${new Set(relationships.map(r => r.relationshipType)).size}\n`;
      story += `- **Family Locations:** ${new Set(relationships.map(r => `${r.relatedMember.currentCity}, ${r.relatedMember.currentState}`)).size}\n`;
      
      const maleCount = relationships.filter(r => r.relatedMember.gender === 'Male').length;
      const femaleCount = relationships.filter(r => r.relatedMember.gender === 'Female').length;
      
      story += `- **Male Family Members:** ${maleCount}\n`;
      story += `- **Female Family Members:** ${femaleCount}\n`;

      // Add family tree narrative
      story += `\n## Family Tree Overview\n\n`;
      story += `This family story represents the comprehensive family network of ${member.fullName}, `;
      story += `documenting ${relationships.length} family relationships across multiple generations and locations. `;
      story += `The family network spans across various cities and states, creating a rich tapestry of connections.\n\n`;

      if (groups["Parents"]) {
        story += `The foundation of this family tree begins with ${member.fullName}'s parents: `;
        story += groups["Parents"].map(rel => rel.relatedMember.fullName).join(' and ') + '. ';
      }

      if (groups["Spouse"]) {
        story += `${member.fullName} is married to ${groups["Spouse"][0].relatedMember.fullName}. `;
      }

      if (groups["Children"]) {
        story += `The family continues with ${groups["Children"].length} children: `;
        story += groups["Children"].map(rel => rel.relatedMember.fullName).join(', ') + '. ';
      }

      if (groups["Siblings"]) {
        story += `${member.fullName} has ${groups["Siblings"].length} sibling${groups["Siblings"].length === 1 ? '' : 's'}: `;
        story += groups["Siblings"].map(rel => rel.relatedMember.fullName).join(', ') + '. ';
      }

      story += `\n\n---\n\n`;
      story += `*This family story was generated from the Sri Lakshmi Temple Family Registry on ${currentDate}.*\n`;
      story += `*For updates or corrections, please contact the temple administration.*`;

      setGeneratedStory(story);
      
      toast({
        title: "Family Story Generated",
        description: "Your family story has been successfully generated!",
      });
      
    } catch (error) {
      console.error('Error generating family story:', error);
      toast({
        title: "Error",
        description: "Failed to generate family story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedStory);
      toast({
        title: "Copied to Clipboard",
        description: "Family story has been copied to your clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([generatedStory], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member.fullName.replace(/\s+/g, '_')}_Family_Story.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your family story file is being downloaded!",
    });
  };

  const shareStory = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Family Story of ${member.fullName}`,
          text: generatedStory,
        });
      } catch (error) {
        // Fallback to copy to clipboard
        copyToClipboard();
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-saffron-500 to-gold-500 hover:from-saffron-600 hover:to-gold-600 text-white border-0"
        >
          <FileText className="mr-2" size={16} />
          Export Family Story
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-temple-brown">
            Family Story Export
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info Card */}
          <Card className="bg-gradient-to-r from-saffron-50 to-gold-50 border-saffron-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-temple-brown">
                Generate Family Story for {member.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Users className="mr-2 text-saffron-600" size={16} />
                    <span className="font-medium">Total Connections:</span>
                    <Badge variant="secondary" className="ml-2">
                      {relationships.length}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 text-saffron-600" size={16} />
                    <span className="font-medium">Member Since:</span>
                    <span className="ml-2 text-gray-600">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="mr-2 text-saffron-600" size={16} />
                    <span className="font-medium">Location:</span>
                    <span className="ml-2 text-gray-600">
                      {member.currentCity}, {member.currentState}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="mr-2 text-saffron-600" size={16} />
                    <span className="font-medium">Relationship Types:</span>
                    <Badge variant="secondary" className="ml-2">
                      {new Set(relationships.map(r => r.relationshipType)).size}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          {!generatedStory && (
            <div className="text-center">
              <Button 
                onClick={generateFamilyStory}
                disabled={isGenerating}
                className="bg-gradient-to-r from-saffron-500 to-gold-500 hover:from-saffron-600 hover:to-gold-600 text-white px-8 py-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Story...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2" size={16} />
                    Generate Family Story
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Story */}
          {generatedStory && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-temple-brown">
                  Generated Family Story
                </h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
                    className="text-saffron-600 border-saffron-200 hover:bg-saffron-50"
                  >
                    <Copy className="mr-1" size={14} />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadAsFile}
                    className="text-saffron-600 border-saffron-200 hover:bg-saffron-50"
                  >
                    <Download className="mr-1" size={14} />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={shareStory}
                    className="text-saffron-600 border-saffron-200 hover:bg-saffron-50"
                  >
                    <Share2 className="mr-1" size={14} />
                    Share
                  </Button>
                </div>
              </div>
              
              <Card className="p-4 bg-gray-50 border-gray-200">
                <div className="max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {generatedStory}
                  </pre>
                </div>
              </Card>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    setGeneratedStory("");
                    generateFamilyStory();
                  }}
                  variant="outline"
                  className="text-saffron-600 border-saffron-200 hover:bg-saffron-50"
                >
                  Regenerate Story
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}