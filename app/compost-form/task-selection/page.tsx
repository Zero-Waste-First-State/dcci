"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { Suspense } from "react";
import TaskSelection from "@/components/task-selection";

function TaskSelectionContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");

  const handleBack = () => {
    window.history.back();
  };

  const cardStyles = {
    width: "428px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "PT Sans, sans-serif",
  };

  // If no site selected
  if (!siteId) {
    return (
      <motion.main
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative bg-earthyTan rounded-[21px] border-4 border-earthyBrown"
        style={cardStyles}
      >
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="absolute flex items-center justify-center w-[78px] h-[78px] rounded-full bg-earthyBlue opacity-80 top-[35px] left-[16px]"
        >
          <FaArrowLeft className="text-white w-[49px] h-[49px]" />
        </button>

        <h1
          style={{
            position: "absolute",
            top: "25px",
            left: "117px",
            fontSize: "48px",
            fontFamily: "Lalezar, sans-serif",
            color: "#76583F", // earthyBrown
          }}
        >
          Compost Log:
        </h1>

        <h2
          style={{
            position: "absolute",
            top: "72px",
            left: "117px",
            fontSize: "36px",
            fontFamily: "Lalezar, sans-serif",
            color: "#758A48", // earthyGreen
          }}
        >
          Error
        </h2>

        <p
          style={{
            position: "absolute",
            top: "151px",
            left: "26px",
            fontSize: "24px",
            color: "#8F8F8F",
            textAlign: "center",
            width: "396px",
          }}
        >
          No site selected. Please go back and select a site.
        </p>
      </motion.main>
    );
  }

  // Task selection page if site selected
  return (
    <motion.main
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative bg-earthyTan rounded-[21px] border-4 border-earthyBrown"
      style={cardStyles}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="absolute flex items-center justify-center w-[78px] h-[78px] rounded-full bg-earthyBlue opacity-80 top-[35px] left-[16px]"
      >
        <FaArrowLeft className="text-white w-[49px] h-[49px]" />
      </button>

      <h1
        style={{
          position: "absolute",
          top: "25px",
          left: "117px",
          fontSize: "48px",
          fontFamily: "Lalezar, sans-serif",
          color: "#76583F", // earthyBrown
        }}
      >
        Compost Log:
      </h1>

      <h2
        style={{
          position: "absolute",
          top: "72px",
          left: "117px",
          fontSize: "36px",
          fontFamily: "Lalezar, sans-serif",
          color: "#758A48", // earthyGreen
        }}
      >
        Task Selection
      </h2>

      <div 
        style={{
          marginTop: "150px",
          width: "100%",
        }}
      >
        <TaskSelection siteId={Number(siteId)} />
      </div>
    </motion.main>
  );
}

export default function TaskSelectionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskSelectionContent />
    </Suspense>
  );
}
