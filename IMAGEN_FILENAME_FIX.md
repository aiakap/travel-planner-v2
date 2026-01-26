# Imagen Filename Fix

## Issue

The image preview wasn't showing because the API was returning an incorrect filename.

### Root Cause

The Vertex AI client adds a timestamp suffix when saving images:
- **Input filename**: `admin-test-{uuid}.png`
- **Actual saved file**: `admin-test-{uuid}.png_1769455603293.png`

The API was returning the original filename instead of the actual saved filename with timestamp.

## Fix

Updated `app/api/admin/test/imagen-generate/route.ts`:

### Before
```typescript
const actualFilename = result.outputPath?.split("/").pop() || filename;
```

**Problem**: Used `result.outputPath` which doesn't exist (should be `result.imagePath`)

### After
```typescript
// Check if generation was successful
if (!result.success || !result.imagePath) {
  return NextResponse.json(
    {
      error: result.error?.message || "Image generation failed",
      details: result.error?.details,
    },
    { status: 500 }
  );
}

// Get the actual filename from the image path
const actualFilename = result.imagePath.split("/").pop() || filename;
```

**Fixed**:
1. Added error handling for failed generation
2. Use `result.imagePath` (correct property name)
3. Properly extract timestamped filename from full path

## How It Works

### Filename Flow

1. **Request**: Generate image with prompt
2. **API creates**: `admin-test-{uuid}.png`
3. **Vertex client saves**: `admin-test-{uuid}.png_1769455603293.png`
4. **Client returns**: `imagePath: "/full/path/admin-test-{uuid}.png_1769455603293.png"`
5. **API extracts**: `admin-test-{uuid}.png_1769455603293.png` (via `.split("/").pop()`)
6. **API returns**: `imageUrl: "/api/imagen/output/admin-test-{uuid}.png_1769455603293.png"`
7. **Frontend loads**: Image displays correctly ✅

## Testing

```bash
# Test image serving with correct filename
curl -I http://localhost:3000/api/imagen/output/admin-test-76a29b42-ec6b-445f-96ed-5365311e4a61.png_1769455603293.png
# Should return: HTTP/1.1 200 OK
```

## Result

✅ Image preview now displays correctly
✅ Download button works
✅ Proper error handling added
✅ Correct filename mapping

---

**Status**: ✅ FIXED
**File Modified**: `app/api/admin/test/imagen-generate/route.ts`
