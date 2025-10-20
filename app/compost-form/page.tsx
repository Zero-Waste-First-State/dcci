"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lalezar } from "next/font/google";
export const dynamic = 'force-dynamic';
import { motion } from "framer-motion";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

const lalezar = Lalezar({ subsets: ["latin"], weight: "400", display: "swap" });

interface Site { site_id: number; site_name: string; password?: string; }

export default function Page() {
  const [message, setMessage] = useState("");
  const [site, setSite] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSites = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("Site").select("*");
      if (error) setMessage("Error loading sites: " + error.message);
      else setSites(data || []);
    };
    fetchSites();
  }, []);

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value ? Number(e.target.value) : null;
    setSite(siteId);
    if (siteId) {
      const selectedSiteData = sites.find(s => s.site_id === siteId);
      setSelectedSite(selectedSiteData || null);
      setShowPasswordField(!!selectedSiteData?.password);
      if (!selectedSiteData?.password) setPassword("");
    } else {
      setSelectedSite(null);
      setShowPasswordField(false);
      setPassword("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site) { setMessage("Please select a site"); return; }
    if (selectedSite?.password) {
      if (!password) { setMessage("Please enter the site password"); return; }
      if (password !== selectedSite.password) { setMessage("Incorrect password"); return; }
    }
    router.push(`/compost-form/task-selection?site=${site}`);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setMessage(""); };
  const isFormValid = site && (!showPasswordField || password);

  return (
    <main className="min-h-screen flex items-center justify-center bg-earthyLIGHTGreen text-black">
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`relative ${lalezar.className} bg-earthyTan rounded-[21px] border-4 border-earthyBrown`}
        style={{ width: "428px", height: "926px" }}
      >
        {/* Back Arrow */}
        <button
          onClick={() => router.push("/")}
          aria-label="Go back"
          className="absolute top-[35px] left-[16px] w-[78px] h-[78px] flex items-center justify-center rounded-full bg-earthyBlue opacity-80"
        >
          <FaArrowLeft className="text-white w-[49px] h-[49px]" />
        </button>

        {/* Header */}
        <h1
          className="absolute text-[48px] top-[25px] left-[117px] font-lalezar"
          style={{ color: "#58412fff" }}
        >
          Compost Log:
        </h1>
        <h1 className="absolute text-[48px] top-[25px] left-[117px] text-earthyBrown font-lalezar">Compost Log:</h1>
        <h2 className="absolute text-[36px] top-[72px] left-[117px] text-earthyGreen font-lalezar">Site Selection</h2>

        {/* Form Card */}
        <div className="absolute bg-white rounded-[26px] border-2 border-earthyGreen" style={{ top: "150px", left: "49px", width: "330px", height: "395px" }} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="absolute" style={{ top: "180px", left: "60px", width: "308px" }}>
          {/* Site Selector */}
          <div className="mb-6">
            <label htmlFor="site" className="block font-bold mb-3 text-earthyGreen text-[24px]" style={{ fontFamily: "PT Sans, sans-serif" }}>Select Site:</label>
            <select
              id="site"
              value={site || ""}
              onChange={handleSiteChange}
              required
              className="w-full px-4 py-3 rounded-[16px] border-2 border-earthyGreen bg-gray-100 text-earthyLightGreen text-[20px]"
              style={{ fontFamily: "PT Sans, sans-serif" }}
            >
              <option value="">Select a site</option>
              {sites.map(s => <option key={s.site_id} value={s.site_id}>{s.site_name}</option>)}
            </select>
          </div>

          {/* Password Input */}
          {showPasswordField && (
            <div className="mb-6">
              <label htmlFor="password" className="block font-bold mb-3 text-earthyGreen text-[24px]" style={{ fontFamily: "PT Sans, sans-serif" }}>Site Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter site password"
                required
                className="w-full px-4 py-3 rounded-[16px] border-2 border-earthyGreen bg-gray-100 text-earthyLightGreen text-[20px]"
                style={{ fontFamily: "PT Sans, sans-serif" }}
              />
            </div>
          )}

          {/* Error Message */}
          {message && <div className="mb-4 text-center text-red-600 text-[16px]" style={{ fontFamily: "PT Sans, sans-serif" }}>{message}</div>}
        </form>

        {/* NEXT Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`absolute flex items-center justify-center gap-4 shadow-md top-[650px] left-[47px] w-[334px] h-[118px] rounded-[69px] border-2 ${isFormValid ? "border-earthyGreen bg-white" : "border-gray-300 bg-gray-200 opacity-60 cursor-not-allowed"}`}
        >
          <span className={`text-[64px] font-lalezar leading-[79px] text-center ${isFormValid ? "text-earthyGreen" : "text-gray-400"}`}>NEXT</span>
          <FaArrowRight className={`w-[70px] h-[65px] ${isFormValid ? "text-earthyGreen" : "text-gray-400"}`} />
        </button>

        {/* Scrappy Logo Bottom Center */}
        <Image
          src="/watermelon.jpg"
          alt="Logo"
          width={90}
          height={90}
          className="rounded-full absolute"
          style={{ bottom: "20px", left: "50%", transform: "translateX(-50%)" }}
        />
      </motion.div>
    </main>
  );
}
