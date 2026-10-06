import { callLLM } from './llm.service.js';

const MAX_RESUME_CHARS = 9000;
const SKILL_ALIASES = {
  'react native': ['react-native', 'reactnative', 'rn'],
  react: ['reactjs', 'react.js'],
  javascript: ['js', 'es6'],
  typescript: ['ts'],
  node: ['nodejs', 'node.js'],
  mongodb: ['mongo'],
  postgres: ['postgresql', 'psql'],
  flutter: ['dart'],
  aws: ['amazon web services'],
  'ci/cd': ['cicd', 'github actions', 'jenkins'],
};

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haystackHasSkill(haystack, skill) {
  const key = normalize(skill);
  if (!key) return false;
  const aliases = [key, ...(SKILL_ALIASES[key] || [])];
  return aliases.some((alias) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`, 'i');
    return pattern.test(haystack);
  });
}

function extractContact(text) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone =
    text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}/)?.[0]?.trim() || '';
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && l.length < 80 && !/@/.test(l) && !/resume|curriculum/i.test(l));
  const name = lines.find((l) => /^[A-Za-z][A-Za-z .'-]{2,50}$/.test(l)) || '';
  return { name, email, phone };
}

function extractYears(text) {
  const hay = normalize(text);
  const matches = [...hay.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/g)];
  const nums = matches.map((m) => Number(m[1])).filter((n) => n > 0 && n < 45);
  return nums.length ? Math.max(...nums) : null;
}

function parseJdRange(jd) {
  const hay = normalize(jd);
  const range = hay.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const minPlus = hay.match(/(\d+)\s*\+\s*(?:years?|yrs?)/);
  if (minPlus) return { min: Number(minPlus[1]), max: Number(minPlus[1]) + 8 };
  const single = hay.match(/(\d+)\s*(?:years?|yrs?)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) + 2 };
  return null;
}

function parseJdSkills(jd) {
  const required = [];
  const plus = [];
  const lines = String(jd || '').split(/\r?\n/);

  for (const line of lines) {
    const raw = line.replace(/\*/g, '').trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    const value = raw.split(':').slice(1).join(':').trim() || raw;
    if (/primary skill|must have|required skill|mandatory/.test(lower)) {
      value.split(/,|\/|&| and /i).forEach((s) => {
        const t = s.trim();
        if (t && t.length < 40) required.push(t);
      });
    } else if (/\bplus\b|nice to have|good to have|optional/.test(lower)) {
      const skill = raw.split(':')[0].replace(/plus/i, '').trim() || value;
      if (skill && skill.length < 40) plus.push(skill);
    }
  }

  if (!required.length) {
    const fallback = String(jd || '')
      .split(/,|\n|\//)
      .map((s) => s.replace(/\*/g, '').trim())
      .filter((s) => s.length > 1 && s.length < 28 && !/experience|required|years/i.test(s));
    required.push(...fallback.slice(0, 6));
  }

  return {
    required: [...new Set(required.map((s) => s.trim()).filter(Boolean))],
    plus: [...new Set(plus.map((s) => s.trim()).filter(Boolean))],
  };
}

function scoreAgainstJd(resumeText, jobDescription) {
  const hay = normalize(resumeText);
  const { required, plus } = parseJdSkills(jobDescription);
  const yearsRequired = parseJdRange(jobDescription);
  const yearsFound = extractYears(resumeText);

  const requiredHits = required.map((skill) => ({
    skill,
    matched: haystackHasSkill(hay, skill),
  }));
  const plusHits = plus.map((skill) => ({
    skill,
    matched: haystackHasSkill(hay, skill),
  }));

  const reqScore = requiredHits.length
    ? (requiredHits.filter((s) => s.matched).length / requiredHits.length) * 70
    : 35;
  const plusScore = plusHits.length
    ? (plusHits.filter((s) => s.matched).length / plusHits.length) * 15
    : 8;

  let yearScore = 15;
  if (yearsRequired && yearsFound != null) {
    if (yearsFound >= yearsRequired.min && yearsFound <= yearsRequired.max + 2) yearScore = 15;
    else if (yearsFound >= yearsRequired.min - 0.5) yearScore = 10;
    else yearScore = 4;
  } else if (yearsRequired && yearsFound == null) {
    yearScore = 8;
  }

  const matchPercentage = Math.round(Math.min(100, reqScore + plusScore + yearScore));
  const confidence = requiredHits.length ? 80 : 55;

  return {
    matchPercentage,
    confidence,
    breakdown: {
      requiredSkills: requiredHits,
      plusSkills: plusHits,
      yearsRequired,
      yearsFound,
    },
  };
}

function clipResume(text) {
  const clean = String(text || '').replace(/\u0000/g, '').trim();
  if (clean.length <= MAX_RESUME_CHARS) return clean;
  const head = clean.slice(0, 5000);
  const tail = clean.slice(-3500);
  return `${head}\n\n[...truncated...]\n\n${tail}`;
}

export async function screenResume(resumeText, jobDescription) {
  const text = String(resumeText || '').trim();
  if (!text) {
    const err = new Error('Could not read text from this PDF. If it is a scanned image, export a text PDF and try again.');
    err.status = 400;
    throw err;
  }

  const contact = extractContact(text);
  const heuristic = scoreAgainstJd(text, jobDescription);
  const clipped = clipResume(text);

  const prompt = `You are a recruiting screener. Extract facts from the resume. Do not invent contact details.
Job description:
${String(jobDescription || '').slice(0, 1500)}

Resume:
${clipped}

Return JSON only:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "experience": "short summary of years and recent roles",
  "skills": ["up to 12 actual skills from the resume"],
  "jobDescriptionScoreExplanation": "2-3 sentences on fit vs the job description, mentioning missing required skills if any"
}`;

  let llm = {};
  try {
    llm = await callLLM(prompt, {
      jsonMode: true,
      provider: 'groq',
      fallback: false,
      maxTokens: 700,
      timeoutMs: 12000,
      temperature: 0.1,
      module: 'Recruitment',
    });
  } catch {
    llm = {};
  }

  const skills = Array.isArray(llm.skills) && llm.skills.length
    ? llm.skills.slice(0, 12)
    : heuristic.breakdown.requiredSkills.filter((s) => s.matched).map((s) => s.skill);

  const missing = heuristic.breakdown.requiredSkills.filter((s) => !s.matched).map((s) => s.skill);
  const fallbackExplain = missing.length
    ? `Required skills missing from the resume: ${missing.join(', ')}. Overall fit ${heuristic.matchPercentage}%.`
    : `Required skills appear on the resume. Overall fit ${heuristic.matchPercentage}%.`;

  return {
    name: llm.name || contact.name || 'Unknown',
    email: llm.email || contact.email || '',
    phone: llm.phone || contact.phone || '',
    matchPercentage: heuristic.matchPercentage,
    confidence: heuristic.confidence,
    experience: llm.experience || (heuristic.breakdown.yearsFound != null
      ? `About ${heuristic.breakdown.yearsFound} years mentioned`
      : 'Experience not clearly stated'),
    skills,
    jobDescriptionScoreExplanation: llm.jobDescriptionScoreExplanation || fallbackExplain,
    breakdown: heuristic.breakdown,
  };
}
