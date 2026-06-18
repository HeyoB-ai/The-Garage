import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Portfolio from "./components/Portfolio";
import Stock from "./components/Stock";
import Reviews from "./components/Reviews";
import ImportCalculator from "./components/ImportCalculator";
import AdvisorChat from "./components/AdvisorChat";
import { Car, BookingRequest } from "./types";
import { EXPERTISE_CARDS, BRIEF_ABOUT_DUTCH, MOTTO_DUTCH } from "./data";
import { 
  ShieldCheck, Wrench, CheckCircle, Calendar, 
  MapPin, Clock, Phone, Mail, Award, X, Sparkles, UserCheck, ChevronRight
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState("Maintenance");
  
  // Local lists for custom appointment bookings submitted
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Form states inside Booking Modal
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingLicense, setBookingLicense] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail || !bookingPhone || !bookingDate) return;

    const newBooking: BookingRequest = {
      id: `book-${Date.now()}`,
      name: bookingName,
      email: bookingEmail,
      phone: bookingPhone,
      licensePlate: bookingLicense,
      serviceType: selectedServiceType,
      preferredDate: bookingDate,
      message: bookingMsg,
      status: "Pending"
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem("garage_javea_bookings", JSON.stringify(updated));

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
      // Reset
      setBookingName("");
      setBookingEmail("");
      setBookingPhone("");
      setBookingLicense("");
      setBookingDate("");
      setBookingMsg("");
    }, 4000);
  };

  // Sync scroll on tab click
  useEffect(() => {
    if (activeTab === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const element = document.getElementById(`${activeTab}-section`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [activeTab]);

  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
      
      {/* Top Banner Alert (Trust & Language) */}
      <div className="bg-amber-500 text-neutral-950 text-xs font-bold font-mono py-2.5 px-4 text-center tracking-wide flex justify-center items-center gap-1.5 overflow-hidden">
        <ShieldCheck className="w-4 h-4 text-neutral-950 shrink-0" />
        <span>Certified Supercar Maintenance & Turnkey Import/Export Specialist • Costa Blanca • Speaking English, Dutch, German & Spanish</span>
      </div>

      {/* Header & Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openBooking={() => { setSelectedServiceType("Maintenance"); setShowBookingModal(true); }} 
      />

      {/* Hero Section */}
      <div className="relative bg-neutral-950 overflow-hidden py-16 sm:py-24 border-b border-neutral-900">
        
        {/* Background Visual Asset / Grid styling */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Text */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-[11px] font-mono tracking-wider text-amber-500 uppercase font-bold">Worry-free concierge service in Jávea</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] font-sans">
                The trusted partner for your <span className="text-amber-500 block sm:inline">premium vehicle</span>, in Spain
              </h1>
              
              <p className="text-neutral-400 text-base sm:text-lg mb-8 max-w-2xl leading-relaxed">
                {MOTTO_DUTCH} Fully-managed technical repair loops retaining global manufacturer warranty, paired with absolute administrative ease.
              </p>

              {/* Trust Indicators inside Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 mb-8" id="hero-trust-indicators">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs text-neutral-300 font-mono">100% Multilingual Experts</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs text-neutral-300 font-mono">Registered DGT Gestoría</span>
                </div>
                <div className="flex items-center space-x-2.5 col-span-2 sm:col-span-1">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs text-neutral-300 font-mono">OEM-Level Diagnostics</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  id="hero-cta-booking"
                  onClick={() => { setSelectedServiceType("Maintenance"); setShowBookingModal(true); }}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold transition-all shadow-lg shadow-amber-500/25 text-center text-sm uppercase tracking-wider rounded"
                >
                  Schedule Service / Inquiry
                </button>
                <a
                  href="#calc-section"
                  className="px-8 py-4 bg-neutral-900 hover:bg-neutral-850 text-neutral-100 font-semibold border border-neutral-800 transition-all text-center text-sm uppercase tracking-wider rounded"
                >
                  Calculate Import Taxes
                </a>
              </div>
            </div>

            {/* Right Column Visual / Sporty car imagery */}
            <div className="lg:col-span-5">
              <div className="relative group rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 bg-neutral-950 text-amber-500 text-[10px] font-mono tracking-widest uppercase font-bold py-1 px-3 border-b border-r border-neutral-800 rounded-br">
                  Our Showroom & Facility
                </div>
                
                <img 
                  src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800" 
                  alt="High-spec sport coupe detail" 
                  className="w-full h-80 object-cover rounded-xl mt-4 border border-neutral-800 filter brightness-95 group-hover:brightness-100 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />

                <div className="mt-4 flex justify-between items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div>
                    <span className="text-[10px] text-amber-500 font-mono block uppercase">Location</span>
                    <span className="text-sm font-semibold block text-white">Jávea • Augusta Avenue</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-mono block uppercase">Accreditation</span>
                    <span className="text-sm font-semibold text-neutral-200 block">ITV Certified Center</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Trust & Stats Ribbon */}
      <div className="bg-neutral-950 border-b border-neutral-900/60 py-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" id="statistics-ribbon">
            <div className="p-4 rounded border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-all">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-amber-500 block mb-1">5 ★</span>
              <span className="text-xs uppercase font-mono text-neutral-400">Verified 5-Star Reviews</span>
            </div>
            <div className="p-4 rounded border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-all">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-amber-500 block mb-1">150+</span>
              <span className="text-xs uppercase font-mono text-neutral-400">Import Dossiers Handled</span>
            </div>
            <div className="p-4 rounded border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-all">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-amber-500 block mb-1">100%</span>
              <span className="text-xs uppercase font-mono text-neutral-400">Transparent Upfront Quotes</span>
            </div>
            <div className="p-4 rounded border border-neutral-900 bg-neutral-950/40 hover:border-neutral-800 transition-all">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-amber-500 block mb-1">15+</span>
              <span className="text-xs uppercase font-mono text-neutral-400">Yrs Pure Automotive Exp</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Segment */}
      <div className="py-20 bg-neutral-950 text-white" id="about-segment-wrapper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl relative">
                <span className="text-amber-500 font-mono text-xs uppercase tracking-widest block mb-4">Warranty & Peace of mind</span>
                
                <div className="space-y-6">
                  
                  <div className="flex items-start space-x-3.5">
                    <UserCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Expert Multilingual Guarantees</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">No language barrier. Our multilingual team guides you through specific Spanish taxes, registration math, and title de-registrations.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <Wrench className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Supercar Service Center</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">Dealer-level diagnostic computers for all complex marques, electronic alignment rigs, major services, brake tests, and ITV diagnostic prep.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">ITV Approvals & Historic Licensing</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">We physically coordinate the import inspection at Accredited ITV Stations, compiling the required Technical Sheet for clean Spain registration.</p>
                    </div>
                  </div>

                </div>

                <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Authorized ITV Prep Partner</span>
                  <span className="text-amber-400 font-bold">100% Accredited</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <span className="text-amber-500 uppercase tracking-widest font-mono text-xs block mb-3">Who We Are</span>
              <h2 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight mb-6">
                Worry-Free Automotive Excellence on the Costa Blanca
              </h2>
              <div className="h-1 w-20 bg-amber-500 mb-6"></div>
              
              <p className="text-neutral-300 text-base leading-relaxed mb-6">
                {BRIEF_ABOUT_DUTCH}
              </p>
              
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                At The Garage, we bypass swift sales pitches. We focus on mechanical precision, absolute transparency, and keeping our word. Whether importing a summer cruiser, preparing your daily sport SUV for the rigorous Spanish ITV check, or sourcing a vintage classic collectible: The Garage Jávea is your ultimate destination.
              </p>

              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-500 uppercase font-mono block">Direct Contact Dial</span>
                  <span className="text-white font-bold font-sans text-sm">+34 965 020 442</span>
                </div>
                <a
                  href="mailto:info@thegaragajavea.com"
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-white rounded text-xs tracking-wider uppercase font-mono transition-colors"
                >
                  Send Email
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Expertise Segment */}
      <section id="expertise-section" className="py-20 bg-neutral-900 border-t border-b border-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-amber-500 uppercase tracking-widest font-mono text-sm block mb-3">Our Core Pillars</span>
            <h2 className="text-4xl font-sans font-bold tracking-tight text-white mb-6">Complete Automotive Support Under One Roof</h2>
            <div className="h-1 w-20 bg-amber-500 mx-auto mb-6"></div>
            <p className="text-neutral-400">
              Our workspace operates on three primary core activities, ensuring peerless expertise and hands-free administrative convenience:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {EXPERTISE_CARDS.map((card, idx) => (
              <div 
                key={card.id || idx}
                className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 hover:border-amber-500/20 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-amber-500/20 mb-4">
                  {card.badge}
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-sans">
                  {card.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          {/* Trust FAQs block */}
          <div className="mt-16 bg-neutral-950 p-8 rounded-xl border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Why do sports car owners and expats choose us?</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-white mb-2">1. End-To-End Import & Registration Concierge</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Registering a vehicle in Alicante involves customs authorities, emissions tariffs, CO2 assessments, import ITV engineering parameters, and Spanish Hacienda tables. We coordinate 100% of the transport, homologation certificates, and license paperwork.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-2">2. OEM-Grade Diagnostics & Authorized Maintenance</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Our state-of-the-art diagnostic protocols ensure your vehicle's manufacturer warranty remains globally intact. We log every oil service directly into the digital databases of Audi, BMW, and Porsche.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Import & Export Area */}
      <section id="import-section">
        <ImportCalculator />
      </section>

      {/* Portfolio Area */}
      <section id="portfolio-section">
        <Portfolio />
      </section>

      {/* Stock Car Sales Area */}
      <section id="verkoop-section">
        <Stock 
          onSelectCar={(car) => setSelectedCar(car)} 
          openBooking={() => { setSelectedServiceType("Brokerage"); setShowBookingModal(true); }}
        />
      </section>

      {/* Reviews Area */}
      <section id="reviews-section">
        <Reviews />
      </section>

      {/* FAQ OBJECTION RESOLVER */}
      <section id="faq-section" className="py-20 bg-neutral-950 border-t border-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-amber-500 uppercase tracking-widest font-mono text-xs block mb-3">Questions & Answers</span>
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <div className="h-1 w-20 bg-amber-500 mx-auto mt-4"></div>
          </div>

          <div className="space-y-6">
            
            <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-800">
              <h4 className="font-bold text-sm text-white mb-2">How long does importing a vehicle to Spain take?</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                On average, the entire physical journey (from transit collection to mounting Spanish plates in Javea) takes 10 to 14 business days. We coordinate trailer pickups, technical sheets, ITV passes, tax collections, and final DGT log sheets.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-800">
              <h4 className="font-bold text-sm text-white mb-2">Is my manufacturer warranty preserved at The Garage?</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Absolutely. We conform to EU Block Exemption directives, meaning our workshop preserves full factory warranties. We log digital services directly to Audi, Porsche, BMW, and AMG servers.
              </p>
            </div>

            <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-800">
              <h4 className="font-bold text-sm text-white mb-2">What are the emissions tax rates for registration?</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The Spanish registration tax (Impuesto de Matriculación) is CO2-dependent. Vehicles under 120g/km pay 0%. Between 120g/km and 200g/km, tax rates scale between 4.75% and 14.75% of Spain's depreciated Hacienda rating.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Contact & Map Footer Section */}
      <section id="contact-section" className="py-20 bg-neutral-900 border-t border-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info */}
            <div className="lg:col-span-5">
              <span className="text-amber-500 uppercase tracking-widest font-mono text-xs block mb-3">Get in Touch Today</span>
              <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight mb-6">Visit Our Showroom</h2>
              <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                Our specialized workshop and consultation lounge are based in Jávea. Stop by to speak with our import specialists, browse sports cars, or schedule high-performance diagnostics. Schedulings are highly recommended.
              </p>

              <div className="space-y-4 text-sm font-mono mb-8">
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">FACILITY ADRESS</span>
                    <span className="text-white font-sans text-sm block">Carrer de Augusta, Bloque 4, 03730 Jávea, Alicante, Spain</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">BUSINESS HOURS</span>
                    <span className="text-white font-sans text-sm block">Monday to Friday: 08:30 - 18:00</span>
                    <span className="text-neutral-500 block text-xs mt-0.5">Saturday & Sunday: By Appointment Only</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">Call / WhatsApp Direct</span>
                    <a href="tel:+34965020442" className="text-white font-sans font-bold text-sm hover:text-amber-400 block">+34 965 020 442</a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-neutral-400 block font-mono">EMAIL SPECIFICATION</span>
                    <a href="mailto:info@thegaragajavea.com" className="text-white font-sans text-sm hover:text-amber-400 block">info@thegaragajavea.com</a>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-neutral-950 p-8 rounded-xl border border-neutral-800">
                <h3 className="text-lg font-bold text-white mb-6">Send Immediate Inquiry</h3>
                
                <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your inquiry was successfully received. Our specialists will contact you shortly."); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Your Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Your first and last name"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Email Address *</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. email@example.com"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. +31 6 12345678"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Subject of Interest</label>
                      <select className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 select-style">
                        <option value="import">Spanish Import & Transit</option>
                        <option value="onderhoud">Supercar Service & ITV</option>
                        <option value="verkoop">Exclusive vehicle sourcing</option>
                        <option value="andere">Other inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Detailed Inquiry Text *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can we assist you? Please mention any specific vehicle year, engine, or CO2 rate concerns."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs uppercase tracking-wider transition-all"
                  >
                    Submit Secure Inquiry
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-neutral-950 py-12 border-t border-neutral-900 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="font-extrabold text-sm text-white tracking-widest uppercase mb-1">
                The Garage Jávea • 2026
              </div>
              <p>Specialists in certified sports car maintenance, turnkey imports, and sales.</p>
            </div>
            
            <div className="flex gap-4 font-mono">
              <a href="#about-segment-wrapper" className="hover:text-amber-500">Our Story</a>
              <span>•</span>
              <a href="#calc-section" className="hover:text-amber-500">Import Calculator</a>
              <span>•</span>
              <a href="/nieuws" className="hover:text-amber-500">Nieuws</a>
              <span>•</span>
              <a href="/beheer" className="hover:text-amber-500">Beheer</a>
            </div>

            <div>
              <p>© 2026 thegaragejavea.com. All Rights Reserved.</p>
              <p className="text-[10px] text-neutral-600 mt-1">ITV / DGT Accredited & Certified Partner</p>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Bot Advisor Overlay Panel */}
      <AdvisorChat />

      {/* MODAL 1: Individual Car Details Modal */}
      {selectedCar && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedCar(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/65 text-neutral-400 hover:text-white hover:scale-105 transition-all text-sm z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-64 sm:h-80 w-full overflow-hidden">
              <img src={selectedCar.image} alt={selectedCar.model} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <div className="p-6 sm:p-8">
              <span className="text-xs uppercase font-mono text-amber-500 font-bold block mb-1">{selectedCar.make}</span>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedCar.model}</h3>
              <p className="text-amber-400 text-xl font-mono font-bold mb-4">€{selectedCar.price.toLocaleString("en-US")}</p>

              <p className="text-sm text-neutral-300 leading-relaxed mb-6 bg-neutral-950 p-4 rounded border border-neutral-850">
                {selectedCar.description}
              </p>

              <h4 className="text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">Full Specifications & Equipment</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {selectedCar.specs.map((spec, i) => (
                  <li key={i} className="text-xs text-neutral-200 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-lg border border-neutral-850 mb-6 text-xs text-neutral-300 font-mono">
                <div>
                  <span className="text-neutral-500 uppercase text-[10px] block font-mono">Powertrain</span>
                  <span>{selectedCar.engine}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase text-[10px] block font-mono">Mileage</span>
                  <span>{selectedCar.mileage.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase text-[10px] block font-mono">Fuel / Gearbox</span>
                  <span>{selectedCar.fuel} / {selectedCar.transmission}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase text-[10px] block font-mono">Roadworthiness & Status</span>
                  <span className="text-emerald-400 font-bold">{selectedCar.status}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedCar(null)}
                  className="w-1/2 py-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded font-semibold text-xs text-neutral-300"
                >
                  Back to Collection
                </button>
                <button
                  onClick={() => {
                    setSelectedCar(null);
                    setSelectedServiceType("Brokerage");
                    setShowBookingModal(true);
                  }}
                  className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs uppercase"
                >
                  Book Sourcing Inquiry / Test Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 2: Interactive Appointment Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-950 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Schedule Service & Sourcing Advisory</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">Book certified diagnostics, ITV check preparation, or a custom import advisory.</p>

            {bookingSuccess ? (
              <div className="bg-emerald-950/20 border border-emerald-500/40 p-8 rounded text-center text-emerald-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 animate-bounce" />
                <h4 className="text-lg font-bold mb-1">Appointment Request Confirmed!</h4>
                <p className="text-xs text-neutral-300">We have securely received your request. Our multilingual team will confirm your exact slot via phone or email shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder="e.g. Lucas Vance"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="e.g. lucas@vance.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="e.g. +34 600 000 000"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">License Plate (e.g. UK/NL/ES)</label>
                    <input
                      type="text"
                      value={bookingLicense}
                      onChange={(e) => setBookingLicense(e.target.value)}
                      placeholder="e.g. G20-HSV"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-505 focus:outline-none uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Service Required</label>
                    <select
                      value={selectedServiceType}
                      onChange={(e) => setSelectedServiceType(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Maintenance">Scheduled Maintenance / Annual Service</option>
                      <option value="ITV_APK">ITV Inspection Prep & Pass Service</option>
                      <option value="Import_Advies">Turnkey Spanish Import Consulting</option>
                      <option value="Autodiagnose">Engine / ECU Trouble Code Diagnostics</option>
                      <option value="Brokerage">Pre-purchase Inspection / Sourcing Briefing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Specific items or vehicle details</label>
                  <textarea
                    rows={3}
                    value={bookingMsg}
                    onChange={(e) => setBookingMsg(e.target.value)}
                    placeholder="e.g. Porsche 911 GT3 major inspection, checking suspension noise, or import document evaluation..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder-neutral-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-xs uppercase tracking-wider transition-all"
                >
                  Submit Concierge Booking
                </button>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
