# UploadThing API Specification

## Overview

UploadThing provides simple, fast file uploads for Next.js applications with built-in CDN delivery and file management.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: Token-based authentication

**Environment Variables**:
- `UPLOADTHING_APP_ID` - Application ID
- `UPLOADTHING_SECRET` - Secret key (server-side only)
- `UPLOADTHING_TOKEN` - API token for SDK interactions
- `NEXT_PUBLIC_UPLOADTHING_APP_ID` - App ID (client-side)

---

## Integration Pattern

UploadThing uses a FileRouter pattern for Next.js App Router:

1. **FileRouter** (`core.ts`) - Define upload routes
2. **API Route** (`route.ts`) - Expose FileRouter
3. **Client Components** - Use upload components

---

## File Router Setup

### Core FileRouter

From `app/api/uploadthing/core.ts`:

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Replace with real auth

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount: 4,
    },
  })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      
      if (!user) throw new UploadThingError("Unauthorized");
      
      // Metadata passed to onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      // Save to database, etc.
      await saveFileRecord({
        userId: metadata.userId,
        url: file.url,
        key: file.key
      });
      
      // Return value sent to client
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

### API Route Handler

From `app/api/uploadthing/route.ts`:

```typescript
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

---

## Client-Side Usage

### Generate Typed Components

From `lib/upload-thing.ts`:

```typescript
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
```

### Using Components

```typescript
"use client";

import { UploadButton } from "@/lib/upload-thing";

