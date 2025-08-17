# Cellionyx Website Deployment Guide

## 🔒 Security Cleanup Complete

### Removed Files (Security Vulnerabilities):
- ✅ All test files (test-*.html)
- ✅ All backdoor admin setup files
- ✅ All database manipulation scripts
- ✅ Duplicate/unnecessary files
- ✅ 25+ vulnerable files removed

### Security Improvements:
- ✅ **Firestore Rules**: Now properly secured with role-based access
  - Only authenticated users can read
  - Only admins can delete
  - Only admins and sales reps can create/update
- ✅ **No public write access** to database
- ✅ **Role-based authentication** enforced

---

## 🌐 How to Point Your Domain to This Website

### Option 1: Using a Custom Domain with Firebase Hosting

1. **In Firebase Console:**
   - Go to https://console.firebase.google.com/project/cellionyx-crm/hosting
   - Click "Add custom domain"
   - Enter your domain: `cellionyx.com` or `www.cellionyx.com`

2. **DNS Configuration at Your Domain Provider:**
   Add these DNS records:

   For root domain (cellionyx.com):
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
   
   Type: A  
   Name: @
   Value: 151.101.65.195
   ```

   For www subdomain:
   ```
   Type: CNAME
   Name: www
   Value: cellionyx-crm.web.app
   ```

3. **SSL Certificate:**
   - Firebase automatically provisions SSL certificates
   - Takes 24-48 hours to fully propagate

### Option 2: Using Cloudflare (Recommended for better performance)

1. **Add site to Cloudflare:**
   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers at your registrar

2. **Configure DNS in Cloudflare:**
   ```
   Type: CNAME
   Name: @
   Value: cellionyx-crm.web.app
   Proxy: ON (orange cloud)
   
   Type: CNAME
   Name: www
   Value: cellionyx-crm.web.app
   Proxy: ON (orange cloud)
   ```

3. **SSL Settings in Cloudflare:**
   - SSL/TLS → Full (strict)
   - Always Use HTTPS → ON

---

## 📱 Current Live URLs

- **Firebase Hosting**: https://cellionyx-crm.web.app
- **Admin Portal**: https://cellionyx-crm.web.app/admin-portal.html
- **Sales Portal**: https://cellionyx-crm.web.app/sales-portal/
- **Login**: https://cellionyx-crm.web.app/login.html

---

## 🔑 Admin Access

### Creating Your First Admin:
1. Go to Firebase Console → Authentication
2. Add user with email/password
3. Go to Firestore → users collection
4. Create document with user's UID containing:
   ```json
   {
     "email": "admin@cellionyx.com",
     "role": "Admin",
     "firstName": "Your",
     "lastName": "Name",
     "isActive": true
   }
   ```

### System Features:
- ✅ Complete CRM with prospect management
- ✅ User management with roles
- ✅ Activity tracking
- ✅ International phone support
- ✅ Panel-based UI for all operations
- ✅ Secure authentication

---

## 🚀 Deployment Commands

### Quick Deploy (Everything):
```bash
firebase deploy
```

### Deploy Specific Parts:
```bash
# Just hosting (website files)
firebase deploy --only hosting

# Just functions (backend APIs)
firebase deploy --only functions

# Just security rules
firebase deploy --only firestore:rules
```

---

## 🔧 Maintenance

### Regular Updates:
1. Make changes to files
2. Test locally
3. Run: `firebase deploy --only hosting`

### Database Backup:
```bash
gcloud firestore export gs://cellionyx-crm-backup
```

### Monitor Usage:
- Firebase Console → Usage tab
- Check quotas and limits

---

## 📞 Support Contacts

For DNS issues:
- Check with your domain registrar
- Firebase Support: https://firebase.google.com/support

For application issues:
- Check browser console for errors
- Ensure users have proper roles in Firestore

---

## ✅ Production Checklist

- [x] Remove all test files
- [x] Secure Firestore rules
- [x] Deploy to Firebase
- [x] SSL certificate active
- [ ] Point domain to Firebase hosting
- [ ] Test all features with production domain
- [ ] Set up regular backups
- [ ] Monitor error logs

---

## 🎉 Your System is Ready!

The Cellionyx CRM is now:
- **Secure**: No backdoors or vulnerabilities
- **Clean**: All test files removed
- **Live**: Available at https://cellionyx-crm.web.app
- **Ready**: For your custom domain

Next step: Point your domain following the instructions above!
