function normalizeErrors(errors) {
  if (!errors?.length) return [];

  return errors.map((item, index) => {
    if (typeof item === 'string') {
      return { row: '-', field: '-', message: item, key: `str-${index}` };
    }
    return {
      row: item.row ?? '-',
      field: item.field ?? '-',
      message: item.message ?? 'Lỗi không xác định',
      key: `${item.row}-${item.field}-${index}`,
    };
  });
}

export default function ValidationErrorTable({ errors, title = 'Lỗi validate dữ liệu' }) {
  const rows = normalizeErrors(errors);
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-red-200 bg-red-50/50 shadow-sm">
      <h3 className="border-b border-red-200 px-4 py-3 font-semibold text-red-800">{title}</h3>
      <table className="min-w-full text-sm">
        <thead className="bg-red-100/50 text-left text-red-900">
          <tr>
            <th className="px-4 py-2 font-medium">Dòng</th>
            <th className="px-4 py-2 font-medium">Cột</th>
            <th className="px-4 py-2 font-medium">Mô tả lỗi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((err) => (
            <tr key={err.key} className="border-t border-red-100">
              <td className="px-4 py-2 font-mono text-red-800">{err.row}</td>
              <td className="px-4 py-2 font-medium text-red-800">{err.field}</td>
              <td className="px-4 py-2 text-red-700">{err.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-red-200 px-4 py-2 text-xs text-red-600">
        Sửa file Excel/CSV theo bảng trên rồi upload lại.
      </p>
    </div>
  );
}
