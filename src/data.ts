import { Car, Review, PortfolioItem } from "./types";

export const MOTTO_DUTCH = "Your premier, multilingual partner on the Costa Blanca for high-performance maintenance, turnkey import/export, and certified vehicle sales.";
export const BRIEF_ABOUT_DUTCH = "Based in the prestigious Marina Alta region, The Garage Jávea combines Dutch and German technical precision with Spanish warmth and automotive passion. Our multilingual team (fluent in English, Dutch, German, and Spanish) offers a fully managed, hands-off concierge experience. Whether you are maintaining a track-ready Porsche, registering a classic collectible in Alicante, or sourcing an elite cruiser for the summer roads, we ensure absolute transparency, mechanical perfection, and administrative ease.";

export const CARS_STOCK: Car[] = [
  {
    id: "car-1",
    make: "Porsche",
    model: "911 (992) GT3 Touring",
    price: 189950,
    year: 2022,
    mileage: 12400,
    engine: "4.0L Naturally Aspirated Flat-Six (510 hp)",
    transmission: "Automatic",
    fuel: "Petrol",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1250",
    specs: [
      "Chrono Package with Prep for Lap Trigger",
      "Full Carbon Fiber Bucket Seats",
      "Front Axle Lift System",
      "Porsche Ceramic Composite Brakes (PCCB)",
      "Rear-Axle Steering",
      "Bespoke PPF Full-Body Protection Wrap"
    ],
    tags: ["High Performance", "Touring", "Like New"],
    description: "An absolute masterpiece of automotive engineering. This 992 GT3 Touring combines racing-bred dynamics with an elegant stealth appearance, making it the ultimate vehicle to tackle the sweeping hairpins of the Cabo de la Nao coastal roads.",
    status: "Available"
  },
  {
    id: "car-2",
    make: "Ferrari",
    model: "F8 Tributo Coupé",
    price: 249000,
    year: 2021,
    mileage: 8900,
    engine: "3.9L Twin-Turbo V8 (720 hp)",
    transmission: "Automatic",
    fuel: "Petrol",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1250",
    specs: [
      "Rosso Corsa Signature Paint",
      "Carbon Fiber Driver Zone + LEDs steering",
      "20-inch Forged Dark Painted Rims",
      "Passenger Display Integrated",
      "Full PPF Protected",
      "Official Ferrari Power Warranty Remaining"
    ],
    tags: ["Supercar", "720hp V8", "Investment Grade"],
    description: "The peak of mid-engine performance. This flawless F8 Tributo represents a superb investment opportunity. Imported and authenticated from an elite private collection, fully registered on Spanish plates, clean ITV, and prepared for Spanish summers.",
    status: "Reserved"
  },
  {
    id: "car-3",
    make: "Aston Martin",
    model: "Vantage V8 Roadster",
    price: 114500,
    year: 2020,
    mileage: 21600,
    engine: "4.0L Twin-Turbo V8 (510 hp)",
    transmission: "Automatic",
    fuel: "Petrol",
    image: "https://images.unsplash.com/photo-1621259182978-f011d5088a9e?auto=format&fit=crop&q=80&w=1250",
    specs: [
      "Aesthetic British Racing Green Finish",
      "Heated & Ventilated Obsidian Sports Seats",
      "Adaptive Damping Suspension (3 modes)",
      "Aston Martin Premium Audio (700W)",
      "Quad-exit Sport Exhaust System",
      "Turnkey ITV & Alicante Registration Ready"
    ],
    tags: ["Convertible", "V8 Biturbo", "Pure Class"],
    description: "An elegant English gentleman with a wild heart. The V8 soundtrack is exceptionally exhilarating, perfect for early morning coastal drives across Javea, Moraira, and Altea. Fully checked and verified by our leading mechanics.",
    status: "Available"
  },
  {
    id: "car-4",
    make: "Mercedes-AMG",
    model: "GT C Roadster",
    price: 139800,
    year: 2019,
    mileage: 31200,
    engine: "4.0L BiTurbo V8 (557 hp)",
    transmission: "Automatic",
    fuel: "Petrol",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1250",
    specs: [
      "AMG Dynamic Plus Package",
      "Nappa Leather Dynamica Sport Seats",
      "Active Rear-Axle Steering",
      "Burmester High-End Surround Sound",
      "AMG Performance Exhaust (Switchable)",
      "Registered on Spanish Historical Green Plates"
    ],
    tags: ["AMG Roadster", "V8 Biturbo", "Sold"],
    description: "Combining muscular power with spectacular aerodynamics. This AMG GT C delivers massive low-end torque and incredible presence. We handled the complete import and custom registration route for its prominent offshore owner.",
    status: "Sold"
  }
];

