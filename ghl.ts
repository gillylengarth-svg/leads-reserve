import axios, { AxiosInstance } from 'axios';

interface GHLContact {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  source: string;
  tags?: string[];
  customField?: Record<string, any>;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface GHLOpportunity {
  contactId: string;
  pipelineId: string;
  pipelineStageId: string;
  name: string;
  monetaryValue: number;
  assignedTo?: string;
  status?: string;
}

interface GHLSMSMessage {
  type: 'SMS';
  contactId: string;
  message: string;
}

export class GoHighLevelClient {
  private client: AxiosInstance;
  private apiKey: string;
  private locationId: string;

  constructor(apiKey?: string, locationId?: string) {
    this.apiKey = apiKey || process.env.GHL_API_KEY || '';
    this.locationId = locationId || process.env.GHL_LOCATION_ID || '';
    
    this.client = axios.create({
      baseURL: process.env.GHL_API_URL || 'https://rest.gohighlevel.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Create a contact in GoHighLevel
   */
  async createContact(data: GHLContact): Promise<{
    success: boolean;
    contactId?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await this.client.post('/contacts', {
        ...data,
        locationId: this.locationId,
      });

      return {
        success: true,
        contactId: response.data.contact?.id || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      console.error('GHL Create Contact Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Update existing contact
   */
  async updateContact(contactId: string, updates: Partial<GHLContact>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.client.put(`/contacts/${contactId}`, updates);
      return { success: true };
    } catch (error: any) {
      console.error('GHL Update Contact Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<{
    success: boolean;
    contact?: any;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/contacts/${contactId}`);
      return {
        success: true,
        contact: response.data.contact || response.data,
      };
    } catch (error: any) {
      console.error('GHL Get Contact Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create an opportunity (sales pipeline)
   */
  async createOpportunity(data: GHLOpportunity): Promise<{
    success: boolean;
    opportunityId?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await this.client.post('/opportunities', data);

      return {
        success: true,
        opportunityId: response.data.opportunity?.id || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      console.error('GHL Create Opportunity Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Update opportunity status
   */
  async updateOpportunity(opportunityId: string, updates: Partial<GHLOpportunity>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.client.put(`/opportunities/${opportunityId}`, updates);
      return { success: true };
    } catch (error: any) {
      console.error('GHL Update Opportunity Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Send SMS to contact
   */
  async sendSMS(data: GHLSMSMessage): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.client.post('/conversations/messages', data);
      return { success: true };
    } catch (error: any) {
      console.error('GHL Send SMS Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Add tags to contact
   */
  async addTags(contactId: string, tags: string[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.client.post(`/contacts/${contactId}/tags`, { tags });
      return { success: true };
    } catch (error: any) {
      console.error('GHL Add Tags Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Add note to contact
   */
  async addNote(contactId: string, note: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.client.post(`/contacts/${contactId}/notes`, {
        body: note,
      });
      return { success: true };
    } catch (error: any) {
      console.error('GHL Add Note Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

// Export singleton instance
export const ghlClient = new GoHighLevelClient();
