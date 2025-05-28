import { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import ProfileItemCard from "../components/ProfileItemCard";
import Header from "../components/Header";

type ItemType = {
  id: string;
  title: string;
  description: string;
  images: string[];
  highestBid: number;
  bidsCount: number;
  district: string;
  sold?: boolean; // <--- NEW
};

const Profile = () => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || "");
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [error, setError] = useState("");
  const [userShop, setUserShop] = useState<any>(null); // <--- Shop state
  const navigate = useNavigate();

  // Fetch user's items
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    (async () => {
      const q = query(collection(db, "items"), where("ownerId", "==", auth.currentUser?.uid));
      const snap = await getDocs(q);
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ItemType[]);
    })();
  }, []);

  // Fetch phone number from Firestore user profile on mount
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    (async () => {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser?.uid ? auth.currentUser.uid : 'none'));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData && userData.phone) setPhone(userData.phone);
      }
    })();
  }, []);

  // Fetch if user has a shop
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    (async () => {
      const q = query(collection(db, "shops"), where("ownerId", "==", auth && auth.currentUser ? auth.currentUser.uid : ''));
      const snap = await getDocs(q);
      if (!snap.empty) setUserShop({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setUserShop(null);
    })();
  }, []);

  // Delete item
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure to delete this item?")) {
      await deleteDoc(doc(db, "items", id));
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // MARK AS SOLD handler
  const handleMarkSold = async (id: string) => {
    if (!window.confirm("Mark this item as sold? This will show it as sold to all users.")) return;
    await updateDoc(doc(db, "items", id), { sold: true });
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, sold: true } : item
    ));
  };

  // Open popup and reset
  const openModal = async () => {
    setShowModal(true);
    setError("");
    setModalMsg("");
    setDisplayName(auth.currentUser?.displayName || "");
    setPhotoURL(auth.currentUser?.photoURL || "");
    setFile(null);
    setPassword("");
    setPassword2("");
    setOldPassword("");
    // Always get the latest phone number when opening modal
    if (auth.currentUser?.uid) {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPhone(userData?.phone || "");
      }
    }
  };

  // Profile update logic (full and unchanged)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setModalMsg("");
    // PHONE VALIDATION
    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      setUpdating(false);
      return;
    }
    try {
      // 1. Profile pic
      let url = photoURL;
      if (file) {
        const storageRef = ref(storage, `profile-pictures/${auth.currentUser?.uid}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }
      // 2. Name and pic update
      await updateProfile(auth.currentUser!, {
        displayName,
        photoURL: url,
      });

      // 3. Phone update (in Firestore users collection)
      if (phone && auth.currentUser?.uid) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { phone });
      }

      // 4. Password update (if not Google account)
      const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === "google.com");
      if (password && !isGoogleUser) {
        if (password !== password2) throw new Error("Passwords do not match!");
        if (password.length < 6) throw new Error("Password too short");
        if (!oldPassword) throw new Error("Enter old password for security.");
        // Reauthenticate before password change
        const cred = EmailAuthProvider.credential(auth.currentUser!.email!, oldPassword);
        await reauthenticateWithCredential(auth.currentUser!, cred);
        await updatePassword(auth.currentUser!, password);
      }
      setModalMsg("Profile updated!");
      setShowModal(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    }
    setUpdating(false);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure to delete your account? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser!.uid));
      await auth.currentUser!.delete();
      window.location.href = "/";
    } catch (err: any) {
      setError("Failed to delete account: " + err.message);
    }
  };

  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === "google.com");

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 font-sans">
      <Header />
      {/* MODAL for update */}
      {showModal && (
        <div
          className="
            fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-2 animate-fadeIn
            min-h-screen overflow-y-auto
          "
          style={{ overscrollBehavior: "contain" }}
          onClick={() => setShowModal(false)}
        >
          <form
            className="
              bg-white rounded-3xl shadow-2xl border border-yellow-100
              w-full max-w-md flex flex-col gap-4 relative
              my-10 sm:my-0
              p-4 sm:p-8
              max-h-[90vh] overflow-y-auto
            "
            style={{ minWidth: 0 }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleUpdateProfile}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-xl text-gray-400 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h3 className="text-2xl font-black text-yellow-700 mb-1 text-center">Update Profile</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-center">
                {error}
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="profilePicInput"
                onChange={handleFileChange}
              />
              <label htmlFor="profilePicInput" className="cursor-pointer">
                <img
                  src={photoURL || "/profile-placeholder.svg"}
                  alt="Profile"
                  className="w-20 h-20 object-cover rounded-full border-4 border-yellow-300 shadow bg-yellow-50 hover:opacity-80 transition"
                />
                <div className="text-xs text-gray-500 text-center mt-1">Change Photo</div>
              </label>
            </div>
            <input
              type="text"
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              placeholder="Profile Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={40}
              required
            />
            <input
              type="tel"
              className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
              placeholder="Phone Number"
              value={phone}
              onChange={e => {
                // Only allow numbers, trim to 10 digits max
                const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(clean);
              }}
              maxLength={10}
              required
            />
            {!isGoogleUser && (
              <>
                <input
                  type="password"
                  className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
                  placeholder="New Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                />
                <input
                  type="password"
                  className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
                  placeholder="Re-enter New Password"
                  value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  minLength={6}
                />
                <input
                  type="password"
                  className="px-4 py-3 rounded-xl border border-yellow-200 bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base font-semibold"
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  minLength={6}
                />
              </>
            )}
            {isGoogleUser && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded text-center text-sm">
                Password cannot be changed for Google Sign-In users.
              </div>
            )}
            <button
              type="submit"
              disabled={updating}
              className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
            >
              {updating ? "Updating..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 hover:from-red-600 hover:to-red-400 text-white font-bold text-lg shadow active:scale-95 transition"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
            {modalMsg && <div className="text-green-700 text-center">{modalMsg}</div>}
          </form>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-3 py-10">
        <div className="bg-white/90 rounded-3xl shadow-xl border border-yellow-100 p-7">
          <div className="flex flex-col items-center gap-5 mb-10">
            <img
              src={auth.currentUser?.photoURL || "/profile-placeholder.svg"}
              alt="Profile"
              className="w-24 h-24 object-cover rounded-full border-4 border-yellow-300 shadow-lg bg-yellow-50"
            />
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-lg font-bold text-yellow-700">{auth.currentUser?.displayName}</span>
              <span className="text-gray-500">{auth.currentUser?.email}</span>
              {phone && (
                <span className="text-gray-700 font-medium">Phone: {phone}</span>
              )}
              <button
                type="button"
                className="w-full max-w-xs py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition mt-2"
                onClick={openModal}
              >
                Update Profile
              </button>
            </div>
          </div>
          
          {/* === SHOP MANAGER SECTION === */}
          <div className="mb-8 w-full flex flex-col items-center">
            <button
              className={`
                w-full max-w-xs py-3 rounded-full
                ${userShop
                  ? "bg-gradient-to-br from-yellow-600 to-yellow-400 hover:from-yellow-700 hover:to-yellow-500"
                  : "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400"}
                text-white font-bold text-lg shadow active:scale-95 transition
              `}
              onClick={() => navigate("/shop-manager")}
            >
              {userShop ? "Manage Your Shop" : "Start Your Shop"}
            </button>
            <div className="mt-2 text-gray-500 text-sm text-center max-w-xs">
              {userShop
                ? "Manage your shop details and reviews here."
                : "Start your own shop to make your business more discoverable, collect customer reviews, and boost your sales!"}
            </div>
          </div>
          {/* === END SHOP MANAGER SECTION === */}

          {/* Items list */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-bold text-yellow-700">Your Listings</h3>
              <div className="text-gray-500 font-medium">Total: {items.length}</div>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white text-base font-bold rounded-full shadow transition active:scale-95"
              onClick={() => navigate("/add-item")}
            >
              <svg width={18} height={18} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.12}/>
                <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add New Item
            </button>
          </div>
          <div className="grid gap-5 px-1 sm:px-2">
            {items.length === 0 && (
              <div className="text-gray-400 text-center py-6">No items posted yet.</div>
            )}
            {items.map(item => (
              <ProfileItemCard
                key={item.id}
                {...item}
                onDelete={handleDelete}
                onMarkSold={handleMarkSold} // <-- Pass handler
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
