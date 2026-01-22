import { amadeusLogger } from './amadeus-debug-logger';

// Flight Offers Search response - ALL PRICES IN USD
export const demoFlightOffers = [
  {
    id: "1",
    type: "flight-offer",
    source: "GDS",
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: "2026-07-10",
    numberOfBookableSeats: 9,
    itineraries: [{
      duration: "PT8H30M",
      segments: [{
        departure: {
          iataCode: "JFK",
          terminal: "1",
          at: "2026-07-15T18:00:00"
        },
        arrival: {
          iataCode: "CDG",
          terminal: "2E",
          at: "2026-07-16T08:30:00"
        },
        carrierCode: "AF",
        number: "007",
        aircraft: { code: "77W" },
        operating: { carrierCode: "AF" },
        duration: "PT8H30M",
        id: "1",
        numberOfStops: 0,
        blacklistedInEU: false
      }]
    }],
    price: {
      currency: "USD",
      total: "456.78",
      base: "385.00",
      fees: [{
        amount: "0.00",
        type: "SUPPLIER"
      }, {
        amount: "0.00",
        type: "TICKETING"
      }],
      grandTotal: "456.78"
    },
    pricingOptions: {
      fareType: ["PUBLISHED"],
      includedCheckedBagsOnly: true
    },
    validatingAirlineCodes: ["AF"],
    travelerPricings: [{
      travelerId: "1",
      fareOption: "STANDARD",
      travelerType: "ADULT",
      price: {
        currency: "USD",
        total: "456.78",
        base: "385.00"
      },
      fareDetailsBySegment: [{
        segmentId: "1",
        cabin: "ECONOMY",
        fareBasis: "KLEE4",
        brandedFare: "LIGHT",
        class: "K",
        includedCheckedBags: {
          quantity: 1
        }
      }]
    }]
  },
  {
    id: "2",
    type: "flight-offer",
    source: "GDS",
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: "2026-07-10",
    numberOfBookableSeats: 4,
    itineraries: [{
      duration: "PT10H15M",
      segments: [{
        departure: {
          iataCode: "JFK",
          terminal: "4",
          at: "2026-07-15T16:30:00"
        },
        arrival: {
          iataCode: "LHR",
          terminal: "5",
          at: "2026-07-16T04:45:00"
        },
        carrierCode: "BA",
        number: "112",
        aircraft: { code: "789" },
        operating: { carrierCode: "BA" },
        duration: "PT7H15M",
        id: "2",
        numberOfStops: 0,
        blacklistedInEU: false
      }, {
        departure: {
          iataCode: "LHR",
          terminal: "5",
          at: "2026-07-16T07:20:00"
        },
        arrival: {
          iataCode: "CDG",
          terminal: "2A",
          at: "2026-07-16T09:45:00"
        },
        carrierCode: "BA",
        number: "308",
        aircraft: { code: "320" },
        operating: { carrierCode: "BA" },
        duration: "PT1H25M",
        id: "3",
        numberOfStops: 0,
        blacklistedInEU: false
      }]
    }],
    price: {
      currency: "USD",
      total: "523.45",
      base: "445.00",
      fees: [{
        amount: "0.00",
        type: "SUPPLIER"
      }, {
        amount: "0.00",
        type: "TICKETING"
      }],
      grandTotal: "523.45"
    },
    pricingOptions: {
      fareType: ["PUBLISHED"],
      includedCheckedBagsOnly: true
    },
    validatingAirlineCodes: ["BA"],
    travelerPricings: [{
      travelerId: "1",
      fareOption: "STANDARD",
      travelerType: "ADULT",
      price: {
        currency: "USD",
        total: "523.45",
        base: "445.00"
      },
      fareDetailsBySegment: [{
        segmentId: "2",
        cabin: "ECONOMY",
        fareBasis: "TLOW",
        brandedFare: "BASIC",
        class: "T",
        includedCheckedBags: {
          quantity: 0
        }
      }, {
        segmentId: "3",
        cabin: "ECONOMY",
        fareBasis: "TLOW",
        brandedFare: "BASIC",
        class: "T",
        includedCheckedBags: {
          quantity: 0
        }
      }]
    }]
  },
  {
    id: "3",
    type: "flight-offer",
    source: "GDS",
    instantTicketingRequired: true,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: "2026-07-10",
    numberOfBookableSeats: 2,
    itineraries: [{
      duration: "PT11H45M",
      segments: [{
        departure: {
          iataCode: "JFK",
          terminal: "1",
          at: "2026-07-15T22:00:00"
        },
        arrival: {
          iataCode: "DXB",
          terminal: "3",
          at: "2026-07-16T19:45:00"
        },
        carrierCode: "EK",
        number: "202",
        aircraft: { code: "388" },
        operating: { carrierCode: "EK" },
        duration: "PT11H45M",
        id: "4",
        numberOfStops: 0,
        blacklistedInEU: false
      }]
    }],
    price: {
      currency: "USD",
      total: "1245.90",
      base: "1050.00",
      fees: [{
        amount: "25.00",
        type: "SUPPLIER"
      }, {
        amount: "0.00",
        type: "TICKETING"
      }],
      grandTotal: "1245.90"
    },
    pricingOptions: {
      fareType: ["PUBLISHED"],
      includedCheckedBagsOnly: true
    },
    validatingAirlineCodes: ["EK"],
    travelerPricings: [{
      travelerId: "1",
      fareOption: "STANDARD",
      travelerType: "ADULT",
      price: {
        currency: "USD",
        total: "1245.90",
        base: "1050.00"
      },
      fareDetailsBySegment: [{
        segmentId: "4",
        cabin: "BUSINESS",
        fareBasis: "DBIZ",
        brandedFare: "FLEX",
        class: "D",
        includedCheckedBags: {
          quantity: 2
        }
      }]
    }]
  }
];

