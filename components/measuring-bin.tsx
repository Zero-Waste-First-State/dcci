"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { FaArrowRight } from "react-icons/fa";

interface MeasuringBinProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  binType: string;
  // Temperature fields
  tempLeft: string;
  tempMiddle: string;
  tempRight: string;
  // Moisture/Squeeze test fields
  leftSqueeze: string;
  middleSqueeze: string;
  rightSqueeze: string;
  // Corrective actions
  leftCorrectiveActions: string;
  middleCorrectiveActions: string;
  rightCorrectiveActions: string;
  // Mix options
  mix: string;
}

export default function MeasuringBin({ searchParams }: MeasuringBinProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    binType: "",
    tempLeft: "",
    tempMiddle: "",
    tempRight: "",
    leftSqueeze: "",
    middleSqueeze: "",
    rightSqueeze: "",
    leftCorrectiveActions: "",
    middleCorrectiveActions: "",
    rightCorrectiveActions: "",
    mix: ""
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
    console.log("Parsed form data:", data);
    setFormData(data);

    // Prevent overscroll behavior for Chrome
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as Element;
      const container = target.closest('[style*="overscroll"]') || document.body;
      
      if (container.scrollTop === 0 && e.touches[0].clientY > e.touches[0].clientY) {
        e.preventDefault();
      }
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (container.scrollTop >= maxScroll && e.touches[0].clientY < e.touches[0].clientY) {
        e.preventDefault();
      }
    };

    // Add touch event listeners
    document.addEventListener('touchstart', preventOverscroll, { passive: false });
    document.addEventListener('touchmove', preventOverscroll, { passive: false });

    // Check if this is a new instance of the task (coming from additional tasks)
    const isNewInstance = searchParams.get('newInstance') === 'true';
    
    if (isNewInstance) {
      // For new instances, don't load existing data - start fresh
      console.log("Starting new instance of Measure Bin task");
    } else {
      // Load saved task data from localStorage
      const savedTaskData = localStorage.getItem(`task_measure_bin_${data.submissionId}`);
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

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventOverscroll);
      document.removeEventListener('touchmove', preventOverscroll);
    };
  }, [searchParams]);

  // Save task data to localStorage only when form is submitted
  const saveTaskData = () => {
    if (!formData) return;
    
    console.log("Saving final task data to localStorage:", taskData);
    
    // Check if this is a new instance
    const isNewInstance = searchParams.get('newInstance') === 'true';
    
    if (isNewInstance) {
      // For new instances, append to existing data or create new array
      const existingData = localStorage.getItem(`task_measure_bin_${formData.submissionId}`);
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
      localStorage.setItem(`task_measure_bin_${formData.submissionId}`, JSON.stringify(taskArray));
    } else {
      // For regular instances, save as single task
      localStorage.setItem(`task_measure_bin_${formData.submissionId}`, JSON.stringify(taskData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // Validate required fields based on bin type
    if (!taskData.binType) {
      setMessage("Please select a bin type.");
      return;
    }

    // Validate based on bin type
    if (taskData.binType === "bin_4") {
      if (!taskData.tempMiddle) {
        setMessage("Please enter the middle temperature for Bin 4.");
        return;
      }
      if (!taskData.middleSqueeze) {
        setMessage("Please select a squeeze test result for Bin 4.");
        return;
      }
      if ((taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry") && 
          !taskData.middleCorrectiveActions?.trim()) {
        setMessage("Please describe the corrective actions taken for the middle position.");
        return;
      }
      if (!taskData.mix) {
        setMessage("Please select a mix option for Bin 4.");
        return;
      }
    } else if (taskData.binType === "steel_bins") {
      // Steel bins don't require temperature measurements
      if (!taskData.middleSqueeze) {
        setMessage("Please select a squeeze test result for Steel Bins.");
        return;
      }
      if ((taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry") && 
          !taskData.middleCorrectiveActions?.trim()) {
        setMessage("Please describe the corrective actions taken for the middle position.");
        return;
      }
      if (!taskData.mix) {
        setMessage("Please select a mix option for Steel Bins.");
        return;
      }
    } else if (taskData.binType === "bin_1" || taskData.binType === "bin_2" || taskData.binType === "bin_3") {
      if (!taskData.tempLeft || !taskData.tempMiddle || !taskData.tempRight) {
        setMessage("Please enter all temperature measurements for this bin.");
        return;
      }
      if (!taskData.leftSqueeze || !taskData.middleSqueeze || !taskData.rightSqueeze) {
        setMessage("Please select squeeze test results for all positions.");
        return;
      }
      // Check corrective actions for each position
      if ((taskData.leftSqueeze === "Too Wet" || taskData.leftSqueeze === "Too Dry") && 
          !taskData.leftCorrectiveActions?.trim()) {
        setMessage("Please describe the corrective actions taken for the left position.");
        return;
      }
      if ((taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry") && 
          !taskData.middleCorrectiveActions?.trim()) {
        setMessage("Please describe the corrective actions taken for the middle position.");
        return;
      }
      if ((taskData.rightSqueeze === "Too Wet" || taskData.rightSqueeze === "Too Dry") && 
          !taskData.rightCorrectiveActions?.trim()) {
        setMessage("Please describe the corrective actions taken for the right position.");
        return;
      }
      if (!taskData.mix) {
        setMessage("Please select a mix option for this bin.");
        return;
      }
    }

    // Save the task data
    saveTaskData();

    // Navigate to additional tasks page
    const params = new URLSearchParams(searchParams);
    router.push(`/compost-form/additional-tasks?${params.toString()}`);
  };

  const updateTaskData = (field: keyof TaskData, value: string) => {
    console.log(`Updating ${field} to: ${value}`);
    setTaskData(prev => {
      // If bin type is changing, apply smart clearing logic
      if (field === 'binType') {
        const currentBinType = prev.binType;
        const newBinType = value;
        
        // Preserve data when switching between bins 1, 2, 3
        // Clear data when switching to/from bin 4 or steel bins
        const isRegularBin = (bin: string) => bin === "bin_1" || bin === "bin_2" || bin === "bin_3";
        const isSpecialBin = (bin: string) => bin === "bin_4" || bin === "steel_bins";
        
        const shouldPreserveData = isRegularBin(currentBinType) && isRegularBin(newBinType);
        
        if (shouldPreserveData) {
          // Keep existing data when switching between regular bins
          return {
            ...prev,
            binType: newBinType
          };
        } else {
          // Clear all form data when switching to/from special bins
          return {
            binType: newBinType,
            tempLeft: "",
            tempMiddle: "",
            tempRight: "",
            leftSqueeze: "",
            middleSqueeze: "",
            rightSqueeze: "",
            leftCorrectiveActions: "",
            middleCorrectiveActions: "",
            rightCorrectiveActions: "",
            mix: ""
          };
        }
      }
      
      // For other fields, just update the specific field
      return { ...prev, [field]: value };
    });
    setMessage("");
  };

  const isFormValid = () => {
    if (!taskData.binType) return false;
    
    // Check basic requirements first
    let basicValid = false;
    if (taskData.binType === "bin_4") {
      basicValid = !!(taskData.tempMiddle && taskData.middleSqueeze && taskData.mix);
    } else if (taskData.binType === "steel_bins") {
      basicValid = !!(taskData.middleSqueeze && taskData.mix);
    } else if (taskData.binType === "bin_1" || taskData.binType === "bin_2" || taskData.binType === "bin_3") {
      basicValid = !!(taskData.tempLeft && taskData.tempMiddle && taskData.tempRight && 
                taskData.leftSqueeze && taskData.middleSqueeze && taskData.rightSqueeze && taskData.mix);
    }
    
    if (!basicValid) return false;
    
    // Check corrective actions requirements
    if (taskData.binType === "bin_4" || taskData.binType === "steel_bins") {
      // For bin 4 and steel bins, check if middle squeeze needs corrective actions
      if ((taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry") && 
          !taskData.middleCorrectiveActions?.trim()) {
        return false;
      }
    } else if (taskData.binType === "bin_1" || taskData.binType === "bin_2" || taskData.binType === "bin_3") {
      // For bins 1, 2, 3, check all positions
      if ((taskData.leftSqueeze === "Too Wet" || taskData.leftSqueeze === "Too Dry") && 
          !taskData.leftCorrectiveActions?.trim()) {
        return false;
      }
      if ((taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry") && 
          !taskData.middleCorrectiveActions?.trim()) {
        return false;
      }
      if ((taskData.rightSqueeze === "Too Wet" || taskData.rightSqueeze === "Too Dry") && 
          !taskData.rightCorrectiveActions?.trim()) {
        return false;
      }
    }
    
    return true;
  };

  if (!formData) {
    return <div style={{ textAlign: "center", padding: "20px", color: "#FB3939", fontFamily: "PT Sans, sans-serif" }}>{message}</div>;
  }

  const formIsValid = isFormValid(); // compute once per render. trying to fix issue where button doesn't work

  return (
    <div style={{ 
      width: "100%",
      overscrollBehavior: "contain",
      overscrollBehaviorY: "contain",
      touchAction: "pan-y",
      WebkitOverflowScrolling: "touch",
    }}>
      <form onSubmit={handleSubmit}>
        {/* Bin Type */}
        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", fontSize: "24px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
            Bin Type
          </label>
          <select
          value={taskData.binType}
            onChange={(e) => updateTaskData('binType', e.target.value)}
            style={{
              width: "100%", height: "57px", borderRadius: "16px",
              backgroundColor: "#ffffff", border: "2px solid #758A48",
              fontSize: "20px", padding: "0 12px", fontFamily: "PT Sans, sans-serif",
              color: "#758A48"
            }}
            required
          >
            <option value="">Select bin type</option>
            <option value="bin_1">Bin 1</option>
            <option value="bin_2">Bin 2</option>
            <option value="bin_3">Bin 3</option>
            <option value="bin_4">Bin 4 (Curing Pile)</option>
            <option value="steel_bins">Steel Bins</option>
          </select>
        </div>

        {/* Temperature Measurements - Only for bins 1, 2, 3, and 4 */}
        {taskData.binType && (taskData.binType === "bin_1" || taskData.binType === "bin_2" || taskData.binType === "bin_3" || taskData.binType === "bin_4") && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
              Temperature Measurements (°F)
            </h3>
            
            {taskData.binType === "bin_4" ? (
              // Bin 4 only has middle temperature
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                  Middle Temperature
                </label>
                <input
                  type="number"
                  value={taskData.tempMiddle}
                  onChange={(e) => updateTaskData('tempMiddle', e.target.value)}
                  placeholder="Enter temperature"
                  style={{
                    width: "100%",
                    height: "50px",
                    borderRadius: "16px",
                    backgroundColor: "#ffffff",
                    border: "2px solid #758A48",
                    fontSize: "18px",
                    padding: "0 12px",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#758A48"
                  }}
                  required
                />
              </div>
            ) : (
              // Bins 1, 2, 3 have left, middle, right temperatures
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Left
                  </label>
                  <input
                    type="number"
                    value={taskData.tempLeft}
                    onChange={(e) => updateTaskData('tempLeft', e.target.value)}
                    placeholder="°F"
                    style={{
                      width: "100%",
                      height: "50px",
                      borderRadius: "16px",
                      backgroundColor: "#ffffff",
                      border: "2px solid #758A48",
                      fontSize: "18px",
                      padding: "0 12px",
                      fontFamily: "PT Sans, sans-serif",
                      color: "#758A48"
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Middle
                  </label>
                  <input
                    type="number"
                    value={taskData.tempMiddle}
                    onChange={(e) => updateTaskData('tempMiddle', e.target.value)}
                    placeholder="°F"
                    style={{
                      width: "100%",
                      height: "50px",
                      borderRadius: "16px",
                      backgroundColor: "#ffffff",
                      border: "2px solid #758A48",
                      fontSize: "18px",
                      padding: "0 12px",
                      fontFamily: "PT Sans, sans-serif",
                      color: "#758A48"
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Right
                  </label>
                  <input
                    type="number"
                    value={taskData.tempRight}
                    onChange={(e) => updateTaskData('tempRight', e.target.value)}
                    placeholder="°F"
                    style={{
                      width: "100%",
                      height: "50px",
                      borderRadius: "16px",
                      backgroundColor: "#ffffff",
                      border: "2px solid #758A48",
                      fontSize: "18px",
                      padding: "0 12px",
                      fontFamily: "PT Sans, sans-serif",
                      color: "#758A48"
                    }}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Squeeze Test - For all bin types */}
        {taskData.binType && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
              Squeeze Test Results
            </h3>
            
            {taskData.binType === "bin_4" || taskData.binType === "steel_bins" ? (
              // Bin 4 and Steel Bins only have middle squeeze test
              <div>
                <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                  Middle Squeeze Test
                </label>
                <div>
                  {["Good", "Too Wet", "Too Dry"].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateTaskData('middleSqueeze', taskData.middleSqueeze === option ? "" : option)}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "50px",
                        marginBottom: "10px",
                        borderRadius: "16px",
                        backgroundColor: taskData.middleSqueeze === option ? "#758A48" : "#ffffff",
                        border: `2px solid ${taskData.middleSqueeze === option ? "#758A48" : "#758A48"}`,
                        fontSize: "16px",
                        fontWeight: "bold",
                        fontFamily: "PT Sans, sans-serif",
                        color: taskData.middleSqueeze === option ? "#FFFFFF" : "#758A48",
                        cursor: "pointer",
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Bins 1, 2, 3 have left, middle, right squeeze tests
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Left
                  </label>
                  <div>
                    {["Good", "Too Wet", "Too Dry"].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateTaskData('leftSqueeze', taskData.leftSqueeze === option ? "" : option)}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "40px",
                          marginBottom: "8px",
                          borderRadius: "12px",
                          backgroundColor: taskData.leftSqueeze === option ? "#758A48" : "#ffffff",
                          border: `2px solid ${taskData.leftSqueeze === option ? "#758A48" : "#758A48"}`,
                          fontSize: "14px",
                          fontWeight: "bold",
                          fontFamily: "PT Sans, sans-serif",
                          color: taskData.leftSqueeze === option ? "#FFFFFF" : "#758A48",
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Middle
                  </label>
                  <div>
                    {["Good", "Too Wet", "Too Dry"].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateTaskData('middleSqueeze', taskData.middleSqueeze === option ? "" : option)}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "40px",
                          marginBottom: "8px",
                          borderRadius: "12px",
                          backgroundColor: taskData.middleSqueeze === option ? "#758A48" : "#ffffff",
                          border: `2px solid ${taskData.middleSqueeze === option ? "#758A48" : "#758A48"}`,
                          fontSize: "14px",
                          fontWeight: "bold",
                          fontFamily: "PT Sans, sans-serif",
                          color: taskData.middleSqueeze === option ? "#FFFFFF" : "#758A48",
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                    Right
                  </label>
                  <div>
                    {["Good", "Too Wet", "Too Dry"].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateTaskData('rightSqueeze', taskData.rightSqueeze === option ? "" : option)}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "40px",
                          marginBottom: "8px",
                          borderRadius: "12px",
                          backgroundColor: taskData.rightSqueeze === option ? "#758A48" : "#ffffff",
                          border: `2px solid ${taskData.rightSqueeze === option ? "#758A48" : "#758A48"}`,
                          fontSize: "14px",
                          fontWeight: "bold",
                          fontFamily: "PT Sans, sans-serif",
                          color: taskData.rightSqueeze === option ? "#FFFFFF" : "#758A48",
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Corrective Actions - Only show when squeeze test is Too Wet or Too Dry */}
        {taskData.binType && (
          <div style={{ marginBottom: "30px" }}>
            {/* Check if any squeeze test needs corrective actions */}
            {((taskData.binType === "bin_4" || taskData.binType === "steel_bins") && 
              (taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry")) ||
             ((taskData.binType === "bin_1" || taskData.binType === "bin_2" || taskData.binType === "bin_3") &&
              (taskData.leftSqueeze === "Too Wet" || taskData.leftSqueeze === "Too Dry" ||
               taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry" ||
               taskData.rightSqueeze === "Too Wet" || taskData.rightSqueeze === "Too Dry")) ? (
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                  Corrective Actions Taken
                </h3>
                <p style={{ fontSize: "16px", marginBottom: "20px", fontFamily: "PT Sans, sans-serif", color: "#666666" }}>
                  Please describe what corrective actions you took for the areas that were too wet or too dry:
                </p>
                
                {taskData.binType === "bin_4" || taskData.binType === "steel_bins" ? (
                  // Bin 4 and Steel Bins - only middle corrective actions
                  taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry" ? (
                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                        Middle Corrective Actions ({taskData.middleSqueeze})
                      </label>
                      <textarea
                        value={taskData.middleCorrectiveActions}
                        onChange={(e) => updateTaskData('middleCorrectiveActions', e.target.value)}
                        placeholder={`Describe what you did to address the ${taskData.middleSqueeze.toLowerCase()} condition...`}
                        style={{
                          width: "100%",
                          minHeight: "80px",
                          borderRadius: "16px",
                          backgroundColor: "#ffffff",
                          border: "2px solid #758A48",
                          fontSize: "16px",
                          padding: "12px",
                          fontFamily: "PT Sans, sans-serif",
                          color: "#758A48",
                          resize: "vertical"
                        }}
                        required
                      />
                    </div>
                  ) : null
                ) : (
                  // Bins 1, 2, 3 - left, middle, right corrective actions
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {taskData.leftSqueeze === "Too Wet" || taskData.leftSqueeze === "Too Dry" ? (
                      <div>
                        <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                          Left Corrective Actions ({taskData.leftSqueeze})
                        </label>
                        <textarea
                          value={taskData.leftCorrectiveActions}
                          onChange={(e) => updateTaskData('leftCorrectiveActions', e.target.value)}
                          placeholder={`Describe what you did to address the ${taskData.leftSqueeze.toLowerCase()} condition...`}
                          style={{
                            width: "100%",
                            minHeight: "80px",
                            borderRadius: "16px",
                            backgroundColor: "#ffffff",
                            border: "2px solid #758A48",
                            fontSize: "16px",
                            padding: "12px",
                            fontFamily: "PT Sans, sans-serif",
                            color: "#758A48",
                            resize: "vertical"
                          }}
                          required
                        />
                      </div>
                    ) : null}
                    
                    {taskData.middleSqueeze === "Too Wet" || taskData.middleSqueeze === "Too Dry" ? (
                      <div>
                        <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                          Middle Corrective Actions ({taskData.middleSqueeze})
                        </label>
                        <textarea
                          value={taskData.middleCorrectiveActions}
                          onChange={(e) => updateTaskData('middleCorrectiveActions', e.target.value)}
                          placeholder={`Describe what you did to address the ${taskData.middleSqueeze.toLowerCase()} condition...`}
                          style={{
                            width: "100%",
                            minHeight: "80px",
                            borderRadius: "16px",
                            backgroundColor: "#ffffff",
                            border: "2px solid #758A48",
                            fontSize: "16px",
                            padding: "12px",
                            fontFamily: "PT Sans, sans-serif",
                            color: "#758A48",
                            resize: "vertical"
                          }}
                          required
                        />
                      </div>
                    ) : null}
                    
                    {taskData.rightSqueeze === "Too Wet" || taskData.rightSqueeze === "Too Dry" ? (
                      <div>
                        <label style={{ display: "block", fontSize: "18px", fontWeight: "bold", marginBottom: "10px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
                          Right Corrective Actions ({taskData.rightSqueeze})
                        </label>
                        <textarea
                          value={taskData.rightCorrectiveActions}
                          onChange={(e) => updateTaskData('rightCorrectiveActions', e.target.value)}
                          placeholder={`Describe what you did to address the ${taskData.rightSqueeze.toLowerCase()} condition...`}
                          style={{
                            width: "100%",
                            minHeight: "80px",
                            borderRadius: "16px",
                            backgroundColor: "#ffffff",
                            border: "2px solid #758A48",
                            fontSize: "16px",
                            padding: "12px",
                            fontFamily: "PT Sans, sans-serif",
                            color: "#758A48",
                            resize: "vertical"
                          }}
                          required
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Mix Options */}
        {taskData.binType && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", fontFamily: "PT Sans, sans-serif", color: "#758A48" }}>
              Did you mix the material?
            </h3>
            <div>
              {["Mixed while adding", "Mixed within bin", "No mixing"].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateTaskData('mix', taskData.mix === option ? "" : option)}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "50px",
                    marginBottom: "10px",
                    borderRadius: "16px",
                    backgroundColor: taskData.mix === option ? "#758A48" : "#ffffff",
                    border: `2px solid ${taskData.mix === option ? "#758A48" : "#758A48"}`,
                    fontSize: "16px",
                    fontWeight: "bold",
                    fontFamily: "PT Sans, sans-serif",
                    color: taskData.mix === option ? "#FFFFFF" : "#758A48",
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
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
          <span style={{ fontSize: "32px", fontFamily: "Lalezar, sans-serif", color: "#758A48" }}>NEXT</span>
          <FaArrowRight style={{ width: "30px", height: "30px", color: "#758A48" }} />
        </button>
      </form>

      {message && <div style={{ marginTop: "20px", textAlign: "center", color: "#FB3939", fontFamily: "PT Sans, sans-serif" }}>{message}</div>}
    </div>
  );
}


