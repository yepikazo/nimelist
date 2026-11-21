ALTER TABLE search_document
  ADD COLUMN source_updated_at timestamptz NOT NULL DEFAULT 'epoch';

ALTER TABLE search_document_staging
  ADD COLUMN source_updated_at timestamptz NOT NULL DEFAULT 'epoch';
