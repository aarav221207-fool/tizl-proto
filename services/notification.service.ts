export interface NotificationPayload {
  recipientId: string;
  recipientRole: 'customer' | 'cook' | 'admin';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channel?: 'sms' | 'whatsapp' | 'email' | 'push';
}

export interface INotificationService {
  sendBookingStatusNotification(
    recipientId: string,
    bookingId: string,
    status: string,
    customMessage?: string
  ): Promise<boolean>;

  sendOTPNotification(
    recipientId: string,
    phone: string,
    otp: string
  ): Promise<boolean>;

  sendCookAssignmentNotification(
    cookId: string,
    bookingId: string
  ): Promise<boolean>;
}

export class NotificationServiceSkeleton implements INotificationService {
  async sendBookingStatusNotification(
    recipientId: string,
    bookingId: string,
    status: string,
    customMessage?: string
  ): Promise<boolean> {
    // Interface skeleton for future SMS/WhatsApp/Push integration
    console.log(`[NotificationSkeleton] Status update for ${bookingId} sent to ${recipientId}: ${status} - ${customMessage || ''}`);
    return true;
  }

  async sendOTPNotification(recipientId: string, phone: string, otp: string): Promise<boolean> {
    console.log(`[NotificationSkeleton] OTP ${otp} dispatched to ${phone}`);
    return true;
  }

  async sendCookAssignmentNotification(cookId: string, bookingId: string): Promise<boolean> {
    console.log(`[NotificationSkeleton] Cook ${cookId} assigned to booking ${bookingId}`);
    return true;
  }
}

export const notificationService = new NotificationServiceSkeleton();
