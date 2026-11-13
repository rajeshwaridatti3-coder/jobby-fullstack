import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jobs = [
  {
    title: 'Frontend Developer Intern',
    company: 'TechNova',
    location: 'Bengaluru, Karnataka',
    employmentType: 'INTERNSHIP',
    salaryMin: 20000, salaryMax: 35000, experience: 'Fresher',
    rating: 4.4,
    description: 'Build accessible, responsive interfaces and collaborate with designers and engineers to ship product features.',
    requirements: ['Pursuing a degree in Computer Science or related field', 'Comfortable with JavaScript and React', 'Basic understanding of REST APIs'],
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Backend Engineer',
    company: 'CloudScale',
    location: 'Hyderabad, Telangana',
    employmentType: 'FULL_TIME',
    salaryMin: 800000, salaryMax: 1200000, experience: '0–2 years',
    rating: 4.2,
    description: 'Design and maintain reliable APIs, write clean services and work with relational databases.',
    requirements: ['Strong programming fundamentals', 'Understanding of HTTP and REST', 'Knowledge of SQL and data structures'],
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Git'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Software Development Intern',
    company: 'BrightByte',
    location: 'Remote',
    employmentType: 'INTERNSHIP',
    salaryMin: 15000, salaryMax: 25000, experience: 'Fresher',
    rating: 4.6,
    description: 'Work on end-to-end product tasks, participate in code reviews and learn engineering best practices.',
    requirements: ['Currently enrolled in an undergraduate program', 'Knowledge of one programming language', 'Problem-solving mindset'],
    skills: ['Java', 'Python', 'Data Structures', 'Git'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'React Developer',
    company: 'PixelWorks',
    location: 'Pune, Maharashtra',
    employmentType: 'FULL_TIME',
    salaryMin: 600000, salaryMax: 900000, experience: '1–3 years',
    rating: 4.1,
    description: 'Create reusable UI components and improve the performance and usability of web applications.',
    requirements: ['Experience with React', 'Understanding of browser fundamentals', 'Ability to work with APIs'],
    skills: ['React', 'TypeScript', 'CSS', 'Testing'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'QA Automation Intern',
    company: 'QualityFirst',
    location: 'Chennai, Tamil Nadu',
    employmentType: 'INTERNSHIP',
    salaryMin: 12000, salaryMax: 20000, experience: 'Fresher',
    rating: 4.0,
    description: 'Help build automated tests and improve product quality through systematic testing.',
    requirements: ['Basic programming knowledge', 'Attention to detail', 'Interest in software testing'],
    skills: ['JavaScript', 'Playwright', 'API Testing', 'Git'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Full Stack Developer',
    company: 'Nimble Systems',
    location: 'Delhi, India',
    employmentType: 'FULL_TIME',
    salaryMin: 700000, salaryMax: 1100000, experience: '1–2 years',
    rating: 4.3,
    description: 'Develop features across the frontend and backend, collaborate with product teams and maintain application quality.',
    requirements: ['React fundamentals', 'Node.js fundamentals', 'SQL and API knowledge'],
    skills: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'UI Engineer',
    company: 'Northstar Labs',
    location: 'Remote',
    employmentType: 'CONTRACT',
    salaryMin: 500000, salaryMax: 800000, experience: '1+ years',
    rating: 4.5,
    description: 'Implement high-quality interfaces from design systems and maintain reusable components.',
    requirements: ['Strong CSS skills', 'JavaScript knowledge', 'Responsive design experience'],
    skills: ['JavaScript', 'CSS', 'React', 'Accessibility'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Data Engineering Intern',
    company: 'DataBridge',
    location: 'Mumbai, Maharashtra',
    employmentType: 'INTERNSHIP',
    salaryMin: 18000, salaryMax: 28000, experience: 'Fresher',
    rating: 4.2,
    description: 'Assist with data pipelines, SQL queries and data quality checks.',
    requirements: ['SQL basics', 'Python basics', 'Analytical thinking'],
    skills: ['Python', 'SQL', 'PostgreSQL', 'ETL'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Java Developer',
    company: 'Aster Technologies',
    location: 'Noida, Uttar Pradesh',
    employmentType: 'FULL_TIME',
    salaryMin: 650000, salaryMax: 950000, experience: '0–2 years',
    rating: 4.0,
    description: 'Build backend services and contribute to maintainable application architecture.',
    requirements: ['Core Java', 'OOP concepts', 'Basic SQL'],
    skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'],
    companyWebsite: 'https://example.com'
  },
  {
    title: 'Product Engineering Trainee',
    company: 'Orbit Apps',
    location: 'Patna, Bihar',
    employmentType: 'FULL_TIME',
    salaryMin: 350000, salaryMax: 500000, experience: 'Fresher',
    rating: 3.9,
    description: 'Learn the product development lifecycle while contributing to frontend and backend tasks.',
    requirements: ['Programming fundamentals', 'Communication skills', 'Willingness to learn'],
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    companyWebsite: 'https://example.com'
  }
];

async function main() {
  const passwordHash = await bcrypt.hash('Demo@123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@jobby.dev' },
    update: {},
    create: { name: 'Demo User', email: 'demo@jobby.dev', passwordHash }
  });

  for (const job of jobs) {
    const existing = await prisma.job.findFirst({ where: { title: job.title, company: job.company } });
    if (!existing) await prisma.job.create({ data: job });
  }
  console.log('Seed complete. Demo login: demo@jobby.dev / Demo@123');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());
