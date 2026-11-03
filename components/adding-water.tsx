"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { NextButton } from "@/components/ui/dcci/forms/next-button";

interface AddingWaterProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  binType: string;
}

export default function AddingWater({ searchParams }: AddingWaterProps) {
  const localstorageKey = 'add_water';

  const [formData, setFormData] = useState<FormData | null>(null);

  const [taskData, setTaskData] = useState<TaskData>({
    binType: "",
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
      console.log("Starting new instance of Add Water task");
    } else {
      // Load saved task data from localStorage
      const savedTaskData = localStorage.getItem(`task_${localstorageKey}_${data.submissionId}`);
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
      const existingData = localStorage.getItem(`task_${localstorageKey}_${formData.submissionId}`);
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
      localStorage.setItem(`task_${localstorageKey}_${formData.submissionId}`, JSON.stringify(taskArray));
    } else {
      // For regular instances, save as single task
      localStorage.setItem(`task_${localstorageKey}_${formData.submissionId}`, JSON.stringify(taskData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // // Validate required fields based on bin type
    // if (taskData.binType === "browns") {
    //   if (!taskData.brownsBinAGallons || !taskData.brownsBinBGallons) {
    //     setMessage("Please enter browns gallons for both Bin A and Bin B.");
    //     return;
    //   }
    // } else if (taskData.binType && taskData.binType !== "browns") {
    //   if (!taskData.greensPounds || !taskData.greensGallons || !taskData.brownsGallons) {
    //     setMessage("Please fill in all required fields for regular bins.");
    //     return;
    //   }
    // } else {
    //   setMessage("Please select a bin type.");
    //   return;
    // }

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
    return true;

    // if (taskData.binType === "browns") {
    //   return taskData.brownsBinAGallons && taskData.brownsBinBGallons;
    // } else if (taskData.binType && taskData.binType !== "browns") {
    //   return taskData.greensPounds && taskData.greensGallons && taskData.brownsGallons;
    // }
    // return false;
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
            Added Water To:
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
            <option value="">Select a bin</option>
            <option value="bin1">Bin 1</option>
            <option value="bin2">Bin 2</option>
            <option value="bin3">Bin 3</option>
            <option value="bin4">Bin 4</option>
          </select>
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

      <NextButton isValid={isFormValid()} handler={handleSubmit} />
    </div>
  );
}
