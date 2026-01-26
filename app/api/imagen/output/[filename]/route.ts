import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Security: Only allow alphanumeric, hyphens, underscores, and .png extension
    if (!/^[\w\-\.]+\.png$/.test(filename)) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Construct path to the image
    const imagePath = join(process.cwd(), "image-generator", "output", filename);

    // Check if file exists
    if (!existsSync(imagePath)) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Read the file
    const imageBuffer = await readFile(imagePath);

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 }
    );
  }
}
