import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ReputationManagerModule from "./ReputationManager";
import LibrariesModule from "./Libraries";

const RecruiterSubscriptionModule = buildModule("RecruiterSubscriptionModule", (m) => {
  const { reputationManager } = m.useModule(ReputationManagerModule);
  const { recruitmentFeeFormulas } = m.useModule(LibrariesModule);
  
  const recruiterSubscription = m.contract("RecruiterSubscription", [], {
    libraries: {
      RecruitmentFeeFormulas: recruitmentFeeFormulas,
    },
  });
  
  return { recruiterSubscription };
});

export default RecruiterSubscriptionModule;