// Hotel List response - USD pricing
export const demoHotels = [
  {
    chainCode: "MC",
    iataCode: "PAR",
    dupeId: 700038292,
    name: "Marriott Paris Champs Elysees",
    hotelId: "PARCE001",
    geoCode: {
      latitude: 48.8738,
      longitude: 2.2950
    },
    address: {
      countryCode: "FR",
      cityName: "Paris",
      stateCode: "IDF"
    },
    distance: {
      value: 2.5,
      unit: "KM"
    },
    lastUpdate: "2026-01-15T10:30:00"
  },
  {
    chainCode: "HI",
    iataCode: "PAR",
    dupeId: 700045821,
    name: "Hilton Paris Opera",
    hotelId: "PAROP002",
    geoCode: {
      latitude: 48.8698,
      longitude: 2.3315
    },
    address: {
      countryCode: "FR",
      cityName: "Paris",
      stateCode: "IDF"
    },
    distance: {
      value: 1.8,
      unit: "KM"
    },
    lastUpdate: "2026-01-15T10:30:00"
  },
  {
    chainCode: "IH",
    iataCode: "PAR",
    dupeId: 700052134,
    name: "InterContinental Paris Le Grand",
    hotelId: "PARIC003",
    geoCode: {
      latitude: 48.8712,
      longitude: 2.3308
    },
    address: {
      countryCode: "FR",
      cityName: "Paris",
      stateCode: "IDF"
    },
    distance: {
      value: 1.5,
      unit: "KM"
    },
    lastUpdate: "2026-01-15T10:30:00"
  }
];

// Hotel Search response with pricing - USD
export const demoHotelOffers = [
  {
    type: "hotel-offers",
    hotel: {
      type: "hotel",
      hotelId: "PARCE001",
      chainCode: "MC",
      dupeId: 700038292,
      name: "Marriott Paris Champs Elysees",
      rating: "5",
      cityCode: "PAR",
      latitude: 48.8738,
      longitude: 2.2950,
      hotelDistance: {
        distance: 2.5,
        distanceUnit: "KM"
      },
      address: {
        lines: ["70 Avenue des Champs-Elysees"],
        postalCode: "75008",
        cityName: "Paris",
        countryCode: "FR"
      },
      contact: {
        phone: "+33 1 53 93 55 00",
        fax: "+33 1 53 93 55 01",
        email: "reservations@marriott.com"
      },
      amenities: ["SWIMMING_POOL", "SPA", "FITNESS_CENTER", "RESTAURANT", "ROOM_SERVICE", "WIFI", "PARKING", "AIR_CONDITIONING"]
    },
    available: true,
    offers: [{
      id: "OFFER001",
      checkInDate: "2026-07-15",
      checkOutDate: "2026-07-17",
      rateCode: "RAC",
      rateFamilyEstimated: {
        code: "PRO",
        type: "P"
      },
      room: {
        type: "ROH",
        typeEstimated: {
          category: "DELUXE_ROOM",
          beds: 1,
          bedType: "KING"
        },
        description: {
          text: "Deluxe King Room with city view"
        }
      },
      guests: {
        adults: 2
      },
      price: {
        currency: "USD",
        base: "380.00",
        total: "456.50",
        variations: {
          average: {
            base: "190.00"
          },
          changes: [{
            startDate: "2026-07-15",
            endDate: "2026-07-16",
            base: "380.00"
          }, {
            startDate: "2026-07-16",
            endDate: "2026-07-17",
            base: "400.00"
          }]
        }
      },
      policies: {
        paymentType: "guarantee",
        cancellation: {
          deadline: "2026-07-13T23:59:00",
          amount: "190.00",
          type: "FULL_STAY"
        }
      },
      self: "https://api.amadeus.com/v3/shopping/hotel-offers/OFFER001"
    }],
    self: "https://api.amadeus.com/v3/shopping/hotel-offers?hotelIds=PARCE001"
  },
  {
    type: "hotel-offers",
    hotel: {
      type: "hotel",
      hotelId: "PAROP002",
      chainCode: "HI",
      dupeId: 700045821,
      name: "Hilton Paris Opera",
      rating: "4",
      cityCode: "PAR",
      latitude: 48.8698,
      longitude: 2.3315,
      hotelDistance: {
        distance: 1.8,
        distanceUnit: "KM"
      },
      address: {
        lines: ["108 Rue Saint Lazare"],
        postalCode: "75008",
        cityName: "Paris",
        countryCode: "FR"
      },
      contact: {
        phone: "+33 1 40 08 44 44",
        fax: "+33 1 40 08 44 45",
        email: "reservations@hilton.com"
      },
      amenities: ["FITNESS_CENTER", "RESTAURANT", "BAR", "ROOM_SERVICE", "WIFI", "BUSINESS_CENTER", "AIR_CONDITIONING"]
    },
    available: true,
    offers: [{
      id: "OFFER002",
      checkInDate: "2026-07-15",
      checkOutDate: "2026-07-17",
      rateCode: "RAC",
      rateFamilyEstimated: {
        code: "PRO",
        type: "P"
      },
      room: {
        type: "ROH",
        typeEstimated: {
          category: "SUPERIOR_ROOM",
          beds: 2,
          bedType: "DOUBLE"
        },
        description: {
          text: "Superior Twin Room"
        }
      },
      guests: {
        adults: 2
      },
      price: {
        currency: "USD",
        base: "320.00",
        total: "384.00",
        variations: {
          average: {
            base: "160.00"
          },
          changes: [{
            startDate: "2026-07-15",
            endDate: "2026-07-16",
            base: "320.00"
          }, {
            startDate: "2026-07-16",
            endDate: "2026-07-17",
            base: "320.00"
          }]
        }
      },
      policies: {
        paymentType: "guarantee",
        cancellation: {
          deadline: "2026-07-14T18:00:00",
          amount: "160.00",
          type: "FULL_STAY"
        }
      },
      self: "https://api.amadeus.com/v3/shopping/hotel-offers/OFFER002"
    }],
    self: "https://api.amadeus.com/v3/shopping/hotel-offers?hotelIds=PAROP002"
  }
];

