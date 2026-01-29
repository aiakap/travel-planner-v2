"""
Base utilities for all extractors.

Common functions for parsing dates, times, and handling schema.org data.
"""

from typing import Any, Optional
from dateutil import parser as date_parser
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def parse_date(date_str: Any) -> str:
    """
    Parse a date string to YYYY-MM-DD format.
    
    Handles ISO datetime strings, various date formats, etc.
    Returns empty string if parsing fails.
    """
    if not date_str:
        return ""
    
    try:
        if isinstance(date_str, datetime):
            return date_str.strftime('%Y-%m-%d')
        
        # Try parsing the string
        dt = date_parser.parse(str(date_str))
        return dt.strftime('%Y-%m-%d')
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to parse date '{date_str}': {e}")
        return ""


def parse_time(datetime_str: Any) -> str:
    """
    Parse a datetime string to time format (e.g., "2:00 PM" or "14:00").
    
    Returns empty string if parsing fails.
    """
    if not datetime_str:
        return ""
    
    try:
        if isinstance(datetime_str, datetime):
            dt = datetime_str
        else:
            dt = date_parser.parse(str(datetime_str))
        
        # Return in 12-hour format with AM/PM
        return dt.strftime('%-I:%M %p')  # e.g., "2:00 PM"
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to parse time from '{datetime_str}': {e}")
        return ""


def safe_get(data: Any, *keys: str, default: Any = "") -> Any:
    """
    Safely get nested values from dict with multiple fallback keys.
    
    Example:
        safe_get(data, 'underName', 'name', default='')
        safe_get(data, 'reservationFor', 'departureAirport', 'iataCode')
    """
    result = data
    for key in keys:
        if isinstance(result, dict):
            result = result.get(key, default)
        else:
            return default
    return result if result is not None else default


def get_person_name(person: Any) -> str:
    """
    Extract name from a schema.org Person object.
    
    Handles various formats:
    - { "name": "John Smith" }
    - { "givenName": "John", "familyName": "Smith" }
    - "John Smith" (plain string)
    """
    if not person:
        return ""
    
    if isinstance(person, str):
        return person
    
    if isinstance(person, dict):
        # Try full name first
        name = person.get('name', '')
        if name:
            return name
        
        # Try given + family name
        given = person.get('givenName', '')
        family = person.get('familyName', '')
        if given or family:
            return f"{given} {family}".strip()
    
    return ""


def get_address_string(location: Any) -> str:
    """
    Extract address from a schema.org Place/PostalAddress object.
    
    Returns formatted address string or empty string.
    """
    if not location:
        return ""
    
    if isinstance(location, str):
        return location
    
    if isinstance(location, dict):
        # Try full address first
        address = location.get('address', {})
        if isinstance(address, str):
            return address
        
        if isinstance(address, dict):
            # Build address from parts
            parts = []
            if address.get('streetAddress'):
                parts.append(address['streetAddress'])
            if address.get('addressLocality'):
                parts.append(address['addressLocality'])
            if address.get('addressRegion'):
                parts.append(address['addressRegion'])
            if address.get('postalCode'):
                parts.append(address['postalCode'])
            if address.get('addressCountry'):
                parts.append(address['addressCountry'])
            
            return ', '.join(parts) if parts else ""
    
    return ""


def get_city_state(location: Any) -> str:
    """
    Extract city/state from a schema.org Place object.
    
    Returns formatted "City, State" or just "City".
    """
    if not location:
        return ""
    
    if isinstance(location, dict):
        address = location.get('address', {})
        if isinstance(address, dict):
            city = address.get('addressLocality', '')
            state = address.get('addressRegion', '')
            
            if city and state:
                return f"{city}, {state}"
            elif city:
                return city
    
    return ""
