"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Copy, Check, Wallet, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getComprehensiveRecruiterData,
  type RecruiterData,
  type PaymentRecord,
} from "@/lib/get/get-recruiter-subscription-data-utils";
import { depositToRecruiterBudget } from "@/lib/set/set-recruiter-subscription-data-utils";
import { NATIVE_TOKEN_SYMBOL } from "@/constants/system";
import { getErrorMessage } from "@/lib/error-utils";
import { getUserNameByAddress } from "@/lib/get/get-user-data-utils";
import { useRouter } from "next/navigation";

export function AccountSettings() {
  // Get wallet address from useAccount hook
  const { address } = useAccount();
  // State for recruiter data
  const [recruiterData, setRecruiterData] = useState<RecruiterData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  // State for deposit functionality
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("0.1"); // Default deposit amount
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  const router = useRouter();

  const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});

  // Function to copy address to clipboard with visual feedback
  const handleCopyAddress = async (addressToCopy: string) => {
    try {
      await navigator.clipboard.writeText(addressToCopy);
      setCopiedAddress(addressToCopy);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Function to truncate address for display
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  // Function to format timestamp to readable date
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  // Function to handle deposit
  const handleDeposit = async () => {
    if (!address || isDepositing) return;

    setIsDepositing(true);

    try {
      await depositToRecruiterBudget(depositAmount);

      toast.success(
        `Successfully deposited ${depositAmount} ${NATIVE_TOKEN_SYMBOL}!`
      );

      router.refresh();
      setDepositDialogOpen(false);

    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDepositing(false);
    }
  };

  // Fetch recruiter data when address changes
  useEffect(() => {
    if (address) {
      const fetchRecruiterData = async () => {
        setLoading(true);
        try {
          const data = await getComprehensiveRecruiterData(address);
          setRecruiterData(data);

          const uniqueApplicants = Array.from(
            new Set(data.paymentHistory?.map((p) => p.applicant) || [])
          );
          const entries = await Promise.all(
            uniqueApplicants.map(async (addr) => [
              addr,
              await getUserNameByAddress(addr as `0x${string}`),
            ])
          );
          const map: Record<string, string> = {};
          entries.forEach(([a, n]) => {
            if (n && n !== a) {
              map[a] = n as string;
            }
          });
          setApplicantNames(map);
        } catch (error) {
          console.error("Error fetching recruiter data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchRecruiterData();
    } else {
      setLoading(false);
    }
  }, [address]);
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
          <CardDescription>
            Manage your blockchain wallet and tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Connected Wallet
            </h3>
            <div className="flex items-center justify-between space-x-4">
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm truncate line-clamp-1">
                {address ? truncateAddress(address) : "Not connected"}
              </code>
              <Button
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={() => address && handleCopyAddress(address)}
                disabled={!address}
              >
                {copiedAddress === address ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedAddress === address ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Recruiter Budget</h3>
                <p className="text-sm text-muted-foreground">
                  {NATIVE_TOKEN_SYMBOL} available for hiring fees and premium
                  features
                </p>
              </div>
              {loading ? (
                <Badge variant="outline" className="px-3 py-1">
                  Loading...
                </Badge>
              ) : (
                <Badge
                  variant={
                    recruiterData?.budget &&
                    recruiterData?.minimumBudget &&
                    recruiterData.budget >= recruiterData.minimumBudget
                      ? "default"
                      : "destructive"
                  }
                  className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-400 dark:from-emerald-500 dark:to-green-500 text-white font-semibold shadow-lg hover:from-emerald-500 hover:to-green-500 dark:hover:from-emerald-600 dark:hover:to-green-600 border-0"
                >
                  {recruiterData?.budget !== null &&
                  recruiterData?.budget !== undefined
                    ? `${formatEther(
                        recruiterData.budget
                      )} ${NATIVE_TOKEN_SYMBOL}`
                    : "N/A"}
                </Badge>
              )}
            </div>
            {recruiterData?.budget !== null &&
              recruiterData?.budget !== undefined &&
              recruiterData?.minimumBudget !== null &&
              recruiterData?.minimumBudget !== undefined &&
              recruiterData.budget < recruiterData.minimumBudget && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Insufficient Budget</AlertTitle>
                  <AlertDescription>
                    Your budget is below the minimum required (
                    {formatEther(recruiterData.minimumBudget)}{" "}
                    {NATIVE_TOKEN_SYMBOL}) to maintain recruiter status.
                  </AlertDescription>
                </Alert>
              )}
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => setDepositDialogOpen(true)}
                disabled={!address}
              >
                <Wallet className="h-4 w-4" />
                Deposit Token
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium">Account Status</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Recruiter Status</p>
              {loading ? (
                <Badge variant="outline">Loading...</Badge>
              ) : (
                <Badge
                  variant={recruiterData?.isRecruiter ? "default" : "outline"}
                  className={
                    recruiterData?.isRecruiter
                      ? "bg-green-600 hover:bg-green-700 text-white border-0 dark:bg-green-500 dark:hover:bg-green-600"
                      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                  }
                >
                  {recruiterData?.isRecruiter ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            History of hiring fees and payments made
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading payment history...</div>
          ) : !recruiterData?.paymentHistory ||
            recruiterData.paymentHistory.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No payment history found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">
                      Amount ({NATIVE_TOKEN_SYMBOL})
                    </TableHead>
                    <TableHead className="font-semibold">Applicant</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiterData.paymentHistory.map(
                    (payment: PaymentRecord, index: number) => (
                      <TableRow key={payment.recordId || index}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(payment.timestamp)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatEther(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {applicantNames[payment.applicant] &&
                              applicantNames[payment.applicant] !== payment.applicant
                                ? applicantNames[payment.applicant]
                                : truncateAddress(payment.applicant)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                handleCopyAddress(payment.applicant)
                              }
                            >
                              {copiedAddress === payment.applicant ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Hiring Fee
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Payment Summary */}
          {recruiterData?.paymentHistory &&
            recruiterData.paymentHistory.length > 0 && (
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Total Payments:{" "}
                  {recruiterData.paymentCount?.toString() || "0"}
                </span>
                <span>
                  Total Spent:{" "}
                  {recruiterData?.totalPayments !== null &&
                  recruiterData?.totalPayments !== undefined
                    ? formatEther(recruiterData.totalPayments)
                    : "0"}{" "}
                  {NATIVE_TOKEN_SYMBOL}
                </span>
              </div>
            )}
        </CardContent>
      </Card>
      <AlertDialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deposit Tokens</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the amount of {NATIVE_TOKEN_SYMBOL} you want to deposit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deposit-amount-dialog">Amount ({NATIVE_TOKEN_SYMBOL})</Label>
            <Input
              id="deposit-amount-dialog"
              type="number"
              min="0"
              step="0.001"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isDepositing}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDepositing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeposit}
              disabled={
                isDepositing ||
                !address ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0
              }
            >
              {isDepositing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {isDepositing ? "Depositing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AccountSettings;
