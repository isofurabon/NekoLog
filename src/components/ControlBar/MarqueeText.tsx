import { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface MarqueeTextProps {
    text: string;
    isHovered: boolean;
    className?: string;
}

const GAP_PX = 32; // pr-8 = 2rem = 32px

export const MarqueeText = ({ text, isHovered, className }: MarqueeTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldMarquee, setShouldMarquee] = useState(false);
    const [textWidth, setTextWidth] = useState(0);

    useEffect(() => {
        if (textRef.current && containerRef.current) {
            const textW = textRef.current.scrollWidth;
            const containerW = containerRef.current.clientWidth;
            setTextWidth(textW);
            setShouldMarquee(textW > containerW);
        }
    }, [text]);

    // Calculate animation duration based on text length
    const animationDuration = Math.max(2, textWidth / 30);
    // Distance to scroll = one text copy + gap
    const scrollDistance = textWidth + GAP_PX;

    return (
        <div
            ref={containerRef}
            className={clsx("overflow-hidden", className)}
        >
            {shouldMarquee && isHovered ? (
                <div
                    className="flex animate-marquee-infinite"
                    style={{
                        animationDuration: `${animationDuration}s`,
                        ['--scroll-distance' as string]: `-${scrollDistance}px`
                    }}
                >
                    <span className="whitespace-nowrap" style={{ paddingRight: `${GAP_PX}px` }}>{text}</span>
                    <span className="whitespace-nowrap" style={{ paddingRight: `${GAP_PX}px` }}>{text}</span>
                </div>
            ) : (
                <span
                    ref={textRef}
                    className="inline-block whitespace-nowrap"
                >
                    {text}
                </span>
            )}
        </div>
    );
};
