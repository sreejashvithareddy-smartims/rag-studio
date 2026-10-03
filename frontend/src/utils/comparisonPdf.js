const metricLabels = {
  faithfulness: 'Faithfulness',
  relevance: 'Answer Relevancy',
  answer_relevancy: 'Answer Relevancy',
  context_precision: 'Context Precision',
}

const textValue = (value) => {
  if (value == null || value === '') return 'Not available'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const formatMetric = (value) => value == null || !Number.isFinite(Number(value)) ? 'Not available' : Number(value).toFixed(3)

function scoreForMethod(scores, method) {
  return scores?.[method.technique] || scores?.[method.label] || {}
}

function getReportDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value < 1e12 ? value * 1000 : value)
  if (value) return new Date(value)
  return null
}

export async function createComparisonPdf({ data, project, documentName, documentId, comparedAt }) {
  if (!data?.comparison || !data?.result_a || !data?.result_b) {
    throw new Error('A completed comparison is required to create a report.')
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  const footerSpace = 46
  let y = 0

  const drawPageHeader = (firstPage = false) => {
    pdf.setFillColor(11, 18, 32)
    pdf.rect(0, 0, pageWidth, firstPage ? 82 : 54, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(firstPage ? 17 : 12)
    pdf.text('RAG STUDIO', margin, firstPage ? 34 : 33)
    pdf.setTextColor(148, 163, 184)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('RETRIEVAL EVALUATION  /  COMPARISON REPORT', margin, firstPage ? 56 : 33)
    y = firstPage ? 108 : 78
  }

  const addPage = () => {
    pdf.addPage()
    drawPageHeader(false)
  }

  const ensureSpace = (height) => {
    if (y + height > pageHeight - footerSpace) addPage()
  }

  const writeLines = (value, { fontSize = 10, color = [51, 65, 85], bold = false, width = contentWidth, indent = 0, leading = 14 } = {}) => {
    const lines = pdf.splitTextToSize(textValue(value), width - indent)
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(fontSize)
    pdf.setTextColor(...color)
    for (const line of lines) {
      ensureSpace(leading)
      pdf.text(line, margin + indent, y)
      y += leading
    }
  }

  const section = (title) => {
    ensureSpace(34)
    y += 4
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(30, 41, 59)
    pdf.text(title.toUpperCase(), margin, y)
    y += 7
    pdf.setDrawColor(203, 213, 225)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 16
  }

  const drawTable = (headers, rows) => {
    const firstColumnWidth = headers.length > 2 ? 142 : 150
    const otherColumnWidth = (contentWidth - firstColumnWidth) / (headers.length - 1)
    const widths = headers.map((_, index) => index === 0 ? firstColumnWidth : otherColumnWidth)
    const drawRow = (cells, header = false) => {
      const fontSize = header ? 8 : 8.5
      const lineHeight = 11
      const wrapped = cells.map((cell, index) => {
        pdf.setFont('helvetica', header || index === 0 ? 'bold' : 'normal')
        pdf.setFontSize(fontSize)
        return pdf.splitTextToSize(textValue(cell), widths[index] - 14)
      })
      const rowHeight = Math.max(...wrapped.map((lines) => lines.length)) * lineHeight + 10
      ensureSpace(rowHeight)
      let x = margin
      if (header) pdf.setFillColor(241, 245, 249)
      else pdf.setFillColor(255, 255, 255)
      pdf.setDrawColor(226, 232, 240)
      for (let index = 0; index < cells.length; index += 1) {
        pdf.rect(x, y - 8, widths[index], rowHeight, header ? 'FD' : 'S')
        pdf.setFont('helvetica', header || index === 0 ? 'bold' : 'normal')
        pdf.setFontSize(fontSize)
        pdf.setTextColor(header ? 71 : 51, header ? 85 : 65, header ? 105 : 85)
        pdf.text(wrapped[index], x + 7, y + 3)
        x += widths[index]
      }
      y += rowHeight
    }
    drawRow(headers, true)
    rows.forEach((row) => drawRow(row))
    y += 10
  }

  const methods = [data.result_a, data.result_b].filter(Boolean)
  const comparison = data.comparison
  const scores = comparison.scores || {}
  const projectName = project?.name || 'Project name unavailable'
  const reportDate = getReportDate(comparedAt ?? data.compared_at ?? data.timestamp)

  drawPageHeader(true)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(15, 23, 42)
  pdf.text('RAG comparison', margin, y)
  y += 28
  writeLines(`Project: ${projectName}`, { bold: true })
  if (project?.project_id) writeLines(`Project ID: ${project.project_id}`, { fontSize: 9, color: [100, 116, 139] })
  if (project?.created_at) writeLines(`Project created: ${new Date(project.created_at * 1000).toLocaleDateString()}`, { fontSize: 9, color: [100, 116, 139] })
  if (reportDate && !Number.isNaN(reportDate.getTime())) writeLines(`Compared: ${reportDate.toLocaleString()}`, { fontSize: 9, color: [100, 116, 139] })
  if (documentName) writeLines(`Document: ${documentName}`, { fontSize: 9, color: [100, 116, 139] })
  else if (documentId || data.result_a.doc_id || data.result_b.doc_id) writeLines(`Document ID: ${documentId || data.result_a.doc_id || data.result_b.doc_id}`, { fontSize: 9, color: [100, 116, 139] })

  section('Question asked')
  writeLines(data.query, { fontSize: 10, color: [30, 41, 59], leading: 15 })

  section('Methods compared')
  methods.forEach((method, index) => writeLines(`Method ${index + 1}: ${method.label || method.technique}`, { bold: true }))

  section('Evaluation metrics')
  const metricKeys = [...new Set(Object.values(scores).flatMap((methodScores) => Object.keys(methodScores || {})))]
  if (metricKeys.length) {
    drawTable(
      ['Metric', ...methods.map((method) => method.label || method.technique)],
      metricKeys.map((key) => [metricLabels[key] || key.replaceAll('_', ' '), ...methods.map((method) => formatMetric(scoreForMethod(scores, method)[key]))]),
    )
  } else {
    writeLines('No metric scores were returned for this comparison.', { fontSize: 9, color: [100, 116, 139] })
  }

  section('Answers')
  methods.forEach((method, index) => {
    writeLines(`Method ${index + 1} — ${method.label || method.technique}`, { bold: true, color: [15, 23, 42] })
    writeLines(method.answer, { leading: 13 })
    y += 5
  })

  section('Retrieved chunks')
  methods.forEach((method, methodIndex) => {
    writeLines(`Method ${methodIndex + 1} — ${method.label || method.technique}`, { bold: true, color: [15, 23, 42] })
    const chunks = Array.isArray(method.chunks) ? method.chunks : []
    if (!chunks.length) writeLines('No retrieved chunks were returned.', { fontSize: 9, color: [100, 116, 139], indent: 10 })
    chunks.forEach((chunk, chunkIndex) => {
      const meta = chunk.meta && Object.keys(chunk.meta).length ? `Metadata: ${JSON.stringify(chunk.meta)}` : null
      const chunkNumber = chunk.meta?.chunk_index ?? chunkIndex + 1
      writeLines(`Chunk ${chunkNumber}${chunk.score != null ? ` · retrieval score ${formatMetric(chunk.score)}` : ''}`, { fontSize: 9, bold: true, indent: 10 })
      if (meta) writeLines(meta, { fontSize: 8, color: [100, 116, 139], indent: 10, leading: 11 })
      writeLines(chunk.text, { fontSize: 8.5, color: [71, 85, 105], indent: 10, leading: 12 })
      y += 6
    })
    y += 4
  })

  section('Comparison result')
  const winner = comparison.verdict?.winner_label || (comparison.verdict?.winner === 'tie' ? 'Tie' : null)
  const winnerValue = winner || 'No winning method returned'
  writeLines(`Best Method: ${winnerValue}`, { bold: true, fontSize: 11, color: winner ? [15, 118, 110] : [100, 116, 139] })
  writeLines(`Winner: ${winnerValue}`, { bold: true, fontSize: 10, color: winner ? [15, 118, 110] : [100, 116, 139] })
  if (comparison.verdict?.reasoning) writeLines(comparison.verdict.reasoning, { leading: 13 })
  if (data.chunk_overlap) {
    writeLines(`Retrieved chunk overlap: ${data.chunk_overlap.similar_count ?? 0} similar, ${data.chunk_overlap.different_count ?? 0} different.`, { fontSize: 9, color: [100, 116, 139] })
  }
  const engines = comparison.eval_engine || {}
  const engineEntries = Object.entries(engines)
  if (engineEntries.length) writeLines(`Scoring engine: ${engineEntries.map(([method, engine]) => `${method}: ${engine}`).join(' · ')}`, { fontSize: 8, color: [100, 116, 139] })

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(100, 116, 139)
    pdf.text('RAG Studio · Comparison report', margin, pageHeight - 20)
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 20, { align: 'right' })
  }

  return pdf
}

export async function downloadComparisonPdf(options) {
  const pdf = await createComparisonPdf(options)
  const projectName = options.project?.name || 'Project'
  const date = getReportDate(options.comparedAt ?? options.data?.compared_at) || new Date()
  const dateLabel = Number.isNaN(date.getTime()) ? 'report' : date.toISOString().slice(0, 10)
  const safeName = projectName.normalize('NFKD').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'Project'
  const filename = `RAG_Studio_Comparison_${safeName}_${dateLabel}.pdf`
  const url = URL.createObjectURL(pdf.output('blob'))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}