"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";

import { FaArrowRight } from "react-icons/fa";

interface AddingMaterialProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  binType: string;
  greensPounds: string;
  greensGallons: string;
  brownsGallons: string;
  redLine: boolean;
  // Browns Bin specific fields
  brownsBinAGallons: string;
  brownsBinBGallons: string;
  binARedLine: boolean;
  binBRedLine: boolean;
}

export default function AddingMaterial({ searchParams }: AddingMaterialProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    binType: "",
    greensPounds: "",
    greensGallons: "",
    brownsGallons: "",
    redLine: false,
    brownsBinAGallons: "",
    brownsBinBGallons: "",
    binARedLine: false, 
    binBRedLine: false
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Parse form data from URL on component mount
  useEffect(() => {
    console.log("Component mounted, searchParams:", searchParams.toString());
    const data = parseFormDataFromURL(searchParams);
    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }
    setFormData(data);

    // Check if this is a new instance of the task (coming from additional tasks)
    const isNewInstance = searchParams.get('newInstance') === 'true';
    
    if (isNewInstance) {
      // For new instances, don't load existing data - start fresh
      console.log("Starting new instance of Add Material task");
    } else {
      // Load saved task data from localStorage
      const savedTaskData = localStorage.getItem(`task_add_material_${data.submissionId}`);
      if (savedTaskData) {
        try {
          const loadedData = JSON.parse(savedTaskData);
          console.log("Loaded saved task data:", loadedData);
          setTaskData(prev => ({ ...prev, ...loadedData }));
        } catch (error) {
          console.error("Error loading saved task data:", error);
        }
      }
    }
  }, [searchParams]);

  // Save task data to localStorage only when form is submitted
  const saveTaskData = () => {
    if (!formData) return;
    
    console.log("Saving final task data to localStorage:", taskData);
    
    // Check if this is a new instance
    const isNewInstance = searchParams.get('newInstance') === 'true';
    
    if (isNewInstance) {
      // For new instances, append to existing data or create new array
      const existingData = localStorage.getItem(`task_add_material_${formData.submissionId}`);
      let taskArray = [];
      
      if (existingData) {
        try {
          taskArray = JSON.parse(existingData);
          if (!Array.isArray(taskArray)) {
            // Convert single task to array
            taskArray = [taskArray];
          }
        } catch (error) {
          console.error("Error parsing existing task data:", error);
          taskArray = [];
        }
      }
      
      // Add new task data
      taskArray.push(taskData);
      localStorage.setItem(`task_add_material_${formData.submissionId}`, JSON.stringify(taskArray));
    } else {
      // For regular instances, save as single task
      localStorage.setItem(`task_add_material_${formData.submissionId}`, JSON.stringify(taskData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // Validate required fields based on bin type
    if (taskData.binType === "browns") {
      if (!taskData.brownsBinAGallons || !taskData.brownsBinBGallons) {
        setMessage("Please enter browns gallons for both Bin A and Bin B.");
        return;
      }
    } else if (taskData.binType && taskData.binType !== "browns") {
      if (!taskData.greensPounds || !taskData.greensGallons || !taskData.brownsGallons) {
        setMessage("Please fill in all required fields for regular bins.");
        return;
      }
    } else {
      setMessage("Please select a bin type.");
      return;
    }

    // Save the task data
    saveTaskData();

    // Navigate to additional tasks page
    const params = new URLSearchParams(searchParams);
    router.push(`/compost-form/additional-tasks?${params.toString()}`);
  };

  const handleBinTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBinType = e.target.value;
    const currentBinType = taskData.binType;
    
    setTaskData(() => {
      // Preserve data when switching between bins 1, 2, 3
      // Clear data when switching to/from browns bins
      const isRegularBin = (bin: string) => bin === "bin1" || bin === "bin2" || bin === "bin3";
      const isBrownsBin = (bin: string) => bin === "browns";
      
      const shouldPreserveData = isRegularBin(currentBinType) && isRegularBin(newBinType);
      
      if (shouldPreserveData) {
        // Keep existing data when switching between regular bins
        return {
          ...taskData,
          binType: newBinType
        };
      } else {
        // Clear all form data when switching to/from browns bins
        return {
          binType: newBinType,
          greensPounds: "",
          greensGallons: "",
          brownsGallons: "",
          redLine: false,
          brownsBinAGallons: "",
          brownsBinBGallons: "",
          binARedLine: false,
          binBRedLine: false
        };
      }
    });
    setMessage("");
  };

  const handleInputChange = (field: keyof TaskData, value: string | boolean) => {
    setTaskData(prev => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const isFormValid = () => {
    if (taskData.binType === "browns") {
      return taskData.brownsBinAGallons && taskData.brownsBinBGallons;
    } else if (taskData.binType && taskData.binType !== "browns") {
      return taskData.greensPounds && taskData.greensGallons && taskData.brownsGallons;
    }
    return false;
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
          <label
            style={{
              display: "block",
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "10px",
              fontFamily: "PT Sans, sans-serif",
              color: "#758A48",
            }}
          >
            Bin Type
          </label>
          <select
            value={taskData.binType}
            onChange={handleBinTypeChange}
            aria-label="Select bin type"
            style={{
              width: "100%",
              height: "57px",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              border: "2px solid #758A48",
              fontSize: "20px",
              padding: "0 12px",
              fontFamily: "PT Sans, sans-serif",
              color: "#758A48",
            }}
          >
            <option value="">Select a bin type</option>
            <option value="bin1">Bin 1</option>
            <option value="bin2">Bin 2</option>
            <option value="bin3">Bin 3</option>
            <option value="browns">Browns Bins</option>
          </select>
        </div>

        {/* Regular Bins (1, 2, 3) */}
        {(taskData.binType === "bin1" || taskData.binType === "bin2" || taskData.binType === "bin3") && (
          <div style={{ marginBottom: "30px" }}>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "20px",
                fontFamily: "PT Sans, sans-serif",
                color: "#758A48",
              }}
            >
              {`Adding Material to ${taskData.binType.replace('bin', 'Bin ')}`}
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginBottom: "8px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
              >
                Greens (Pounds)
              </label>
              <input
                type="number"
                step="0.1"
                value={taskData.greensPounds}
                onChange={(e) => handleInputChange("greensPounds", e.target.value)}
                placeholder="Enter pounds of greens"
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #758A48",
                  fontSize: "20px",
                  padding: "0 12px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginBottom: "8px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
              >
                Greens (Gallons)
              </label>
              <input
                type="number"
                step="0.1"
                value={taskData.greensGallons}
                onChange={(e) => handleInputChange("greensGallons", e.target.value)}
                placeholder="Enter gallons of greens"
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #758A48",
                  fontSize: "20px",
                  padding: "0 12px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginBottom: "8px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
              >
                Browns (Gallons)
              </label>
              <input
                type="number"
                step="0.1"
                value={taskData.brownsGallons}
                onChange={(e) => handleInputChange("brownsGallons", e.target.value)}
                placeholder="Enter gallons of browns"
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #758A48",
                  fontSize: "20px",
                  padding: "0 12px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "20px",
                  marginBottom: "10px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#000000",
                }}
              >
                Is this pile at the red, NO FILL LINE?
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => handleInputChange("redLine", true)}
                  style={{
                    flex: 1,
                    height: "57px",
                    borderRadius: "26px",
                    backgroundColor: taskData.redLine ? "#758A48" : "#FFFFFF",
                    border: "1px solid #758A48",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("redLine", false)}
                  style={{
                    flex: 1,
                    height: "57px",
                    borderRadius: "26px",
                    backgroundColor: !taskData.redLine ? "#758A48" : "#FFFFFF",
                    border: "1px solid #758A48",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Browns Bins */}
        {taskData.binType === "browns" && (
          <div style={{ marginBottom: "30px" }}>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "20px",
                fontFamily: "PT Sans, sans-serif",
                color: "#758A48",
              }}
            >
              Browns Bin
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginBottom: "8px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#00723B",
                }}
              >
                Browns (Gallons) - Bin A
              </label>
              <input
                type="number"
                step="0.1"
                value={taskData.brownsBinAGallons}
                onChange={(e) => handleInputChange("brownsBinAGallons", e.target.value)}
                placeholder="Enter gallons for Bin A"
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #758A48",
                  fontSize: "20px",
                  padding: "0 12px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "20px",
                  marginBottom: "8px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#00723B",
                }}
              >
                Browns (Gallons) - Bin B
              </label>
              <input
                type="number"
                step="0.1"
                value={taskData.brownsBinBGallons}
                onChange={(e) => handleInputChange("brownsBinBGallons", e.target.value)}
                placeholder="Enter gallons for Bin B"
                style={{
                  width: "100%",
                  height: "57px",
                  borderRadius: "16px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #758A48",
                  fontSize: "20px",
                  padding: "0 12px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#758A48",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "20px",
                  marginBottom: "10px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#000000",
                }}
              >
                Please indicate whether Bin A or Bin B is at the red, NO FILL LINE.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => handleInputChange("binARedLine", !taskData.binARedLine)}
                  style={{
                    flex: 1,
                    height: "57px",
                    borderRadius: "26px",
                    backgroundColor: taskData.binARedLine ? "#37BA58" : "#FFFFFF",
                    border: "1px solid #00723B",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  Bin A
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("binBRedLine", !taskData.binBRedLine)}
                  style={{
                    flex: 1,
                    height: "57px",
                    borderRadius: "26px",
                    backgroundColor: taskData.binBRedLine ? "#37BA58" : "#FFFFFF",
                    border: "1px solid #00723B",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  Bin B
                </button>
              </div>
            </div>
          </div>
        )}

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
