import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── COPC PDF — Employee own scorecard ────────────────────────────────────────
export function exportCOPCPDF(employee: any, cycle: string) {
  const doc = new jsPDF()
  const teal = [13, 148, 136] as [number, number, number]
  const dark = [15, 23, 42] as [number, number, number]
  const muted = [100, 116, 139] as [number, number, number]

  // Header
  doc.setFillColor(...teal)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('KINALYS', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('COPC Performance Report', 50, 12)
  doc.text(cycle, 160, 12)

  // Employee info
  doc.setTextColor(...dark)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(employee.full_name, 14, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...muted)
  doc.text(`Department: ${employee.department_name || '—'}`, 14, 38)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 44)

  // COPC Index badge
  doc.setFillColor(...teal)
  doc.roundedRect(130, 24, 65, 24, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('COPC INDEX', 162, 31, { align: 'center' })
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`${employee.copc_index}%`, 162, 42, { align: 'center' })

  // Classification badge
  const classColors: Record<string, [number, number, number]> = {
    E: [5, 150, 105], S: [217, 119, 6], U: [220, 38, 38]
  }
  const classLabels: Record<string, string> = { E: 'Excellent', S: 'Satisfactory', U: 'Unsatisfactory' }
  doc.setFillColor(...(classColors[employee.classification] || classColors.U))
  doc.roundedRect(14, 50, 55, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`${employee.classification} — ${classLabels[employee.classification]}`, 41, 57, { align: 'center' })

  // Divider
  doc.setDrawColor(...teal)
  doc.setLineWidth(0.5)
  doc.line(14, 66, 196, 66)

  // KPI table
  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('KPI Breakdown', 14, 74)

  const ragColors: Record<string, [number, number, number]> = {
    green: [5, 150, 105], amber: [217, 119, 6], red: [220, 38, 38]
  }
  const classMap: Record<string, string> = { E: 'Excellent', S: 'Satisfactory', U: 'Unsatisfactory' }

  autoTable(doc, {
    startY: 78,
    head: [['KPI Name', 'Target', 'Actual', 'Score', 'COPC Class', 'Status']],
    body: employee.kpis.map((k: any) => [
      k.kpi_name,
      `${k.target_value}%`,
      `${k.actual_value}%`,
      `${Number(k.score).toFixed(1)}%`,
      `${k.copc_class} — ${classMap[k.copc_class] || k.copc_class}`,
      k.rag_status.charAt(0).toUpperCase() + k.rag_status.slice(1)
    ]),
    headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: dark },
    columnStyles: { 0: { cellWidth: 65 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw?.toString().toLowerCase()
        if (ragColors[val]) data.cell.styles.textColor = ragColors[val]
      }
      if (data.section === 'body' && data.column.index === 3) {
        const score = parseFloat(data.cell.raw)
        data.cell.styles.textColor = score >= 90 ? ragColors.green : score >= 75 ? ragColors.amber : ragColors.red
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  // Explanations
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text('Understanding Your COPC Classification', 14, finalY)

  const explanations = [
    ['E — Excellent', 'Your score meets or exceeds 90% of the target. This is the highest COPC performance tier.'],
    ['S — Satisfactory', 'Your score is between 75% and 89% of the target. Performance is acceptable but improvement is expected.'],
    ['U — Unsatisfactory', 'Your score is below 75% of the target. Immediate improvement plan required.'],
    ['Green KPI', 'This KPI is on track and meeting its performance threshold.'],
    ['Amber KPI', 'This KPI is approaching its lower threshold. Action recommended before it turns red.'],
    ['Red KPI', 'This KPI has breached its lower threshold. Immediate attention required.'],
  ]

  autoTable(doc, {
    startY: finalY + 4,
    head: [['Classification / Status', 'What It Means']],
    body: explanations,
    headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: dark },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text('Generated by Kinalys · Kinetic Analysis · kinalys.io · Confidential', 105, 290, { align: 'center' })

  doc.save(`COPC_Report_${employee.full_name.replace(/ /g, '_')}_${cycle}.pdf`)
}

// ─── COPC XLSX — Leader full team export ──────────────────────────────────────
export function exportCOPCXLSX(employees: any[], summary: any, cycle: string) {
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['KINALYS — COPC Performance Report', '', '', ''],
    [`Cycle: ${cycle}`, '', `Generated: ${new Date().toLocaleDateString('en-IN')}`, ''],
    ['', '', '', ''],
    ['SUMMARY', '', '', ''],
    ['Team Average COPC Index', `${summary.avg_copc_index}%`, '', ''],
    ['Total Employees', summary.total, '', ''],
    ['Excellent (E)', summary.excellent, `${summary.excellent_pct}%`, ''],
    ['Satisfactory (S)', summary.satisfactory, `${summary.satisfactory_pct}%`, ''],
    ['Unsatisfactory (U)', summary.unsatisfactory, `${summary.unsatisfactory_pct}%`, ''],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Detail sheet — one row per KPI per employee
  const headers = ['Employee', 'Department', 'COPC Index', 'Classification', 'KPI Name', 'Target', 'Actual', 'Score', 'COPC Class', 'RAG Status']
  const rows: any[] = [headers]
  employees.forEach((emp: any) => {
    emp.kpis.forEach((kpi: any) => {
      rows.push([
        emp.full_name,
        emp.department_name || '',
        emp.copc_index,
        emp.classification === 'E' ? 'Excellent' : emp.classification === 'S' ? 'Satisfactory' : 'Unsatisfactory',
        kpi.kpi_name,
        kpi.target_value,
        kpi.actual_value,
        Number(kpi.score).toFixed(1),
        kpi.copc_class === 'E' ? 'Excellent' : kpi.copc_class === 'S' ? 'Satisfactory' : 'Unsatisfactory',
        kpi.rag_status.charAt(0).toUpperCase() + kpi.rag_status.slice(1)
      ])
    })
  })
  const detailSheet = XLSX.utils.aoa_to_sheet(rows)
  detailSheet['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, detailSheet, 'KPI Detail')

  XLSX.writeFile(wb, `COPC_Team_Report_${cycle.replace(/ /g, '_')}.xlsx`)
}

// ─── SIX SIGMA PDF — Employee own scorecard ───────────────────────────────────
export function exportSixSigmaPDF(employee: any, cycle: string) {
  const doc = new jsPDF()
  const teal = [13, 148, 136] as [number, number, number]
  const dark = [15, 23, 42] as [number, number, number]
  const muted = [100, 116, 139] as [number, number, number]

  // Header
  doc.setFillColor(...teal)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('KINALYS', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Six Sigma Performance Report', 50, 12)
  doc.text(cycle, 160, 12)

  // Employee info
  doc.setTextColor(...dark)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(employee.full_name, 14, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...muted)
  doc.text(`Department: ${employee.department_name || '—'}`, 14, 38)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 44)

  // Sigma badge
  const sigmaColor = employee.sigma_score >= 4 ? [5, 150, 105] : employee.sigma_score >= 3 ? [217, 119, 6] : [220, 38, 38]
  doc.setFillColor(...(sigmaColor as [number, number, number]))
  doc.roundedRect(130, 24, 65, 24, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('SIGMA LEVEL', 162, 31, { align: 'center' })
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${employee.sigma_score}\u03C3`, 162, 42, { align: 'center' })

  // Score badge
  doc.setFillColor(...teal)
  doc.roundedRect(14, 50, 55, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Avg Score: ${employee.avg_score}%`, 41, 57, { align: 'center' })

  // Divider
  doc.setDrawColor(...teal)
  doc.setLineWidth(0.5)
  doc.line(14, 66, 196, 66)

  // KPI table
  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('KPI Breakdown', 14, 74)

  const ragColors: Record<string, [number, number, number]> = {
    green: [5, 150, 105], amber: [217, 119, 6], red: [220, 38, 38]
  }

  autoTable(doc, {
    startY: 78,
    head: [['KPI Name', 'Target', 'Actual', 'Score', 'Status']],
    body: employee.kpis.map((k: any) => [
      k.is_dpmo ? k.kpi_name + ' *' : k.kpi_name,
      k.target_value,
      k.actual_value,
      `${Number(k.score).toFixed(1)}%`,
      k.rag_status.charAt(0).toUpperCase() + k.rag_status.slice(1)
    ]),
    headStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: dark },
    columnStyles: { 0: { cellWidth: 75 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' }, 4: { halign: 'center' } },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw?.toString().toLowerCase()
        if (ragColors[val]) data.cell.styles.textColor = ragColors[val]
      }
      if (data.section === 'body' && data.column.index === 3) {
        const score = parseFloat(data.cell.raw)
        data.cell.styles.textColor = score >= 90 ? ragColors.green : score >= 75 ? ragColors.amber : ragColors.red
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  const finalY = (doc as any).lastAutoTable.finalY + 6
  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text('* DPMO KPI — lower value is better. Your sigma level is derived from your DPMO actual value.', 14, finalY)

  // Explanations
  const expY = finalY + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text('Understanding Your Six Sigma Report', 14, expY)

  const explanations = [
    ['6σ (3.4 DPMO)', 'World class. Near-perfect process quality — 99.99966% defect-free.'],
    ['5σ (233 DPMO)', 'Excellent. Very high process quality. Top quartile performance.'],
    ['4σ (6,210 DPMO)', 'Good. Industry standard target. 99.38% defect-free output.'],
    ['3σ (66,807 DPMO)', 'Average. Significant room for improvement. Improvement plan recommended.'],
    ['2σ (308,537 DPMO)', 'Below target. Process has critical quality issues requiring immediate action.'],
    ['Green KPI', 'This KPI is meeting or exceeding its target threshold.'],
    ['Amber KPI', 'This KPI is approaching its lower threshold. Action recommended.'],
    ['Red KPI', 'This KPI has breached its lower threshold. Immediate attention required.'],
    ['DPMO', 'Defects Per Million Opportunities. For DPMO, a lower number is better.'],
  ]

  autoTable(doc, {
    startY: expY + 4,
    head: [['Sigma Level / Status', 'What It Means']],
    body: explanations,
    headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: dark },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text('Generated by Kinalys · Kinetic Analysis · kinalys.io · Confidential', 105, 290, { align: 'center' })

  doc.save(`SixSigma_Report_${employee.full_name.replace(/ /g, '_')}_${cycle}.pdf`)
}

// ─── SIX SIGMA XLSX — Leader full team export ─────────────────────────────────
export function exportSixSigmaXLSX(employees: any[], summary: any, cycle: string) {
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['KINALYS — Six Sigma Performance Report', '', '', ''],
    [`Cycle: ${cycle}`, '', `Generated: ${new Date().toLocaleDateString('en-IN')}`, ''],
    ['', '', '', ''],
    ['SUMMARY', '', '', ''],
    ['Average Sigma Level', `${summary.avg_sigma}σ`, '', ''],
    ['Average Process Score', `${summary.avg_score}%`, '', ''],
    ['Total Employees', summary.total, '', ''],
    ['At Target (≥4σ)', summary.at_target, `${summary.at_target_pct}%`, ''],
    ['Below Target (<4σ)', summary.below_target, `${summary.below_target_pct}%`, ''],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Detail sheet
  const headers = ['Employee', 'Department', 'Sigma Level', 'Avg Score', 'KPI Name', 'Target', 'Actual', 'Score', 'RAG Status', 'Is DPMO']
  const rows: any[] = [headers]
  employees.forEach((emp: any) => {
    emp.kpis.forEach((kpi: any) => {
      rows.push([
        emp.full_name,
        emp.department_name || '',
        `${emp.sigma_score}σ`,
        `${emp.avg_score}%`,
        kpi.kpi_name,
        kpi.target_value,
        kpi.actual_value,
        Number(kpi.score).toFixed(1),
        kpi.rag_status.charAt(0).toUpperCase() + kpi.rag_status.slice(1),
        kpi.is_dpmo ? 'Yes' : 'No'
      ])
    })
  })
  const detailSheet = XLSX.utils.aoa_to_sheet(rows)
  detailSheet['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, detailSheet, 'KPI Detail')

  XLSX.writeFile(wb, `SixSigma_Team_Report_${cycle.replace(/ /g, '_')}.xlsx`)
}