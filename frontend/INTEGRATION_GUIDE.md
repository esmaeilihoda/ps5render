# PS5 Tournament Frontend - Backend Integration Guide

## Overview
This frontend has been integrated with your PS5 eFootball Cup backend. The integration includes API service layer, custom hooks, and automatic data fetching from the backend API.

## Configuration

### Environment Variables
The following environment variables are required in `.env`:

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:3000
```

Update `VITE_API_BASE_URL` to match your backend URL:
- Local development: `http://localhost:3000`
- Production: `https://your-api-domain.com`

## API Integration

### Service Layer (`src/services/api.js`)
All API endpoints are centralized in a service module with methods for:

- **Players**: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- **Groups**: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- **Matches**: `getAll()`, `getById()`, `getByGroupId()`, `create()`, `update()`, `delete()`
- **Reports**: `getAll()`, `getBySlug()`, `create()`, `update()`, `delete()`
- **Comments**: `create()`, `delete()`
- **Upload**: `uploadFile()`
- **Auth**: `login()`, `logout()`

### Usage Example
```javascript
import { api } from '../services/api';

// Fetch all players
const players = await api.players.getAll();

// Create a new player
const newPlayer = await api.players.create({
  fullName: 'John Doe',
  groupId: 'group-1'
});

// Upload a file
const response = await api.upload.uploadFile(file);
console.log(response.url); // File URL
```

## Custom Hooks

### useTournaments Hook (`src/hooks/useTournaments.js`)
Fetches and formats tournament data from groups and matches.

```javascript
import { useTournaments } from '../hooks/useTournaments';

function TournamentsComponent() {
  const { tournaments, groups, loading, error, refetch } = useTournaments();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tournaments.map(tournament => (
        <div key={tournament.id}>{tournament.game}</div>
      ))}
    </div>
  );
}
```

### useLeaderboard Hook (`src/hooks/useLeaderboard.js`)
Fetches player data and formats it for leaderboard display.

```javascript
import { useLeaderboard } from '../hooks/useLeaderboard';

function LeaderboardComponent() {
  const { players, loading, error, refetch } = useLeaderboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {players.map(player => (
        <div key={player.rank}>{player.name} - {player.wins} wins</div>
      ))}
    </div>
  );
}
```

## Data Flow

### Tournament Page Flow
1. `useTournaments()` hook runs on component mount
2. Fetches groups and matches from backend API
3. Transforms API data to frontend format
4. Displays tournaments with filtering and search

### Leaderboard Page Flow
1. `useLeaderboard()` hook runs on component mount
2. Fetches all players from backend API
3. Formats player data with calculated stats
4. Sorts by wins and displays in ranking order

## Error Handling

All API calls include automatic error handling:

```javascript
try {
  const data = await api.players.getAll();
} catch (error) {
  console.error('Failed to fetch players:', error.message);
}
```

The hooks expose `error` state for UI display:

```javascript
const { players, loading, error } = useLeaderboard();

if (error) {
  return <ErrorComponent message={error} />;
}
```

## Loading States

Both hooks provide `loading` state for displaying loading indicators:

```javascript
const { tournaments, loading } = useTournaments();

return loading ? <Skeleton /> : <TournamentGrid data={tournaments} />;
```

## Internationalization (i18n)

The frontend includes full Persian (Farsi) and English translations with RTL support.

### Language Switching
Language can be changed via the navbar dropdown. The selection is saved to localStorage.

### Adding New Translations
Edit `src/i18n/translations.js`:

```javascript
export const translations = {
  en: {
    mySection: {
      myText: 'Hello World'
    }
  },
  fa: {
    mySection: {
      myText: 'سلام جهان'
    }
  }
};
```

### Using Translations in Components
```javascript
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('mySection.myText')}</h1>;
}
```

## Backend API Expectations

Your backend should expose the following endpoints:

### Players
- `GET /api/players` - List all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Groups (Tournaments)
- `GET /api/groups` - List all tournament groups
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Matches
- `GET /api/matches` - List all matches
- `GET /api/matches/:id` - Get match by ID
- `GET /api/groups/:groupId/matches` - Get matches for a group
- `POST /api/matches` - Create match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/:slug` - Get report by slug
- `POST /api/reports` - Create report
- `PUT /api/reports/:slug` - Update report
- `DELETE /api/reports/:slug` - Delete report

### Comments
- `POST /api/reports/:reportSlug/comments` - Create comment
- `DELETE /api/comments/:commentId` - Delete comment

### Upload
- `POST /api/upload` - Upload file (multipart/form-data)

### Auth
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout

## Response Format

The API should return JSON responses in this format:

```json
{
  "id": "player-1",
  "fullName": "John Doe",
  "groupId": "group-1"
}
```

For lists:
```json
[
  { "id": "player-1", "fullName": "John Doe", "groupId": "group-1" },
  { "id": "player-2", "fullName": "Jane Doe", "groupId": "group-1" }
]
```

## CORS Configuration

Ensure your backend allows CORS requests from the frontend domain:

```javascript
// Backend CORS config
cors: {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}
```

## Development Workflow

1. Start your backend: `npm run dev` (from backend directory)
2. Start your frontend: `npm run dev` (from frontend directory)
3. Frontend will connect to `http://localhost:3000` by default
4. Open browser to `http://localhost:5173`

## Production Deployment

1. Update `VITE_API_BASE_URL` in `.env.production` to your production API URL
2. Build frontend: `npm run build`
3. Deploy `dist/` folder to your hosting service
4. Ensure CORS is configured in your backend for the production domain

## Troubleshooting

### API Connection Issues
- Verify backend is running on the correct port
- Check `VITE_API_BASE_URL` in `.env`
- Check browser console for CORS errors
- Verify backend CORS configuration

### Data Not Loading
- Check Network tab in browser DevTools
- Verify API endpoints return correct data format
- Check hook error state: `if (error) console.log(error)`

### Language Not Switching
- Clear localStorage and refresh
- Check language code in language selector
- Verify translations exist in `src/i18n/translations.js`

## Performance Optimization

- Hooks implement error handling and state management
- Data is cached via React hooks on component mount
- Use `refetch()` to manually refresh data
- API calls use native `fetch` (no additional libraries needed)

## Next Steps

1. Verify all backend API endpoints match the expected format
2. Test API connections with browser DevTools Network tab
3. Add more custom hooks as needed for other pages
4. Implement error boundaries for better UX
5. Add loading skeleton components for better perceived performance
