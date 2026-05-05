export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  salary: string;
  posted: string;
  description: string;
  requirements: string[];
  screeningQuestions: { id: string; question: string; type: "text" | "choice"; options?: string[] }[];
}

export const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechVault Inc.",
    location: "Remote",
    type: "Full-time",
    salary: "$120k–$160k",
    posted: "2 days ago",
    description: "Build and maintain scalable web applications using React, TypeScript, and modern tooling.",
    requirements: ["5+ years React experience", "TypeScript proficiency", "CI/CD knowledge", "Team leadership experience"],
    screeningQuestions: [
      { id: "q1", question: "How many years of experience do you have with React?", type: "choice", options: ["1-2", "3-4", "5+", "7+"] },
      { id: "q2", question: "Describe a complex UI challenge you solved recently.", type: "text" },
      { id: "q3", question: "Are you comfortable with remote async work?", type: "choice", options: ["Yes", "No", "Prefer hybrid"] },
    ],
  },
  {
    id: "2",
    title: "Data Scientist",
    company: "AnalyticsPro",
    location: "New York, NY",
    type: "Full-time",
    salary: "$130k–$170k",
    posted: "1 week ago",
    description: "Leverage ML models to derive actionable insights from large datasets and drive product decisions.",
    requirements: ["Python & SQL expertise", "ML/DL frameworks", "Statistics background", "Communication skills"],
    screeningQuestions: [
      { id: "q1", question: "Which ML frameworks are you most proficient in?", type: "text" },
      { id: "q2", question: "What is your highest level of education?", type: "choice", options: ["Bachelor's", "Master's", "PhD", "Self-taught"] },
      { id: "q3", question: "Can you relocate to New York?", type: "choice", options: ["Yes", "Already local", "No"] },
    ],
  },
  {
    id: "3",
    title: "Product Designer",
    company: "DesignLab Studio",
    location: "San Francisco, CA",
    type: "Contract",
    salary: "$90k–$120k",
    posted: "3 days ago",
    description: "Craft user-centered designs for mobile and web products, from wireframes to high-fidelity prototypes.",
    requirements: ["Figma expert", "3+ years UX/UI", "User research skills", "Design system experience"],
    screeningQuestions: [
      { id: "q1", question: "Share a link to your portfolio.", type: "text" },
      { id: "q2", question: "How many years of product design experience do you have?", type: "choice", options: ["1-2", "3-4", "5+"] },
      { id: "q3", question: "Are you available to start within 2 weeks?", type: "choice", options: ["Yes", "No", "Negotiable"] },
    ],
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudScale Systems",
    location: "Remote",
    type: "Full-time",
    salary: "$110k–$145k",
    posted: "5 days ago",
    description: "Manage cloud infrastructure, CI/CD pipelines, and ensure system reliability at scale.",
    requirements: ["AWS/GCP experience", "Kubernetes", "Terraform", "Monitoring tools"],
    screeningQuestions: [
      { id: "q1", question: "Which cloud platforms have you worked with?", type: "choice", options: ["AWS", "GCP", "Azure", "Multiple"] },
      { id: "q2", question: "Describe your experience with container orchestration.", type: "text" },
    ],
  },
];