// Transfer Search response - USD pricing
export const demoTransfers = [
  {
    id: "TRANSFER001",
    transferType: "PRIVATE",
    start: {
      dateTime: "2026-07-15T10:30:00",
      locationCode: "CDG",
      address: {
        line: "Charles de Gaulle Airport",
        zip: "95700",
        cityName: "Roissy-en-France",
        countryCode: "FR"
      }
    },
    end: {
      address: {
        line: "70 Avenue des Champs-Elysees",
        zip: "75008",
        cityName: "Paris",
        countryCode: "FR"
      }
    },
    vehicle: {
      code: "VAN",
      category: "BU",
      description: "Business Van",
      seats: [{
        count: 3
      }],
      baggages: [{
        count: 3,
        size: "M"
      }],
      imageURL: "https://example.com/van.jpg"
    },
    serviceProvider: {
      code: "ABC",
      name: "ABC Transfers",
      logoUrl: "https://example.com/logo.jpg",
      termsUrl: "https://example.com/terms",
      contacts: {
        phoneNumber: "+33 1 23 45 67 89",
        email: "info@abctransfers.com"
      }
    },
    quotation: {
      monetaryAmount: "85.00",
      currencyCode: "USD",
      isEstimated: false,
      base: {
        monetaryAmount: "75.00"
      },
      discount: {
        monetaryAmount: "0.00"
      },
      fees: [{
        indicator: "AIRPORT_FEE",
        monetaryAmount: "10.00"
      }],
      totalTaxes: {
        monetaryAmount: "0.00"
      },
      totalFees: {
        monetaryAmount: "10.00"
      }
    },
    converted: null,
    extraServices: [{
      code: "CHILD_SEAT",
      itemId: "CS001",
      description: "Child safety seat",
      quotation: {
        monetaryAmount: "15.00",
        currencyCode: "USD",
        isEstimated: false
      }
    }],
    cancellationRules: [{
      feeType: "PERCENTAGE",
      feeValue: "100",
      metricType: "HOURS",
      metricMin: "0",
      metricMax: "24"
    }],
    distance: {
      value: 28,
      unit: "KM"
    },
    duration: "PT45M"
  },
  {
    id: "TRANSFER002",
    transferType: "SHARED",
    start: {
      dateTime: "2026-07-15T10:30:00",
      locationCode: "CDG",
      address: {
        line: "Charles de Gaulle Airport",
        zip: "95700",
        cityName: "Roissy-en-France",
        countryCode: "FR"
      }
    },
    end: {
      address: {
        line: "70 Avenue des Champs-Elysees",
        zip: "75008",
        cityName: "Paris",
        countryCode: "FR"
      }
    },
    vehicle: {
      code: "BUS",
      category: "ST",
      description: "Shared Shuttle",
      seats: [{
        count: 1
      }],
      baggages: [{
        count: 1,
        size: "M"
      }],
      imageURL: "https://example.com/shuttle.jpg"
    },
    serviceProvider: {
      code: "XYZ",
      name: "Paris Shuttle Service",
      logoUrl: "https://example.com/logo2.jpg",
      termsUrl: "https://example.com/terms2",
      contacts: {
        phoneNumber: "+33 1 98 76 54 32",
        email: "info@parisshuttle.com"
      }
    },
    quotation: {
      monetaryAmount: "35.00",
      currencyCode: "USD",
      isEstimated: false,
      base: {
        monetaryAmount: "30.00"
      },
      discount: {
        monetaryAmount: "0.00"
      },
      fees: [{
        indicator: "AIRPORT_FEE",
        monetaryAmount: "5.00"
      }],
      totalTaxes: {
        monetaryAmount: "0.00"
      },
      totalFees: {
        monetaryAmount: "5.00"
      }
    },
    converted: null,
    extraServices: [],
    cancellationRules: [{
      feeType: "PERCENTAGE",
      feeValue: "100",
      metricType: "HOURS",
      metricMin: "0",
      metricMax: "48"
    }],
    distance: {
      value: 28,
      unit: "KM"
    },
    duration: "PT75M"
  }
];

