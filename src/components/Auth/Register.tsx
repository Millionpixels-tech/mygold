import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";
import { getFriendlyFirebaseError } from "../../utils/firebaseErrors";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Email & password registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (password !== rePassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        phone,
        createdAt: new Date(),
        provider: "email",
      });
      // Send verification email
      await sendEmailVerification(userCredential.user);
      // Sign the user out immediately
      await auth.signOut();
      setInfo("Registration successful! Please check your email and verify your account before logging in.");
      // Optionally, redirect to a "verify your email" page
      // navigate("/verify-email");
    } catch (error: any) {
      setErr(getFriendlyFirebaseError(error));
    }
    setLoading(false);
  };

  // Google registration
  const handleGoogleSignUp = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // Save to Firestore
        await setDoc(
          doc(db, "users", result.user.uid),
          {
            uid: result.user.uid,
            name: result.user.displayName,
            email: result.user.email,
            phone: result.user.phoneNumber || "",
            photoURL: result.user.photoURL,
            createdAt: new Date(),
            provider: "google",
          },
          { merge: true }
        );
        // Google users don't need verification (they are trusted)
        navigate("/");
      }
    } catch (error: any) {
      setErr(getFriendlyFirebaseError(error));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />

      <main className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md p-8 bg-white/90 rounded-3xl shadow-2xl border border-yellow-100">
          <h2 className="text-3xl font-black text-yellow-700 mb-6 text-center tracking-tight">
            Register on <span className="text-yellow-600">mygold.lk</span>
          </h2>
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 mb-4 text-center">
              {err}
            </div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4 text-center">
              {info}
            </div>
          )}
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              disabled={loading}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Re-enter Password"
              value={rePassword}
              onChange={e => setRePassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              disabled={loading}
            />
            <button
              className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
              type="submit"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
          <div className="my-6 flex items-center justify-center">
            <span className="h-px flex-1 bg-yellow-200" />
            <span className="mx-3 text-yellow-600 font-medium">or</span>
            <span className="h-px flex-1 bg-yellow-200" />
          </div>
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-3 flex items-center justify-center gap-3 rounded-full bg-white border border-yellow-200 shadow-sm hover:shadow-md hover:bg-yellow-50 font-bold text-base text-yellow-700 active:scale-95 transition"
            type="button"
            disabled={loading}
          >
            <svg width={22} height={22} viewBox="0 0 48 48" className="inline-block">
              <g>
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 32.6 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l6.5-6.5C33.6 5.5 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8.6 19.7-20 0-1.3-.1-2.1-.2-3z"/>
                <path fill="#34A853" d="M6.3 14.1l7 5.1C15.1 16.3 19.1 13.5 24 13.5c2.6 0 5 .8 7 2.3l6.5-6.5C33.6 5.5 29 4 24 4c-7.7 0-14.1 5-17.7 12.1z"/>
                <path fill="#FBBC05" d="M24 44c5.1 0 9.7-1.7 13.2-4.5l-6.1-5c-2.2 1.5-5 2.5-8.1 2.5-6.1 0-11.2-4.1-13.1-9.6l-6.3 4.9C9.9 39 16.4 44 24 44z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1.1 2.7-3.5 4.7-6.3 6.1l6.1 5c3.6-3.3 5.9-8.2 5.9-13.6 0-1.3-.1-2.1-.2-3z"/>
              </g>
            </svg>
            Continue with Google
          </button>
          <div className="mt-6 text-center">
            <span className="text-gray-500 font-medium">
              Already have an account?
            </span>{" "}
            <Link
              to="/login"
              className="text-yellow-600 font-bold hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
