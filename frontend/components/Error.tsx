import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
  padding: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h1`
  color: #ef4444;
  margin-bottom: 10px;
  font-size: 2rem;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1rem;
  max-width: 500px;
`;

const RetryButton = styled.button`
  background: #0070f3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #0051cc;
  }
`;

interface ErrorProps {
  error?: Error;
  reset?: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <ErrorContainer>
      <ErrorIcon>⚠️</ErrorIcon>
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorMessage>
        {error?.message || 'An unexpected error occurred while loading the dashboard.'}
      </ErrorMessage>
      {reset && (
        <RetryButton onClick={reset}>
          Try again
        </RetryButton>
      )}
    </ErrorContainer>
  );
}
