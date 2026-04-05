ALTER TABLE profiles DISABLE TRIGGER trg_prevent_role_self_update;
UPDATE profiles SET role = 'member' WHERE user_id = 'a60c5368-1db4-47fb-a27d-90163ba711b9';
ALTER TABLE profiles ENABLE TRIGGER trg_prevent_role_self_update;