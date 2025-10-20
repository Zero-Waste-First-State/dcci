"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseFormDataFromURL, type FormData } from "@/lib/utils";
import { sendAlertEmails } from "@/lib/email";

import { FaArrowRight } from "react-icons/fa";

interface SubmitFormProps {
  searchParams: URLSearchParams;
}

interface TaskData {
  // Measure Bin specific fields
  binType?: string;
  tempLeft?: string;
  tempMiddle?: string;
  tempRight?: string;
  leftSqueeze?: string;
  middleSqueeze?: string;
  rightSqueeze?: string;
  leftCorrectiveActions?: string;
  middleCorrectiveActions?: string;
  rightCorrectiveActions?: string;
  mix?: string;
  // Adding Material specific fields
  greensPounds?: string;
  greensGallons?: string;
  brownsGallons?: string;
  redLine?: boolean;
  // Browns Bin specific fields
  brownsBinAGallons?: string;
  brownsBinBGallons?: string;
  binARedLine?: boolean;
  binBRedLine?: boolean;
  // Moving Bins specific fields
  moveBin1Bin2?: boolean;
  moveBin2Bin3?: boolean;
  moveBin3Bin4?: boolean;
  moveBin4SteelBins?: boolean;
  // Finished Compost specific fields
  gallonsTaken?: string;
}

interface IssueData {
  brokenTools?: boolean;
  holesInBin?: boolean;
  badOdors?: boolean;
  unwantedVectors?: boolean;
  other?: boolean;
  otherComment?: string;
}

interface LitterData {
  contamination?: boolean;
  bin1Contam?: boolean;
  bin2Contam?: boolean;
  bin3Contam?: boolean;
  bin4Contam?: boolean;
  plasticTrash?: boolean;
  foodStickers?: boolean;
  prohibitedOr?: boolean;
  otherTrash?: boolean;
  otherTrashText?: string;
  contaminationRemoved?: boolean | null;
}

