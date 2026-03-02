-- Community RPC functions (workaround for PostgREST schema cache bug)
-- These functions let us access threads/replies tables via supabase.rpc()

-- ── LIST THREADS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION list_threads(
  p_channel_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20
) RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT id, channel_id, author_id, title, body, status, is_pinned, is_locked, created_at
    FROM threads
    WHERE status = 'active'
      AND (p_channel_id IS NULL OR channel_id = p_channel_id)
    ORDER BY is_pinned DESC, created_at DESC
    LIMIT p_limit
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── COUNT USER COMMENTS TODAY (threads + replies) ─────────
CREATE OR REPLACE FUNCTION count_user_comments_today(p_user_id uuid)
RETURNS int AS $$
DECLARE
  thread_cnt int;
  reply_cnt int;
BEGIN
  SELECT COUNT(*) INTO thread_cnt
  FROM threads
  WHERE author_id = p_user_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO reply_cnt
  FROM replies
  WHERE author_id = p_user_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  RETURN thread_cnt + reply_cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── CREATE THREAD ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_thread(
  p_author_id uuid,
  p_title text,
  p_body text DEFAULT NULL,
  p_channel_id uuid DEFAULT NULL
) RETURNS json AS $$
  INSERT INTO threads (author_id, title, body, channel_id, status)
  VALUES (p_author_id, p_title, p_body, p_channel_id, 'active')
  RETURNING json_build_object('id', id, 'title', title, 'created_at', created_at);
$$ LANGUAGE sql SECURITY DEFINER;

-- ── LIST REPLIES FOR THREAD ───────────────────────────────
CREATE OR REPLACE FUNCTION list_replies(
  p_thread_id uuid,
  p_limit int DEFAULT 50
) RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT id, thread_id, author_id, body, status, created_at
    FROM replies
    WHERE thread_id = p_thread_id
      AND status = 'active'
    ORDER BY created_at ASC
    LIMIT p_limit
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── CREATE REPLY ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_reply(
  p_thread_id uuid,
  p_author_id uuid,
  p_body text
) RETURNS json AS $$
  INSERT INTO replies (thread_id, author_id, body, status)
  VALUES (p_thread_id, p_author_id, p_body, 'active')
  RETURNING json_build_object('id', id, 'thread_id', thread_id, 'created_at', created_at);
$$ LANGUAGE sql SECURITY DEFINER;

-- ── GET SINGLE THREAD ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_thread(p_thread_id uuid)
RETURNS json AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT id, channel_id, author_id, title, body, status, is_pinned, is_locked, created_at
    FROM threads
    WHERE id = p_thread_id
  ) t;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION list_threads TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION count_user_comments_today TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_thread TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION list_replies TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_reply TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_thread TO anon, authenticated, service_role;
