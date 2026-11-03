'use client';

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

import BackButton from "@/components/ui/dcci/forms/back-button";
import FormHeading from "@/components/ui/dcci/forms/form-heading";
import AdditionalTasks from "@/components/additional-tasks";
//export const dynamic = 'force-dynamic';

function AdditionalTasksContent() {
  const searchParams = useSearchParams();

  return (
    <motion.main
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative"
      style={{
        width: "428px",
        height: "1132px",
        margin: "0 auto",
        backgroundColor: "#E1CAB2ff", // earthyTan
        border: "4px solid #76583F", // earthyBrown
        borderRadius: "21px",
        padding: "12px",
        fontFamily: "PT Sans, sans-serif",
      }}
    >
      <BackButton />
      <FormHeading subHeading="Additional Task" />

      <div style={{ marginTop: "130px", width: "100%" }}>
        <AdditionalTasks searchParams={searchParams} />
      </div>
    </motion.main>
  );
}

export default function AdditionalTasksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdditionalTasksContent />
    </Suspense>
  );
}
