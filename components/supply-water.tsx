'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { NextButton } from "@/components/ui/dcci/forms/next-button";

interface SupplyWaterProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  waterJugsFill: boolean;
  waterToBarrel: boolean;
}

export default function SupplyWater({ searchParams }: SupplyWaterProps) {
  const router = useRouter();

  const localstorageKey = 'supply_water';

  const [formData, setFormData] = useState<FormData | null>(null);

  const [taskData, setTaskData] = useState<TaskData>({
    waterJugsFill: false,
    waterToBarrel: false,
  });

  const [message, setMessage] = useState("");

  // Parse form data from URL on component mount
  useEffect(() => {
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
      console.log("Starting new instance of Supply Water task");
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
    //console.log("Saving final task data to localStorage:", taskData);

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

  /**
   * handleSubmit // form submit handler (i.e. "Next")
   * @param  {[type]} e: React.FormEvent [description]
   * @return {[type]}    [description]
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // Save the task data
    saveTaskData();

    // Navigate to additional tasks page
    const params = new URLSearchParams(searchParams);
    router.push(`/compost-form/additional-tasks?${params.toString()}`);
  };

  const updateTaskData = (field: keyof TaskData) => {
    setTaskData(prev => ({ ...prev, [field]: !prev[field] }));
    setMessage("");
  };

  const isFormValid = () => {
    return taskData.waterJugsFill || taskData.waterToBarrel;
  };

  if (!formData) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p style={{ color: "#FB3939", fontFamily: "PT Sans, sans-serif" }}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <h3 className="text-2xl font-bold mb-5 text-earthyGreen">
        Select Water Supply Activities:
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {[
          { label: "Filled Jugs", field: "waterJugsFill" },
          { label: "Brought to Barrel", field: "waterToBarrel" }
        ].map(subtask => (
          <button
            key={subtask.field}
            type="button"
            onClick={() => updateTaskData(subtask.field as keyof TaskData)}
            style={{
              width: "100%",
              height: "57px",
              borderRadius: "16px",
              backgroundColor: taskData[subtask.field as keyof TaskData] ? "#758A48" : "#FFFFFF",
              border: "1px solid #758A48",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              color: taskData[subtask.field as keyof TaskData] ? "#FFFFFF" : "#758A48", // makes text of buttons green instead of default black
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {subtask.label}
          </button>
        ))}
      </div>

      {message &&
        <p style={{ color: "#FB3939", marginTop: "20px" }}>
          {message}
        </p>
      }

     <NextButton isValid={isFormValid()} handler={handleSubmit} />
    </form>
  );
}
