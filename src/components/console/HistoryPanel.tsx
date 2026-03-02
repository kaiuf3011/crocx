import { useState, useMemo, useCallback } from 'react';
import { X, Download, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import type { TelemetrySnapshot } from '../../hooks/useSimulatedTelemetry';

interface Props {
    history: TelemetrySnapshot[];
    onClose: () => void;
    onClear: () => void;
}

/* =========================================================
   Flatten snapshot rows for table / export
   ========================================================= */
interface FlatRow {
    timestamp: string;
    riskScore: number;
    riskStatus: string;
    anomalyPct: number;
    priorityScore: number;
    priorityStatus: string;
    activeFaults: string;
    [key: string]: string | number; // sensor columns
}

function flattenSnapshot(snap: TelemetrySnapshot): FlatRow {
    const row: FlatRow = {
        timestamp: snap.dateStr,
        riskScore: snap.riskScore,
        riskStatus: snap.riskStatus,
        anomalyPct: snap.anomalyPct,
        priorityScore: snap.priorityScore,
        priorityStatus: snap.priorityStatus,
        activeFaults: snap.activeFaults.join(', ') || 'None',
    };
    for (const s of snap.sensors) {
        row[`${s.label} (${s.unit})`] = s.value;
        row[`${s.label} Status`] = s.status;
    }
    return row;
}

/* =========================================================
   Export Utilities
   ========================================================= */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportCSV(rows: FlatRow[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => {
                const val = row[h];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(',')
        ),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'crocx_telemetry_history.csv');
}

function exportXLS(rows: FlatRow[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    // Build HTML table that Excel can open
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>';
    html += '<tr>' + headers.map(h => `<th style="font-weight:bold;background:#1a1a1e;color:#eaeaea;padding:8px;border:1px solid #333">${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
        html += '<tr>' + headers.map(h => {
            const val = row[h];
            return `<td style="padding:6px;border:1px solid #333;color:#ddd;background:#0b0b0d">${val}</td>`;
        }).join('') + '</tr>';
    });
    html += '</table></body></html>';
    downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'crocx_telemetry_history.xls');
}

function exportPDF(rows: FlatRow[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    // Build a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `<!DOCTYPE html><html><head>
    <title>CrocX Telemetry Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; padding: 32px; background: #fff; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; letter-spacing: -0.02em; }
        .subtitle { color: #888; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #111; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 9px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; }
        tr:nth-child(even) td { background: #f8f8f8; }
        .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; }
        @media print { body { padding: 16px; } }
    </style>
    </head><body>
    <h1>CrocX Telemetry History Report</h1>
    <p class="subtitle">Generated: ${new Date().toLocaleString()} &mdash; ${rows.length} snapshots</p>
    <table><thead><tr>`;
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
        html += '<tr>';
        headers.forEach(h => { html += `<td>${row[h]}</td>`; });
        html += '</tr>';
    });
    html += `</tbody></table>
    <div class="footer">CrocX Predictive Vehicle Intelligence — Confidential</div>
    </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
}

/* =========================================================
   HistoryPanel Component
   ========================================================= */
const PAGE_SIZE = 25;

export default function HistoryPanel({ history, onClose, onClear }: Props) {
    const [page, setPage] = useState(0);

    const rows = useMemo(() => history.map(flattenSnapshot).reverse(), [history]);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const handleExportCSV = useCallback(() => exportCSV(rows), [rows]);
    const handleExportXLS = useCallback(() => exportXLS(rows), [rows]);
    const handleExportPDF = useCallback(() => exportPDF(rows), [rows]);

    return (
        <div className="history-overlay" onClick={onClose}>
            <div className="history-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="history-header">
                    <div className="history-header__left">
                        <h2 className="history-title">Telemetry History</h2>
                        <span className="history-count">{history.length} snapshots</span>
                    </div>
                    <div className="history-header__right">
                        <button className="history-export-btn" onClick={handleExportCSV} disabled={rows.length === 0} title="Download CSV">
                            <FileText size={14} />
                            <span>CSV</span>
                        </button>
                        <button className="history-export-btn" onClick={handleExportXLS} disabled={rows.length === 0} title="Download XLS">
                            <FileSpreadsheet size={14} />
                            <span>XLS</span>
                        </button>
                        <button className="history-export-btn history-export-btn--pdf" onClick={handleExportPDF} disabled={rows.length === 0} title="Download PDF">
                            <Download size={14} />
                            <span>PDF</span>
                        </button>
                        <button className="history-clear-btn" onClick={onClear} disabled={rows.length === 0} title="Clear History">
                            <Trash2 size={14} />
                        </button>
                        <button className="history-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                {rows.length === 0 ? (
                    <div className="history-empty">
                        <p>No telemetry snapshots recorded yet.</p>
                        <p className="history-empty__sub">Snapshots are recorded automatically during monitoring.</p>
                    </div>
                ) : (
                    <>
                        <div className="history-table-wrap">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th className="history-th history-th--num">#</th>
                                        {headers.map(h => (
                                            <th key={h} className="history-th">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((row, i) => (
                                        <tr key={i} className="history-tr" data-status={row.riskStatus}>
                                            <td className="history-td history-td--num">{page * PAGE_SIZE + i + 1}</td>
                                            {headers.map(h => (
                                                <td key={h} className="history-td">{row[h]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="history-pagination">
                            <button
                                className="history-page-btn"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Prev
                            </button>
                            <span className="history-page-info">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                className="history-page-btn"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
