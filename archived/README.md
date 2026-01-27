# Archived Features

This folder contains features that have been archived for potential future use.

## Image Generator Tool (image-generator/)

**Archived Date**: January 27, 2026

**Reason for Archiving**: 
The image-generator tool was a standalone bulk image generation system that used AI (GPT-4o) to extract and parse image prompts from pasted text. While innovative, it was not needed for the current workflow where image prompts are managed directly in the database.

**What it did**:
- Allowed users to paste text containing multiple image prompts
- Used OpenAI GPT-4o to intelligently extract individual prompts from any format (numbered lists, bullet points, XML, plain text)
- Generated filenames automatically based on prompt content
- Queued and processed images in batch using Google Vertex AI Imagen
- Provided a UI to monitor progress and view generated images

**Key Features**:
- AI-powered prompt parsing (`lib/prompt-parser.ts`)
- Queue management system (`lib/queue-manager.ts`)
- Real-time progress tracking
- Support for multiple input formats
- Automatic filename generation

**Dependencies**:
- OpenAI API (GPT-4o for prompt extraction)
- Google Vertex AI (Imagen for image generation)
- Next.js API routes
- File system for queue management

**How to Restore**:
If you need to restore this tool:
1. Move the `image-generator/` folder back to the project root
2. Ensure `OPENAI_API_KEY` is set in `.env`
3. Ensure Google Vertex AI credentials are configured
4. Run `npm install` to ensure dependencies are installed
5. Access at `/image-generator` route

**Related Changes**:
When this was archived, the main app's AI-based prompt selection was also replaced with a simpler flag-based system in the database. See `lib/image-generation.ts` for the new implementation.

## Main App AI Prompt Selection (archived logic)

**What was removed**:
The main app previously used AI (GPT-4o) to analyze trip/segment/reservation data and intelligently select the "best matching" ImagePrompt from the database based on:
- Destination type (urban/nature/beach/mountains)
- Travel dates and season
- Activity type and character
- Number of destinations
- Trip sentiment

**Replacement**:
Simple database flags (`isDefault`, `isActive`, `sortOrder`) on the `ImagePrompt` model now determine which prompt to use. This is faster, more predictable, and doesn't require OpenAI API calls.

**Original Implementation**:
See git history for `lib/image-generation.ts` around the `selectBestPromptForContent()` function (approximately lines 104-192 before archival).

---

**Note**: All archived features remain in git history and can be restored if needed.
