import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WavingText } from './WavingText.tsx';

describe('WavingText', () => {
    it('renders the text correctly', () => {
        const text = "Ready to Inspect";
        const { container } = render(<WavingText text={text} />);

        // Since the text is split into spans, we can check the textContent of the container
        expect(container.textContent).toBe(text);
    });

    it('renders empty text without crashing', () => {
        const { container } = render(<WavingText text="" />);
        expect(container.textContent).toBe("");
    });
});
