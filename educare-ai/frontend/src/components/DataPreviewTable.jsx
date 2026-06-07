import { PREVIEW_COLUMNS } from '../utils/featureDisplay';

export default function DataPreviewTable({ rows, title = 'Preview dữ liệu (10 dòng đầu)' }) {
  if (!rows?.length) return null;

  const columns = PREVIEW_COLUMNS.filter((col) =>
    rows.some((row) => row[col] !== undefined && row[col] !== '')
  );

  const displayColumns = columns.length ? columns : Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <h3 className="border-b px-4 py-3 font-semibold">{title}</h3>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            {displayColumns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-slate-50/50">
              {displayColumns.map((col) => (
                <td key={col} className="whitespace-nowrap px-3 py-2">
                  {row[col] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
