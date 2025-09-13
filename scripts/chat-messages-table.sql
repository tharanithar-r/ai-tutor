-- Fix chat_messages table by dropping and recreating with correct structure

-- Drop existing table and its indexes
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create chat_messages table for storing AI tutor conversations
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_goal_id ON chat_messages(goal_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender);

-- Create a composite index for user conversations
CREATE INDEX idx_chat_messages_user_timestamp ON chat_messages(user_id, timestamp DESC);
