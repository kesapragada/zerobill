# zerobill/README.md

# ZeroBill - AWS Cost Anomaly Detection

ZeroBill is a full-stack application designed to help users identify cost-saving opportunities in their AWS accounts by detecting discrepancies between billed services and active infrastructure.

## Core Features
- Secure user authentication with JWT and password reset functionality.
- Secure, key-less AWS integration using the STS AssumeRole model with External IDs.
- Asynchronous data fetching for billing and infrastructure snapshots using BullMQ.
- A discrepancy engine to identify unused or unattached resources (EBS, EIPs, etc.).
- Real-time alerts via WebSockets and batched notifications via email/Slack.

---

## Architecture

[A diagram will be added here in a later phase]

The application is built with a modern, scalable tech stack:
- **Backend:** Node.js, Express, MongoDB, Redis
- **Frontend:** React, Tailwind CSS
- **Job Queues:** BullMQ for handling asynchronous AWS API calls.
- **Security:** AWS STS for secure cross-account access.
- **Real-time:** Socket.IO for instant notifications.
- **Deployment:** Docker, GitHub Actions CI/CD, Vercel (Frontend), Render (Backend).

---

## Future Improvements & Architectural Notes

### Onboarding Experience

The current process for connecting a user's AWS account relies on a manual, multi-step configuration within the AWS IAM console. While this is a secure and standard practice for many SaaS tools, it presents a significant hurdle for user onboarding due to its complexity.

**A critical future enhancement** would be to replace this manual guide with a one-click **AWS CloudFormation template**. This would allow a user to deploy the necessary IAM Role and Policies into their account with a single click, drastically simplifying the setup process, reducing the chance of human error, and improving the overall onboarding experience to a best-in-class standard.