import React from 'react';

interface PositionSuggestion {
  slot: {
    id: string;
    code: string;
    block?: {
      code: string;
    };
    near_gate?: number;
  };
  score: number;
}

interface PositionSuggestionCardProps {
  containerInfo: any;
  suggestedPositions: PositionSuggestion[];
  selectedPositionId: string;
  loading: boolean;
  onSuggest: () => void;
  onPositionSelect: (position: PositionSuggestion) => void;
}

export const PositionSuggestionCard: React.FC<PositionSuggestionCardProps> = ({
  containerInfo,
  suggestedPositions,
  selectedPositionId,
  loading,
  onSuggest,
  onPositionSelect
}) => {
  if (!containerInfo) return null;

  return (
    <div className="suggestion-section">
      <button
        type="button"
        className="btn btn-primary suggest-btn"
        onClick={onSuggest}
        disabled={loading}
      >
        {loading ? 'Đang tìm...' : '🔍 Gợi ý vị trí'}
      </button>
      
      {suggestedPositions.length > 0 && (
        <div className="suggestions-list">
          <h4>Vị trí gợi ý:</h4>
          <div className="suggestions-grid">
            {suggestedPositions.map((position) => (
              <div
                key={position.slot.id}
                className={`suggestion-card ${position.slot.id === selectedPositionId ? 'selected' : ''}`}
                onClick={() => onPositionSelect(position)}
              >
                <div className="suggestion-header">
                  <span className="slot-code">{position.slot.code}</span>
                  <span className={`score-badge text-green-600`}>
                    {position.score.toFixed(1)}đ
                  </span>
                </div>
                <div className="suggestion-details">
                  <div className="detail-row">
                    <span className="label">Block:</span>
                    <span className="value">{position.slot.block?.code}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Gần cổng:</span>
                    <span className="value">{position.slot.near_gate || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