export default function SubmitForm({ searchParams }: SubmitFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<Record<string, TaskData | TaskData[]>>({});
  const [issueData, setIssueData] = useState<IssueData>({});
  const [litterData, setLitterData] = useState<LitterData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<string>("");
  const [editingTaskIndex, setEditingTaskIndex] = useState<number>(-1);
  const [editFormData, setEditFormData] = useState<TaskData>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTaskType, setDeletingTaskType] = useState<string>("");
  const [deletingTaskIndex, setDeletingTaskIndex] = useState<number>(-1);

  const fetchSiteName = async (siteId: number) => {
    try {
      const supabase = createClient();
      const { data: siteData, error } = await supabase
        .from("Site")
        .select("site_name")
        .eq("site_id", siteId)
        .single();
      
      if (error) {
        console.error("Error fetching site name:", error);
        return `Site ${siteId}`;
      }
      
      return siteData?.site_name || `Site ${siteId}`;
    } catch (error) {
      console.error("Error fetching site name:", error);
      return `Site ${siteId}`;
    }
  };

  const handleEditTask = (taskType: string, taskIndex: number = -1) => {
    setEditingTaskType(taskType);
    setEditingTaskIndex(taskIndex);
    
    // Get the current task data
    const currentTaskData = taskData[taskType];
    if (Array.isArray(currentTaskData)) {
      setEditFormData(currentTaskData[taskIndex] || {});
    } else {
      setEditFormData(currentTaskData || {});
    }
    
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTaskType("");
    setEditingTaskIndex(-1);
    setEditFormData({});
  };

  const handleDeleteTask = (taskType: string, taskIndex: number = -1) => {
    setDeletingTaskType(taskType);
    setDeletingTaskIndex(taskIndex);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingTaskType("");
    setDeletingTaskIndex(-1);
  };

  const handleConfirmDelete = () => {
    if (!deletingTaskType) return;

    const updatedTaskData = { ...taskData };
    const currentTaskData = updatedTaskData[deletingTaskType];

    if (Array.isArray(currentTaskData)) {
      // Remove specific instance from array
      if (deletingTaskIndex >= 0 && deletingTaskIndex < currentTaskData.length) {
        currentTaskData.splice(deletingTaskIndex, 1);
        // If array becomes empty, remove the task type entirely
        if (currentTaskData.length === 0) {
          delete updatedTaskData[deletingTaskType];
        }
      }
    } else {
      // Remove single task
      delete updatedTaskData[deletingTaskType];
    }

    setTaskData(updatedTaskData);

    // Update localStorage
    if (formData) {
      if (Array.isArray(currentTaskData) && currentTaskData.length > 0) {
        localStorage.setItem(`task_${deletingTaskType}_${formData.submissionId}`, JSON.stringify(currentTaskData));
      } else {
        localStorage.removeItem(`task_${deletingTaskType}_${formData.submissionId}`);
      }
    }

    handleCloseDeleteModal();
  };

  const handleSaveEdit = () => {
    if (!editingTaskType) return;

    const updatedTaskData = { ...taskData };
    const currentTaskData = updatedTaskData[editingTaskType];

    if (Array.isArray(currentTaskData)) {
      // Update specific instance in array
      currentTaskData[editingTaskIndex] = editFormData;
    } else {
      // Update single task
      updatedTaskData[editingTaskType] = editFormData;
    }

    setTaskData(updatedTaskData);

    // Update localStorage
    if (formData) {
      localStorage.setItem(`task_${editingTaskType}_${formData.submissionId}`, JSON.stringify(updatedTaskData[editingTaskType]));
    }

    handleCloseEditModal();
  };

  useEffect(() => {
    const data = parseFormDataFromURL(searchParams);
    if (!data) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }
    setFormData(data);

    // Fetch site name
    fetchSiteName(data.site).then(name => setSiteName(name));

    // Load all task data from localStorage for this submission
    const taskTypes = ['add_material', 'measure_bin', 'move_bins', 'finished_compost'];
    const allTaskData: Record<string, TaskData | TaskData[]> = {};
    
    taskTypes.forEach(taskType => {
      const savedData = localStorage.getItem(`task_${taskType}_${data.submissionId}`);
      if (savedData) {
        try {
          const taskData = JSON.parse(savedData);
          
          // For moving bins, ensure it's always treated as an array for consistent display
          if (taskType === 'move_bins' && !Array.isArray(taskData)) {
            // Convert single moving bins task to array format
            allTaskData[taskType] = [taskData];
          } else {
            allTaskData[taskType] = taskData;
          }
        } catch (error) {
          console.error(`Error loading task data for ${taskType}:`, error);
        }
      }
    });
    
    setTaskData(allTaskData);

    // Load issue data from localStorage
    const savedIssueData = localStorage.getItem(`issue_corner_${data.submissionId}`);
    if (savedIssueData) {
      try {
        const issueData = JSON.parse(savedIssueData);
        setIssueData(issueData);
      } catch (error) {
        console.error("Error loading issue data:", error);
      }
    }

    // Load litter data from localStorage
    const savedLitterData = localStorage.getItem(`litter_${data.submissionId}`);
    if (savedLitterData) {
      try {
        const litterData = JSON.parse(savedLitterData);
        setLitterData(litterData);
      } catch (error) {
        console.error("Error loading litter data:", error);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) {
      setMessage("Error: Missing form data. Please start over.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();

      // Create the main form submission
      const { data: submissionData, error: submissionError } = await supabase
        .from("Form Submission")
        .insert({
          timestamp: new Date().toISOString(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          user_email: formData.email,
          site_id: formData.site
        })
        .select()
        .single();

      if (submissionError) {
        console.error("Error creating submission:", submissionError);
        setMessage("Error creating submission: " + submissionError.message);
        return;
      }

      const newSubmissionId = submissionData.submission_id;
      setSubmissionId(newSubmissionId);

             // Insert all task-specific data into appropriate tables
       console.log("Processing task data:", taskData);
       for (const [taskId, data] of Object.entries(taskData)) {
         if (data) {
           console.log(`Processing ${taskId}:`, data);
           // Handle both single tasks and arrays of tasks
           const tasksToProcess = Array.isArray(data) ? data : [data];
           
           for (const taskData of tasksToProcess) {
             let insertData: Record<string, unknown> = { submission_id: newSubmissionId };

                         switch (taskId) {
               case 'measure_bin':
                 // Insert into Measurements table
                 insertData = {
                   submission_id: newSubmissionId,
                   bin_type: taskData.binType || 'general',
                   temp_left: taskData.tempLeft || null,
                   temp_middle: taskData.tempMiddle || null,
                   temp_right: taskData.tempRight || null,
                   left_squeeze: taskData.leftSqueeze || null,
                   middle_squeeze: taskData.middleSqueeze || null,
                   right_squeeze: taskData.rightSqueeze || null,
                   left_corrective_actions: taskData.leftCorrectiveActions || null,
                   middle_corrective_actions: taskData.middleCorrectiveActions || null,
                   right_corrective_actions: taskData.rightCorrectiveActions || null,
                   mix: taskData.mix || null
                 };
                 console.log("Inserting measurement data:", insertData);
                 const { error: measureError } = await supabase.from("Measurements").insert(insertData);
                 if (measureError) {
                   console.error("Error inserting measurement data:", measureError);
                   throw new Error(`Failed to insert measurement data: ${measureError.message}`);
                 }
                 console.log("Measurement data inserted successfully");
                 break;

                                                           case 'add_material':
                 if (taskData.binType === 'browns') {
                   // Insert into Browns Bin table
                   insertData = {
                     submission_id: newSubmissionId,
                     bin_a_browns_gallons: taskData.brownsBinAGallons ? parseFloat(taskData.brownsBinAGallons) : 0,
                     bin_b_browns_gallons: taskData.brownsBinBGallons ? parseFloat(taskData.brownsBinBGallons) : 0,
                     bin_a_red_line: taskData.binARedLine || false,
                     bin_b_red_line: taskData.binBRedLine || false
                   };
                   console.log("Inserting browns bin data:", insertData);
                   const { error: brownsError } = await supabase.from("Browns Bin").insert(insertData);
                   if (brownsError) {
                     console.error("Error inserting browns bin data:", brownsError);
                     throw new Error(`Failed to insert browns bin data: ${brownsError.message}`);
                   }
                   console.log("Browns bin data inserted successfully");
                                   } else {
                    // Insert into Adding Material table for regular bins
                    // Convert bin type string to numeric value (Adding Material table expects numeric)
                    let binTypeNumber = 0; // default
                    if (taskData.binType === 'bin1') binTypeNumber = 1;
                    else if (taskData.binType === 'bin2') binTypeNumber = 2;
                    else if (taskData.binType === 'bin3') binTypeNumber = 3;
                    
                    insertData = {
                      submission_id: newSubmissionId,
                      bin_type: binTypeNumber,
                      greens_pounds: taskData.greensPounds ? parseFloat(taskData.greensPounds) : 0,
                      greens_gallons: taskData.greensGallons ? parseFloat(taskData.greensGallons) : 0,
                      browns_gallons: taskData.brownsGallons ? parseFloat(taskData.brownsGallons) : 0,
                      red_line: taskData.redLine || false
                    };
                    console.log("Inserting regular bin data:", insertData);
                    const { error: regularBinError } = await supabase.from("Adding Material").insert(insertData);
                    if (regularBinError) {
                      console.error("Error inserting regular bin data:", regularBinError);
                      throw new Error(`Failed to insert regular bin data: ${regularBinError.message}`);
                    }
                    console.log("Regular bin data inserted successfully");
                  }
                 break;

                                                           case 'move_bins':
                 // Insert into Moving Day table
                 insertData = {
                   submission_id: newSubmissionId,
                   move_bin1_bin2: taskData.moveBin1Bin2 || false,
                   move_bin2_bin3: taskData.moveBin2Bin3 || false,
                   move_bin3_bin4: taskData.moveBin3Bin4 || false,
                   move_bin4_steel_bins: taskData.moveBin4SteelBins || false
                 };
                 console.log("Inserting moving bins data:", insertData);
                 const { error: moveError } = await supabase.from("Moving Day").insert(insertData);
                 if (moveError) {
                   console.error("Error inserting moving bins data:", moveError);
                   throw new Error(`Failed to insert moving bins data: ${moveError.message}`);
                 }
                 console.log("Moving bins data inserted successfully");
                 break;

                                                           case 'finished_compost':
                 // Insert into Finished Compost table
                 insertData = {
                   submission_id: newSubmissionId,
                   gallons_compost_taken: taskData.gallonsTaken ? parseFloat(taskData.gallonsTaken) : 0
                 };
                 console.log("Inserting finished compost data:", insertData);
                 const { error: compostError } = await supabase.from("Finished Compost").insert(insertData);
                 if (compostError) {
                   console.error("Error inserting finished compost data:", compostError);
                   throw new Error(`Failed to insert finished compost data: ${compostError.message}`);
                 }
                 console.log("Finished compost data inserted successfully");
                 break;
            }
          }
        }
      }

             // Insert issue data if any issues were reported
       if (Object.values(issueData).some(value => value === true || (typeof value === 'string' && value.trim()))) {
         const issueInsertData = {
           submission_id: newSubmissionId,
           broken_tools: issueData.brokenTools || false,
           bin_holes: issueData.holesInBin || false,
           bad_odors: issueData.badOdors || false,
           fruit_flies_mice_other_vectors: issueData.unwantedVectors || false,
           other: issueData.otherComment || null
         };
         console.log("Inserting issue data:", issueInsertData);
         const { error: issueError } = await supabase.from("Issues").insert(issueInsertData);
         if (issueError) {
           console.error("Error inserting issue data:", issueError);
           throw new Error(`Failed to insert issue data: ${issueError.message}`);
         }
         console.log("Issue data inserted successfully");
       }

             // Insert litter data only if contamination was found
       if (litterData.contamination === true) {
         // Insert into the Litter table (not Issues table)
         const litterInsertData = {
           submission_id: newSubmissionId,
           bin_1_contaminated: litterData.bin1Contam || false,
           bin_2_contaminated: litterData.bin2Contam || false,
           bin_3_contaminated: litterData.bin3Contam || false,
           bin_4_contaminated: litterData.bin4Contam || false,
           plastic_trash: litterData.plasticTrash || false,
           food_stickers: litterData.foodStickers || false,
           prohibited_organics: litterData.prohibitedOr || false,
           other_trash: litterData.otherTrashText || null,
           contamination_removed: litterData.contaminationRemoved || false
         };
         console.log("Inserting litter data:", litterInsertData);
         const { error: litterError } = await supabase.from("Litter").insert(litterInsertData);
         if (litterError) {
           console.error("Error inserting litter data:", litterError);
           throw new Error(`Failed to insert litter data: ${litterError.message}`);
         }
         console.log("Litter data inserted successfully");
       }

      // Send alert emails if there are issues or contamination
      const hasIssues = Object.values(issueData).some(value => value === true || (typeof value === 'string' && value.trim()));
      const hasContamination = litterData.contamination === true;
      
      if (hasIssues || hasContamination) {
        // Get site name from the site ID
        const { data: siteData } = await supabase
          .from("Site")
          .select("site_name")
          .eq("site_id", formData.site)
          .single();
        
        const alertFormData = {
          siteName: siteData?.site_name || `Site ${formData.site}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          hasContamination,
          hasIssue: hasIssues,
          contaminationDetails: hasContamination ? "Contamination was reported in the compost bins" : "",
          issueDetails: hasIssues ? "Site issues were reported" : ""
        };
        
        await sendAlertEmails(alertFormData);
      }

      setMessage("Submission completed successfully!");
      
      // Clear localStorage data for this submission
      const taskTypes = ['add_material', 'measure_bin', 'move_bins', 'finished_compost'];
      taskTypes.forEach(taskType => {
        localStorage.removeItem(`task_${taskType}_${formData.submissionId}`);
      });
      localStorage.removeItem(`issue_corner_${formData.submissionId}`);
      localStorage.removeItem(`litter_${formData.submissionId}`);

             // Add a small delay to show the success state before navigating
       setTimeout(() => {
         router.push("/compost-form/thank-you");
       }, 1500);

    } catch (error) {
      console.error("Error during submission:", error);
      setMessage("Error during submission: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTaskName = (taskId: string) => {
    switch (taskId) {
      case 'add_material':
        return 'Add Material';
      case 'measure_bin':
        return 'Measure Bin';
      case 'move_bins':
        return 'Move Bins';
      case 'finished_compost':
        return 'Taking Compost';
      default:
        return taskId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatBinType = (binType: string) => {
    if (!binType) return 'Not specified';
    
    // Handle special cases
    if (binType === 'browns') return 'Browns Bins';
    if (binType === 'steel_bins') return 'Steel Bins';
    
    // Handle bin_1, bin_2, etc. -> Bin 1, Bin 2, etc.
    if (binType.startsWith('bin_')) {
      const number = binType.split('_')[1];
      return `Bin ${number}`;
    }
    
    // Handle bin1, bin2, etc. -> Bin 1, Bin 2, etc.
    if (binType.startsWith('bin') && binType.length === 4) {
      const number = binType.slice(3);
      return `Bin ${number}`;
    }
    
    // Default: capitalize and replace underscores
    return binType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderTaskData = (taskId: string, taskData: TaskData) => {
    switch (taskId) {
      case 'measure_bin':
        return (
          <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
            <p><strong>Bin Type:</strong> {formatBinType(taskData.binType || '')}</p>
            {taskData.tempLeft && <p><strong>Left Temp:</strong> {taskData.tempLeft}°F</p>}
            {taskData.tempMiddle && <p><strong>Middle Temp:</strong> {taskData.tempMiddle}°F</p>}
            {taskData.tempRight && <p><strong>Right Temp:</strong> {taskData.tempRight}°F</p>}
            {taskData.leftSqueeze && <p><strong>Left Squeeze:</strong> {taskData.leftSqueeze}</p>}
            {taskData.middleSqueeze && <p><strong>Middle Squeeze:</strong> {taskData.middleSqueeze}</p>}
            {taskData.rightSqueeze && <p><strong>Right Squeeze:</strong> {taskData.rightSqueeze}</p>}
            {taskData.leftCorrectiveActions && <p><strong>Left Corrective Actions:</strong> {taskData.leftCorrectiveActions}</p>}
            {taskData.middleCorrectiveActions && <p><strong>Middle Corrective Actions:</strong> {taskData.middleCorrectiveActions}</p>}
            {taskData.rightCorrectiveActions && <p><strong>Right Corrective Actions:</strong> {taskData.rightCorrectiveActions}</p>}
            {taskData.mix && <p><strong>Mix:</strong> {taskData.mix}</p>}
          </div>
        );

      case 'add_material':
        if (taskData.binType === 'browns') {
          return (
            <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
              <p><strong>Bin Type:</strong> Browns Bins</p>
              {taskData.brownsBinAGallons && <p><strong>Bin A Browns:</strong> {taskData.brownsBinAGallons} gallons</p>}
              {taskData.brownsBinBGallons && <p><strong>Bin B Browns:</strong> {taskData.brownsBinBGallons} gallons</p>}
              <p><strong>Bin A Red Line:</strong> {taskData.binARedLine ? "Yes" : "No"}</p>
              <p><strong>Bin B Red Line:</strong> {taskData.binBRedLine ? "Yes" : "No"}</p>
            </div>
          );
        } else {
          return (
            <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
              <p><strong>Bin Type:</strong> {formatBinType(taskData.binType || '')}</p>
              {taskData.greensPounds && <p><strong>Greens:</strong> {taskData.greensPounds} pounds</p>}
              {taskData.greensGallons && <p><strong>Greens:</strong> {taskData.greensGallons} gallons</p>}
              {taskData.brownsGallons && <p><strong>Browns:</strong> {taskData.brownsGallons} gallons</p>}
              <p><strong>Red Line:</strong> {taskData.redLine ? "Yes" : "No"}</p>
            </div>
          );
        }

      case 'move_bins':
        return (
          <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
            {taskData.moveBin1Bin2 && <p><strong>Moved:</strong> Bin 1 → Bin 2</p>}
            {taskData.moveBin2Bin3 && <p><strong>Moved:</strong> Bin 2 → Bin 3</p>}
            {taskData.moveBin3Bin4 && <p><strong>Moved:</strong> Bin 3 → Bin 4</p>}
            {taskData.moveBin4SteelBins && <p><strong>Moved:</strong> Bin 4 → Steel Bins</p>}
          </div>
        );

      case 'finished_compost':
        return (
          <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
            {taskData.gallonsTaken && <p><strong>Compost Taken:</strong> {taskData.gallonsTaken} gallons</p>}
          </div>
        );

      default:
        return (
          <div style={{ fontSize: "14px", color: "#000000" }}>
            <pre>{JSON.stringify(taskData, null, 2)}</pre>
          </div>
        );
    }
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
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
            Review & Submit Compost Records
          </h3>
          
          {/* Form summary */}
          <div style={{ marginBottom: "30px" }}>
            <h4
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "10px",
                fontFamily: "PT Sans, sans-serif",
                color: "#758A48",
              }}
            >
              Submission Summary
            </h4>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#E3F2FD",
                borderRadius: "16px",
                border: "1px solid #BBDEFB",
              }}
            >
              <p style={{ fontSize: "16px", fontFamily: "PT Sans, sans-serif", color: "#000000", marginBottom: "4px" }}>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </p>
              <p style={{ fontSize: "16px", fontFamily: "PT Sans, sans-serif", color: "#000000", marginBottom: "4px" }}>
                <strong>Email:</strong> {formData.email}
              </p>
              <p style={{ fontSize: "16px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                <strong>Site:</strong> {siteName || `Site ${formData.site}`}
              </p>
            </div>
          </div>

          {/* Task data preview */}
          {Object.keys(taskData).length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#899D5E",
                }}
              >
                Task Data
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(taskData).map(([taskId, data]) => (
                  <div
                    key={taskId}
                    style={{
                      padding: "16px",
                      backgroundColor: "#E8F5E8",
                      borderRadius: "16px",
                      border: "1px solid #C8E6C9",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          fontFamily: "PT Sans, sans-serif",
                          color: "#000000",
                          margin: 0,
                        }}
                      >
                        {formatTaskName(taskId)}
                      </p>
                    </div>
                    {Array.isArray(data) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {data.map((task, index) => (
                          <div
                            key={index}
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
                                Instance {index + 1}:
                              </p>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => handleEditTask(taskId, index)}
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
                                  onClick={() => handleDeleteTask(taskId, index)}
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
                            {renderTaskData(taskId, task)}
                          </div>
                        ))}
                      </div>
                    ) : (
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
                            Instance 1:
                          </p>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleEditTask(taskId)}
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
                              onClick={() => handleDeleteTask(taskId)}
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
                        {renderTaskData(taskId, data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Litter data preview */}
          {Object.keys(litterData).length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#899D5E",
                }}
              >
                Contamination Assessment
              </h4>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#FFF3E0",
                  borderRadius: "16px",
                  border: "1px solid #FFCC02",
                }}
              >
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                  }}
                >
                  {litterData.contamination ? "Contamination Found" : "No contamination reported"}
                </p>
                {litterData.contamination && (
                  <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
                    {/* Bins with contamination */}
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Bins with contamination:</strong>
                      <div style={{ marginLeft: "16px", marginTop: "4px" }}>
                        {litterData.bin1Contam && <p>• Bin 1</p>}
                        {litterData.bin2Contam && <p>• Bin 2</p>}
                        {litterData.bin3Contam && <p>• Bin 3</p>}
                        {litterData.bin4Contam && <p>• Bin 4</p>}
                      </div>
                    </div>
                    
                    {/* Contamination types */}
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Types of contamination:</strong>
                      <div style={{ marginLeft: "16px", marginTop: "4px" }}>
                        {litterData.plasticTrash && <p>• Plastic trash</p>}
                        {litterData.foodStickers && <p>• Food stickers</p>}
                        {litterData.prohibitedOr && <p>• Prohibited organics (meat, bones, dairy, etc.)</p>}
                        {litterData.otherTrash && <p>• Other: {litterData.otherTrashText}</p>}
                      </div>
                    </div>
                    
                    {/* Contamination removal */}
                    <div>
                      <strong>Contamination removed:</strong> {litterData.contaminationRemoved === true ? "Yes" : litterData.contaminationRemoved === false ? "No" : "Not specified"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issue data preview */}
          {Object.keys(issueData).length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <h4
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontFamily: "PT Sans, sans-serif",
                  color: "#899D5E",
                }}
              >
                Site Issues
              </h4>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#FFEBEE",
                  borderRadius: "16px",
                  border: "1px solid #FFCDD2",
                }}
              >
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontFamily: "PT Sans, sans-serif",
                    color: "#000000",
                  }}
                >
                  {issueData.brokenTools || issueData.holesInBin || issueData.badOdors || issueData.unwantedVectors || issueData.other 
                    ? "Issues Reported" 
                    : "No issues reported"}
                </p>
                {(issueData.brokenTools || issueData.holesInBin || issueData.badOdors || issueData.unwantedVectors || issueData.other) && (
                  <div style={{ fontSize: "14px", color: "#000000", lineHeight: "1.4" }}>
                    <div>
                      <strong>Issues observed:</strong>
                      <div style={{ marginLeft: "16px", marginTop: "4px" }}>
                        {issueData.brokenTools && <p>• Broken tools</p>}
                        {issueData.holesInBin && <p>• Holes in a bin</p>}
                        {issueData.badOdors && <p>• Bad odors</p>}
                        {issueData.unwantedVectors && <p>• Fruit flies, mice, or other unwanted vectors</p>}
                        {issueData.other && <p>• Other: {issueData.otherComment}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            style={{
              marginBottom: "20px",
              textAlign: "center",
              color: message.includes("Error") ? "#FB3939" : "#899D5E",
              fontFamily: "PT Sans, sans-serif",
              fontSize: "16px",
            }}
          >
            {message}
          </div>
        )}
      </form>

             {/* Submit button */}
       {!submissionId ? (
         <button
           onClick={handleSubmit}
           disabled={isSubmitting}
           style={{
             width: "100%",
             height: "57px",
             backgroundColor: "#FFFFFF",
             border: "2px solid #899D5E",
             borderRadius: "69px",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             gap: "16px",
             cursor: isSubmitting ? "not-allowed" : "pointer",
             opacity: isSubmitting ? 0.6 : 1,
             marginBottom: "20px",
           }}
         >
           <span
             style={{
               fontSize: "32px",
               fontFamily: "Lalezar, sans-serif",
               color: "#899D5E",
             }}
           >
             {isSubmitting ? "SUBMITTING..." : "SUBMIT ALL DATA"}
           </span>
           {!isSubmitting && (
             <FaArrowRight
               style={{
                 width: "30px",
                 height: "30px",
                 color: "#899D5E",
               }}
             />
           )}
           {isSubmitting && (
             <div
               style={{
                 width: "30px",
                 height: "30px",
                 border: "3px solid #899D5E",
                 borderTop: "3px solid transparent",
                 borderRadius: "50%",
                 animation: "spin 1s linear infinite",
               }}
             />
           )}
         </button>
       ) : (
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#E8F5E8",
            borderRadius: "16px",
            border: "1px solid #C8E6C9",
          }}
        >
          <p
            style={{
              color: "#899D5E",
              fontWeight: "bold",
              fontSize: "18px",
              fontFamily: "PT Sans, sans-serif",
              marginBottom: "4px",
            }}
          >
            ✓ Submission Complete!
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#666666",
              fontFamily: "PT Sans, sans-serif",
            }}
          >
            Submission ID: {submissionId}
          </p>
                 </div>
       )}

       {/* Edit Modal */}
       {showEditModal && (
         <div
           style={{
             position: "fixed",
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             backgroundColor: "rgba(0, 0, 0, 0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000,
           }}
         >
           <div
             style={{
               backgroundColor: "#FFFFFF",
               borderRadius: "16px",
               padding: "24px",
               maxWidth: "600px",
               width: "90%",
               maxHeight: "80vh",
               overflowY: "auto",
               border: "1px solid #E0E0E0",
               boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
             }}
           >
             <h3
               style={{
                 fontSize: "20px",
                 fontWeight: "bold",
                 marginBottom: "20px",
                 fontFamily: "PT Sans, sans-serif",
                 color: "#758A48",
               }}
             >
               Edit {formatTaskName(editingTaskType)}
             </h3>

             {editingTaskType === 'add_material' && (
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 {/* Bin Type */}
                 <div>
                   <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                     Bin Type:
                   </label>
                   <select
                     value={editFormData.binType || ''}
                     onChange={(e) => setEditFormData({ ...editFormData, binType: e.target.value })}
                     disabled={editFormData.binType === 'browns'}
                     style={{
                       width: "100%",
                       padding: "12px",
                       border: "2px solid #BBDEFB",
                       borderRadius: "8px",
                       fontFamily: "PT Sans, sans-serif",
                       fontSize: "14px",
                       backgroundColor: editFormData.binType === 'browns' ? "#F5F5F5" : "#FFFFFF",
                       color: editFormData.binType === 'browns' ? "#666666" : "#000000",
                       cursor: editFormData.binType === 'browns' ? "not-allowed" : "pointer",
                     }}
                   >
                     <option value="">Select bin type</option>
                     <option value="bin1" disabled={editFormData.binType === 'browns'}>Bin 1</option>
                     <option value="bin2" disabled={editFormData.binType === 'browns'}>Bin 2</option>
                     <option value="bin3" disabled={editFormData.binType === 'browns'}>Bin 3</option>
                     <option value="browns" disabled={!!(editFormData.binType && editFormData.binType !== 'browns' && editFormData.binType !== '')}>Browns Bins</option>
                   </select>
                   {editFormData.binType === 'browns' && (
                     <p style={{ 
                       fontSize: "12px", 
                       color: "#666666", 
                       fontStyle: "italic", 
                       marginTop: "4px",
                       fontFamily: "PT Sans, sans-serif"
                     }}>
                       Bin type cannot be changed for Browns Bins
                     </p>
                   )}
                   {editFormData.binType && editFormData.binType !== 'browns' && editFormData.binType !== '' && (
                     <p style={{ 
                       fontSize: "12px", 
                       color: "#666666", 
                       fontStyle: "italic", 
                       marginTop: "4px",
                       fontFamily: "PT Sans, sans-serif"
                     }}>
                       Cannot switch to Browns Bins from regular bins
                     </p>
                   )}
                 </div>

                 {editFormData.binType === 'browns' ? (
                   // Browns Bins specific fields
                   <>
                     <div>
                       <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                         Bin A Browns (gallons):
                       </label>
                       <input
                         type="number"
                         value={editFormData.brownsBinAGallons || ''}
                         onChange={(e) => setEditFormData({ ...editFormData, brownsBinAGallons: e.target.value })}
                         style={{
                           width: "100%",
                           padding: "12px",
                           border: "2px solid #BBDEFB",
                           borderRadius: "8px",
                           fontFamily: "PT Sans, sans-serif",
                           fontSize: "14px",
                           backgroundColor: "#FFFFFF",
                           color: "#000000",
                         }}
                         placeholder="Enter gallons"
                         min="0"
                         step="0.1"
                       />
                     </div>
                     <div>
                       <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                         Bin B Browns (gallons):
                       </label>
                       <input
                         type="number"
                         value={editFormData.brownsBinBGallons || ''}
                         onChange={(e) => setEditFormData({ ...editFormData, brownsBinBGallons: e.target.value })}
                         style={{
                           width: "100%",
                           padding: "12px",
                           border: "2px solid #BBDEFB",
                           borderRadius: "8px",
                           fontFamily: "PT Sans, sans-serif",
                           fontSize: "14px",
                           backgroundColor: "#FFFFFF",
                           color: "#000000",
                         }}
                         placeholder="Enter gallons"
                         min="0"
                         step="0.1"
                       />
                     </div>
                     <div>
                       <p
                         style={{
                           fontSize: "16px",
                           marginBottom: "10px",
                           fontFamily: "PT Sans, sans-serif",
                           color: "#000000",
                           fontWeight: "bold",
                         }}
                       >
                         Please indicate whether Bin A or Bin B is at the red, NO FILL LINE.
                       </p>
                       <div style={{ display: "flex", gap: "12px" }}>
                         <button
                           type="button"
                           onClick={() => setEditFormData({ ...editFormData, binARedLine: !editFormData.binARedLine })}
                           style={{
                             flex: 1,
                             height: "48px",
                             borderRadius: "24px",
                             backgroundColor: editFormData.binARedLine ? "#899D5E" : "#FFFFFF",
                             border: "2px solid #899D5E",
                             boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                             fontSize: "16px",
                             fontWeight: "bold",
                             fontFamily: "PT Sans, sans-serif",
                             color: editFormData.binARedLine ? "#FFFFFF" : "#899D5E",
                             cursor: "pointer",
                           }}
                         >
                           Bin A
                         </button>
                         <button
                           type="button"
                           onClick={() => setEditFormData({ ...editFormData, binBRedLine: !editFormData.binBRedLine })}
                           style={{
                             flex: 1,
                             height: "48px",
                             borderRadius: "24px",
                             backgroundColor: editFormData.binBRedLine ? "#899D5E" : "#FFFFFF",
                             border: "2px solid #899D5E",
                             boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                             fontSize: "16px",
                             fontWeight: "bold",
                             fontFamily: "PT Sans, sans-serif",
                             color: editFormData.binBRedLine ? "#FFFFFF" : "#899D5E",
                             cursor: "pointer",
                           }}
                         >
                           Bin B
                         </button>
                       </div>
                     </div>
                   </>
                 ) : (
                   // Regular bins specific fields
                   <>
                     <div>
                       <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                         Greens (pounds):
                       </label>
                       <input
                         type="number"
                         value={editFormData.greensPounds || ''}
                         onChange={(e) => setEditFormData({ ...editFormData, greensPounds: e.target.value })}
                         style={{
                           width: "100%",
                           padding: "12px",
                           border: "2px solid #BBDEFB",
                           borderRadius: "8px",
                           fontFamily: "PT Sans, sans-serif",
                           fontSize: "14px",
                           backgroundColor: "#FFFFFF",
                           color: "#000000",
                         }}
                         placeholder="Enter pounds"
                         min="0"
                         step="0.1"
                       />
                     </div>
                     <div>
                       <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                         Greens (gallons):
                       </label>
                       <input
                         type="number"
                         value={editFormData.greensGallons || ''}
                         onChange={(e) => setEditFormData({ ...editFormData, greensGallons: e.target.value })}
                         style={{
                           width: "100%",
                           padding: "12px",
                           border: "2px solid #BBDEFB",
                           borderRadius: "8px",
                           fontFamily: "PT Sans, sans-serif",
                           fontSize: "14px",
                           backgroundColor: "#FFFFFF",
                           color: "#000000",
                         }}
                         placeholder="Enter gallons"
                         min="0"
                         step="0.1"
                       />
                     </div>
                     <div>
                       <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                         Browns (gallons):
                       </label>
                       <input
                         type="number"
                         value={editFormData.brownsGallons || ''}
                         onChange={(e) => setEditFormData({ ...editFormData, brownsGallons: e.target.value })}
                         style={{
                           width: "100%",
                           padding: "12px",
                           border: "2px solid #BBDEFB",
                           borderRadius: "8px",
                           fontFamily: "PT Sans, sans-serif",
                           fontSize: "14px",
                           backgroundColor: "#FFFFFF",
                           color: "#000000",
                         }}
                         placeholder="Enter gallons"
                         min="0"
                         step="0.1"
                       />
                     </div>
                     <div>
                       <p
                         style={{
                           fontSize: "16px",
                           marginBottom: "10px",
                           fontFamily: "PT Sans, sans-serif",
                           color: "#000000",
                           fontWeight: "bold",
                         }}
                       >
                         Is this pile at the red, NO FILL LINE?
                       </p>
                       <div style={{ display: "flex", gap: "12px" }}>
                         <button
                           type="button"
                           onClick={() => setEditFormData({ ...editFormData, redLine: true })}
                           style={{
                             flex: 1,
                             height: "48px",
                             borderRadius: "24px",
                             backgroundColor: editFormData.redLine ? "#899D5E" : "#FFFFFF",
                             border: "2px solid #899D5E",
                             boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                             fontSize: "16px",
                             fontWeight: "bold",
                             fontFamily: "PT Sans, sans-serif",
                             color: editFormData.redLine ? "#FFFFFF" : "#899D5E",
                             cursor: "pointer",
                           }}
                         >
                           Yes
                         </button>
                         <button
                           type="button"
                           onClick={() => setEditFormData({ ...editFormData, redLine: false })}
                           style={{
                             flex: 1,
                             height: "48px",
                             borderRadius: "24px",
                             backgroundColor: !editFormData.redLine ? "#899D5E" : "#FFFFFF",
                             border: "2px solid #899D5E",
                             boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                             fontSize: "16px",
                             fontWeight: "bold",
                             fontFamily: "PT Sans, sans-serif",
                             color: !editFormData.redLine ? "#FFFFFF" : "#899D5E",
                             cursor: "pointer",
                           }}
                         >
                           No
                         </button>
                       </div>
                     </div>
                   </>
                 )}
               </div>
             )}

             {editingTaskType === 'measure_bin' && (
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 {/* Bin Type */}
                 <div>
                   <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                     Bin Type:
                   </label>
                   <select
                     value={editFormData.binType || ''}
                     onChange={(e) => setEditFormData({ ...editFormData, binType: e.target.value })}
                     disabled={editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins'}
                     style={{
                       width: "100%",
                       padding: "12px",
                       border: "2px solid #BBDEFB",
                       borderRadius: "8px",
                       fontFamily: "PT Sans, sans-serif",
                       fontSize: "14px",
                       backgroundColor: (editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins') ? "#F5F5F5" : "#FFFFFF",
                       color: (editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins') ? "#666666" : "#000000",
                       cursor: (editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins') ? "not-allowed" : "pointer",
                     }}
                   >
                     <option value="">Select bin type</option>
                     <option value="bin_1" disabled={editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins'}>Bin 1</option>
                     <option value="bin_2" disabled={editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins'}>Bin 2</option>
                     <option value="bin_3" disabled={editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins'}>Bin 3</option>
                     <option value="bin_4" disabled={!!(editFormData.binType && editFormData.binType !== 'bin_4' && editFormData.binType !== '')}>Bin 4 (Curing Pile)</option>
                     <option value="steel_bins" disabled={!!(editFormData.binType && editFormData.binType !== 'steel_bins' && editFormData.binType !== '')}>Steel Bins</option>
                   </select>
                   {(editFormData.binType === 'bin_4' || editFormData.binType === 'steel_bins') && (
                     <p style={{ 
                       fontSize: "12px", 
                       color: "#666666", 
                       fontStyle: "italic", 
                       marginTop: "4px",
                       fontFamily: "PT Sans, sans-serif"
                     }}>
                       Bin type cannot be changed for {editFormData.binType === 'bin_4' ? 'Bin 4' : 'Steel Bins'}
                     </p>
                   )}
                   {editFormData.binType && editFormData.binType !== 'bin_4' && editFormData.binType !== 'steel_bins' && editFormData.binType !== '' && (
                     <p style={{ 
                       fontSize: "12px", 
                       color: "#666666", 
                       fontStyle: "italic", 
                       marginTop: "4px",
                       fontFamily: "PT Sans, sans-serif"
                     }}>
                       Cannot switch to Bin 4 or Steel Bins from regular bins
                     </p>
                   )}
                 </div>

                 {/* Temperature Measurements - Only for bins 1, 2, 3, and 4 */}
                 {editFormData.binType && (editFormData.binType === "bin_1" || editFormData.binType === "bin_2" || editFormData.binType === "bin_3" || editFormData.binType === "bin_4") && (
                   <div>
                     <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                       Temperature Measurements (°F):
                     </label>
                     
                     {editFormData.binType === "bin_4" ? (
                       // Bin 4 only has middle temperature
                       <div>
                         <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                           Middle Temperature:
                         </label>
                         <input
                           type="number"
                           value={editFormData.tempMiddle || ''}
                           onChange={(e) => setEditFormData({ ...editFormData, tempMiddle: e.target.value })}
                           style={{
                             width: "100%",
                             padding: "12px",
                             border: "2px solid #BBDEFB",
                             borderRadius: "8px",
                             fontFamily: "PT Sans, sans-serif",
                             fontSize: "14px",
                             backgroundColor: "#FFFFFF",
                             color: "#000000",
                           }}
                           placeholder="Enter temperature"
                         />
                       </div>
                     ) : (
                       // Bins 1, 2, 3 have left, middle, right temperatures
                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Left:
                           </label>
                           <input
                             type="number"
                             value={editFormData.tempLeft || ''}
                             onChange={(e) => setEditFormData({ ...editFormData, tempLeft: e.target.value })}
                             style={{
                               width: "100%",
                               padding: "12px",
                               border: "2px solid #BBDEFB",
                               borderRadius: "8px",
                               fontFamily: "PT Sans, sans-serif",
                               fontSize: "14px",
                               backgroundColor: "#FFFFFF",
                               color: "#000000",
                             }}
                             placeholder="°F"
                           />
                         </div>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Middle:
                           </label>
                           <input
                             type="number"
                             value={editFormData.tempMiddle || ''}
                             onChange={(e) => setEditFormData({ ...editFormData, tempMiddle: e.target.value })}
                             style={{
                               width: "100%",
                               padding: "12px",
                               border: "2px solid #BBDEFB",
                               borderRadius: "8px",
                               fontFamily: "PT Sans, sans-serif",
                               fontSize: "14px",
                               backgroundColor: "#FFFFFF",
                               color: "#000000",
                             }}
                             placeholder="°F"
                           />
                         </div>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Right:
                           </label>
                           <input
                             type="number"
                             value={editFormData.tempRight || ''}
                             onChange={(e) => setEditFormData({ ...editFormData, tempRight: e.target.value })}
                             style={{
                               width: "100%",
                               padding: "12px",
                               border: "2px solid #BBDEFB",
                               borderRadius: "8px",
                               fontFamily: "PT Sans, sans-serif",
                               fontSize: "14px",
                               backgroundColor: "#FFFFFF",
                               color: "#000000",
                             }}
                             placeholder="°F"
                           />
                         </div>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Squeeze Test - For all bin types */}
                 {editFormData.binType && (
                   <div>
                     <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                       Squeeze Test Results:
                     </label>
                     
                     {editFormData.binType === "bin_4" || editFormData.binType === "steel_bins" ? (
                       // Bin 4 and Steel Bins only have middle squeeze test
                       <div>
                         <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                           Middle Squeeze Test:
                         </label>
                         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                           {["Good", "Too Wet", "Too Dry"].map(option => (
                             <button
                               key={option}
                               type="button"
                               onClick={() => {
                                 const newValue = editFormData.middleSqueeze === option ? "" : option;
                                 setEditFormData(prev => ({
                                   ...prev,
                                   middleSqueeze: newValue,
                                   // Clear corrective actions if changing to "Good"
                                   middleCorrectiveActions: newValue === "Good" ? "" : prev.middleCorrectiveActions
                                 }));
                               }}
                               style={{
                                 width: "100%",
                                 height: "40px",
                                 borderRadius: "20px",
                                 backgroundColor: editFormData.middleSqueeze === option ? "#899D5E" : "#FFFFFF",
                                 border: "2px solid #899D5E",
                                 fontSize: "14px",
                                 fontWeight: "bold",
                                 fontFamily: "PT Sans, sans-serif",
                                 color: editFormData.middleSqueeze === option ? "#FFFFFF" : "#899D5E",
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
                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Left:
                           </label>
                           <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                             {["Good", "Too Wet", "Too Dry"].map(option => (
                               <button
                                 key={option}
                                 type="button"
                                 onClick={() => {
                                   const newValue = editFormData.leftSqueeze === option ? "" : option;
                                   setEditFormData(prev => ({
                                     ...prev,
                                     leftSqueeze: newValue,
                                     // Clear corrective actions if changing to "Good"
                                     leftCorrectiveActions: newValue === "Good" ? "" : prev.leftCorrectiveActions
                                   }));
                                 }}
                                 style={{
                                   width: "100%",
                                   height: "32px",
                                   borderRadius: "16px",
                                   backgroundColor: editFormData.leftSqueeze === option ? "#899D5E" : "#FFFFFF",
                                   border: "2px solid #899D5E",
                                   fontSize: "12px",
                                   fontWeight: "bold",
                                   fontFamily: "PT Sans, sans-serif",
                                   color: editFormData.leftSqueeze === option ? "#FFFFFF" : "#899D5E",
                                   cursor: "pointer",
                                 }}
                               >
                                 {option}
                               </button>
                             ))}
                           </div>
                         </div>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Middle:
                           </label>
                           <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                             {["Good", "Too Wet", "Too Dry"].map(option => (
                               <button
                                 key={option}
                                 type="button"
                                 onClick={() => {
                                   const newValue = editFormData.middleSqueeze === option ? "" : option;
                                   setEditFormData(prev => ({
                                     ...prev,
                                     middleSqueeze: newValue,
                                     // Clear corrective actions if changing to "Good"
                                     middleCorrectiveActions: newValue === "Good" ? "" : prev.middleCorrectiveActions
                                   }));
                                 }}
                                 style={{
                                   width: "100%",
                                   height: "32px",
                                   borderRadius: "16px",
                                   backgroundColor: editFormData.middleSqueeze === option ? "#899D5E" : "#FFFFFF",
                                   border: "2px solid #899D5E",
                                   fontSize: "12px",
                                   fontWeight: "bold",
                                   fontFamily: "PT Sans, sans-serif",
                                   color: editFormData.middleSqueeze === option ? "#FFFFFF" : "#899D5E",
                                   cursor: "pointer",
                                 }}
                               >
                                 {option}
                               </button>
                             ))}
                           </div>
                         </div>
                         <div>
                           <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                             Right:
                           </label>
                           <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                             {["Good", "Too Wet", "Too Dry"].map(option => (
                               <button
                                 key={option}
                                 type="button"
                                 onClick={() => {
                                   const newValue = editFormData.rightSqueeze === option ? "" : option;
                                   setEditFormData(prev => ({
                                     ...prev,
                                     rightSqueeze: newValue,
                                     // Clear corrective actions if changing to "Good"
                                     rightCorrectiveActions: newValue === "Good" ? "" : prev.rightCorrectiveActions
                                   }));
                                 }}
                                 style={{
                                   width: "100%",
                                   height: "32px",
                                   borderRadius: "16px",
                                   backgroundColor: editFormData.rightSqueeze === option ? "#899D5E" : "#FFFFFF",
                                   border: "2px solid #899D5E",
                                   fontSize: "12px",
                                   fontWeight: "bold",
                                   fontFamily: "PT Sans, sans-serif",
                                   color: editFormData.rightSqueeze === option ? "#FFFFFF" : "#899D5E",
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
                 {editFormData.binType && (
                   <div>
                     {/* Check if any squeeze test needs corrective actions */}
                     {((editFormData.binType === "bin_4" || editFormData.binType === "steel_bins") && 
                       (editFormData.middleSqueeze === "Too Wet" || editFormData.middleSqueeze === "Too Dry")) ||
                      ((editFormData.binType === "bin_1" || editFormData.binType === "bin_2" || editFormData.binType === "bin_3") &&
                       (editFormData.leftSqueeze === "Too Wet" || editFormData.leftSqueeze === "Too Dry" ||
                        editFormData.middleSqueeze === "Too Wet" || editFormData.middleSqueeze === "Too Dry" ||
                        editFormData.rightSqueeze === "Too Wet" || editFormData.rightSqueeze === "Too Dry")) ? (
                       <div>
                         <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                           Corrective Actions Taken:
                         </label>
                         
                         {editFormData.binType === "bin_4" || editFormData.binType === "steel_bins" ? (
                           // Bin 4 and Steel Bins - only middle corrective actions
                           editFormData.middleSqueeze === "Too Wet" || editFormData.middleSqueeze === "Too Dry" ? (
                             <div>
                               <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                                 Middle Corrective Actions ({editFormData.middleSqueeze}):
                               </label>
                               <textarea
                                 value={editFormData.middleCorrectiveActions || ''}
                                 onChange={(e) => setEditFormData({ ...editFormData, middleCorrectiveActions: e.target.value })}
                                 style={{
                                   width: "100%",
                                   minHeight: "60px",
                                   padding: "12px",
                                   border: "2px solid #BBDEFB",
                                   borderRadius: "8px",
                                   fontFamily: "PT Sans, sans-serif",
                                   fontSize: "14px",
                                   backgroundColor: "#FFFFFF",
                                   color: "#000000",
                                   resize: "vertical"
                                 }}
                                 placeholder={`Describe what you did to address the ${editFormData.middleSqueeze?.toLowerCase()} condition...`}
                               />
                             </div>
                           ) : null
                         ) : (
                           // Bins 1, 2, 3 - left, middle, right corrective actions
                           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                             {editFormData.leftSqueeze === "Too Wet" || editFormData.leftSqueeze === "Too Dry" ? (
                               <div>
                                 <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                                   Left Corrective Actions ({editFormData.leftSqueeze}):
                                 </label>
                                 <textarea
                                   value={editFormData.leftCorrectiveActions || ''}
                                   onChange={(e) => setEditFormData({ ...editFormData, leftCorrectiveActions: e.target.value })}
                                   style={{
                                     width: "100%",
                                     minHeight: "60px",
                                     padding: "12px",
                                     border: "2px solid #BBDEFB",
                                     borderRadius: "8px",
                                     fontFamily: "PT Sans, sans-serif",
                                     fontSize: "14px",
                                     backgroundColor: "#FFFFFF",
                                     color: "#000000",
                                     resize: "vertical"
                                   }}
                                   placeholder={`Describe what you did to address the ${editFormData.leftSqueeze?.toLowerCase()} condition...`}
                                 />
                               </div>
                             ) : null}
                             
                             {editFormData.middleSqueeze === "Too Wet" || editFormData.middleSqueeze === "Too Dry" ? (
                               <div>
                                 <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                                   Middle Corrective Actions ({editFormData.middleSqueeze}):
                                 </label>
                                 <textarea
                                   value={editFormData.middleCorrectiveActions || ''}
                                   onChange={(e) => setEditFormData({ ...editFormData, middleCorrectiveActions: e.target.value })}
                                   style={{
                                     width: "100%",
                                     minHeight: "60px",
                                     padding: "12px",
                                     border: "2px solid #BBDEFB",
                                     borderRadius: "8px",
                                     fontFamily: "PT Sans, sans-serif",
                                     fontSize: "14px",
                                     backgroundColor: "#FFFFFF",
                                     color: "#000000",
                                     resize: "vertical"
                                   }}
                                   placeholder={`Describe what you did to address the ${editFormData.middleSqueeze?.toLowerCase()} condition...`}
                                 />
                               </div>
                             ) : null}
                             
                             {editFormData.rightSqueeze === "Too Wet" || editFormData.rightSqueeze === "Too Dry" ? (
                               <div>
                                 <label style={{ display: "block", marginBottom: "4px", fontFamily: "PT Sans, sans-serif", color: "#000000" }}>
                                   Right Corrective Actions ({editFormData.rightSqueeze}):
                                 </label>
                                 <textarea
                                   value={editFormData.rightCorrectiveActions || ''}
                                   onChange={(e) => setEditFormData({ ...editFormData, rightCorrectiveActions: e.target.value })}
                                   style={{
                                     width: "100%",
                                     minHeight: "60px",
                                     padding: "12px",
                                     border: "2px solid #BBDEFB",
                                     borderRadius: "8px",
                                     fontFamily: "PT Sans, sans-serif",
                                     fontSize: "14px",
                                     backgroundColor: "#FFFFFF",
                                     color: "#000000",
                                     resize: "vertical"
                                   }}
                                   placeholder={`Describe what you did to address the ${editFormData.rightSqueeze?.toLowerCase()} condition...`}
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
                 {editFormData.binType && (
                   <div>
                     <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                       Did you mix the material?
                     </label>
                     <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                       {["Mixed while adding", "Mixed within bin", "No mixing"].map(option => (
                         <button
                           key={option}
                           type="button"
                           onClick={() => setEditFormData({ ...editFormData, mix: editFormData.mix === option ? "" : option })}
                           style={{
                             width: "100%",
                             height: "40px",
                             borderRadius: "20px",
                             backgroundColor: editFormData.mix === option ? "#899D5E" : "#FFFFFF",
                             border: "2px solid #899D5E",
                             fontSize: "14px",
                             fontWeight: "bold",
                             fontFamily: "PT Sans, sans-serif",
                             color: editFormData.mix === option ? "#FFFFFF" : "#899D5E",
                             cursor: "pointer",
                           }}
                         >
                           {option}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}

             {editingTaskType === 'move_bins' && (
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 <div>
                   <p
                     style={{
                       fontSize: "16px",
                       marginBottom: "10px",
                       fontFamily: "PT Sans, sans-serif",
                       color: "#000000",
                       fontWeight: "bold",
                     }}
                   >
                     Select which bins were moved:
                   </p>
                   <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                     <button
                       type="button"
                       onClick={() => setEditFormData({ ...editFormData, moveBin1Bin2: !editFormData.moveBin1Bin2 })}
                       style={{
                         width: "100%",
                         height: "48px",
                         borderRadius: "24px",
                         backgroundColor: editFormData.moveBin1Bin2 ? "#899D5E" : "#FFFFFF",
                         border: "2px solid #899D5E",
                         boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                         fontSize: "16px",
                         fontWeight: "bold",
                         fontFamily: "PT Sans, sans-serif",
                         color: editFormData.moveBin1Bin2 ? "#FFFFFF" : "#899D5E",
                         cursor: "pointer",
                       }}
                     >
                       Move Bin 1 to Bin 2
                     </button>
                     <button
                       type="button"
                       onClick={() => setEditFormData({ ...editFormData, moveBin2Bin3: !editFormData.moveBin2Bin3 })}
                       style={{
                         width: "100%",
                         height: "48px",
                         borderRadius: "24px",
                         backgroundColor: editFormData.moveBin2Bin3 ? "#899D5E" : "#FFFFFF",
                         border: "2px solid #899D5E",
                         boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                         fontSize: "16px",
                         fontWeight: "bold",
                         fontFamily: "PT Sans, sans-serif",
                         color: editFormData.moveBin2Bin3 ? "#FFFFFF" : "#899D5E",
                         cursor: "pointer",
                       }}
                     >
                       Move Bin 2 to Bin 3
                     </button>
                     <button
                       type="button"
                       onClick={() => setEditFormData({ ...editFormData, moveBin3Bin4: !editFormData.moveBin3Bin4 })}
                       style={{
                         width: "100%",
                         height: "48px",
                         borderRadius: "24px",
                         backgroundColor: editFormData.moveBin3Bin4 ? "#899D5E" : "#FFFFFF",
                         border: "2px solid #899D5E",
                         boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                         fontSize: "16px",
                         fontWeight: "bold",
                         fontFamily: "PT Sans, sans-serif",
                         color: editFormData.moveBin3Bin4 ? "#FFFFFF" : "#899D5E",
                         cursor: "pointer",
                       }}
                     >
                       Move Bin 3 to Bin 4
                     </button>
                     <button
                       type="button"
                       onClick={() => setEditFormData({ ...editFormData, moveBin4SteelBins: !editFormData.moveBin4SteelBins })}
                       style={{
                         width: "100%",
                         height: "48px",
                         borderRadius: "24px",
                         backgroundColor: editFormData.moveBin4SteelBins ? "#899D5E" : "#FFFFFF",
                         border: "2px solid #899D5E",
                         boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                         fontSize: "16px",
                         fontWeight: "bold",
                         fontFamily: "PT Sans, sans-serif",
                         color: editFormData.moveBin4SteelBins ? "#FFFFFF" : "#899D5E",
                         cursor: "pointer",
                       }}
                     >
                       Move Bin 4 to Steel Bins
                     </button>
                   </div>
                 </div>
               </div>
             )}

             {editingTaskType === 'finished_compost' && (
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 <div>
                   <label style={{ display: "block", marginBottom: "8px", fontFamily: "PT Sans, sans-serif", fontWeight: "bold", color: "#000000" }}>
                     Gallons of Finished Compost Taken:
                   </label>
                   <input
                     type="number"
                     value={editFormData.gallonsTaken || ''}
                     onChange={(e) => setEditFormData({ ...editFormData, gallonsTaken: e.target.value })}
                     style={{
                       width: "100%",
                       padding: "12px",
                       border: "2px solid #BBDEFB",
                       borderRadius: "8px",
                       fontFamily: "PT Sans, sans-serif",
                       fontSize: "14px",
                       backgroundColor: "#FFFFFF",
                       color: "#000000",
                     }}
                     placeholder="Enter gallons taken"
                     min="0"
                     step="0.1"
                   />
                   {editFormData.gallonsTaken && (
                     <div style={{ 
                       marginTop: "8px", 
                       padding: "8px", 
                       backgroundColor: "#E8F5E8", 
                       borderRadius: "8px",
                       border: "1px solid #C8E6C9"
                     }}>
                       <p style={{ 
                         fontSize: "12px", 
                         color: "#666666", 
                         fontFamily: "PT Sans, sans-serif",
                         margin: 0
                       }}>
                        <strong>Volume:</strong> {parseFloat(editFormData.gallonsTaken)} gallons
                        <br />
                        <em>(Finished compost reported in gallons only)</em>
                       </p>
                     </div>
                   )}
                 </div>
               </div>
             )}

             <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
               <button
                 type="button"
                 onClick={handleCloseEditModal}
                 style={{
                   padding: "12px 24px",
                   backgroundColor: "#F5F5F5",
                   color: "#666666",
                   border: "2px solid #E0E0E0",
                   borderRadius: "8px",
                   cursor: "pointer",
                   fontFamily: "PT Sans, sans-serif",
                   fontSize: "14px",
                   fontWeight: "bold",
                   transition: "all 0.2s ease",
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = "#E0E0E0";
                   e.currentTarget.style.borderColor = "#CCCCCC";
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = "#F5F5F5";
                   e.currentTarget.style.borderColor = "#E0E0E0";
                 }}
               >
                 Cancel
               </button>
               <button
                 type="button"
                 onClick={handleSaveEdit}
                 style={{
                   padding: "12px 24px",
                   backgroundColor: "#899D5E",
                   color: "#FFFFFF",
                   border: "2px solid #899D5E",
                   borderRadius: "8px",
                   cursor: "pointer",
                   fontFamily: "PT Sans, sans-serif",
                   fontSize: "14px",
                   fontWeight: "bold",
                   transition: "all 0.2s ease",
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = "#758A48";
                   e.currentTarget.style.borderColor = "#758A48";
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = "#899D5E";
                   e.currentTarget.style.borderColor = "#899D5E";
                 }}
               >
                 Save Changes
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteModal && (
         <div
           style={{
             position: "fixed",
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             backgroundColor: "rgba(0, 0, 0, 0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000,
           }}
         >
           <div
             style={{
               backgroundColor: "#FFFFFF",
               borderRadius: "16px",
               padding: "24px",
               maxWidth: "400px",
               width: "90%",
               border: "1px solid #E0E0E0",
               boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
             }}
           >
             <h3
               style={{
                 fontSize: "20px",
                 fontWeight: "bold",
                 marginBottom: "16px",
                 fontFamily: "PT Sans, sans-serif",
                 color: "#FF4444",
               }}
             >
               Delete Instance
             </h3>
             
             <p
               style={{
                 fontSize: "16px",
                 marginBottom: "24px",
                 fontFamily: "PT Sans, sans-serif",
                 color: "#000000",
                 lineHeight: "1.4",
               }}
             >
               Are you sure you want to delete this {formatTaskName(deletingTaskType)} instance? This action cannot be undone.
             </p>

             <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
               <button
                 type="button"
                 onClick={handleCloseDeleteModal}
                 style={{
                   padding: "12px 24px",
                   backgroundColor: "#F5F5F5",
                   color: "#666666",
                   border: "2px solid #E0E0E0",
                   borderRadius: "8px",
                   cursor: "pointer",
                   fontFamily: "PT Sans, sans-serif",
                   fontSize: "14px",
                   fontWeight: "bold",
                   transition: "all 0.2s ease",
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = "#E0E0E0";
                   e.currentTarget.style.borderColor = "#CCCCCC";
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = "#F5F5F5";
                   e.currentTarget.style.borderColor = "#E0E0E0";
                 }}
               >
                 Cancel
               </button>
               <button
                 type="button"
                 onClick={handleConfirmDelete}
                 style={{
                   padding: "12px 24px",
                   backgroundColor: "#FF4444",
                   color: "#FFFFFF",
                   border: "2px solid #FF4444",
                   borderRadius: "8px",
                   cursor: "pointer",
                   fontFamily: "PT Sans, sans-serif",
                   fontSize: "14px",
                   fontWeight: "bold",
                   transition: "all 0.2s ease",
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.backgroundColor = "#E03333";
                   e.currentTarget.style.borderColor = "#E03333";
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.backgroundColor = "#FF4444";
                   e.currentTarget.style.borderColor = "#FF4444";
                 }}
               >
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
