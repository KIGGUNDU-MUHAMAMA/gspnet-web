# Supabase SMTP + Domain Auth Setup

This project now includes frontend signup domain checks in `index.html` to reduce bounced emails.

Use this checklist to complete deliverability setup in Supabase.

## 1) Configure custom SMTP in Supabase

1. Open Supabase Dashboard for project `kwssgfanbntfjdclchfi`.
2. Go to **Authentication -> Email -> SMTP Settings**.
3. Enable custom SMTP and fill:
  - Host
  - Port
  - Username
  - Password
  - Sender name
  - Sender email (must match verified domain)
4. Save and send a test email.

Recommended providers: Resend, SendGrid, Mailgun, Amazon SES.

## 2) Set domain authentication (SPF, DKIM, DMARC)

In your DNS provider, add records from your SMTP provider:

- SPF: allow provider sending servers
- DKIM: provider DKIM CNAME/TXT keys
- DMARC: start with monitoring mode:

```
v=DMARC1; p=none; rua=mailto:you@yourdomain.com; fo=1
```

After stable deliverability, tighten DMARC policy (`quarantine` or `reject`).

## 3) Operational controls to keep bounce rate low

- Do not use fake/test domains in production signups.
- Use one or two real test inboxes for QA.
- Remove stale/unconfirmed test users regularly.
- Monitor bounce and complaint dashboards in your SMTP provider.

## 4) spatial_ref_sys lint note

`public.spatial_ref_sys` is usually extension-owned, so RLS enable may fail with:
`must be owner of table spatial_ref_sys`.

This is expected and does not block app features. Keep app table RLS enforced.