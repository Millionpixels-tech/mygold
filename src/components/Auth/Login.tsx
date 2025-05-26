import { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";
import { getFriendlyFirebaseError } from "../../utils/firebaseErrors";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [userForResend, setUserForResend] = useState<any>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setShowVerify(false);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.providerData[0]?.providerId === "password") {
        if (!result.user.emailVerified) {
          setShowVerify(true);
          setUserForResend(result.user);
          setErr("Please verify your email before logging in.");
          await auth.signOut(); // Force logout to prevent accidental access
          setLoading(false);
          return;
        }
      }
      navigate("/");
    } catch (error: any) {
      setErr(getFriendlyFirebaseError(error));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setErr("");
    setInfo("");
    setShowVerify(false);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Save to Firestore only if user is new
      if (result.user) {
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
      }
      navigate("/");
    } catch (error: any) {
      setErr(getFriendlyFirebaseError(error));
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    setErr("");
    setInfo("");
    if (userForResend) {
      try {
        await sendEmailVerification(userForResend);
        setInfo("Verification email sent! Please check your inbox (and spam folder).");
      } catch (error: any) {
        setErr(getFriendlyFirebaseError(error));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />

      <main className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md p-8 bg-white/90 rounded-3xl shadow-2xl border border-yellow-100">
          <h2 className="text-3xl font-black text-yellow-700 mb-6 text-center tracking-tight">
            Login to <span className="text-yellow-600">mygold.lk</span>
          </h2>
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 mb-4 text-center">
              {err}
              {showVerify && (
                <div className="mt-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition"
                    type="button"
                    onClick={handleResendEmail}
                    disabled={loading}
                  >
                    Resend Verification Email
                  </button>
                </div>
              )}
            </div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4 text-center">
              {info}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              required
              autoFocus
              disabled={loading}
            />
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold w-full"
                required
                disabled={loading}
              />
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-yellow-600 hover:underline text-sm font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
              type="submit"
              disabled={loading}
            >
              Login
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="my-6 flex items-center justify-center">
            <span className="h-px flex-1 bg-yellow-200" />
            <span className="mx-3 text-yellow-600 font-medium">or</span>
            <span className="h-px flex-1 bg-yellow-200" />
          </div>
          <button
            onClick={handleGoogleSignIn}
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
              No account?
            </span>{" "}
            <Link
              to="/register"
              className="text-yellow-600 font-bold hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
