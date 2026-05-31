import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRandom,
  faMagnifyingGlass,
  faXmark,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { SearchProvider } from "@/src/context/SearchContext";
import WebSearch from "../searchbar/WebSearch";
import MobileSearch from "../searchbar/MobileSearch";

function Navbar() {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [isNotHomePage, setIsNotHomePage] = useState(
    location.pathname !== "/" && location.pathname !== "/home"
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsNotHomePage(
      location.pathname !== "/" && location.pathname !== "/home"
    );
  }, [location.pathname]);

  const handleHamburgerClick = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleRandomClick = () => {
    if (location.pathname === "/random") window.location.reload();
  };

  return (
    <SearchProvider>
      <nav
        className={`fixed top-0 left-0 w-full z-[1000000] transition-all duration-300 ease-in-out
          ${
            isScrolled
              ? "bg-[#0a0e27]/80 backdrop-blur-[30px] saturate-[180%] shadow-lg border-b border-white/[0.07]"
              : "bg-[#0a0e27] border-b border-white/[0.05]"
          }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-6">
            <FontAwesomeIcon
              icon={faBars}
              className="text-xl text-gray-400 cursor-pointer hover:text-[#00d4ff] transition-colors"
              onClick={handleHamburgerClick}
            />
            <Link to="/home" className="flex items-center">
              <img src="/logo.png" alt="Toxic AniStream" className="h-9 w-auto" />
            </Link>
            {/* ToxicStream crosslink */}
            <a
              href="https://toxicstream.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.18)]
                         text-[#00d4ff] hover:bg-[rgba(0,212,255,0.14)] transition-all"
              title="ToxicStream — Movies, TV & More"
            >
              <FontAwesomeIcon icon={faFilm} className="text-[10px]" />
              ToxicStream
            </a>
          </div>

          {/* Center — Search */}
          <div className="flex-1 hidden md:flex justify-center items-center max-w-none mx-8">
            <div className="flex items-center gap-2 w-[600px]">
              <WebSearch />
              <Link
                to={location.pathname === "/random" ? "#" : "/random"}
                onClick={handleRandomClick}
                className="p-[10px] aspect-square bg-white/5 border border-white/10
                           text-white/50 hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.3)]
                           rounded-lg transition-all flex items-center justify-center"
                title="Random Anime"
              >
                <FontAwesomeIcon icon={faRandom} className="text-lg" />
              </Link>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {["EN", "JP"].map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                  language === lang
                    ? "bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Mobile Search Icon */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-[10px] aspect-square bg-white/5 border border-white/10
                         text-white/50 hover:text-[#00d4ff] rounded-lg transition-colors
                         flex items-center justify-center w-[38px] h-[38px]"
              title={isMobileSearchOpen ? "Close Search" : "Search Anime"}
            >
              <FontAwesomeIcon
                icon={isMobileSearchOpen ? faXmark : faMagnifyingGlass}
                className="w-[18px] h-[18px] transition-transform duration-200"
                style={{ transform: isMobileSearchOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-4 py-3 border-t border-white/[0.06] bg-[#0a0e27]/95 backdrop-blur-xl">
            <MobileSearch onClose={() => setIsMobileSearchOpen(false)} />
          </div>
        )}

        {/* Sidebar */}
        {isSidebarOpen && <Sidebar onClose={handleCloseSidebar} />}
      </nav>
    </SearchProvider>
  );
}

export default Navbar;
