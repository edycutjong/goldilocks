export interface DemandSignal {
  fillRate: number;
  signal: string;
  recommendedAdjustment: number;
}

/**
 * Calculates a demand signal (fill-rate) for a specific agent.
 * @param agentId The target agent ID to analyze.
 * @returns A DemandSignal object containing fill rate and a price adjustment factor.
 */
export async function calculateDemand(agentId: string): Promise<DemandSignal> {
  // In a real implementation, we would query the CROO network:
  // const orders = await croo.listOrders({ agentId });
  // const negotiations = await croo.listNegotiations({ agentId });
  
  // For the hackathon deterministic demo (agent_demo_overpriced):
  // We simulate an agent that has high interest (many negotiations) but low conversion (few orders)
  // because its price ($5.00) is way too high.
  
  await new Promise((resolve) => setTimeout(resolve, 200));

  let fillRate = 0.50; // Default average fill
  let signal = "average demand";
  let recommendedAdjustment = 1.0; // multiplier

  if (agentId === "agent_demo_overpriced") {
    // Deterministic demo scenario
    fillRate = 0.18; // 18% fill rate (e.g. 18 orders out of 100 negotiations)
    signal = "priced too high — low fill";
    // If fill rate is very low, we lean towards the lower end of the comparable band.
    // Or we simply return an adjustment modifier that the rationale engine can use.
    recommendedAdjustment = 0.8; // Recommend pricing 20% lower than the median band
  } else if (agentId === "agent_demo_underpriced") {
    fillRate = 0.95; // 95% fill rate
    signal = "priced too low — leaving money on the table";
    recommendedAdjustment = 1.2;
  }

  return {
    fillRate: Number(fillRate.toFixed(2)),
    signal,
    recommendedAdjustment
  };
}
