import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const employmentTypes = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE'];

router.get('/', asyncHandler(async (req, res) => {
  const querySchema = z.object({
    search: z.string().optional().default(''),
    employmentType: z.enum(employmentTypes).optional(),
    location: z.string().optional(),
    minSalary: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['newest', 'salary', 'rating']).optional().default('newest'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(8)
  }).safeParse(req.query);

  if (!querySchema.success) return res.status(400).json({ message: 'Invalid search filters.' });
  const { search, employmentType, location, minSalary, sortBy, sortOrder, page, limit } = querySchema.data;

  const where = {
    isActive: true,
    ...(employmentType ? { employmentType } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
    ...(minSalary ? { salaryMax: { gte: minSalary * 100000 } } : {}),
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { skills: { hasSome: [search] } }
      ]
    } : {})
  };

  const orderBy = sortBy === 'salary'
    ? [{ salaryMax: sortOrder }, { createdAt: 'desc' }]
    : sortBy === 'rating'
      ? [{ rating: sortOrder }, { createdAt: 'desc' }]
      : [{ createdAt: sortOrder }];

  const [total, jobs] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where, orderBy, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, title: true, company: true, companyLogo: true, location: true,
        employmentType: true, salaryMin: true, salaryMax: true, salaryCurrency: true,
        experience: true, rating: true, description: true, skills: true, createdAt: true
      }
    })
  ]);

  res.json({
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, isActive: true },
    include: {
      _count: { select: { savedBy: true, applications: true } }
    }
  });
  if (!job) return res.status(404).json({ message: 'Job not found.' });
  res.json({ job });
}));

export default router;
