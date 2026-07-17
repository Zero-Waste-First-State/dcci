"use client";

/**
 * The 'Compost Log: **task name**' Page Heading for Compost form(s)
 *  ** task type **
 */

interface Props {
  subHeading?: string;
  isError?: boolean;
}

export default function FormHeading({subHeading, isError}: Props) {
  return (
    <>
      <h1 style={{
          position: "absolute",
          top: "25px", left: "117px",
          fontSize: "48px",
          fontFamily: "Lalezar, sans-serif",
          color: "#76583F", // earthyBrown
        }}
      >
        Compost Log:
      </h1>

      <h2 style={{
          position: "absolute",
          top: "72px", left: "117px",
          fontSize: "36px",
          fontFamily: "Lalezar, sans-serif",
          color: isError ? "#8F8F8F" : "#758A48",
        }}
      >
        {subHeading}
      </h2>

      {isError && <p
          style={{
            position: "absolute",
            top: "151px",
            left: "26px",
            fontSize: "14px",
            color: "#8F8F8F", // grayText
            textAlign: "center",
            width: "396px",
          }}
        >
          Missing required form data. Please go back and start over.
        </p>
      }
    </>
  );
}
