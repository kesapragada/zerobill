// FILE: frontend/src/pages/ConfigureAWS.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from 'react-router-dom';
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const copyToClipboard = (text, callback) => {
  navigator.clipboard.writeText(text).then(() => {
    callback();
  }).catch(err => {
    console.error("Failed to copy text: ", err);
  });
};

const ConfigureAWS = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState({ roleArn: "", accessKeyId: "", secretAccessKey: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "", copied: "" });

  const ZERO_BILL_ACCOUNT_ID = import.meta.env.VITE_ZERO_BILL_ACCOUNT_ID;
  const permissionsPolicy = {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ce:GetCostAndUsage", "ec2:Describe*", "rds:DescribeDBInstances", "s3:ListAllMyBuckets", "s3:GetBucketLocation", "sts:GetCallerIdentity"],
      "Resource": "*"
    }]
  };
  const trustPolicyPrincipal = { "AWS": `arn:aws:iam::${ZERO_BILL_ACCOUNT_ID}:root` };

  const handleCopy = (textToCopy, fieldName) => {
    copyToClipboard(textToCopy, () => {
      setFeedback(prev => ({ ...prev, copied: fieldName, error: "", success: "" }));
      setTimeout(() => setFeedback(prev => ({ ...prev, copied: "" })), 2000);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ error: "", success: "", copied: "" });
    try {
      const res = await api.post("/aws/configure", formState);
      setFeedback({ success: res.data.message, error: "", copied: "" });
      setStep(4); // Move to final success step
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Configuration failed.", success: "", copied: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="text-center p-8 text-navy-light">Verifying authentication...</div>;
  }

  const formInputStyles = "form-input block w-full bg-navy-darkest border-navy-medium rounded-lg text-navy-lightest placeholder-navy-light focus:ring-brand-primary focus:border-brand-primary";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-navy-lightest">Configure AWS Access</h1>
      <p className="text-navy-light">Grant ZeroBill secure, read-only access to your AWS account in a few steps.</p>

      <Card className={step < 1 ? 'opacity-50' : ''}>
        <h2 className="text-xl font-semibold text-white">Step 1: Create Permissions Policy</h2>
        <p className="mt-2 text-navy-light">In your AWS IAM console, go to Policies → Create Policy. Click the JSON tab and paste this code. Name it `ZeroBillReadOnlyAccess`.</p>
        <div className="relative mt-4">
          <pre className="bg-navy-darkest p-4 rounded-md text-sm text-gray-300 overflow-x-auto"><code>{JSON.stringify(permissionsPolicy, null, 2)}</code></pre>
          <Button onClick={() => handleCopy(JSON.stringify(permissionsPolicy, null, 2), 'policy')} className="absolute top-2 right-2 !py-1 !px-2 text-xs">{feedback.copied === 'policy' ? "Copied!" : "Copy"}</Button>
        </div>
        {step === 1 && <Button onClick={() => setStep(2)} className="mt-4">Next: Create Role</Button>}
      </Card>

      <Card className={step < 2 ? 'opacity-50' : ''}>
        <h2 className="text-xl font-semibold text-white">Step 2: Create IAM Role</h2>
        <p className="mt-2 text-navy-light">Go to IAM → Roles → Create Role. Select "Custom trust policy" and paste the policy below. This grants our AWS account permission to assume the role.</p>
        <div className="relative mt-4">
          <pre className="bg-navy-darkest p-4 rounded-md text-sm text-gray-300 overflow-x-auto"><code>{JSON.stringify(trustPolicyPrincipal, null, 2)}</code></pre>
        </div>
        <p className="mt-4 text-navy-light">Under "Permissions policies", attach the `ZeroBillReadOnlyAccess` policy you created. Name the role `ZeroBillRole`.</p>
        {step === 2 && <Button onClick={() => setStep(3)} className="mt-4">Next: Verify</Button>}
      </Card>

      <Card className={step < 3 ? 'opacity-50' : ''}>
        <h2 className="text-xl font-semibold text-white">Step 3: Verify & Save</h2>
        <p className="mt-2 text-navy-light">Finally, provide the ARN of the `ZeroBillRole` and a temporary Access Key from any IAM user in your account to perform a one-time validation.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="roleArn" className="block text-sm font-medium text-navy-light">Role ARN</label>
            <input id="roleArn" name="roleArn" placeholder="arn:aws:iam::123456789012:role/ZeroBillRole" value={formState.roleArn} onChange={handleInputChange} required className={formInputStyles} />
          </div>
          <div>
            <label htmlFor="accessKeyId" className="block text-sm font-medium text-navy-light">Temporary Access Key ID</label>
            <input id="accessKeyId" name="accessKeyId" placeholder="AKIAIOSFODNN7EXAMPLE" value={formState.accessKeyId} onChange={handleInputChange} required className={formInputStyles} />
          </div>
          <div>
            <label htmlFor="secretAccessKey" className="block text-sm font-medium text-navy-light">Temporary Secret Access Key</label>
            <input id="secretAccessKey" name="secretAccessKey" type="password" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" value={formState.secretAccessKey} onChange={handleInputChange} required className={formInputStyles} />
          </div>
          <Button type="submit" disabled={isSubmitting || !formState.roleArn || !formState.accessKeyId || !formState.secretAccessKey}>
            {isSubmitting ? "Validating..." : "Verify & Save Configuration"}
          </Button>
          {feedback.success && <p className="mt-2 text-green-400">✅ {feedback.success}</p>}
          {feedback.error && <p className="mt-2 text-red-400">❌ {feedback.error}</p>}
        </form>
      </Card>
      
      {step === 4 &&
        <Card className="border-green-500/50 bg-green-900/20 text-center">
            <h2 className="text-2xl font-bold text-green-300">✅ All Set!</h2>
            <p className="mt-2 text-green-400">Your AWS account is successfully linked. Run a scan from your dashboard to start seeing insights.</p>
            <Button onClick={() => navigate('/')} className="mt-4">Go to Dashboard</Button>
        </Card>
      }
    </div>
  );
};

export default ConfigureAWS;