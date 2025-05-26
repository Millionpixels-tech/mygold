import { useState } from "react";
import Header from "../components/Header";

const faqs = [
  {
    question: "How do I post a gold item for sale?",
    answer:
      "Sign up or log in, then click on 'Add Item' in the header or on your profile. Fill in the details and upload clear images of your gold item. Submit, and your listing will be live after review.",
  },
  {
    question: "Is there a fee to list my gold items?",
    answer:
      "No, listing items is 100% free on mygold.lk! You can post as many items as you like.",
  },
  {
    question: "How do I bid on an item?",
    answer:
      "Find an item you’re interested in, enter your bid and a short description, then submit your bid. The seller will see your bid and contact details.",
  },
  {
    question: "Can I delete my listing?",
    answer:
      "Yes, go to your profile, find the item you wish to delete, and click the delete button next to it.",
  },
  {
    question: "How do I contact a seller or bidder?",
    answer:
      "You can contact them via the contact details shown on their listing or bid, once you are logged in.",
  },
  {
    question: "Is my phone number/email visible to everyone?",
    answer:
      "Your contact details are only shared with relevant users (e.g., sellers see bidder details) and are not displayed publicly.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click on 'Forgot password?' to reset your password. For Google users, use Google’s password recovery.",
  },
];

const QA = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />
      <main className="max-w-2xl mx-auto px-3 py-12">
        <div className="bg-white/90 border border-yellow-100 rounded-3xl shadow-xl px-7 py-8 mb-10">
          <h1 className="text-3xl font-black text-yellow-700 mb-3 text-center tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            If you can't find what you're looking for, please <a href="/contact" className="text-yellow-600 underline">contact us</a>.
          </p>
          <div className="flex flex-col gap-5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`border border-yellow-100 rounded-2xl transition-shadow shadow ${openIndex === idx ? "bg-yellow-50" : "bg-white"}`}
              >
                <button
                  className="flex w-full justify-between items-center p-5 focus:outline-none text-left"
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  aria-expanded={openIndex === idx}
                  aria-controls={`faq-panel-${idx}`}
                >
                  <span className="font-semibold text-lg text-yellow-700">{faq.question}</span>
                  <span className={`transition-transform ml-2 ${openIndex === idx ? "rotate-180" : ""}`}>
                    <svg width={22} height={22} viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5" stroke="#F59E42" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-panel-${idx}`}
                  className={`overflow-hidden transition-all px-5 ${openIndex === idx ? "max-h-40 py-2" : "max-h-0 py-0"}`}
                  style={{ transition: "all 0.3s cubic-bezier(.4,0,.2,1)" }}
                  aria-hidden={openIndex !== idx}
                >
                  <div className="text-gray-700">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QA;
