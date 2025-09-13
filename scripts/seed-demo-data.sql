-- Demo data for AI Tutor Platform
-- Run this after initializing the database schema

-- Insert demo user (password is 'demo123' hashed with bcrypt)
INSERT INTO users (email, password, name, email_verified) VALUES 
('demo@aiTutor.com', '$2b$10$rOvHPH.OWKVfBxqCh4wyIeuy4H5TI8J5VC8aUBx/2.vV.pyMusG6e', 'Demo User', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample goal
INSERT INTO goals (user_id, title, description, category, difficulty_level, estimated_duration_weeks, timeline) VALUES 
(1, 'Learn Machine Learning', 'Master the fundamentals of machine learning and build practical projects', 'Technology', 'intermediate', 16, '{"phases": ["Python Basics", "Statistics", "ML Algorithms", "Projects"]}')
ON CONFLICT DO NOTHING;

-- Insert sample milestones
INSERT INTO milestones (goal_id, title, description, milestone_order, due_date) VALUES 
(1, 'Complete Python Fundamentals', 'Learn Python syntax, data structures, and basic programming concepts', 1, CURRENT_DATE + INTERVAL '2 weeks'),
(1, 'Master Statistics Basics', 'Understand descriptive statistics, probability, and hypothesis testing', 2, CURRENT_DATE + INTERVAL '6 weeks'),
(1, 'Implement ML Algorithms', 'Build linear regression, classification, and clustering models', 3, CURRENT_DATE + INTERVAL '12 weeks'),
(1, 'Create Portfolio Project', 'Develop end-to-end ML project with real-world data', 4, CURRENT_DATE + INTERVAL '16 weeks')
ON CONFLICT DO NOTHING;

-- Insert sample check-in
INSERT INTO check_ins (user_id, goal_id, frequency, notes, mood_rating, confidence_rating, next_check_in) VALUES 
(1, 1, 'weekly', 'Started learning Python basics. Making good progress with data structures.', 4, 3, CURRENT_DATE + INTERVAL '1 week')
ON CONFLICT DO NOTHING;

-- Insert sample chat session
INSERT INTO chat_sessions (user_id, goal_id, title, summary, key_learning_points, action_items, message_count) VALUES 
(1, 1, 'Getting Started with ML Journey', 'Initial consultation about machine learning goals and learning path', 
 ARRAY['Identified current skill level', 'Outlined learning roadmap', 'Set realistic timeline'], 
 ARRAY['Start with Python basics', 'Practice daily coding', 'Join online ML community'], 5)
ON CONFLICT DO NOTHING;

-- Insert sample progress tracking
INSERT INTO progress_tracking (user_id, goal_id, activity_type, activity_data, time_spent_minutes, completion_percentage) VALUES 
(1, 1, 'study_session', '{"topic": "Python basics", "resources": ["tutorial", "exercises"]}', 120, 15.5),
(1, 1, 'practice', '{"exercises_completed": 10, "difficulty": "beginner"}', 90, 18.0)
ON CONFLICT DO NOTHING;

-- Insert sample progress metrics
INSERT INTO progress_metrics (user_id, goal_id, completion_rate, learning_velocity, streak_days, total_time_spent_hours, milestones_completed) VALUES 
(1, 1, 18.0, 2.5, 5, 3.5, 0)
ON CONFLICT DO NOTHING;