export function MyUploader() {
  return (
    <UploadButton
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        console.log("Files:", res);
        alert("Upload complete!");
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
```

---

## File Routes Configuration

### Supported File Types

```typescript
f({
  image: { maxFileSize: "4MB", maxFileCount: 1 },
  video: { maxFileSize: "256MB", maxFileCount: 1 },
  audio: { maxFileSize: "8MB", maxFileCount: 1 },
  pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  blob: { maxFileSize: "8MB", maxFileCount: 1 },
})
```

### Size Limits

**Default Limits**:
- Free tier: 2GB total storage
- File size limits: Up to 1GB per file (plan dependent)

**This Project Configuration**:
- Images: 16MB max
- Up to 4 files per upload

---

## File URLs

**CDN URL Format**:
```
https://{APP_ID}.ufs.sh/f/{FILE_KEY}
```

**Example**:
```
https://8cab9nl9vz.ufs.sh/f/abc123.jpg
```

### Presigned URLs (Private Files)

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

const url = await utapi.getSignedURL(fileKey, {
  expiresIn: "1d" // 1 day
});
```

---

## Server API (UTApi)

From `lib/upload-thing-server.ts`:

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Upload from server
export async function uploadFromServer(file: File) {
  const response = await utapi.uploadFiles(file);
  return response.data?.url;
}

// Delete file
export async function deleteFile(fileKey: string) {
  await utapi.deleteFiles(fileKey);
}

// List files
export async function listFiles() {
  const files = await utapi.listFiles();
  return files;
}

// Get file URL
export async function getFileUrl(fileKey: string) {
  const fileData = await utapi.getFileUrls(fileKey);
  return fileData.data[0]?.url;
}
```

---

## Upload Flow

### Client-Side Upload

1. User selects file(s)
2. Client requests presigned URL from UploadThing
3. Client uploads directly to UploadThing CDN
4. `onUploadComplete` callback fires on server
5. Response sent to client

**Benefits**:
- No file data through your server
- Fast CDN delivery
- Automatic optimization

### Server-Side Upload

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function uploadServerFile(buffer: Buffer, filename: string) {
  const file = new File([buffer], filename);
  const response = await utapi.uploadFiles(file);
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  return response.data.url;
}
```

---

## Middleware & Security

### Authentication in Middleware

```typescript
.middleware(async ({ req }) => {
  const user = await getUser(req);
  
  if (!user) {
    throw new UploadThingError("Unauthorized");
  }
  
  // Validate user permissions
  if (!user.canUpload) {
    throw new UploadThingError("Insufficient permissions");
  }
  
  return { userId: user.id };
})
```

### File Validation

```typescript
.middleware(async ({ req, files }) => {
  // Custom validation
  files.forEach(file => {
    if (file.size > 16 * 1024 * 1024) {
      throw new UploadThingError("File too large");
    }
    
    if (!file.type.startsWith('image/')) {
      throw new UploadThingError("Only images allowed");
    }
  });
  
  return { userId: "123" };
})
```

---

## Error Handling

### Upload Errors

```typescript
<UploadButton
  endpoint="imageUploader"
  onUploadError={(error: Error) => {
    if (error.message.includes("FileSizeMismatch")) {
      alert("File is too large");
    } else if (error.message.includes("InvalidFileType")) {
      alert("Invalid file type");
    } else {
      alert(`Upload error: ${error.message}`);
    }
  }}
/>
```

### Server Errors

```typescript
.onUploadComplete(async ({ metadata, file }) => {
  try {
    await saveToDatabase(file.url, metadata.userId);
  } catch (error) {
    console.error("Failed to save file record:", error);
    // File is uploaded but not saved to DB
    // Implement cleanup or retry logic
  }
})
```

---

## File Management

### Deleting Files

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Delete by key
await utapi.deleteFiles("file-key.jpg");

// Delete multiple
await utapi.deleteFiles(["key1.jpg", "key2.jpg"]);

// Delete by URL
await utapi.deleteFiles("https://utfs.io/f/file-key.jpg");
```

### Listing Files

```typescript
const files = await utapi.listFiles({
  limit: 100,
  offset: 0
});

files.forEach(file => {
  console.log(file.key, file.name, file.size, file.uploadedAt);
});
```

---

## Pricing

**Free Tier**:
- 2GB storage
- 2GB bandwidth/month
- Basic features

**Pro Plan** ($20/month):
- 100GB storage
- 100GB bandwidth
- Priority support

**Enterprise**: Custom pricing

---

## Best Practices

### 1. Client-Side Uploads

Always prefer client-side uploads to avoid server bandwidth:

```typescript
// Good - Client uploads directly to UploadThing
<UploadButton endpoint="imageUploader" />

// Avoid - File goes through your server
// (unless you need server-side processing)
```

### 2. Error Boundary

Wrap upload components in error boundary:

```typescript
<ErrorBoundary fallback={<div>Upload failed</div>}>
  <UploadButton endpoint="imageUploader" />
</ErrorBoundary>
```

### 3. Progress Tracking

```typescript
<UploadButton
  endpoint="imageUploader"
  onUploadProgress={(progress) => {
    console.log(`Upload progress: ${progress}%`);
    setUploadProgress(progress);
  }}
/>
```

### 4. File Cleanup

Implement cleanup for unused files:

```typescript
async function cleanupOrphanedFiles() {
  const allFiles = await utapi.listFiles();
  const dbFileKeys = await getFileKeysFromDatabase();
  
  const orphaned = allFiles.filter(
    f => !dbFileKeys.includes(f.key)
  );
  
  if (orphaned.length > 0) {
    await utapi.deleteFiles(orphaned.map(f => f.key));
  }
}
```

---

## Advanced Features

### Custom Upload Endpoint

```typescript
import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const customFileRouter = {
  strictImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      minFileCount: 1,
      acceptedMimeTypes: ["image/jpeg", "image/png"],
    },
  })
    .input(z.object({ tripId: z.string() }))
    .middleware(async ({ input, req }) => {
      // Access input.tripId
      const trip = await getTrip(input.tripId);
      
      if (!trip) {
        throw new UploadThingError("Trip not found");
      }
      
      return { tripId: input.tripId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await updateTripImage(metadata.tripId, file.url);
    }),
} satisfies FileRouter;
```

### SSR Hydration

For better SSR performance, add to root layout:

```typescript
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextSSRPlugin
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        {children}
      </body>
    </html>
  );
}
```

---

## Testing

### Manual Testing

```bash
# Test file upload (requires form data)
curl -X POST "https://uploadthing.com/api/uploadFiles" \
  -H "X-Uploadthing-Api-Key: YOUR_SECRET" \
  -F "files=@./test-image.jpg"
