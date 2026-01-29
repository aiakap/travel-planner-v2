"""
Flight extractor: schema.org FlightReservation → our FlightExtraction format.

Maps structured data from major airlines to our internal schema.
"""

from typing import Dict, Any, List
import logging
from .base_extractor import (
    parse_date, parse_time, safe_get, get_person_name, get_city_state
)

logger = logging.getLogger(__name__)


def extract_flight_reservation(json_ld: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map schema.org FlightReservation to our FlightExtraction schema.
    
    Schema.org structure:
    {
      "@type": "FlightReservation",
      "reservationNumber": "ABC123",
      "underName": { "name": "John Smith" },
      "reservationFor": {
        "@type": "Flight",
        "flightNumber": "UA1234",
        "airline": { "name": "United Airlines", "iataCode": "UA" },
        "departureAirport": { "iataCode": "SFO", "name": "..." },
        "departureTime": "2026-01-30T10:00:00-08:00",
        "arrivalAirport": { "iataCode": "LAX", "name": "..." },
        "arrivalTime": "2026-01-30T12:00:00-08:00"
      }
    }
    """
    logger.info("Extracting FlightReservation from schema.org data")
    
    # Extract top-level fields
    confirmation_number = json_ld.get('reservationNumber', '')
    booking_date = parse_date(json_ld.get('bookingTime', ''))
    passenger_name = get_person_name(json_ld.get('underName', {}))
    
    # Get flight details
    reservation_for = json_ld.get('reservationFor', {})
    
    # Handle both single flight and array of flights
    flights_data = []
    if isinstance(reservation_for, list):
        flights_data = reservation_for
    elif reservation_for:
        flights_data = [reservation_for]
    
    flights = []
    for flight_data in flights_data:
        if not flight_data or flight_data.get('@type') != 'Flight':
            continue
        
        # Extract flight details
        flight = extract_single_flight(flight_data)
        if flight:
            flights.append(flight)
    
    result = {
        'confirmationNumber': confirmation_number,
        'bookingDate': booking_date,
        'passengerName': passenger_name,
        'flights': flights,
    }
    
    logger.info(f"Extracted {len(flights)} flight(s)")
    return result


def extract_single_flight(flight_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract a single Flight object from schema.org data"""
    
    # Basic flight info
    flight_number = flight_data.get('flightNumber', '')
    
    # Airline info
    airline = flight_data.get('airline', {})
    carrier = safe_get(airline, 'name', default='')
    carrier_code = safe_get(airline, 'iataCode', default='')
    
    # Departure info
    departure_airport_obj = flight_data.get('departureAirport', {})
    departure_airport = safe_get(departure_airport_obj, 'iataCode', default='')
    departure_airport_name = safe_get(departure_airport_obj, 'name', default='')
    departure_city = get_city_state(departure_airport_obj)
    departure_terminal = safe_get(departure_airport_obj, 'terminal', default='')
    
    departure_time_str = flight_data.get('departureTime', '')
    departure_date = parse_date(departure_time_str)
    departure_time = parse_time(departure_time_str)
    
    # Arrival info
    arrival_airport_obj = flight_data.get('arrivalAirport', {})
    arrival_airport = safe_get(arrival_airport_obj, 'iataCode', default='')
    arrival_airport_name = safe_get(arrival_airport_obj, 'name', default='')
    arrival_city = get_city_state(arrival_airport_obj)
    arrival_terminal = safe_get(arrival_airport_obj, 'terminal', default='')
    
    arrival_time_str = flight_data.get('arrivalTime', '')
    arrival_date = parse_date(arrival_time_str)
    arrival_time = parse_time(arrival_time_str)
    
    # Optional details
    aircraft_type = flight_data.get('aircraft', '')
    departure_gate = flight_data.get('departureGate', '')
    arrival_gate = flight_data.get('arrivalGate', '')
    
    flight = {
        'flightNumber': flight_number,
        'carrier': carrier,
        'carrierCode': carrier_code,
        'departureAirport': departure_airport,
        'departureAirportName': departure_airport_name,
        'departureCity': departure_city,
        'departureDate': departure_date,
        'departureTime': departure_time,
        'departureTerminal': departure_terminal,
        'departureGate': departure_gate,
        'arrivalAirport': arrival_airport,
        'arrivalAirportName': arrival_airport_name,
        'arrivalCity': arrival_city,
        'arrivalDate': arrival_date,
        'arrivalTime': arrival_time,
        'arrivalTerminal': arrival_terminal,
        'arrivalGate': arrival_gate,
        'aircraft': aircraft_type,
        'bookingClass': '',  # Not typically in schema.org
        'seatNumber': '',    # Not typically in schema.org FlightReservation
        'operatedBy': '',    # Not typically in schema.org
    }
    
    logger.debug(f"Extracted flight {flight_number}: {departure_airport} → {arrival_airport}")
    return flight
