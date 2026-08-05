import JobApplication from '../models/JobApplication.js';
import Employee from '../models/Employee.js';
import { callLLM } from '../services/llm.service.js';

// Evaluate Application with Cached LLM parsing
export const evaluateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check Cache
    if (application.parsedData && Object.keys(application.parsedData).length > 0) {
      return res.json({
        success: true,
        data: {
          ...application.parsedData,
          aiEvaluation: application.aiEvaluation
        }
      });
    }

    // Run AI Resume Evaluation & Parsing
    const prompt = `
      You are an expert HR recruitment parser and ranker.
      Analyze this applicant profile:
      Name: ${application.name}
      Email: ${application.email}
      Phone: ${application.phone || 'N/A'}
      Cover Letter: ${application.coverLetter || 'No cover letter uploaded'}
      Resume URL/Name: ${application.resumeUrl || 'N/A'}

      Return JSON ONLY matching the following schema:
      {
        "name": "${application.name}",
        "email": "${application.email}",
        "phone": "${application.phone || ''}",
        "matchPercentage": number (0-100),
        "hiringRecommendation": "Strong Hire" | "Hire" | "Review" | "Reject",
        "salaryRecommendation": number (average yearly basic salary recommendation in INR, e.g. 600000),
        "skillsGap": "comma separated missing skills",
        "nextBestAction": "Short immediate recommendation step",
        "confidence": number (confidence score between 0.8 and 1.0)
      }
    `;

    const parsedResult = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'Recruitment' });

    // Save to DB
    application.parsedData = {
      name: parsedResult.name,
      email: parsedResult.email,
      phone: parsedResult.phone
    };
    application.aiEvaluation = parsedResult;
    await application.save();

    res.json({
      success: true,
      data: parsedResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
