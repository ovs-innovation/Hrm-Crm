# AI Voice Assistant Roadmap (HRM CRM)

This document maps out the implementation plan and phases for integrating the AI Voice Assistant in the Vastora HRM CRM system.

---

## 📅 Completed Phases

### Phase 1 — AI Chat Assistant (Free) ✅
- Gemini 2.5 Flash API backend integrations.
- Role-based access and conversational history logs.
- Floating AI Assistant chat interface.

### Phase 2 — Tool Calling (Free) ✅
- Model context protocol (MCP) tool execution.
- Auto-routing based on user intent (e.g., retrieving attendance, checking leaves).

### Phase 3 — Voice Assistant (Free) 🎤 ✅
- Integrated Web Speech API for browser-based Speech to Text (STT).
- Integrated SpeechSynthesis API for browser-based Text to Speech (TTS) responses.
- Added Voice feedback mute/unmute control and mic triggers.

---

## 🚀 Voice Assistant Upgrades (Phase 3.x - Planned)

The following refinements will be added to the Voice Assistant before moving to advanced automation:

### Phase 3.1 — Wake Word Trigger ("Hey Vastora")
- Implement client-side hotword detection so the browser microphone automatically starts listening when the user says *"Hey Vastora"*.

### Phase 3.2 — Continuous Conversation (Hands-Free)
- Support continuous stream listening so the user doesn't need to manually press the microphone button for consecutive commands.
- Keep the voice session open while the user is interactively speaking and the AI is responding.

### Phase 3.3 — Voice Tool Navigation
- Execute client-side routing based on voice intents (e.g., saying *"Create invoice"* automatically navigates the React router to the Invoice Creation panel).

### Phase 3.4 — Siri/ChatGPT Style Voice Wave Animation
- Replace the standard CSS pulsing dot with a high-fidelity dynamic visual soundwave animation that changes state based on speech audio volume.

### Phase 3.5 — AI Thinking States
- Standardize visual states during execution:
  - 🎤 `Listening...` (Microphone input capturing)
  - 🧠 `Understanding...` (LLM processing intent)
  - ⚡ `Executing...` (MCP or route action running)
  - ✅ `Done.` (Action completed, TTS feedback speaking)

### Phase 3.6 — Context Memory
- Track currently focused records (e.g., *"Open Rahul"* sets the active employee context to *Rahul*; saying *"Show his attendance"* correctly resolves *"his"* to *Rahul*).

### Phase 3.7 — Voice Customization Settings
- Add user settings panel for adjusting:
  - Interface Language
  - TTS Voice profile (accent, gender)
  - Speed & Pitch of speech
  - Mic inputs
  - "Always Listen" / Wake Word toggles

### Phase 3.8 — Role-based Permissions & Safety Guards
- Block sensitive commands based on the user's role (e.g., if a sales executive says *"Delete employee"*, the AI replies *"Permission Denied"*).

---

## 🛠 Next Milestone: Phase 4 — Company Knowledge (RAG) 📚
- **Stack**: ChromaDB / FAISS + Gemini Embeddings + Express Backend.
- Upload company policy PDFs, employee handbooks, and SOPs.
- RAG system to enable the AI Receptionist to answer HR/Policy queries using only uploaded company documents.

---

## 🔮 Future Roadmap (Phase 5 to 13)
* **Phase 5 — Smart Memory**: Retain context across sessions (last viewed invoice, last lead search, etc.).
* **Phase 6 — HR Agent**: Execute leave requests, payroll summaries, shift rosters.
* **Phase 7 — CRM Agent**: Manage leads, update deals, show follow-ups.
* **Phase 8 — Finance Agent**: Generate revenue reports, expense sheets, GST summaries.
* **Phase 9 — Workflow Automation**: Multi-step triggers (e.g., Onboarding: creates user -> assigns dept -> sends welcome email -> generates ID card).
* **Phase 10 — AI Document Generator**: Produce formal PDFs (Offer Letters, Payslips, Quotations) on demand.
* **Phase 11 — Dashboard Insights**: Natural language queries about business health (e.g., *"Who was absent today?"*).
* **Phase 12 — Multi-Agent System**: Collaborative specialized agents operating under a single coordinator.
* **Phase 13 — Paid Features**: Speaker verification, ElevenLabs custom voices, real-time telephony integrations.
