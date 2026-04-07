
INSERT INTO public.badges (slug, name, description, emoji, color) VALUES
  ('welcome',         'Welcome',          'Joined the Money Spirit community',                       '🌸', '#C9941E'),
  ('first-ritual',    'First Ritual',     'Completed your first money ritual',                       '✨', '#C9941E'),
  ('ritual-streak-5', 'Streak 5',         'Five consecutive weekly rituals',                         '🔥', '#E5B03C'),
  ('ritual-streak-10','Streak 10',        'Ten consecutive weekly rituals',                          '🔥', '#E5B03C'),
  ('ritual-streak-25','Streak 25',        'Twenty-five consecutive weekly rituals',                  '🔥', '#C9941E'),
  ('first-win',       'First Win',        'Shared your first financial win with the community',      '🏆', '#C9941E'),
  ('course-complete', 'Course Complete',   'Finished a full course',                                 '🎓', '#0E2D5F'),
  ('community',       'Community Voice',   'Made your first post in the community feed',             '💬', '#1E4A8A'),
  ('founding-member', 'Founding Member',   'One of the first 100 annual members',                    '⭐', '#C9941E'),
  ('moderator',       'Moderator',         'Appointed as a community moderator',                     '🛡️', '#0E2D5F')
ON CONFLICT (slug) DO UPDATE SET emoji = EXCLUDED.emoji, color = EXCLUDED.color, description = EXCLUDED.description;
