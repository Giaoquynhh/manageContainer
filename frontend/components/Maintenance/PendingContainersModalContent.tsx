import LoadingDisplay from './LoadingDisplay';
import ErrorDisplay from './ErrorDisplay';
import PendingContainersTable from './PendingContainersTable';

interface PendingContainersModalContentProps {
  loading: boolean;
  error: string;
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onRetry: () => void;
  onClose: () => void;
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}

export default function PendingContainersModalContent({
  loading,
  error,
  requests,
  checkResults,
  onRetry,
  onClose,
  onCheckContainer,
  onCheckResult,
  onFailOption
}: PendingContainersModalContentProps) {
  if (loading) {
    return <LoadingDisplay />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry} 
        onClose={onClose} 
      />
    );
  }

  return (
    <>
      <PendingContainersTable
        requests={requests}
        checkResults={checkResults}
        onCheckContainer={onCheckContainer}
        onCheckResult={onCheckResult}
        onFailOption={onFailOption}
      />
    </>
  );
}