```

### Dashboard Testing

Use UploadThing dashboard to:
- View uploaded files
- Monitor storage usage
- Test file operations
- Check analytics

---

## Troubleshooting

### Common Issues

**1. Authentication Errors**
- Verify `UPLOADTHING_TOKEN` is set
- Check token hasn't expired
- Ensure app ID matches

**2. File Size Errors**
```
Error: FileSizeMismatch
```
- Check `maxFileSize` in FileRouter
- Verify file doesn't exceed limit
- Client-side validation before upload

**3. Type Errors**
```
Error: InvalidFileType
```
- Check accepted MIME types in FileRouter
- Validate file type client-side
- Use correct file input accept attribute

**4. CORS Errors**
- Ensure `hostingUrl` is correct (for iframe solution)
- Check domain is whitelisted
- Verify client-side key is public

---

## Security

### 1. File Validation

Always validate in middleware:

```typescript
.middleware(async ({ files }) => {
  files.forEach(file => {
    // Size check
    if (file.size > 16 * 1024 * 1024) {
      throw new UploadThingError("File too large");
    }
    
    // Type check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new UploadThingError("Invalid file type");
    }
  });
  
  return {};
})
```

### 2. Access Control

Implement user-based access:

```typescript
.middleware(async ({ req }) => {
  const session = await getServerSession(req);
  
  if (!session) {
    throw new UploadThingError("Must be logged in");
  }
  
  // Check upload quota
  const usage = await getUserUploadUsage(session.user.id);
  if (usage > MAX_UPLOADS) {
    throw new UploadThingError("Upload quota exceeded");
  }
  
  return { userId: session.user.id };
})
```

### 3. Content Scanning

For production, implement virus scanning:

```typescript
.onUploadComplete(async ({ file }) => {
  // Scan file
  const isSafe = await scanFile(file.url);
  
  if (!isSafe) {
    await utapi.deleteFiles(file.key);
    await logSecurityEvent("Malicious file detected", file);
  }
})
```

---

## Usage in Project

### File Locations

**Configuration**:
- `app/api/uploadthing/core.ts` - FileRouter definition
- `app/api/uploadthing/route.ts` - Route handler

**Client Utilities**:
- `lib/upload-thing.ts` - Client components
- `lib/upload-thing-server.ts` - Server utilities

### Current Configuration

The project has UploadThing configured for image uploads with:
- Max file size: 16MB
- Max file count: Variable by route
- File types: Images primarily

---

## File Delivery

**CDN**: Files served from UploadThing CDN

**URL Format**: `https://{APP_ID}.ufs.sh/f/{FILE_KEY}`

**Features**:
- Global CDN delivery
- Automatic optimization
- Fast access times
- No egress fees

---

## Monitoring & Analytics

### Dashboard Access

[UploadThing Dashboard](https://uploadthing.com/dashboard)

**Metrics**:
- Total uploads
- Storage usage
- Bandwidth usage
- Error rates
- Upload success rate

### Programmatic Access

```typescript
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Get usage stats
const stats = await utapi.getUsageInfo();
console.log(stats.totalBytes, stats.appTotalBytes);
```

---

## Best Practices

### 1. Optimize Before Upload

```typescript
// Client-side image compression before upload
import imageCompression from 'browser-image-compression';

async function handleImageUpload(file: File) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  const compressedFile = await imageCompression(file, options);
  // Upload compressedFile
}
```

### 2. Error Recovery

```typescript
const MAX_RETRIES = 3;

async function uploadWithRetry(file: File, retries = 0) {
  try {
    return await uploadFile(file);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await delay(1000 * Math.pow(2, retries));
      return uploadWithRetry(file, retries + 1);
    }
    throw error;
  }
}
```

### 3. Cleanup Strategy

```typescript
// Delete old files when updating
async function updateUserAvatar(userId: string, newFile: File) {
  const oldAvatar = await getUserAvatar(userId);
  
  // Upload new
  const newUrl = await uploadFile(newFile);
  
  // Update DB
  await updateUser(userId, { avatar: newUrl });
  
  // Delete old
  if (oldAvatar) {
    await utapi.deleteFiles(extractKeyFromUrl(oldAvatar));
  }
}
```

---

## Pricing & Limits

### Free Tier
- 2GB storage
- 2GB bandwidth/month
- Unlimited uploads
- Basic support

### Pro Tier ($20/month)
- 100GB storage
- 100GB bandwidth
- Priority support
- Advanced analytics

### Enterprise
- Custom storage
- Custom bandwidth
- Dedicated support
- SLA guarantees

**Current Project**: Check dashboard for current plan

---

## Migration & Updates

### Upgrading Package

```bash
npm install uploadthing@latest @uploadthing/react@latest
```

### Breaking Changes

Check [UploadThing Changelog](https://github.com/pingdotgg/uploadthing/releases) for:
- API changes
- New features
- Migration guides

---

## Official Resources

### Documentation
- [Getting Started (App Router)](https://docs.uploadthing.com/getting-started/appdir)
- [File Routes API](https://docs.uploadthing.com/file-routes)
- [Server API Reference](https://docs.uploadthing.com/api-reference/server)
- [Client Components](https://docs.uploadthing.com/api-reference/react)

### Tools
- [Dashboard](https://uploadthing.com/dashboard)
- [GitHub Repository](https://github.com/pingdotgg/uploadthing)
- [Examples](https://github.com/pingdotgg/uploadthing/tree/main/examples)

### Support
- [Discord Community](https://discord.gg/uploadthing)
- [GitHub Issues](https://github.com/pingdotgg/uploadthing/issues)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Vertex AI Imagen](./vertex-ai-imagen.md) - Image generation API