// Tours & Activities response - USD pricing
export const demoActivities = [
  {
    id: "ACTIVITY001",
    type: "activity",
    self: {
      href: "https://api.amadeus.com/v1/shopping/activities/ACTIVITY001",
      methods: ["GET"]
    },
    name: "Eiffel Tower: Summit or Second Floor Access",
    shortDescription: "Skip the line and enjoy breathtaking views of Paris from the iconic Eiffel Tower",
    description: "Experience the magic of Paris from the Eiffel Tower with priority access. Choose between summit access or second floor access. Enjoy panoramic views of the City of Light and learn about the tower's fascinating history.",
    geoCode: {
      latitude: 48.8584,
      longitude: 2.2945
    },
    rating: "4.7",
    pictures: [
      "https://example.com/eiffel1.jpg",
      "https://example.com/eiffel2.jpg"
    ],
    bookingLink: "https://example.com/book/eiffel",
    minimumDuration: "PT2H",
    price: {
      currencyCode: "USD",
      amount: "45.00"
    },
    categories: ["ATTRACTION", "SIGHTSEEING"]
  },
  {
    id: "ACTIVITY002",
    type: "activity",
    self: {
      href: "https://api.amadeus.com/v1/shopping/activities/ACTIVITY002",
      methods: ["GET"]
    },
    name: "Louvre Museum: Skip-the-Line Guided Tour",
    shortDescription: "Explore the world's largest art museum with an expert guide",
    description: "Discover the masterpieces of the Louvre Museum including the Mona Lisa, Venus de Milo, and Winged Victory. Skip the long lines and enjoy a guided tour with an art historian who will bring the museum's treasures to life.",
    geoCode: {
      latitude: 48.8606,
      longitude: 2.3376
    },
    rating: "4.8",
    pictures: [
      "https://example.com/louvre1.jpg",
      "https://example.com/louvre2.jpg"
    ],
    bookingLink: "https://example.com/book/louvre",
    minimumDuration: "PT3H",
    price: {
      currencyCode: "USD",
      amount: "65.00"
    },
    categories: ["MUSEUM", "CULTURE", "GUIDED_TOUR"]
  },
  {
    id: "ACTIVITY003",
    type: "activity",
    self: {
      href: "https://api.amadeus.com/v1/shopping/activities/ACTIVITY003",
      methods: ["GET"]
    },
    name: "Seine River Dinner Cruise",
    shortDescription: "Romantic dinner cruise with live music and stunning views",
    description: "Enjoy a magical evening on the Seine River with a gourmet French dinner, live music, and illuminated views of Paris's most famous landmarks including Notre-Dame, the Louvre, and the Eiffel Tower.",
    geoCode: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    rating: "4.6",
    pictures: [
      "https://example.com/seine1.jpg",
      "https://example.com/seine2.jpg"
    ],
    bookingLink: "https://example.com/book/seine",
    minimumDuration: "PT2H30M",
    price: {
      currencyCode: "USD",
      amount: "125.00"
    },
    categories: ["DINING", "CRUISE", "ENTERTAINMENT"]
  }
];

// City Search response
export const demoCities = [
  {
    type: "location",
    subType: "CITY",
    name: "Paris",
    detailedName: "Paris, France",
    id: "CPARI",
    iataCode: "PAR",
    address: {
      cityName: "Paris",
      cityCode: "PAR",
      countryName: "France",
      countryCode: "FR",
      regionCode: "EUROP"
    },
    geoCode: {
      latitude: 48.8566,
      longitude: 2.3522
    }
  },
  {
    type: "location",
    subType: "CITY",
    name: "London",
    detailedName: "London, United Kingdom",
    id: "CLOND",
    iataCode: "LON",
    address: {
      cityName: "London",
      cityCode: "LON",
      countryName: "United Kingdom",
      countryCode: "GB",
      regionCode: "EUROP"
    },
    geoCode: {
      latitude: 51.5074,
      longitude: -0.1278
    }
  },
  {
    type: "location",
    subType: "CITY",
    name: "New York",
    detailedName: "New York, United States",
    id: "CNYC",
    iataCode: "NYC",
    address: {
      cityName: "New York",
      cityCode: "NYC",
      countryName: "United States",
      countryCode: "US",
      regionCode: "NAMER"
    },
    geoCode: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  }
];

// Flight Offers Price - Confirmed pricing
export const demoFlightOffersPrice = [
  {
    id: "PRICE001",
    type: "flight-offers-pricing",
    flightOffers: [{
      id: "1",
      type: "flight-offer",
      source: "GDS",
      lastTicketingDate: "2026-07-10",
      itineraries: [{
        segments: [{
          departure: { iataCode: "JFK", at: "2026-07-15T18:00:00" },
          arrival: { iataCode: "CDG", at: "2026-07-16T08:30:00" },
          carrierCode: "AF",
          number: "007"
        }]
      }],
      price: {
        currency: "USD",
        total: "456.78",
        base: "385.00",
        grandTotal: "456.78"
      },
      pricingOptions: {
        fareType: ["PUBLISHED"],
        includedCheckedBagsOnly: true
      },
      validatingAirlineCodes: ["AF"]
    }]
  },
  {
    id: "PRICE002",
    type: "flight-offers-pricing",
    flightOffers: [{
      id: "2",
      type: "flight-offer",
      source: "GDS",
      lastTicketingDate: "2026-07-10",
      itineraries: [{
        segments: [{
          departure: { iataCode: "LAX", at: "2026-08-01T10:00:00" },
          arrival: { iataCode: "NRT", at: "2026-08-02T14:30:00" },
          carrierCode: "JL",
          number: "061"
        }]
      }],
      price: {
        currency: "USD",
        total: "1245.90",
        base: "1050.00",
        grandTotal: "1245.90"
      },
      pricingOptions: {
        fareType: ["PUBLISHED"],
        includedCheckedBagsOnly: true
      },
      validatingAirlineCodes: ["JL"]
    }]
  }
];

