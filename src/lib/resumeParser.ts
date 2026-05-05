export interface ResumeAnalysis {
  score: number;
  pros: string[];
  cons: string[];
  recommendations: string[];
  keywords: { found: string[]; missing: string[] };
  sections: { name: string; found: boolean }[];
}

const COMMON_SECTIONS = [
  "Contact Information",
  "Summary/Objective",
  "Work Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
];

const ATS_KEYWORDS = [
  "managed", "developed", "implemented", "designed", "led", "created",
  "achieved", "improved", "increased", "reduced", "collaborated",
  "analyzed", "organized", "delivered", "optimized", "responsible",
  "experience", "skills", "education", "project", "team", "leadership",
  "communication", "problem-solving", "technical", "professional",
  "results", "performance", "strategy", "innovation", "growth",
];

export function analyzeResume(text: string): ResumeAnalysis {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  // Section detection
  const sectionChecks: { name: string; patterns: string[] }[] = [
    { name: "Contact Information", patterns: ["email", "phone", "@", "linkedin", "address", "tel"] },
    { name: "Summary/Objective", patterns: ["summary", "objective", "profile", "about me", "overview"] },
    { name: "Work Experience", patterns: ["experience", "work history", "employment", "professional experience"] },
    { name: "Education", patterns: ["education", "academic", "university", "degree", "bachelor", "master", "college"] },
    { name: "Skills", patterns: ["skills", "technical skills", "competencies", "proficiencies", "tools"] },
    { name: "Certifications", patterns: ["certification", "certificate", "certified", "license", "accreditation"] },
    { name: "Projects", patterns: ["project", "portfolio", "personal project", "key projects"] },
  ];

  const sections = sectionChecks.map(s => ({
    name: s.name,
    found: s.patterns.some(p => lower.includes(p)),
  }));

  const sectionsFound = sections.filter(s => s.found).length;

  // Keyword analysis
  const foundKeywords = ATS_KEYWORDS.filter(k => lower.includes(k));
  const missingKeywords = ATS_KEYWORDS.filter(k => !lower.includes(k)).slice(0, 8);

  // Scoring
  let score = 0;

  // Section score (30 pts)
  score += Math.round((sectionsFound / COMMON_SECTIONS.length) * 30);

  // Keyword score (25 pts)
  score += Math.min(25, Math.round((foundKeywords.length / 15) * 25));

  // Length score (15 pts)
  if (wordCount >= 200 && wordCount <= 800) score += 15;
  else if (wordCount >= 100) score += 10;
  else if (wordCount >= 50) score += 5;

  // Formatting checks (15 pts)
  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(text);
  const hasPhone = /[\d\s()+-]{7,}/.test(text);
  const hasBullets = /[•\-\*]/.test(text);
  const hasNumbers = /\d+%|\d+\+/.test(text);
  if (hasEmail) score += 4;
  if (hasPhone) score += 3;
  if (hasBullets) score += 4;
  if (hasNumbers) score += 4;

  // Action verbs (15 pts)
  const actionVerbs = ["managed", "developed", "implemented", "designed", "led", "created", "achieved", "delivered", "optimized", "built"];
  const actionCount = actionVerbs.filter(v => lower.includes(v)).length;
  score += Math.min(15, actionCount * 3);

  score = Math.min(100, Math.max(5, score));

  // Pros
  const pros: string[] = [];
  if (sectionsFound >= 5) pros.push("Well-structured with key resume sections present");
  if (hasEmail && hasPhone) pros.push("Contact information is complete and accessible");
  if (foundKeywords.length >= 10) pros.push("Strong use of industry-relevant keywords");
  if (hasBullets) pros.push("Good use of bullet points for readability");
  if (hasNumbers) pros.push("Includes quantifiable achievements");
  if (actionCount >= 3) pros.push("Effective use of action verbs");
  if (wordCount >= 200 && wordCount <= 800) pros.push("Appropriate resume length");
  if (pros.length === 0) pros.push("Resume content detected and readable");

  // Cons
  const cons: string[] = [];
  if (!sections.find(s => s.name === "Summary/Objective")?.found) cons.push("Missing professional summary or objective section");
  if (!sections.find(s => s.name === "Skills")?.found) cons.push("No dedicated skills section found");
  if (!sections.find(s => s.name === "Work Experience")?.found) cons.push("Work experience section is missing or unclear");
  if (!hasEmail) cons.push("No email address detected");
  if (!hasBullets) cons.push("No bullet points found — wall of text reduces readability");
  if (!hasNumbers) cons.push("No quantifiable metrics or achievements");
  if (wordCount < 150) cons.push("Resume appears too short — may lack sufficient detail");
  if (wordCount > 1000) cons.push("Resume may be too long — consider condensing");
  if (foundKeywords.length < 5) cons.push("Low keyword density — may not pass ATS filters");

  // Recommendations
  const recommendations: string[] = [];
  if (missingKeywords.length > 0) recommendations.push(`Add keywords: ${missingKeywords.slice(0, 5).join(", ")}`);
  if (!sections.find(s => s.name === "Summary/Objective")?.found) recommendations.push("Add a concise professional summary at the top");
  if (!hasNumbers) recommendations.push("Quantify your achievements with numbers and percentages");
  if (!hasBullets) recommendations.push("Use bullet points to break down responsibilities and achievements");
  if (actionCount < 3) recommendations.push("Start bullet points with strong action verbs (Led, Developed, Achieved)");
  if (wordCount < 150) recommendations.push("Expand your resume with more relevant details and experiences");
  if (!sections.find(s => s.name === "Certifications")?.found) recommendations.push("Add relevant certifications to strengthen your profile");
  recommendations.push("Tailor your resume keywords to match the specific job description");

  return {
    score,
    pros,
    cons,
    recommendations,
    keywords: { found: foundKeywords, missing: missingKeywords },
    sections,
  };
}
