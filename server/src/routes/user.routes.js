import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/saved-jobs', asyncHandler(async (req, res) => {
  const rows = await prisma.savedJob.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { job: true }
  });
  res.json({ jobs: rows.map((row) => ({ ...row.job, savedAt: row.createdAt })) });
}));

router.post('/saved-jobs/:jobId', asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found.' });
  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: req.user.id, jobId: job.id } },
    update: {},
    create: { userId: req.user.id, jobId: job.id }
  });
  res.status(201).json({ message: 'Job saved successfully.' });
}));

router.delete('/saved-jobs/:jobId', asyncHandler(async (req, res) => {
  await prisma.savedJob.deleteMany({ where: { userId: req.user.id, jobId: req.params.jobId } });
  res.json({ message: 'Saved job removed.' });
}));

router.get('/applications', asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    include: { job: true }
  });
  res.json({ applications });
}));

router.post('/applications', asyncHandler(async (req, res) => {
  const parsed = z.object({
    jobId: z.string().min(1),
    notes: z.string().max(1000).optional().default('')
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'A valid job is required.' });

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found.' });

  const existing = await prisma.application.findUnique({
    where: { userId_jobId: { userId: req.user.id, jobId: job.id } }
  });
  if (existing) return res.status(409).json({ message: 'You are already tracking this job.' });

  const application = await prisma.application.create({
    data: { userId: req.user.id, jobId: job.id, notes: parsed.data.notes }
  });
  res.status(201).json({ application });
}));

router.patch('/applications/:id', asyncHandler(async (req, res) => {
  const parsed = z.object({
    status: z.enum(['APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN']),
    notes: z.string().max(1000).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid application update.' });

  const result = await prisma.application.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: parsed.data
  });
  if (!result.count) return res.status(404).json({ message: 'Application not found.' });
  const application = await prisma.application.findUnique({
    where: { id: req.params.id }, include: { job: true }
  });
  res.json({ application });
}));

router.delete('/applications/:id', asyncHandler(async (req, res) => {
  const result = await prisma.application.deleteMany({
    where: { id: req.params.id, userId: req.user.id }
  });
  if (!result.count) return res.status(404).json({ message: 'Application not found.' });
  res.json({ message: 'Application tracking entry deleted.' });
}));

router.post('/activity/recent/:jobId', asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found.' });
  await prisma.recentView.upsert({
    where: { userId_jobId: { userId: req.user.id, jobId: job.id } },
    update: { viewedAt: new Date() },
    create: { userId: req.user.id, jobId: job.id }
  });
  res.json({ message: 'Recent activity updated.' });
}));

router.get('/activity/recent', asyncHandler(async (req, res) => {
  const rows = await prisma.recentView.findMany({
    where: { userId: req.user.id },
    orderBy: { viewedAt: 'desc' },
    take: 10,
    include: { job: true }
  });
  res.json({ jobs: rows.map((row) => ({ ...row.job, viewedAt: row.viewedAt })) });
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [savedCount, applicationCount, interviewCount, offerCount, recent] = await Promise.all([
    prisma.savedJob.count({ where: { userId } }),
    prisma.application.count({ where: { userId } }),
    prisma.application.count({ where: { userId, status: 'INTERVIEWING' } }),
    prisma.application.count({ where: { userId, status: 'OFFERED' } }),
    prisma.recentView.findMany({
      where: { userId }, orderBy: { viewedAt: 'desc' }, take: 5, include: { job: true }
    })
  ]);
  res.json({
    stats: { savedCount, applicationCount, interviewCount, offerCount },
    recentJobs: recent.map((row) => row.job)
  });
}));

export default router;
