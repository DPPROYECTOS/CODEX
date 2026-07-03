# UAD Consultation App - Technical Architecture

## 1. Ecosystem Overview

*   **Source of Truth (Master):** Existing UAD App (Supabase). Handles CRUD, editing, and file storage.
*   **Consultation App (Slave):** New UAD App (Appwrite). Read-only for end-users, optimized for speed and strict permission segmentation.

## 2. Database Schema (Appwrite)

### Collection: `users`
*   `$id`: String (Unique)
*   `name`: String
*   `email`: String (Index)
*   `area`: Enum/String (e.g., "HR", "IT", "OPERATIONS") - **CRITICAL FOR SECURITY**
*   `privacy_accepted`: Boolean
*   `privacy_accepted_at`: DateTime
*   `role`: String (e.g., "viewer")

### Collection: `procedures_mirror`
*   `$id`: String (Matches Supabase ID)
*   `external_id`: String (Supabase ID reference)
*   `name`: String
*   `code`: String (e.g., "IT-001")
*   `area`: String (Index)
*   `version`: String
*   `status`: Enum ("active", "review", "obsolete")
*   `description`: String (Markdown/HTML)
*   `url_pdf`: String (URL)
*   `url_video`: String (URL)
*   `updated_at`: DateTime
*   `responsible_person`: String
*   `history`: String (JSON Stringified array of versions)

### Collection: `access_logs`
*   `user_id`: String
*   `procedure_id`: String
*   `accessed_at`: DateTime
*   `device_info`: String

## 3. Synchronization Flow (Supabase -> Appwrite)

This logic ensures the Consultation App is always up to date without manual intervention.

### Step A: Supabase Webhooks
Configure Database Webhooks in Supabase to trigger on the `procedures` table for events: `INSERT`, `UPDATE`, `DELETE`.

Target URL: An Appwrite Function endpoint (e.g., `https://cloud.appwrite.io/v1/functions/{functionId}/executions`)

### Step B: Appwrite Function (Node.js)
The receiver script normalizes data and updates the `procedures_mirror` collection.

```javascript
// Pseudo-code for Appwrite Function
const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  const client = new sdk.Client();
  const db = new sdk.Databases(client);
  
  // 1. Parse Payload from Supabase
  const payload = JSON.parse(req.payload); // Supabase sends { type: 'UPDATE', record: { ... } }
  const { type, record, old_record } = payload;

  try {
    if (type === 'INSERT' || type === 'UPDATE') {
      // Upsert logic
      const docData = {
        name: record.title,
        area: record.department_id, // Map Supabase ID to Appwrite Area String
        status: record.is_active ? 'active' : 'obsolete',
        url_pdf: record.pdf_url,
        // ... map other fields
      };

      // Try to update, if fails, create
      await db.updateDocument(DB_ID, COL_PROCEDURES, record.id, docData)
        .catch(() => db.createDocument(DB_ID, COL_PROCEDURES, record.id, docData));

      // Notification Logic
      if (type === 'UPDATE') {
         // Send push notification to users of this area via Appwrite Messaging
      }
    } 
    else if (type === 'DELETE') {
      await db.deleteDocument(DB_ID, COL_PROCEDURES, old_record.id);
    }
  } catch (err) {
    console.error("Sync failed", err);
  }
};
```

## 4. Security & Permissions

1.  **Authentication:** Appwrite Email/Password Session.
2.  **Document Security:**
    *   Set Collection Permissions to `read("any")` is **FALSE**.
    *   We use a **Backend Filtering** approach in the UI (shown in this code) combined with Appwrite Team/Label permissions if extremely high security is needed.
    *   *Implementation:* The `getProcedures` API call MUST always include `Query.equal('area', user.area)`.

## 5. Deployment
*   **Frontend:** Vercel / Netlify.
*   **Backend:** Appwrite Cloud or Self-Hosted.
