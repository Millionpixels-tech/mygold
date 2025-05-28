import { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { districts } from "../utils/districts";
import Header from "../components/Header";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo

function LocationPicker({ value, onChange }: any) {
  useMapEvents({
    click(e: any) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

function slugifyShop(shopName: string, uid: string) {
  return (
    shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") +
    "-" +
    uid
  );
}

export default function ShopWizard() {
  const user = auth.currentUser;
  const [step, setStep] = useState(1);

  // Shop fields
  const [shop, setShop] = useState<any>(null);
  const [shopName, setShopName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const navigate = useNavigate();

  // Load current shop if exists
  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = doc(db, "shops", user.uid);
      const snap = await getDoc(q);
      if (snap.exists()) {
        const data = snap.data();
        setShop(data);
        setShopName(data.shopName || "");
        setLogoUrl(data.logoUrl || "");
        setCoverUrl(data.coverUrl || "");
        setDescription(data.description || "");
        setDistrict(data.district || "");
        setAddress(data.address || "");
        setLocation(data.location || null);
        setContactPhone(data.contactPhone || "");
        setContactEmail(data.contactEmail || "");
        setFacebook(data.facebook || "");
        setWhatsapp(data.whatsapp || "");
      }
    })();
  }, [user]);

  // Image upload helpers
  const handleImage = async (file: File, path: string) => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Step 1: Basic info
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!shopName.trim()) {
      setErr("Shop name is required.");
      return;
    }
    if (!logo && !logoUrl) {
      setErr("Logo image is required.");
      return;
    }
    if (!cover && !coverUrl) {
      setErr("Cover image is required.");
      return;
    }
    setStep(2);
  };

  // Step 2: Details + upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    // Description check
    if (!description.trim()) {
      setErr("Description is required.");
      setLoading(false);
      return;
    }
    if (description.length > 300) {
      setErr("Description must be at most 300 characters.");
      setLoading(false);
      return;
    }
    if (!district) {
      setErr("Please select a district.");
      setLoading(false);
      return;
    }
    if (!address.trim()) {
      setErr("Address is required.");
      setLoading(false);
      return;
    }
    // Phone
    if (!/^\d{10}$/.test(contactPhone)) {
      setErr("Contact phone must be exactly 10 digits.");
      setLoading(false);
      return;
    }
    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setErr("Enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!location) {
      setErr("Please select your shop's location on the map.");
      setLoading(false);
      return;
    }

    try {
      let upLogoUrl = logoUrl;
      let upCoverUrl = coverUrl;
      if (logo) upLogoUrl = await handleImage(logo, `shops/${user?.uid}-logo.png`);
      if (cover) upCoverUrl = await handleImage(cover, `shops/${user?.uid}-cover.png`);
      const data = {
        ownerId: user?.uid,
        ownerName: user?.displayName || "",
        shopName: shopName,
        logoUrl: upLogoUrl,
        coverUrl: upCoverUrl,
        description,
        district: district.toLowerCase(),
        address,
        location,
        contactPhone,
        contactEmail,
        facebook,
        whatsapp,
        createdAt: shop?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "shops", user ? user.uid : ''), data);
      setInfo("Shop saved!");
      // Navigate with SEO-friendly URL
      navigate(`/shop/${slugifyShop(shopName, user?.uid || "")}`);
    } catch (error) {
      setErr("Failed to save shop.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <Header />
      <main className="max-w-lg mx-auto my-10 bg-white rounded-3xl shadow-xl border border-yellow-100 p-6">

        {/* PREVIEW BUTTON */}
        {user && shop && (
          <button
            className="w-full mb-4 py-3 rounded-full bg-yellow-400 text-white font-bold text-lg hover:from-yellow-700 hover:to-yellow-500 shadow"
            onClick={() => navigate(`/shop/${slugifyShop(shop.shopName, user.uid)}`)}
            type="button"
          >
            Preview Shop Page
          </button>
        )}

        <h2 className="text-2xl font-black text-yellow-700 text-center mb-4">
          {shop ? "Update Your Shop" : "Create Your Gold Shop"}
        </h2>
        {err && <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-2">{err}</div>}
        {info && <div className="bg-green-50 text-green-700 px-4 py-2 rounded mb-2">{info}</div>}

        <form onSubmit={step === 1 ? handleStep1 : handleSubmit} className="flex flex-col gap-5">
          {step === 1 && (
            <>
              <div>
                <label className="font-semibold mb-1 block">Shop Name <span className="text-red-500">*</span></label>
                <input
                  className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="font-semibold mb-1 block">Logo <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files && setLogo(e.target.files[0])}
                />
                {(logo || logoUrl) && (
                  <img src={logo ? URL.createObjectURL(logo) : logoUrl} alt="logo"
                    className="w-16 h-16 mt-2 rounded-full object-cover border-2 border-yellow-300 shadow" />
                )}
              </div>
              <div className="flex-1">
                <label className="font-semibold mb-1 block">Cover Image <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files && setCover(e.target.files[0])}
                />
                {(cover || coverUrl) && (
                  <img src={cover ? URL.createObjectURL(cover) : coverUrl} alt="cover"
                    className="w-full h-16 object-cover mt-2 rounded-xl border-2 border-yellow-200 shadow" />
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-full bg-yellow-400 text-white font-bold text-lg hover:bg-yellow-500"
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="font-semibold mb-1 block">Description <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 min-h-[60px]"
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 300))}
                  required
                  maxLength={300}
                  rows={3}
                />
                <div className="text-xs text-gray-400 text-right">
                  {description.length}/300 characters
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="font-semibold mb-1 block">District <span className="text-red-500">*</span></label>
                  <select
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="font-semibold mb-1 block">Address <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="font-semibold mb-1 block">Contact Phone <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength={10}
                    required
                    placeholder="0771234567"
                  />
                  <span className="text-xs text-gray-400">10 digits</span>
                </div>
                <div className="flex-1">
                  <label className="font-semibold mb-1 block">Contact Email <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    required
                    type="email"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              {/* Optional Fields */}
              <div className="mb-2">
                <button
                  type="button"
                  className="text-yellow-700 font-semibold underline mb-1"
                  onClick={() => setShowOptional(v => !v)}
                >
                  {showOptional ? "Hide" : "Show"} Optional Fields
                </button>
                {showOptional && (
                  <div className="transition-all duration-200 flex flex-col gap-2">
                    <div>
                      <label className="font-semibold mb-1 block">Facebook (optional)</label>
                      <input
                        className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                        value={facebook}
                        onChange={e => setFacebook(e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="font-semibold mb-1 block">WhatsApp (optional)</label>
                      <input
                        className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="771234567"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Map always shown */}
              <div>
                <label className="font-semibold mb-1 block">Select Shop Location on Map <span className="text-red-500">*</span></label>
                <MapContainer
                  // @ts-ignore
                  center={location || DEFAULT_CENTER}
                  zoom={10}
                  style={{ height: 180, width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker value={location} onChange={setLocation} />
                </MapContainer>
                <span className="text-xs text-gray-400">Click on the map to set your shop's location.</span>
                {!location && <div className="text-xs text-red-600 mt-1">Location is required.</div>}
                {location && <div className="text-xs text-green-700 mt-1">Location selected ✔️</div>}
              </div>
              <button
                type="submit"
                className="w-full py-3 mt-3 rounded-full bg-yellow-400 text-white font-bold text-lg hover:bg-yellow-500"
                disabled={loading}
              >
                {loading ? "Saving..." : shop ? "Update Shop" : "Create Shop"}
              </button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
