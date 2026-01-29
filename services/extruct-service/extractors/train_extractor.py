"""Train extractor: schema.org TrainReservation → our format"""

from typing import Dict, Any
import logging
from .base_extractor import parse_date, parse_time, safe_get, get_person_name

logger = logging.getLogger(__name__)


def extract_train_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """Map schema.org TrainReservation to our schema"""
    logger.info("Extracting TrainReservation from schema.org data")
    
    confirmation_number = json_ld.get('reservationNumber', '')
    
    # Passengers
    under_name = json_ld.get('underName', {})
    passenger_name = get_person_name(under_name)
    passengers = [{'name': passenger_name, 'ticketNumber': ''}] if passenger_name else []
    
    # Get train details
    reservation_for = json_ld.get('reservationFor', {})
    train_number = safe_get(reservation_for, 'trainNumber', default='')
    
    # Departure/arrival
    dep_station = reservation_for.get('departureStation', {})
    arr_station = reservation_for.get('arrivalStation', {})
    
    dep_time_str = reservation_for.get('departureTime', '')
    arr_time_str = reservation_for.get('arrivalTime', '')
    
    trains = [{
        'trainNumber': train_number,
        'operator': safe_get(reservation_for, 'provider', 'name', default=''),
        'operatorCode': '',
        'departureStation': safe_get(dep_station, 'name', default=''),
        'departureStationCode': '',
        'departureCity': '',
        'departureDate': parse_date(dep_time_str),
        'departureTime': parse_time(dep_time_str),
        'departurePlatform': '',
        'arrivalStation': safe_get(arr_station, 'name', default=''),
        'arrivalStationCode': '',
        'arrivalCity': '',
        'arrivalDate': parse_date(arr_time_str),
        'arrivalTime': parse_time(arr_time_str),
        'arrivalPlatform': '',
        'class': '',
        'coach': '',
        'seat': '',
        'duration': '',
    }]
    
    return {
        'confirmationNumber': confirmation_number,
        'passengers': passengers,
        'purchaseDate': parse_date(json_ld.get('bookingTime', '')),
        'totalCost': 0,
        'currency': json_ld.get('priceCurrency', ''),
        'trains': trains,
    }
