export const GAMES_CONFIG = {
  'fc-26': {
    title: 'EA Sports FC 26',
    description: "The world's game brought to life. Experience the pinnacle of football simulation with hyper-realistic gameplay, authentic leagues, and intense competitive action. Build your ultimate team and compete for glory on the global stage.",
    rules: 'Standard FIFA rules apply. All matches are played online in FUT Champions or Seasons mode. Fair play is mandatory. No glitching, exploits, or unsportsmanlike conduct. Disconnects count as forfeits unless verified network issues.',
    modes: [
      { name: '1v1 Kick Off', desc: 'Classic head-to-head matches', icon: 'Gamepad2' },
      { name: 'FUT Draft', desc: 'Build your dream squad and compete', icon: 'Trophy' },
      { name: 'Online Seasons', desc: 'Climb divisions for prizes', icon: 'TrendingUp' },
      { name: 'Pro Clubs', desc: 'Team-based competitive play', icon: 'Users' }
    ],
    gradient: 'linear-gradient(135deg, #00a651 0%, #005a2e 50%, #001a0d 100%)',
    accentColor: '#00ff87'
  },
  'cod-warzone': {
    title: 'Call of Duty: Warzone',
    description: 'Drop into the warzone and fight for survival. Experience the ultimate battle royale with tactical gameplay, high-stakes combat, and massive 150-player battles. Only the strongest squads will claim victory and the prize.',
    rules: 'Battle Royale format with standard Warzone rules. No cheating, hacking, or exploits allowed. Teams must register all members before match start. Kill count and placement determine winners. Stream sniping results in immediate disqualification.',
    modes: [
      { name: 'Solo BR', desc: 'Every player for themselves', icon: 'Target' },
      { name: 'Duo Squads', desc: 'Partner up and dominate', icon: 'Users' },
      { name: 'Trios', desc: 'Three-person tactical teams', icon: 'Shield' },
      { name: 'Quads', desc: 'Full squad mayhem', icon: 'Zap' }
    ],
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #8b0000 50%, #1a0000 100%)',
    accentColor: '#ff6b35'
  },
  'battlefield-6': {
    title: 'Battlefield 6',
    description: 'Experience massive warfare on an unprecedented scale. Join epic 128-player battles across dynamic environments with destructible terrain, weather systems, and all-out vehicular combat. Teamwork and strategy are your keys to victory.',
    rules: 'Conquest mode with standard Battlefield ruleset. Teams of 64 compete for map control. Vehicles allowed per server config. Voice communication encouraged. Team-killing or griefing results in bans. Respect server rules and admin decisions.',
    modes: [
      { name: 'Conquest', desc: 'Capture and hold objectives', icon: 'Flag' },
      { name: 'Breakthrough', desc: 'Push through enemy lines', icon: 'Zap' },
      { name: 'Team Deathmatch', desc: 'Pure combat mayhem', icon: 'Crosshair' },
      { name: 'Hazard Zone', desc: 'High-stakes squad extraction', icon: 'AlertTriangle' }
    ],
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #0a1929 100%)',
    accentColor: '#6dd5ed'
  },
  'fortnite': {
    title: 'Fortnite',
    description: "Build, battle, and outlast your opponents in the world's most popular battle royale. Master building mechanics, sharpen your aim, and adapt to constant meta shifts. Victory Royale awaits the most skilled and creative players.",
    rules: 'Battle Royale or Arena mode. Solo, Duos, or Squads depending on tournament format. Teaming in solos is strictly forbidden. Players must use allowed cosmetics only (no pay-to-win skins). Stream delay of 2+ minutes recommended to prevent stream sniping.',
    modes: [
      { name: 'Solo BR', desc: 'Build, fight, survive alone', icon: 'User' },
      { name: 'Duo BR', desc: 'Partner up for Victory Royale', icon: 'Users' },
      { name: 'Squad BR', desc: 'Four-player team tactics', icon: 'Shield' },
      { name: 'Arena Ranked', desc: 'Competitive point-based matches', icon: 'Award' }
    ],
    gradient: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a0ca3 100%)',
    accentColor: '#fb5607'
  }
};