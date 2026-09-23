import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = process.env.PORT || 4000;

connectDatabase()
  .then(() => app.listen(port, () => console.log(`Mahreen Explorer API listening on ${port}`)))
  .catch(error => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
