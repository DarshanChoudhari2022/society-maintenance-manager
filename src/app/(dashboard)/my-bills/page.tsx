"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { Receipt, Download, CreditCard, AlertTriangle, IndianRupee, Wallet } from "lucide-react";
import toast from "react-hot-toast";

interface MyBill {
  id: string;
  amount: number;
  lateFee: number;
  period: string;
  dueDate: string;
  status: string;
  paidAt: string | null;
  paidVia: string | null;
  paidAmount: number | null;
  receiptNumber: string | null;
  flat: {
    flatNumber: string;
    ownerName: string;
  };
  society: {
    upiId: string;
    bankDetails: string;
  };
}

export default function MyBillsPage() {
  const [bills, setBills] = useState<MyBill[]>([]);
  const [stats, setStats] = useState({ totalPending: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MyBill | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-bills");
      const data = await res.json();
      if (data.bills) {
        setBills(data.bills);
        setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load your bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePayClick = (bill: MyBill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedBill) return;
    setPayingBillId(selectedBill.id);
    setShowPaymentModal(false);

    // Mock Razorpay Payment flow
    toast.loading("Redirecting to secure gateway...", { id: "payment" });
    
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/my-bills/${selectedBill.id}/pay`, {
          method: "POST",
        });
        const data = await res.json();

        if (res.ok) {
          toast.success("Payment successful! Receipt generated.", { id: "payment" });
          fetchBills();
        } else {
          toast.error(data.error || "Payment failed", { id: "payment" });
        }
      } catch {
        toast.error("Network error during payment", { id: "payment" });
      } finally {
        setPayingBillId(null);
      }
    }, 2000);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <div>
            <h1 className="page-title">My Bills & Payments</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              View your maintenance history and pay online
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-orange-100 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-900/50">
          <h3 className="text-sm font-medium text-danger">Total Dues Pending</h3>
          <p className="text-3xl font-bold text-danger mt-1">{formatCurrency(stats.totalPending)}</p>
          {stats.totalPending > 0 && <p className="text-xs text-danger mt-2">Please clear your dues to avoid late fees.</p>}
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-emerald-900/50">
          <h3 className="text-sm font-medium text-success">Total Amount Paid</h3>
          <p className="text-3xl font-bold text-success mt-1">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-xs text-success mt-2">Thank you for timely payments.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
          <h3 className="font-semibold text-sm">Billing History</h3>
        </div>
        
        {bills.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <Receipt className="w-12 h-12 mx-auto text-border mb-3" />
            <p>No bills generated for your flat yet.</p>
          </div>
        ) : (
          <div className="table-wrapper !border-0 !rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Late Fee</th>
                  <th>Total Due</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const total = bill.amount + bill.lateFee;
                  const isOverdue = new Date(bill.dueDate) < new Date() && bill.status === "pending";
                  
                  return (
                    <tr key={bill.id}>
                      <td className="font-medium">{bill.period}</td>
                      <td>{formatCurrency(bill.amount)}</td>
                      <td>
                        {bill.lateFee > 0 ? (
                          <span className="text-danger flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {formatCurrency(bill.lateFee)}
                          </span>
                        ) : (
                          "₹0"
                        )}
                      </td>
                      <td className="font-semibold">{formatCurrency(total)}</td>
                      <td>
                        <span className={isOverdue ? "text-danger" : ""}>
                          {new Date(bill.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="text-right">
                        {bill.status === "pending" || bill.status === "partial" ? (
                          <button 
                            className="btn bg-[#3399cc] hover:bg-[#2b82ad] text-white btn-sm shadow-sm transition-all hover:-translate-y-0.5"
                            onClick={() => handlePayClick(bill)}
                            disabled={payingBillId === bill.id}
                          >
                            {payingBillId === bill.id ? (
                              <div className="spinner !w-3 !h-3 !border-white/50 !border-t-white mr-1" />
                            ) : (
                              <IndianRupee className="w-3.5 h-3.5 mr-1" />
                            )}
                            Pay Online
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-sm group">
                            <Download className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary transition-colors" />
                            <span className="hidden sm:inline ml-1">Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mock Razorpay Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C2127] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Razorpay Header lookalike */}
            <div className="bg-[#3399cc] p-4 text-white flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold">S</span>
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{selectedBill.flat.ownerName}</h3>
                  <p className="text-xs text-white/80">Flat {selectedBill.flat.flatNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-text-secondary uppercase tracking-wider font-semibold mb-1">Total Payable</p>
                <div className="text-3xl font-bold flex items-center justify-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {selectedBill.amount + selectedBill.lateFee}
                </div>
                <p className="text-xs text-text-secondary mt-1">For Maintenance Period {selectedBill.period}</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={processPayment}
                  className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:border-[#3399cc] hover:bg-[#3399cc]/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-6 object-contain grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100" />
                    <span className="font-medium text-sm">UPI Payments</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-[#3399cc]" />
                </button>

                <button 
                  onClick={processPayment}
                  className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:border-[#3399cc] hover:bg-[#3399cc]/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-text-secondary group-hover:text-[#3399cc]" />
                    <span className="font-medium text-sm">Card, Netbanking & Wallets</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-[#3399cc]" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-text-tertiary">
                Securely powered by <span className="font-bold tracking-tight">razorpay</span> Mock
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ArrowRight mock component
function ArrowRight(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      {...props}
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}
