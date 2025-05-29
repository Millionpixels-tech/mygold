import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useEffect, useState, useRef } from "react";

const Header = () => {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // Close dropdown on outside click
  useEffect(() => {
    if (!profileDropdown) return;
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileDropdown]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  // For closing the menu on route change or resize
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [menuOpen]);

  // Highlighted "Gold Shops in Sri Lanka" menu item
  const GoldShopsMenuItem = (
    <Link
      to="/gold-shops-in-sri-lanka"
      className="
        text-yellow-700
        text-base
        font-extrabold
        bg-yellow-100/80
        border border-yellow-200
        hover:text-yellow-900
        hover:bg-yellow-200
        transition-all
        px-3 py-2
        rounded-xl
        shadow-sm
        flex items-center gap-2
      "
      style={{ boxShadow: '0 1px 6px 0 rgba(252, 211, 77, 0.08)' }}
      onClick={() => setMenuOpen(false)}
    >
      <svg width={18} height={18} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#FDE047" stroke="#FACC15" strokeWidth="2"/>
        <path d="M12 7.5L9 16h6l-3-8.5z" fill="#F59E42" />
      </svg>
      Gold Shops in Sri Lanka
    </Link>
  );

  // Forum menu item
  const ForumMenuItem = (
    <Link
      to="/forum"
      className="text-gray-700 text-base font-medium hover:text-yellow-700 transition-all px-3 py-2 rounded-lg hover:bg-yellow-100/80"
      onClick={() => setMenuOpen(false)}
    >
      Forum
    </Link>
  );

  return (
    <header className="w-full sticky top-0 z-999 border-b border-yellow-100 shadow-none
      bg-gradient-to-br from-yellow-50 via-white/80 to-yellow-100/80
      backdrop-blur-md transition-all">
      <div className="flex items-center justify-between w-full px-4 md:px-6 py-3 lg:py-4 relative">
        {/* Logo & site name on the left */}
        <Link to="/" className="flex items-center gap-3 group z-30">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-100 shadow group-hover:scale-105 transition-transform">
            <svg width={28} height={28} viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#FFD700" stroke="#F59E42" strokeWidth="2"/>
              <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">G</text>
            </svg>
          </div>
          <span className="text-2xl font-black text-yellow-600 tracking-tight group-hover:text-yellow-500 transition">mygold.lk</span>
        </Link>

        {/* Burger menu button for mobile */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-yellow-100/60 transition z-30"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            // X icon
            <svg width={28} height={28} fill="none" stroke="#A16207" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M6 6L18 18M6 18L18 6" />
            </svg>
          ) : (
            // Burger icon
            <svg width={28} height={28} fill="none" stroke="#A16207" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M4 8h16M4 16h16" />
            </svg>
          )}
        </button>

        {/* Desktop nav/user section */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-4">
            {GoldShopsMenuItem}
            {ForumMenuItem}
            <Link
              to="/how-it-works"
              className="text-gray-700 text-base font-medium hover:text-yellow-700 transition-all px-3 py-2 rounded-lg hover:bg-yellow-100/80"
            >
              How It Works
            </Link>
            <Link
              to="/qa"
              className="text-gray-700 text-base font-medium hover:text-yellow-700 transition-all px-3 py-2 rounded-lg hover:bg-yellow-100/80"
            >
              Q&amp;A
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 text-base font-medium hover:text-yellow-700 transition-all px-3 py-2 rounded-lg hover:bg-yellow-100/80"
            >
              Contact Us
            </Link>
            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white text-sm font-bold rounded-full shadow transition-all active:scale-95"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.12}/>
                  <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sell your gold item
              </button>
            )}
          </nav>
          {user && (
            <button
              onClick={() => navigate("/add-item")}
              className="
                flex items-center gap-2
                px-5 py-2
                bg-gradient-to-br from-yellow-400 to-yellow-500
                hover:from-yellow-500 hover:to-yellow-400
                text-white text-base font-bold
                rounded-full shadow
                transition-all
                active:scale-95
              "
            >
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.12}/>
                <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add item for free
            </button>
          )}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  className="flex items-center gap-2 hover:bg-yellow-100/70 px-2 py-1 rounded-lg transition group focus:outline-none"
                  onClick={() => setProfileDropdown(v => !v)}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-yellow-300 shadow group-hover:ring-2 group-hover:ring-yellow-400"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 text-lg font-bold border-2 border-yellow-300 shadow">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-700 truncate max-w-[100px]">{user.displayName || user.email}</span>
                  <svg className={`w-4 h-4 ml-1 transition-transform ${profileDropdown ? "rotate-180" : "rotate-0"}`} fill="none" stroke="#A16207" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-yellow-100 rounded-xl shadow-lg z-50 py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-yellow-50 rounded-t-xl"
                      onClick={() => setProfileDropdown(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-yellow-50 rounded-b-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu: HIGH z-index, overlays everything */}
      <div className={`
        md:hidden
        fixed top-0 left-0 w-full h-screen z-[999] transition-all duration-300
        ${menuOpen ? "pointer-events-auto bg-black/30 opacity-100" : "pointer-events-none opacity-0"}
      `}
        style={{ zIndex: 999 }}
        onClick={() => setMenuOpen(false)}
      >
        {/* Menu box itself */}
        <div
          className={`
            absolute right-0 top-0 w-5/6 max-w-xs h-full bg-gradient-to-br from-yellow-50 via-white to-yellow-100
            shadow-xl rounded-l-3xl border-l border-yellow-100 p-6 flex flex-col gap-8 transition-all duration-300
            ${menuOpen ? "translate-x-0" : "translate-x-full"}
          `}
          style={{ zIndex: 1000 }}
          onClick={e => e.stopPropagation()}
        >
          <nav className="flex flex-col gap-3 mt-4">
            {!user && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white text-sm font-bold rounded-full shadow transition-all active:scale-95"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.12}/>
                  <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Sell your gold item
              </button>
            )}
            {/* Highlighted Gold Shops */}
            {GoldShopsMenuItem}
            {ForumMenuItem}
            {ForumMenuItem}
            <Link
              to="/how-it-works"
              className="text-gray-700 text-lg font-medium hover:text-yellow-700 transition px-3 py-2 rounded-lg hover:bg-yellow-100/80"
              onClick={() => setMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              to="/qa"
              className="text-gray-700 text-lg font-medium hover:text-yellow-700 transition px-3 py-2 rounded-lg hover:bg-yellow-100/80"
              onClick={() => setMenuOpen(false)}
            >
              Q&amp;A
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 text-lg font-medium hover:text-yellow-700 transition px-3 py-2 rounded-lg hover:bg-yellow-100/80"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
            {user && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/add-item");
                }}
                className="
                  flex items-center gap-2
                  mt-3 mb-1
                  px-5 py-2
                  bg-gradient-to-br from-yellow-400 to-yellow-500
                  hover:from-yellow-500 hover:to-yellow-400
                  text-white text-base font-bold
                  rounded-full shadow
                  transition-all
                  active:scale-95
                "
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.12}/>
                  <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add item for free
              </button>
            )}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-yellow-100 pt-6">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 hover:bg-yellow-100/70 px-2 py-2 rounded-lg transition group">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-yellow-300 shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 text-lg font-bold border-2 border-yellow-300 shadow">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="text-base font-semibold text-gray-700 truncate max-w-[120px]">{user.displayName || user.email}</span>
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 text-base bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 text-base bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
