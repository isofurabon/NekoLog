export interface ViewportInput {
    scrollElementHeight: number;
    scrollElementScrollHeight: number;
    scrollElementScrollTop: number;
    containerHeight: number;
    logsCount: number;
    visibleStartIndex: number;
    visibleEndIndex: number;
    lineHeightPx: number;
}

export interface ViewportOutput {
    minimapScrollTop: number;
    isClampedTop: boolean;
    isClampedBottom: boolean;
    hiddenRows: number;
    top: number;
    height: number;
}

export function calculateViewportBounds(input: ViewportInput): ViewportOutput {
    const {
        scrollElementHeight,
        scrollElementScrollHeight,
        scrollElementScrollTop,
        containerHeight,
        logsCount,
        visibleStartIndex,
        visibleEndIndex,
        lineHeightPx,
    } = input;

    if (logsCount === 0) {
        return {
            minimapScrollTop: 0,
            isClampedTop: false,
            isClampedBottom: false,
            hiddenRows: 0,
            top: 0,
            height: 0,
        };
    }

    const maxEditorScrollTop = Math.max(0, scrollElementScrollHeight - scrollElementHeight);
    const scrollRatio = maxEditorScrollTop > 0 ? scrollElementScrollTop / maxEditorScrollTop : 0;

    const minimapScrollHeight = logsCount * lineHeightPx;
    const maxMinimapScrollTop = Math.max(0, minimapScrollHeight - containerHeight);
    const nextMinimapScrollTop = scrollRatio * maxMinimapScrollTop;

    const rawTop = visibleStartIndex * lineHeightPx - nextMinimapScrollTop;
    const rawBottom = (visibleEndIndex + 1) * lineHeightPx - nextMinimapScrollTop;

    // Check for clamping
    const isClampedTop = rawTop < 0;
    const isClampedBottom = rawBottom > containerHeight;

    let top = Math.max(0, rawTop);
    const bottom = Math.min(containerHeight, rawBottom);

    const minHeight = (isClampedTop || isClampedBottom) ? 12 : 4;
    let height = bottom - top;

    // Ensure the indicator is thick enough to easily grab/hover when clamped
    if (height < minHeight) {
        height = Math.min(minHeight, containerHeight); // Don't overflow tiny containers
        if (isClampedBottom && !isClampedTop) {
            top = Math.max(0, bottom - height);
        }
    }

    let hiddenRows = 0;
    if (isClampedTop) {
        const minimapStartIdx = Math.floor(nextMinimapScrollTop / lineHeightPx);
        hiddenRows = visibleStartIndex - minimapStartIdx; // Negative value
    } else if (isClampedBottom) {
        const minimapEndIdx = Math.floor((nextMinimapScrollTop + containerHeight) / lineHeightPx);
        hiddenRows = visibleEndIndex - minimapEndIdx; // Positive value
    }

    return {
        minimapScrollTop: nextMinimapScrollTop,
        isClampedTop,
        isClampedBottom,
        hiddenRows: Math.abs(hiddenRows),
        top,
        height,
    };
}