export const CLIENT_REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Jan-Willem de Groot",
    rating: 5,
    type: "Import",
    date: "May 12, 2026",
    comment: "The Garage took care of the complete import of our Porsche 911 from Amsterdam right to our villa in Cumbre del Sol. From covered transport clearance to dealing with the Alicante ITV and Spanish tax authorities: they managed it flawlessly. No hidden costs. Impeccable service and total peace of mind!",
    verified: true,
    carModel: "Porsche 911 GT3 (992)"
  },
  {
    id: "rev-2",
    name: "Charlotte Vance",
    rating: 5,
    type: "Maintenance",
    date: "April 28, 2026",
    comment: "It is incredibly relieving to find a highly professional, transparent garage in Jávea that speaks fluent English, Dutch, and Spanish. They diagnosed an intricate issue on our Aston Martin's adaptive suspension that even the official dealership missed. Prompt repair, fair rates, and outstanding hospitality.",
    verified: true,
    carModel: "Aston Martin Vantage Roadster"
  },
  {
    id: "rev-3",
    name: "Dr. Maximilian Schreiber",
    rating: 5,
    type: "Brokerage",
    date: "April 04, 2026",
    comment: "Excellent vehicle sourcing service. They located a rare Porsche GT3 RS build spec inside Germany, carried out a comprehensive pre-purchase check, negotiated the purchase, brought it safely to Jávea, and registered it in record time. Professional automotive expertise at its finest.",
    verified: true,
    carModel: "Porsche 911 GT3 RS"
  },
  {
    id: "rev-4",
    name: "Mark van der Meer",
    rating: 5,
    type: "Export",
    date: "March 14, 2026",
    comment: "Superb export handling! I needed to ship my high-spec Land Rover back to standard UK registration post-Brexit. The Garage prepared the complex customs documentation, obtained the necessary de-registrations in Madrid, and coordinated the transport securely. Truly top tier.",
    verified: true,
    carModel: "Land Rover Defender P400e"
  },
  {
    id: "rev-5",
    name: "Sophie Dubois",
    rating: 5,
    type: "Maintenance",
    date: "January 29, 2026",
    comment: "Highly efficient team. They completed a key service and wheel alignment on my Audi R8. The car was handed back meticulously washed and fully detailed. They are the absolute benchmark for foreign vehicle owners in the Marina Alta.",
    verified: true,
    carModel: "Audi R8 V10 Plus"
  }
];

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "port-1",
    title: "Bespoke Import: Porsche 911 GT2 RS",
    type: "import",
    car: "Porsche 911 (991.2) GT2 RS Weissach",
    year: 2018,
    image: "https://images.unsplash.com/photo-1611566141151-140a33edadec?auto=format&fit=crop&q=80&w=800",
    outcome: "Imported from Munich, Germany directly to Javea. Full Spanish matriculación and homologation in 6 days.",
    description: "An incredibly complex import due to high emissions and custom Weissach carbon components. We optimized the legal Spanish depreciation schedule via specialized certified engineering reports, saving the client over €12,000 in unnecessary registration tax (Impuesto de Matriculación).",
    origin: "Munich, Germany",
    destination: "Jávea (Alicante)"
  },
  {
    id: "port-2",
    title: "Sourcing & Delivery: Ferrari 488 Pista",
    type: "brokerage",
    car: "Ferrari 488 Pista Rosso Corsa",
    year: 2019,
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800",
    outcome: "Sourced from a private collection in Milan. Delivered turnkey with custom Spain registration.",
    description: "Our client requested a flawless 488 Pista with a highly specific carbon-heavy build sheet. Within 10 days, we successfully inspected the car in Milan, transported it on an enclosed air-ride trailer, and passed the rigorous Spanish import ITV on the first attempt.",
    origin: "Milan, Italy",
    destination: "Jávea (Portside Gallery)"
  },
  {
    id: "port-3",
    title: "Post-Brexit Custom Clearance: Aston Martin DBS",
    type: "export",
    car: "Aston Martin DBS Superleggera",
    year: 2021,
    image: "https://images.unsplash.com/photo-1621259182978-f011d5088a9e?auto=format&fit=crop&q=80&w=800",
    outcome: "Full customs declaration and secure closed transit to Edinburgh, United Kingdom.",
    description: "We managed the complex de-registration (baja definitiva) from the DGT in Alicante, coordinated Spanish customs offices for exit clearance, and delivered the car directly to the owner's UK estate with full protective wrapping.",
    origin: "Jávea, Spain",
    destination: "Edinburgh, UK"
  },
  {
    id: "port-4",
    title: "High-End Calibration: Mercedes-AMG GT Black Series",
    type: "maintenance",
    car: "Mercedes-AMG GT Black Series",
    year: 2021,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800",
    outcome: "Full race-track track setup, major fluid service, and advanced ECU diagnostics.",
    description: "The vehicle suffered a persistent limp-mode fault from exhaust pressure sensors after private tracking. Utilizing our factory-level Mercedes-Benz diagnostic system, we repaired the electrical harness and recalibrated the active aerodynamic wing assemblies perfectly.",
    origin: "Moraira, Spain",
    destination: "The Garage Workshop"
  }
];

export const EXPERTISE_CARDS = [
  {
    id: "exp-1",
    title: "Certified Supercar Service",
    description: "State-of-the-art facility equipped with dealer-level diagnostic scanners for Porsche, Ferrari, Aston Martin, Lamborghini, BMW M, and Mercedes-AMG.",
    badge: "Dealer Quality"
  },
  {
    id: "exp-2",
    title: "Turnkey Spanish Matriculación",
    description: "Complete hands-off import service: secure trailer transport, ITV coordination, engineering technical sheets (Ficha Reducida), and plates.",
    badge: "100% Turnkey"
  },
  {
    id: "exp-3",
    title: "Customs Brokerage & Transit",
    description: "Approved customs handlers providing trouble-free tax declarations, temporary green plates (placas temporales), and export de-registration.",
    badge: "Customs Specialist"
  },
  {
    id: "exp-4",
    title: "Verified Prestige Sales",
    description: "Uncompromised sports cars and classics featuring clean provenance, 50-point diagnostics sweep, brand new ITV, and comprehensive parts warranty.",
    badge: "Trust-Grade Status"
  }
];
