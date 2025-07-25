"use client";

// Import hooks
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

// Import UI components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Toaster, toast } from "sonner";
import ChallengeDetailsSkeleton from "@/features/participation/challenge-details-skeleton";
import RichTextEditor from "@/components/rich-text-editor";

// Import lucide-react icons
import {
  CalendarArrowUp,
  Clock,
  Star,
  Tag,
  UserRoundPen,
  Users,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

// Import utils
import { ChallengeInterface } from "@/lib/interfaces";
import {
  getChallengeById,
  fetchUserHasJoinedChallengeState,
} from "@/lib/fetching-onchain-data-utils";
import {
  DomainLabels,
  Domain,
  ChallengeDifficultyLevel,
  ChallengeDifficultyLevelLabels,
  ChallengeStatus,
} from "@/constants/system";
import { difficultyStyles } from "@/constants/styles";
import { epochToDateString } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { pageUrlMapping } from "@/constants/navigation";
import { userJoinChallenge } from "@/lib/write-onchain-utils";
import { NATIVE_TOKEN_SYMBOL } from "@/constants/system";
import { getChallengeCost } from "@/lib/get/get-challenge-cost-utils";
import { getErrorMessage } from "@/lib/error-utils";
import { getUserNameByAddress } from "@/lib/get/get-user-data-utils";

interface ExploreChallengeDetailsProps {
  challenge_id: `0x${string}`;
}

export default function ExploreChallengeDetails({
  challenge_id,
}: ExploreChallengeDetailsProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeInterface | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [contributorName, setContributorName] = useState<string | undefined>();

  const [challengeCost, setChallengeCost] = useState<number>(0);
  const [costLoading, setCostLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleJoinChallenge() {
    if (!address || !challenge) {
      return;
    }

    if (address == challenge.contributor) {
      toast.warning("You cannot join your own contribution");
      return;
    }

    if (challengeCost <= 0) {
      toast.error("Invalid challenge cost. Please try again.");
      return;
    }

    try {
      setJoining(true);
      const success = await userJoinChallenge(
        challenge_id,
        address,
        challengeCost
      );

      if (success) {
        const joinedState = address
          ? await fetchUserHasJoinedChallengeState(address, challenge_id)
          : false;
        setHasJoined(joinedState);
        toast.success("You have joined this challenge");
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setJoining(false);
      setIsDialogOpen(false);
    }
  }

  const handleGoToWorkspace = (id: string) => {
    router.push(pageUrlMapping.participation_workspace + `/${id}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [fetchedChallenge, fetchHasJoinedState] = await Promise.all([
          getChallengeById(challenge_id),
          address
            ? fetchUserHasJoinedChallengeState(address, challenge_id)
            : Promise.resolve(false),
        ]);

        setChallenge(fetchedChallenge);
        setHasJoined(fetchHasJoinedState);
        if (fetchedChallenge) {
          const name = await getUserNameByAddress(
            fetchedChallenge.contributor as `0x${string}`
          );
          if (name && name !== fetchedChallenge.contributor) {
            setContributorName(name);
          } else {
            setContributorName(undefined);
          }
        }
      } catch (error: any) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch challenge cost only when dialog is opened
  useEffect(() => {
    const fetchCost = async () => {
      if (!isDialogOpen) {
        return;
      }

      try {
        setCostLoading(true);
        const fetchedCost = await getChallengeCost(challenge_id);
        setChallengeCost(fetchedCost);
      } catch (error: any) {
        console.error("Error fetching challenge cost:", error);
      } finally {
        setCostLoading(false);
      }
    };

    fetchCost();
  }, [isDialogOpen, challenge_id]);

  return isLoading ? (
    <ChallengeDetailsSkeleton />
  ) : challenge && challenge.status === ChallengeStatus.APPROVED ? (
    <div>
      <Toaster position="top-right" richColors />

      <AlertDialog open={isDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">
              Confirm joining challenge
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to pay a fee to join this challenge.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">
                Required Payment Amount ({NATIVE_TOKEN_SYMBOL})
              </Label>
              <div className="p-3 border-2 border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                {costLoading ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Loading cost...
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {challengeCost.toFixed(6)} {NATIVE_TOKEN_SYMBOL}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                This payment will be sent to the challenge contributor.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDialogOpen(false);
              }}
              disabled={joining}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleJoinChallenge}
              disabled={
                joining
                // || challengeCost <= 0 || costLoading
              }
            >
              {joining ? (
                <div className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Confirm Payment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="space-y-8">
        {/* Header Section as Card */}
        <div className="rounded-xl bg-white dark:bg-slate-900/60 shadow p-6 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold break-all text-slate-900 dark:text-slate-100">{challenge.title}</h1>
          </div>
          {hasJoined ? (
            <div>
              <Button
                size="lg"
                variant="joined"
                disabled
              >
                <CheckCircle2 className="h-4 w-4" />
                Joined
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => setIsDialogOpen(true)}
            >
              Join Challenge
            </Button>
          )}
        </div>

        {/* About challenge section */}
        <div className="rounded-xl bg-white dark:bg-slate-900/60 shadow p-6 border border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">About challenge</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
            <div className="col-span-2 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Contributor</span>
              <div className="flex items-center gap-1.5">
                <UserRoundPen className="h-full max-h-4 w-full max-w-4" />
                <span className="ml-1 text-slate-700 dark:text-slate-300 break-all">{contributorName ?? challenge.contributor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Domain</span>
              <div className="flex items-center gap-1.5">
                <Tag className="h-full max-h-4 w-full max-w-4" />
                <span className="ml-1">{DomainLabels[challenge.category as Domain]}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Quality Score</span>
              <div className="flex items-center gap-1.5">
                <Star className="h-full max-h-4 w-full max-w-4 text-amber-500 fill-current" />
                <span>{challenge.qualityScore} / 100</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Participants</span>
              <div className="flex items-center gap-1.5">
                <Users className="h-full max-h-4 w-full max-w-4" />
                <span>{challenge.participants} people</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Contributed date</span>
              <div className="flex items-center gap-1.5">
                <CalendarArrowUp className="h-full max-h-4 w-full max-w-4" />
                <span>{epochToDateString(challenge.contributeAt || 0)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Difficulty Level</span>
              <div className="flex items-center gap-1.5">
                <Badge className={cn("capitalize px-2 py-1 rounded-lg", difficultyStyles[challenge.difficultyLevel as keyof typeof difficultyStyles])}>
                  {ChallengeDifficultyLevelLabels[challenge.difficultyLevel as ChallengeDifficultyLevel]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Estimated solve time</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-full max-h-4 w-full max-w-4" />
                <span>{challenge.solveTime} minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="rounded-xl bg-white dark:bg-slate-900/60 shadow p-6 border border-slate-200 dark:border-slate-700 space-y-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Challenge Description</h1>
          <RichTextEditor value={challenge.description!} editable={false} />
        </div>

        {/* Action Section */}
        <div className="rounded-xl bg-white dark:bg-slate-900/60 shadow p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {hasJoined ? (
              <>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">You've joined this challenge!</h3>
                  <p className="text-sm text-muted-foreground">
                    Start working on your solution now.
                  </p>
                </div>

                <Button
                  size="lg"
                  variant="joined"
                  className="cursor-pointer"
                  onClick={() => handleGoToWorkspace(challenge_id.toString())}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Go to Workspace
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Ready to take on this challenge?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join now and start working on your solution.
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Join Challenge
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center object-center py-12">
      <h2 className="text-xl font-semibold mb-2">Challenge not found</h2>
      <p className="text-muted-foreground mb-6">
        The challenge you're looking for doesn't exist or has been removed.
      </p>
      <Button onClick={() => router.push(pageUrlMapping.participation_explore)}>
        Return to Explore
      </Button>
    </div>
  );
}
