UPDATE posts SET
  title = REPLACE(title, '—', ','),
  body = REPLACE(body, '—', ','),
  excerpt = REPLACE(excerpt, '—', ','),
  title_mckinsey = REPLACE(title_mckinsey, '—', ','),
  body_mckinsey = REPLACE(body_mckinsey, '—', ','),
  title_wodehouse = REPLACE(title_wodehouse, '—', ','),
  body_wodehouse = REPLACE(body_wodehouse, '—', ',');

UPDATE playbooks SET
  title = REPLACE(title, '—', ','),
  summary = REPLACE(summary, '—', ','),
  body = REPLACE(body, '—', ',');