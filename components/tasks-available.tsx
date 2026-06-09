"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import { FaCheck } from "react-icons/fa";
// import { FaCheckDouble } from "react-icons/fa";
import { FaExclamationCircle } from "react-icons/fa";

interface TasksAvailableProps {
  taskSet: string;
}

export default function TasksAvailable({ taskSet, onSelect }: TasksAvailableProps) {
  const [selectedTask, setSelectedTask] = useState<string>("");

  useEffect(() => {
    if (selectedTask) {
      setSelectedTask(selectedTask);
      onSelect(selectedTask);
    }
  }, [selectedTask]);

  const COLORS = {
    green: "#758A48",
    greenHover: "#5D7336",
    grayText: "#8F8F8F",
    white: "#FFFFFF",
    inputBg: "#EEEEEE",
    inputBorder: "#ACACAC",
  };

  return (
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "16px" }}>
        {taskSet.map(task => {

          const isSelected = selectedTask === task.id;
          const TaskIcon = task.icon;

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
                textAlign: "left",
                paddingLeft: "2rem",
              }}
            >
              <TaskIcon style={{ display: "inline-block", float: "left", marginLeft: "10px" }}/>

              &nbsp; {task.label}
            </button>
          );
        })}
      </div>
  );
}
