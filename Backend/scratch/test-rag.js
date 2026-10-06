import 'dotenv/config';
import mongoose from 'mongoose';
import KnowledgeDoc from '../models/KnowledgeDoc.js';
import * as vectorService from '../services/vector.service.js';
import * as aiService from '../services/ai.service.js';

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hrm-crm';
console.log('Connecting to database:', mongoUri);

async function runTest() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    const tenantId = new mongoose.Types.ObjectId(); // mock tenant

    // 1. Create a dummy knowledge doc
    console.log('Indexing dummy document...');
    const text1 = "The office timings at Vastora Tech are strictly 10:00 AM to 7:00 PM, Monday to Friday. Saturday and Sunday are holidays.";
    const text2 = "The leave policy allows 18 paid leaves per year. Sick leaves require a medical certificate if taking more than 2 consecutive days.";
    const text3 = "The company GST number is 09AAFCV1234F1Z5.";

    const chunks = [];
    for (const text of [text1, text2, text3]) {
      const embedding = await vectorService.generateEmbedding(text);
      chunks.push({
        text,
        embedding,
        pageNumber: 1,
        metadata: { document: 'Test SOP', category: 'General' }
      });
    }

    const doc = new KnowledgeDoc({
      title: 'Test SOP',
      fileName: 'test-sop.txt',
      category: 'General',
      chunks,
      tenantId
    });

    await doc.save();
    console.log('✅ Test document indexed successfully with', chunks.length, 'chunks.');

    // 2. Query Knowledge Base
    const testQueries = [
      "What are office timings?",
      "What is leave policy?",
      "What is company GST?",
      "What is the CEO salary?" // should not be found in doc
    ];

    for (const q of testQueries) {
      console.log(`\nQuerying: "${q}"`);
      const allChunks = chunks.map((c, i) => ({
        id: `mock-chunk-${i}`,
        title: doc.title,
        text: c.text,
        embedding: c.embedding,
        pageNumber: c.pageNumber,
        metadata: c.metadata
      }));

      const matches = await vectorService.searchVectorDatabase(q, allChunks, 3);
      console.log(`Found ${matches.length} matching chunks.`);

      const response = await aiService.answerFromKnowledgeBase(q, matches);
      console.log('AI Answer:', response.answer);
      console.log('Confidence:', response.confidence);
    }

    // Clean up
    await KnowledgeDoc.deleteOne({ _id: doc._id });
    console.log('\n✅ Cleaned up test document.');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
