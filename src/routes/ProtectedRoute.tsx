import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { onAuthStateChanged, User, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase/firebase";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [resent, setResent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center mt-10">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check for email verification (only for email/password users)
  // For Google and other OAuth providers, skip this check
  const isGoogle = user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
  if (!isGoogle && !user.emailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-lg bg-white border border-yellow-200 rounded-2xl px-6 py-8 shadow-xl text-center">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Verify your email address</h2>
          <p className="text-gray-600 mb-4">
            Please verify your email to access this page.<br />
            Check your inbox for a verification email.
          </p>
          <button
            onClick={async () => {
              setResendLoading(true);
              try {
                await sendEmailVerification(user);
                setResent(true);
              } catch (e) {}
              setResendLoading(false);
            }}
            className="mt-2 px-5 py-2 rounded-full bg-yellow-400 text-white font-bold shadow hover:bg-yellow-500 transition"
            disabled={resendLoading || resent}
          >
            {resendLoading
              ? "Sending..."
              : resent
              ? "Email sent!"
              : "Resend Verification Email"}
          </button>
          <div className="mt-4 text-gray-500 text-sm">
            <span>
              Refresh this page after verifying your email.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