// Flight Create Orders - Booking confirmations
export const demoFlightOrders = [
  {
    id: "ORDER001",
    type: "flight-order",
    associatedRecords: [{
      reference: "ABC123",
      creationDate: "2026-01-20T10:30:00",
      originSystemCode: "GDS",
      flightOfferId: "1"
    }],
    flightOffers: [{
      id: "1",
      type: "flight-offer",
      source: "GDS",
      itineraries: [{
        segments: [{
          departure: { iataCode: "JFK", at: "2026-07-15T18:00:00" },
          arrival: { iataCode: "CDG", at: "2026-07-16T08:30:00" },
          carrierCode: "AF",
          number: "007"
        }]
      }],
      price: {
        currency: "USD",
        total: "456.78",
        base: "385.00",
        grandTotal: "456.78"
      }
    }],
    travelers: [{
      id: "1",
      dateOfBirth: "1985-04-15",
      name: {
        firstName: "JOHN",
        lastName: "DOE"
      },
      gender: "MALE",
      contact: {
        emailAddress: "john.doe@example.com",
        phones: [{
          deviceType: "MOBILE",
          countryCallingCode: "1",
          number: "5551234567"
        }]
      },
      documents: [{
        documentType: "PASSPORT",
        number: "N12345678",
        expiryDate: "2030-12-31",
        issuanceCountry: "US",
        nationality: "US",
        holder: true
      }]
    }],
    ticketingAgreement: {
      option: "CONFIRM",
      delay: "6D"
    }
  },
  {
    id: "ORDER002",
    type: "flight-order",
    associatedRecords: [{
      reference: "XYZ789",
      creationDate: "2026-01-21T14:15:00",
      originSystemCode: "GDS",
      flightOfferId: "2"
    }],
    flightOffers: [{
      id: "2",
      type: "flight-offer",
      source: "GDS",
      itineraries: [{
        segments: [{
          departure: { iataCode: "LAX", at: "2026-08-01T10:00:00" },
          arrival: { iataCode: "NRT", at: "2026-08-02T14:30:00" },
          carrierCode: "JL",
          number: "061"
        }]
      }],
      price: {
        currency: "USD",
        total: "1245.90",
        base: "1050.00",
        grandTotal: "1245.90"
      }
    }],
    travelers: [{
      id: "1",
      dateOfBirth: "1990-08-22",
      name: {
        firstName: "JANE",
        lastName: "SMITH"
      },
      gender: "FEMALE",
      contact: {
        emailAddress: "jane.smith@example.com",
        phones: [{
          deviceType: "MOBILE",
          countryCallingCode: "1",
          number: "5559876543"
        }]
      },
      documents: [{
        documentType: "PASSPORT",
        number: "P98765432",
        expiryDate: "2029-06-30",
        issuanceCountry: "US",
        nationality: "US",
        holder: true
      }]
    }],
    ticketingAgreement: {
      option: "CONFIRM",
      delay: "3D"
    }
  }
];

// Flight Order Management - Order details
export const demoFlightOrderManagement = [
  {
    id: "ORDER001",
    type: "flight-order",
    status: "CONFIRMED",
    associatedRecords: [{
      reference: "ABC123",
      creationDate: "2026-01-20T10:30:00"
    }],
    flightOffers: [{
      itineraries: [{
        segments: [{
          departure: { iataCode: "JFK", at: "2026-07-15T18:00:00" },
          arrival: { iataCode: "CDG", at: "2026-07-16T08:30:00" },
          carrierCode: "AF",
          number: "007"
        }]
      }],
      price: {
        currency: "USD",
        total: "456.78"
      }
    }],
    travelers: [{
      name: {
        firstName: "JOHN",
        lastName: "DOE"
      }
    }]
  },
  {
    id: "ORDER002",
    type: "flight-order",
    status: "CANCELLED",
    associatedRecords: [{
      reference: "DEF456",
      creationDate: "2026-01-18T09:15:00"
    }],
    flightOffers: [{
      itineraries: [{
        segments: [{
          departure: { iataCode: "LAX", at: "2026-07-20T12:00:00" },
          arrival: { iataCode: "SYD", at: "2026-07-21T20:30:00" },
          carrierCode: "QF",
          number: "012"
        }]
      }],
      price: {
        currency: "USD",
        total: "1850.00"
      }
    }],
    travelers: [{
      name: {
        firstName: "MIKE",
        lastName: "JOHNSON"
      }
    }]
  }
];

