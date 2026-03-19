export type StudyAssetKind = 'document' | 'screenshot'

export type StudyAssetTextSource =
  | 'docx_paragraphs'
  | 'docx_xml'
  | 'pdf_text'
  | 'pdf_ocr'
  | 'image_ocr'
  | 'none'

export interface StudyAsset {
  id: string
  kind: StudyAssetKind
  title: string
  originalFileName: string
  sourceFolder: string
  archivePath: string
  publicPath: string
  extension: string
  sizeBytes: number
  sha256: string
  duplicateArchivePaths: string[]
  duplicateCount: number
  searchText: string
  textPreview: string
  textSource: StudyAssetTextSource
  pageCount?: number
}

export interface StudyLibraryStats {
  sourceArchiveName: string
  sourceArchiveSizeBytes: number
  totalFiles: number
  uniqueFiles: number
  duplicateGroups: number
  exactDuplicateFilesRemoved: number
  documentCount: number
  screenshotCount: number
}
