# Resend Email Service Setup Guide

This guide explains how to set up Resend for email verification in the AI Tutor platform.

## 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your API Key

1. Log into your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "AI Tutor Production" or "AI Tutor Development")
5. Select "Sending access" permission (sufficient for email verification)
6. Copy the API key (starts with `re_`)

## 3. Configure Domain (Optional but Recommended)

For production, you should use your own domain instead of the default `resend.dev` domain:

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow the DNS configuration instructions
5. Verify the domain

## 4. Environment Variables

Add these variables to your `.env` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com  # or noreply@resend.dev for testing
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change for production
```

## 5. Database Migration

Run the email verification tokens table migration:

```bash
# Connect to your Neon database and run:
psql $DATABASE_URL -f scripts/add-verification-tokens-table.sql
```

## 6. Testing Email Verification

1. Start your development server: `npm run dev`
2. Register a new user account
3. Check your email inbox for the verification email
4. Click the verification link
5. Try logging in with the verified account

## 7. Production Considerations

### Domain Setup
- Use your own domain for professional emails
- Configure SPF, DKIM, and DMARC records
- Verify domain ownership in Resend

### Rate Limits
- Free tier: 100 emails/day, 3,000 emails/month
- Monitor usage in Resend dashboard
- Upgrade plan if needed

### Security
- Store API key securely in environment variables
- Use different API keys for development and production
- Regularly rotate API keys

### Monitoring
- Monitor email delivery rates in Resend dashboard
- Set up webhooks for delivery notifications (optional)
- Log email sending errors for debugging

## 8. Troubleshooting

### Common Issues

**Email not received:**
- Check spam/junk folder
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for delivery status
- Ensure RESEND_FROM_EMAIL is properly configured

**Verification link not working:**
- Check NEXT_PUBLIC_APP_URL is correct
- Verify database connection
- Check if token has expired (24-hour limit)

**API errors:**
- Verify API key permissions
- Check rate limits in Resend dashboard
- Ensure domain is verified (if using custom domain)

### Debug Mode

Enable debug logging by adding to your `.env`:
```bash
DEBUG=resend:*
```

## 9. API Endpoints

The email verification system includes these endpoints:

- `POST /api/auth/register` - Creates user and sends verification email
- `GET /api/auth/verify-email?token=xxx` - Verifies email address
- `POST /api/auth/resend-verification` - Resends verification email
- `POST /api/auth/login` - Checks email verification before login

## 10. Email Templates

The current implementation uses plain text emails. To customize:

1. Edit the email content in `lib/email.ts`
2. Consider using React Email for HTML templates
3. Add your branding and styling

For more advanced email templates, see the [React Email documentation](https://react.email/).
