import { UTApi } from "uploadthing/server";

// Server-only UTApi instance for server-side uploads
// This file should only be imported in server-side code
export const utapi = new UTApi();
