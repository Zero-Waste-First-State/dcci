"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

import BackButton from "@/components/ui/dcci/forms/back-button";
import FormHeading from "@/components/ui/dcci/forms/form-heading";
import TaskSelection from "@/components/task-selection";

function TaskSelectionContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");

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
        <BackButton />
        <FormHeading subHeading="Error" isError={!siteId} />
        {/*<p
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
        </p>*/}
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

      <BackButton />
      <FormHeading subHeading="Task Selection" />

      <div style={{ marginTop: "150px", width: "100%"}}>
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
