-- 用 TCU 會員資料補齊 registrations 的 placeholder 姓名
UPDATE registrations
SET athlete_name = (
  SELECT COALESCE(tm.real_name, tm.nickname, tm.account)
  FROM strava_member_bindings smb
  JOIN tcu_members tm
    ON tm.email = smb.tcu_member_email
    OR tm.account = smb.tcu_account
  WHERE smb.strava_id = registrations.strava_athlete_id::text
  LIMIT 1
)
WHERE segment_id = (
  SELECT id FROM segments_new WHERE strava_id = 4928093 LIMIT 1
)
AND athlete_name LIKE 'Athlete %'
AND EXISTS (
  SELECT 1 FROM strava_member_bindings
  WHERE strava_id = registrations.strava_athlete_id::text
);
