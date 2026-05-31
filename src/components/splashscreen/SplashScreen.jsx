import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import logoTitle from "@/src/config/logoTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faChevronDown, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet-async";
import { generateFAQSchema, generateCanonicalUrl, optimizeTitle } from "@/src/utils/seo.utils";

const FAQ_ITEMS = [
  {
    question: "Is Toxic AniStream safe?",
    answer:
      "Yes. Toxic AniStream does not host any files — it streams from trusted third-party providers via the HiAnime API. No sign-up is required and there are no ads in the player.",
  },
  {
    question: "What makes Toxic AniStream different?",
    answer:
      "Toxic AniStream is part of the ToxicStream platform, built with a liquid-glass UI and powered by the HiAnime API for reliable HD Sub & Dub streams. It features auto-skip intros, auto-next episodes, and works great on mobile, TV, and desktop.",
  },
  {
    question: "Is this part of ToxicStream?",
    answer:
      "Yes! Toxic AniStream is the dedicated anime wing of ToxicStream — a free, no-account streaming platform covering Movies, TV Shows, Anime, and K-Drama.",
  },
];

function SplashScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSearchSubmit = useCallback(() => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;
    navigate(`/search?keyword=${encodeURIComponent(trimmedSearch)}`);
  }, [search, navigate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") handleSearchSubmit();
    },
    [handleSearchSubmit]
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqSchema = generateFAQSchema(FAQ_ITEMS);
  const canonicalUrl = generateCanonicalUrl("/");
  const pageTitle = optimizeTitle("Watch Anime Online Free | Sub & Dub HD", false);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Toxic AniStream — Watch anime free in HD. English Sub & Dub. No sign-up, no ads in player. Powered by HiAnime API. Part of ToxicStream."
        />
        <meta
          name="keywords"
          content="toxic anistream, watch anime free, anime sub dub hd, toxicstream anime, free anime streaming, hianime"
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content="Watch thousands of anime episodes free in HD. Sub & Dub. No ads. Part of ToxicStream."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta
          name="twitter:description"
          content="Stream anime free in HD Sub & Dub on Toxic AniStream. Part of the ToxicStream platform."
        />
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      <div className="splash-container">
        <div className="splash-overlay"></div>
        <div className="content-wrapper">

          <div className="logo-container">
            <img src="/logo.png" alt={logoTitle} className="logo" />
            <div className="brand-badge">
              Part of{" "}
              <a href="https://toxicstream.pages.dev" target="_blank" rel="noopener noreferrer">
                ToxicStream
              </a>
            </div>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search anime..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="search-button" onClick={handleSearchSubmit} aria-label="Search">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </div>

          <Link to="/home" className="enter-button">
            Browse Anime <FontAwesomeIcon icon={faAngleRight} className="angle-icon" />
          </Link>

          <div className="faq-section">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => (
                <div key={index} className="faq-item">
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    <span>{item.question}</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`faq-toggle ${expandedFaq === index ? "rotate" : ""}`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <div className="faq-answer">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default SplashScreen;
