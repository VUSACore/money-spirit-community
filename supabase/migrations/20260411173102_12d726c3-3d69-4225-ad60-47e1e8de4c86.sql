
-- Migrate existing profile data
UPDATE profiles SET pathway_type = 'keeper' WHERE pathway_type = 'foundation';
UPDATE profiles SET pathway_type = 'seeker' WHERE pathway_type = 'growth';
UPDATE profiles SET pathway_type = 'achiever' WHERE pathway_type = 'abundance';

-- Delete old pathway rows
DELETE FROM pathway_steps;
DELETE FROM pathways;

-- Insert 5 new archetype rows
INSERT INTO pathways (id, title, description, pathway_type, icon_slug, accent_colour, sort_order)
VALUES
  (gen_random_uuid(), 'The Giver', 'You lead with generosity and care deeply about providing for others. Your financial journey is rooted in love, community, and the desire to uplift those around you.', 'giver', 'heart', '#E8845C', 1),
  (gen_random_uuid(), 'The Keeper', 'You value security above all else. Building a solid foundation, protecting what you have, and planning carefully are the pillars of your financial wellbeing.', 'keeper', 'shield', '#5B8DB8', 2),
  (gen_random_uuid(), 'The Rebel', 'You reject traditional money rules and forge your own path. Bold, unconventional, and courageous — you are not afraid to challenge the system and rewrite the rules of wealth.', 'rebel', 'flame', '#9B59B6', 3),
  (gen_random_uuid(), 'The Seeker', 'You are on a journey of discovery. Curious, open-minded, and always learning — you approach money with wonder and a desire to understand the deeper purpose it can serve in your life.', 'seeker', 'compass', '#27AE8F', 4),
  (gen_random_uuid(), 'The Achiever', 'You are driven, ambitious, and focused on growth. You set bold financial goals and pursue them with discipline, strategy, and an unstoppable belief in what is possible.', 'achiever', 'star', '#C9941E', 5);
