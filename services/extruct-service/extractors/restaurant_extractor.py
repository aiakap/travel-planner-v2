"""Restaurant extractor: schema.org FoodEstablishmentReservation → our format"""

from typing import Dict, Any
import logging
from .base_extractor import parse_date, parse_time, safe_get, get_person_name

logger = logging.getLogger(__name__)


def extract_restaurant_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """Map schema.org FoodEstablishmentReservation to our schema"""
    logger.info("Extracting FoodEstablishmentReservation from schema.org data")
    
    confirmation_number = json_ld.get('reservationNumber', '')
    guest_name = get_person_name(json_ld.get('underName', {}))
    
    # Restaurant details
    reservation_for = json_ld.get('reservationFor', {})
    restaurant_name = safe_get(reservation_for, 'name', default='')
    address = safe_get(reservation_for, 'address', default='')
    phone = safe_get(reservation_for, 'telephone', default='')
    
    # Reservation time
    start_time_str = json_ld.get('startTime', '')
    reservation_date = parse_date(start_time_str)
    reservation_time = parse_time(start_time_str)
    
    # Party size
    party_size = json_ld.get('partySize', 2)
    if isinstance(party_size, str):
        try:
            party_size = int(party_size)
        except ValueError:
            party_size = 2
    
    return {
        'confirmationNumber': confirmation_number,
        'guestName': guest_name,
        'restaurantName': restaurant_name,
        'address': address if isinstance(address, str) else '',
        'phone': phone,
        'reservationDate': reservation_date,
        'reservationTime': reservation_time,
        'partySize': party_size,
        'specialRequests': '',
        'cost': 0,
        'currency': json_ld.get('priceCurrency', ''),
        'bookingDate': parse_date(json_ld.get('bookingTime', '')),
        'platform': '',
        'cancellationPolicy': '',
    }
