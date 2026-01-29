"""
Validation and completeness scoring for extracted data.

Calculates how complete the extracted data is based on required fields,
and validates that required fields are present and valid.
"""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


# Required fields for each reservation type
REQUIRED_FIELDS = {
    'flight': [
        'flights[0].flightNumber',
        'flights[0].departureAirport',
        'flights[0].arrivalAirport',
        'flights[0].departureDate',
        'flights[0].departureTime',
        'flights[0].arrivalDate',
        'flights[0].arrivalTime',
    ],
    'hotel': [
        'hotelName',
        'checkInDate',
        'checkOutDate',
    ],
    'car-rental': [
        'company',
        'pickupLocation',
        'pickupDate',
        'returnLocation',
        'returnDate',
    ],
    'train': [
        'trains[0].trainNumber',
        'trains[0].departureStation',
        'trains[0].arrivalStation',
        'trains[0].departureDate',
        'trains[0].departureTime',
        'trains[0].arrivalDate',
        'trains[0].arrivalTime',
    ],
    'restaurant': [
        'restaurantName',
        'reservationDate',
        'reservationTime',
    ],
    'event': [
        'eventName',
        'venueName',
        'eventDate',
    ],
}


def get_nested_value(data: Dict[str, Any], path: str) -> Any:
    """
    Get a value from nested dict using dot notation.
    
    Examples:
      get_nested_value(data, 'flights[0].flightNumber')
      get_nested_value(data, 'hotelName')
    """
    parts = path.replace('[', '.').replace(']', '').split('.')
    value = data
    
    for part in parts:
        if not part:
            continue
        try:
            if value is None:
                return None
            if isinstance(value, dict):
                value = value.get(part)
            elif isinstance(value, list):
                value = value[int(part)]
            else:
                return None
        except (KeyError, IndexError, ValueError, TypeError):
            return None
    
    return value


def calculate_completeness(data: Dict[str, Any], schema_type: str) -> float:
    """
    Calculate completeness score (0-1) based on required fields.
    
    Returns:
        float: Score from 0.0 to 1.0 indicating what percentage of
               required fields are present and non-empty.
    """
    required = REQUIRED_FIELDS.get(schema_type, [])
    if not required:
        logger.warning(f"No required fields defined for type: {schema_type}")
        return 0.5  # Default to medium completeness
    
    found_count = 0
    for field_path in required:
        value = get_nested_value(data, field_path)
        if value and str(value).strip():  # Non-empty and not just whitespace
            found_count += 1
            logger.debug(f"Found {field_path}: {value}")
        else:
            logger.debug(f"Missing {field_path}")
    
    completeness = found_count / len(required)
    logger.info(f"Completeness: {found_count}/{len(required)} fields = {completeness:.2%}")
    
    return completeness


def validate_required_fields(data: Dict[str, Any], schema_type: str) -> List[str]:
    """
    Validate that all required fields are present.
    
    Returns:
        List[str]: List of missing field paths (empty if all present)
    """
    required = REQUIRED_FIELDS.get(schema_type, [])
    missing = []
    
    for field_path in required:
        value = get_nested_value(data, field_path)
        if not value or not str(value).strip():
            missing.append(field_path)
    
    return missing


def validate_date_format(date_str: str) -> bool:
    """
    Validate that a date string is in YYYY-MM-DD format.
    """
    if not date_str or not isinstance(date_str, str):
        return False
    
    import re
    return bool(re.match(r'^\d{4}-\d{2}-\d{2}$', date_str))
