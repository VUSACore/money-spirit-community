// Family Legacy types — schema-only, no UI yet

export type CircleType = 'mother_daughter' | 'sibling' | 'multi_gen';

export type CircleRole = 'primary' | 'secondary';

export type LegacyGoalType =
  | 'inheritance'
  | 'property'
  | 'education_fund'
  | 'business'
  | 'retirement';

export interface FamilyCircle {
  id: string;
  creator_id: string;
  circle_name: string;
  circle_type: CircleType;
  created_at: string;
}

export interface FamilyCircleMember {
  id: string;
  circle_id: string;
  member_id: string;
  role: CircleRole;
  invited_at: string;
  joined_at: string | null;
}

export interface FamilyRitual {
  id: string;
  family_circle_id: string;
  ritual_id: string | null;
  title: string;
  description: string | null;
  reflection_prompt: string | null;
  week_of: string;
  created_at: string;
}

export interface FamilyRitualCompletion {
  id: string;
  family_ritual_id: string;
  completed_by: string;
  reflection: string | null;
  completed_at: string;
}

export interface LegacyGoal {
  id: string;
  user_id: string;
  goal_type: LegacyGoalType;
  title: string;
  target_amount: number | null;
  currency: string;
  notes: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}
