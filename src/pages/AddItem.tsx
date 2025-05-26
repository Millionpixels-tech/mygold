import { useState } from "react";
import imageCompression from "browser-image-compression";
import { districts } from "../utils/districts";
import { auth, db, storage } from "../firebase/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const AddItem = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [karat, setKarat] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [district, setDistrict] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Compress images before setting to state
  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressed: File[] = [];

      for (const file of files) {
        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          });
          compressed.push(compressedFile as File);
        } catch (err) {
          compressed.push(file);
        }
      }
      setImages(compressed);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !karat || !weight || !district || images.length === 0) {
      alert("Please fill all fields and add at least 1 image.");
      return;
    }
    setLoading(true);
    try {
      // 1. Upload Images
      const urls: string[] = [];
      for (const file of images) {
        const imageRef = ref(storage, `gold-images/${Date.now()}-${file.name}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        urls.push(url);
      }
      // 2. Add item to Firestore, save alt text array
      await addDoc(collection(db, "items"), {
        title,
        description,
        karat,
        weight,
        district,
        images: urls,
        imageAlts: urls.map(() => title || "Gold item"), // SEO: alt = title
        createdAt: Timestamp.now(),
        ownerId: auth.currentUser?.uid,
        ownerName: auth.currentUser?.displayName,
        highestBid: 0,
        bidsCount: 0,
      });
      setLoading(false);
      navigate("/");
    } catch (e) {
      setLoading(false);
      alert("Failed to add item. Try again.");
    }
  };

  // Stepper UI
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold 
        ${step === 1 ? 'bg-yellow-500 text-white shadow' : 'bg-yellow-100 text-yellow-600'}`}>
        1
      </div>
      <div className={`flex-1 h-1 mx-2 rounded transition-all duration-300
        ${step === 2 ? 'bg-yellow-400' : 'bg-yellow-100'}`} />
      <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold 
        ${step === 2 ? 'bg-yellow-500 text-white shadow' : 'bg-yellow-100 text-yellow-600'}`}>
        2
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <Header />

      <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="w-full max-w-lg bg-white/90 shadow-2xl rounded-3xl px-7 py-8 mt-6 border border-yellow-100">
          <h2 className="text-2xl font-black text-yellow-700 mb-1 tracking-tight text-center">Add Gold Item</h2>
          <p className="text-gray-500 mb-5 text-center">Fill the details below to post your gold item for free!</p>
          <StepIndicator />
          {step === 1 && (
            <form
              className="flex flex-col gap-6 animate-fadeIn"
              onSubmit={e => { e.preventDefault(); setStep(2); }}
            >
              <div>
                <label className="font-semibold text-gray-700 mb-1 block">Title</label>
                <input
                  className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base"
                  placeholder="Ex: 22K Necklace"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 mb-1 block">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base min-h-[80px]"
                  placeholder="Describe your gold item"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={3}
                  maxLength={200}
                />
                <span className="text-xs text-gray-400 float-right">{description.length}/200</span>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
              >
                Next
              </button>
            </form>
          )}
          {step === 2 && (
            <form
              className="flex flex-col gap-6 animate-fadeIn"
              onSubmit={e => { e.preventDefault(); handleSubmit(); }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 mb-1 block">Weight (g)</label>
                  <input
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base"
                    type="number" min={0}
                    placeholder="Ex: 5.5"
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 mb-1 block">Karat</label>
                  <input
                    className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base"
                    type="number" min={0} max={24}
                    placeholder="Ex: 22"
                    value={karat}
                    onChange={e => setKarat(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 mb-1 block">District</label>
                <select
                  className="w-full px-4 py-3 border border-yellow-200 rounded-xl bg-yellow-50 focus:ring-2 focus:ring-yellow-300 focus:outline-none text-base"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-700 mb-1 block">Images</label>
                <input
                  type="file"
                  multiple accept="image/*"
                  className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                  onChange={handleImages}
                  required
                />
                {/* Preview */}
                <div className="flex gap-3 mt-3 flex-wrap">
                  {images.map((file, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(file)}
                      alt={title ? title : `Gold item image ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-yellow-200 shadow-sm"
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="w-1/2 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition"
                  disabled={loading}
                >
                  {loading ? "Posting..." : "Post Gold Item"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddItem;
