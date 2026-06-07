export default function FileUploadBox({ file, onFileChange, dragOver, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
        dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'
      }`}
    >
      <p className="text-slate-600">Kéo thả file CSV hoặc Excel (.xlsx) vào đây hoặc chọn file</p>
      <p className="mt-1 text-xs text-slate-400">
        Sheet <strong>StudentData</strong> — nhập giá trị chữ (Male/Female, Yes/No, Low/Medium/High, …)
      </p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="mx-auto mt-4 block text-sm"
      />
      {file && (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          Đã chọn: {file.name}
        </p>
      )}
    </div>
  );
}
