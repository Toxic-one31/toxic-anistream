import logoTitle from "@/src/config/logoTitle.js";
import website_name from "@/src/config/website.js";
import { Link } from "react-router-dom";
import { FaDiscord, FaTelegram, FaExternalLinkAlt } from "react-icons/fa";

function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* Logo + Social + ToxicStream link */}
      <div className="max-w-[1920px] mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <img
              src="/footer.png"
              alt={logoTitle}
              className="h-[80px] w-auto object-contain"
            />
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <a
                href="https://discord.gg/toxicstream"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#5865F2] transition-all hover:scale-110"
                title="Discord"
              >
                <FaDiscord size={26} />
              </a>
              <a
                href="https://t.me/toxicstream"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#26A5E4] transition-all hover:scale-110"
                title="Telegram"
              >
                <FaTelegram size={26} />
              </a>
            </div>
          </div>

          {/* ToxicStream link */}
          <a
            href="https://toxicstream.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-[rgba(0,212,255,0.07)] border border-[rgba(0,212,255,0.18)]
                       text-[#00d4ff] text-sm font-semibold
                       hover:bg-[rgba(0,212,255,0.13)] transition-all hover:-translate-y-0.5"
          >
            <FaExternalLinkAlt size={12} />
            Movies & TV on ToxicStream
          </a>
        </div>
      </div>

      <div className="bg-[rgba(10,14,39,0.8)] backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-[1920px] mx-auto px-4 py-6">
          {/* A-Z List */}
          <div className="mb-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 items-center">
              <h2 className="text-sm font-semibold text-white tracking-wide">A-Z LIST</h2>
              <span className="text-sm text-white/50">Browse anime alphabetically</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {["All", "#", "0-9", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))].map(
                (item, index) => (
                  <Link
                    to={`az-list/${item === "All" ? "" : item}`}
                    key={index}
                    className="px-2.5 py-1 text-xs bg-white/[0.04] hover:bg-[rgba(0,212,255,0.1)]
                               text-white/50 hover:text-[#00d4ff] border border-white/[0.06]
                               hover:border-[rgba(0,212,255,0.25)] rounded transition-all"
                  >
                    {item}
                  </Link>
                )
              )}
            </div>

            <div className="flex gap-4 flex-wrap justify-center sm:justify-start mt-4">
              <Link to="/terms-of-service" className="text-sm text-white/50 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/dmca" className="text-sm text-white/50 hover:text-white transition-colors">
                DMCA
              </Link>
              <Link to="/contact" className="text-sm text-white/50 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-1.5 text-xs text-white/35 text-center sm:text-left">
            <p className="max-w-4xl mx-auto sm:mx-0">
              {website_name} does not host any files — it streams from third-party providers via the HiAnime API.
              Legal issues should be directed to the respective file hosts and providers.{" "}
              {website_name} is not responsible for any media shown by video providers.
            </p>
            <p>
              © 2026{" "}
              <a
                href="https://toxicstream.pages.dev"
                className="hover:text-[#00d4ff] transition-colors"
              >
                ToxicStream
              </a>{" "}
              · {website_name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
