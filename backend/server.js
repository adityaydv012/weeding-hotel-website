import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDB();
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

bootstrap().catch(error => { console.error('Startup failed:', error); process.exit(1); });
