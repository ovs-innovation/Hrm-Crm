import AIInboxMessage from '../models/AIInboxMessage.js';
import Client from '../models/Client.js';
import Ticket from '../models/Ticket.js';
import Admin from '../models/Admin.js';
import { callLLM } from '../services/llm.service.js';
import { io } from '../socket/socket.js';
import { logAudit } from '../utils/auditLogger.js';
import { executeTool } from '../services/mcp.service.js';

// Get messages with search, filter, pagination
export const getInboxMessages = async (req, res) => {
  try {
    const { search, channel, status, sentiment, category, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { senderName: { $regex: search, $options: 'i' } },
        { senderEmail: { $regex: search, $options: 'i' } },
        { senderPhone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (sentiment) query.sentiment = sentiment;
    if (category) query.aiCategory = category;

    const count = await AIInboxMessage.countDocuments(query);
    const messages = await AIInboxMessage.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: messages,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Simulate receiving a message (e.g. from WhatsApp, Email, or Web Chat)
export const createInboxMessage = async (req, res) => {
  try {
    const { senderName, senderEmail, senderPhone, channel, subject, body, attachments } = req.body;

    if (!senderName || !channel || !body) {
      return res.status(400).json({ success: false, message: 'senderName, channel, and body are required.' });
    }

    // Call LLM for AI Categorization, Sentiment, Auto Assignment logic, Followups & Reply Draft
    let aiCategory = 'General';
    let sentiment = 'Neutral';
    let followUpSuggestions = [];
    let aiReplyDraft = '';

    try {
      const aiPrompt = `Analyze this customer message:
Sender: ${senderName}
Channel: ${channel}
Subject: ${subject || 'None'}
Body: ${body}

Return a JSON object containing:
- category: String (one of: 'Sales', 'Support', 'Billing', 'General', 'Spam')
- sentiment: String (one of: 'Positive', 'Neutral', 'Negative')
- followUpSuggestions: Array of 3 short one-line suggestions for follow up
- draftReply: A polite, professional email/chat reply starting with "Hi [Name]" answering or acknowledging their request.`;

      const aiResponse = await callLLM(aiPrompt, { jsonMode: true });
      if (aiResponse) {
        aiCategory = aiResponse.category || 'General';
        sentiment = aiResponse.sentiment || 'Neutral';
        followUpSuggestions = aiResponse.followUpSuggestions || [];
        aiReplyDraft = aiResponse.draftReply || '';
      }
    } catch (e) {
      console.error('[AIInbox Analysis Failed]', e.message);
      // Fallback
      if (body.toLowerCase().includes('price') || body.toLowerCase().includes('demo') || body.toLowerCase().includes('buy')) {
        aiCategory = 'Sales';
      } else if (body.toLowerCase().includes('bug') || body.toLowerCase().includes('error') || body.toLowerCase().includes('fail')) {
        aiCategory = 'Support';
      }
    }

    // Auto assign based on category
    let assignedAdmin = null;
    if (aiCategory === 'Sales') {
      assignedAdmin = await Admin.findOne({ role: 'Sales' });
    } else if (aiCategory === 'Support') {
      assignedAdmin = await Admin.findOne({ role: 'Manager' });
    }
    if (!assignedAdmin) {
      assignedAdmin = await Admin.findOne(); // Assign to primary admin
    }

    const newMessage = new AIInboxMessage({
      senderName,
      senderEmail,
      senderPhone,
      channel,
      subject,
      body,
      aiCategory,
      sentiment,
      assignedTo: assignedAdmin?._id,
      assignedToName: assignedAdmin?.name || 'System Auto',
      attachments: attachments || [],
      followUpSuggestions,
      aiReplyDraft,
      timeline: [
        { action: `Message received via ${channel}` },
        { action: `AI categorized message as "${aiCategory}" with ${sentiment} sentiment` },
        { action: `Auto-assigned to ${assignedAdmin?.name || 'System Auto'}` }
      ],
      messages: [
        { sender: 'client', senderName, body, attachments: attachments || [] }
      ]
    });

    await newMessage.save();

    // Trigger real-time updates via Socket.IO
    if (io) {
      io.emit('newAIInboxMessage', newMessage);
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send reply dispatch
export const sendReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body;

    const msg = await AIInboxMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message thread not found.' });
    }

    const reply = {
      sender: 'agent',
      senderName: req.user?.name || 'Support Agent',
      body: text,
      timestamp: new Date(),
      attachments: attachments || []
    };

    msg.messages.push(reply);
    msg.status = 'replied';
    msg.timeline.push({
      action: `Reply dispatched via ${msg.channel} by ${req.user?.name || 'Agent'}`,
      user: req.user?.name || 'Agent'
    });

    await msg.save();

    if (io) {
      io.emit('updateAIInboxMessage', msg);
    }

    await logAudit({
      req,
      action: 'REPLY_SENT',
      module: 'AI Inbox',
      entityId: msg._id,
      entityLabel: msg.senderName,
      changes: { text }
    });

    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Convert to Lead (Interactive Action)
export const convertToLead = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await AIInboxMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message thread not found.' });
    }

    // Check if client/lead already exists
    let client = await Client.findOne({ email: msg.senderEmail });
    if (!client) {
      const mcpResult = await executeTool(
        'createLead',
        {
          name: msg.senderName,
          company: msg.subject || 'Imported Lead',
          email: msg.senderEmail || `${msg.senderName.replace(/\s+/g, '').toLowerCase()}@demo.com`,
          phone: msg.senderPhone || '',
          notes: `Automatically created from AI Inbox WhatsApp/Email thread: "${msg.body}"`
        },
        req.user?.role || 'Admin',
        req.tenantId
      );

      if (!mcpResult.success) {
        return res.status(400).json({ success: false, message: mcpResult.message });
      }
      client = mcpResult.data;
    }

    msg.linkedLead = client._id;
    msg.timeline.push({
      action: `Lead created/linked: "${client.name}" in CRM`,
      user: req.user?.name || 'AI System'
    });

    await msg.save();

    if (io) {
      io.emit('updateAIInboxMessage', msg);
    }

    await logAudit({
      req,
      action: 'LEAD_CREATED',
      module: 'AI Inbox',
      entityId: client._id,
      entityLabel: client.name,
      changes: { sourceMessage: msg._id }
    });

    res.json({ success: true, message: 'Lead created successfully', client, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Convert to Ticket (Interactive Action)
export const convertToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await AIInboxMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message thread not found.' });
    }

    const mcpResult = await executeTool(
      'createTicket',
      {
        title: msg.subject || `Support Ticket from ${msg.senderName}`,
        description: msg.body,
        category: 'General',
        priority: msg.sentiment === 'Negative' ? 'High' : 'Medium',
        createdBy: msg.senderEmail || 'inbox@client.com',
        createdByName: msg.senderName
      },
      req.user?.role || 'Admin',
      req.tenantId
    );

    if (!mcpResult.success) {
      return res.status(400).json({ success: false, message: mcpResult.message });
    }
    const ticket = mcpResult.data;

    msg.linkedTicket = ticket._id;
    msg.timeline.push({
      action: `Support ticket #${ticket._id.toString().slice(-6)} created in Helpdesk`,
      user: req.user?.name || 'AI System'
    });

    await msg.save();

    if (io) {
      io.emit('updateAIInboxMessage', msg);
    }

    await logAudit({
      req,
      action: 'TICKET_CREATED',
      module: 'AI Inbox',
      entityId: ticket._id,
      entityLabel: ticket.title,
      changes: { sourceMessage: msg._id }
    });

    res.json({ success: true, message: 'Ticket created successfully', ticket, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Re-assign thread
export const assignMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const msg = await AIInboxMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message thread not found.' });
    }

    const agent = await Admin.findById(userId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    msg.assignedTo = agent._id;
    msg.assignedToName = agent.name;
    msg.timeline.push({
      action: `Thread reassigned to ${agent.name}`,
      user: req.user?.name || 'System'
    });

    await msg.save();

    if (io) {
      io.emit('updateAIInboxMessage', msg);
    }

    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
