"""Car rental extractor: schema.org RentalCarReservation → our format"""

from typing import Dict, Any
import logging
from .base_extractor import parse_date, parse_time, safe_get, get_person_name

logger = logging.getLogger(__name__)


def extract_car_rental_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """Map schema.org RentalCarReservation to our schema"""
    logger.info("Extracting RentalCarReservation from schema.org data")
    
    confirmation_number = json_ld.get('reservationNumber', '')
    guest_name = get_person_name(json_ld.get('underName', {}))
    
    # Get rental details
    reservation_for = json_ld.get('reservationFor', {})
    vehicle_model = safe_get(reservation_for, 'model', default='')
    vehicle_name = safe_get(reservation_for, 'name', default='')
    
    # Pickup/dropoff locations
    pickup_location = json_ld.get('pickupLocation', {})
    pickup_name = safe_get(pickup_location, 'name', default='')
    dropoff_location = json_ld.get('dropOffLocation', {}) or json_ld.get('returnLocation', {})
    dropoff_name = safe_get(dropoff_location, 'name', default='')
    
    # Times
    pickup_time_str = json_ld.get('pickupTime', '')
    pickup_date = parse_date(pickup_time_str)
    pickup_time = parse_time(pickup_time_str)
    
    dropoff_time_str = json_ld.get('dropoffTime', '') or json_ld.get('returnTime', '')
    return_date = parse_date(dropoff_time_str)
    return_time = parse_time(dropoff_time_str)
    
    # Get rental company
    provider = json_ld.get('provider', {})
    company = safe_get(provider, 'name', default='')
    
    return {
        'confirmationNumber': confirmation_number,
        'guestName': guest_name,
        'company': company,
        'vehicleClass': '',
        'vehicleModel': vehicle_model or vehicle_name,
        'pickupLocation': pickup_name,
        'pickupAddress': '',
        'pickupDate': pickup_date,
        'pickupTime': pickup_time,
        'pickupFlightNumber': '',
        'returnLocation': dropoff_name,
        'returnAddress': '',
        'returnDate': return_date,
        'returnTime': return_time,
        'totalCost': 0,
        'currency': json_ld.get('priceCurrency', ''),
        'options': [],
        'oneWayCharge': 0,
        'bookingDate': parse_date(json_ld.get('bookingTime', '')),
    }
