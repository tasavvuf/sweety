export default function ReadingCard({ reading, onEdit, onDelete, deleting }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-[#32322F] bg-[#242422] p-4">
      <div>
        <p className="font-medium text-[#E4E4E2]">{reading.slot}</p>
        <p className="text-sm text-[#8E8E8A]">{reading.value_mg_dl} mg/dL</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(reading)}
          className="cursor-pointer rounded-md border border-[#32322F] px-3 py-2 text-sm font-medium text-[#E4E4E2] hover:border-[#9A948C] hover:text-[#B8C764]"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(reading.id)}
          disabled={deleting}
          className="cursor-pointer rounded-md border border-[#9A948C] px-3 py-2 text-sm font-medium text-[#E4E4E2] hover:border-[#B8C764] hover:text-[#B8C764] disabled:cursor-not-allowed disabled:text-[#8E8E8A]"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </li>
  );
}
