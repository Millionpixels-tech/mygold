import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, addDoc, query, orderBy, limit, startAfter, getDocs, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const PAGE_SIZE = 10;

export default function Forum() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replies, setReplies] = useState<{[key:string]: any[]}>({});
  const [user, setUser] = useState<any>(null);
  const [replyCounts, setReplyCounts] = useState<{[key:string]: number}>({});
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Fetch messages and reply counts
  const fetchMessages = async (reset = false) => {
    setLoading(true);
    setError("");
    try {
      let q = query(collection(db, "forum"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      if (!reset && lastDoc) {
        q = query(collection(db, "forum"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
      }
      const snap = await getDocs(q);
      const newMsgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(reset ? newMsgs : [...messages, ...newMsgs]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === PAGE_SIZE);

      // Fetch reply counts for all messages
      const counts: {[key:string]: number} = {};
      await Promise.all(newMsgs.map(async (msg) => {
        const repliesSnap = await getDocs(collection(db, `forum/${msg.id}/replies`));
        counts[msg.id] = repliesSnap.size;
      }));
      setReplyCounts(reset ? counts : { ...replyCounts, ...counts });
    } catch (e) {
      setError("Failed to load forum messages.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages(true);
    // eslint-disable-next-line
  }, []);

  // Fetch replies for a message
  const fetchReplies = async (msgId: string) => {
    const q = query(collection(db, `forum/${msgId}/replies`), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    setReplies(r => ({ ...r, [msgId]: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
  };

  // Add new message
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "forum"), {
      text: newMessage,
      createdAt: serverTimestamp(),
      userId: user ? user.uid : null,
      userName: user ? (user.displayName || user.email) : "Anonymous",
    });
    setNewMessage("");
    fetchMessages(true);
  };

  // Add reply
  const handleReply = async (msgId: string, replyText: string) => {
    if (!replyText.trim()) return;
    await addDoc(collection(db, `forum/${msgId}/replies`), {
      text: replyText,
      createdAt: serverTimestamp(),
      userId: user ? user.uid : null,
      userName: user ? (user.displayName || user.email) : "Anonymous",
    });
    fetchReplies(msgId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <Header />
      <main className="max-w-2xl mx-auto my-10 bg-white rounded-3xl shadow-xl border border-yellow-100 p-6">
        <h1 className="text-2xl font-bold text-yellow-700 mb-4">Gold Forum</h1>
        <form onSubmit={handlePost} className="mb-6 flex gap-2">
          <input
            className="flex-1 border border-yellow-200 rounded px-3 py-2"
            placeholder="Share something about gold..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button className="bg-yellow-500 text-white px-4 py-2 rounded" type="submit">Post</button>
        </form>
        {messages.map(msg => (
          <div key={msg.id} className="mb-6 p-4 border border-yellow-100 rounded-xl bg-yellow-50 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-bold text-yellow-700 text-sm">{msg.userName || "Anonymous"}</div>
              <div className="text-xs text-gray-400">{msg.createdAt?.seconds ? dayjs.unix(msg.createdAt.seconds).fromNow() : "just now"}</div>
            </div>
            <div className="mb-2 text-gray-800 text-lg">{msg.text}</div>
            <button className="text-xs text-yellow-700 underline" onClick={() => { fetchReplies(msg.id); setReplyTo(replyTo === msg.id ? null : msg.id); }}>
              {replyTo === msg.id ? "Hide Replies" : `Show Replies (${replyCounts[msg.id] ?? 0})`}
            </button>
            {replyTo === msg.id && (
              <div className="mt-4 ml-2 border-l-2 border-yellow-200 pl-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-yellow-700 text-base">Replies</span>
                  <span className="text-xs text-gray-400">({(replies[msg.id]?.length || 0)})</span>
                </div>
                <form
                  className="flex gap-2 mb-4"
                  onSubmit={e => {
                    e.preventDefault();
                    const input = (e.target as any).elements.reply;
                    handleReply(msg.id, input.value);
                    input.value = "";
                  }}
                >
                  <input name="reply" className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Write a reply..." />
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold shadow" type="submit">Reply</button>
                </form>
                <div className="space-y-3">
                  {(replies[msg.id] || []).length === 0 && (
                    <div className="text-sm text-gray-400 italic">No replies yet.</div>
                  )}
                  {(replies[msg.id] || []).map(r => (
                    <div key={r.id} className="flex items-start gap-3 bg-yellow-100 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center font-bold text-yellow-800 text-sm">
                        {r.userName ? r.userName[0].toUpperCase() : "A"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-yellow-700 text-sm">{r.userName || "Anonymous"}</span>
                          <span className="text-xs text-gray-400">{r.createdAt?.seconds ? dayjs.unix(r.createdAt.seconds).fromNow() : "just now"}</span>
                        </div>
                        <div className="text-gray-800 text-sm">{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {hasMore && (
          <button className="w-full py-2 bg-yellow-200 rounded mt-4" onClick={() => fetchMessages(false)} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        )}
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </main>
    </div>
  );
}
