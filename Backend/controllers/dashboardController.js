import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import Task from '../models/Task.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Attendance from '../models/Attendance.js';
import Ticket from '../models/Ticket.js';
import Payslip from '../models/Payslip.js';

const OPEN_STAGES = ['Qualification', 'Proposal', 'Negotiation'];
const ALL_STAGES = [...OPEN_STAGES, 'Closed Won', 'Closed Lost'];

const rangeToDays = (range) => {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  if (range === 'ytd') {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  }
  if (range === 'all') return 3650;
  return 30;
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatWeekLabel = (date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const getReportsAnalytics = async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const days = rangeToDays(range);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      deals,
      dealsInRange,
      clients,
      clientsInRange,
      employees,
      leaves,
      tickets,
      tasksDue,
      tasksOpen,
    ] = await Promise.all([
      Deal.find({}),
      Deal.find({ createdAt: { $gte: since } }),
      Client.find({}),
      Client.find({ createdAt: { $gte: since } }),
      Employee.find({}).select('department designation role'),
      LeaveRequest.find({}),
      Ticket.find({}),
      Task.countDocuments({
        status: { $ne: 'Completed' },
        dueDate: { $lte: today },
      }),
      Task.countDocuments({ status: { $ne: 'Completed' } }),
    ]);

    const leads = clients.filter((c) => c.status === 'Lead').length;
    const accounts = clients.filter((c) => c.status === 'Active').length;
    const newLeads = clients.filter((c) => c.status === 'Lead' && c.createdAt >= weekAgo).length;
    const newLeadsInRange = clientsInRange.filter((c) => c.status === 'Lead').length;

    const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage));
    const closedWon = deals.filter((d) => d.stage === 'Closed Won');
    const closedLost = deals.filter((d) => d.stage === 'Closed Lost');
    const wonInRange = dealsInRange.filter((d) => d.stage === 'Closed Won');
    const revenueWon = closedWon.reduce((s, d) => s + (d.amount || 0), 0);
    const revenueWonInRange = wonInRange.reduce((s, d) => s + (d.amount || 0), 0);
    const pipelineValue = openDeals.reduce((s, d) => s + (d.amount || 0), 0);
    const avgDealSize = deals.length
      ? Math.round(deals.reduce((s, d) => s + (d.amount || 0), 0) / deals.length)
      : 0;
    const closedCount = closedWon.length + closedLost.length;
    const winRate = closedCount ? Math.round((closedWon.length / closedCount) * 100) : 0;

    const pipelineByStage = ALL_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      };
    });

    const maxPipelineValue = Math.max(...pipelineByStage.map((s) => s.value), 1);

    const weeklyDeals = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(new Date());
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = deals.filter((d) => d.createdAt >= weekStart && d.createdAt < weekEnd).length;
      const value = deals
        .filter((d) => d.createdAt >= weekStart && d.createdAt < weekEnd)
        .reduce((s, d) => s + (d.amount || 0), 0);
      weeklyDeals.push({ label: formatWeekLabel(weekStart), count, value });
    }
    const maxWeeklyDeals = Math.max(...weeklyDeals.map((w) => w.count), 1);

    const weeklyLeads = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(new Date());
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = clients.filter(
        (c) => c.status === 'Lead' && c.createdAt >= weekStart && c.createdAt < weekEnd
      ).length;
      weeklyLeads.push({ label: formatWeekLabel(weekStart), count });
    }
    const maxWeeklyLeads = Math.max(...weeklyLeads.map((w) => w.count), 1);

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const present = await Attendance.countDocuments({
        date: dateStr,
        checkIn: { $exists: true, $ne: null },
      });
      attendanceTrend.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        present,
      });
    }
    const maxAttendance = Math.max(...attendanceTrend.map((a) => a.present), employees.length, 1);

    const deptMap = {};
    employees.forEach((e) => {
      const dept = e.department || 'Unassigned';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentBreakdown = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const maxDept = Math.max(...departmentBreakdown.map((d) => d.count), 1);

    const leaveByStatus = ['Pending', 'Approved', 'Rejected'].map((status) => ({
      status,
      count: leaves.filter((l) => l.status === status).length,
    }));

    const ticketByStatus = ['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => ({
      status,
      count: tickets.filter((t) => t.status === status).length,
    }));

    const presentToday = await Attendance.countDocuments({
      date: today,
      checkIn: { $exists: true, $ne: null },
    });

    const recentDeals = [...deals]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((d) => ({
        id: d._id,
        title: d.title,
        stage: d.stage,
        amount: d.amount || 0,
        clientName: d.clientName,
        createdAt: d.createdAt,
      }));

    res.json({
      range,
      generatedAt: new Date().toISOString(),
      crm: {
        pipelineValue,
        openDeals: openDeals.length,
        revenueWon,
        revenueWonInRange,
        winRate,
        avgDealSize,
        leads,
        newLeads,
        newLeadsInRange,
        accounts,
        tasksDue,
        tasksOpen,
        pipelineByStage,
        maxPipelineValue,
        weeklyDeals,
        maxWeeklyDeals,
        weeklyLeads,
        maxWeeklyLeads,
        recentDeals,
      },
      hrm: {
        employees: employees.length,
        presentToday,
        attendanceRate: employees.length
          ? Math.round((presentToday / employees.length) * 100)
          : 0,
        pendingLeaves: leaves.filter((l) => l.status === 'Pending').length,
        openTickets: tickets.filter((t) => ['Open', 'In Progress'].includes(t.status)).length,
        attendanceTrend,
        maxAttendance,
        departmentBreakdown,
        maxDept,
        leaveByStatus,
        ticketByStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const STAGE_META = {
  Qualification: { weight: 0.2, probability: '20%', hint: 'Discovery — validating need, budget and decision maker.' },
  Proposal: { weight: 0.5, probability: '50%', hint: 'Proposal or quote shared — awaiting customer review.' },
  Negotiation: { weight: 0.75, probability: '75%', hint: 'Terms and pricing under active discussion.' },
  'Closed Won': { weight: 1, probability: '100%', hint: 'Deal signed — revenue can be recognized.' },
  'Closed Lost': { weight: 0, probability: '0%', hint: 'Opportunity closed without a sale.' },
};

const daysSince = (date) => {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
};

const clientDealStats = (clientId, deals) => {
  const id = clientId?.toString();
  const linked = deals.filter((d) => {
    const cid = d.client?._id?.toString() || d.client?.toString();
    return cid === id;
  });
  const open = linked.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = linked.filter((d) => d.stage === 'Closed Won');
  const lost = linked.filter((d) => d.stage === 'Closed Lost');
  return {
    dealCount: linked.length,
    openDeals: open.length,
    openPipelineValue: open.reduce((s, d) => s + (d.amount || 0), 0),
    wonDeals: won.length,
    wonRevenue: won.reduce((s, d) => s + (d.amount || 0), 0),
    lostDeals: lost.length,
    lastDealAt: linked.length
      ? linked.reduce((max, d) => (new Date(d.updatedAt) > new Date(max) ? d.updatedAt : max), linked[0].updatedAt)
      : null,
  };
};

export const getSalesReportDetail = async (req, res) => {
  try {
    const now = new Date();
    const [dealsRaw, clients] = await Promise.all([
      Deal.find({}).populate('client', 'name company email phone status').sort({ updatedAt: -1 }),
      Client.find({}).sort({ createdAt: -1 }),
    ]);

    const deals = dealsRaw.map((d) => {
      const meta = STAGE_META[d.stage] || STAGE_META.Qualification;
      const isOpen = OPEN_STAGES.includes(d.stage);
      const expected = d.expectedCloseDate ? new Date(d.expectedCloseDate) : null;
      return {
        _id: d._id,
        title: d.title,
        amount: d.amount || 0,
        weightedAmount: Math.round((d.amount || 0) * meta.weight),
        stage: d.stage,
        stageProbability: meta.probability,
        stageHint: meta.hint,
        client: d.client,
        clientName: d.clientName || (d.client ? `${d.client.name} · ${d.client.company}` : null),
        clientEmail: d.client?.email || null,
        clientPhone: d.client?.phone || null,
        expectedCloseDate: d.expectedCloseDate,
        expectedCloseLabel: expected
          ? expected.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
        isOverdue: Boolean(isOpen && expected && expected < now),
        daysOpen: daysSince(d.createdAt),
        daysInStage: daysSince(d.updatedAt),
        owner: d.owner || 'Unassigned',
        notes: d.notes || '',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    const leads = clients
      .filter((c) => c.status === 'Lead')
      .map((c) => {
        const stats = clientDealStats(c._id, dealsRaw);
        const age = daysSince(c.createdAt);
        return {
          _id: c._id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone || '—',
          status: c.status,
          notes: c.notes || '',
          createdAt: c.createdAt,
          ageDays: age,
          ageLabel: age === 0 ? 'Today' : `${age}d`,
          isStale: age >= 30,
          staleLabel: age >= 30 ? 'Needs follow-up' : age >= 14 ? 'Warm' : 'New',
          ...stats,
        };
      });

    const accounts = clients
      .filter((c) => c.status !== 'Lead')
      .map((c) => {
        const stats = clientDealStats(c._id, dealsRaw);
        const age = daysSince(c.createdAt);
        return {
          _id: c._id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone || '—',
          status: c.status,
          notes: c.notes || '',
          createdAt: c.createdAt,
          customerSinceDays: age,
          customerSinceLabel: new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          ...stats,
        };
      });

    const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage));
    const closedWon = deals.filter((d) => d.stage === 'Closed Won');
    const closedLost = deals.filter((d) => d.stage === 'Closed Lost');
    const closedCount = closedWon.length + closedLost.length;

    const stageBreakdown = ALL_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const meta = STAGE_META[stage];
      const value = stageDeals.reduce((s, d) => s + d.amount, 0);
      return {
        stage,
        count: stageDeals.length,
        value,
        weightedValue: stageDeals.reduce((s, d) => s + d.weightedAmount, 0),
        probability: meta.probability,
        hint: meta.hint,
      };
    });

    const avgWonCycle = closedWon.length
      ? Math.round(closedWon.reduce((s, d) => s + (d.daysOpen || 0), 0) / closedWon.length)
      : 0;

    const owners = [...new Set(deals.map((d) => d.owner).filter(Boolean))];

    res.json({
      generatedAt: now.toISOString(),
      summary: {
        totalLeads: leads.length,
        staleLeads: leads.filter((l) => l.isStale).length,
        totalAccounts: accounts.filter((a) => a.status === 'Active').length,
        inactiveAccounts: accounts.filter((a) => a.status === 'Inactive').length,
        openDeals: openDeals.length,
        pipelineValue: openDeals.reduce((s, d) => s + d.amount, 0),
        weightedPipeline: openDeals.reduce((s, d) => s + d.weightedAmount, 0),
        revenueWon: closedWon.reduce((s, d) => s + d.amount, 0),
        revenueLost: closedLost.reduce((s, d) => s + d.amount, 0),
        winRate: closedCount ? Math.round((closedWon.length / closedCount) * 100) : 0,
        avgDealSize: deals.length ? Math.round(deals.reduce((s, d) => s + d.amount, 0) / deals.length) : 0,
        avgWonCycleDays: avgWonCycle,
        overdueDeals: deals.filter((d) => d.isOverdue).length,
        leadsWithDeals: leads.filter((l) => l.dealCount > 0).length,
        conversionHint:
          leads.length + accounts.length
            ? `${Math.round((accounts.filter((a) => a.status === 'Active').length / (leads.length + accounts.length)) * 100)}% of CRM records are active accounts`
            : 'Add leads to start tracking conversion',
      },
      stageBreakdown,
      owners,
      deals,
      leads,
      accounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [leads, accounts, openDeals, deals, tasksDue] = await Promise.all([
      Client.countDocuments({ status: 'Lead' }),
      Client.countDocuments({ status: 'Active' }),
      Deal.find({ stage: { $in: OPEN_STAGES } }),
      Deal.find({}),
      Task.countDocuments({
        status: { $ne: 'Completed' },
        dueDate: { $lte: new Date().toISOString().split('T')[0] },
      }),
    ]);

    const newLeads = await Client.countDocuments({ status: 'Lead', createdAt: { $gte: weekAgo } });

    const pipelineByStage = OPEN_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      };
    });

    const closedWon = deals.filter((d) => d.stage === 'Closed Won');
    pipelineByStage.push({
      stage: 'Closed Won',
      count: closedWon.length,
      value: closedWon.reduce((sum, d) => sum + (d.amount || 0), 0),
    });

    res.json({
      openDeals: openDeals.length,
      pipelineValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      leads,
      newLeads,
      accounts,
      tasksDue,
      pipelineByStage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHrmStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [employees, pendingLeaves, presentToday, openTickets, draftPayslips] = await Promise.all([
      Employee.countDocuments({}),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Attendance.countDocuments({ date: today, checkIn: { $exists: true, $ne: null } }),
      Ticket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
      Payslip.countDocuments({ status: 'Draft' }),
    ]);

    res.json({ employees, pendingLeaves, presentToday, openTickets, draftPayslips });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId query param is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const [tasks, pendingLeaves, todayAttendance, monthAttendance, payslips] = await Promise.all([
      Task.find({ assignedTo: employeeId, status: { $ne: 'Completed' } }),
      LeaveRequest.countDocuments({ employeeId, status: 'Pending' }),
      Attendance.findOne({ employeeId, date: today }),
      Attendance.countDocuments({ employeeId, date: { $regex: `^${month}` }, checkIn: { $exists: true } }),
      Payslip.find({ employeeId }).sort({ month: -1 }).limit(3),
    ]);

    res.json({
      openTasks: tasks.length,
      pendingLeaves,
      checkedInToday: Boolean(todayAttendance?.checkIn),
      checkedOutToday: Boolean(todayAttendance?.checkOut),
      daysPresentThisMonth: monthAttendance,
      recentPayslips: payslips,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
