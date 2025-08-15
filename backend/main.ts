import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { connectDatabase, appConfig } from './shared/config/database';
import { authenticate } from './shared/middlewares/auth';

// Routes
import authRoutes from './modules/auth/controller/authRoutes';
import userRoutes from './modules/users/controller/userRoutes';
import customerRoutes from './modules/customers/controller/customerRoutes';
import partnerRoutes from './modules/partners/controller/partnerRoutes';
import auditRoutes from './modules/audit/controller/auditRoutes';
import requestRoutes from './modules/requests/controller/RequestRoutes';
import documentRoutes from './modules/requests/controller/DocumentRoutes';
import gateRoutes from './modules/gate/controller/GateRoutes';
import yardRoutes from './modules/yard/controller/YardRoutes';
import forkliftRoutes from './modules/forklift/controller/ForkliftRoutes';
import containerRoutes from './modules/containers/controller/ContainerRoutes';
import maintenanceRoutes from './modules/maintenance/controller/MaintenanceRoutes';
import financeRoutes from './modules/finance/controller/FinanceRoutes';
import reportsRoutes from './modules/reports/controller/ReportsRoutes';

const app = express();
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:1100', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging to file
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', authenticate, userRoutes);
app.use('/customers', authenticate, customerRoutes);
app.use('/partners', authenticate, partnerRoutes);
app.use('/audit', authenticate, auditRoutes);
app.use('/requests', authenticate, requestRoutes);
app.use('/requests', documentRoutes);
app.use('/gate', gateRoutes);
app.use('/yard', yardRoutes);
app.use('/forklift', forkliftRoutes);
app.use('/containers', containerRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/finance', financeRoutes);
app.use('/reports', reportsRoutes);

const start = async () => {
	await connectDatabase();
	app.listen(appConfig.port, () => console.log(`[API] listening on ${appConfig.port}`));
};

start();

export default app;
