interface StatusBadgeProps {
  status: "paid" | "pending" | "active" | "inactive" | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const lower = status.toLowerCase();

  if (lower === "paid") {
    return <span className="badge badge-paid">● Paid</span>;
  }
  if (lower === "pending") {
    return <span className="badge badge-pending">⊘ Pending</span>;
  }
  if (lower === "active") {
    return <span className="badge badge-active">Active</span>;
  }
  if (lower === "inactive") {
    return <span className="badge badge-inactive">Inactive</span>;
  }
  return <span className="badge">{status}</span>;
}
