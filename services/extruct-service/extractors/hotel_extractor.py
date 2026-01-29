"""
Hotel extractor: schema.org LodgingReservation → our HotelExtraction format.

Maps structured data from hotel chains and booking platforms.
"""

from typing import Dict, Any
import logging
from .base_extractor import (
    parse_date, parse_time, safe_get, get_person_name, get_address_string
)

logger = logging.getLogger(__name__)


def extract_hotel_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map schema.org LodgingReservation to our HotelExtraction schema.
    
    Schema.org structure:
    {
      "@type": "LodgingReservation" (or "HotelReservation"),
      "reservationNumber": "ABC123",
      "underName": { "name": "John Smith" },
      "reservationFor": {
        "@type": "LodgingBusiness" (or "Hotel"),
        "name": "Marriott Downtown",
        "address": { ... },
        "telephone": "+1-555-123-4567"
      },
      "checkinTime": "2026-01-30T15:00:00",
      "checkoutTime": "2026-02-02T11:00:00"
    }
    """
    logger.info("Extracting LodgingReservation from schema.org data")
    
    # Extract top-level fields
    confirmation_number = json_ld.get('reservationNumber', '')
    booking_date = parse_date(json_ld.get('bookingTime', ''))
    guest_name = get_person_name(json_ld.get('underName', {}))
    
    # Get hotel/lodging details
    reservation_for = json_ld.get('reservationFor', {})
    hotel_name = safe_get(reservation_for, 'name', default='')
    address = get_address_string(reservation_for)
    
    # Check-in/out details
    checkin_time_str = json_ld.get('checkinTime', '') or json_ld.get('checkInTime', '')
    checkin_date = parse_date(checkin_time_str)
    checkin_time = parse_time(checkin_time_str)
    
    checkout_time_str = json_ld.get('checkoutTime', '') or json_ld.get('checkOutTime', '')
    checkout_date = parse_date(checkout_time_str)
    checkout_time = parse_time(checkout_time_str)
    
    # Optional details
    num_guests = 0
    num_rooms = 1
    room_type = ''
    
    # Try to get from lodgingUnitDescription or room details
    if 'lodgingUnitDescription' in json_ld:
        room_type = json_ld['lodgingUnitDescription']
    elif 'reservationFor' in json_ld:
        lodging = json_ld['reservationFor']
        if 'accommodationType' in lodging:
            room_type = lodging['accommodationType']
    
    # Try to get num guests/rooms
    if 'numAdults' in json_ld:
        num_guests += json_ld['numAdults']
    if 'numChildren' in json_ld:
        num_guests += json_ld['numChildren']
    if 'numRooms' in json_ld:
        num_rooms = json_ld['numRooms']
    
    # Price info
    total_cost = 0.0
    currency = ''
    if 'totalPrice' in json_ld:
        try:
            total_cost = float(json_ld['totalPrice'])
        except (ValueError, TypeError):
            pass
    if 'priceCurrency' in json_ld:
        currency = json_ld['priceCurrency']
    
    result = {
        'confirmationNumber': confirmation_number,
        'guestName': guest_name,
        'hotelName': hotel_name,
        'address': address,
        'checkInDate': checkin_date,
        'checkInTime': checkin_time,
        'checkOutDate': checkout_date,
        'checkOutTime': checkout_time,
        'roomType': room_type,
        'numberOfRooms': num_rooms,
        'numberOfGuests': num_guests,
        'totalCost': total_cost,
        'currency': currency,
        'bookingDate': booking_date,
    }
    
    logger.info(f"Extracted hotel: {hotel_name}")
    return result
