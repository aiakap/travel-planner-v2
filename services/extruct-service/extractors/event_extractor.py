"""Event extractor: schema.org EventReservation → our format"""

from typing import Dict, Any
import logging
from .base_extractor import parse_date, parse_time, safe_get, get_person_name

logger = logging.getLogger(__name__)


def extract_event_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """Map schema.org EventReservation to our schema"""
    logger.info("Extracting EventReservation from schema.org data")
    
    confirmation_number = json_ld.get('reservationNumber', '')
    guest_name = get_person_name(json_ld.get('underName', {}))
    
    # Event details
    reservation_for = json_ld.get('reservationFor', {})
    event_name = safe_get(reservation_for, 'name', default='')
    
    # Venue
    location = reservation_for.get('location', {})
    venue_name = safe_get(location, 'name', default='')
    address = safe_get(location, 'address', default='')
    
    # Event time
    start_time_str = reservation_for.get('startDate', '')
    event_date = parse_date(start_time_str)
    event_time = parse_time(start_time_str)
    
    # Tickets
    tickets = []
    num_seats = json_ld.get('numSeats', 1)
    if num_seats:
        tickets.append({
            'ticketType': 'General Admission',
            'quantity': num_seats,
            'price': 0,
            'seatInfo': '',
        })
    
    return {
        'confirmationNumber': confirmation_number,
        'guestName': guest_name,
        'eventName': event_name,
        'venueName': venue_name,
        'address': address if isinstance(address, str) else '',
        'eventDate': event_date,
        'eventTime': event_time,
        'doorsOpenTime': '',
        'tickets': tickets,
        'totalCost': 0,
        'currency': json_ld.get('priceCurrency', ''),
        'bookingDate': parse_date(json_ld.get('bookingTime', '')),
        'platform': '',
        'eventType': '',
        'specialInstructions': '',
    }
