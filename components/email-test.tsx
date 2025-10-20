"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendEmail, sendAlertEmails } from "@/lib/email";
import { createTestEmail, createCompostFormSubmissionEmail, createStaffNotificationEmail } from "@/lib/email-templates";

export function EmailTest() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [testType, setTestType] = useState<"test" | "confirmation" | "staff" | "contamination" | "issue">("test");

  const handleSendTestEmail = async () => {
    if (!email) {
      setMessage("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      let emailData;

      switch (testType) {
        case "test":
          emailData = createTestEmail();
          break;
        case "confirmation":
          emailData = createCompostFormSubmissionEmail("John Doe", "Test Site", "Add Material to Bin");
          break;
        case "staff":
          emailData = createStaffNotificationEmail({
            siteName: "Test Site",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            selectedTask: "add_material"
          });
          break;
        case "contamination":
        case "issue":
          // Test alert emails
          const testFormData = {
            siteName: "Test Site",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            hasContamination: testType === "contamination",
            hasIssue: testType === "issue",
            contaminationDetails: "Test contamination details",
            issueDetails: "Test issue details"
          };
          
          const alertResults = await sendAlertEmails(testFormData);
          setMessage(`✅ Alert emails sent: ${alertResults.map(r => `${r.type} (${r.success ? 'success' : 'failed'})`).join(', ')}`);
          return;
      }

      await sendEmail({
        to: email,
        ...emailData
      });

      setMessage("✅ Email sent successfully! Check your inbox.");
    } catch (error) {
      console.error("Email error:", error);
      setMessage(`❌ Error sending email: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email System Test</CardTitle>
        <CardDescription>
          Test the email functionality with different email types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email to test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email Type</Label>
          <div className="flex gap-2">
            <Button
              variant={testType === "test" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("test")}
            >
              Test Email
            </Button>
            <Button
              variant={testType === "confirmation" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("confirmation")}
            >
              Confirmation
            </Button>
            <Button
              variant={testType === "staff" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("staff")}
            >
              Staff Notification
            </Button>
            <Button
              variant={testType === "contamination" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("contamination")}
            >
              Contamination Alert
            </Button>
            <Button
              variant={testType === "issue" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("issue")}
            >
              Issue Alert
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSendTestEmail} 
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? "Sending..." : "Send Test Email"}
        </Button>

        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes("✅") 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
