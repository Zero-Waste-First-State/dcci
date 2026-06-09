"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { FaArrowRight } from "react-icons/fa";

interface MixingBinProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  mixBin1: boolean;
  mixBin2: boolean;
  mixBin3: boolean;
  mixBin4: boolean;
}

export default function MixingBin({ searchParams }: MixingBinProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    mixBin1: false,
    mixBin2: false,
    mixBin3: false,
    mixBin4: false,
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

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
      console.log("Starting new instance of Mix Bin task");
    } else {
      // Load saved task data from localStorage
      const savedTaskData = localStorage.getItem(`task_mix_bins_${data.submissionId}`);
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

  const saveTaskData = () => {
    if (!formData) return;

    console.log("Saving final task data to localStorage:", taskData);

    // Check if this is a new instance
    const isNewInstance = searchParams.get('newInstance') === 'true';

    if (isNewInstance) {
      // For new instances, append to existing data or create new array
      const existingData = localStorage.getItem(`task_mix_bins_${formData.submissionId}`);
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
      localStorage.setItem(`task_mix_bins_${formData.submissionId}`, JSON.stringify(taskArray));
    } else {
      // For regular instances, save as single task
      localStorage.setItem(`task_mix_bins_${formData.submissionId}`, JSON.stringify(taskData));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskData.mixBin === 0) {
      setMessage("Please select the bin(s) mixed today.");
      return;
    }
    saveTaskData();
    router.push(`/compost-form/additional-tasks?${searchParams.toString()}`);
  };

  const updateTaskData = (field: keyof TaskData) => {
    setTaskData(prev => ({ ...prev, [field]: !prev[field] }));
    setMessage("");
  };

  const formIsValid = taskData.mixBin1 || taskData.mixBin2 || taskData.mixBin3 || taskData.mixBin4;

  if (!formData) return <div style={{ textAlign: "center", padding: "20px" }}>{message}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <h3 className="text-2xl font-bold mb-5 text-earthyGreen">
        Which bin did you mix today?
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {[
          { label: "Bin 1", field: "mixBin1" },
          { label: "Bin 2", field: "mixBin2" },
          { label: "Bin 3", field: "mixBin3" },
          { label: "Bin 4", field: "mixBin4" }
        ].map(b => (
          <button
            key={b.field}
            type="button"
            onClick={() => updateTaskData(b.field as keyof TaskData)}
            style={{
              width: "100%",
              height: "57px",
              borderRadius: "16px",
              backgroundColor: taskData[b.field as keyof TaskData] ? "#758A48" : "#FFFFFF",
              border: "1px solid #758A48",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              color: taskData[b.field as keyof TaskData] ? "#FFFFFF" : "#758A48", // makes text of buttons green instead of default black
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {message && <p style={{ color: "#FB3939", marginTop: "20px" }}>{message}</p>}

      <button
        type="submit"
        disabled={!formIsValid}
        style={{
          width: "100%",
          height: "57px",
          marginTop: "20px",
          borderRadius: "69px",
          border: "2px solid #758A48",
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          cursor: formIsValid ? "pointer" : "not-allowed",
          opacity: formIsValid ? 1 : 0.6
        }}
      >
        <span style={{ fontSize: "32px", color: "#758A48" }}>NEXT</span>
        <FaArrowRight style={{ width: "30px", height: "30px", color: "#758A48" }} />
      </button>
    </form>
  );
}
