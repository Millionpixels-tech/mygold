import Header from "../components/Header";

const stepsSellers = [
  { icon: "📦", title: "Add Item", desc: "Create a new listing with photos, details, and your preferred price." },
  { icon: "🔔", title: "Get More Bids", desc: "Wait for buyers to place bids. More bids mean a better price for you!" },
  { icon: "📞", title: "Contact Bidder", desc: "Call the highest or any preferred bidder using their provided contact." },
  { icon: "💰", title: "Sell Your Item", desc: "Complete the transaction directly with the buyer. You manage payment & delivery." },
];

const stepsBuyers = [
  { icon: "🔎", title: "Find Best Item for You", desc: "Browse listings and find the most suitable gold item that matches your needs." },
  { icon: "💸", title: "Place Your Bid", desc: "Bid as high as you want to win the item. Watch for bidding competition!" },
  { icon: "📲", title: "Get a Call", desc: "If your bid wins or is accepted, the seller will contact you directly." },
  { icon: "🎉", title: "Receive Your Item", desc: "Meet the seller, inspect the item, and complete the purchase." },
];

const HowItWorks = () => (
  <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
    <Header />
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black text-yellow-700 text-center mb-10 tracking-tight">
        How It Works
      </h1>
      <div className="grid md:grid-cols-2 gap-10">
        {/* Sellers Section */}
        <section>
          <h2 className="text-2xl font-bold text-yellow-700 mb-6 flex items-center gap-2">
            <span className="text-yellow-400 text-3xl">🛒</span>
            For Sellers
          </h2>
          <ol className="space-y-6">
            {stepsSellers.map((step, idx) => (
              <li key={idx} className="flex items-start gap-4 bg-white rounded-2xl shadow-lg border border-yellow-100 p-5 hover:shadow-2xl transition">
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <div className="font-bold text-lg text-yellow-700 mb-1">
                    Step {idx + 1}: {step.title}
                  </div>
                  <div className="text-gray-700">{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        {/* Buyers Section */}
        <section>
          <h2 className="text-2xl font-bold text-yellow-700 mb-6 flex items-center gap-2">
            <span className="text-yellow-400 text-3xl">🏆</span>
            For Buyers
          </h2>
          <ol className="space-y-6">
            {stepsBuyers.map((step, idx) => (
              <li key={idx} className="flex items-start gap-4 bg-white rounded-2xl shadow-lg border border-yellow-100 p-5 hover:shadow-2xl transition">
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <div className="font-bold text-lg text-yellow-700 mb-1">
                    Step {idx + 1}: {step.title}
                  </div>
                  <div className="text-gray-700">{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Disclaimer */}
      <div className="max-w-2xl mx-auto mt-14 bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-2xl shadow text-yellow-900 text-center text-base font-medium">
        <strong className="block mb-1 text-yellow-800">Important:</strong>
        <span>
          <b>All transactions are handled directly between sellers and buyers.</b> 
          We do not participate in, process, or guarantee any payments, deliveries, or item inspections. Use your own discretion and judgment when making deals. We are not responsible for any part of the transaction process.
        </span>
      </div>
    </main>
  </div>
);

export default HowItWorks;
