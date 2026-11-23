import express from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { requireInfraAdmin } from '../middleware/requireInfraAdmin.js';
import * as ctrl from '../controllers/infraController.js';

const router = express.Router();

/** Agent push — token auth inside handler (no JWT) */
router.post('/agent/metrics', ctrl.agentIngestMetrics);
router.post('/agent/ingest', ctrl.agentIngestMetrics);

router.use(protect, requireInfraAdmin);

router.get('/dashboard', ctrl.getDashboard);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.putSettings);
router.post('/settings/test-provider', ctrl.testProvider);
router.post('/settings/sync-servers', ctrl.syncProviderServers);

router.get('/metrics', ctrl.getMetrics);

router.get('/servers', ctrl.listServers);
router.post('/servers', ctrl.createServer);
router.get('/servers/:id', ctrl.getServer);
router.put('/servers/:id', ctrl.updateServer);
router.delete('/servers/:id', ctrl.deleteServer);
router.post('/servers/:id/metrics', ctrl.pushServerMetrics);

router.get('/websites', ctrl.listWebsites);
router.post('/websites', ctrl.createWebsite);
router.get('/websites/:id', ctrl.getWebsite);
router.put('/websites/:id', ctrl.updateWebsite);
router.delete('/websites/:id', ctrl.deleteWebsite);
router.post('/websites/:id/check', ctrl.checkWebsiteNow);

router.get('/services', ctrl.listServices);
router.post('/services', ctrl.createService);
router.get('/services/:id', ctrl.getService);
router.put('/services/:id', ctrl.updateService);
router.delete('/services/:id', ctrl.deleteService);

router.get('/domains', ctrl.listDomains);
router.post('/domains', ctrl.createDomain);
router.post('/domains/refresh', ctrl.refreshDomainsNow);
router.get('/domains/:id', ctrl.getDomain);
router.put('/domains/:id', ctrl.updateDomain);
router.post('/domains/:id/approve-client-mail', ctrl.approveDomainClientMail);
router.delete('/domains/:id', ctrl.deleteDomain);

router.get('/ssl', ctrl.listSsl);
router.post('/ssl', ctrl.createSsl);
router.post('/ssl/refresh', ctrl.refreshSslNow);
router.get('/ssl/:id', ctrl.getSsl);
router.put('/ssl/:id', ctrl.updateSsl);
router.delete('/ssl/:id', ctrl.deleteSsl);

router.get('/backups', ctrl.listBackups);
router.post('/backups', ctrl.createBackup);
router.get('/backups/:id', ctrl.getBackup);
router.put('/backups/:id', ctrl.updateBackup);
router.delete('/backups/:id', ctrl.deleteBackup);

router.get('/incidents', ctrl.getIncidents);
router.patch('/incidents/:id', ctrl.patchIncident);

router.get('/alerts', ctrl.getAlerts);
router.patch('/alerts/:id/resolve', ctrl.patchAlert);

router.get('/logs', ctrl.getLogs);
router.get('/logs/export', ctrl.exportLogs);

export default router;
