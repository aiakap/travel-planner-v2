"""
FastAPI service for extracting structured data from confirmation emails.

Uses extruct to parse JSON-LD and microdata from HTML, then normalizes
to our schema format. Falls back to AI if structured data is incomplete.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
import extruct
import logging

from extractors.flight_extractor import extract_flight_reservation
from extractors.hotel_extractor import extract_hotel_reservation
from extractors.car_rental_extractor import extract_car_rental_reservation
from extractors.train_extractor import extract_train_reservation
from extractors.restaurant_extractor import extract_restaurant_reservation
from extractors.event_extractor import extract_event_reservation
from validators import calculate_completeness, validate_required_fields

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Extruct Service", version="1.0.0")

# Enable CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractionRequest(BaseModel):
    html: str
    type: Literal["flight", "hotel", "car-rental", "train", "restaurant", "event", "cruise", "private-driver", "generic"]


class ExtractionResponse(BaseModel):
    success: bool
    method: Optional[Literal["json-ld", "microdata", "not-found"]] = None
    data: Optional[Dict[str, Any]] = None
    completeness: float = 0.0
    confidence: Literal["high", "medium", "low"] = "low"
    error: Optional[str] = None


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker healthcheck"""
    return {"status": "healthy", "service": "extruct-service"}


@app.post("/extract", response_model=ExtractionResponse)
async def extract_structured_data(request: ExtractionRequest):
    """
    Extract structured data from HTML confirmation email.
    
    Returns normalized data if found with high completeness,
    otherwise returns not-found to trigger AI fallback.
    """
    try:
        logger.info(f"Extracting {request.type} from HTML (length: {len(request.html)})")
        
        # Use extruct to parse all structured data formats
        data = extruct.extract(
            request.html,
            syntaxes=['json-ld', 'microdata'],
            errors='ignore'
        )
        
        logger.info(f"Extruct found: {len(data.get('json-ld', []))} JSON-LD, {len(data.get('microdata', []))} microdata")
        
        # Try JSON-LD first (most common for email confirmations)
        json_ld_items = data.get('json-ld', [])
        for item in json_ld_items:
            result = _process_structured_data(item, request.type, 'json-ld')
            if result:
                return result
        
        # Try microdata as fallback
        microdata_items = data.get('microdata', [])
        for item in microdata_items:
            result = _process_structured_data(item, request.type, 'microdata')
            if result:
                return result
        
        # No structured data found
        logger.info(f"No structured data found for {request.type}")
        return ExtractionResponse(
            success=False,
            method="not-found",
            completeness=0.0,
            confidence="low"
        )
        
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}", exc_info=True)
        return ExtractionResponse(
            success=False,
            method="not-found",
            completeness=0.0,
            confidence="low",
            error=str(e)
        )


def _process_structured_data(
    item: Dict[str, Any],
    reservation_type: str,
    method: str
) -> Optional[ExtractionResponse]:
    """
    Process a single structured data item and extract reservation data.
    
    Returns ExtractionResponse if data is found and complete enough,
    None if not the right type or incomplete.
    """
    item_type = item.get('@type', '').lower()
    
    # Map reservation types to schema.org types
    type_mapping = {
        'flight': 'flightreservation',
        'hotel': ['lodgingreservation', 'hotelreservation'],
        'car-rental': 'rentalcarreservation',
        'train': 'trainreservation',
        'restaurant': ['foodestablishmentreservation', 'restaurantreservation'],
        'event': 'eventreservation',
        'cruise': 'boatreservation',  # Cruises sometimes use BoatReservation
        'private-driver': 'taxireservation',
    }
    
    expected_types = type_mapping.get(reservation_type)
    if isinstance(expected_types, str):
        expected_types = [expected_types]
    
    if not expected_types or item_type not in expected_types:
        return None
    
    logger.info(f"Found {item_type} structured data, extracting...")
    
    # Extract and normalize data based on type
    try:
        if reservation_type == 'flight':
            extracted_data = extract_flight_reservation(item)
        elif reservation_type == 'hotel':
            extracted_data = extract_hotel_reservation(item)
        elif reservation_type == 'car-rental':
            extracted_data = extract_car_rental_reservation(item)
        elif reservation_type == 'train':
            extracted_data = extract_train_reservation(item)
        elif reservation_type == 'restaurant':
            extracted_data = extract_restaurant_reservation(item)
        elif reservation_type == 'event':
            extracted_data = extract_event_reservation(item)
        else:
            logger.warning(f"No extractor for type: {reservation_type}")
            return None
        
        # Calculate completeness score
        completeness = calculate_completeness(extracted_data, reservation_type)
        logger.info(f"Completeness score: {completeness:.2f}")
        
        # Determine confidence based on completeness
        if completeness >= 0.8:
            confidence = "high"
        elif completeness >= 0.5:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Only return if completeness is high enough (>= 0.8)
        if completeness >= 0.8:
            logger.info(f"Structured extraction successful ({method})")
            return ExtractionResponse(
                success=True,
                method=method,
                data=extracted_data,
                completeness=completeness,
                confidence=confidence
            )
        else:
            logger.info(f"Completeness too low ({completeness:.2f}), will fall back to AI")
            return None
            
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}", exc_info=True)
        return None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
