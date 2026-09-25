import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ModalProvider, useModal } from '../ModalContext.jsx';

describe('ModalContext & Confirmation System', () => {
  it('throws an error if useModal is called outside of ModalProvider', () => {
    function InvalidConsumer() {
      useModal();
      return null;
    }

    expect(() => {
      renderToString(<InvalidConsumer />);
    }).toThrow('useModal must be used within a ModalProvider');
  });

  it('renders children within ModalProvider without crashing', () => {
    function TestConsumer() {
      const { confirm, alert } = useModal();
      return (
        <div>
          <span>Provider Ready</span>
          <span>{typeof confirm === 'function' ? 'has-confirm' : ''}</span>
          <span>{typeof alert === 'function' ? 'has-alert' : ''}</span>
        </div>
      );
    }

    const html = renderToString(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    );

    expect(html).toContain('Provider Ready');
    expect(html).toContain('has-confirm');
    expect(html).toContain('has-alert');
  });
});
