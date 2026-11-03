'use client';

/**
 * Task Data Detail w/Edit & Delete buttons - for final Review & Submit page
 */

interface Props {
  index?: number;
  taskId?: string;
  taskData?: array;
  renderFn?: () => void;
  editFn?: () => void;
  deleteFn?: () => void;
}

export function TaskDataDetail({index = -1, taskId, taskData, renderFn, editFn, deleteFn}: Props) {
  return (
    <div
      style={{
        borderLeft: "3px solid #4CAF50",
        paddingLeft: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: "PT Sans, sans-serif",
            color: "#666666",
            margin: 0,
          }}
        >
          Task Detail:
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => editFn(taskId, index)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#899D5E",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "PT Sans, sans-serif",
              minHeight: "40px",
              minWidth: "80px",
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => deleteFn(taskId, index)}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#FF4444",
              color: "white",
              border: "none",
              borderRadius: "50%",
              fontSize: "20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "PT Sans, sans-serif",
            }}
          >
            ×
          </button>
        </div>
      </div>
      {renderFn(taskId, taskData)}
    </div>
  );
}