// Seatmap Display - Cabin layouts
export const demoSeatmaps = [
  {
    type: "seatmap",
    flightOfferId: "1",
    segmentId: "1",
    carrierCode: "AF",
    number: "007",
    aircraft: {
      code: "77W"
    },
    departure: {
      iataCode: "JFK",
      at: "2026-07-15T18:00:00"
    },
    arrival: {
      iataCode: "CDG",
      at: "2026-07-16T08:30:00"
    },
    class: "ECONOMY",
    decks: [{
      deckType: "MAIN",
      deckConfiguration: {
        width: 10,
        length: 40,
        startSeatRow: 1,
        endSeatRow: 40,
        startWingsRow: 10,
        endWingsRow: 25,
        exitRowsX: [12, 25]
      },
      seats: [{
        cabin: "ECONOMY",
        number: "12A",
        characteristicsCodes: ["W", "A"],
        travelerPricing: [{
          travelerId: "1",
          seatAvailabilityStatus: "AVAILABLE",
          price: {
            currency: "USD",
            total: "45.00",
            base: "45.00"
          }
        }]
      }, {
        cabin: "ECONOMY",
        number: "12B",
        characteristicsCodes: ["A"],
        travelerPricing: [{
          travelerId: "1",
          seatAvailabilityStatus: "AVAILABLE",
          price: {
            currency: "USD",
            total: "35.00",
            base: "35.00"
          }
        }]
      }, {
        cabin: "ECONOMY",
        number: "12C",
        characteristicsCodes: ["A"],
        travelerPricing: [{
          travelerId: "1",
          seatAvailabilityStatus: "OCCUPIED"
        }]
      }]
    }]
  }
];

// Flight Inspirations - Cheapest destinations
export const demoFlightInspirations = [
  {
    type: "flight-destination",
    origin: "JFK",
    destination: "BCN",
    departureDate: "2026-08-15",
    returnDate: "2026-08-22",
    price: {
      total: "385.00",
      currency: "USD"
    },
    links: {
      flightDates: "https://api.amadeus.com/v1/shopping/flight-dates",
      flightOffers: "https://api.amadeus.com/v2/shopping/flight-offers"
    }
  },
  {
    type: "flight-destination",
    origin: "JFK",
    destination: "LIS",
    departureDate: "2026-08-15",
    returnDate: "2026-08-22",
    price: {
      total: "425.00",
      currency: "USD"
    },
    links: {
      flightDates: "https://api.amadeus.com/v1/shopping/flight-dates",
      flightOffers: "https://api.amadeus.com/v2/shopping/flight-offers"
    }
  },
  {
    type: "flight-destination",
    origin: "JFK",
    destination: "DUB",
    departureDate: "2026-08-15",
    returnDate: "2026-08-22",
    price: {
      total: "465.00",
      currency: "USD"
    },
    links: {
      flightDates: "https://api.amadeus.com/v1/shopping/flight-dates",
      flightOffers: "https://api.amadeus.com/v2/shopping/flight-offers"
    }
  }
];

// Flight Choice Prediction - AI predictions
export const demoFlightChoicePredictions = [
  {
    id: "1",
    type: "flight-offer",
    choiceProbability: "0.85",
    itineraries: [{
      segments: [{
        departure: { iataCode: "JFK", at: "2026-07-15T18:00:00" },
        arrival: { iataCode: "CDG", at: "2026-07-16T08:30:00" },
        carrierCode: "AF",
        number: "007"
      }]
    }],
    price: {
      currency: "USD",
      total: "456.78"
    }
  },
  {
    id: "2",
    type: "flight-offer",
    choiceProbability: "0.62",
    itineraries: [{
      segments: [{
        departure: { iataCode: "JFK", at: "2026-07-15T16:30:00" },
        arrival: { iataCode: "LHR", at: "2026-07-16T04:45:00" },
        carrierCode: "BA",
        number: "112"
      }]
    }],
    price: {
      currency: "USD",
      total: "523.45"
    }
  }
];

// Flight Price Analysis - Historical trends
export const demoFlightPriceAnalysis = [
  {
    type: "itinerary-price-metric",
    origin: {
      iataCode: "JFK"
    },
    destination: {
      iataCode: "CDG"
    },
    departureDate: "2026-07-15",
    currency: "USD",
    priceMetrics: [{
      amount: "456.78",
      quartileRanking: "MEDIUM"
    }],
    priceHistory: {
      minimum: "385.00",
      maximum: "650.00",
      average: "485.00"
    }
  },
  {
    type: "itinerary-price-metric",
    origin: {
      iataCode: "LAX"
    },
    destination: {
      iataCode: "NRT"
    },
    departureDate: "2026-08-01",
    currency: "USD",
    priceMetrics: [{
      amount: "1245.90",
      quartileRanking: "TYPICAL"
    }],
    priceHistory: {
      minimum: "950.00",
      maximum: "1650.00",
      average: "1250.00"
    }
  }
];

// Hotel Booking - Booking confirmations
export const demoHotelBookings = [
  {
    id: "BOOKING001",
    type: "hotel-booking",
    providerConfirmationId: "HT123456",
    associatedRecords: [{
      reference: "HOTEL001",
      originSystemCode: "GDS"
    }],
    hotel: {
      hotelId: "PARCE001",
      name: "Marriott Paris Champs Elysees",
      cityCode: "PAR"
    },
    guests: [{
      tid: 1,
      title: "MR",
      firstName: "JOHN",
      lastName: "DOE",
      phone: "+15551234567",
      email: "john.doe@example.com"
    }],
    checkInDate: "2026-07-15",
    checkOutDate: "2026-07-17",
    roomQuantity: 1,
    price: {
      currency: "USD",
      total: "456.50",
      base: "380.00"
    }
  },
  {
    id: "BOOKING002",
    type: "hotel-booking",
    providerConfirmationId: "HT789012",
    associatedRecords: [{
      reference: "HOTEL002",
      originSystemCode: "GDS"
    }],
    hotel: {
      hotelId: "PAROP002",
      name: "Hilton Paris Opera",
      cityCode: "PAR"
    },
    guests: [{
      tid: 1,
      title: "MS",
      firstName: "JANE",
      lastName: "SMITH",
      phone: "+15559876543",
      email: "jane.smith@example.com"
    }],
    checkInDate: "2026-07-15",
    checkOutDate: "2026-07-17",
    roomQuantity: 1,
    price: {
      currency: "USD",
      total: "384.00",
      base: "320.00"
    }
  }
];

