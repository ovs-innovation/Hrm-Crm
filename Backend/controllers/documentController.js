import Document from '../models/Document.js';
import DocumentAudit from '../models/DocumentAudit.js';
import { callLLM } from '../services/llm.service.js';

// Audit Document to create compliance risk sheet
export const auditDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Call evaluate if no parsedData exists
    let evaluation = doc.aiEvaluation;
    if (!evaluation || !evaluation.summary) {
      const prompt = `
        You are an expert Document Intelligence Analyst AI.
        Analyze the following document:
        Title: ${doc.title}
        File Name: ${doc.fileName}
        Category: ${doc.category}
        Notes: ${doc.notes}

        Return JSON ONLY matching the following schema:
        {
          "summary": "Short 2 sentence review description",
          "documentType": "NDA" | "Agreement" | "Invoice" | "Proposal" | "General Policy",
          "keyTopics": ["topic 1"],
          "importantDates": ["date 1"],
          "peopleMentioned": ["person 1"],
          "organizationsMentioned": ["organization 1"],
          "monetaryValues": ["value 1"],
          "deadlines": ["deadline 1"],
          "actionItems": ["item 1"],
          "risks": [
            { "severity": "High", "message": "Risk detail message", "reason": "Reason details" }
          ],
          "confidence": 0.95
        }
      `;
      evaluation = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'Documents' });
      doc.parsedData = evaluation;
      doc.aiEvaluation = evaluation;
      await doc.save();
    }

    // Save into DocumentAudit
    const audit = new DocumentAudit({
      documentId: doc._id,
      documentTitle: doc.title,
      summary: evaluation.summary,
      importantDates: evaluation.importantDates || [],
      risks: evaluation.risks || [],
      extractedData: {
        documentType: evaluation.documentType || 'General',
        confidence: String(evaluation.confidence || 0.9)
      }
    });
    await audit.save();

    res.json({ success: true, audit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Evaluate and Parse Document Intelligence
export const evaluateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Cache Check
    if (doc.parsedData && Object.keys(doc.parsedData).length > 0) {
      return res.json({
        success: true,
        data: {
          ...doc.parsedData,
          aiEvaluation: doc.aiEvaluation
        }
      });
    }

    // Construction of Document Evaluation Prompt
    const prompt = `
      You are an expert Document Intelligence Analyst AI.
      Analyze the following document metadata and details:
      Title: ${doc.title}
      File Name: ${doc.fileName || 'N/A'}
      Category: ${doc.category || 'General'}
      Notes: ${doc.notes || 'No description notes uploaded'}

      Return JSON ONLY matching the following schema:
      {
        "summary": "Short 2 sentence review description",
        "documentType": "NDA" | "Agreement" | "Invoice" | "Proposal" | "General Policy",
        "keyTopics": ["topic 1", "topic 2"],
        "importantDates": ["date 1", "date 2"],
        "peopleMentioned": ["person 1"],
        "organizationsMentioned": ["organization 1"],
        "monetaryValues": ["value 1"],
        "deadlines": ["deadline 1"],
        "actionItems": ["item 1"],
        "risks": [
          { "severity": "High" | "Medium" | "Low", "message": "Risk detail warning description", "reason": "Explain why this risk is flagged" }
        ],
        "confidence": number (between 0.8 and 1.0)
      }
    `;

    const parsedResult = await callLLM(prompt, { jsonMode: true, provider: 'groq', module: 'Documents' });

    // Save back to DB
    doc.parsedData = {
      summary: parsedResult.summary,
      documentType: parsedResult.documentType,
      keyTopics: parsedResult.keyTopics,
      importantDates: parsedResult.importantDates,
      peopleMentioned: parsedResult.peopleMentioned,
      organizationsMentioned: parsedResult.organizationsMentioned,
      monetaryValues: parsedResult.monetaryValues,
      deadlines: parsedResult.deadlines,
      actionItems: parsedResult.actionItems
    };
    doc.aiEvaluation = parsedResult;
    await doc.save();

    res.json({
      success: true,
      data: parsedResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
