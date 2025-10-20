"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";

import { FaArrowRight } from "react-icons/fa";

interface AdditionalTasksProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  addMaterial: boolean;
  measureBin: boolean;
  moveBins: boolean;
  finishedCompost: boolean;
}

export default function AdditionalTasks({ searchParams }: AdditionalTasksProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    addMaterial: false,
    measureBin: false,
    moveBins: false,
    finishedCompost: false
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    console.log("Additional Tasks mounted, searchParams:", searchParams.toString());
    const data = parseFormDataFromURL(searchParams);
    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }
    console.log("Parsed form data:", data);
    setFormData(data);

    // Load saved additional tasks data from localStorage
    const savedTaskData = localStorage.getItem(`additional_tasks_${data.submissionId}`);
    if (savedTaskData) {
      try {
        const loadedData = JSON.parse(savedTaskData);
        console.log("Loaded saved additional tasks data:", loadedData);
        setTaskData(prev => ({ ...prev, ...loadedData }));
      } catch (error) {
        console.error("Error loading saved additional tasks data:", error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (formData) {
      console.log("Saving additional tasks data to localStorage:", taskData);
      localStorage.setItem(`additional_tasks_${formData.submissionId}`, JSON.stringify(taskData));
    }
  }, [formData, taskData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    // Check if exactly one additional task is selected
    const selectedTasks = [
      taskData.addMaterial,
      taskData.measureBin,
      taskData.moveBins,
      taskData.finishedCompost
    ].filter(Boolean);

    if (selectedTasks.length === 0) {
      // If no additional tasks, go directly to litter page
      router.push(`/compost-form/litter-page?${searchParams.toString()}`);
      return;
    }

    if (selectedTasks.length > 1) {
      setMessage("Please select only one additional task at a time.");
      return;
    }

    // Clear the selection after navigating
    setTaskData({
      addMaterial: false,
      measureBin: false,
      moveBins: false,
      finishedCompost: false
    });

    // Navigate to the selected task with newInstance flag
    const params = new URLSearchParams(searchParams.toString());
    params.set('newInstance', 'true');
    
    if (taskData.addMaterial) {
      router.push(`/compost-form/task-selection/adding-material?${params.toString()}`);
    } else if (taskData.measureBin) {
      router.push(`/compost-form/task-selection/measuring-bin?${params.toString()}`);
    } else if (taskData.moveBins) {
      router.push(`/compost-form/task-selection/moving-bins?${params.toString()}`);
    } else if (taskData.finishedCompost) {
      router.push(`/compost-form/task-selection/finished-compost?${params.toString()}`);
    }
  };

  const updateTaskData = (field: keyof TaskData, value: boolean) => {
    console.log(`Updating ${field} to: ${value}`);
    
    if (value) {
      // If selecting a task, unselect all others (single selection)
      setTaskData({
        addMaterial: field === 'addMaterial',
        measureBin: field === 'measureBin',
        moveBins: field === 'moveBins',
        finishedCompost: field === 'finishedCompost'
      });
    } else {
      // If deselecting, just update that field
      setTaskData(prev => ({ ...prev, [field]: value }));
    }
    setMessage("");
  };

  const isFormValid = () => {
    const selectedTasks = [
      taskData.addMaterial,
      taskData.measureBin,
      taskData.moveBins,
      taskData.finishedCompost
    ].filter(Boolean);
    return selectedTasks.length <= 1; // Valid if 0 or 1 tasks selected
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
            Do you have any additional tasks you&apos;d like to complete today?
          </h3>
          <p
            style={{
              fontSize: "20px",
              marginBottom: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: "#8F8F8F",
            }}
          >
            Select one additional task to complete, or continue to litter assessment:
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              alignItems: "center", // <-- centers buttons horizontally
              justifyContent: "center",
              width: "100%",         // ensures container takes full width
            }}
          >
            <button
              type="button"
              onClick={() => updateTaskData('addMaterial', !taskData.addMaterial)}
              style={{
                width: "100%",
                height: "57px",
                borderRadius: "16px",
                backgroundColor: taskData.addMaterial ? "#758A48" : "#FFFFFF",
                border: "1px solid #758A48",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "PT Sans, sans-serif",
                color: taskData.addMaterial ? "#FFFFFF" : "#758A48", // white if clicked, green if not
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Add Material to Bin
            </button>

            <button
              type="button"
              onClick={() => updateTaskData('measureBin', !taskData.measureBin)}
              style={{
                width: "100%",
                height: "57px",
                borderRadius: "16px",
                backgroundColor: taskData.measureBin ? "#758A48" : "#FFFFFF",
                border: "1px solid #758A48",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "PT Sans, sans-serif",
                color: taskData.measureBin ? "#FFFFFF" : "#758A48", // white if clicked, green if not
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Measure Bin
            </button>

            <button
              type="button"
              onClick={() => updateTaskData('moveBins', !taskData.moveBins)}
              style={{
                width: "100%",
                height: "57px",
                borderRadius: "16px",
                backgroundColor: taskData.moveBins ? "#758A48" : "#FFFFFF",
                border: "1px solid #758A48",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "PT Sans, sans-serif",
                color: taskData.moveBins ? "#FFFFFF" : "#758A48", // white if clicked, green if not
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Move Bins
            </button>

            <button
              type="button"
              onClick={() => updateTaskData('finishedCompost', !taskData.finishedCompost)}
              style={{
                width: "100%",
                height: "57px",
                borderRadius: "16px",
                backgroundColor: taskData.finishedCompost ? "#758A48" : "#FFFFFF",
                border: "1px solid #758A48",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: "PT Sans, sans-serif",
                color: taskData.finishedCompost ? "#FFFFFF" : "#758A48", // white if clicked, green if not
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Finished Compost
            </button>
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
          {taskData.addMaterial || taskData.measureBin || taskData.moveBins || taskData.finishedCompost 
            ? "CONTINUE" 
            : "LITTER ASSESSMENT"}
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
