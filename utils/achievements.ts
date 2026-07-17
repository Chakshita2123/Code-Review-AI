export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'flame' | 'award' | 'bug' | 'shield' | 'code' | 'globe' | 'message';
  color: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_review', title: 'First Steps', description: 'Complete your first code review', icon: 'star', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10' },
  { id: 'on_fire', title: 'On Fire', description: 'Complete 10 code reviews', icon: 'flame', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-orange-500/10' },
  { id: 'perfect_score', title: 'Perfect Score', description: 'Get a score of 100 on a review', icon: 'award', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10' },
  { id: 'bug_hunter', title: 'Bug Hunter', description: 'Find 5 or more bugs in a single review', icon: 'bug', color: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/10' },
  { id: 'security_expert', title: 'Security Expert', description: 'Get a perfect 10/10 on security', icon: 'shield', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10' },
  { id: 'clean_coder', title: 'Clean Coder', description: 'Get a perfect 10/10 on readability', icon: 'code', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10' },
  { id: 'polyglot', title: 'Polyglot', description: 'Review code in 3 different languages', icon: 'globe', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10' },
  { id: 'chatty', title: 'Chatty', description: 'Ask the AI 5 or more questions in chat', icon: 'message', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 shadow-pink-500/10' },
];
