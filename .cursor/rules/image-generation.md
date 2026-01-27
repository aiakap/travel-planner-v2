# Image Generation System Rules

> **READ BEFORE MODIFYING IMAGE GENERATION CODE**
> 
> Full documentation: [`docs/IMAGE_GENERATION_SYSTEM.md`](../../docs/IMAGE_GENERATION_SYSTEM.md)

## Critical Path Rules

### ⚠️ ALL paths MUST be consistent across these files:

1. **Generator** (`archived/image-generator/lib/vertex-ai-client.ts` ~line 222):
   ```typescript
   const outputPath = join(process.cwd(), "app", "api", "imagen", "output", outputFilename);
   ```

2. **Server** (`app/api/imagen/output/[filename]/route.ts` ~line 22):
   ```typescript
   const imagePath = join(process.cwd(), "app", "api", "imagen", "output", filename);
   ```

3. **API Response** (`app/api/admin/test/imagen-generate/route.ts` ~line 62):
   ```typescript
   const imageUrl = `/api/imagen/output/${actualFilename}`;
   ```

### ❌ NEVER use these paths:
- `image-generator/output/` - Archived, causes 404
- `archived/image-generator/output/` - Reference only
- Any path other than `app/api/imagen/output/`

## Environment Rules

### Gemini 3 Pro Image Requirements:
- ✅ `GOOGLE_CLOUD_LOCATION=global` (REQUIRED)
- ❌ DO NOT use `us-central1` or other regions
- Model is ONLY available via global endpoint

### Endpoint Construction:
```typescript
// Automatically handles global vs regional
const baseUrl = this.location === 'global' 
  ? 'https://aiplatform.googleapis.com'
  : `https://${this.location}-aiplatform.googleapis.com`;
```

## Code Review Checklist

Before committing changes to image generation:

- [ ] All paths use `app/api/imagen/output/`
- [ ] No references to `image-generator/output/`
- [ ] Gemini uses `global` location
- [ ] Prompt templates don't duplicate `travelContext`
- [ ] Test on `/admin/apis/imagen` before production
- [ ] Update [`docs/IMAGE_GENERATION_SYSTEM.md`](../../docs/IMAGE_GENERATION_SYSTEM.md) if architecture changes

## Common Bugs to Avoid

1. **Path Mismatch** → Image generates but 404 in UI
2. **Wrong Location** → 404 from Vertex AI API
3. **Duplicate Context** → Prompt exceeds 4000 char limit
4. **Missing Directory** → ENOENT error during save

## Testing Command

```bash
# Verify no old paths remain
grep -r "image-generator/output" . --include="*.ts" --exclude-dir=node_modules --exclude-dir=archived

# Should return NO results. If it finds any, those need to be updated.
```

## Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Admin Test | `/admin/apis/imagen` | Test image generation |
| Queue System | `/manage` | Bulk regeneration |
| Generator Client | `archived/image-generator/lib/vertex-ai-client.ts` | Core generation |
| Serving Route | `app/api/imagen/output/[filename]/route.ts` | Serve images |
| Main Logic | `lib/image-generation.ts` | Orchestration |
| Prompts | `prisma/seed.js` | Template definitions |

## Emergency Fixes

If images stop working:

1. Check dev server logs for path errors
2. Verify `.env` → `GOOGLE_CLOUD_LOCATION=global`
3. Test single image on `/admin/apis/imagen`
4. Check `ls -la app/api/imagen/output/` for files
5. Consult [`docs/IMAGE_GENERATION_SYSTEM.md`](../../docs/IMAGE_GENERATION_SYSTEM.md) troubleshooting section
