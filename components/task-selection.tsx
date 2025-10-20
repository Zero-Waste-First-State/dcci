"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowRight } from "react-icons/fa";

interface TaskSelectionProps {
  siteId: number;
}

export default function TaskSelection({ siteId }: TaskSelectionProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem(`compost_form_${siteId}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setSelectedTask(data.selectedTask || "");
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }
  }, [siteId]);

  // Save data
  useEffect(() => {
    if (firstName || lastName || email || selectedTask) {
      const data = {
        firstName,
        lastName,
        email,
        selectedTask,
        siteId,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`compost_form_${siteId}`, JSON.stringify(data));
    }
  }, [firstName, lastName, email, selectedTask, siteId]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const taskOptions = [
    { id: "add_material", label: "Add Material to Bin", path: "adding-material" },
    { id: "measure_bin", label: "Measure Bin", path: "measuring-bin" },
    { id: "move_bins", label: "Move Bins", path: "moving-bins" },
    { id: "finished_compost", label: "Finished Compost", path: "finished-compost" },
    { id: "report_issue", label: "Report Contamination/Issue", path: "litter-page" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) return setMessage("Please enter both first and last name");
    if (!email.trim()) return setMessage("Please enter your email address");
    if (!isValidEmail(email.trim())) return setMessage("Please enter a valid email address");
    if (!selectedTask) return setMessage("Please select a task");

    const params = new URLSearchParams({
      site: siteId.toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      tasks: selectedTask,
      submissionId: `temp_${Date.now()}`
    });

    const task = taskOptions.find(task => task.id === selectedTask);
    if (task) {
      // Special case: Report Contamination/Issue skips directly to litter page
      if (selectedTask === "report_issue") {
        router.push(`/compost-form/litter-page?${params.toString()}`);
      } else {
        router.push(`/compost-form/task-selection/${task.path}?${params.toString()}`);
      }
    }
  };

  const clearSavedData = () => {
    localStorage.removeItem(`compost_form_${siteId}`);
    setFirstName("");
    setLastName("");
    setEmail("");
    setSelectedTask("");
    setMessage("Form data cleared. You can start a new submission.");
  };

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && selectedTask && isValidEmail(email.trim());

  const COLORS = {
    green: "#758A48",
    greenHover: "#5D7336",
    grayText: "#8F8F8F",
    white: "#FFFFFF",
    inputBg: "#EEEEEE",
    inputBorder: "#ACACAC",
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Title */}
      <p style={{ fontSize: "32px", fontWeight: "bold", color: COLORS.green, marginBottom: "20px", textAlign: "center", fontFamily: "PT Sans, sans-serif" }}>
        What are you doing today?
      </p>
      <p style={{ fontSize: "24px", color: COLORS.grayText, marginBottom: "30px", textAlign: "center", fontFamily: "PT Sans, sans-serif" }}>
        (Please fill out the form below)
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        {/* First Name */}
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="firstName" style={{ fontFamily: "PT Sans, sans-serif", fontSize: "24px", color: COLORS.green }}>
            First Name:
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "16px",
              border: `1px solid ${COLORS.inputBorder}`,
              backgroundColor: COLORS.inputBg,
              fontSize: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: COLORS.grayText,
            }}
          />
        </div>

        {/* Last Name */}
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="lastName" style={{ fontFamily: "PT Sans, sans-serif", fontSize: "24px", color: COLORS.green }}>
            Last Name:
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "16px",
              border: `1px solid ${COLORS.inputBorder}`,
              backgroundColor: COLORS.inputBg,
              fontSize: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: COLORS.grayText,
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "30px" }}>
          <label htmlFor="email" style={{ fontFamily: "PT Sans, sans-serif", fontSize: "24px", color: COLORS.green }}>
            Email Address:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "16px",
              border: `1px solid ${COLORS.inputBorder}`,
              backgroundColor: COLORS.inputBg,
              fontSize: "20px",
              fontFamily: "PT Sans, sans-serif",
              color: COLORS.grayText,
            }}
          />
          <p style={{ fontSize: "14px", color: COLORS.grayText, marginTop: "5px", fontFamily: "PT Sans, sans-serif" }}>
            Used to uniquely identify users with similar names
          </p>
        </div>

        {/* Task Buttons */}
        <div style={{ marginBottom: "30px" }}>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: COLORS.green, marginBottom: "15px", textAlign: "center", fontFamily: "PT Sans, sans-serif" }}>
            Select a Task to Perform:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {taskOptions.map(task => {
              const isSelected = selectedTask === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTask(task.id)}
                  style={{
                    width: "100%",
                    height: "65px",
                    borderRadius: "26px",
                    border: `1px solid ${COLORS.green}`,
                    backgroundColor: isSelected ? COLORS.green : COLORS.white,
                    color: isSelected ? COLORS.white : COLORS.green,
                    fontFamily: "PT Sans, sans-serif",
                    fontSize: "20px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {task.label}
                </button>
              );
            })}
          </div>
        </div>

        {message && (
          <div style={{ marginBottom: "20px", textAlign: "center", color: "#FB3939", fontFamily: "PT Sans, sans-serif", fontSize: "16px" }}>
            {message}
          </div>
        )}
      </form>

      {/* NEXT Button */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid}
        style={{
          width: "100%",
          height: "118px",
          borderRadius: "69px",
          border: `2px solid ${COLORS.green}`,
          backgroundColor: COLORS.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          cursor: isFormValid ? "pointer" : "not-allowed",
          opacity: isFormValid ? 1 : 0.6,
          marginBottom: "20px",
        }}
      >
        <span style={{ fontFamily: "Lalezar, sans-serif", fontSize: "64px", color: COLORS.green, lineHeight: "79px" }}>
          NEXT
        </span>
        <FaArrowRight style={{ width: "70px", height: "65px", color: COLORS.green }} />
      </button>

      {/* Clear Data */}
      <button
        type="button"
        onClick={clearSavedData}
        style={{
          width: "100%",
          height: "60px",
          backgroundColor: COLORS.grayText,
          border: `2px solid ${COLORS.inputBorder}`,
          borderRadius: "30px",
          color: COLORS.white,
          fontFamily: "PT Sans, sans-serif",
          fontSize: "20px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Clear Saved Data
      </button>
    </div>
  );
}
