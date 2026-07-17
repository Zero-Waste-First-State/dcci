'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseFormDataFromURL, type FormData } from '@/lib/utils';
import { NextButton } from '@/components/ui/dcci/forms/next-button';

import styles from './sift-compost.module.css';

interface SiftCompostProps {
    searchParams: URLSearchParams;
}

type Option = 'yes' | 'no';

interface TaskData {
  allSifted: string;
}

export default function SiftCompostOption({searchParams}: SiftCompostProps) {
  const router = useRouter();
  const localstorageKey = 'sift_compost';
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Option>('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [taskData, setTaskData] = useState<TaskData>('');

  // parse form data from url, on mount
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
      console.log("Starting new instance of Sifting Compost task");
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


  const handleInputChange = (field: keyof TaskData, value: string | boolean) => {
    setSelected(value);

    setTaskData(existingState => ({
      ...existingState,
      [field]: value
    }));

    setMessage('');
  };


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

  const isFormValid = () => {
    return ['yes', 'no'].includes(taskData.allSifted);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <h3 className="text-2xl font-bold mb-5 text-earthyGreen">
        Is All Finished Compost Sifted?
      </h3>

      <div className={styles.container}>
        {[
          {field: "allSifted", value: "yes", label: "Yes 👍🏼"},
          {field: "allSifted", value: "no", label: "No, There's more to sift"}
        ].map(option => (
          <label className={styles.buttonLabel} key={`key-${option.value}`}>
            <input type="radio" name={option.field}
              className={styles.hiddenRadio}
              value={option.value}
              checked={selected === option.value}
              onChange={() => handleInputChange(option.field, option.value)}
            />
            <div className={styles.buttonVisual}>
              {option.label}
            </div>
          </label>
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
