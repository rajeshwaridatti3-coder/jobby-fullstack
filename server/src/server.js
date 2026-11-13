import 'dotenv/config';
import app from './app.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters.');
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Jobby API listening on port ${port}`));
