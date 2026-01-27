import { openmrsFetch, restBaseUrl } from "@openmrs/esm-framework";
import { CauseOfDeathFetchResponse, CauseOfDeathPayload, ConceptAnswer, ConceptAnswersResponse } from "../../types";
import { useMemo } from "react";
import useSWR from "swr";

const changePatientDeathStatus = (personUuid: string, payload: CauseOfDeathPayload) => {
  const abortController = new AbortController();

  return openmrsFetch(`${restBaseUrl}/person/${personUuid}`, {
    headers: {
      'Content-type': 'application/json',
    },
    method: 'POST',
    body: payload,
    signal: abortController.signal,
  });
};

export function markPersonDeceased(
  deceasedDate: Date,
  personUuid: string,
  selectedCauseOfDeathValue: string | undefined,
  nonCodedCauseOfDeath?: string | undefined,
) {
  const payload: CauseOfDeathPayload = {
    dead: true,
    deathDate: deceasedDate || null,
    ...(nonCodedCauseOfDeath
      ? { causeOfDeathNonCoded: nonCodedCauseOfDeath }
      : {
          causeOfDeath: selectedCauseOfDeathValue,
        }),
  };

  return changePatientDeathStatus(personUuid, payload);
}

export function useCausesOfDeath() {
  const { isCauseOfDeathLoading, isCauseOfDeathValidating, value: causeOfDeathConcept } = useCauseOfDeathConcept();
  const { isConceptLoading, isConceptAnswerValidating, conceptAnswers } = useConceptAnswers(causeOfDeathConcept);

  return {
    causesOfDeath: conceptAnswers,
    isLoading: isCauseOfDeathLoading || isConceptLoading,
    isValidating: isConceptAnswerValidating || isCauseOfDeathValidating,
  };
}

export function useConceptAnswers(conceptUuid: string) {
  const { data, error, isLoading, isValidating } = useSWR<{ data: ConceptAnswersResponse }, Error>(
    `${restBaseUrl}/concept/${conceptUuid}`,
    (url) => (conceptUuid ? openmrsFetch(url) : undefined),
    {
      shouldRetryOnError(err) {
        return err instanceof Response && err.status !== 404;
      },
    },
  );

  return {
    conceptAnswers: data?.data?.answers ?? ([] as ConceptAnswer[]),
    isConceptLoading: isLoading,
    conceptError: error,
    isConceptAnswerValidating: isValidating,
  };
}

export function useCauseOfDeathConcept() {
  const { data, error, isLoading, isValidating } = useSWR<{ data: CauseOfDeathFetchResponse }, Error>(
    `${restBaseUrl}/systemsetting/concept.causeOfDeath`,
    openmrsFetch,
    {
      shouldRetryOnError(err) {
        return err instanceof Response && err.status !== 404;
      },
    },
  );
  const result = useMemo(() => {
    return {
      value: data?.data?.value ?? undefined,
      isCauseOfDeathLoading: isLoading,
      isCauseOfDeathValidating: isValidating,
      error,
    };
  }, [data?.data?.value, error, isLoading, isValidating]);
  return result;
}