// Hotel Ratings - Sentiment analysis
export const demoHotelRatings = [
  {
    type: "hotel-sentiment",
    hotelId: "PARCE001",
    overallRating: 87,
    numberOfReviews: 1245,
    numberOfRatings: 2150,
    sentiments: {
      sleepQuality: 89,
      service: 92,
      facilities: 85,
      roomComforts: 88,
      valueForMoney: 78,
      catering: 90,
      location: 95,
      internet: 82,
      swimmingPool: 86
    }
  },
  {
    type: "hotel-sentiment",
    hotelId: "PAROP002",
    overallRating: 82,
    numberOfReviews: 856,
    numberOfRatings: 1523,
    sentiments: {
      sleepQuality: 84,
      service: 88,
      facilities: 80,
      roomComforts: 83,
      valueForMoney: 85,
      catering: 86,
      location: 92,
      internet: 78,
      swimmingPool: 75
    }
  }
];

// Hotel Name Autocomplete - Typeahead suggestions
export const demoHotelAutocomplete = [
  {
    type: "hotel",
    hotelId: "PARCE001",
    name: "Marriott Paris Champs Elysees",
    iataCode: "PAR",
    subType: "HOTEL_LEISURE",
    relevance: 95,
    address: {
      cityName: "Paris",
      countryCode: "FR"
    },
    geoCode: {
      latitude: 48.8738,
      longitude: 2.2950
    }
  },
  {
    type: "hotel",
    hotelId: "PAROP002",
    name: "Hilton Paris Opera",
    iataCode: "PAR",
    subType: "HOTEL_LEISURE",
    relevance: 92,
    address: {
      cityName: "Paris",
      countryCode: "FR"
    },
    geoCode: {
      latitude: 48.8698,
      longitude: 2.3315
    }
  },
  {
    type: "hotel",
    hotelId: "PARIC003",
    name: "InterContinental Paris Le Grand",
    iataCode: "PAR",
    subType: "HOTEL_LEISURE",
    relevance: 90,
    address: {
      cityName: "Paris",
      countryCode: "FR"
    },
    geoCode: {
      latitude: 48.8712,
      longitude: 2.3308
    }
  }
];

// Transfer Booking - Booking confirmations
export const demoTransferBookings = [
  {
    id: "TRANSFER_BOOKING001",
    type: "transfer-order",
    reference: "TRF123456",
    status: "CONFIRMED",
    transfers: [{
      transferType: "PRIVATE",
      start: {
        dateTime: "2026-07-15T10:30:00",
        locationCode: "CDG",
        address: {
          line: "Charles de Gaulle Airport",
          cityName: "Roissy-en-France",
          countryCode: "FR"
        }
      },
      end: {
        address: {
          line: "70 Avenue des Champs-Elysees",
          cityName: "Paris",
          countryCode: "FR"
        }
      },
      vehicle: {
        code: "VAN",
        category: "BU",
        description: "Business Van"
      },
      quotation: {
        monetaryAmount: "85.00",
        currencyCode: "USD"
      }
    }],
    travelers: [{
      firstName: "JOHN",
      lastName: "DOE",
      contacts: {
        phoneNumber: "+15551234567",
        email: "john.doe@example.com"
      }
    }]
  },
  {
    id: "TRANSFER_BOOKING002",
    type: "transfer-order",
    reference: "TRF789012",
    status: "CONFIRMED",
    transfers: [{
      transferType: "SHARED",
      start: {
        dateTime: "2026-07-15T10:30:00",
        locationCode: "CDG",
        address: {
          line: "Charles de Gaulle Airport",
          cityName: "Roissy-en-France",
          countryCode: "FR"
        }
      },
      end: {
        address: {
          line: "108 Rue Saint Lazare",
          cityName: "Paris",
          countryCode: "FR"
        }
      },
      vehicle: {
        code: "BUS",
        category: "ST",
        description: "Shared Shuttle"
      },
      quotation: {
        monetaryAmount: "35.00",
        currencyCode: "USD"
      }
    }],
    travelers: [{
      firstName: "JANE",
      lastName: "SMITH",
      contacts: {
        phoneNumber: "+15559876543",
        email: "jane.smith@example.com"
      }
    }]
  }
];

// Transfer Management - Order details
export const demoTransferManagement = [
  {
    id: "TRANSFER_BOOKING001",
    type: "transfer-order",
    reference: "TRF123456",
    status: "CONFIRMED",
    confirmNbr: "CONF123",
    transfers: [{
      transferType: "PRIVATE",
      start: {
        dateTime: "2026-07-15T10:30:00",
        locationCode: "CDG"
      },
      end: {
        address: {
          line: "70 Avenue des Champs-Elysees",
          cityName: "Paris"
        }
      },
      quotation: {
        monetaryAmount: "85.00",
        currencyCode: "USD"
      }
    }]
  },
  {
    id: "TRANSFER_BOOKING002",
    type: "transfer-order",
    reference: "TRF789012",
    status: "CANCELLED",
    confirmNbr: "CONF456",
    transfers: [{
      transferType: "SHARED",
      start: {
        dateTime: "2026-07-20T14:00:00",
        locationCode: "ORY"
      },
      end: {
        address: {
          line: "15 Rue de la Paix",
          cityName: "Paris"
        }
      },
      quotation: {
        monetaryAmount: "30.00",
        currencyCode: "USD"
      }
    }]
  }
];

