import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailParams {
  to: string;
  name?: string;
  verificationToken: string;
}

/**
 * Send email verification email to user
 * @param params - Email parameters including recipient, name, and verification token
 * @returns Promise resolving to the email sending result
 */
export async function sendVerificationEmail({
  to,
  name,
  verificationToken
}: SendVerificationEmailParams) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set');
    throw new Error('Email service is not properly configured');
  }

  // Check if app URL is configured
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('NEXT_PUBLIC_APP_URL environment variable is not set');
    throw new Error('Application URL is not properly configured');
  }

  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`;
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev',
      to,
      subject: 'Verify your email address',
      text: `Hello ${name || 'there'},

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The AI Tutor Team`,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send email with custom content
 * @param params - Email parameters
 * @returns Promise resolving to the email sending result
 */
export async function sendEmail({
  to,
  subject,
  text,
  from
}: {
  to: string;
  subject: string;
  text: string;
  from?: string;
}) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set');
    throw new Error('Email service is not properly configured');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev',
      to,
      subject,
      text,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
