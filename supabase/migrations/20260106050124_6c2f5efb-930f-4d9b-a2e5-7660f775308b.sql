-- Migrate historical impersonation logs to admin_action_logs
INSERT INTO admin_action_logs (
  admin_user_id,
  admin_email,
  target_user_id,
  target_email,
  action_type,
  action_details,
  created_at
)
SELECT 
  admin_user_id,
  admin_email,
  target_user_id,
  target_email,
  CASE 
    WHEN action = 'start' THEN 'impersonation_start'
    WHEN action = 'end' THEN 'impersonation_end'
    WHEN action = 'email_update' THEN 'email_update'
    WHEN action = 'temp_password_set' THEN 'password_reset'
    ELSE action
  END as action_type,
  '{}'::jsonb as action_details,
  created_at
FROM impersonation_logs
WHERE NOT EXISTS (
  SELECT 1 FROM admin_action_logs aal 
  WHERE aal.admin_user_id = impersonation_logs.admin_user_id
    AND aal.target_user_id = impersonation_logs.target_user_id
    AND aal.created_at = impersonation_logs.created_at
);