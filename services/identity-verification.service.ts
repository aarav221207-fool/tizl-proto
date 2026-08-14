import { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Interface representing the required methods for any authorized Identity Verification Provider.
 * This ensures that whether we use DigiLocker, Aadhaar API, or another KYC vendor in the future,
 * the architecture remains decoupled.
 */
export interface IdentityProvider {
  /**
   * Generates the URL/parameters required to redirect the partner to the provider's secure verification portal.
   */
  startVerification(userId: string, redirectUrl: string): Promise<{ verificationUrl: string; providerReference: string }>;
  
  /**
   * Handles the secure callback/webhook from the provider after the user completes the flow.
   * Validates the payload and extracts identity information.
   */
  handleCallback(payload: any, signature: string): Promise<VerificationResult>;
}

export type VerificationResult = {
  status: 'verified' | 'rejected' | 'pending';
  providerReference: string;
  verifiedAt?: string;
  rejectionReason?: string;
};

class PlaceholderIdentityProvider implements IdentityProvider {
  async startVerification(userId: string, redirectUrl: string) {
    // In a real implementation, this would call the Digilocker/Aadhaar API
    // to generate a secure session token and redirect URL.
    
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
       throw new Error('PROVIDER CONFIGURATION REQUIRED: Missing external API credentials.');
    }
    
    // For now, simulate a redirect back with a placeholder reference
    const dummyRef = `req_${Date.now()}`;
    const cbUrl = new URL(redirectUrl);
    cbUrl.searchParams.set('ref', dummyRef);
    cbUrl.searchParams.set('status', 'simulated_success'); // Only for dev, real provider uses secure callbacks
    
    return {
      verificationUrl: cbUrl.toString(),
      providerReference: dummyRef,
    };
  }

  async handleCallback(payload: any, signature: string): Promise<VerificationResult> {
    // In production, verify the cryptographic signature from the provider.
    if (!payload.ref) {
      throw new Error('Invalid provider payload');
    }

    if (payload.status === 'simulated_success') {
      return {
        status: 'verified',
        providerReference: payload.ref,
        verifiedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'rejected',
      providerReference: payload.ref,
      rejectionReason: 'Verification failed or was cancelled',
    };
  }
}

export const identityVerificationService = {
  // Configured provider
  provider: new PlaceholderIdentityProvider() as IdentityProvider,

  /**
   * Initiates the verification process for a partner
   */
  async initializeVerification(supabase: SupabaseClient, userId: string, redirectUrl: string) {
    // 1. Check if user is a cook
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'cook') {
      throw new Error('Only partners can undergo this verification.');
    }

    // 2. Start provider flow
    const { verificationUrl, providerReference } = await this.provider.startVerification(userId, redirectUrl);

    // 3. Store reference securely in DB (e.g., in cook_details or a verification_sessions table)
    // For now we will update profile status to 'verification_started'
    await supabase
      .from('profiles')
      .update({ status: 'verification_started' })
      .eq('id', userId);

    return { verificationUrl };
  },

  /**
   * Process the return payload from the provider
   */
  async processCallback(supabase: SupabaseClient, userId: string, payload: any, signature: string) {
    const result = await this.provider.handleCallback(payload, signature);

    // Update the profile based on the provider's authoritative result
    if (result.status === 'verified') {
      await supabase
        .from('profiles')
        .update({ status: 'verified', updated_at: new Date().toISOString() })
        .eq('id', userId);
    } else if (result.status === 'rejected') {
      await supabase
        .from('profiles')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return result;
  },

  /**
   * Safely get the verification status of a cook without exposing credentials.
   */
  async getVerificationStatus(supabase: SupabaseClient, userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', userId)
      .single();

    if (error || !profile) return null;
    return profile.status;
  }
};
