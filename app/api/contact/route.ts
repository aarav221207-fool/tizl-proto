import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid name (at least 2 characters).' } },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' } },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a message with at least 10 characters.' } },
        { status: 400 }
      );
    }

    const trimmedName = name.trim().slice(0, 100);
    const trimmedEmail = email.trim().toLowerCase().slice(0, 150);
    const trimmedPhone = phone ? String(phone).trim().slice(0, 25) : '';
    const inquirySubject = subject && typeof subject === 'string' ? subject.trim().slice(0, 120) : 'General Inquiry';
    const trimmedMessage = message.trim().slice(0, 3000);

    const ticketRand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketTimestamp = Date.now().toString(36).toUpperCase();
    const ticketNumber = 'TIZL-' + ticketTimestamp + '-' + ticketRand;

    try {
      const dbClient = isSupabaseAdminConfigured ? createAdminClient() : await createClient();
      let userProfileId: string | null = null;
      try {
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();
        if (user?.id) {
          userProfileId = user.id;
        }
      } catch {
        // Guest inquiry
      }

      if (!userProfileId) {
        const { data: existingProfiles } = await dbClient
          .from('profiles')
          .select('id')
          .limit(1);
        if (existingProfiles && existingProfiles.length > 0) {
          userProfileId = existingProfiles[0].id;
        }
      }

      const formattedDescription = 'Sender: ' + trimmedName + ' <' + trimmedEmail + '> Phone: ' + (trimmedPhone || 'N/A') + '\nTopic: ' + inquirySubject + '\n\nMessage:\n' + trimmedMessage;

      if (userProfileId) {
        const { error: ticketError } = await dbClient
          .from('support_tickets')
          .insert({
            ticket_number: ticketNumber,
            profile_id: userProfileId,
            subject: '[Contact] ' + inquirySubject + ' — ' + trimmedName,
            description: formattedDescription,
            status: 'open',
            priority: 'medium',
          });
        if (ticketError) {
          console.warn('[Contact API] support_tickets table note:', ticketError.message);
        }

        try {
          await dbClient.from('audit_logs').insert({
            profile_id: userProfileId,
            action: 'CONTACT_FORM_SUBMISSION',
            table_name: 'support_tickets',
            new_data: {
              ticket_number: ticketNumber,
              sender_name: trimmedName,
              sender_email: trimmedEmail,
              sender_phone: trimmedPhone,
              subject: inquirySubject,
            },
          });
        } catch {}
      }
    } catch (dbErr) {
      console.warn('[Contact API] DB notice:', dbErr);
    }

    return successResponse({
      ticketNumber,
      message: 'Thank you for reaching out! Your support inquiry has been received. Our concierge team will review your message and reply via email within a few hours.',
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Contact API] Unexpected error:', err);
    return errorResponse(err);
  }
}
