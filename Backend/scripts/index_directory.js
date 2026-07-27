import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import connectDB from '../config/db.js';
import KnowledgeDoc from '../models/KnowledgeDoc.js';
import * as vectorService from '../services/vector.service.js';

// Simple text splitter chunking tool
const getChunks = (text, size = 600) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk.length > 50) chunks.push(chunk);
  }
  return chunks;
};

async function indexDirectory(dirPath) {
  console.log(`Connecting database...`);
  await connectDB();

  const absoluteDir = path.resolve(dirPath);
  if (!fs.existsSync(absoluteDir)) {
    console.log(`Directory path "${absoluteDir}" does not exist. Creating it.`);
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  console.log(`Scanning folder: ${absoluteDir}`);
  const files = fs.readdirSync(absoluteDir);
  const targetFiles = files.filter(f => f.endsWith('.txt')); // Handles text files natively

  if (targetFiles.length === 0) {
    console.log('No text (.txt) files found to index. Creating a sample policy file for validation.');
    fs.writeFileSync(
      path.join(absoluteDir, 'probation_policy.txt'),
      'Vastora Employee Probation Policy:\nAll new employees undergo a standard probation period of 90 days. During this period, performance is reviewed monthly by their department manager. Casual leaves are restricted to 1 day per month during probation.'
    );
    targetFiles.push('probation_policy.txt');
  }

  for (const filename of targetFiles) {
    const filepath = path.join(absoluteDir, filename);
    console.log(`\nIndexing file: ${filename}...`);
    const fullText = fs.readFileSync(filepath, 'utf8');

    const rawChunks = getChunks(fullText);
    const chunks = [];

    for (const chunkText of rawChunks) {
      // Generate real vector embedding or local mock array
      const embedding = await vectorService.generateEmbedding(chunkText);
      chunks.push({ text: chunkText, embedding });
    }

    // Upsert knowledge base doc
    await KnowledgeDoc.findOneAndUpdate(
      { fileName: filename },
      {
        title: filename.replace('.txt', '').replace('_', ' ').toUpperCase(),
        fileName: filename,
        category: 'Corporate Policy',
        chunks
      },
      { upsert: true, new: true }
    );

    console.log(`Success: Indexed ${chunks.length} chunks from ${filename}`);
  }

  console.log('\n--- Bulk Directory Indexing Complete ---');
  process.exit(0);
}

// Execute indexer pointing to local workspace policy uploads folder
indexDirectory('./uploads/policies');
