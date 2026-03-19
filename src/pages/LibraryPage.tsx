import { useDeferredValue, useState } from 'react'

import type { StudyAsset, StudyLibraryStats } from '../types/studyLibrary'

interface LibraryPageProps {
  assets: StudyAsset[]
  stats: StudyLibraryStats
  onBackHome: () => void
  onOpenSolver: () => void
  onStartQuiz: () => void
}

type LibraryFilter = 'all' | 'documents' | 'screenshots'

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${value} B`
}

function describeTextSource(asset: StudyAsset) {
  if (asset.textSource === 'docx_paragraphs' || asset.textSource === 'docx_xml') {
    return 'Document text indexed'
  }

  if (asset.textSource === 'pdf_text') {
    return 'Embedded PDF text indexed'
  }

  if (asset.textSource === 'pdf_ocr') {
    return asset.pageCount ? `OCR indexed across ${asset.pageCount} pages` : 'OCR indexed from PDF pages'
  }

  if (asset.textSource === 'image_ocr') {
    return 'OCR indexed from screenshot'
  }

  return 'No searchable text extracted'
}

function duplicateCopy(asset: StudyAsset) {
  if (asset.duplicateCount === 0) {
    return 'Unique file retained'
  }

  return asset.duplicateCount === 1
    ? '1 exact duplicate removed'
    : `${asset.duplicateCount} exact duplicates removed`
}

export function LibraryPage({ assets, stats, onBackHome, onOpenSolver, onStartQuiz }: LibraryPageProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filteredAssets = assets.filter((asset) => {
    if (filter === 'documents' && asset.kind !== 'document') {
      return false
    }

    if (filter === 'screenshots' && asset.kind !== 'screenshot') {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const haystack = [
      asset.title,
      asset.sourceFolder,
      asset.archivePath,
      asset.searchText,
      asset.duplicateArchivePaths.join(' '),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })

  const documentAssets = filteredAssets.filter((asset) => asset.kind === 'document')
  const screenshotAssets = filteredAssets.filter((asset) => asset.kind === 'screenshot')

  return (
    <div className="panel-stack">
      <section className="panel-section">
        <div className="library-toolbar">
          <div>
            <h2>Tracked study assets</h2>
            <p className="muted-copy">
              Every retained file is committed into the repo, deduped by SHA-256, and searchable from extracted text or OCR.
            </p>
          </div>

          <div className="action-row">
            <button type="button" className="ghost-action" onClick={onBackHome}>
              Back home
            </button>
            <button type="button" className="secondary-action" onClick={onOpenSolver}>
              Open solver
            </button>
            <button type="button" className="primary-action" onClick={onStartQuiz}>
              Start full quiz
            </button>
          </div>
        </div>

        <div className="library-controls">
          <label className="library-search">
            <span className="library-search__label">Search OCR or document text</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try a chapter number, figure, question text, or file name"
            />
          </label>

          <div className="filter-row">
            <button
              type="button"
              className={`filter-pill${filter === 'all' ? ' filter-pill--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All assets
            </button>
            <button
              type="button"
              className={`filter-pill${filter === 'documents' ? ' filter-pill--active' : ''}`}
              onClick={() => setFilter('documents')}
            >
              Documents
            </button>
            <button
              type="button"
              className={`filter-pill${filter === 'screenshots' ? ' filter-pill--active' : ''}`}
              onClick={() => setFilter('screenshots')}
            >
              Screenshots
            </button>
          </div>
        </div>
      </section>

      <section className="library-stat-grid">
        <article className="metric-card">
          <span>Unique assets</span>
          <strong>{stats.uniqueFiles}</strong>
          <small>{stats.documentCount} documents and {stats.screenshotCount} screenshots</small>
        </article>
        <article className="metric-card">
          <span>Exact duplicates removed</span>
          <strong>{stats.exactDuplicateFilesRemoved}</strong>
          <small>{stats.duplicateGroups} duplicate groups collapsed</small>
        </article>
        <article className="metric-card">
          <span>Archive size</span>
          <strong>{formatBytes(stats.sourceArchiveSizeBytes)}</strong>
          <small>{stats.sourceArchiveName}</small>
        </article>
      </section>

      {documentAssets.length ? (
        <section className="panel-section">
          <div className="library-section-header">
            <h2>Homework documents</h2>
            <p className="muted-copy">{documentAssets.length} matching files</p>
          </div>

          <div className="library-document-grid">
            {documentAssets.map((asset) => (
              <article key={asset.id} className="library-card library-card--document">
                <div className="library-card__meta">
                  <span className="eyebrow">Document</span>
                  <h3>{asset.title}</h3>
                  <p className="muted-copy">
                    {describeTextSource(asset)}. {duplicateCopy(asset)}. {formatBytes(asset.sizeBytes)}.
                  </p>
                </div>

                <div className="library-card__chips">
                  <span className="status-chip status-chip--correct">{asset.sourceFolder}</span>
                  <span className="status-chip status-chip--neutral">{asset.extension.toUpperCase()}</span>
                </div>

                <p className="library-card__preview">
                  {asset.textPreview || 'This file is stored in the repo, but no searchable text could be extracted.'}
                </p>

                {asset.duplicateArchivePaths.length ? (
                  <p className="library-card__duplicates">
                    Duplicate aliases: {asset.duplicateArchivePaths.join(' | ')}
                  </p>
                ) : null}

                <div className="action-row">
                  <a className="ghost-action" href={asset.publicPath} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {screenshotAssets.length ? (
        <section className="panel-section">
          <div className="library-section-header">
            <h2>Screenshot library</h2>
            <p className="muted-copy">{screenshotAssets.length} matching captures</p>
          </div>

          <div className="library-screenshot-grid">
            {screenshotAssets.map((asset) => (
              <article key={asset.id} className="library-card library-card--screenshot">
                <a href={asset.publicPath} target="_blank" rel="noreferrer" className="library-card__image-link">
                  <img src={asset.publicPath} alt={asset.title} loading="lazy" />
                </a>

                <div className="library-card__body">
                  <div className="library-card__meta">
                    <h3>{asset.title}</h3>
                    <p className="muted-copy">
                      {describeTextSource(asset)}. {duplicateCopy(asset)}.
                    </p>
                  </div>

                  <div className="library-card__chips">
                    <span className="status-chip status-chip--correct">{asset.sourceFolder}</span>
                    <span className="status-chip status-chip--neutral">{formatBytes(asset.sizeBytes)}</span>
                  </div>

                  <p className="library-card__preview">{asset.textPreview || 'No OCR text was extracted.'}</p>

                  {asset.duplicateArchivePaths.length ? (
                    <p className="library-card__duplicates">
                      Duplicate aliases: {asset.duplicateArchivePaths.join(' | ')}
                    </p>
                  ) : null}

                  <div className="action-row">
                    <a className="ghost-action" href={asset.publicPath} target="_blank" rel="noreferrer">
                      Open full image
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!filteredAssets.length ? (
        <section className="panel-section">
          <h2>No matching assets</h2>
          <p className="muted-copy">
            Try a broader search term or switch back to a wider filter.
          </p>
        </section>
      ) : null}
    </div>
  )
}
