'use client';

/**
 * The 'Next ->' button
 */

//import { useFormStatus } from "react-dom";
import { FaArrowRight } from "react-icons/fa";

interface Props {
  label?: string;
  isValid: boolean;
  handler?: () => void;
}

export function NextButton({label = 'Next', isValid, handler}: Props) {
  //const { pending } = useFormStatus();

  return (
    <button
      onClick={handler}
      disabled={!isValid}
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
        cursor: isValid ? "pointer" : "not-allowed",
        opacity: isValid ? 1 : 0.6,
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
        {label}
      </span>
      <FaArrowRight
        style={{
          width: "30px",
          height: "30px",
          color: "#758A48",
        }}
      />
    </button>
  );
}
