import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
schema: './prisma/schema.prisma',
// You can also explicitly list env files:
// env: { load: ['.env'] },
});