"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Site {
  site_id: number;
  site_name: string;
  password?: string;
}

export default function useVolunteerForm() {
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
      console.log("Fetching sites...");
      console.log("Supabase client created:", !!supabase);
      
      const { data, error } = await supabase
        .from("Site")
        .select("*");
      
      console.log("Supabase response:", { data, error });
      console.log("Data type:", typeof data);
      console.log("Data length:", data?.length);
      
      if (error) {
        console.error("Error fetching sites:", error);
        setMessage("Error loading sites: " + error.message);
      } else {
        console.log("Sites fetched successfully:", data);
        setSites(data || []);
      }
    };

    fetchSites();
  }, []);

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value ? Number(e.target.value) : null;
    setSite(siteId);

    if (siteId) {
      const selectedSiteData = sites.find(site => site.site_id === siteId);
      setSelectedSite(selectedSiteData || null);

      if (selectedSiteData?.password) {
        setShowPasswordField(true);
      } else {
        setShowPasswordField(false);
        setPassword("");
      }
    } else {
      setSelectedSite(null);
      setShowPasswordField(false);
      setPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!site) {
      setMessage("Please select a site");
      return;
    }

    // Check if password is required and correct
    if (selectedSite?.password) {
      if (!password) {
        setMessage("Please enter the site password");
        return;
      }

      if (password !== selectedSite.password) {
        setMessage("Incorrect password");
        return;
      }
    }

    console.log("Selected site:", site);
    // Navigate to task selection with site parameter
          router.push(`/compost-form/task-selection?site=${site}`);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setMessage("");
  };

  return {
    message,
    site,
    sites,
    password,
    showPasswordField,
    handleSubmit,
    handleSiteChange,
    handlePasswordChange,
  };
}
