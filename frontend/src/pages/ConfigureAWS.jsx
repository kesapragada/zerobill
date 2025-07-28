// zerobill/frontend/src/pages/ConfigureAWS.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Import our fortified hook
import api from "../api/axios";

const ConfigureAWS = () => {
  // --- State Management ---
  // [FIX] Get user and initial loading state directly from the AuthContext.
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Local state for the form itself
  const [formState, setFormState] = useState({
    roleArn: "",
    accessKeyId: "",
    secretAccessKey: "",
  });
  
  // [FIX] Use a clear, specific loading state for form submission.
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for UI feedback
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load secret from environment variables
  const ZERO_BILL_ACCOUNT_ID = import.meta.env.VITE_ZERO_BILL_ACCOUNT_ID;

  // --- Event Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/aws/configure", formState);
      setSuccess(res.data.message);
      setFormState({ roleArn: "", accessKeyId: "", secretAccessKey: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Configuration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSON Snippets for User ---
  const permissionsPolicy = { /* ... remains the same ... */ };
  const trustRelationship = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": { "AWS": `arn:aws:iam::${ZERO_BILL_ACCOUNT_ID}:root` },
        "Action": "sts:AssumeRole",
        "Condition": {
            "StringEquals": { "sts:ExternalId": user?._id || "YOUR_UNIQUE_ID_HERE" }
        }
    }]
  };
  
  // [MAJOR BUG FIX] This is the correct "early return" pattern.
  // It handles the initial loading state before attempting to render the main component.
  if (isAuthLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Verifying authentication...</div>;
  }

  // This is the main return statement for the component.
  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "2rem" }}>
      <h2>🔐 Configure AWS Access for ZeroBill</h2>
      <p>Follow these steps to grant ZeroBill secure, read-only access to your AWS account.</p>

      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h4><strong>Step 1: Create the Read-Only Permissions Policy in AWS</strong></h4>
        <p>In your AWS account, go to IAM → Policies → Create Policy. Click the JSON tab and paste this:</p>
        <pre style={{ background: "#f4f4f4", padding: "1rem", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>{JSON.stringify(permissionsPolicy, null, 2)}</code>
        </pre>
        <p>Name the policy something memorable, like `ZeroBillReadOnlyAccess`.</p>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h4><strong>Step 2: Create the IAM Role</strong></h4>
        <p>Go to IAM → Roles → Create Role. Select "AWS account" and "Another AWS account".</p>
        <p>Enter our Account ID: <strong>{ZERO_BILL_ACCOUNT_ID}</strong></p>
        <p>Under Options, check "Require external ID" and enter your unique ID below:</p>
        <pre style={{ background: "#eee", border: '1px solid #ccc', padding: '1rem', fontWeight: 'bold' }}>{user?._id}</pre>
        <p>On the next screen, attach the `ZeroBillReadOnlyAccess` policy you just created. Name the role something like `ZeroBillRole`.</p>
      </div>
      
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h4><strong>Step 3: Create a Temporary IAM User (for verification only)</strong></h4>
        <p>Go to IAM → Users → Create User. Name it `zerobill-temp-verifier`. Attach the `STS:AssumeRole` permission directly to this user, limited to the `ZeroBillRole` ARN you just created. Generate an access key for this user. These keys will be used once to verify the setup and will NOT be stored.</p>
      </div>

      <div style={{ border: '1-px solid #ddd', padding: '1rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h4><strong>Step 4: Verify Your Configuration</strong></h4>
        <p>Enter the Role ARN you created and the temporary user's keys below.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: '1rem' }}>
          <input name="roleArn" placeholder="Your IAM Role ARN (e.g., arn:aws:iam::...)" value={formState.roleArn} onChange={handleInputChange} required />
          <input name="accessKeyId" placeholder="Temporary Access Key ID" value={formState.accessKeyId} onChange={handleInputChange} required />
          <input name="secretAccessKey" placeholder="Temporary Secret Access Key" value={formState.secretAccessKey} onChange={handleInputChange} type="password" required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Validating..." : "Verify & Save Configuration"}
          </button>
        </form>
        {success && <p style={{ marginTop: "1rem", color: "green", fontWeight: 'bold' }}>✅ {success}</p>}
        {error && <p style={{ marginTop: "1rem", color: "red", fontWeight: 'bold' }}>❌ {error}</p>}
      </div>
    </div>
  );
};

export default ConfigureAWS;