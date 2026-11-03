'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { FaArrowRight } from "react-icons/fa";
import TasksAvailable from "@/components/tasks-available";
import { flattenedTasks } from '@/lib/tasks';

interface AdditionalTasksProps {
  searchParams: URLSearchParams;
}

export default function AdditionalTasks({ searchParams }: AdditionalTasksProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const activeTaskSet = flattenedTasks();

  useEffect(() => {
    const data = parseFormDataFromURL(searchParams);

    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    setFormData(data);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    const task = activeTaskSet.find(task => task.id === selectedTask);

    if (task) {
      // Navigate to the selected task with newInstance flag
      const params = new URLSearchParams(searchParams.toString());
      params.set('newInstance', 'true');
      router.push(`/compost-form/task-selection/${task.path}?${params.toString()}`);
    } else {
      // If no additional tasks, go directly to litter page
      router.push(`/compost-form/litter-page?${searchParams.toString()}`);
    }
  };

  const handleTaskSelected = (task) => {
    setSelectedTask(task);
  }

  const isFormValid = () => {
    // nothing is required here:
    // user is either selecting an add'l task
    // or skipping ahead to contamination
    return true; // selectedTasks.length <= 1; // Valid if 0 or 1 tasks selected
  };

  return (
    <div className="compost-log-form">

      <h3 style={{marginBottom: "20px"}}>
        Do you have any additional tasks you&apos;d like to complete today?
      </h3>
      <p style={{ marginBottom: "20px" }}>
        Select an additional task<br/> or continue to litter assessment:
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "30px" }}>

            <TasksAvailable
              taskSet={activeTaskSet}
              onSelect={handleTaskSelected}
            />

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

      {/* Submit (Continue/Skip) Button */}
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
          {selectedTask != ''
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