// Trip Purpose Prediction - Business vs leisure
export const demoTripPurposePredictions = [
  {
    id: "PRED001",
    type: "prediction",
    result: "BUSINESS",
    probability: "0.92",
    subType: "trip-purpose",
    origin: {
      iataCode: "JFK"
    },
    destination: {
      iataCode: "SFO"
    },
    departureDate: "2026-02-10",
    returnDate: "2026-02-12"
  },
  {
    id: "PRED002",
    type: "prediction",
    result: "LEISURE",
    probability: "0.88",
    subType: "trip-purpose",
    origin: {
      iataCode: "JFK"
    },
    destination: {
      iataCode: "CDG"
    },
    departureDate: "2026-07-15",
    returnDate: "2026-07-29"
  },
  {
    id: "PRED003",
    type: "prediction",
    result: "BUSINESS",
    probability: "0.78",
    subType: "trip-purpose",
    origin: {
      iataCode: "LAX"
    },
    destination: {
      iataCode: "NRT"
    },
    departureDate: "2026-03-05",
    returnDate: "2026-03-08"
  }
];

// Points of Interest - Local attractions
export const demoPointsOfInterest = [
  {
    type: "location",
    id: "POI001",
    self: {
      href: "https://api.amadeus.com/v1/reference-data/locations/pois/POI001"
    },
    subType: "POINT_OF_INTEREST",
    name: "Eiffel Tower",
    category: "SIGHTS",
    rank: 100,
    tags: ["monument", "landmark", "tower", "sightseeing"],
    geoCode: {
      latitude: 48.8584,
      longitude: 2.2945
    }
  },
  {
    type: "location",
    id: "POI002",
    self: {
      href: "https://api.amadeus.com/v1/reference-data/locations/pois/POI002"
    },
    subType: "POINT_OF_INTEREST",
    name: "Louvre Museum",
    category: "MUSEUM",
    rank: 98,
    tags: ["museum", "art", "culture", "history"],
    geoCode: {
      latitude: 48.8606,
      longitude: 2.3376
    }
  },
  {
    type: "location",
    id: "POI003",
    self: {
      href: "https://api.amadeus.com/v1/reference-data/locations/pois/POI003"
    },
    subType: "POINT_OF_INTEREST",
    name: "Notre-Dame Cathedral",
    category: "SIGHTS",
    rank: 95,
    tags: ["cathedral", "landmark", "gothic", "architecture"],
    geoCode: {
      latitude: 48.8530,
      longitude: 2.3499
    }
  }
];

// Safe Place - COVID-19 safety ratings
export const demoSafePlaces = [
  {
    type: "safety-rated-location",
    id: "SAFE001",
    subType: "CITY",
    name: "Paris",
    geoCode: {
      latitude: 48.8566,
      longitude: 2.3522
    },
    safetyScores: {
      lgbtq: 85,
      medical: 92,
      overall: 87,
      physicalHarm: 82,
      politicalFreedom: 90,
      theft: 75,
      women: 88
    }
  },
  {
    type: "safety-rated-location",
    id: "SAFE002",
    subType: "CITY",
    name: "London",
    geoCode: {
      latitude: 51.5074,
      longitude: -0.1278
    },
    safetyScores: {
      lgbtq: 90,
      medical: 95,
      overall: 89,
      physicalHarm: 85,
      politicalFreedom: 92,
      theft: 78,
      women: 90
    }
  },
  {
    type: "safety-rated-location",
    id: "SAFE003",
    subType: "CITY",
    name: "New York",
    geoCode: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    safetyScores: {
      lgbtq: 92,
      medical: 93,
      overall: 86,
      physicalHarm: 80,
      politicalFreedom: 95,
      theft: 72,
      women: 87
    }
  }
];

amadeusLogger.info('DemoData', 'Loaded all demo data', {
  flights: demoFlightOffers.length,
  hotels: demoHotels.length,
  hotelOffers: demoHotelOffers.length,
  transfers: demoTransfers.length,
  activities: demoActivities.length,
  cities: demoCities.length,
  flightOffersPrice: demoFlightOffersPrice.length,
  flightOrders: demoFlightOrders.length,
  flightOrderManagement: demoFlightOrderManagement.length,
  seatmaps: demoSeatmaps.length,
  flightInspirations: demoFlightInspirations.length,
  flightChoicePredictions: demoFlightChoicePredictions.length,
  flightPriceAnalysis: demoFlightPriceAnalysis.length,
  hotelBookings: demoHotelBookings.length,
  hotelRatings: demoHotelRatings.length,
  hotelAutocomplete: demoHotelAutocomplete.length,
  transferBookings: demoTransferBookings.length,
  transferManagement: demoTransferManagement.length,
  tripPurposePredictions: demoTripPurposePredictions.length,
  pointsOfInterest: demoPointsOfInterest.length,
  safePlaces: demoSafePlaces.length
});
