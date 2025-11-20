# Quick Start - Usage Analytics Testing

## ✅ Setup Complete

Your Directus instance is now running with test data and the Usage Analytics extension installed.

## 🌐 Access Directus

**URL**: http://localhost:8055

**Credentials**:
- Email: `admin@example.com`
- Password: `admin123`

## 📊 Finding the Extension

After logging in, the **Usage Analytics** extension should appear in one of two locations:

### Option 1: Main Navigation (Module)
Look for "Usage Analytics" with a 📊 analytics icon in the left sidebar navigation, between the main menu items.

### Option 2: Settings Panel
If not in the main navigation:
1. Click the **Settings** icon (gear ⚙️) in the left sidebar
2. Scroll down to find **Usage Analytics**

## 🗂️ Test Data Available

Your Directus instance now contains:

### Custom Collections
- **Posts**: 6 articles (5 published, 1 draft)
- **Pages**: 3 static pages (About, Contact, Privacy)
- **Categories**: 4 categories (Technology, Business, Lifestyle, Travel)
- **Authors**: 3 content creators

### System Collections
- **directus_activity**: ~43 activity log entries
- **directus_users**: Admin user
- **directus_files**: Empty (can upload files to generate more activity)

### Activity Statistics
Current activity data includes:
- **Total Requests**: 43
- **Actions**: 41 create operations, 2 login events
- **Collections**: Data distributed across posts, categories, authors, pages
- **Time Range**: Last 30 minutes (from seeding script)

## 🧪 Testing the Extension

### 1. Collection Storage Analysis (User Story 1)

**What to test**:
- Navigate to the **Collection Storage** tab
- View row counts for all collections
- Check bar chart visualization
- Toggle "Top 10 only" filter
- Verify percentage calculations
- Click refresh to reload data

**Expected Results**:
```
Posts: 6 rows
Categories: 4 rows
Authors: 3 rows
Pages: 3 rows
System collections: Various row counts
```

### 2. API Activity Analysis (User Story 2)

**What to test**:
- Navigate to the **API Activity** tab
- Select different date ranges (24h, 7d, 30d)
- View activity by collection
- View activity by action (create, read, update, delete)
- Toggle chart types (bar ↔ pie)
- Check statistics cards (total requests, unique users, unique IPs)
- Enable/disable "Top 10" filter

**Expected Results**:
```
Total Requests: 43
Unique Users: 1
Unique IPs: 1

By Collection:
- directus_fields: 21 requests (48.8%)
- posts: 6 requests (14%)
- categories: 4 requests (9.3%)
- ...

By Action:
- create: 41 requests (95.3%)
- login: 2 requests (4.7%)
```

### 3. IP-Based Traffic Analysis (User Story 3)

**What to test**:
- View top IPs list
- Filter activity by specific IP address
- Check IP-specific statistics
- Clear IP filter

**Expected Results**:
- Single IP address (Docker container IP or 172.x.x.x)
- All 43 requests from this IP

## 🔄 Generating More Activity

To create more varied test data and activity logs:

### Via Directus Admin UI

1. **Create new items**:
   - Go to Content → Posts → Create new post
   - Go to Content → Pages → Create new page

2. **Edit existing items**:
   - Open any post or page
   - Make changes and save
   - This generates UPDATE activity

3. **Delete items**:
   - Select an item
   - Delete it
   - This generates DELETE activity

4. **Upload files**:
   - Go to File Library
   - Upload images or documents
   - This generates CREATE activity for `directus_files`

5. **Log out and in**:
   - Generates LOGIN activity

### Via API Script

Run the seed script again to add more activity:

```bash
node seed-data.js
```

Or create a custom activity generator:

```bash
curl -X POST http://localhost:8055/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Save the token and use it for requests
curl http://localhost:8055/items/posts?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting

### Extension Not Visible

1. **Check Docker logs**:
   ```bash
   docker-compose logs directus | grep -i extension
   ```
   Should show: `INFO: Loaded extensions: directus-extension-usage-analytics`

2. **Verify build output**:
   ```bash
   ls -lh dist/
   # Should show api.js (~79KB) and app.js (~244KB)
   ```

3. **Restart Directus**:
   ```bash
   docker-compose restart directus
   ```

4. **Check user role**:
   - Extension only shows for admin users
   - Verify you're logged in as admin@example.com

### Empty Charts

1. **Verify data exists**:
   ```bash
   curl http://localhost:8055/usage-analytics-api/collections
   curl http://localhost:8055/usage-analytics-api/activity
   ```

2. **Check browser console** (F12) for errors

3. **Adjust date range** - Activity may be outside current filter range

### API Errors

1. **Check Directus is running**:
   ```bash
   docker-compose ps
   # directus-app should be "Up"
   ```

2. **Check database connection**:
   ```bash
   docker-compose logs database
   # Should show successful connections
   ```

3. **Verify PostgreSQL**:
   ```bash
   docker exec -it directus-db psql -U directus -c "SELECT COUNT(*) FROM directus_activity;"
   ```

## 📈 Performance Testing

With the current data (small dataset), all queries should be fast (<100ms).

To test with larger datasets:

1. **Add database indexes** (see TESTING.md)
2. **Generate more activity** (run seed script multiple times)
3. **Monitor query times** in the extension UI (displayed in footer)

## 📋 Next Steps

1. ✅ **Extension is installed** - Working correctly
2. ✅ **Test data is loaded** - 4 collections, 16 items, 43 activity entries
3. 🎯 **Test all features** - Follow testing checklist above
4. 📸 **Take screenshots** - For documentation (optional)
5. 🚀 **Build for production** - When ready to publish

## 🆘 Support

For detailed testing procedures, see [TESTING.md](./TESTING.md)

For issues or questions:
- Check Directus logs: `docker-compose logs -f directus`
- Review [Directus Extensions Docs](https://docs.directus.io/extensions/)
- Open an issue on GitHub

---

**Happy Testing! 🎉**
