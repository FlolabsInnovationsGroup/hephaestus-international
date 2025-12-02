# Domain Setup Guide for efestos.international

## ✅ What's Already Done

The codebase has been updated to support **dynamic branding** based on the domain:

- `hephaestus.international` → Shows "Hephaestus Labs Institute"
- `efestos.international` → Shows "Efestos Labs Institute"

All page titles, metadata, content, and branding automatically adjust based on which URL the visitor uses.

---

## 🔧 Steps to Complete Setup

### 1. Add Domain to Vercel (Required)

Since the Vercel CLI requires additional permissions, please add the domain through the Vercel Dashboard:

1. **Log in to Vercel Dashboard**: https://vercel.com/
2. **Navigate to the project**: `hephaestus-international` (or `frontend`)
3. **Go to Settings → Domains**
4. **Click "Add Domain"**
5. **Enter**: `efestos.international`
6. **Click "Add"**

Vercel will provide DNS configuration instructions.

### 2. Configure DNS

Point your domain registrar's DNS records to Vercel:

**Option A: Use Vercel Nameservers (Recommended)**
- Update nameservers at your domain registrar to Vercel's nameservers
- Vercel will show you the exact nameservers to use

**Option B: Manual DNS Records**
Add these records at your domain registrar:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### 3. Verify Domain

After DNS propagation (can take 24-48 hours):
1. Go back to Vercel → Settings → Domains
2. The domain should show as "Active" with a green checkmark
3. Test both domains:
   - https://hephaestus.international
   - https://efestos.international

---

## 🧪 Testing the Dynamic Branding

Once the domain is active, verify the branding works correctly:

### Test Checklist:

#### On hephaestus.international:
- [ ] Homepage title shows "Hephaestus Labs Institute..."
- [ ] Footer shows "HEPHAESTUS" 
- [ ] About page shows "Hephaestus Labs Institute"
- [ ] Contact email is `info@hephaestus.international`

#### On efestos.international:
- [ ] Homepage title shows "Efestos Labs Institute..."
- [ ] Footer shows "EFESTOS"
- [ ] About page shows "Efestos Labs Institute"  
- [ ] Contact email is `info@efestos.international`

---

## 📧 Email Setup (Optional but Recommended)

To make `info@efestos.international` functional:

1. **Set up email forwarding** at your domain registrar
2. Forward `info@efestos.international` → your main email
3. Or set up a full email hosting solution (Google Workspace, Microsoft 365, etc.)

---

## 🔍 How It Works Technically

The site detects the domain from the request headers:
- Server-side: Uses Next.js `headers()` to get the hostname
- Client-side: Uses `window.location.hostname`
- CMS content: Automatically transforms "Hephaestus" → "Efestos" when needed

All branding is controlled in `frontend/lib/branding.ts` - you can customize:
- Brand names
- Full institute names
- Taglines
- Email addresses
- Website URLs

---

## 🛠️ Troubleshooting

### Domain shows "Invalid Configuration"
- **Cause**: DNS not propagated yet
- **Solution**: Wait 24-48 hours and check again

### Content still shows "Hephaestus" on efestos.international
- **Cause**: Browser cache or CDN cache
- **Solution**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Both domains show the same branding
- **Cause**: Detection not working
- **Solution**: Check browser console for errors, verify deployment is latest

---

## 📞 Need Help?

If you encounter issues:
1. Check the Vercel deployment logs
2. Verify DNS settings with your domain registrar
3. Contact Vercel support for domain-specific issues

---

**Last Updated**: December 2, 2025
