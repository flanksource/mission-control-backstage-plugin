import React from 'react';
import { MissionControlAuthProvider } from './MissionControlAuthProvider/MissionControlAuthProvider';

export function withMCAuth<P extends object>(
  Component: React.ComponentType<P>,
): (props: P) => React.JSX.Element {
  return function WrappedWithMCAuth(props: P) {
    return (
      <MissionControlAuthProvider>
        <Component {...props} />
      </MissionControlAuthProvider>
    );
  };
}
