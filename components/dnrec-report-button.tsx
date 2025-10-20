// This component allows users to input a year and get the DNREC report for that year.

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DnrecReportButton() {
  const [year, setYear] = useState("");
  const [sites, setSites] = useState<{site_id: number, site_name: string}[]>([]);
  const [selectedSite, setSelectedSite] = useState("total")

  // Fetch sites on component mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('Site')
          .select('site_id, site_name')
          .order('site_name', { ascending: true });

        if (error) throw error;
        setSites(data || []);
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };

    fetchSites();
  }, []);

  const handleClick = async () => {
    if (!year) return; // optional: prevents opening without a year

    // Build URL with site parameter if not "total"
    let url = `/api/dnrec/pdf?year=${year}`;
    if (selectedSite !== "total") {
      url += `&site=${selectedSite}`;
    }

    window.open(url, "_blank"); // Open PDF in new tab
    
    // Save to DNREC bucket in background
    try {
      const response = await fetch(url);
      if (response.ok) {
        const pdfBlob = await response.blob();
        const siteSuffix = selectedSite === "total" ? "All_Sites" : `Site_${selectedSite}`;
        const fileName = `DNREC_Report_${year}_${siteSuffix}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        const supabase = createClient();
        await supabase.storage
          .from('DNREC')
          .upload(fileName, file, { upsert: true });
      }
    } catch (error) {
      // Error saving DNREC report
      console.error('Error saving DNREC report:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex flex-col space-y-2">
          <label htmlFor="year-input" className="text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            id="year-input"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Enter year (e.g., 2025)"
            className="border-2 border-earthyBrown px-3 py-2 rounded-md w-32 text-gray-900 bg-amber-50 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-colors"
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <label htmlFor="site-select" className="text-sm font-medium text-gray-700">
            Site
          </label>
          <select
            id="site-select"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border-2 border-earthyBrown px-3 py-2 rounded-md w-48 text-black bg-amber-50 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-colors"
          >
            <option value="total">All Sites (Total)</option>
            {sites.map((site) => (
              <option key={site.site_id} value={site.site_id.toString()}>
                {site.site_name}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleClick}
          disabled={!year}
          className="bg-earthyGreen text-white px-6 py-2 rounded-md font-semibold hover:bg-dcciPrettyPink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-dcciPrettyPink-500 focus:ring-offset-2"
        >
          Generate Report
        </button>
      </div>
      
      {!year && (
        <p className="text-sm text-gray-600 italic">
          Please enter a year to generate the DNREC report
        </p>
      )}
    </div>
  );
}