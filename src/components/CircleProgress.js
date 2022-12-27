import React from "react";

export const CircleProgress = ({
    sqSize = 25,
    strokeWidth = 2,
    progress = 1,
    target = 5,
    display = null,
    onClick = (e) => false,
    title,
}) => {
    const radius = (sqSize - strokeWidth) / 2;
    // Enclose circle in a circumscribing square
    // const viewBox = `0 0 ${sqSize} ${sqSize}`;
    // Arc length at 100% coverage is the circle circumference
    const dashArray = radius * Math.PI * 2;
    // Scale 100% coverage overlay with the actual percent
    const percentage = progress / target;
    const dashOffset = dashArray - dashArray * percentage;

    return (
        <svg
            width={sqSize}
            height={sqSize}
            viewBox={`0 0 ${sqSize} ${sqSize}`}
            onClick={onClick}
        >
            <circle
                className="circle-background"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
            />
            <circle
                className="circle-progress"
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
                // Start progress marker at 12 O'Clock
                transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                style={{
                    strokeDasharray: dashArray,
                    strokeDashoffset: dashOffset,
                }}
            />
            <text
                className="circle-text"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignment-baseline="central"
            >
                {`${display || progress}`}
            </text>
            <title>{title}</title>
        </svg>
    );
};
