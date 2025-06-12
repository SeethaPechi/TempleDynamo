class WhatsAppService {
  private templates: any[] = [];

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates = [
      {
        id: "event_reminder",
        name: "Event Reminder",
        template: "🕉️ *Sri Lakshmi Temple*\n\nDear {name},\n\nReminder: {eventName} on {date} at {time}.\n\nLocation: Sri Lakshmi Temple\nAddress: {address}\n\nPlease join us for this auspicious occasion.\n\nOM Shanti 🙏"
      },
      {
        id: "festival_greeting",
        name: "Festival Greeting",
        template: "🕉️ *Sri Lakshmi Temple*\n\n{festivalName} Greetings!\n\nMay this auspicious festival bring peace, prosperity, and happiness to you and your family.\n\nSpecial puja timings:\n{pujaTimings}\n\nOM Shanti 🙏"
      },
      {
        id: "donation_thank",
        name: "Donation Thank You",
        template: "🕉️ *Sri Lakshmi Temple*\n\nDear {name},\n\nThank you for your generous donation of ${amount}. Your contribution helps us serve the community better.\n\nMay the divine bless you abundantly.\n\nOM Shanti 🙏"
      },
      {
        id: "weekly_schedule",
        name: "Weekly Schedule",
        template: "🕉️ *Sri Lakshmi Temple - Weekly Schedule*\n\n*This Week's Events:*\n{weeklyEvents}\n\n*Daily Puja Timings:*\nMorning: 6:00 AM - 12:00 PM\nEvening: 5:00 PM - 9:00 PM\n\nOM Shanti 🙏"
      }
    ];
  }

  generateWhatsAppURL(phoneNumber: string, message: string): string {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  }

  generateBulkWhatsAppURLs(phoneNumbers: string[], message: string): Array<{ phoneNumber: string; url: string }> {
    return phoneNumbers.map(phoneNumber => ({
      phoneNumber,
      url: this.generateWhatsAppURL(phoneNumber, message)
    }));
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with country code, assume US (+1)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    return cleaned;
  }

  getTemplates() {
    return this.templates;
  }

  processTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let processedMessage = template.template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
    });

    return processedMessage;
  }
}

export const whatsappService = new WhatsAppService();