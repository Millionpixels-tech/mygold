import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import Header from "../../components/Header";

const GOOGLE_RESET_URL = "https://accounts.google.com/signin/v2/challenge/pwd";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [signInMethod, setSignInMethod] = useState<"password" | "google" | "">("");
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setInfo("");
    if (!email.trim()) return setErr("Please enter your email.");
    if (!signInMethod) return setErr("Please select how you signed up.");

    setLoading(true);

    try {
      if (signInMethod === "password") {
        await sendPasswordResetEmail(auth, email.trim(), {
          url: 'https://mygold.lk/__/auth/action' // <-- Custom domain!
        });
        setInfo("A password reset email has been sent. Please check your inbox.");
      } else if (signInMethod === "google") {
        setInfo(""); // Just show the Google info message below
      }
    } catch (error: any) {
      setErr(error.message || "Failed to process request.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />
      <main className="flex items-center justify-center min-h-[75vh]">
        <div className="w-full max-w-md p-8 bg-white/90 rounded-3xl shadow-2xl border border-yellow-100">
          <h2 className="text-3xl font-black text-yellow-700 mb-6 text-center tracking-tight">
            Reset your password
          </h2>
          <form className="flex flex-col gap-5" onSubmit={handleReset}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
            />
            <div>
              <label className="block mb-2 text-base font-semibold text-gray-700">
                How did you sign up?
              </label>
              <div className="flex flex-col gap-2 ml-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signInMethod"
                    value="password"
                    checked={signInMethod === "password"}
                    onChange={() => setSignInMethod("password")}
                  />
                  <span>Email & Password</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="signInMethod"
                    value="google"
                    checked={signInMethod === "google"}
                    onChange={() => setSignInMethod("google")}
                  />
                  <span>Google</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
            >
              {loading ? "Processing..." : "Send Reset Link"}
            </button>
          </form>
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 mt-4 text-center">{err}</div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mt-4 text-center">{info}</div>
          )}
          {signInMethod === "google" && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2 mt-4 text-center">
              If you signed up using Google, please{" "}
              <a href={GOOGLE_RESET_URL} className="underline font-semibold" target="_blank" rel="noopener noreferrer">
                reset your password via your Google Account
              </a>.
            </div>
          )}
          <div className="mt-6 text-center">
            <a href="/login" className="text-yellow-600 font-bold hover:underline">Back to Login</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
