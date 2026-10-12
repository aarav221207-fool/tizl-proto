import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface VerificationResult {
  status: 'verified' | 'rejected' | 'pending';
  providerReference: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface IdentityProvider {
  isConfigured(): boolean;
  startVerification(userId: string, redirectUrl: string): Promise<{ verificationUrl: string; providerReference: string }>;
  handleCallback(payload: Record<string, string>, signature: string): Promise<VerificationResult>;
}

export class DigiLockerIdentityProvider implements IdentityProvider {
  private get clientId(): string {
    return process.env.DIGILOCKER_CLIENT_ID || '';
  }

  private get clientSecret(): string {
    return process.env.DIGILOCKER_CLIENT_SECRET || '';
  }

  isConfigured(): boolean {
    return Boolean(
      this.clientId &&
      !this.clientId.includes('placeholder') &&
      this.clientSecret &&
      !this.clientSecret.includes('placeholder')
    );
  }

  async startVerification(userId: string, redirectUrl: string) {
    if (!this.isConfigured()) {
      throw new Error(
        'DIGILOCKER_NOT_CONFIGURED: DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET are required server environment variables for authenticating partner identity verification.'
      );
    }

    const stateToken = crypto.randomBytes(24).toString('hex');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUrl,
      state: userId + ':' + stateToken,
      scope: 'org.digitallocker.aadhaar',
    });

    return {
      verificationUrl: 'https://digilocker.gov.in/public/oauth2/1/authorize?' + params.toString(),
      providerReference: stateToken,
    };
  }

  async handleCallback(payload: Record<string, string>, signature: string): Promise<VerificationResult> {
    if (!this.isConfigured()) {
      throw new Error('DIGILOCKER_NOT_CONFIGURED: External credentials required.');
    }

    if (!payload.code) {
      return {
        status: 'rejected',
        providerReference: payload.state || '',
        rejectionReason: payload.error_description || 'Authorization code was not provided by identity gateway',
      };
    }

    if (!signature || signature === 'simulated_signature') {
      throw new Error('INVALID_SIGNATURE: Provider callback must contain a valid cryptographic HMAC signature.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(payload.code + (payload.state || ''))
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      throw new Error('SIGNATURE_VERIFICATION_FAILED: Callback signature does not match provider secret.');
    }

    return {
      status: 'pending',
      providerReference: payload.state || '',
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const identityVerificationService = {
  provider: new DigiLockerIdentityProvider(),

  isConfigured(): boolean {
    return this.provider.isConfigured();
  },

  async initializeVerification(supabase: SupabaseClient, userId: string, redirectUrl: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'cook') {
      throw new Error('Only registered partner cooks can undergo identity verification.');
    }

    if (!this.provider.isConfigured()) {
      throw new Error(
        'DigiLocker / Aadhaar identity verification is not configured in server environment variables (DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET).'
      );
    }

    const { verificationUrl, providerReference } = await this.provider.startVerification(userId, redirectUrl);

    await supabase
      .from('profiles')
      .update({ status: 'verification_started', updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { verificationUrl, providerReference };
  },

  async processCallback(supabase: SupabaseClient, userId: string, payload: Record<string, string>, signature: string) {
    if (!this.provider.isConfigured()) {
      throw new Error('Identity verification provider credentials are not configured.');
    }

    const result = await this.provider.handleCallback(payload, signature);

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
    } else if (result.status === 'pending') {
      await supabase
        .from('profiles')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return result;
  },

  async getVerificationStatus(supabase: SupabaseClient, userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', userId)
      .single();

    if (error || !profile) return null;
    return profile.status;
  },
};
