"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";

import { FaArrowRight } from "react-icons/fa";

interface IssueCornerProps {
  searchParams: URLSearchParams;
}

interface IssueData {
  brokenTools: boolean;
  holesInBin: boolean;
  badOdors: boolean;
  unwantedVectors: boolean;
  other: boolean;
  otherComment: string;
}

export default function IssueCorner({ searchParams }: IssueCornerProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [issueData, setIssueData] = useState<IssueData>({
    brokenTools: false,
    holesInBin: false,
    badOdors: false,
    unwantedVectors: false,
    other: false,
    otherComment: ""
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Parse form data from URL on component mount
  useEffect(() => {
    console.log("Issue Corner mounted, searchParams:", searchParams.toString());
    const data = parseFormDataFromURL(searchParams);
    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }
    console.log("Parsed form data:", data);
    setFormData(data);

    // Load saved issue data from localStorage
    const savedIssueData = localStorage.getItem(`issue_corner_${data.submissionId}`);
    if (savedIssueData) {
      try {
        const loadedData = JSON.parse(savedIssueData);
        console.log("Loaded saved issue data:", loadedData);
        setIssueData(prev => ({ ...prev, ...loadedData }));
      } catch (error) {
        console.error("Error loading saved issue data:", error);
      }
    }
  }, [searchParams]);

  // Save issue data to localStorage whenever it changes
  useEffect(() => {
    if (formData) {
      console.log("Saving issue data to localStorage:", issueData);
      localStorage.setItem(`issue_corner_${formData.submissionId}`, JSON.stringify(issueData));
    }
  }, [issueData, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // If "Other" is selected but no comment provided
    if (issueData.other && !issueData.otherComment.trim()) {
      setMessage("Please provide details for the 'Other' issue");
      return;
    }

    setMessage("");
    // Navigate to final submission
    router.push(`/compost-form/submit?${searchParams.toString()}`);
  };

  const updateIssueData = (field: keyof IssueData, value: boolean | string) => {
    console.log(`Updating ${field} to: ${value}`);
    setIssueData(prev => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const isFormValid = () => {
    // If "Other" is selected, require comment
    if (issueData.other && !issueData.otherComment.trim()) {
      return false;
    }
    return true;
  };

  if (!formData) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p style={{ color: "#FB3939", fontFamily: "PT Sans, sans-serif" }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "30px" }}>
          
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#FFF3CD",
              borderRadius: "16px",
              border: "1px solid #FFE69C",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
                fontFamily: "PT Sans, sans-serif",
                color: "#856404",
              }}
            >
              ⚠️ Important:
            </p>
            <p
              style={{
                fontSize: "16px",
                marginBottom: "8px",
                fontFamily: "PT Sans, sans-serif",
                color: "#856404",
              }}
            >
              If you notice any of these issues, please immediately notify the site manager:
            </p>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "4px",
                fontFamily: "PT Sans, sans-serif",
                color: "#856404",
              }}
            >
              Elisa King
            </p>
            <p
              style={{
                fontSize: "16px",
                fontFamily: "PT Sans, sans-serif",
                color: "#856404",
              }}
            >
              Email: DCCI@PlasticFreeDelaware.org
            </p>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "10px",
                fontFamily: "PT Sans, sans-serif",
                color: "#758A48",
              }}
            >
              Did you observe any of the following at/near the site?
            </p>
            <p
              style={{
                fontSize: "16px",
                marginBottom: "20px",
                fontFamily: "PT Sans, sans-serif",
                color: "#8F8F8F",
              }}
            >
              If you did not notice any issues, you can continue to submission below.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <button
                type="button"
                onClick={() => updateIssueData('brokenTools', !issueData.brokenTools)}
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: issueData.brokenTools ? "#758A48" : "#FFFFFF",
                  border: "1px solid #758A48",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "PT Sans, sans-serif",
                  color: issueData.brokenTools ? "#FFFFFF" : "#758A48", // white text if selected, green if not
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Broken tools
              </button>

              <button
                type="button"
                onClick={() => updateIssueData('holesInBin', !issueData.holesInBin)}
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: issueData.holesInBin ? "#758A48" : "#FFFFFF",
                  border: "1px solid #758A48",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "PT Sans, sans-serif",
                  color: issueData.holesInBin ? "#FFFFFF" : "#758A48",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Holes in a bin
              </button>

              <button
                type="button"
                onClick={() => updateIssueData('badOdors', !issueData.badOdors)}
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: issueData.badOdors ? "#758A48" : "#FFFFFF",
                  border: "1px solid #758A48",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "PT Sans, sans-serif",
                  color: issueData.badOdors ? "#FFFFFF" : "#758A48",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Bad odors
              </button>

              <button
                type="button"
                onClick={() => updateIssueData('unwantedVectors', !issueData.unwantedVectors)}
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: issueData.unwantedVectors ? "#758A48" : "#FFFFFF",
                  border: "1px solid #758A48",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "PT Sans, sans-serif",
                  color: issueData.unwantedVectors ? "#FFFFFF" : "#758A48",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Fruit flies, mice, or other unwanted vectors
              </button>

              <button
                type="button"
                onClick={() => updateIssueData('other', !issueData.other)}
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: issueData.other ? "#758A48" : "#FFFFFF",
                  border: "1px solid #758A48",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "PT Sans, sans-serif",
                  color: issueData.other ? "#FFFFFF" : "#758A48",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Other
              </button>

              {issueData.other && (
                <div style={{ marginTop: "10px" }}>
                  <textarea
                    value={issueData.otherComment}
                    onChange={(e) => updateIssueData('otherComment', e.target.value)}
                    placeholder="Please describe the issue..."
                    style={{
                      width: "100%",
                      height: "80px",
                      borderRadius: "16px",
                      backgroundColor: "#EEEEEE",
                      border: "1px solid #ACACAC",
                      fontSize: "16px",
                      padding: "12px",
                      fontFamily: "PT Sans, sans-serif",
                      color: "#8F8F8F",
                      resize: "none",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "20px",
              textAlign: "center",
              color: "#FB3939",
              fontFamily: "PT Sans, sans-serif",
              fontSize: "16px",
            }}
          >
            {message}
          </div>
        )}
      </form>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid()}
        style={{
          width: "100%",
          height: "57px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #758A48",
          borderRadius: "69px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          cursor: isFormValid() ? "pointer" : "not-allowed",
          opacity: isFormValid() ? 1 : 0.6,
          marginTop: "20px",
        }}
      >
        <span
          style={{
            fontSize: "32px",
            fontFamily: "Lalezar, sans-serif",
            color: "#758A48",
          }}
        >
          NEXT
        </span>
        <FaArrowRight
          style={{
            width: "30px",
            height: "30px",
            color: "#758A48",
          }}
        />
      </button>
    </div>
  );
} 