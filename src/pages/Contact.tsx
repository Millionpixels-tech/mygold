import { useState } from "react";
import Header from "../components/Header";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  // This just fakes sending the message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setName("");
    setEmail("");
    setMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />

      <main className="flex flex-col items-center justify-center px-3 py-12">
        {/* Card container */}
        <div className="w-full max-w-2xl bg-white/90 border border-yellow-100 rounded-3xl shadow-2xl px-6 py-10 mb-10">
          {/* Title & intro */}
          <h1 className="text-3xl sm:text-4xl font-black text-yellow-700 mb-2 text-center tracking-tight">Contact Us</h1>
          <p className="text-gray-600 text-lg font-medium text-center mb-6">
            We'd love to hear from you! Reach out to us with questions, feedback, or partnership opportunities.
          </p>

          {/* Contact details */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full shadow">
                <svg width={22} height={22} fill="none" viewBox="0 0 24 24"><path d="M21 6.5V18a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V6.5m18 0A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5m18 0v.08a2.5 2.5 0 0 1-1.07 2.06l-7.18 4.79a2.5 2.5 0 0 1-2.5 0l-7.18-4.8A2.5 2.5 0 0 1 3 6.57V6.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div>
                <div className="text-sm font-bold text-yellow-700">Email</div>
                <a href="mailto:support@mygold.lk" className="text-base font-medium text-gray-700 hover:underline">support@mygold.lk</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full shadow">
                <svg width={22} height={22} fill="none" viewBox="0 0 24 24"><path d="M3.9 5.9A16.8 16.8 0 0 0 3 12c0 1.3.15 2.6.45 3.8a2 2 0 0 0 1.07 1.33l2.57 1.15a2 2 0 0 0 2.1-.23l1.77-1.41a2 2 0 0 1 2.43-.09l1.74 1.38a2 2 0 0 0 2.12.22l2.58-1.14a2 2 0 0 0 1.07-1.33A16.8 16.8 0 0 0 21 12a16.8 16.8 0 0 0-.89-6.1 2 2 0 0 0-1.07-1.33l-2.57-1.15a2 2 0 0 0-2.1.23l-1.77 1.41a2 2 0 0 1-2.43.09l-1.74-1.38a2 2 0 0 0-2.12-.22L4.96 4.58a2 2 0 0 0-1.07 1.33Z" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div>
                <div className="text-sm font-bold text-yellow-700">Phone</div>
                <a href="tel:+94771234567" className="text-base font-medium text-gray-700 hover:underline">+94 77 123 4567</a>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-gray-700 font-semibold">Your Name</label>
              <input
                id="name"
                type="text"
                className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-medium"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-gray-700 font-semibold">Your Email</label>
              <input
                id="email"
                type="email"
                className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-medium"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="msg" className="text-gray-700 font-semibold">Message</label>
              <textarea
                id="msg"
                className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-medium resize-none"
                rows={4}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                required
                placeholder="How can we help you?"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
              disabled={sent}
            >
              {sent ? "Thank you!" : "Send Message"}
            </button>
            {sent && (
              <div className="text-green-700 text-center font-semibold mt-2">Message sent! We'll reply soon.</div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default Contact;
