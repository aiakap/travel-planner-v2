"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { validateAddress } from "@/lib/actions/address-validation";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationComplete?: (isValid: boolean, formattedAddress?: string) => void;
  placeholder?: string;
  className?: string;
  validateOnBlur?: boolean;
  showValidationBadge?: boolean;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export function AddressInput({
  value,
  onChange,
  onValidationComplete,
  placeholder = "Enter address",
  className = "",
  validateOnBlur = true,
  showValidationBadge = true,
  required = false,
  disabled = false,
  name,
}: AddressInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    isComplete: boolean;
    formattedAddress: string;
    issues?: string[];
  } | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);

  // Reset validation when value changes significantly
  useEffect(() => {
    if (value.length < 3) {
      setValidationResult(null);
    }
  }, [value]);

  const handleValidation = async () => {
    if (!value || value.trim().length === 0) {
      setValidationResult(null);
      return;
    }

    if (value.trim().length < 3) {
      setValidationResult({
        isValid: false,
        isComplete: false,
        formattedAddress: value,
        issues: ["Address too short"],
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateAddress(value);
      setValidationResult(result);
      
      if (onValidationComplete) {
        onValidationComplete(result.isValid, result.formattedAddress);
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({
        isValid: false,
        isComplete: false,
        formattedAddress: value,
        issues: ["Validation failed"],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (validateOnBlur && value.trim().length > 0) {
      handleValidation();
    }
  };

  const getValidationBadge = () => {
    if (!showValidationBadge || !hasBlurred || !value) return null;
    
    if (isValidating) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Validating...
        </Badge>
      );
    }

    if (validationResult) {
      if (validationResult.isValid && validationResult.isComplete) {
        return (
          <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid Address
          </Badge>
        );
      }

      if (validationResult.issues && validationResult.issues.length > 0) {
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {validationResult.issues[0]}
          </Badge>
        );
      }
    }

    return null;
  };

  const getSuggestion = () => {
    if (
      !validationResult ||
      !hasBlurred ||
      validationResult.formattedAddress === value.trim()
    ) {
      return null;
    }

    return (
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
        <div className="font-medium text-blue-900 mb-1">Suggested format:</div>
        <button
          type="button"
          onClick={() => {
            onChange(validationResult.formattedAddress);
            setValidationResult(null);
          }}
          className="text-blue-700 hover:text-blue-900 hover:underline text-left w-full"
        >
          {validationResult.formattedAddress}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          required={required}
          disabled={disabled}
          name={name}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {getValidationBadge()}
      </div>
      
      {getSuggestion()}
    </div>
  );
}
