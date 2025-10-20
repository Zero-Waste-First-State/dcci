"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";

import { FaArrowRight } from "react-icons/fa";

interface FinishedCompostProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  gallonsTaken: string;
}

export default function FinishedCompost({ searchParams }: FinishedCompostProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    gallonsTaken: ""
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
      console.log("Starting new instance of Finished Compost task");
    } else {
      // Load saved task data from localStorage
      const savedTaskData = localStorage.getItem(`task_finished_compost_${data.submissionId}`);
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
      const existingData = localStorage.getItem(`task_finished_compost_${formData.submissionId}`);
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
      localStorage.setItem(`task_finished_compost_${formData.submissionId}`, JSON.stringify(taskArray));
    } else {
      // For first instance, save as single object (backward compatibility)
      localStorage.setItem(`task_finished_compost_${formData.submissionId}`, JSON.stringify(taskData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    if (!taskData.gallonsTaken.trim()) {
      setMessage("Please enter the amount of finished compost taken.");
      return;
    }

    // Save the task data
    saveTaskData();

    // Navigate to additional tasks page
    const params = new URLSearchParams(searchParams);
    router.push(`/compost-form/additional-tasks?${params.toString()}`);
  };

  const updateTaskData = (field: keyof TaskData, value: string) => {
    setTaskData(prev => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const isFormValid = () => {
    return taskData.gallonsTaken.trim() !== "";
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
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: "#758A48",
            }}
          >
            How much finished compost was taken?
          </h3>
          <p
            style={{
              fontSize: "20px",
              marginBottom: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: "#8F8F8F",
            }}
          >
            Enter the amount of finished compost that was removed from the site:
          </p>
          
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
              Gallons of Finished Compost Taken <span style={{ color: "#FB3939" }}>*</span>
            </label>
            <input
              type="number"
              value={taskData.gallonsTaken}
              onChange={(e) => updateTaskData('gallonsTaken', e.target.value)}
              placeholder="Enter volume in gallons"
              min="0"
              step="0.1"
              style={{
                width: "100%",
                height: "57px",
                borderRadius: "16px",
                backgroundColor: "#EEEEEE",
                border: "1px solid #ACACAC",
                fontSize: "20px",
                padding: "0 12px",
                fontFamily: "PT Sans, sans-serif",
                color: "#8F8F8F",
              }}
              required
            />
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
