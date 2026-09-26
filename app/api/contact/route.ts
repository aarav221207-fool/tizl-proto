import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = body;

    // Validation
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

    // Use admin client for persistence to support_tickets and audit_logs
    const adminClient = isSupabaseAdminConfigured ? createAdminClient() : await createClient();

    // Check if user is logged in
    let userProfileId: string | null = null;
    try {
      const userClient = await createClient();
      const { data: { user } } = await userClient.auth.getUser();
      if (user?.id) {
        userProfileId = user.id;
      }
    } catch {
      // Guest submission is expected on public contact form
    }

    // If guest, find admin or fallback profile to satisfy the database profile_id foreign key
    if (!userProfileId) {
      const { data: adminProfiles } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminProfiles && adminProfiles.length > 0) {
        userProfileId = adminProfiles[0].id;
      } else {
        const { data: anyProfile } = await adminClient
          .from('profiles')
          .select('id')
          .limit(1);
        userProfileId = anyProfile?.[0]?.id || null;
      }
    }

    if (!userProfileId) {
      throw new Error('System initialization error: No user profile context available.');
    }

    // Generate unique human-readable ticket number
    const ticketRand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketTimestamp = Date.now().toString(36).toUpperCase();
    const ticketNumber = `TIZL-${ticketTimestamp}-${ticketRand}`;

    const formattedDescription = [
      `Sender Name: ${trimmedName}`,
      `Sender Email: ${trimmedEmail}`,
      `Sender Phone: ${trimmedPhone || 'Not provided'}`,
      `Topic: ${inquirySubject}`,
      `Submitted: ${new Date().toISOString()}`,
      `----------------------------------------`,
      `Message:`,
      trimmedMessage,
    ].join('\n');

    const { data: ticket, error: ticketError } = await adminClient
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        profile_id: userProfileId,
        subject: `[Contact] ${inquirySubject} — ${trimmedName}`,
        description: formattedDescription,
        status: 'open',
        priority: 'medium',
      })
      .select('id, ticket_number, status, created_at')
      .single();

    if (ticketError) {
      console.error('[Contact API] Failed to insert support ticket:', ticketError);
      throw ticketError;
    }

    // Record audit log
    try {
      await adminClient.from('audit_logs').insert({
        profile_id: userProfileId,
        action: 'CONTACT_FORM_SUBMISSION',
        table_name: 'support_tickets',
        record_id: ticket.id,
        new_data: {
          ticket_number: ticket.ticket_number,
          sender_name: trimmedName,
          sender_email: trimmedEmail,
          sender_phone: trimmedPhone,
          subject: inquirySubject,
        },
      });
    } catch (auditErr) {
      console.warn('[Contact API] Non-fatal audit log failure:', auditErr);
    }

    return successResponse({
      ticketNumber: ticket.ticket_number,
      message: 'Thank you for reaching out! Your support ticket has been registered. Our team will review your message and reply via email within a few hours.',
      createdAt: ticket.created_at,
    });
  } catch (err: any) {
    console.error('[Contact API] Unexpected error:', err);
    return errorResponse(err);
  }
}
