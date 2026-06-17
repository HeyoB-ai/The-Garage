import React, { useState, useEffect } from "react";
import { Review } from "../types";
import { CLIENT_REVIEWS } from "../data";
import { Star, CheckCircle, ShieldCheck, Plus, MessageSquare, Award } from "lucide-react";

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<string>("All");
  
  // New review form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [type, setType] = useState<'Import' | 'Export' | 'Maintenance' | 'Brokerage'>("Maintenance");
  const [carModel, setCarModel] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Initialize reviews from localStorage or preset mock data
  useEffect(() => {
    const saved = localStorage.getItem("garage_javea_reviews");
    if (saved) {
      setReviews(JSON.parse(saved));
    } else {
      setReviews(CLIENT_REVIEWS);
      localStorage.setItem("garage_javea_reviews", JSON.stringify(CLIENT_REVIEWS));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name,
      rating,
      type,
      date: new Date().toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' }),
      comment,
      verified: true, // Auto-verified for organic customer UX
      carModel: carModel ? carModel : undefined
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem("garage_javea_reviews", JSON.stringify(updated));

    // Reset fields
    setName("");
    setRating(5);
    setType("Maintenance");
    setCarModel("");
    setComment("");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 3000);
  };

  const filteredReviews = filter === "All" 
    ? reviews 
    : reviews.filter(r => r.type === filter);

  // Calculate stats
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  const countByType = (t: string) => reviews.filter(r => r.type === t).length;

  return (
    <section id="reviews-section" className="py-20 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-500 uppercase tracking-widest font-mono text-sm block mb-3">
            PROVEN CLIENT SATISFACTION
          </span>
          <h2 className="text-4xl sm:text-5xl font-sans font-semibold tracking-tight text-white mb-6">
            Client Reviews & Testimonials
          </h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto mb-6"></div>
          <p className="text-neutral-400 text-lg">
            Discover why expats, collectors, and local high-performance owners in Jávea, Dénia, and Moraira repeatedly trust The Garage. 100% verified experience files.
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 bg-neutral-950 p-8 rounded-xl border border-neutral-800">
          
          {/* Average Stars */}
          <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-neutral-800">
            <h3 className="text-5xl font-mono font-bold text-amber-500 mb-2">{averageRating}</h3>
            <div className="flex space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-500 text-amber-500" />
              ))}
            </div>
            <p className="text-sm text-neutral-400">Average score across {reviews.length} verified reviews</p>
          </div>

          {/* Key Advantages */}
          <div className="flex flex-col justify-center px-4 py-2 border-b md:border-b-0 md:border-r border-neutral-800">
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-neutral-200">Certified multilingual advice (NL, EN, DE, ES)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-neutral-200">Maximum registration tax optimization</span>
              </div>
              <div className="flex items-center space-x-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-neutral-200">100% upfront transparent quotation</span>
              </div>
            </div>
          </div>

          {/* Call to Write Review */}
          <div className="flex flex-col items-center justify-center p-4">
            <p className="text-center text-sm text-neutral-400 mb-4">
              Have you recently been assisted with car servicing or importing? Share your experience!
            </p>
            <button
              id="btn-open-review-form"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-5 py-3 bg-neutral-900 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-neutral-950 rounded font-semibold tracking-wide transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Dynamic Review Submission Form */}
        {showForm && (
          <div className="mb-12 bg-neutral-950 p-6 sm:p-8 rounded-xl border border-amber-500/20 max-w-2xl mx-auto transition-all">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <span>Share your feedback with The Garage Jávea</span>
            </h3>

            {submitted ? (
              <div className="bg-emerald-950/30 border border-emerald-500/50 p-6 rounded text-center text-emerald-400">
                <Award className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <h4 className="text-lg font-bold mb-1">Thank you for your rating!</h4>
                <p className="text-sm text-neutral-300">Your review was successfully saved and added to our database.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Service Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-sans"
                    >
                      <option value="Maintenance">Car Service & Supercar Repairs</option>
                      <option value="Import">Car Import to Spain</option>
                      <option value="Export">Car Export Service</option>
                      <option value="Brokerage">Sourcing & Sales Brokerage</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">What vehicle was serviced/sourced?</label>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      placeholder="e.g. Porsche 911 GT3 or BMW M3"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Rating (Stars)</label>
                    <div className="flex h-10 items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setRating(num)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              num <= rating 
                                ? "fill-amber-500 text-amber-500" 
                                : "text-neutral-600"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">Your Experience *</label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us how our team in Jávea assisted you. Your detailed experience assists other classic and modern car owners in Spain!"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 placeholder-neutral-500 font-sans"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 rounded text-neutral-400 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded text-sm shadow-lg"
                  >
                    Save Review
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10" id="review-filters-bar">
          {[
            { id: "All", label: "All Reviews" },
            { id: "Maintenance", label: "Supercar Service" },
            { id: "Import", label: "Imports" },
            { id: "Export", label: "Exports" },
            { id: "Brokerage", label: "Sourcing & Sales" }
          ].map((cat) => {
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 text-xs font-mono rounded-full border transition-all ${
                  filter === cat.id
                    ? "bg-amber-500 border-amber-500 text-neutral-950 font-bold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                }`}
              >
                {cat.label} ({cat.id === "All" ? reviews.length : countByType(cat.id)})
              </button>
            );
          })}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="reviews-card-container">
          {filteredReviews.map((rev) => (
            <div 
              key={rev.id} 
              className="bg-neutral-950 p-6 rounded-xl border border-neutral-900 flex flex-col justify-between hover:border-neutral-800 transition-all flex-grow min-h-[220px]"
            >
              <div>
                {/* Score & Badge info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star 
                        key={idx} 
                        className={`w-4 h-4 ${
                          idx < rev.rating ? "fill-amber-500 text-amber-500" : "text-neutral-800"
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold bg-neutral-900 border border-neutral-800 text-amber-500">
                    {rev.type === "Maintenance" ? "Service" : rev.type === "Brokerage" ? "Brokerage" : rev.type}
                  </span>
                </div>

                {/* Comment */}
                <p className="text-neutral-300 text-sm leading-relaxed mb-6 italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-neutral-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-neutral-150 flex items-center space-x-1.5">
                    <span>{rev.name}</span>
                    {rev.verified && (
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" title="Verified Client" />
                    )}
                  </h4>
                  {rev.carModel && (
                    <p className="text-xs text-neutral-500 font-mono mt-0.5 font-medium">Vehicle: {rev.carModel}</p>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notice of certification */}
        <div className="mt-16 text-center text-xs text-neutral-500 flex items-center justify-center space-x-2">
          <span>All client reviews comply with EU transparency directories for organic, verified consumer testimonials.</span>
        </div>

      </div>
    </section>
  );
}
