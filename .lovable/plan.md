

## Plan: Export AI Image Prompts to Excel

### What
Export 2,656 AI image prompts (added before today) with their **Title** and **Prompt** columns to a downloadable `.xlsx` file.

### Implementation
1. Query all 2,656 records from the database (title + description, ordered by title)
2. Generate an Excel file at `/mnt/documents/ai_image_prompts.xlsx` with two columns: **Title** and **Prompt**
3. Auto-size column widths for readability

Single script execution — no code changes needed.

