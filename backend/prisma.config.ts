import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
schema: './prisma/schema.prisma',
// Optional: explicitly list env files if you want
// env: { load: ['.env'] },
});