import { Scorer, Score, DatasetSample, RunOutput } from "@empiricalrun/types";
import { ScorerError, ScorerErrorEnum } from "./error";
import getScoringFn from "./provider";

export default async function score({
  sample,
  output,
  scorers,
  options,
}: {
  sample: DatasetSample;
  output: RunOutput;
  scorers: Scorer[] | undefined;
  options?: object;
}): Promise<Score[]> {
  if (!scorers) {
    return [];
  }

  try {
    const scores = await Promise.all(
      scorers
        .filter((s) => !!s)
        .map((scorer) => {
          const scoringFn = getScoringFn(scorer);
          if (!scoringFn) {
            throw new ScorerError(
              ScorerErrorEnum.INCORRECT_PARAMETERS,
              `Incorrect scorer name "${scorer}" provided.`,
            );
          }
          return scoringFn({
            config: scorer,
            sample,
            output,
            options,
          });
        }),
    );
    return scores
      .flatMap((s) => s)
      .filter((item) => item !== undefined) as Score[];
  } catch (err) {
    console.error((err as Error).message);
    return [];
  }
}
