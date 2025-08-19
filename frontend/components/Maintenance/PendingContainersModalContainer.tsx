import PendingContainersModalHeader from './PendingContainersModalHeader';
import PendingContainersModalContent from './PendingContainersModalContent';
import PendingContainersModalFooter from './PendingContainersModalFooter';

interface PendingContainersModalContainerProps {
  loading: boolean;
  error: string;
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onClose: () => void;
  onRetry: () => void;
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}

export default function PendingContainersModalContainer({
  loading,
  error,
  requests,
  checkResults,
  onClose,
  onRetry,
  onCheckContainer,
  onCheckResult,
  onFailOption
}: PendingContainersModalContainerProps) {
  return (
    <div className="modal-content" style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <PendingContainersModalHeader onClose={onClose} />
      
      <PendingContainersModalContent
        loading={loading}
        error={error}
        requests={requests}
        checkResults={checkResults}
        onRetry={onRetry}
        onClose={onClose}
        onCheckContainer={onCheckContainer}
        onCheckResult={onCheckResult}
        onFailOption={onFailOption}
      />
      
      {!loading && !error && (
        <PendingContainersModalFooter onClose={onClose} />
      )}
    </div>
  );
}
