-- Rate Limiting Table
create table if not exists rate_limits (
  key text primary key, -- e.g. "ip:1.2.3.4:login"
  count int default 1,
  last_request timestamp with time zone default timezone('utc'::text, now())
);

-- Function to check and update rate limit
-- Returns true if allowed, false if blocked
create or replace function check_rate_limit(
  limit_key text,
  max_requests int,
  window_seconds int
) returns boolean as $$
declare
  current_count int;
  last_req timestamp with time zone;
  allowed boolean;
begin
  -- Get current state
  select count, last_request into current_count, last_req
  from rate_limits
  where key = limit_key;

  if not found then
    -- First request
    insert into rate_limits (key, count, last_request)
    values (limit_key, 1, timezone('utc'::text, now()));
    return true;
  end if;

  -- Check if window expired (reset count)
  if extract(epoch from (timezone('utc'::text, now()) - last_req)) > window_seconds then
    update rate_limits
    set count = 1, last_request = timezone('utc'::text, now())
    where key = limit_key;
    return true;
  end if;

  -- Check limit
  if current_count >= max_requests then
    return false;
  end if;

  -- Increment
  update rate_limits
  set count = count + 1, last_request = timezone('utc'::text, now())
  where key = limit_key;
  return true;
end;
$$ language plpgsql security definer;
