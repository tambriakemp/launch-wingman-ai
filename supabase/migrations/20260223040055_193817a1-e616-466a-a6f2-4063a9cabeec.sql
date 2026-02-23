ALTER TABLE campaign_conversions 
ADD COLUMN step text DEFAULT NULL;

CREATE INDEX idx_campaign_conversions_step 
ON campaign_conversions(campaign_id, step);