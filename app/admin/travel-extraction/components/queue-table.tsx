"use client";

import { ExtractionStatus } from "@/app/generated/prisma/client";
import { QueueItem } from "@/lib/services/extraction-queue-manager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Image as ImageIcon,
  File,
  PlayCircle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
} from "lucide-react";
import { ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";

interface QueueTableProps {
  items: QueueItem[];
  onProcess: (itemId: string) => void;
  onRetry: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onViewResults: (item: QueueItem) => void;
}

export function QueueTable({
  items,
  onProcess,
  onRetry,
  onDelete,
  onViewResults,
}: QueueTableProps) {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "eml":
      case "text":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case "pdf":
        return <File className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge variant="default" className="gap-1 bg-purple-500">
            <CheckCircle2 className="w-3 h-3" />
            Reviewed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultsSummary = (data: ExtractedTravelData | null) => {
    if (!data) return null;

    const counts = [
      data.flights.length > 0 && `${data.flights.length} flight${data.flights.length > 1 ? "s" : ""}`,
      data.hotels.length > 0 && `${data.hotels.length} hotel${data.hotels.length > 1 ? "s" : ""}`,
      data.rentalCars.length > 0 && `${data.rentalCars.length} car${data.rentalCars.length > 1 ? "s" : ""}`,
      data.activities.length > 0 && `${data.activities.length} activit${data.activities.length > 1 ? "ies" : "y"}`,
    ].filter(Boolean);

    if (counts.length === 0) {
      return <span className="text-xs text-gray-500">No items found</span>;
    }

    return (
      <div className="text-xs text-gray-600">
        {counts.join(", ")}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No files in queue</p>
        <p className="text-sm mt-2">Upload files to get started</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>File Name</TableHead>
            <TableHead className="w-24">Type</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-40">Progress</TableHead>
            <TableHead>Results</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{getFileIcon(item.fileType)}</TableCell>
              <TableCell>
                <div className="font-medium truncate max-w-xs">
                  {item.fileName}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono uppercase">
                  {item.fileType}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                {item.status === "PROCESSING" && (
                  <div className="space-y-1">
                    <Progress value={item.progress} className="h-2" />
                    <span className="text-xs text-gray-500">
                      {item.progress}%
                    </span>
                  </div>
                )}
                {item.status === "FAILED" && item.errorMessage && (
                  <span className="text-xs text-red-600">
                    {item.errorMessage}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {item.status === "COMPLETED" || item.status === "REVIEWED" ? (
                  <div className="space-y-1">
                    {getResultsSummary(item.extractedData as ExtractedTravelData)}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {item.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onProcess(item.id)}
                      title="Process now"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                  )}
                  {item.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRetry(item.id)}
                      title="Retry"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  {(item.status === "COMPLETED" || item.status === "REVIEWED") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewResults(item)}
                      title="View results"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {item.status !== "PROCESSING" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
